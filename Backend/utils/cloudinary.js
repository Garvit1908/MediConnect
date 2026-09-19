const { cloudinary } = require("../config/cloudinary");
const streamifier = require("stream");

const uploadStreamToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    const bufferStream = new streamifier.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary deletion error:", err.message);
    return null;
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/\/v\d+\/(.+?)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

module.exports = {
  uploadStreamToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
