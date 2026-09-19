const Appointment = require("../models/appointment.model");
const Doctor = require("../models/doctor.model");
const Patient = require("../models/patient.model");

class RoomManager {

  static async validateRoomAccess(roomId, user) {

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

        if (process.env.NODE_ENV !== "production") {
          return { authorized: true, appointment: null };
        }
        return { authorized: false, reason: "Appointment room not found" };
      }

      if (appointment.status !== "confirmed") {
        return {
          authorized: false,
          reason: `Consultation room is locked. Appointment status is '${appointment.status}'. Payment must be completed.`,
        };
      }

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

  static getParticipantCount(io, roomId) {
    const room = io.sockets.adapter.rooms.get(roomId);
    return room ? room.size : 0;
  }
}

module.exports = RoomManager;
