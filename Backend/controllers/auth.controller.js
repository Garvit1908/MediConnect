const User = require("../models/user.model");
const Patient = require("../models/patient.model");
const Doctor = require("../models/doctor.model");
const OTP = require("../models/otp.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailsender = require("../utils/mailsender");
const { getOTPEmailTemplate, getPasswordResetEmailTemplate } = require("../utils/emailTemplates");
const { uploadStreamToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require("../utils/cloudinary");

let googleOAuthClient = null;
const getGoogleOAuthClient = () => {
  if (!googleOAuthClient) {
    try {
      const { OAuth2Client } = require("google-auth-library");
      googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    } catch {

    }
  }
  return googleOAuthClient;
};

const verifyGoogleIdToken = async (credential) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  const client = getGoogleOAuthClient();
  if (client) {
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId || undefined,
      });
      const payload = ticket.getPayload();
      if (payload) return payload;
    } catch (err) {
      console.warn("google-auth-library verification failed, trying tokeninfo fallback:", err.message);
    }
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token validation failed: ${text || res.statusText}`);
  }

  const payload = await res.json();
  if (clientId && payload.aud !== clientId) {
    throw new Error("Google token audience mismatch. Invalid Client ID.");
  }

  return payload;
};

const ACCESS_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_MS = 15 * 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : (process.env.COOKIE_SAMESITE || "lax"),
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already registered with this email",
      });
    }

    const plainOtp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const emailBody = getOTPEmailTemplate(plainOtp);
    await mailsender(email, "Verification OTP - MediConnect", emailBody);

    const hashedOtp = await bcrypt.hash(plainOtp, 10);

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

exports.signup = async (req, res) => {
  try {
    const { email, password, username, otp, role } = req.body;

    if (!email || !password || !username || !otp || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (email, password, username, otp, role)",
      });
    }

    if (role !== "patient" && role !== "doctor") {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Only 'patient' or 'doctor' accounts can be created via signup.",
      });
    }

    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

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

    const isExpired =
      Date.now() - new Date(recentOtp[0].createdAt).getTime() > 5 * 60 * 1000;
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const isOtpValid = await bcrypt.compare(String(otp), recentOtp[0].otp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    await OTP.deleteMany({ email });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshtoken = await bcrypt.hash(refreshToken, 10);
    user.refreshtokenexpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    return res
      .status(201)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 15 * 24 * 60 * 60 * 1000,
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password",
      });
    }

    const normalizedEmail = (email || "").toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshtoken = await bcrypt.hash(refreshToken, 10);
    user.refreshtokenexpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: 15 * 24 * 60 * 60 * 1000,
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

exports.logout = async (req, res) => {
  try {
    let userId = req.user?._id;

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

        }
      }
    }

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

    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded?._id).select("+refreshtoken +refreshtokenexpiry");
    if (!user || !user.refreshtoken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token (User or session not found)",
      });
    }

    if (user.refreshtokenexpiry && user.refreshtokenexpiry < new Date()) {
      user.refreshtoken = undefined;
      user.refreshtokenexpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired. Please login again.",
      });
    }

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

    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshtoken = await bcrypt.hash(newRefreshToken, 10);
    user.refreshtokenexpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000,
      })
      .cookie("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 15 * 24 * 60 * 60 * 1000,
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

    const oldPublicId = user.profilePicPublicId || getPublicIdFromUrl(user.profilePicUrl);

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

    user.profilePicUrl = uploadResult.secure_url;
    user.profilePicPublicId = uploadResult.public_id;
    await user.save({ validateBeforeSave: false });

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

exports.forgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide your registered email",
      });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    const plainOtp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const emailBody = getPasswordResetEmailTemplate(plainOtp);
    await mailsender(email, "Password Reset Code - MediConnect", emailBody);

    const hashedOtp = await bcrypt.hash(plainOtp, 10);

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

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (email, otp, newPassword, confirmPassword)",
      });
    }

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

    const user = await User.findOne({ email }).select("+password +refreshtoken +refreshtokenexpiry");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

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

    const isExpired =
      Date.now() - new Date(recentOtp[0].createdAt).getTime() > 5 * 60 * 1000;
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    const isOtpValid = await bcrypt.compare(String(otp), recentOtp[0].otp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.password = newPassword;

    user.refreshtoken = undefined;
    user.refreshtokenexpiry = undefined;

    await user.save();

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

exports.googleAuth = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential token is required",
      });
    }

    let payload;
    try {
      payload = await verifyGoogleIdToken(credential);
    } catch (verifyErr) {
      console.error("Google token verification failed:", verifyErr.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google credential",
      });
    }

    const { email, sub: googleId, name, picture } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Google account does not provide an email address",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    let isNewUser = false;

    if (!user) {

      const assignedRole = role === "doctor" ? "doctor" : "patient";

      let baseUsername = (name || normalizedEmail.split("@")[0])
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase()
        .slice(0, 25);
      if (!baseUsername) baseUsername = "user";

      let username = baseUsername;
      let counter = 1;
      while (await User.exists({ username })) {
        username = `${baseUsername.slice(0, 20)}_${counter}`;
        counter++;
      }

      user = await User.create({
        email: normalizedEmail,
        username,
        googleId,
        authProvider: "google",
        profilePicUrl: picture,
        role: assignedRole,
      });

      isNewUser = true;
    } else {

      let shouldSave = false;
      if (!user.googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }
      if (!user.profilePicUrl && picture) {
        user.profilePicUrl = picture;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save({ validateBeforeSave: false });
      }
    }

    let hasProfile = false;
    if (user.role === "patient") {
      hasProfile = Boolean(await Patient.exists({ userId: user._id }));
    } else if (user.role === "doctor") {
      hasProfile = Boolean(await Doctor.exists({ userId: user._id }));
    } else if (user.role === "admin") {
      hasProfile = true;
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshtoken = await bcrypt.hash(refreshToken, 10);
    user.refreshtokenexpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_EXPIRY_MS,
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
      })
      .json({
        success: true,
        message: isNewUser
          ? "Account registered and logged in with Google successfully"
          : "Logged in with Google successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profilePicUrl: user.profilePicUrl,
        },
        isNewUser,
        needsProfileSetup: !hasProfile,
      });
  } catch (err) {
    console.error("Error in googleAuth:", err);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during Google authentication",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};
