const appointment = require("../models/appointment.model");
const Doctor = require("../models/doctor.model");
const Patient = require("../models/patient.model");
const mongoose = require("mongoose");

// ---------- Helpers ----------
const isValidDate = (date) => !isNaN(new Date(date).getTime());

const isPastDate = (date) => {
  let d;
  if (typeof date === "string" && date.includes("-")) {
    const parts = date.split("T")[0].split("-").map(Number);
    d = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  } else {
    d = new Date(date);
    d.setHours(0, 0, 0, 0);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

const isDoctorWorkingAtSlot = (doctorAvailability, slotDate, slotTime) => {
  if (!doctorAvailability || doctorAvailability.length === 0) return { valid: true };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let bookingDay;
  if (typeof slotDate === "string" && slotDate.includes("-")) {
    const parts = slotDate.split("T")[0].split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    bookingDay = days[d.getDay()];
  } else {
    bookingDay = days[new Date(slotDate).getDay()];
  }
  const daySchedule = doctorAvailability.find((a) => a.day === bookingDay);

  if (!daySchedule) return { valid: false, message: `Doctor is not available on ${bookingDay}s` };
  if (slotTime < daySchedule.startTime || slotTime >= daySchedule.endTime) {
    return {
      valid: false,
      message: `Doctor is only available between ${daySchedule.startTime} and ${daySchedule.endTime} on ${bookingDay}`,
    };
  }
  return { valid: true };
};

const isAuthorizedForAppointment = async (appointmentDoc, userId, userRole) => {
  if (userRole === "admin") return true;

  const apptPatientDocId = (appointmentDoc.patientId?._id || appointmentDoc.patientId)?.toString();
  const apptDoctorDocId = (appointmentDoc.doctorId?._id || appointmentDoc.doctorId)?.toString();

  if (userRole === "patient") {
    const patient = await Patient.findOne({ userId });
    return Boolean(patient && apptPatientDocId === patient._id.toString());
  }
  if (userRole === "doctor") {
    const doctor = await Doctor.findOne({ userId });
    return Boolean(doctor && apptDoctorDocId === doctor._id.toString());
  }
  return false;
};

// ---------- 1. Book Appointment ----------
exports.bookappointment = async (req, res) => {
  try {
    const { doctorId, slotDate, slotTime } = req.body;

    if (!doctorId || !slotDate || !slotTime) {
      return res.status(400).json({ success: false, message: "Please provide doctorId, slotDate, and slotTime" });
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: "Invalid doctorId format" });
    }
    if (!isValidDate(slotDate)) {
      return res.status(400).json({ success: false, message: "Invalid slotDate format" });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Please complete your patient profile before booking an appointment.",
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });
    if (!doctor.isVerified) {
      return res.status(400).json({ success: false, message: "This doctor is not yet verified for consultations" });
    }
    if (isPastDate(slotDate)) {
      return res.status(400).json({ success: false, message: "Cannot book an appointment in the past" });
    }

    const scheduleCheck = isDoctorWorkingAtSlot(doctor.availability, slotDate, slotTime);
    if (!scheduleCheck.valid) {
      return res.status(400).json({ success: false, message: scheduleCheck.message });
    }

    // No manual duplicate-check needed — the unique partial index + catch(11000) below
    // handles this atomically and is race-condition-proof (a manual findOne isn't).
    const newAppointment = await appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      slotDate: new Date(slotDate),
      slotTime,
      consultationFee: doctor.consultationFee,
      roomId: `room_${new mongoose.Types.ObjectId().toString()}`,
      status: doctor.consultationFee > 0 ? "pending" : "confirmed",
    });

    return res.status(201).json({ success: true, message: "Appointment booked successfully", data: newAppointment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked. Please choose another date or time.",
      });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error", ...(process.env.NODE_ENV !== "production" && { error: err.message }) });
  }
};

// ---------- 2. Get My Appointments ----------
exports.getmyappointment = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (!patient) return res.status(404).json({ success: false, message: "Patient profile not found" });
      filter.patientId = patient._id;
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) return res.status(404).json({ success: false, message: "Doctor profile not found" });
      filter.doctorId = doctor._id;
    }

    const appointments = await appointment
      .find(filter)
      .populate({ path: "doctorId", populate: { path: "userId", select: "username email phone profilePicUrl" } })
      .populate({ path: "patientId", populate: { path: "userId", select: "username email phone profilePicUrl" } })
      .sort({ slotDate: -1 });

    return res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching appointments", ...(process.env.NODE_ENV !== "production" && { error: err.message }) });
  }
};

