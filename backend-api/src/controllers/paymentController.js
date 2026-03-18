const paymentService = require("../services/paymentService");
const { isValidObjectId } = require("../utils/requestValidation");

async function createVnpayPayment(req, res, next) {
  try {
    const { bookingId, idempotencyKey } = req.body || {};
    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking id." });
    }
    const userId = req.user?.userId || req.user?.id;
    const requestIdempotencyKey = req.headers["x-idempotency-key"] || idempotencyKey || "";
    const clientIp =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      "127.0.0.1";
    const data = await paymentService.createVnpayPayment({
      bookingId,
      userId,
      clientIp,
      idempotencyKey: requestIdempotencyKey,
    });
    return res.status(201).json({
      success: true,
      message: "VNPay payment initialized successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function handleVnpayReturn(req, res, next) {
  try {
    const data = await paymentService.handleVnpayReturn({ query: req.query || {} });
    return res.status(200).json({
      success: true,
      message: "VNPay return processed.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

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
  createVnpayPayment,
  handleVnpayReturn,
  confirmMockPayment,
  getBookingPaymentStatus,
};
