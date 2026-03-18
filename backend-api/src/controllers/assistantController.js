const assistantService = require("../services/assistantService");

function errorResponse(res, statusCode, code, message, retryable = false) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      message,
      retryable,
    },
  });
}

async function postAsk(req, res, next) {
  try {
    const message = String(req.body?.message || "").trim();
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const requestedLanguage = String(req.body?.language || "vi").trim().toLowerCase();
    const language = requestedLanguage === "en" ? "en" : "vi";
    const history = rawHistory
      .slice(-12)
      .map((item) => ({
        role: item?.role === "assistant" ? "assistant" : "user",
        text: String(item?.text || "").trim().slice(0, 400),
      }))
      .filter((item) => item.text);
    if (!message) {
      return errorResponse(res, 400, "ASSISTANT_INVALID_MESSAGE", "Message is required.");
    }
    if (message.length > 600) {
      return errorResponse(res, 400, "ASSISTANT_MESSAGE_TOO_LONG", "Message is too long. Maximum 600 characters.");
    }

    const result = await assistantService.askAssistant({
      message,
      role: req.user?.role || "player",
      history,
      language,
    });

    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        suggestions: result.suggestions,
        intentId: result.intentId,
        source: result.source,
      },
    });
  } catch (error) {
    if (error?.code && String(error.code).startsWith("ASSISTANT_")) {
      return errorResponse(
        res,
        Number(error.statusCode || 500),
        error.code,
        error.message || "Assistant is temporarily unavailable.",
        Boolean(error.retryable)
      );
    }
    return next(error);
  }
}

module.exports = {
  postAsk,
};
