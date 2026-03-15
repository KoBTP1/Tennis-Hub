const Booking = require("../models/Booking");
const CourtSlot = require("../models/CourtSlot");
const Court = require("../models/Court");
const mongoose = require("mongoose");

async function createBooking(userId, courtId, slotId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const slot = await CourtSlot.findById(slotId).session(session);

    if (!slot) {
      throw new Error("Slot not found");
    }

    const existingBooking = await Booking.findOne({
      slotId: slotId,
      status: { $ne: "cancelled" }
    }).session(session);

    if (existingBooking || slot.isBooked) {
      throw new Error("This slot is already booked");
    }

    if (slot.courtId.toString() !== courtId) {
      throw new Error("Slot does not belong to the specified court");
    }

    const court = await Court.findById(courtId).session(session);
    if (!court) {
      throw new Error("Court not found");
    }

    slot.isBooked = true;
    await slot.save({ session });

    const newBooking = new Booking({
      userId,
      courtId,
      slotId,
      bookingDate: new Date(),
      totalPrice: court.pricePerHour || 0,
      status: "confirmed",
    });

    await newBooking.save({ session });
    await session.commitTransaction();
    session.endSession();

    return newBooking;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

async function getMyBookings(userId) {
  const bookings = await Booking.find({ userId })
    .populate("courtId", "name location")
    .populate("slotId", "date startTime endTime")
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  
  return bookings;
}

async function cancelBooking(bookingId, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);

    if (!booking) {
      throw new Error("Booking not found");
    }
    // Authorization check is now handled in the controller
    if (booking.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }
    if (booking.status === "completed") {
      throw new Error("Cannot cancel a completed booking");
    }

    booking.status = "cancelled";
    await booking.save({ session });

    const slot = await CourtSlot.findById(booking.slotId).session(session);
    if (slot) {
      slot.isBooked = false;
      await slot.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return booking;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
};
