// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user; // ab har protected route mein req.user available hai
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Guard clause: agar req.user hi nahi hai (matlab protect nahi chala ya fail ho gaya)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login first.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
};

// Cookie-authenticated state changes must come from the configured application.
// Bearer-token clients remain usable for non-browser integrations.
exports.requireSameOrigin = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const hasCookieAuth = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  if (!hasCookieAuth) return next();

  const origin = req.get("Origin");
  const referer = req.get("Referer");
  let requestOrigin = origin;
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin;
    } catch {
      requestOrigin = null;
    }
  }
  const configuredOrigins = [
    process.env.CLIENT_URL,
    "https://mediconnecthealth.me",
    "https://www.mediconnecthealth.me",
    "https://medi-connect-chi-five.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  const isAllowed =
    configuredOrigins.includes(requestOrigin) ||
    (process.env.NODE_ENV !== "production" &&
      requestOrigin &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin));

  if (!requestOrigin || !isAllowed) {
    return res.status(403).json({ success: false, message: "Cross-site request blocked" });
  }
  next();
};