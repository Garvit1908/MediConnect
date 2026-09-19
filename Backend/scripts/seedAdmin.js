require("dotenv").config();
const dbconnect = require("../config/db");
const mongoose = require("mongoose");
const { seedAdmin } = require("../utils/seedAdmin");

async function run() {
  try {
    console.log("Connecting to database...");
    await dbconnect();
    console.log("Connected to database. Running admin seeder...");
    await seedAdmin();
    console.log("Admin seeding completed.");
  } catch (err) {
    console.error("Failed to seed admin:", err);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
