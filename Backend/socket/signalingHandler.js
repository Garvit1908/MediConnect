const RoomManager = require("./roomManager");

/**
 * WebRTC Signaling & Real-time Event Handler
 * Coordinates room management, SDP offer/answer relay, ICE candidate exchange,
 * media toggle state synchronization, and in-call chat.
 */
module.exports = (io, socket) => {
  // 1. Join Room
  socket.on("join-room", async ({ roomId }) => {
    try {
      if (!roomId) {
        return socket.emit("error-message", { message: "Room ID is required" });
      }

      // Check room authorization
      const validation = await RoomManager.validateRoomAccess(roomId, socket.user);
      if (!validation.authorized) {
        return socket.emit("room-error", { message: validation.reason });
      }

      // Check room capacity (Max 2 for 1-on-1 consultation)
      const room = io.sockets.adapter.rooms.get(roomId);
      const currentUserId = socket.user?._id?.toString();

      // Evict any stale/ghost sockets belonging to the exact same user (handles tab reloads, strict mode)
      if (room && currentUserId) {
        for (const sId of Array.from(room)) {
          if (sId !== socket.id) {
            const existingSocket = io.sockets.sockets.get(sId);
            if (existingSocket && existingSocket.user?._id?.toString() === currentUserId) {
              console.log(`[Socket] Evicting stale socket ${sId} for user ${currentUserId} in room ${roomId}`);
              existingSocket.leave(roomId);
            }
          }
        }
      }

      // Re-evaluate room capacity
      const updatedRoom = io.sockets.adapter.rooms.get(roomId);
      const isAlreadyInRoom = updatedRoom ? updatedRoom.has(socket.id) : false;
      const otherSocketsCount = updatedRoom ? (isAlreadyInRoom ? updatedRoom.size - 1 : updatedRoom.size) : 0;

      if (otherSocketsCount >= 2) {
        return socket.emit("room-error", {
          message: "Consultation room is full (Maximum 2 participants allowed).",
        });
      }

      // Join the socket room
      socket.join(roomId);
      socket.currentRoomId = roomId;

      const finalCount = io.sockets.adapter.rooms.get(roomId)?.size || 1;

      // Notify the joining socket that they successfully joined
      socket.emit("room-joined", {
        roomId,
        socketId: socket.id,
        user: socket.user,
        participantCount: finalCount,
      });

      // If another peer was already in the room, notify them to initiate the WebRTC offer
      socket.to(roomId).emit("user-joined", {
        socketId: socket.id,
        user: socket.user,
      });

      console.log(`[Socket] User ${socket.user?.username || socket.id} joined room: ${roomId}`);
    } catch (err) {
      console.error("[Socket] join-room error:", err);
      socket.emit("room-error", { message: "Failed to join room" });
    }
  });

  // 2. Relay SDP Offer (Initiator -> Receiver)
  socket.on("send-offer", ({ roomId, offer }) => {
    if (!roomId || !offer || socket.currentRoomId !== roomId) return;

    // Relay to the other peer in the room
    socket.to(roomId).emit("receive-offer", {
      offer,
      from: socket.id,
      sender: socket.user,
    });
  });

  // 3. Relay SDP Answer (Receiver -> Initiator)
  socket.on("send-answer", ({ roomId, answer }) => {
    if (!roomId || !answer || socket.currentRoomId !== roomId) return;

    // Relay back to the initiator in the room
    socket.to(roomId).emit("receive-answer", {
      answer,
      from: socket.id,
      sender: socket.user,
    });
  });

  // 4. Relay ICE Candidate (Bi-directional network routes)
  socket.on("send-ice-candidate", ({ roomId, candidate }) => {
    if (!roomId || !candidate || socket.currentRoomId !== roomId) return;

    socket.to(roomId).emit("receive-ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  // 5. Media Toggle State Sync (Mic Muted / Camera Off)
  socket.on("toggle-media", ({ roomId, isAudioMuted, isVideoOff }) => {
    if (!roomId || socket.currentRoomId !== roomId) return;

    socket.to(roomId).emit("peer-media-toggled", {
      from: socket.id,
      isAudioMuted,
      isVideoOff,
    });
  });

  // 6. In-Call Real-Time Text Chat
  socket.on("send-message", ({ roomId, text }) => {
    if (!roomId || !text?.trim() || socket.currentRoomId !== roomId) return;

    const messageData = {
      text: text.trim(),
      senderId: socket.user?._id || socket.id,
      senderName: socket.user?.username || "Anonymous",
      senderRole: socket.user?.role || "guest",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Broadcast message to everyone in the room (including sender)
    io.to(roomId).emit("receive-message", messageData);
  });

  // 7. Explicit Call Terminated / Cut by Either Party
  socket.on("end-call", ({ roomId }) => {
    const targetRoom = roomId || socket.currentRoomId;
    if (!targetRoom || socket.currentRoomId !== targetRoom) return;

    io.to(targetRoom).emit("call-ended", {
      by: socket.user?.username || "Participant",
      role: socket.user?.role || "user",
      message: `${socket.user?.username || "Participant"} ended the consultation.`,
    });

    // Remove every participant so a terminated call cannot be revived by stale sockets.
    for (const socketId of io.sockets.adapter.rooms.get(targetRoom) || []) {
      const participant = io.sockets.sockets.get(socketId);
      if (participant) {
        participant.leave(targetRoom);
        if (participant.currentRoomId === targetRoom) participant.currentRoomId = null;
      }
    }
  });

  // 8. Explicit Leave Room
  socket.on("leave-room", ({ roomId }) => {
    const targetRoom = roomId || socket.currentRoomId;
    if (targetRoom && socket.currentRoomId === targetRoom) {
      socket.leave(targetRoom);
      socket.to(targetRoom).emit("user-left", {
        socketId: socket.id,
        user: socket.user,
        message: `${socket.user?.username || "Peer"} has left the consultation.`,
      });
      socket.currentRoomId = null;
    }
  });

  // 8. Disconnect Cleanup
  socket.on("disconnect", () => {
    if (socket.currentRoomId) {
      socket.to(socket.currentRoomId).emit("user-left", {
        socketId: socket.id,
        user: socket.user,
        message: `${socket.user?.username || "Peer"} disconnected.`,
      });
    }
    console.log(`[Socket] Disconnected: ${socket.user?.username || socket.id}`);
  });
};
