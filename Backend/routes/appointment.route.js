const express = require("express");
const router = express.Router();

const {
  bookappointment,
  getmyappointment,
  getAppointmentById,
  cancelAppointment,
  updateAppointment,
} = require("../controllers/appointment.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

// 1. Book an appointment (Patient only)
router.post("/", protect, authorize("patient"), bookappointment);

// 2. Get all appointments for logged-in user (Patient/Doctor)
router.get("/my", protect, authorize("patient", "doctor"), getmyappointment);

// 3. Get specific appointment details by ID
router.get("/:id", protect, authorize("patient", "doctor"), getAppointmentById);

// 4. Cancel appointment (Frees up slot)
router.put("/:id/cancel", protect, authorize("patient", "doctor"), cancelAppointment);

// 5. Update / Reschedule appointment / Change status
router.put("/:id", protect, authorize("patient", "doctor"), updateAppointment);

module.exports = router;
