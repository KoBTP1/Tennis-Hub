const bookingService = require("../services/bookingService");
const Booking = require("../models/Booking");

async function createBooking(req, res, next) {
  try {
    const { courtId, slotId } = req.body;
    // req.user handles BOTH 'id' or 'userId' depending on token payload, ensuring it works
    const userId = req.user.id || req.user.userId;

    const booking = await bookingService.createBooking(userId, courtId, slotId);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    res.status(400); // Bad request for logic errors like already booked
    return next(error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const userId = req.user.id || req.user.userId;
    const bookings = await bookingService.getMyBookings(userId);

    return res.status(200).json({
      success: true,
      message: "My bookings retrieved successfully",
      data: bookings,
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    const bookingRecord = await Booking.findById(id);
    if (!bookingRecord) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (bookingRecord.userId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking"
      });
    }

    const booking = await bookingService.cancelBooking(id, userId);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    res.status(400);
    return next(error);
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
};
