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

router.post(
  "/",
  protect,
  authorize("patient"),
  uploadMedicalDoc.single("document"),
  uploadMedicalRecord
);

router.get("/my", protect, authorize("patient"), getMyMedicalRecords);

router.get(
  "/patient/:patientId",
  protect,
  authorize("doctor", "admin"),
  getPatientMedicalRecords
);

router.get(
  "/:id",
  protect,
  authorize("patient", "doctor", "admin"),
  getMedicalRecordById
);

router.delete("/:id", protect, authorize("patient", "admin"), deleteMedicalRecord);

module.exports = router;
