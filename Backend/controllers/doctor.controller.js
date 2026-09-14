const mongoose = require("mongoose");
const Doctor = require("../models/doctor.model");

// 1. Create Doctor Profile (Doctor only)
exports.createDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      qualification,
      consultationFee,
      availability,
    } = req.body;

    // Validate required fields
    if (!specialization || experience === undefined || !qualification || consultationFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide specialization, experience, qualification, and consultationFee",
      });
    }

    // Check if doctor profile already exists for this user
    const existingDoctor = await Doctor.findOne({ userId: req.user._id });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor profile already exists. Please use update profile instead.",
      });
    }

    const newDoctor = await Doctor.create({
      userId: req.user._id,
      specialization,
      experience,
      qualification,
      consultationFee,
      availability: availability || [],
    });

    return res.status(201).json({
      success: true,
      message: "Doctor profile created successfully",
      data: newDoctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error creating doctor profile",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 2. Get Logged-in Doctor's Own Profile
exports.getMyDoctorProfile = async (req, res) => {
  try {
    const doctorData = await Doctor.findOne({ userId: req.user._id }).populate(
      "userId",
      "username email phone profilePicUrl"
    );

    if (!doctorData) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found. Please create one first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor profile fetched successfully",
      data: doctorData,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching doctor profile",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 3. Update Doctor Profile & Availability
exports.updateDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      qualification,
      consultationFee,
      availability,
    } = req.body;

    const updatedDoctor = await Doctor.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          specialization,
          experience,
          qualification,
          consultationFee,
          availability,
        },
      },
      { new: true, runValidators: true }
    ).populate("userId", "username email phone profilePicUrl");

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found. Please create your profile first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      data: updatedDoctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error updating doctor profile",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 4. Get All Doctors (Public / Search / Filter)
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialization, maxFee, minExp } = req.query;

    const filter = {};
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" }; // Case-insensitive search
    }
    if (maxFee) {
      filter.consultationFee = { $lte: Number(maxFee) };
    }
    if (minExp) {
      filter.experience = { $gte: Number(minExp) };
    }

    const doctors = await Doctor.find(filter).populate(
      "userId",
      "username email phone profilePicUrl"
    );

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error fetching doctors list",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 5. Get Doctor By ID (Public / Detail View)
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if MongoDB ObjectId format is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Doctor ID format",
      });
    }

    const doctorData = await Doctor.findById(id).populate(
      "userId",
      "username email phone profilePicUrl"
    );

    if (!doctorData) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor details fetched successfully",
      data: doctorData,
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid Doctor ID format",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Error fetching doctor details",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 6. Verify / Toggle Doctor Verification (Admin only)
exports.verifyDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Doctor ID format",
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { isVerified: isVerified !== undefined ? Boolean(isVerified) : true },
      { new: true }
    ).populate("userId", "username email phone profilePicUrl");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Doctor ${doctor.isVerified ? "verified" : "unverified"} successfully`,
      data: doctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying doctor",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

