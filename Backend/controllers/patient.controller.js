const Patient = require("../models/patient.model");
const Doctor = require("../models/doctor.model");
const Appointment = require("../models/appointment.model");
const mongoose = require("mongoose");

// for doctor to fetch patient profile from id 
exports.getpatient = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid patient ID" });
        }

        const patientdata = await Patient.findById(id)
            .select("userId age gender bloodGroup address medicalHistory")
            .populate("userId", "username email phone profilePicUrl");

        if (!patientdata) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        if (req.user.role === "patient") {
            if (patientdata.userId?._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: "You can only view your own patient profile" });
            }
        } else if (req.user.role === "doctor") {
            const doctor = await Doctor.findOne({ userId: req.user._id }).select("_id");
            const hasActiveAppointment = doctor && await Appointment.exists({
                doctorId: doctor._id,
                patientId: patientdata._id,
                status: { $ne: "cancelled" },
            });
            if (!hasActiveAppointment) {
                return res.status(403).json({
                    success: false,
                    message: "You may only view patients with an active appointment",
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "patient info successfully fetched",
            data: patientdata
        })
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "error getting data"
        })
    }
}

// controller to patient get his own profile
exports.getMyPatientProfile = async (req, res) => {
    try {
        const patientdata = await Patient.findOne({ userId: req.user._id })
            .populate("userId", "username email");

        if (!patientdata) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found. Please create one first.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Your patient info fetched successfully",
            data: patientdata,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error getting data",
            ...(process.env.NODE_ENV !== "production" && { error: err.message }),
        });
    }
};

exports.createpatient = async (req, res) => {
    try {
        const { age, gender, bloodGroup, address, medicalHistory } = req.body;

        const existingPatient = await Patient.findOne({ userId: req.user._id });

        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: "Patient profile already exists. Please use update profile instead.",
            });
        }

        const newPatient = await Patient.create({
            userId: req.user._id, // Auth middleware se logged-in user ki ID
            age,
            gender,
            bloodGroup,
            address,
            medicalHistory: medicalHistory || [],
        });

        return res.status(201).json({
            success: true,
            message: "Patient profile created successfully",
            data: newPatient,
        });
    }
    catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error creating patient profile",
            ...(process.env.NODE_ENV !== "production" && { error: err.message }),
        });
    }
}


// updateProfile 
exports.updatepatient = async (req, res) => {
    try {
        const { age, gender, bloodGroup, address, medicalHistory } = req.body;

        const updatedPatient = await Patient.findOneAndUpdate(
            { userId: req.user._id },
            { $set: { age, gender, bloodGroup, address, medicalHistory } },
            { new: true, runValidators: true }
        ).populate("userId", "username email phone");

        if (!updatedPatient) {
            return res.status(404).json({
                success: false,
                message: "Patient profile not found. Please create your profile first.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Patient profile updated successfully",
            data: updatedPatient,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Error updating profile",
            ...(process.env.NODE_ENV !== "production" && { error: err.message }),
        });
    }
};
