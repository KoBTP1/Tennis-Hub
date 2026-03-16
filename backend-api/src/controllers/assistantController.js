const assistantService = require("../services/assistantService");

async function postAsk(req, res, next) {
  try {
    const message = String(req.body?.message || "").trim();
    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .slice(-12)
      .map((item) => ({
        role: item?.role === "assistant" ? "assistant" : "user",
        text: String(item?.text || "").trim().slice(0, 400),
      }))
      .filter((item) => item.text);
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }
    if (message.length > 600) {
      return res.status(400).json({
        success: false,
        message: "Message is too long. Maximum 600 characters.",
      });
    }

    const result = await assistantService.askAssistant({
      message,
      role: req.user?.role || "player",
      history,
    });

    return res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        suggestions: result.suggestions,
        intentId: result.intentId,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  postAsk,
};
