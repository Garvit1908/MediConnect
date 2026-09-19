let socket = null;
let localStream = null;
let peerConnection = null;

let currentRoomId = null;
let currentUser = { name: "User", role: "patient" };
let isAudioMuted = false;
let isVideoOff = false;
let iceCandidatesQueue = [];

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

const setupOverlay = document.getElementById("setupOverlay");
const mainWorkspace = document.getElementById("mainWorkspace");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const remotePlaceholder = document.getElementById("remotePlaceholder");
const statusText = document.getElementById("statusText");
const callStatusBadge = document.getElementById("callStatusBadge");
const statusDot = callStatusBadge.querySelector(".status-dot");
const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const endCallBtn = document.getElementById("endCallBtn");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const logsContainer = document.getElementById("logsContainer");

const tabChatBtn = document.getElementById("tabChatBtn");
const tabLogsBtn = document.getElementById("tabLogsBtn");
const chatPanel = document.getElementById("chatPanel");
const logsPanel = document.getElementById("logsPanel");

tabChatBtn.addEventListener("click", () => {
  tabChatBtn.classList.add("active");
  tabLogsBtn.classList.remove("active");
  chatPanel.style.display = "flex";
  logsPanel.style.display = "none";
});

tabLogsBtn.addEventListener("click", () => {
  tabLogsBtn.classList.add("active");
  tabChatBtn.classList.remove("active");
  logsPanel.style.display = "flex";
  chatPanel.style.display = "none";
});

function logTelemetry(msg, type = "info") {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const div = document.createElement("div");
  div.className = `log-entry ${type}`;
  div.textContent = `[${time}] ${msg}`;
  logsContainer.appendChild(div);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function updateConnectionBadge(state, text) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = text;
}

document.getElementById("joinBtn").addEventListener("click", async () => {
  const roomId = document.getElementById("roomIdInput").value.trim();
  const role = document.getElementById("roleSelect").value;
  const username = document.getElementById("usernameInput").value.trim() || "User";
  const token = document.getElementById("jwtTokenInput").value.trim();

  if (!roomId) {
    alert("Please enter a valid Consultation Room ID");
    return;
  }

  currentRoomId = roomId;
  if (!token) {
    alert("Authentication is required to join a consultation. Please log in again.");
    logTelemetry("Authentication failed: no verified access token was provided.", "error");
    return;
  }

  currentUser = { name: username, role };

  setupOverlay.style.display = "none";
  mainWorkspace.style.display = "flex";

  document.getElementById("localPeerLabel").textContent = `${username} (${role})`;
  updateConnectionBadge("connecting", "Initializing Devices...");
  logTelemetry(`Joining room "${roomId}" as ${username} (${role})...`, "info");

  await startLocalMedia();

  initSocketConnection(token);
});

async function startLocalMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });

    localVideo.srcObject = localStream;
    logTelemetry("Local camera and microphone tracks captured successfully", "success");
  } catch (err) {
    logTelemetry(`Media device error: ${err.message}`, "error");
    alert("Could not access camera/microphone. Please ensure permissions are granted.");
  }
}

function initSocketConnection(token) {
  socket = io({
    auth: { token },
  });

  socket.on("connect", () => {
    logTelemetry(`Socket connected with ID: ${socket.id}`, "success");
    updateConnectionBadge("connecting", "Joining Room...");

    socket.emit("join-room", { roomId: currentRoomId });
  });

  socket.on("connect_error", (error) => {
    const message = error?.message || "Socket authentication failed";
    logTelemetry(`Authentication failed: ${message}`, "error");
    updateConnectionBadge("error", "Authentication failed");
    alert("Your session is no longer valid. Please log in again.");
  });

  socket.on("room-joined", ({ roomId, participantCount }) => {
    logTelemetry(`Room "${roomId}" joined. Total in room: ${participantCount}`, "success");
    updateConnectionBadge("connecting", participantCount > 1 ? "Connecting Peer..." : "Waiting for Peer");
  });

  socket.on("room-error", ({ message }) => {
    logTelemetry(`Room Error: ${message}`, "error");
    alert(`Room Error: ${message}`);
  });

  socket.on("user-joined", async ({ socketId, user }) => {
    logTelemetry(`Peer ${user?.username || socketId} entered the room. Initiating WebRTC Offer...`, "info");
    document.getElementById("remotePeerLabel").textContent = `${user?.username || "Peer"} (${user?.role || "Remote"})`;

    createPeerConnection();

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      logTelemetry("SDP Offer created and applied locally. Relaying via Socket.IO...", "info");

      socket.emit("send-offer", {
        roomId: currentRoomId,
        offer,
      });
    } catch (err) {
      logTelemetry(`Failed to create offer: ${err.message}`, "error");
    }
  });

  socket.on("receive-offer", async ({ offer, from, sender }) => {
    logTelemetry(`Received SDP Offer from ${sender?.username || from}. Creating SDP Answer...`, "info");
    document.getElementById("remotePeerLabel").textContent = `${sender?.username || "Peer"} (${sender?.role || "Remote"})`;

    createPeerConnection();

    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      logTelemetry("Remote SDP Offer applied successfully", "success");

      await flushQueuedIceCandidates();

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      logTelemetry("SDP Answer generated. Sending back to caller...", "info");

      socket.emit("send-answer", {
        roomId: currentRoomId,
        answer,
      });
    } catch (err) {
      logTelemetry(`Failed to process offer: ${err.message}`, "error");
    }
  });

  socket.on("receive-answer", async ({ answer, from, sender }) => {
    logTelemetry(`Received SDP Answer from ${sender?.username || from}. Finalizing connection...`, "success");
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      logTelemetry("Remote SDP Answer applied. P2P Handshake complete!", "success");

      await flushQueuedIceCandidates();
    } catch (err) {
      logTelemetry(`Failed to set remote answer: ${err.message}`, "error");
    }
  });

  socket.on("receive-ice-candidate", async ({ candidate }) => {
    try {
      if (!peerConnection || !peerConnection.remoteDescription) {
        iceCandidatesQueue.push(candidate);
        logTelemetry(`Buffered early ICE candidate (Waiting for remote SDP)...`, "info");
      } else {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        logTelemetry(`Added remote ICE Candidate (${candidate.protocol || "UDP"})`, "info");
      }
    } catch (err) {
      logTelemetry(`Error adding ICE candidate: ${err.message}`, "warn");
    }
  });

  async function flushQueuedIceCandidates() {
    if (iceCandidatesQueue.length > 0 && peerConnection && peerConnection.remoteDescription) {
      logTelemetry(`Flushing ${iceCandidatesQueue.length} queued ICE candidate(s)...`, "info");
      while (iceCandidatesQueue.length > 0) {
        const candidate = iceCandidatesQueue.shift();
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          logTelemetry(`Failed to apply queued candidate: ${e.message}`, "warn");
        }
      }
    }
  }

  socket.on("peer-media-toggled", ({ isAudioMuted: peerAudioMuted, isVideoOff: peerVideoOff }) => {
    logTelemetry(`Peer updated media: Audio=${peerAudioMuted ? "Muted" : "On"}, Video=${peerVideoOff ? "Off" : "On"}`, "info");
  });

  socket.on("user-left", ({ message }) => {
    logTelemetry(message, "warn");
    remoteVideo.srcObject = null;
    remotePlaceholder.style.display = "flex";
    updateConnectionBadge("connecting", "Peer Left Call");
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
  });

  socket.on("receive-message", (msg) => {
    appendChatMessage(msg);
  });
}

