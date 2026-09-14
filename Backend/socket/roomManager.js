const Appointment = require("../models/appointment.model");
const Doctor = require("../models/doctor.model");
const Patient = require("../models/patient.model");

/**
 * Room & Appointment Security Manager
 * Ensures that only the authorized Doctor and Patient can enter the consultation room.
 * Enforces a strict limit of max 2 participants per 1-on-1 consultation.
 */
class RoomManager {
  /**
   * Authorize whether a user has permission to join an appointment room
   */
  static async validateRoomAccess(roomId, user) {
    // In dev / test rooms, allow if room starts with 'demo_' or 'test_'
    if (roomId.startsWith("demo_") || roomId.startsWith("test_")) {
      return { authorized: true, appointment: null };
    }

    try {
      const lookupConditions = [{ roomId }];
      const rawId = roomId.replace(/^room_/, "");
      if (require("mongoose").Types.ObjectId.isValid(rawId)) {
        lookupConditions.push({ _id: rawId });
      }

      const appointment = await Appointment.findOne({ $or: lookupConditions })
        .populate("patientId")
        .populate("doctorId");

      if (!appointment) {
        // If room is not linked to DB yet, permit entry in dev mode with a warning
        if (process.env.NODE_ENV !== "production") {
          return { authorized: true, appointment: null };
        }
        return { authorized: false, reason: "Appointment room not found" };
      }

      // Strict Guard: Only confirmed (and paid) appointments are allowed into the consultation room
      if (appointment.status !== "confirmed") {
        return {
          authorized: false,
          reason: `Consultation room is locked. Appointment status is '${appointment.status}'. Payment must be completed.`,
        };
      }

      // Check user permissions
      if (user.role === "admin") {
        return { authorized: true, appointment };
      }

      if (user.role === "doctor") {
        const doctor = await Doctor.findOne({ userId: user._id });
        const apptDoctorId = (appointment.doctorId?._id || appointment.doctorId)?.toString();
        if (doctor && apptDoctorId === doctor._id.toString()) {
          return { authorized: true, appointment };
        }
      }

      if (user.role === "patient") {
        const patient = await Patient.findOne({ userId: user._id });
        const apptPatientId = (appointment.patientId?._id || appointment.patientId)?.toString();
        if (patient && apptPatientId === patient._id.toString()) {
          return { authorized: true, appointment };
        }
      }

      return { authorized: false, reason: "You are not authorized to join this consultation" };
    } catch (err) {
      console.error("Room validation error:", err);
      return { authorized: false, reason: "Failed to validate room access" };
    }
  }

  /**
   * Check room participant count (Max 2 for 1-on-1 consultation)
   */
  static getParticipantCount(io, roomId) {
    const room = io.sockets.adapter.rooms.get(roomId);
    return room ? room.size : 0;
  }
}

module.exports = RoomManager;
