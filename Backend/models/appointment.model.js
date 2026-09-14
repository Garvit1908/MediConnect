const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    slotDate: {
      type: Date,
      required: true,
    },
    slotTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    consultationFee: {
      type: Number,
      required: true, // Snapshot of doctor's fee at booking time
    },
    roomId: {
      type: String, // WebRTC room identifier
    },
  },
  { timestamps: true }
);

// Prevent double-booking: guarantees at DB level that 2 patients cannot book the same doctor slot unless cancelled
appointmentSchema.index(
  { doctorId: 1, slotDate: 1, slotTime: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } }
);

module.exports = mongoose.model("Appointment", appointmentSchema);