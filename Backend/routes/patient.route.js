const express = require("express");
const router = express.Router();

const {
  getpatient,
  updatepatient,
  createpatient,
  getMyPatientProfile,
} = require("../controllers/patient.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

// 🧑‍🦱 Logged-in Patient routes
router.get("/me", protect, authorize("patient"), getMyPatientProfile);
router.post("/", protect, authorize("patient"), createpatient);
router.put("/me", protect, authorize("patient"), updatepatient);

// 👨‍⚕️ Doctor / Admin / Patient (Kisi patient ki history ID se dekhne ke liye)
router.get("/:id", protect, authorize("doctor", "admin", "patient"), getpatient);

module.exports = router;
