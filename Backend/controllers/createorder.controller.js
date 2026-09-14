const mongoose=require("mongoose");
const razorpay=require("../config/razorpay");
const Payment = require("../models/payment.model");
const Appointment = require("../models/appointment.model");
const Patient = require("../models/patient.model");

// ==========================================
// CREATE RAZORPAY ORDER (Patient Only)
// ==========================================

exports.createorder = async(req,res) => {
    try{
        const { appointmentId } = req.body;

        //validate appointment
        if (!appointmentId) {
            return res.status(400).json({ success: false, message: "please provide Appointment Id" });
        }

        if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Appointment ID format",
            });
        }

        // 2. Logged-in Patient profile fetch karo
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
        
        // 4. Ownership Check: Sirf wahi patient pay kare jiska appointment hai
        if (appointmentDoc.patientId.toString() !== patient._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only pay for your own appointments.",
            });
        }

        // 5. State Guard: Cancelled ya Completed appointment par payment allow mat karo
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

        // 6. Check if already paid
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
        // 7. Security: Amount DB se calculate karo (never trust req.body!)
        // Razorpay amount paise mein leta hai (1 Rupee = 100 Paise)
        const amountInPaise = Math.round(appointmentDoc.consultationFee * 100);

         if (!amountInPaise || amountInPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid consultation fee for this appointment.",
            });
        }

        // 0. Environment Key Check
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Razorpay credentials are not configured on the server",
            });
        }

        // 8. Razorpay Order generate karo
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_appt_${appointmentDoc._id.toString().slice(-10)}`, // Max 40 chars safe
            notes: {
                appointmentId: appointmentDoc._id.toString(),
                patientId: patient._id.toString(),
                doctorId: appointmentDoc.doctorId?._id?.toString() || "",
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // 9. Initial Payment entry save/update karo DB mein (Explicit $set and $setOnInsert for safe upsert)
        await Payment.findOneAndUpdate(
            {
                appointmentId: appointmentDoc._id,
                status: { $ne: "completed" }, // Only match non-completed payments
            },
            {
                $set: {
                    patientId: patient._id,
                    amount: appointmentDoc.consultationFee, // In Rupees
                    razorpayOrderId: razorpayOrder.id,
                    status: "pending",
                },
                $setOnInsert: {
                    appointmentId: appointmentDoc._id,
                },
            },
            { upsert: true, new: true }
        );

        // 10. Client ko response bhejo checkout open karne ke liye
        return res.status(200).json({
            success: true,
            message: "Razorpay order created successfully",
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount, // Paise mein
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