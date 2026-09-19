const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/payment.model");
const Appointment = require("../models/appointment.model");
const Patient = require("../models/patient.model");
const mailsender = require("../utils/mailsender");
const { getPaymentSuccessEmailTemplate } = require("../utils/emailTemplates");

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointmentId,
    } = req.body;

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay secret key is not configured on the server",
      });
    }

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !appointmentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide razorpay_order_id, razorpay_payment_id, razorpay_signature, and appointmentId",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Appointment ID format",
      });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    const appointmentDoc = await Appointment.findById(appointmentId);
    if (!appointmentDoc) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointmentDoc.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only verify payment for your own appointment.",
      });
    }

    const paymentRecord = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      appointmentId: appointmentDoc._id,
      patientId: patient._id,
    });

    if (!paymentRecord) {
      return res.status(400).json({
        success: false,
        message: "Payment order mismatch: This Razorpay Order ID is not associated with this appointment.",
      });
    }

    if (paymentRecord.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Payment has already been verified and completed.",
        data: {
          payment: paymentRecord,
          appointment: appointmentDoc,
        },
      });
    }

    const dataToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(dataToSign.toString())
      .digest("hex");

    const isAuthentic =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!isAuthentic) {
      paymentRecord.razorpayPaymentId = razorpay_payment_id;
      paymentRecord.razorpaySignature = razorpay_signature;
      paymentRecord.status = "failed";
      await paymentRecord.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed: Invalid cryptographic signature",
      });
    }

    paymentRecord.razorpayPaymentId = razorpay_payment_id;
    paymentRecord.razorpaySignature = razorpay_signature;
    paymentRecord.status = "completed";
    const updatedPayment = await paymentRecord.save();

    appointmentDoc.status = "confirmed";
    const updatedAppointment = await appointmentDoc.save();

    try {
      const fullAppointment = await Appointment.findById(appointmentDoc._id).populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "username email",
        },
      });

      const doctorUser = fullAppointment?.doctorId?.userId;
      const doctorSpecialization = fullAppointment?.doctorId?.specialization || "Specialist";
      const doctorName = doctorUser?.username || "Doctor";

      const formattedDate = new Date(appointmentDoc.slotDate).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const emailHtml = getPaymentSuccessEmailTemplate({
        patientName: req.user.username || "Valued Patient",
        doctorName,
        doctorSpecialization,
        slotDate: formattedDate,
        slotTime: appointmentDoc.slotTime,
        amount: updatedPayment.amount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        appointmentId: appointmentDoc._id,
      });

      await mailsender(
        req.user.email,
        `Payment Successful & Appointment Confirmed - Dr. ${doctorName} [MediConnect]`,
        emailHtml
      );
      console.log(`Payment confirmation email sent to ${req.user.email}`);
    } catch (mailErr) {

      console.error("Non-fatal error sending payment confirmation email:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Appointment is confirmed!",
      data: {
        payment: updatedPayment,
        appointment: updatedAppointment,
      },
    });
  } catch (err) {
    console.error("Error in verifyPayment:", err);
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    const payments = await Payment.find({
      patientId: patient._id,
      status: "completed",
    })
      .populate({
        path: "appointmentId",
        populate: {
          path: "doctorId",
          select: "specialization qualification",
          populate: {
            path: "userId",
            select: "username email profilePicUrl",
          },
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (err) {
    console.error("Error in getMyPayments:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching payment receipts",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};
