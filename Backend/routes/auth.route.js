const express = require("express");
const router = express.Router();

const {
  sendOTP,
  signup,
  login,
  logout,
  refreshAccessToken,
  updateProfilePicture,
  forgotPasswordOTP,
  resetPassword,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");
const { uploadProfilePic } = require("../middleware/multer.middleware");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication requests. Please try again later." },
});
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP requests. Please try again later." },
});

// Public Auth Routes
router.post("/send-otp", otpLimiter, sendOTP);
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshAccessToken);

// Forgot & Reset Password Flow
router.post("/forgot-password-otp", otpLimiter, forgotPasswordOTP);
router.post("/reset-password", authLimiter, resetPassword);

// Protected Auth Routes
router.post("/logout", protect, logout);

// Profile Picture Upload Route (Cloudinary)
router.put(
  "/profile-picture",
  protect,
  uploadProfilePic.single("profilePic"),
  updateProfilePicture
);

// Profile / Current User route
router.get("/me", protect, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
