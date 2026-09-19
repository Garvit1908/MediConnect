const mongoose=require("mongoose");
const razorpay=require("../config/razorpay");
const Payment = require("../models/payment.model");
const Appointment = require("../models/appointment.model");
const Patient = require("../models/patient.model");

exports.createorder = async(req,res) => {
    try{
        const { appointmentId } = req.body;

        if (!appointmentId) {
            return res.status(400).json({ success: false, message: "please provide Appointment Id" });
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
                message: "Patient profile not found. Please complete your profile first.",
            });
        }

         const appointmentDoc = await Appointment.findById(appointmentId).populate("doctorId");
                if (!appointmentDoc) {
                return res.status(404).json({
                    success: false,
                    message: "Appointment not found",
                });
            }

        if (appointmentDoc.patientId.toString() !== patient._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only pay for your own appointments.",
            });
        }

        if (appointmentDoc.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot pay for a cancelled appointment. Please book a new slot.",
            });
        }
        if (appointmentDoc.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "This appointment has already been completed.",
            });
        }

            const existingSuccessfulPayment = await Payment.findOne({
            appointmentId: appointmentDoc._id,
            status: "completed",
            });
            if (existingSuccessfulPayment) {
                return res.status(400).json({
                    success: false,
                    message: "Payment has already been completed for this appointment.",
                });
            }

        const amountInPaise = Math.round(appointmentDoc.consultationFee * 100);

         if (!amountInPaise || amountInPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid consultation fee for this appointment.",
            });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Razorpay credentials are not configured on the server",
            });
        }

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_appt_${appointmentDoc._id.toString().slice(-10)}`,
            notes: {
                appointmentId: appointmentDoc._id.toString(),
                patientId: patient._id.toString(),
                doctorId: appointmentDoc.doctorId?._id?.toString() || "",
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        await Payment.findOneAndUpdate(
            {
                appointmentId: appointmentDoc._id,
                status: { $ne: "completed" },
            },
            {
                $set: {
                    patientId: patient._id,
                    amount: appointmentDoc.consultationFee,
                    razorpayOrderId: razorpayOrder.id,
                    status: "pending",
                },
                $setOnInsert: {
                    appointmentId: appointmentDoc._id,
                },
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Razorpay order created successfully",
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            appointmentId: appointmentDoc._id,
            consultationFee: appointmentDoc.consultationFee,
        });
    }
    catch (err) {
        console.error("Error in createOrder:", err);
        return res.status(500).json({
        success: false,
        message: "Error creating payment order",
        ...(process.env.NODE_ENV !== "production" && { error: err.message }),
        });
    }
}
