const socketAuth = require("./socketAuth");
const signalingHandler = require("./signalingHandler");

/**
 * Initializes Socket.IO with authentication middleware and event handlers.
 * @param {import("socket.io").Server} io
 */
const initSocket = (io) => {
  // Apply JWT authentication middleware to all incoming socket connections
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      `[Socket] Connected: ${socket.user?.username || socket.id} (Role: ${socket.user?.role || "unknown"})`
    );

    // Register WebRTC signaling and real-time chat handlers
    signalingHandler(io, socket);
  });
};

module.exports = initSocket;
