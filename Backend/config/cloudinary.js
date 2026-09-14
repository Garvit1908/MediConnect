const cloudinary = require("cloudinary").v2;

const cloudinaryConnect = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });
    console.log("Cloudinary connection successful");
  } catch (err) {
    console.log("Cloudinary connection error:", err.message);
  }
};

module.exports = { cloudinary, cloudinaryConnect };
