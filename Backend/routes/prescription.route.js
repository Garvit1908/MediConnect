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

// 1. Create Prescription (Doctor Only - on completed appointments)
router.post("/", protect, authorize("doctor"), createPrescription);

// 2. Get All My Prescriptions (Patient or Doctor)
router.get("/my", protect, authorize("patient", "doctor"), getMyPrescriptions);

// 3. Get Prescription By Appointment ID
router.get(
  "/appointment/:appointmentId",
  protect,
  authorize("patient", "doctor"),
  getPrescriptionByAppointmentId
);

// 4. Get Specific Prescription By ID
router.get("/:id", protect, authorize("patient", "doctor"), getPrescriptionById);

// 5. Update Prescription (Doctor Only)
router.put("/:id", protect, authorize("doctor"), updatePrescription);

module.exports = router;
