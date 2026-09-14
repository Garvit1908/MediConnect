const mongoose = require("mongoose");
const Prescription = require("../models/prescription.model");
const Appointment = require("../models/appointment.model");
const Doctor = require("../models/doctor.model");
const Patient = require("../models/patient.model");

// ---------- Helpers ----------
const isValidDate = (date) => !isNaN(new Date(date).getTime());

const isPastDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

// Helper: Check if logged-in user is the Patient or Doctor of this prescription (or Admin)
const isAuthorizedForPrescription = async (prescriptionDoc, userId, userRole) => {
  if (userRole === "admin") return true;

  const prescPatientDocId = (prescriptionDoc.patientId?._id || prescriptionDoc.patientId)?.toString();
  const prescDoctorDocId = (prescriptionDoc.doctorId?._id || prescriptionDoc.doctorId)?.toString();

  if (userRole === "patient") {
    const patient = await Patient.findOne({ userId });
    return Boolean(patient && prescPatientDocId === patient._id.toString());
  }

  if (userRole === "doctor") {
    const doctor = await Doctor.findOne({ userId });
    return Boolean(doctor && prescDoctorDocId === doctor._id.toString());
  }

  return false;
};

// 1. Create Prescription (Doctor Only, on "completed" appointments only)
exports.createPrescription = async (req, res) => {
  try {
    const { appointmentId, diagnosis, medicines, followUpDate } = req.body;

    // Validate required fields
    if (!appointmentId || !diagnosis || typeof diagnosis !== "string" || !diagnosis.trim() || !medicines) {
      return res.status(400).json({
        success: false,
        message: "Please provide appointmentId, non-empty diagnosis, and medicines list",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointmentId format",
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Medicines must be a non-empty array with at least one medicine",
      });
    }

    // Validate structure of each medicine item
    for (const med of medicines) {
      if (
        !med.name || typeof med.name !== "string" || !med.name.trim() ||
        !med.dosage || typeof med.dosage !== "string" || !med.dosage.trim() ||
        !med.frequency || typeof med.frequency !== "string" || !med.frequency.trim() ||
        !med.duration || typeof med.duration !== "string" || !med.duration.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Each medicine must include non-empty strings for: name, dosage, frequency, and duration",
        });
      }
    }

    // Validate followUpDate if provided
    if (followUpDate) {
      if (!isValidDate(followUpDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid followUpDate format",
        });
      }
      if (isPastDate(followUpDate)) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date cannot be in the past",
        });
      }
    }

    // Check doctor profile
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Find the appointment
    const targetAppointment = await Appointment.findById(appointmentId);
    if (!targetAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Ownership check: Is this appointment assigned to the logged-in doctor?
    if (targetAppointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only create prescriptions for your own appointments.",
      });
    }

    // Strict Status Check: Prescription can ONLY be created for "completed" appointments
    if (targetAppointment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: `Prescriptions can only be created for completed appointments. Current status is '${targetAppointment.status}'. Please complete the consultation first.`,
      });
    }

    // Check if prescription already exists for this appointment
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return res.status(409).json({
        success: false,
        message: "A prescription has already been created for this appointment. Use update if you want to modify it.",
      });
    }

    // Sanitize medicines list
    const sanitizedMedicines = medicines.map((med) => ({
      name: med.name.trim(),
      dosage: med.dosage.trim(),
      frequency: med.frequency.trim(),
      duration: med.duration.trim(),
      instructions: med.instructions ? med.instructions.trim() : undefined,
    }));

    // Create prescription
    const newPrescription = await Prescription.create({
      appointmentId: targetAppointment._id,
      doctorId: doctor._id,
      patientId: targetAppointment.patientId,
      diagnosis: diagnosis.trim(),
      medicines: sanitizedMedicines,
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    const populatedPrescription = await Prescription.findById(newPrescription._id)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "username email phone" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "username email phone" },
      })
      .populate("appointmentId", "slotDate slotTime consultationFee status");

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: populatedPrescription,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A prescription already exists for this appointment",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 2. Get My Prescriptions (Patient or Doctor)
exports.getMyPrescriptions = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) {
        return res.status(404).json({ success: false, message: "Patient profile not found" });
      }
      filter.patientId = patient._id;
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor profile not found" });
      }
      filter.doctorId = doctor._id;
    }

    const prescriptions = await Prescription.find(filter)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "username email phone profilePicUrl" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "username email phone profilePicUrl" },
      })
      .populate("appointmentId", "slotDate slotTime consultationFee status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching prescriptions",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 3. Get Prescription By ID
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Prescription ID format",
      });
    }

    const prescriptionData = await Prescription.findById(id)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "username email phone profilePicUrl" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "username email phone" },
      })
      .populate("appointmentId", "slotDate slotTime consultationFee status");

    if (!prescriptionData) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Ownership check
    const isAllowed = await isAuthorizedForPrescription(prescriptionData, req.user._id, req.user.role);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to view this prescription.",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescriptionData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching prescription details",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 4. Get Prescription By Appointment ID
