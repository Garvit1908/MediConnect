const RoomManager = require("./roomManager");

module.exports = (io, socket) => {

  socket.on("join-room", async ({ roomId }) => {
    try {
      if (!roomId) {
        return socket.emit("error-message", { message: "Room ID is required" });
      }

      const validation = await RoomManager.validateRoomAccess(roomId, socket.user);
      if (!validation.authorized) {
        return socket.emit("room-error", { message: validation.reason });
      }

      const room = io.sockets.adapter.rooms.get(roomId);
      const currentUserId = socket.user?._id?.toString();

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

      const updatedRoom = io.sockets.adapter.rooms.get(roomId);
      const isAlreadyInRoom = updatedRoom ? updatedRoom.has(socket.id) : false;
      const otherSocketsCount = updatedRoom ? (isAlreadyInRoom ? updatedRoom.size - 1 : updatedRoom.size) : 0;

      if (otherSocketsCount >= 2) {
        return socket.emit("room-error", {
          message: "Consultation room is full (Maximum 2 participants allowed).",
        });
      }

      socket.join(roomId);
      socket.currentRoomId = roomId;

      const finalCount = io.sockets.adapter.rooms.get(roomId)?.size || 1;

      socket.emit("room-joined", {
        roomId,
        socketId: socket.id,
        user: socket.user,
        participantCount: finalCount,
      });

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

  socket.on("send-offer", ({ roomId, offer }) => {
    if (!roomId || !offer || socket.currentRoomId !== roomId) return;

    socket.to(roomId).emit("receive-offer", {
      offer,
      from: socket.id,
      sender: socket.user,
    });
  });

  socket.on("send-answer", ({ roomId, answer }) => {
    if (!roomId || !answer || socket.currentRoomId !== roomId) return;

    socket.to(roomId).emit("receive-answer", {
      answer,
      from: socket.id,
      sender: socket.user,
    });
  });

  socket.on("send-ice-candidate", ({ roomId, candidate }) => {
    if (!roomId || !candidate || socket.currentRoomId !== roomId) return;

    socket.to(roomId).emit("receive-ice-candidate", {
      candidate,
      from: socket.id,
    });
  });

  socket.on("toggle-media", ({ roomId, isAudioMuted, isVideoOff }) => {
    if (!roomId || socket.currentRoomId !== roomId) return;

    socket.to(roomId).emit("peer-media-toggled", {
      from: socket.id,
      isAudioMuted,
      isVideoOff,
    });
  });

  socket.on("send-message", ({ roomId, text }) => {
    if (!roomId || !text?.trim() || socket.currentRoomId !== roomId) return;

    const messageData = {
      text: text.trim(),
      senderId: socket.user?._id || socket.id,
      senderName: socket.user?.username || "Anonymous",
      senderRole: socket.user?.role || "guest",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    io.to(roomId).emit("receive-message", messageData);
  });

  socket.on("end-call", ({ roomId }) => {
    const targetRoom = roomId || socket.currentRoomId;
    if (!targetRoom || socket.currentRoomId !== targetRoom) return;

    io.to(targetRoom).emit("call-ended", {
      by: socket.user?.username || "Participant",
      role: socket.user?.role || "user",
      message: `${socket.user?.username || "Participant"} ended the consultation.`,
    });

    for (const socketId of io.sockets.adapter.rooms.get(targetRoom) || []) {
      const participant = io.sockets.sockets.get(socketId);
      if (participant) {
        participant.leave(targetRoom);
        if (participant.currentRoomId === targetRoom) participant.currentRoomId = null;
      }
    }
  });

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
