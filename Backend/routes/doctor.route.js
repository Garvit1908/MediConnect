const express = require("express");
const router = express.Router();

const {
  createDoctorProfile,
  getMyDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
  getDoctorById,
  verifyDoctor,
} = require("../controllers/doctor.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

// 🩺 Protected Doctor Routes (Doctor role only)
router.post("/", protect, authorize("doctor"), createDoctorProfile);
router.get("/me", protect, authorize("doctor"), getMyDoctorProfile);
router.put("/me", protect, authorize("doctor"), updateDoctorProfile);

// 🛡️ Admin Verification Route
router.patch("/:id/verify", protect, authorize("admin"), verifyDoctor);

// 🌍 Public Routes (Patients/Users can search and view doctors)
router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);

module.exports = router;
