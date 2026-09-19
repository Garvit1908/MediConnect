const bcrypt = require("bcrypt");
const User = require("../models/user.model");

async function seedAdmin() {
  try {
    if (!process.env.ADMIN_EMAIL) {
      return;
    }
    const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    let user = await User.findOne({ email: adminEmail }).select("+password");

    if (user) {
      let updated = false;

      if (user.role !== "admin") {
        user.role = "admin";
        updated = true;
      }

      if (adminPassword) {
        user.password = adminPassword;
        user.authProvider = "local";
        updated = true;
      }

      if (updated) {
        await user.save({ validateBeforeSave: false });
        console.log(`🛡️  Admin Seeder: Promoted/updated account '${adminEmail}' to role 'admin'.`);
      } else {
        console.log(`🛡️  Admin Seeder: Account '${adminEmail}' verified as active admin.`);
      }
      return user;
    }

    const baseUsername = adminEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

    let username = baseUsername;
    let counter = 1;
    while (await User.exists({ username })) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }

    const adminPayload = {
      email: adminEmail,
      username,
      role: "admin",
    };

    if (adminPassword) {
      adminPayload.password = adminPassword;
      adminPayload.authProvider = "local";
    } else {

      adminPayload.authProvider = "google";
    }

    const newAdmin = await User.create(adminPayload);

    console.log(
      `🛡️  Admin Seeder: Successfully initialized primary admin account: ${adminEmail} (${adminPassword ? "Password Auth + Google Auth" : "Google OAuth Protected"
      })`
    );
    return newAdmin;
  } catch (error) {
    console.error("⚠️  Admin Seeder Error:", error.message);
  }
}

module.exports = { seedAdmin };
