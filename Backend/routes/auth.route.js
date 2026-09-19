const express = require("express");
const router = express.Router();

const {
  sendOTP,
  signup,
  login,
  googleAuth,
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

router.post("/send-otp", otpLimiter, sendOTP);
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/google", authLimiter, googleAuth);
router.post("/refresh-token", refreshAccessToken);

router.post("/forgot-password-otp", otpLimiter, forgotPasswordOTP);
router.post("/reset-password", authLimiter, resetPassword);

router.post("/logout", protect, logout);

router.put(
  "/profile-picture",
  protect,
  uploadProfilePic.single("profilePic"),
  updateProfilePicture
);

router.get("/me", protect, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
