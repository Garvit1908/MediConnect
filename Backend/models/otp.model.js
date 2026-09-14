const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 5 * 60, // 5 minutes TTL in MongoDB
  },
});

module.exports = mongoose.model("OTP", OTPSchema);