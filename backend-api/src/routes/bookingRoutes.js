const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Enforce auth
router.post("/", protect, bookingController.createBooking);
router.get("/my", protect, bookingController.getMyBookings);
router.patch("/:id/cancel", protect, bookingController.cancelBooking);

module.exports = router;
