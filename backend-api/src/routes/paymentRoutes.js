const express = require("express");
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/vnpay/return", paymentController.handleVnpayReturn);

router.use(protect);
router.post("/vnpay/create", paymentController.createVnpayPayment);
router.post("/mock/confirm", paymentController.confirmMockPayment);
router.get("/booking/:bookingId", paymentController.getBookingPaymentStatus);

module.exports = router;
