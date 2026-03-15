const paymentService = require("../services/paymentService");
const { isValidObjectId } = require("../utils/requestValidation");

async function confirmMockPayment(req, res, next) {
  try {
    const { bookingId, idempotencyKey } = req.body || {};
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking id." });
    }

    const userId = req.user?.userId || req.user?.id;
    const requestIdempotencyKey = req.headers["x-idempotency-key"] || idempotencyKey || "";
    const data = await paymentService.confirmMockPayment({
      bookingId,
      userId,
      idempotencyKey: requestIdempotencyKey,
    });
    return res.status(201).json({
      success: true,
      message: "Mock payment confirmed successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getBookingPaymentStatus(req, res, next) {
  try {
    const { bookingId } = req.params;
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking id." });
    }
    const userId = req.user?.userId || req.user?.id;
    const role = req.user?.role || "";
    const data = await paymentService.getBookingPaymentStatus({ bookingId, userId, role });
    return res.status(200).json({
      success: true,
      message: "Payment status retrieved successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  confirmMockPayment,
  getBookingPaymentStatus,
};