exports.getPrescriptionByAppointmentId = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Appointment ID format",
      });
    }

    const prescriptionData = await Prescription.findOne({ appointmentId })
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "username email phone" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "username email phone" },
      })
      .populate("appointmentId", "slotDate slotTime consultationFee status");

    if (!prescriptionData) {
      return res.status(404).json({
        success: false,
        message: "No prescription found for this appointment",
      });
    }

    // Ownership check
    const isAllowed = await isAuthorizedForPrescription(prescriptionData, req.user._id, req.user.role);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to view this prescription.",
      });
    }

    return res.status(200).json({
      success: true,
      data: prescriptionData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching prescription details",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 5. Update Prescription (Doctor Only)
exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, medicines, followUpDate } = req.body;

    if (!diagnosis && !medicines && !followUpDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update (diagnosis, medicines, or followUpDate)",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Prescription ID format",
      });
    }

    const existingPrescription = await Prescription.findById(id);
    if (!existingPrescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Only the doctor who issued the prescription (or admin) can update it
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || existingPrescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only the doctor who created this prescription can update it.",
      });
    }

    if (medicines) {
      if (!Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Medicines must be a non-empty array",
        });
      }

      for (const med of medicines) {
        if (
          !med.name || typeof med.name !== "string" || !med.name.trim() ||
          !med.dosage || typeof med.dosage !== "string" || !med.dosage.trim() ||
          !med.frequency || typeof med.frequency !== "string" || !med.frequency.trim() ||
          !med.duration || typeof med.duration !== "string" || !med.duration.trim()
        ) {
          return res.status(400).json({
            success: false,
            message: "Each medicine must include non-empty strings for: name, dosage, frequency, and duration",
          });
        }
      }

      const sanitizedMedicines = medicines.map((med) => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency.trim(),
        duration: med.duration.trim(),
        instructions: med.instructions ? med.instructions.trim() : undefined,
      }));

      existingPrescription.medicines = sanitizedMedicines;
    }

    if (diagnosis) {
      if (typeof diagnosis !== "string" || !diagnosis.trim()) {
        return res.status(400).json({
          success: false,
          message: "Diagnosis must be a non-empty string",
        });
      }
      existingPrescription.diagnosis = diagnosis.trim();
    }

    if (followUpDate) {
      if (!isValidDate(followUpDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid followUpDate format",
        });
      }
      if (isPastDate(followUpDate)) {
        return res.status(400).json({
          success: false,
          message: "Follow-up date cannot be in the past",
        });
      }
      existingPrescription.followUpDate = new Date(followUpDate);
    }

    await existingPrescription.save();

    const updatedPrescription = await Prescription.findById(existingPrescription._id)
      .populate({
        path: "doctorId",
        populate: { path: "userId", select: "username email phone" },
      })
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "username email phone" },
      })
      .populate("appointmentId", "slotDate slotTime consultationFee status");

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: updatedPrescription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error updating prescription",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};
