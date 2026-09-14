const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    recordType: {
      type: String,
      enum: [
        "lab_report",
        "x_ray",
        "prescription",
        "mri_scan",
        "discharge_summary",
        "other",
      ],
      default: "lab_report",
    },
    fileUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String, // 'image' or 'pdf' / 'raw'
      default: "image",
    },
    description: {
      type: String,
      trim: true,
    },
    recordDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
