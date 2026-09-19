const express = require("express");
const router = express.Router();

const { createorder } = require("../controllers/createorder.controller");
const { verifyPayment, getMyPayments } = require("../controllers/verifypayment.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.post("/create-order", protect, authorize("patient"), createorder);

router.post("/verify-payment", protect, authorize("patient"), verifyPayment);

router.get("/my", protect, authorize("patient"), getMyPayments);

module.exports = router;
