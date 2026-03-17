const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const CourtSlot = require("../models/CourtSlot");
const Court = require("../models/Court");
const notificationService = require("./notificationService");
const { getNextSequence } = require("../utils/sequence");

function isTransactionNotSupportedError(error) {
  const message = String(error?.message || "");
  return message.includes("Transaction numbers are only allowed on a replica set member or mongos");
}

function toMinutes(timeString) {
  const [hour, minute] = String(timeString || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

function getSlotEndDate(slot) {
  const dateText = String(slot?.date || "").trim();
  const [year, month, day] = dateText.split("-").map(Number);
  const endMinutes = toMinutes(slot?.endTime);
  if (!year || !month || !day || endMinutes === null) {
    return null;
  }
  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;
  return new Date(year, month - 1, day, endHour, endMinute, 0, 0);
}

function ensureSlotNotExpired(slot) {
  const endAt = getSlotEndDate(slot);
  if (endAt && endAt <= new Date()) {
    const error = new Error("This slot has expired.");
    error.statusCode = 400;
    throw error;
  }
}

async function createBooking(userId, courtId, slotId) {
  if (!courtId || !slotId) {
    const error = new Error("courtId and slotId are required.");
    error.statusCode = 400;
    throw error;
  }

  const createBookingWithoutTransaction = async () => {
    const slot = await CourtSlot.findById(slotId);
    if (!slot) {
      const error = new Error("Slot not found");
      error.statusCode = 404;
      throw error;
    }
    if (slot.courtId.toString() !== String(courtId)) {
      const error = new Error("Slot does not belong to the specified court");
      error.statusCode = 400;
      throw error;
    }
    ensureSlotNotExpired(slot);

    const court = await Court.findOne({ _id: courtId, isDeleted: { $ne: true } });
    if (!court) {
      const error = new Error("Court not found");
      error.statusCode = 404;
      throw error;
    }
    if (court.status !== "approved") {
      const error = new Error("This court is not available for booking.");
      error.statusCode = 400;
      throw error;
    }

    const existingActiveBooking = await Booking.findOne({
      slotId,
      status: { $in: ["pending", "confirmed", "completed"] },
    }).lean();
    if (existingActiveBooking) {
      const error = new Error("This slot is already booked");
      error.statusCode = 409;
      throw error;
    }

    const bookedSlot = await CourtSlot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { $set: { isBooked: true } },
      { returnDocument: "after" }
    );
    if (!bookedSlot) {
      const error = new Error("This slot is already booked");
      error.statusCode = 400;
      throw error;
    }

    try {
      const nextId = await getNextSequence("booking_id");
      const booking = await Booking.create({
        id: nextId,
        userId,
        courtId,
        slotId,
        bookingDate: new Date(),
        totalPrice: court.pricePerHour || 0,
        status: "pending",
        paymentStatus: "unpaid",
        paymentMethod: "",
        paymentOrderId: "",
      });
      await notificationService.createNotification({
        recipientId: court.ownerId,
        actorId: userId,
        type: "booking_created",
        title: "New court booking",
        message: `You received a new booking request for "${court.name}".`,
        metadata: {
          bookingId: booking._id.toString(),
          courtId: court._id.toString(),
        },
      });
      return booking;
    } catch (error) {
      await CourtSlot.findByIdAndUpdate(slotId, { $set: { isBooked: false } });
      throw error;
    }
  };

  const session = await mongoose.startSession();
  try {
    let createdBooking = null;
    await session.withTransaction(async () => {
      const slot = await CourtSlot.findById(slotId).session(session);
      if (!slot) {
        const error = new Error("Slot not found");
        error.statusCode = 404;
        throw error;
      }

      if (slot.courtId.toString() !== String(courtId)) {
        const error = new Error("Slot does not belong to the specified court");
        error.statusCode = 400;
        throw error;
      }
      ensureSlotNotExpired(slot);

      const court = await Court.findOne({ _id: courtId, isDeleted: { $ne: true } }).session(session);
      if (!court) {
        const error = new Error("Court not found");
        error.statusCode = 404;
        throw error;
      }

      if (court.status !== "approved") {
        const error = new Error("This court is not available for booking.");
        error.statusCode = 400;
        throw error;
      }

      const bookedSlot = await CourtSlot.findOneAndUpdate(
        { _id: slotId, isBooked: false },
        { $set: { isBooked: true } },
        { returnDocument: "after", session }
      );
      if (!bookedSlot) {
        const error = new Error("This slot is already booked");
        error.statusCode = 400;
        throw error;
      }

      const existingActiveBooking = await Booking.findOne({
        userId,
        slotId,
        status: { $in: ["pending", "confirmed", "completed"] },
      })
        .session(session)
        .lean();
      if (existingActiveBooking) {
        const error = new Error("Duplicate booking request for this slot.");
        error.statusCode = 409;
        throw error;
      }

      const nextId = await getNextSequence("booking_id", session);
      const [newBooking] = await Booking.create(
        [
          {
            id: nextId,
            userId,
            courtId,
            slotId,
            bookingDate: new Date(),
            totalPrice: court.pricePerHour || 0,
            status: "pending",
            paymentStatus: "unpaid",
            paymentMethod: "",
            paymentOrderId: "",
          },
        ],
        { session }
      );
      await notificationService.createNotification({
        recipientId: court.ownerId,
        actorId: userId,
        type: "booking_created",
        title: "New court booking",
        message: `You received a new booking request for "${court.name}".`,
        metadata: {
          bookingId: newBooking._id.toString(),
          courtId: court._id.toString(),
        },
      });
      createdBooking = newBooking;
    });
    return createdBooking;
  } catch (error) {
    if (isTransactionNotSupportedError(error)) {
      return createBookingWithoutTransaction();
    }
    if (error?.code === 11000) {
      error.statusCode = 409;
      error.message = "Duplicate booking detected.";
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function getMyBookings(userId) {
  const bookings = await Booking.find({ userId })
    .populate("courtId", "name location images")
    .populate("slotId", "date startTime endTime")
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  
  return bookings;
}

async function cancelBooking(bookingId, userId) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }
  // Authorization check is now handled in the controller
  if (booking.status === "cancelled") {
    const error = new Error("Booking is already cancelled");
    error.statusCode = 400;
    throw error;
  }
  if (booking.status === "completed") {
    const error = new Error("Cannot cancel a completed booking");
    error.statusCode = 400;
    throw error;
  }

  booking.status = "cancelled";
  await booking.save();

  const slot = await CourtSlot.findById(booking.slotId);
  if (slot) {
    slot.isBooked = false;
    await slot.save();
  }

  return booking;
}

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
};
