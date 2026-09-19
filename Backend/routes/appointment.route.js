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

router.post("/", protect, authorize("patient"), bookappointment);

router.get("/my", protect, authorize("patient", "doctor"), getmyappointment);

router.get("/:id", protect, authorize("patient", "doctor"), getAppointmentById);

router.put("/:id/cancel", protect, authorize("patient", "doctor"), cancelAppointment);

router.put("/:id", protect, authorize("patient", "doctor"), updateAppointment);

module.exports = router;
