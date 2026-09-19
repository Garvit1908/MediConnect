const express = require("express");
const router = express.Router();

const {
  getpatient,
  updatepatient,
  createpatient,
  getMyPatientProfile,
} = require("../controllers/patient.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

router.get("/me", protect, authorize("patient"), getMyPatientProfile);
router.post("/", protect, authorize("patient"), createpatient);
router.put("/me", protect, authorize("patient"), updatepatient);

router.get("/:id", protect, authorize("doctor", "admin", "patient"), getpatient);

module.exports = router;
