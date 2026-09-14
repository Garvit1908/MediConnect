const User = require("../models/user.model");
const OTP = require("../models/otp.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailsender = require("../utils/mailsender");
const { getOTPEmailTemplate, getPasswordResetEmailTemplate } = require("../utils/emailTemplates");
const { uploadStreamToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require("../utils/cloudinary");

// Expiry durations in milliseconds
const ACCESS_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day
const REFRESH_TOKEN_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

// Cookie options for tokens
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction, // false in development (HTTP), true in production (HTTPS)
  sameSite: process.env.COOKIE_SAMESITE || "lax",
};

// ==========================================
// 1. SEND OTP CONTROLLER
// ==========================================
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 1. Check if user is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already registered with this email",
      });
    }

    // 2. Generate 6-digit numeric plain OTP
    const plainOtp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // 3. Send plain OTP email FIRST (Guarantees user receives readable code)
    const emailBody = getOTPEmailTemplate(plainOtp);
    await mailsender(email, "Verification OTP - MediConnect", emailBody);

    // 4. Hash the OTP explicitly before database persistence
    const hashedOtp = await bcrypt.hash(plainOtp, 10);

    // 5. Store ONLY hashed OTP in MongoDB
    await OTP.create({
      email,
      otp: hashedOtp,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
    });
  } catch (err) {
    console.error("Error in sendOTP:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// ==========================================
// 2. SIGNUP CONTROLLER
// ==========================================
exports.signup = async (req, res) => {
  try {
    const { email, password, username, otp, role } = req.body;

    // 1. Validate required fields
    if (!email || !password || !username || !otp || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (email, password, username, otp, role)",
      });
    }

    // 2. Prevent Privilege Escalation (Only patient or doctor allowed at public signup)
    // NOTE: How Admin accounts are created in production:
    //  - Option A: Via DB Seeder script (e.g. scripts/seedAdmin.js) executed directly on server.
    //  - Option B: Directly from MongoDB Atlas / Compass by updating user's role to 'admin'.
    //  - Option C: Via a protected internal route protected by an ADMIN_SECRET_KEY / Super-Admin invite.
    // Public signup is strictly blocked for 'admin' to prevent unauthorized root access.
    if (role !== "patient" && role !== "doctor") {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Only 'patient' or 'doctor' accounts can be created via signup.",
      });
    }

    // 3. Check if user already exists with email or username
    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // 4. Find most recent OTP
    const recentOtp = await OTP.find({ email })
      .select("+otp")
      .sort({ createdAt: -1 })
      .limit(1);

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Please request a new one.",
      });
    }

    // 5. Explicit in-memory expiration check (Guarantees exact 5-minute limit)
    const isExpired =
      Date.now() - new Date(recentOtp[0].createdAt).getTime() > 5 * 60 * 1000;
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // 6. Compare plain OTP with hashed OTP from DB using bcrypt
    const isOtpValid = await bcrypt.compare(String(otp), recentOtp[0].otp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 7. Create User (password hashing is handled by User pre-save hook)
    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    // 8. Delete ALL OTPs for this email (Replay attack & Dangling Token protection)
    await OTP.deleteMany({ email });

    // 9. Generate Access & Refresh Tokens for instant seamless onboarding
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshtoken = await bcrypt.hash(refreshToken, 10);
    user.refreshtokenexpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    // 10. Return response with auth cookies
    return res
      .status(201)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
      })
      .json({
        success: true,
        message: "User registered and authenticated successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
  } catch (err) {
    console.error("Error in signup:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// ==========================================
// 3. LOGIN CONTROLLER
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs (email and password required)
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    // 2. Find user directly by email (username is non-unique, login is strictly email-based)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 3. Verify password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 4. Generate Access & Refresh Tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // 5. Store Refresh Token & Expiry in MongoDB
    user.refreshtoken = await bcrypt.hash(refreshToken, 10);
    user.refreshtokenexpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    // 6. Set tokens in Cookies & send response
    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
      })
      .json({
        success: true,
        message: "Logged in successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profilePicUrl: user.profilePicUrl,
        },
      });
  } catch (err) {
    console.error("Error in login:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during login",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// ==========================================
// 4. LOGOUT CONTROLLER
// ==========================================
exports.logout = async (req, res) => {
  try {
    let userId = req.user?._id;

    // If req.user is not set by middleware, try decoding the refresh token from cookies
    if (!userId) {
      const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;
      if (incomingRefreshToken) {
        try {
          const decoded = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
          );
          userId = decoded?._id;
        } catch (ignored) {
          // Token expired or invalid, proceed to clear cookies
        }
      }
    }

    // Clear refresh token in database if user is identified
    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        {
          $unset: {
            refreshtoken: 1,
            refreshtokenexpiry: 1,
          },
        },
        { new: true }
      );
    }

    // Clear cookies using the exact same cookieOptions
    return res
      .status(200)
      .clearCookie("accessToken", cookieOptions)
      .clearCookie("refreshToken", cookieOptions)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (err) {
    console.error("Error in logout:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to log out",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// ==========================================
// 5. REFRESH ACCESS TOKEN CONTROLLER
// ==========================================
exports.refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // 1. Verify refresh token signature & expiration
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // 2. Find user by decoded ID (explicitly select +refreshtoken +refreshtokenexpiry because select: false)
    const user = await User.findById(decoded?._id).select("+refreshtoken +refreshtokenexpiry");
    if (!user || !user.refreshtoken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token (User or session not found)",
      });
    }

    // Check DB-level token expiry
    if (user.refreshtokenexpiry && user.refreshtokenexpiry < new Date()) {
      user.refreshtoken = undefined;
      user.refreshtokenexpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired. Please login again.",
      });
    }

    // 3. Compare incoming plain refresh token with hashed refresh token in DB
    const isTokenMatch = await bcrypt.compare(
      incomingRefreshToken,
      user.refreshtoken
    );

    if (!isTokenMatch) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or has been revoked",
      });
    }

    // 4. Generate new Access and Refresh tokens (Token Rotation)
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    // 5. Store new hashed Refresh Token & Expiry in MongoDB (Token Rotation)
    user.refreshtoken = await bcrypt.hash(newRefreshToken, 10);
    user.refreshtokenexpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    // 6. Set new cookies and send success response
    return res
      .status(200)
      .cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
      })
      .json({
        success: true,
        message: "Access token refreshed successfully",
      });
  } catch (err) {
    console.error("Error in refreshAccessToken:", err);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// ==========================================
// 6. UPDATE PROFILE PICTURE (Cloudinary Upload)
// ==========================================
exports.updateProfilePicture = async (req, res) => {
  let uploadResult = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file (JPEG, JPG, PNG, or WEBP)",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 1. Capture old publicId to clean up previous avatar
    const oldPublicId = user.profilePicPublicId || getPublicIdFromUrl(user.profilePicUrl);

    // 2. Stream upload directly to Cloudinary folder "mediconnect/avatars"
    uploadResult = await uploadStreamToCloudinary(
      req.file.buffer,
      "mediconnect/avatars",
      {
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      }
    );

    // 3. Update DB with new avatar and publicId
    user.profilePicUrl = uploadResult.secure_url;
    user.profilePicPublicId = uploadResult.public_id;
    await user.save({ validateBeforeSave: false });

    // 4. Delete old avatar from Cloudinary if existed
    if (oldPublicId) {
      deleteFromCloudinary(oldPublicId, "image");
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      profilePicUrl: user.profilePicUrl,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicUrl: user.profilePicUrl,
      },
    });
  } catch (err) {
    // Rollback: Delete orphaned avatar from Cloudinary if user.save() fails
    if (uploadResult?.public_id) {
      await deleteFromCloudinary(uploadResult.public_id, "image");
    }

    console.error("Error updating profile picture:", err);
    return res.status(500).json({
      success: false,
      message: "Error uploading profile picture to Cloudinary",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// ==========================================
// 7. FORGOT PASSWORD OTP CONTROLLER
// ==========================================
exports.forgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your registered email",
      });
    }

    // 1. Verify user exists in database
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // 2. Generate 6-digit numeric OTP
    const plainOtp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // 3. Send Password Reset OTP Email
    const emailBody = getPasswordResetEmailTemplate(plainOtp);
    await mailsender(email, "Password Reset Code - MediConnect", emailBody);

    // 4. Hash the OTP explicitly before database persistence
    const hashedOtp = await bcrypt.hash(plainOtp, 10);

    // 5. Store hashed OTP in MongoDB
    await OTP.create({
      email,
      otp: hashedOtp,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent successfully to your email",
    });
  } catch (err) {
    console.error("Error in forgotPasswordOTP:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send password reset OTP",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// ==========================================
// 8. RESET PASSWORD CONTROLLER
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    // 1. Validate inputs
    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (email, otp, newPassword, confirmPassword)",
      });
    }

    // 2. Check password matching and length
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and Confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // 3. Verify user exists
    const user = await User.findOne({ email }).select("+password +refreshtoken +refreshtokenexpiry");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    // 4. Find most recent OTP for this email
    const recentOtp = await OTP.find({ email })
      .select("+otp")
      .sort({ createdAt: -1 })
      .limit(1);

    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Please request a new password reset code.",
      });
    }

    // 5. Check in-memory 5-minute expiry
    const isExpired =
      Date.now() - new Date(recentOtp[0].createdAt).getTime() > 5 * 60 * 1000;
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // 6. Verify OTP with bcrypt
    const isOtpValid = await bcrypt.compare(String(otp), recentOtp[0].otp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 7. Update Password (pre-save hook will hash it)
    user.password = newPassword;

    // Invalidate existing sessions across all devices for security
    user.refreshtoken = undefined;
    user.refreshtokenexpiry = undefined;

    await user.save();

    // 8. Delete all OTPs for this email to prevent replay attacks
    await OTP.deleteMany({ email });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};