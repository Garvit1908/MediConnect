const express = require("express");
const router = express.Router();

const {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionById,
  getPrescriptionByAppointmentId,
  updatePrescription,
} = require("../controllers/prescription.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

router.post("/", protect, authorize("doctor"), createPrescription);

router.get("/my", protect, authorize("patient", "doctor"), getMyPrescriptions);

router.get(
  "/appointment/:appointmentId",
  protect,
  authorize("patient", "doctor"),
  getPrescriptionByAppointmentId
);

router.get("/:id", protect, authorize("patient", "doctor"), getPrescriptionById);

router.put("/:id", protect, authorize("doctor"), updatePrescription);

module.exports = router;
