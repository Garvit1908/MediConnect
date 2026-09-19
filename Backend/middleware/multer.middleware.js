const multer = require("multer");

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, JPG, PNG, and WEBP images are allowed."), false);
  }
};

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

const uploadProfilePic = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

const uploadMedicalDoc = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: medicalDocFileFilter,
});

module.exports = {
  uploadProfilePic,
  uploadMedicalDoc,
};
