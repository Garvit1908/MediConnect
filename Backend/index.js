const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const { requireSameOrigin } = require("./middleware/auth.middleware");
const dbconnect = require("./config/db");
const { cloudinaryConnect } = require("./config/cloudinary");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);

// Trust first proxy hop (essential for HTTPS secure cookies behind Nginx / Render / Cloudflare / AWS)
app.set("trust proxy", 1);

// Allowed origins for CORS (Development and Production)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://localhost:80",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
  "https://mediconnecthealth.me",
  "https://www.mediconnecthealth.me",
  "https://medi-connect-chi-five.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const checkOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
  ) {
    return callback(null, true);
  }
  return callback(null, false);
};

// Attach Socket.IO with dynamic CORS support
const io = new Server(server, {
  cors: {
    origin: checkOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize Socket Handlers & Auth
initSocket(io);

cloudinaryConnect();

// Express CORS Middleware with Credentials
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production" ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requireSameOrigin);

// Health Check endpoint for Docker / Container Orchestrators (Render, Railway, ECS, K8s)
app.get(["/health", "/api/v1/health"], (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  return res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "degraded",
  });
});

// Serve static frontend files for WebRTC testing
app.use(express.static(path.join(__dirname, "public")));

// Routes
const authRoutes = require("./routes/auth.route");
app.use("/api/v1/auth", authRoutes);

const patientRoutes = require("./routes/patient.route");
app.use("/api/v1/patients", patientRoutes);

const doctorRoutes = require("./routes/doctor.route");
app.use("/api/v1/doctors", doctorRoutes);

const appointmentRoutes = require("./routes/appointment.route");
app.use("/api/v1/appointments", appointmentRoutes);

const prescriptionRoutes = require("./routes/prescription.route");
app.use("/api/v1/prescriptions", prescriptionRoutes);

const medicalRecordRoutes = require("./routes/medicalRecord.route");
app.use("/api/v1/medical-records", medicalRecordRoutes);

const paymentRoutes = require("./routes/payment.route");
app.use("/api/v1/payments", paymentRoutes);

// 404 handler for unmatched API routes
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global Error Handling Middleware (Catches Multer & Unhandled Errors)
app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum allowed size is 15MB for photos and 25MB for documents.",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Upload error",
    });
  }

  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: "Invalid file type",
    });
  }

  console.error("Unhandled Server Error:", err);
  return res.status(err.status || 500).json({
    success: false,
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 4000;

dbconnect()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server & Sockets are listening at port ${PORT}`);
    });
  })
  .catch((Err) => {
    console.log(Err, "error connecting db");
  });
