const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

const VNPAY_CONFIG = {
  tmnCode: String(process.env.VNPAY_TMN_CODE || "").trim(),
  hashSecret: String(process.env.VNPAY_HASH_SECRET || "").trim(),
  paymentUrl: String(process.env.VNPAY_PAYMENT_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html").trim(),
  returnUrl: String(process.env.VNPAY_RETURN_URL || "").trim(),
  orderType: String(process.env.VNPAY_ORDER_TYPE || "other").trim(),
  locale: String(process.env.VNPAY_LOCALE || "vn").trim(),
  currCode: String(process.env.VNPAY_CURR_CODE || "VND").trim(),
  expireMinutes: Number(process.env.VNPAY_EXPIRE_MINUTES || 15),
  bankCode: String(process.env.VNPAY_BANK_CODE || "").trim(),
};

function isTransactionNotSupportedError(error) {
  const message = String(error?.message || "");
  return message.includes("Transaction numbers are only allowed on a replica set member or mongos");
}

function ensureVnpayConfig() {
  if (!VNPAY_CONFIG.tmnCode || !VNPAY_CONFIG.hashSecret || !VNPAY_CONFIG.returnUrl) {
    const error = new Error("VNPay configuration is missing.");
    error.statusCode = 500;
    throw error;
  }
}

function toVnpDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hour}${minute}${second}`;
}

function encodeVnpValue(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, "+");
}

function buildSignedData(params) {
  const sortedKeys = Object.keys(params).sort();
  return sortedKeys.map((key) => `${encodeURIComponent(key)}=${encodeVnpValue(params[key])}`).join("&");
}

function signVnpData(data, hashSecret) {
  return crypto.createHmac("sha512", hashSecret).update(Buffer.from(data, "utf-8")).digest("hex");
}

function resolveClientIp(rawIp) {
  const ip = String(rawIp || "").split(",")[0].trim();
  if (!ip) {
    return "127.0.0.1";
  }
  if (ip.includes(":")) {
    if (ip.startsWith("::ffff:")) {
      return ip.slice(7);
    }
    return "127.0.0.1";
  }
  return ip;
}

function isBookingPayable(booking) {
  return booking && booking.status !== "cancelled" && booking.status !== "completed";
}

function mapVnpResponseStatus(responseCode) {
  const code = String(responseCode || "");
  if (code === "00") {
    return "paid";
  }
  if (code === "24") {
    return "cancelled";
  }
  return "failed";
}

async function createVnpayPayment({ bookingId, userId, clientIp = "127.0.0.1", idempotencyKey = "" }) {
  ensureVnpayConfig();

  const booking = await Booking.findById(bookingId);
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
  if (!isBookingPayable(booking)) {
    const error = new Error("This booking is not payable.");
    error.statusCode = 400;
    throw error;
  }
  if (booking.paymentStatus === "paid") {
    return {
      bookingId: booking._id.toString(),
      paymentStatus: "paid",
      paymentMethod: booking.paymentMethod || "vnpay",
      paymentOrderId: booking.paymentOrderId || "",
      paymentUrl: "",
      isPaid: true,
      message: "Booking already paid.",
    };
  }

  const amount = Math.max(0, Math.round(Number(booking.totalPrice || 0)));
  if (!amount) {
    const error = new Error("Booking amount is invalid.");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(1, VNPAY_CONFIG.expireMinutes) * 60 * 1000);
  const createDate = toVnpDate(now);
  const expireDate = toVnpDate(expiresAt);
  const orderRef = booking.paymentOrderId || `VNPAY_${booking._id}_${Date.now()}`;

  const existingPending = await Payment.findOne({
    bookingId,
    userId,
    provider: "vnpay",
    status: "pending",
  })
    .sort({ createdAt: -1 })
    .lean();

  const shouldReusePending =
    existingPending &&
    existingPending.transactionId &&
    existingPending.rawPayload?.expireDate &&
    String(existingPending.rawPayload.expireDate) > createDate;
  const transactionId = shouldReusePending ? existingPending.transactionId : orderRef;
  const normalizedIdempotencyKey =
    String(idempotencyKey || "").trim() || `vnpay:create:${booking._id}:${userId}:${transactionId}`;

  const orderInfo = `Thanh toan dat san ${booking._id}`;
  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_CONFIG.tmnCode,
    vnp_Amount: String(amount * 100),
    vnp_CreateDate: createDate,
    vnp_CurrCode: VNPAY_CONFIG.currCode,
    vnp_IpAddr: resolveClientIp(clientIp),
    vnp_Locale: VNPAY_CONFIG.locale,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: VNPAY_CONFIG.orderType,
    vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
    vnp_TxnRef: transactionId,
    vnp_ExpireDate: expireDate,
  };
  if (VNPAY_CONFIG.bankCode) {
    vnpParams.vnp_BankCode = VNPAY_CONFIG.bankCode;
  }

  const signData = buildSignedData(vnpParams);
  const secureHash = signVnpData(signData, VNPAY_CONFIG.hashSecret);
  const paymentUrl = `${VNPAY_CONFIG.paymentUrl}?${signData}&vnp_SecureHash=${secureHash}`;

  booking.paymentStatus = "pending";
  booking.paymentMethod = "vnpay";
  booking.paymentOrderId = transactionId;
  await booking.save();

  if (!shouldReusePending) {
    await Payment.create({
      bookingId: booking._id,
      userId,
      provider: "vnpay",
      amount,
      transactionId,
      idempotencyKey: normalizedIdempotencyKey,
      message: "VNPay payment initialized.",
      status: "pending",
      rawPayload: {
        source: "vnpay-create",
        orderInfo,
        createDate,
        expireDate,
        params: vnpParams,
      },
    });
  }

  return {
    bookingId: booking._id.toString(),
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    paymentOrderId: transactionId,
    paymentUrl,
    isPaid: false,
    expiresAt: expiresAt.toISOString(),
    message: "VNPay payment URL created successfully.",
  };
}

async function handleVnpayReturn({ query = {} }) {
  ensureVnpayConfig();

  const params = { ...query };
  const incomingHash = String(params.vnp_SecureHash || "").trim().toLowerCase();
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  const signData = buildSignedData(params);
  const expectedHash = signVnpData(signData, VNPAY_CONFIG.hashSecret).toLowerCase();
  const isValidSignature = incomingHash && incomingHash === expectedHash;
  if (!isValidSignature) {
    const error = new Error("Invalid VNPay signature.");
    error.statusCode = 400;
    throw error;
  }

  const txnRef = String(params.vnp_TxnRef || "").trim();
  const responseCode = String(params.vnp_ResponseCode || "");
  const transactionStatus = String(params.vnp_TransactionStatus || "");
  const paidAmount = Math.max(0, Math.round(Number(params.vnp_Amount || 0) / 100));
  const mappedStatus = mapVnpResponseStatus(responseCode);

  const payment = await Payment.findOne({ transactionId: txnRef, provider: "vnpay" }).sort({ createdAt: -1 });
  if (!payment) {
    const error = new Error("Payment transaction not found.");
    error.statusCode = 404;
    throw error;
  }

  const booking = await Booking.findById(payment.bookingId);
  if (!booking) {
    const error = new Error("Booking not found.");
    error.statusCode = 404;
    throw error;
  }

  const bookingAmount = Math.max(0, Math.round(Number(booking.totalPrice || 0)));
  const amountMatched = paidAmount === bookingAmount;
  if (!amountMatched) {
    payment.status = "failed";
    payment.message = "VNPay amount mismatch.";
    payment.rawPayload = {
      ...(payment.rawPayload || {}),
      returnPayload: query,
      amountMismatch: {
        expected: bookingAmount,
        actual: paidAmount,
      },
    };
    await payment.save();
    booking.paymentStatus = "failed";
    booking.paymentMethod = "vnpay";
    await booking.save();
    return {
      bookingId: booking._id.toString(),
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.status,
      status: "failed",
      responseCode,
      transactionStatus,
      message: "Amount mismatch.",
    };
  }

  const isFinalized = ["paid", "failed", "cancelled"].includes(payment.status);
  const finalStatus = payment.status === "paid" ? "paid" : mappedStatus;
  if (!isFinalized) {
    payment.status = finalStatus;
    payment.message = mappedStatus === "paid" ? "VNPay payment successful." : "VNPay payment not successful.";
    payment.rawPayload = {
      ...(payment.rawPayload || {}),
      returnPayload: query,
      responseCode,
      transactionStatus,
    };
    await payment.save();
  }

  if (finalStatus === "paid") {
    booking.paymentStatus = "paid";
    booking.paymentMethod = "vnpay";
    booking.paymentOrderId = txnRef;
    if (booking.status === "pending") {
      booking.status = "confirmed";
    }
  } else {
    booking.paymentStatus = "failed";
    booking.paymentMethod = "vnpay";
    if (!booking.paymentOrderId) {
      booking.paymentOrderId = txnRef;
    }
  }
  await booking.save();

  return {
    bookingId: booking._id.toString(),
    paymentStatus: booking.paymentStatus,
    bookingStatus: booking.status,
    status: finalStatus,
    responseCode,
    transactionStatus,
    message: finalStatus === "paid" ? "Payment success." : "Payment failed or cancelled.",
  };
}

async function confirmMockPayment({ bookingId, userId, idempotencyKey = "" }) {
  const normalizedKey = String(idempotencyKey || "").trim() || `mockpay:${bookingId}:${userId}`;
  const confirmWithoutTransaction = async () => {
    const booking = await Booking.findById(bookingId);
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

    const existingByKey = await Payment.findOne({ idempotencyKey: normalizedKey }).lean();
    if (existingByKey) {
      return {
        bookingId: booking._id.toString(),
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus || "unpaid",
        paymentMethod: booking.paymentMethod || "mock",
        transactionId: existingByKey.transactionId || booking.paymentOrderId || "",
        amount: Number(booking.totalPrice || 0),
        status: existingByKey.status,
        message: "Duplicate payment request ignored (idempotent).",
      };
    }

    const existingPaid = await Payment.findOne({ bookingId, status: "paid" }).lean();
    if (booking.paymentStatus === "paid" || existingPaid) {
      return {
        bookingId: booking._id.toString(),
        bookingStatus: booking.status,
        paymentStatus: "paid",
        paymentMethod: booking.paymentMethod || "mock",
        transactionId: existingPaid?.transactionId || booking.paymentOrderId || "",
        amount: Number(booking.totalPrice || 0),
        status: "paid",
        message: "Booking already paid.",
      };
    }

    const amount = Math.max(0, Math.round(Number(booking.totalPrice || 0)));
    const transactionId = `MOCK_${booking._id}_${Date.now()}`;
    const payment = await Payment.create({
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
    });

    booking.paymentStatus = "paid";
    booking.paymentMethod = "mock";
    booking.paymentOrderId = transactionId;
    if (booking.status === "pending") {
      booking.status = "confirmed";
    }
    await booking.save();

    return {
      bookingId: booking._id.toString(),
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      transactionId,
      amount,
      status: payment.status,
      message: "Mock payment confirmed successfully.",
    };
  };

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
    if (isTransactionNotSupportedError(error)) {
      return confirmWithoutTransaction();
    }
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
  createVnpayPayment,
  handleVnpayReturn,
  confirmMockPayment,
  getBookingPaymentStatus,
};
