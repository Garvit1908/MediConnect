const multer = require("multer");

// In-Memory Storage: buffer directly Cloudinary ko stream hota hai (no leftover files on server disk)
const storage = multer.memoryStorage();

// 1. Image Filter (Profile pictures: JPG, PNG, WEBP)
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, JPG, PNG, and WEBP images are allowed."), false);
  }
};

// 2. Document & Image Filter (Medical Records: Images + PDF)
const medicalDocFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF documents and Images (JPG, PNG, WEBP) are allowed."), false);
  }
};

// Upload for Profile Picture (Max 15MB)
const uploadProfilePic = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: imageFileFilter,
});

// Upload for Medical Reports / Documents (Max 25MB)
const uploadMedicalDoc = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: medicalDocFileFilter,
});

module.exports = {
  uploadProfilePic,
  uploadMedicalDoc,
};
