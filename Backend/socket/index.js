const socketAuth = require("./socketAuth");
const signalingHandler = require("./signalingHandler");

const initSocket = (io) => {

  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      `[Socket] Connected: ${socket.user?.username || socket.id} (Role: ${socket.user?.role || "unknown"})`
    );

    signalingHandler(io, socket);
  });
};

module.exports = initSocket;
