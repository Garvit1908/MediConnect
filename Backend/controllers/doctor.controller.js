const mongoose = require("mongoose");
const Doctor = require("../models/doctor.model");
const User = require("../models/user.model");
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


// 7. AI Symptom Matcher: Match Doctors by Patient Symptoms
exports.matchDoctorBySymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Please describe your symptoms with at least 3 characters.",
      });
    }

    const { analyzeSymptoms } = require("../utils/symptomAnalyzer");
    const triage = await analyzeSymptoms(symptoms.trim());

    // Search doctors matching primary specialization (regex for flexible match like 'Cardio')
    const primaryKeyword = triage.primarySpecialization.split(" ")[0];
    const primaryRegex = new RegExp(primaryKeyword, "i");

    let matchingDoctors = await Doctor.find({
      specialization: { $regex: primaryRegex },
      isVerified: true,
    })
      .populate("userId", "username email phone profilePicUrl")
      .sort({ experience: -1, consultationFee: 1 });

    // If fewer than 2 doctors, include secondary specialization
    if (matchingDoctors.length < 2 && triage.secondarySpecialization) {
      const secondaryKeyword = triage.secondarySpecialization.split(" ")[0];
      const secondaryRegex = new RegExp(secondaryKeyword, "i");

      const existingIds = matchingDoctors.map((d) => d._id);
      const secondaryDoctors = await Doctor.find({
        specialization: { $regex: secondaryRegex },
        isVerified: true,
        _id: { $nin: existingIds },
      })
        .populate("userId", "username email phone profilePicUrl")
        .sort({ experience: -1, consultationFee: 1 });

      matchingDoctors = [...matchingDoctors, ...secondaryDoctors];
    }

    // Fallback: If no verified doctors found, show any matching doctors
    if (matchingDoctors.length === 0) {
      matchingDoctors = await Doctor.find({
        specialization: { $regex: primaryRegex },
      })
        .populate("userId", "username email phone profilePicUrl")
        .sort({ experience: -1, consultationFee: 1 });
    }

    // Safety fallback: if no specialist in DB yet, show available verified doctors
    if (matchingDoctors.length === 0) {
      matchingDoctors = await Doctor.find({ isVerified: true })
        .populate("userId", "username email phone profilePicUrl")
        .limit(6);
    }
    if (matchingDoctors.length === 0) {
      matchingDoctors = await Doctor.find({})
        .populate("userId", "username email phone profilePicUrl")
        .limit(6);
    }

    return res.status(200).json({
      success: true,
      message: "Symptoms analyzed and matching specialists identified.",
      triage,
      count: matchingDoctors.length,
      data: matchingDoctors,
    });
  } catch (err) {
    console.error("AI Symptom Match Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error analyzing symptoms",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};


// 8. AI Lab Report Summarizer Endpoint
exports.summarizeReport = async (req, res) => {
  try {
    const { reportText } = req.body;
    if (!reportText || typeof reportText !== "string" || reportText.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide medical report text with at least 5 characters.",
      });
    }

    const { summarizeMedicalReport } = require("../utils/symptomAnalyzer");
    const summary = await summarizeMedicalReport(reportText.trim());

    return res.status(200).json({
      success: true,
      message: "Report summarized successfully.",
      data: summary,
    });
  } catch (err) {
    console.error("AI Report Summarizer Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error summarizing medical report",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};

// 9. MediConnect AI Conversational Health Assistant
exports.aiHealthChat = async (req, res) => {
  try {
    const { message, chatHistory, context } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const { handleAIChat } = require("../utils/symptomAnalyzer");
    const result = await handleAIChat(message.trim(), chatHistory || [], context || null);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("AI Health Chat Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error processing AI chat",
      ...(process.env.NODE_ENV !== "production" && { error: err.message }),
    });
  }
};
