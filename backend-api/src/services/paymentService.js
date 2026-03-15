const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

async function confirmMockPayment({ bookingId, userId, idempotencyKey = "" }) {
  const normalizedKey = String(idempotencyKey || "").trim() || `mockpay:${bookingId}:${userId}`;
  const session = await mongoose.startSession();
  try {
    let responsePayload = null;
    await session.withTransaction(async () => {
      const booking = await Booking.findById(bookingId).session(session);
      if (!booking) {
        const error = new Error("Booking not found.");
        error.statusCode = 404;
        throw error;
      }

      if (String(booking.userId) !== String(userId)) {
        const error = new Error("Not allowed to pay for this booking.");
        error.statusCode = 403;
        throw error;
      }

      if (booking.status === "cancelled" || booking.status === "completed") {
        const error = new Error("This booking is not payable.");
        error.statusCode = 400;
        throw error;
      }

      const existingByKey = await Payment.findOne({ idempotencyKey: normalizedKey }).session(session).lean();
      if (existingByKey) {
        responsePayload = {
          bookingId: booking._id.toString(),
          bookingStatus: booking.status,
          paymentStatus: booking.paymentStatus || "unpaid",
          paymentMethod: booking.paymentMethod || "mock",
          transactionId: existingByKey.transactionId || booking.paymentOrderId || "",
          amount: Number(booking.totalPrice || 0),
          status: existingByKey.status,
          message: "Duplicate payment request ignored (idempotent).",
        };
        return;
      }

      const existingPaid = await Payment.findOne({ bookingId, status: "paid" }).session(session).lean();
      if (booking.paymentStatus === "paid" || existingPaid) {
        responsePayload = {
          bookingId: booking._id.toString(),
          bookingStatus: booking.status,
          paymentStatus: "paid",
          paymentMethod: booking.paymentMethod || "mock",
          transactionId: existingPaid?.transactionId || booking.paymentOrderId || "",
          amount: Number(booking.totalPrice || 0),
          status: "paid",
          message: "Booking already paid.",
        };
        return;
      }

      const amount = Math.max(0, Math.round(Number(booking.totalPrice || 0)));
      const transactionId = `MOCK_${booking._id}_${Date.now()}`;

      const [payment] = await Payment.create(
        [
          {
            bookingId: booking._id,
            userId,
            provider: "mock",
            amount,
            transactionId,
            idempotencyKey: normalizedKey,
            message: "Mock payment confirmed.",
            status: "paid",
            rawPayload: {
              source: "manual-mock-confirm",
              bookingId: booking._id.toString(),
              userId: String(userId),
              idempotencyKey: normalizedKey,
            },
          },
        ],
        { session }
      );

      booking.paymentStatus = "paid";
      booking.paymentMethod = "mock";
      booking.paymentOrderId = transactionId;
      if (booking.status === "pending") {
        booking.status = "confirmed";
      }
      await booking.save({ session });

      responsePayload = {
        bookingId: booking._id.toString(),
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        transactionId,
        amount,
        status: payment.status,
        message: "Mock payment confirmed successfully.",
      };
    });
    return responsePayload;
  } catch (error) {
    if (error?.code === 11000) {
      const booking = await Booking.findById(bookingId).lean();
      const existingPaid = await Payment.findOne({ bookingId, status: "paid" }).sort({ createdAt: -1 }).lean();
      return {
        bookingId: bookingId.toString(),
        bookingStatus: booking?.status || "pending",
        paymentStatus: booking?.paymentStatus || "paid",
        paymentMethod: booking?.paymentMethod || "mock",
        transactionId: existingPaid?.transactionId || booking?.paymentOrderId || "",
        amount: Number(booking?.totalPrice || 0),
        status: existingPaid?.status || "paid",
        message: "Duplicate payment request ignored (idempotent).",
      };
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function getBookingPaymentStatus({ bookingId, userId, role }) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error("Booking not found.");
    error.statusCode = 404;
    throw error;
  }

  if (role !== "admin" && String(booking.userId) !== String(userId)) {
    const error = new Error("Not allowed to access this booking payment.");
    error.statusCode = 403;
    throw error;
  }

  const latestPayment = await Payment.findOne({ bookingId }).sort({ createdAt: -1 }).lean();
  return {
    bookingId: booking._id.toString(),
    bookingStatus: booking.status,
    paymentStatus: booking.paymentStatus || "unpaid",
    paymentMethod: booking.paymentMethod || "",
    paymentOrderId: booking.paymentOrderId || "",
    latestPayment: latestPayment
      ? {
          id: latestPayment._id.toString(),
          provider: latestPayment.provider,
          transactionId: latestPayment.transactionId,
          amount: latestPayment.amount,
          status: latestPayment.status,
          message: latestPayment.message,
          createdAt: latestPayment.createdAt,
        }
      : null,
  };
}

module.exports = {
  confirmMockPayment,
  getBookingPaymentStatus,
};
