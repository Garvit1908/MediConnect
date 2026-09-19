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

router.post("/", protect, authorize("doctor"), createDoctorProfile);
router.get("/me", protect, authorize("doctor"), getMyDoctorProfile);
router.put("/me", protect, authorize("doctor"), updateDoctorProfile);

router.patch("/:id/verify", protect, authorize("admin"), verifyDoctor);

router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);

module.exports = router;
