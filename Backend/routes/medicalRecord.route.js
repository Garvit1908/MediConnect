const express = require("express");
const router = express.Router();

const {
  uploadMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById,
  deleteMedicalRecord,
} = require("../controllers/medicalRecord.controller");

const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadMedicalDoc } = require("../middleware/multer.middleware");

// 1. Upload Medical Record / Lab Test Document (Patient Only)
router.post(
  "/",
  protect,
  authorize("patient"),
  uploadMedicalDoc.single("document"),
  uploadMedicalRecord
);

// 2. Get All My Medical Records (Patient Only)
router.get("/my", protect, authorize("patient"), getMyMedicalRecords);

// 3. Get Patient Medical Records by Patient ID (Doctor & Admin)
router.get(
  "/patient/:patientId",
  protect,
  authorize("doctor", "admin"),
  getPatientMedicalRecords
);

// 4. Get Specific Medical Record By ID (Owner Patient, Authorized Doctor, Admin)
router.get(
  "/:id",
  protect,
  authorize("patient", "doctor", "admin"),
  getMedicalRecordById
);

// 5. Delete Medical Record (Patient Only)
router.delete("/:id", protect, authorize("patient", "admin"), deleteMedicalRecord);

module.exports = router;
