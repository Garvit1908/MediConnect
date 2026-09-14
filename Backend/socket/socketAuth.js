const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Socket.IO Authentication Middleware
 * Validates JWT access token from handshake auth or cookies.
 * Attaches authenticated user object to socket.user.
 */
const socketAuth = async (socket, next) => {
  try {
    // 1. Extract token from socket handshake auth, headers, or cookies
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers?.authorization) {
      const parts = socket.handshake.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token && socket.handshake.headers?.cookie) {
      const rawCookies = socket.handshake.headers.cookie.split(";");
      for (const item of rawCookies) {
        const [rawKey, ...valParts] = item.trim().split("=");
        if (rawKey === "accessToken") {
          token = decodeURIComponent(valParts.join("="));
          break;
        }
      }
    }

    // 2. Reject immediately if no token was provided
    if (!token) {
      return next(new Error("Authentication failed: No access token provided"));
    }

    // 3. Cryptographically verify JWT Token against ACCESS_TOKEN_SECRET
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return next(new Error("Authentication failed: User not found"));
    }

    socket.user = {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    return next();
  } catch (err) {
    console.error("Socket authentication failed:", err);
    return next(new Error("Authentication failed"));
  }
};

module.exports = socketAuth;
