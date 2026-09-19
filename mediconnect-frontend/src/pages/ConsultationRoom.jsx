import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../lib/toast";
import Loader from "../components/Loader";
import { getConsultationAccess, formatDate, formatTime } from "../lib/helpers";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export default function ConsultationRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  const [callStatus, setCallStatus] = useState("connecting");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerName, setPeerName] = useState("");
  const [activeTab, setActiveTab] = useState("chat");

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const chatBottomRef = useRef(null);
  const callEndedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function loadAppointment() {
      try {
        const res = await api.getAppointmentById(id);
        if (mounted) {
          setAppointment(res.data);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load appointment details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAppointment();

    return () => {
      mounted = false;
    };
  }, [id, toast]);

  const access = appointment
    ? getConsultationAccess(appointment.slotDate, appointment.slotTime, appointment.status, user?.role)
    : { allowed: false };

  useEffect(() => {
    if (!appointment || !user || !access.allowed) return;

    callEndedRef.current = false;
    const roomId = appointment.roomId || `room_${appointment._id}`;
    let socket = null;
    let localStream = null;

    const flushQueuedCandidates = async (pc) => {
      if (iceCandidatesQueueRef.current.length > 0 && pc && pc.remoteDescription) {
        while (iceCandidatesQueueRef.current.length > 0) {
          const candidate = iceCandidatesQueueRef.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("Failed to apply buffered ICE candidate:", e);
          }
        }
      }
    };

    const createPeerConnection = () => {
      if (peerConnectionRef.current) return peerConnectionRef.current;

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus("connected");
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("send-ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") {
          setCallStatus("connected");
        } else if (state === "disconnected" || state === "failed") {
          setCallStatus("waiting");
        }
      };

      return pc;
    };

    let isCancelled = false;

    const stopCallMedia = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      iceCandidatesQueueRef.current = [];
    };

    async function startCall() {
      try {

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStream = stream;
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const socketTarget =
          import.meta.env.VITE_API_BASE_URL ||
          (import.meta.env.PROD ? "https://mediconnect-32xp.onrender.com" : window.location.origin);
        socket = io(socketTarget, {
          withCredentials: true,

          auth: {},
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-room", { roomId });
        });
        socket.on("connect_error", () => {
          setCallStatus("error");
          toast.error("Your session could not be authenticated. Please log in again.");
        });

        socket.on("room-joined", ({ participantCount }) => {
          if (participantCount > 1) {
            setCallStatus("connecting");
          } else {
            setCallStatus("waiting");
          }
        });

        socket.on("user-joined", async ({ user: peerUser }) => {
          if (callEndedRef.current || isCancelled) return;
          setPeerName(peerUser?.username || "Peer");
          toast.info(`${peerUser?.username || "Peer"} joined the consultation.`);
          const pc = createPeerConnection();

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("send-offer", { roomId, offer });
          } catch (err) {
            console.error("Error creating offer:", err);
          }
        });

        socket.on("receive-offer", async ({ offer, sender }) => {
          if (callEndedRef.current || isCancelled) return;
          setPeerName(sender?.username || "Peer");
          const pc = createPeerConnection();

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await flushQueuedCandidates(pc);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("send-answer", { roomId, answer });
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        });

        socket.on("receive-answer", async ({ answer }) => {
          if (callEndedRef.current || isCancelled) return;
          const pc = peerConnectionRef.current;
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              await flushQueuedCandidates(pc);
              setCallStatus("connected");
            } catch (err) {
              console.error("Error setting remote answer:", err);
            }
          }
        });

        socket.on("receive-ice-candidate", async ({ candidate }) => {
          if (callEndedRef.current || isCancelled) return;
          const pc = peerConnectionRef.current;
          if (!pc || !pc.remoteDescription) {

            iceCandidatesQueueRef.current.push(candidate);
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("Error adding candidate:", e);
            }
          }
        });

        socket.on("receive-message", (msg) => {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => {
            chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 50);
        });

        socket.on("call-ended", ({ by, message }) => {
          if (callEndedRef.current) return;
          callEndedRef.current = true;
          toast.info(message || "The consultation has ended.");
          setCallStatus("ended");
          stopCallMedia();
          socket.disconnect();
          socketRef.current = null;
        });

        socket.on("user-left", ({ message, user: peerUser }) => {
          if (callEndedRef.current) return;
          toast.warning(message || "Peer has left the consultation.");
          setCallStatus("waiting");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
        });

        socket.on("room-error", ({ message }) => {
          toast.error(message || "Consultation room error.");
        });
      } catch (err) {
        if (!isCancelled) {
          console.error("Media initialization error:", err);
          toast.error("Could not access camera or microphone.");
        }
      }
    }

    startCall();

    const cleanup = () => {
      isCancelled = true;
      callEndedRef.current = true;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    window.addEventListener("beforeunload", cleanup);
    window.addEventListener("pagehide", cleanup);

    return () => {
      window.removeEventListener("beforeunload", cleanup);
      window.removeEventListener("pagehide", cleanup);
      cleanup();
    };
  }, [appointment, user, toast]);

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioMuted;
        setIsAudioMuted(!isAudioMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current || !appointment) return;

    const roomId = appointment.roomId || `room_${appointment._id}`;
    socketRef.current.emit("send-message", {
      roomId,
      text: chatInput.trim(),
    });
    setChatInput("");
  };

  const handleEndCall = () => {
    if (window.confirm("End this consultation session?")) {
      callEndedRef.current = true;
      const roomId = appointment.roomId || `room_${appointment._id}`;

      if (socketRef.current) {
        socketRef.current.emit("end-call", { roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setCallStatus("ended");
    }
  };

  if (loading) {
    return (
      <div className="container page">
        <Loader label="Connecting to secure consultation room" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container page">
        <div className="alert alert-error">Appointment record not found.</div>
      </div>
    );
  }

  const doctor = appointment.doctorId || {};
  const patient = appointment.patientId || {};
  const counterpartName =
    user?.role === "doctor"
      ? patient.userId?.username || "Patient"
      : `Dr. ${doctor.userId?.username || "Doctor"}`;

  if (callStatus === "ended") {
    return (
      <div className="container page" style={{ maxWidth: 580, margin: "40px auto" }}>
        <div className="card card-pad card-elevated" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📞</div>
          <span className="eyebrow" style={{ justifyContent: "center" }}>Consultation Concluded</span>
          <h2 style={{ fontSize: 24, margin: "14px 0 10px" }}>The Call Has Ended</h2>
          <p className="muted" style={{ maxWidth: 440, margin: "0 auto 24px", lineHeight: 1.6 }}>
            The video consultation session with {counterpartName} has ended. Your camera and microphone have been safely turned off.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link to={`/appointments/${id}`} className="btn btn-primary">
              ← Return to Appointment Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!access.allowed) {
    return (
      <div className="container page" style={{ maxWidth: 600, margin: "40px auto" }}>
        <div className="card card-pad" style={{ textAlign: "center", padding: "48px 28px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {access.isEarly ? "⏳" : access.isExpired ? "⌛" : "🔒"}
          </div>
          <span className="eyebrow" style={{ justifyContent: "center" }}>Consultation Gate</span>
          <h2 style={{ fontSize: 24, margin: "14px 0 10px" }}>
            {access.isEarly
              ? "Consultation Has Not Started Yet"
              : access.isExpired
              ? "Consultation Session Ended"
              : "Room Access Restricted"}
          </h2>
          <p className="muted" style={{ maxWidth: 440, margin: "0 auto 24px", lineHeight: 1.6 }}>
            {access.reason}
          </p>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius)", padding: "16px", marginBottom: 24, border: "1px solid var(--line)" }}>
            <div className="ledger-row">
              <span className="ledger-label">Scheduled Date &amp; Time</span>
              <span className="ledger-value">
                {formatDate(appointment.slotDate)} · {formatTime(appointment.slotTime)}
              </span>
            </div>
            <div className="ledger-row">
              <span className="ledger-label">Doctor</span>
              <span className="ledger-value">Dr. {doctor.userId?.username || "—"}</span>
            </div>
            <div className="ledger-row" style={{ borderBottom: "none" }}>
              <span className="ledger-label">Status</span>
              <span className="ledger-value">{appointment.status?.toUpperCase()}</span>
            </div>
          </div>
          <Link to={`/appointments/${id}`} className="btn btn-primary">
            ← Return to Appointment Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page consultation-page">

      <div className="consultation-header">
        <div>
          <span className="eyebrow">Encrypted Video Consultation</span>
          <h1 style={{ fontSize: 24, margin: "4px 0 0" }}>
            Session with {counterpartName}
          </h1>
        </div>

        <div className="consultation-header-actions">
          <div className={`status-pill status-${callStatus}`}>
            <span className="status-indicator"></span>
            {callStatus === "connected" && "🟢 Encrypted P2P Active"}
            {callStatus === "waiting" && "🟡 Waiting for Peer"}
            {callStatus === "connecting" && "🟠 Establishing Connection..."}
          </div>
          <Link to={`/appointments/${id}`} className="btn btn-outline btn-sm">
            ← Appointment Details
          </Link>
        </div>
      </div>

      <div className="consultation-grid">

        <div className="video-stage-card">
          <div className="video-viewport">

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`remote-video ${callStatus === "connected" ? "visible" : "hidden"}`}
            />

            {callStatus !== "connected" && (
              <div className="video-empty-state">
                <div className="pulse-icon">🎥</div>
                <h3>{callStatus === "waiting" ? `Waiting for ${counterpartName} to join...` : "Connecting..."}</h3>
                <p className="faint">
                  Once both parties enter, the peer-to-peer video stream connects automatically.
                </p>
              </div>
            )}

            {callStatus === "connected" && (
              <div className="video-peer-tag">
                {peerName || counterpartName}
              </div>
            )}

            <div className="local-pip-container">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="local-video"
              />
              <div className="local-pip-label">You ({user?.username})</div>
            </div>
          </div>

          <div className="consultation-controls">
            <button
              className={`control-btn ${isAudioMuted ? "btn-danger-active" : ""}`}
              onClick={toggleAudio}
              title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              <span>{isAudioMuted ? "🔇" : "🎙️"}</span>
              <span className="control-label">{isAudioMuted ? "Unmute" : "Mute"}</span>
            </button>

            <button
              className={`control-btn ${isVideoOff ? "btn-danger-active" : ""}`}
              onClick={toggleVideo}
              title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              <span>{isVideoOff ? "📷" : "📹"}</span>
              <span className="control-label">{isVideoOff ? "Camera On" : "Camera Off"}</span>
            </button>

            <button
              className="control-btn btn-hangup"
              onClick={handleEndCall}
              title="Leave Consultation"
            >
              <span>📞</span>
              <span className="control-label">Leave Call</span>
            </button>
          </div>
        </div>

        <div className="consultation-sidebar card card-pad">
          <div className="sidebar-tab-header">
            <button
              className={`tab-link ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              💬 In-Call Chat
            </button>
            <button
              className={`tab-link ${activeTab === "notes" ? "active" : ""}`}
              onClick={() => setActiveTab("notes")}
            >
              📋 Clinical Info
            </button>
          </div>

          {activeTab === "chat" ? (
            <div className="in-call-chat">
              <div className="chat-stream">
                <div className="chat-system-notice">
                  🔒 End-to-End Encrypted Consultation. Messages are synchronized in real-time.
                </div>

                {messages.map((m, idx) => {
                  const isMine = m.senderId === user?._id || m.senderName === user?.username;
                  return (
                    <div key={idx} className={`chat-row ${isMine ? "chat-mine" : "chat-theirs"}`}>
                      <div className="chat-bubble-card">
                        <div className="chat-meta">
                          <span className="chat-author">{isMine ? "You" : m.senderName}</span>
                          <span className="chat-timestamp">{m.timestamp}</span>
                        </div>
                        <div className="chat-body">{m.text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-submit-row">
                <input
                  type="text"
                  placeholder="Type a message or symptom notes..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="chat-text-input"
                />
                <button type="submit" className="btn btn-rust btn-sm" disabled={!chatInput.trim()}>
                  Send
                </button>
              </form>
            </div>
          ) : (
            <div className="consultation-info-tab">
              <div className="ledger-row">
                <span className="ledger-label">Doctor</span>
                <span className="ledger-value">Dr. {doctor.userId?.username || "—"}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">Specialization</span>
                <span className="ledger-value">{doctor.specialization || "General"}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">Patient</span>
                <span className="ledger-value">{patient.userId?.username || "—"}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">Time Slot</span>
                <span className="ledger-value">{appointment.slotTime}</span>
              </div>
              <div className="ledger-row">
                <span className="ledger-label">Room Key</span>
                <span className="ledger-value" style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  {appointment.roomId || appointment._id}
                </span>
              </div>

              <div style={{ marginTop: 20 }}>
                <p className="faint" style={{ fontSize: "0.85rem" }}>
                  💡 Tip: You can adjust audio and video permissions in your browser bar if your camera or microphone is blocked.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
