const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // 1 Appointment can have only 1 Prescription
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
      trim: true,
    },
    medicines: [
      {
        name: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true }, // e.g. "500mg"
        frequency: { type: String, required: true, trim: true }, // e.g. "1-0-1" or "Twice daily"
        duration: { type: String, required: true, trim: true }, // e.g. "5 days"
        instructions: { type: String, trim: true }, // e.g. "After food"
      },
    ],
    followUpDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
