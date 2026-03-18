const rateLimit = require("express-rate-limit");

const ASSISTANT_WINDOW_MS = Number(process.env.ASSISTANT_RATE_LIMIT_WINDOW_MS || 5 * 60 * 1000);
const ASSISTANT_MAX = Number(process.env.ASSISTANT_RATE_LIMIT_MAX || 25);

function assistantRateKey(req) {
  const userId = req.user?.id || req.user?.userId || "anonymous";
  const clientIp = rateLimit.ipKeyGenerator(req.ip || req.headers["x-forwarded-for"] || "unknown-ip");
  return `${userId}:${clientIp}`;
}

const assistantLimiter = rateLimit({
  windowMs: ASSISTANT_WINDOW_MS,
  max: ASSISTANT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: assistantRateKey,
  message: {
    success: false,
    error: {
      code: "ASSISTANT_RATE_LIMITED",
      message: "Bạn gửi quá nhiều yêu cầu trợ lý. Vui lòng thử lại sau.",
      retryable: true,
    },
  },
});

module.exports = {
  assistantLimiter,
};
