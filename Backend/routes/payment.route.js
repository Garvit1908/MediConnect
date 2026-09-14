const express = require("express");
const router = express.Router();

const { createorder } = require("../controllers/createorder.controller");
const { verifyPayment, getMyPayments } = require("../controllers/verifypayment.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// 1. Create Razorpay Order (Patient Only)
router.post("/create-order", protect, authorize("patient"), createorder);

// 2. Verify Payment Signature & Confirm Appointment (Patient Only)
router.post("/verify-payment", protect, authorize("patient"), verifyPayment);

// 3. Get all completed payments/receipts for logged-in patient
router.get("/my", protect, authorize("patient"), getMyPayments);

module.exports = router;