function createPeerConnection() {
  if (peerConnection) return;

  logTelemetry("Creating new RTCPeerConnection with STUN servers...", "info");
  peerConnection = new RTCPeerConnection(rtcConfig);

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
    logTelemetry("Attached local media tracks to RTCPeerConnection", "info");
  }

  peerConnection.ontrack = (event) => {
    logTelemetry("Received remote media stream track!", "success");
    if (event.streams && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      remotePlaceholder.style.display = "none";
    }
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      logTelemetry(`Generated local ICE candidate: ${event.candidate.type || "route"}`, "info");
      socket.emit("send-ice-candidate", {
        roomId: currentRoomId,
        candidate: event.candidate,
      });
    }
  };

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    logTelemetry(`WebRTC Connection State: ${state.toUpperCase()}`, state === "connected" ? "success" : "info");

    if (state === "connected") {
      updateConnectionBadge("connected", "Encrypted P2P Active");
    } else if (state === "disconnected" || state === "failed") {
      updateConnectionBadge("disconnected", `Connection ${state}`);
    }
  };
}

toggleAudioBtn.addEventListener("click", () => {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) {
    isAudioMuted = !isAudioMuted;
    audioTrack.enabled = !isAudioMuted;
    toggleAudioBtn.classList.toggle("active-off", isAudioMuted);
    toggleAudioBtn.querySelector(".lbl").textContent = isAudioMuted ? "Unmute" : "Mute";
    toggleAudioBtn.querySelector(".icon").textContent = isAudioMuted ? "🔇" : "🎙️";

    socket.emit("toggle-media", {
      roomId: currentRoomId,
      isAudioMuted,
      isVideoOff,
    });
  }
});

toggleVideoBtn.addEventListener("click", () => {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) {
    isVideoOff = !isVideoOff;
    videoTrack.enabled = !isVideoOff;
    toggleVideoBtn.classList.toggle("active-off", isVideoOff);
    toggleVideoBtn.querySelector(".lbl").textContent = isVideoOff ? "Turn On" : "Camera";
    toggleVideoBtn.querySelector(".icon").textContent = isVideoOff ? "📷" : "📹";

    socket.emit("toggle-media", {
      roomId: currentRoomId,
      isAudioMuted,
      isVideoOff,
    });
  }
});

endCallBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to end this consultation?")) {
    if (socket) {
      socket.emit("leave-room", { roomId: currentRoomId });
      socket.disconnect();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    window.location.reload();
  }
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !socket) return;

  socket.emit("send-message", {
    roomId: currentRoomId,
    text,
  });
  chatInput.value = "";
});

function appendChatMessage({ text, senderName, senderRole, senderId, timestamp }) {
  const isMine = senderId === socket?.id || senderName === currentUser.name;
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${isMine ? "mine" : "theirs"}`;

  const sender = document.createElement("div");
  sender.className = "chat-sender";
  sender.textContent = `${isMine ? "You" : senderName} (${senderRole})`;

  const message = document.createElement("div");
  message.className = "chat-text";
  message.textContent = text;

  const time = document.createElement("div");
  time.className = "chat-time";
  time.textContent = timestamp;

  bubble.append(sender, message, time);

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

window.addEventListener("beforeunload", () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (socket) {
    socket.emit("leave-room", { roomId: currentRoomId });
    socket.disconnect();
  }
  if (peerConnection) {
    peerConnection.close();
  }
});
