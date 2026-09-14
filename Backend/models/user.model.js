const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePicUrl: {
      type: String, // Cloudinary image URL
    },
    profilePicPublicId: {
      type: String, // Cloudinary public_id for clean asset replacement
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
      default: "patient",
    },
    refreshtoken: {
      type: String,
      select: false,
    },
    refreshtokenexpiry: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// hash the password before save
userSchema.pre("save", async function () {
  
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// custom comparison function
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// generate access token custom function
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      role:this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// generate refresh token custim function
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};


module.exports = mongoose.model("User", userSchema);