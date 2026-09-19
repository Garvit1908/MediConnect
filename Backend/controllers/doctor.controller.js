const mongoose = require("mongoose");
const Doctor = require("../models/doctor.model");
const { getOrSetCache, deleteCache, invalidateCachePattern } = require("../utils/cache");

exports.createDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      qualification,
      consultationFee,
      availability,
    } = req.body;

    if (!specialization || experience === undefined || !qualification || consultationFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide specialization, experience, qualification, and consultationFee",
      });
    }

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

    await invalidateCachePattern("doctors:*");

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

    await invalidateCachePattern("doctors:list:*");
    await deleteCache(`doctors:detail:${updatedDoctor._id}`);

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

exports.getAllDoctors = async (req, res) => {
  try {
    const { specialization, maxFee, minExp } = req.query;

    const filter = {};
    if (specialization) {
      filter.specialization = { $regex: specialization, $options: "i" };
    }
    if (maxFee) {
      filter.consultationFee = { $lte: Number(maxFee) };
    }
    if (minExp) {
      filter.experience = { $gte: Number(minExp) };
    }

    const cacheKey = `doctors:list:${JSON.stringify({
      specialization: specialization ? specialization.toLowerCase().trim() : "",
      maxFee: maxFee || "",
      minExp: minExp || "",
    })}`;

    const doctors = await getOrSetCache(cacheKey, 600, async () => {
      return await Doctor.find(filter).populate(
        "userId",
        "username email phone profilePicUrl"
      );
    });

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

exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Doctor ID format",
      });
    }

    const cacheKey = `doctors:detail:${id}`;

    const doctorData = await getOrSetCache(cacheKey, 600, async () => {
      return await Doctor.findById(id).populate(
        "userId",
        "username email phone profilePicUrl"
      );
    });

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
