const bcrypt = require("bcrypt");
const User = require("../models/user.model");

/**
 * Idempotent Admin Auto-Seeder
 * Ensures that the designated admin account exists in MongoDB Atlas.
 * - If user already exists: verifies that role is 'admin' (promotes if needed).
 * - If user does not exist: creates user with role 'admin' and hashed password.
 */
async function seedAdmin() {
  try {
    const adminEmail = (
      process.env.ADMIN_EMAIL || "johncen.8091@gmail.com"
    ).toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    // 1. Check if user with this email already exists
    let user = await User.findOne({ email: adminEmail }).select("+password");

    if (user) {
      let updated = false;

      if (user.role !== "admin") {
        user.role = "admin";
        updated = true;
      }

      // If user had no password (e.g., signed up only via Google initially), set local password as fallback
      if (!user.password && user.authProvider === "local") {
        user.password = await bcrypt.hash(adminPassword, 10);
        updated = true;
      }

      if (updated) {
        await user.save({ validateBeforeSave: false });
        console.log(`🛡️  Admin Seeder: Promoted existing account '${adminEmail}' to role 'admin'.`);
      } else {
        console.log(`🛡️  Admin Seeder: Account '${adminEmail}' verified as active admin.`);
      }
      return user;
    }

    // 2. User doesn't exist yet: Create fresh admin account
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const baseUsername = adminEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

    // Ensure unique username
    let username = baseUsername;
    let counter = 1;
    while (await User.exists({ username })) {
      username = `${baseUsername}_${counter}`;
      counter++;
    }

    const newAdmin = await User.create({
      email: adminEmail,
      username,
      password: hashedPassword,
      role: "admin",
      authProvider: "local",
    });

    console.log(`🛡️  Admin Seeder: Successfully created primary admin account: ${adminEmail}`);
    return newAdmin;
  } catch (error) {
    console.error("⚠️  Admin Seeder Error:", error.message);
    // Don't crash server startup if seeder encounters a non-fatal error
  }
}

module.exports = { seedAdmin };
