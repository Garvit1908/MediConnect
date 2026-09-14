const { cloudinary } = require("../config/cloudinary");
const streamifier = require("stream");

/**
 * Uploads a file buffer directly to Cloudinary using stream upload
 * @param {Buffer} buffer - File buffer from Multer
 * @param {String} folder - Target Cloudinary folder (e.g. 'mediconnect/avatars')
 * @param {Object} options - Optional transformations (e.g. { width: 300, height: 300, crop: "fill" })
 * @returns {Promise<Object>} - Resolves with { secure_url, public_id, format, resource_type }
 */
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

    // Convert Buffer to readable stream and pipe to Cloudinary
    const bufferStream = new streamifier.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

/**
 * Deletes an asset from Cloudinary by its public ID
 * @param {String} publicId - Cloudinary asset public ID
 * @param {String} resourceType - 'image' or 'raw' (default: 'image')
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error("Cloudinary deletion error:", err.message);
    return null;
  }
};

/**
 * Extracts publicId from a Cloudinary URL
 * e.g. "https://res.cloudinary.com/demo/image/upload/v1234567890/mediconnect/avatars/sample.jpg" -> "mediconnect/avatars/sample"
 */
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
