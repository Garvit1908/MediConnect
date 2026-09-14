const mongoose = require("mongoose");
const MedicalRecord = require("../models/medicalRecord.model");
const Patient = require("../models/patient.model");
const Doctor = require("../models/doctor.model");
const Appointment = require("../models/appointment.model");
const { uploadStreamToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

// 1. Upload Medical Record (Patient Only)
exports.uploadMedicalRecord = async (req, res) => {
  let uploadResult = null;
  let resourceType = "image";

  try {
    const { title, recordType, appointmentId, description, recordDate } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document file (PDF, JPEG, JPG, PNG, or WEBP)",
      });
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid non-empty title for the medical record",
      });
    }

    // Validate recordType if provided
    const allowedRecordTypes = [
      "lab_report",
      "x_ray",
      "prescription",
      "mri_scan",
      "discharge_summary",
      "other",
    ];
    if (recordType && !allowedRecordTypes.includes(recordType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid recordType. Must be one of: ${allowedRecordTypes.join(", ")}`,
      });
    }

    // Find logged-in patient profile
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found. Please create your patient profile first.",
      });
    }

    // Optional appointment validation & ownership check
    if (appointmentId) {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Appointment ID format",
        });
      }
      const existingAppointment = await Appointment.findById(appointmentId);
      if (!existingAppointment) {
        return res.status(404).json({
          success: false,
          message: "Associated appointment not found",
        });
      }
      // Ownership check: Appointment must belong to this patient
      if (existingAppointment.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only attach records to your own appointments.",
        });
      }
    }

    // Determine file type
    const isPdf = req.file.mimetype === "application/pdf";
    resourceType = isPdf ? "raw" : "image";

    // Upload directly to Cloudinary
    uploadResult = await uploadStreamToCloudinary(
      req.file.buffer,
      "mediconnect/medical-records",
      {
        resource_type: resourceType,
      }
    );

    const newRecord = await MedicalRecord.create({
      patientId: patient._id,
      appointmentId: appointmentId || undefined,
      title: title.trim(),
      recordType: recordType || "lab_report",
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      fileType: isPdf ? "pdf" : "image",
      description: description ? description.trim() : undefined,
      recordDate: recordDate ? new Date(recordDate) : Date.now(),
    });

    return res.status(201).json({
      success: true,
      message: "Medical record uploaded successfully",
      data: newRecord,
    });
  } catch (err) {
    // Rollback: Delete orphaned file from Cloudinary if MongoDB operation fails
    if (uploadResult?.public_id) {
      await deleteFromCloudinary(uploadResult.public_id, resourceType);
    }

    console.error("Error uploading medical record:", err);
    return res.status(500).json({
      success: false,
      message: "Error uploading medical record",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 2. Get My Medical Records (Patient Only)
exports.getMyMedicalRecords = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    const records = await MedicalRecord.find({ patientId: patient._id })
      .populate("appointmentId", "slotDate slotTime status")
      .sort({ recordDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching medical records",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 3. Get Specific Medical Record By ID (Owner Patient, Authorized Doctor, or Admin)
exports.getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Medical Record ID format",
      });
    }

    const record = await MedicalRecord.findById(id).populate(
      "appointmentId",
      "slotDate slotTime status doctorId"
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    // Ownership & Clinical Authorization Guard
    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || record.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view your own medical records.",
        });
      }
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found",
        });
      }

      // Doctor must have an appointment with this patient to access their records
      const hasAppointment = await Appointment.findOne({
        doctorId: doctor._id,
        patientId: record.patientId,
        status: { $ne: "cancelled" },
      });

      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view records for patients who have an active appointment with you.",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching medical record details",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 4. Get Patient's Medical Records by Patient ID (Doctor with active appointment & Admin)
exports.getPatientMedicalRecords = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Patient ID format",
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Doctor Clinical Privacy Guard:
    // Any random doctor CANNOT view any random patient's records.
    // Doctor MUST have at least one active (non-cancelled) appointment with this patient.
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found",
        });
      }

      const hasAppointment = await Appointment.findOne({
        doctorId: doctor._id,
        patientId: patient._id,
        status: { $ne: "cancelled" },
      });

      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You are only authorized to view medical records for patients who have booked a consultation with you.",
        });
      }
    }

    const records = await MedicalRecord.find({ patientId: patient._id })
      .populate("appointmentId", "slotDate slotTime status")
      .sort({ recordDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching patient medical records",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 5. Delete Medical Record (Patient Only - Deletes DB record + Cloudinary asset)
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Medical Record ID format",
      });
    }

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    // Ownership check: Only the patient who owns this record (or admin) can delete it
    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient || record.patientId.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only delete your own medical records.",
        });
      }
    }

    // Delete asset from Cloudinary
    const cloudinaryResourceType = record.fileType === "pdf" ? "raw" : "image";
    await deleteFromCloudinary(record.publicId, cloudinaryResourceType);

    // Delete document from MongoDB
    await MedicalRecord.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Medical record and file deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting medical record:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting medical record",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};