// ---------- 3. Get Appointment By ID ----------
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Appointment ID format" });
    }

    const appointmentData = await appointment
      .findById(id)
      .populate({ path: "doctorId", populate: { path: "userId", select: "username email phone profilePicUrl" } })
      .populate({ path: "patientId", populate: { path: "userId", select: "username email phone profilePicUrl" } });

    if (!appointmentData) return res.status(404).json({ success: false, message: "Appointment not found" });

    const isAllowed = await isAuthorizedForAppointment(appointmentData, req.user._id, req.user.role);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to view this appointment.",
      });
    }

    return res.status(200).json({ success: true, data: appointmentData });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching appointment details", ...(process.env.NODE_ENV !== "production" && { error: err.message }) });
  }
};

// ---------- 4. Cancel Appointment ----------
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Appointment ID format" });
    }

    const appointmentData = await appointment.findById(id);
    if (!appointmentData) return res.status(404).json({ success: false, message: "Appointment not found" });

    const isAllowed = await isAuthorizedForAppointment(appointmentData, req.user._id, req.user.role);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to cancel this appointment.",
      });
    }

    if (appointmentData.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Appointment is already cancelled" });
    }
    if (appointmentData.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an appointment that has already been completed",
      });
    }

    appointmentData.status = "cancelled";
    await appointmentData.save();

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully. Slot is now free for booking.",
      data: appointmentData,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error cancelling appointment", ...(process.env.NODE_ENV !== "production" && { error: err.message }) });
  }
};

// ---------- 5. Update / Reschedule Appointment ----------
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, slotDate, slotTime } = req.body;

    if (!status && !slotDate && !slotTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update (status, slotDate, or slotTime)",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Appointment ID format" });
    }

    const existingAppointment = await appointment.findById(id);
    if (!existingAppointment) return res.status(404).json({ success: false, message: "Appointment not found" });

    const isAllowed = await isAuthorizedForAppointment(existingAppointment, req.user._id, req.user.role);
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not authorized to modify this appointment.",
      });
    }

    if (existingAppointment.status === "completed" || existingAppointment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot modify an appointment that is already ${existingAppointment.status}. Please book a new appointment.`,
      });
    }

    // Reschedule
    if (slotDate || slotTime) {
      const targetDate = slotDate ? new Date(slotDate) : existingAppointment.slotDate;
      const targetTime = slotTime || existingAppointment.slotTime;

      if (slotDate && !isValidDate(slotDate)) {
        return res.status(400).json({ success: false, message: "Invalid slotDate format" });
      }
      if (isPastDate(targetDate)) {
        return res.status(400).json({ success: false, message: "Cannot reschedule an appointment to a past date" });
      }

      const doctor = await Doctor.findById(existingAppointment.doctorId);
      if (doctor) {
        const scheduleCheck = isDoctorWorkingAtSlot(doctor.availability, targetDate, targetTime);
        if (!scheduleCheck.valid) {
          return res.status(400).json({ success: false, message: scheduleCheck.message });
        }
      }

      const isSlotTaken = await appointment.findOne({
        _id: { $ne: id },
        doctorId: existingAppointment.doctorId,
        slotDate: targetDate,
        slotTime: targetTime,
        status: { $ne: "cancelled" },
      });
      if (isSlotTaken) {
        return res.status(409).json({
          success: false,
          message: "The selected time slot is already booked by another patient. Please choose another date or time.",
        });
      }

      existingAppointment.slotDate = targetDate;
      existingAppointment.slotTime = targetTime;
    }

    // Status transition
    if (status) {
      const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
        });
      }
      if (req.user.role === "patient" && status !== "cancelled") {
        return res.status(403).json({
          success: false,
          message: "Patients are only allowed to change status to 'cancelled'. Confirmation and completion are managed by doctors.",
        });
      }
      if (req.user.role === "doctor" && existingAppointment.status === "confirmed" && status === "pending") {
        return res.status(400).json({ success: false, message: "Cannot revert a confirmed appointment back to pending" });
      }
      existingAppointment.status = status;
    }

    await existingAppointment.save();
    return res.status(200).json({ success: true, message: "Appointment updated successfully", data: existingAppointment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This slot is already booked. Please choose another date or time.",
      });
    }
    return res.status(500).json({ success: false, message: "Error updating appointment", ...(process.env.NODE_ENV !== "production" && { error: err.message }) });
  }
};