const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 12000);
const GEMINI_MODEL_FALLBACKS = String(process.env.GEMINI_MODEL_FALLBACKS || "gemini-2.0-flash,gemini-2.5-flash")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const LOCALES = {
  vi: {
    roleInstruction: {
      owner: "Người dùng hiện tại là chủ sân. Ưu tiên hướng dẫn quản lý sân, khung giờ, đặt sân và vận hành sân.",
      admin: "Người dùng hiện tại là quản trị viên. Ưu tiên nội dung quản trị, báo cáo, quản lý người dùng và sân.",
      player: "Người dùng hiện tại là người chơi. Ưu tiên đặt sân, xem slot trống, giá sân, hủy booking và bản đồ.",
    },
    genericFallback:
      "Mình chưa hiểu rõ câu hỏi. Bạn có thể hỏi cụ thể hơn về đặt sân, slot trống, giá sân, hủy booking, bản đồ hoặc quản lý sân.",
    providerUnavailable: "Trợ lý AI tạm thời chưa sẵn sàng. Vui lòng thử lại sau.",
    suggestions: ["Làm sao đặt sân?", "Tôi muốn xem slot trống hôm nay", "Làm sao hủy booking?"],
  },
  en: {
    roleInstruction: {
      owner: "The current user is an owner. Prioritize court management, slots, bookings, and venue operations guidance.",
      admin: "The current user is an admin. Prioritize administration, reporting, user management, and courts management guidance.",
      player: "The current user is a player. Prioritize booking flows, available slots, pricing, cancellations, and map guidance.",
    },
    genericFallback:
      "I could not fully understand your question. You can ask more specifically about booking, available slots, pricing, cancellation, maps, or court management.",
    providerUnavailable: "AI assistant is temporarily unavailable. Please try again soon.",
    suggestions: ["How do I book a court?", "Show available slots today", "How can I cancel a booking?"],
  },
};

const FAQ_ITEMS = [
  {
    id: "book-slot",
    keywords: ["dat lich", "dat san", "booking", "book", "slot trong", "khung gio", "reserve court", "available slot"],
    answer: {
      vi: "Để đặt lịch, bạn vào chi tiết sân, chọn khung giờ còn trống và xác nhận đặt. Nếu không thấy slot phù hợp, hãy đổi ngày khác hoặc chọn sân khác.",
      en: "To book, open court details, choose an available time slot, then confirm. If no slot is available, try another date or a different court.",
    },
    suggestions: {
      vi: ["Làm sao hủy lịch đã đặt?", "Tôi muốn xem lịch đã đặt", "Giá thuê sân tính thế nào?"],
      en: ["How do I cancel a booking?", "I want to view my bookings", "How is court pricing calculated?"],
    },
  },
  {
    id: "cancel-booking",
    keywords: ["huy lich", "cancel booking", "huy dat", "hoan lich", "cancel reservation"],
    answer: {
      vi: "Bạn vào tab Bookings, chọn lịch muốn hủy và bấm thao tác hủy (nếu lịch đó còn cho phép hủy). Trạng thái sẽ được cập nhật sau khi xác nhận.",
      en: "Go to the Bookings tab, select the booking you want to cancel, and confirm cancellation (if it is still cancellable). Status will update after confirmation.",
    },
    suggestions: {
      vi: ["Chính sách hủy lịch là gì?", "Tôi muốn đặt lại lịch cũ", "Làm sao xem trạng thái booking?"],
      en: ["What is the cancellation policy?", "I want to rebook an old slot", "How can I check booking status?"],
    },
  },
  {
    id: "price",
    keywords: ["gia", "price", "chi phi", "bao nhieu tien", "phi dat san", "cost"],
    answer: {
      vi: "Giá sân được hiển thị theo từng sân và tính theo giờ. Bạn mở chi tiết sân để xem giá chính xác và các khung giờ đang có.",
      en: "Court prices vary by venue and are calculated by hour. Open court details to view exact prices and available time slots.",
    },
    suggestions: {
      vi: ["Có khuyến mãi không?", "Sân nào rẻ nhất gần tôi?", "Tôi muốn xem sân còn trống hôm nay"],
      en: ["Are there any promotions?", "Which nearby court is cheaper?", "Show courts available today"],
    },
  },
  {
    id: "owner-manage",
    keywords: ["chu san", "owner", "quan ly san", "tao san", "sua san", "manage court"],
    roles: ["owner"],
    answer: {
      vi: "Ở vai trò chủ sân, bạn có thể thêm, sửa hoặc xóa sân trong tab Manage. Sau khi cập nhật thông tin, hệ thống sẽ đồng bộ để người chơi tìm thấy sân.",
      en: "As an owner, you can add, edit, or delete courts in the Manage tab. Updates are synced so players can find your courts.",
    },
    suggestions: {
      vi: ["Làm sao cập nhật giá sân?", "Tôi muốn thêm hình ảnh sân", "Làm sao xem lịch đặt của sân?"],
      en: ["How do I update court pricing?", "I want to add court images", "How can I view court bookings?"],
    },
  },
  {
    id: "admin",
    keywords: ["admin", "quan tri", "bao cao", "duyet san", "nguoi dung", "dashboard"],
    roles: ["admin"],
    answer: {
      vi: "Ở vai trò admin, bạn có thể quản lý người dùng, quản lý sân và xem báo cáo tổng quan trong dashboard.",
      en: "As an admin, you can manage users, manage courts, and review summary reports in the dashboard.",
    },
    suggestions: {
      vi: ["Làm sao xem thống kê doanh thu?", "Tôi muốn khóa tài khoản", "Làm sao duyệt sân mới?"],
      en: ["How do I view revenue statistics?", "I want to block an account", "How do I approve new courts?"],
    },
  },
  {
    id: "map",
    keywords: ["ban do", "map", "chi duong", "vi tri san", "directions", "location"],
    answer: {
      vi: "Bạn có thể bấm biểu tượng vị trí trên card hoặc trong chi tiết sân để mở Google Maps và xem đường đến sân.",
      en: "Tap the location icon on the court card or detail screen to open Google Maps and get directions.",
    },
    suggestions: {
      vi: ["Tôi không mở được bản đồ", "Sân nào gần tôi?", "Làm sao lưu sân yêu thích?"],
      en: ["I cannot open the map", "Which court is near me?", "How do I save favorites?"],
    },
  },
  {
    id: "favorite",
    keywords: ["yeu thich", "favorite", "luu san", "tim", "wishlist"],
    answer: {
      vi: "Bạn bấm biểu tượng trái tim để lưu hoặc bỏ lưu sân yêu thích. Danh sách yêu thích sẽ được cập nhật theo tài khoản của bạn.",
      en: "Tap the heart icon to add or remove a favorite court. Your favorites list is synced with your account.",
    },
    suggestions: {
      vi: ["Làm sao đặt sân nhanh?", "Tôi muốn xem thông báo", "Làm sao đổi ngôn ngữ?"],
      en: ["How can I book faster?", "I want to check notifications", "How do I change language?"],
    },
  },
];

function createAssistantError(code, message, statusCode = 500, retryable = false) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.retryable = retryable;
  return error;
}

function normalizeText(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLanguage(language) {
  return language === "en" ? "en" : "vi";
}

function detectBestIntent({ message, role }) {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) {
    return null;
  }

  let bestItem = null;
  let bestScore = 0;
  for (const item of FAQ_ITEMS) {
    if (Array.isArray(item.roles) && item.roles.length > 0 && !item.roles.includes(role)) {
      continue;
    }
    const score = item.keywords.reduce((acc, keyword) => {
      if (normalizedMessage.includes(keyword)) {
        return acc + Math.max(1, keyword.split(" ").length);
      }
      return acc;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  return bestScore > 0 ? bestItem : null;
}

function getRoleInstruction(role, language) {
  const locale = LOCALES[normalizeLanguage(language)] || LOCALES.vi;
  if (role === "owner") {
    return locale.roleInstruction.owner;
  }
  if (role === "admin") {
    return locale.roleInstruction.admin;
  }
  return locale.roleInstruction.player;
}

function buildGeminiContents({ history, message }) {
  const normalizedHistory = Array.isArray(history) ? history : [];
  const historyChunks = normalizedHistory
    .slice(-8)
    .map((item) => ({
      role: item?.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item?.text || "").trim() }],
    }))
    .filter((item) => item.parts[0].text);

  return [
    ...historyChunks,
    {
      role: "user",
      parts: [{ text: String(message || "").trim() }],
    },
  ];
}

function buildSystemInstruction({ role, language }) {
  if (normalizeLanguage(language) === "en") {
    return (
      "You are TennisHub Assistant. Reply in English, concise, friendly, and practical. " +
      "If uncertain, state your limit clearly and suggest next steps. " +
      "Do not invent unsupported information. " +
      getRoleInstruction(role, language)
    );
  }
  return (
    "Bạn là TennisHub Assistant. Trả lời bằng tiếng Việt có dấu, tự nhiên, thân thiện và thực tế. " +
    "Luôn trả lời đầy đủ, không cụt lủn. Ưu tiên 2-5 câu rõ ràng, có thể xuống dòng cho dễ đọc. " +
    "Nếu không chắc chắn, nói rõ giới hạn và đề xuất bước tiếp theo. Không tự tạo thông tin không có căn cứ. " +
    getRoleInstruction(role, language)
  );
}

async function askGemini({ message, role, history, language }) {
  if (!GEMINI_API_KEY) {
    return { result: null, errorCode: "ASSISTANT_PROVIDER_UNAVAILABLE" };
  }
  const requestedModel = String(GEMINI_MODEL || "")
    .trim()
    .replace(/^models\//, "");
  const modelCandidates = [requestedModel, ...GEMINI_MODEL_FALLBACKS]
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  let latestErrorCode = "ASSISTANT_PROVIDER_UNAVAILABLE";
  for (const modelName of modelCandidates) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildSystemInstruction({ role, language }) }],
          },
          contents: buildGeminiContents({ history, message }),
          generationConfig: {
            temperature: 0.45,
            topP: 0.85,
            maxOutputTokens: 480,
          },
        }),
      });

      if (!response.ok) {
        latestErrorCode = response.status >= 500 ? "ASSISTANT_PROVIDER_UNAVAILABLE" : "ASSISTANT_PROVIDER_REJECTED";
        continue;
      }
      const payload = await response.json();
      const answerText = String(
        payload?.candidates?.[0]?.content?.parts?.map((part) => String(part?.text || "")).join("\n") || ""
      ).trim();
      if (!answerText) {
        latestErrorCode = "ASSISTANT_EMPTY_RESPONSE";
        continue;
      }
      return {
        result: {
          intentId: "gemini",
          source: "gemini",
          answer: answerText,
          suggestions: (LOCALES[normalizeLanguage(language)] || LOCALES.vi).suggestions,
        },
        errorCode: null,
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        latestErrorCode = "ASSISTANT_TIMEOUT";
      } else {
        latestErrorCode = "ASSISTANT_PROVIDER_UNAVAILABLE";
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return { result: null, errorCode: latestErrorCode };
}

function askAssistantFallback({ message, role = "player", language = "vi" }) {
  const normalizedRole = ["player", "owner", "admin"].includes(role) ? role : "player";
  const normalizedLanguage = normalizeLanguage(language);
  const locale = LOCALES[normalizedLanguage] || LOCALES.vi;
  const matched = detectBestIntent({ message, role: normalizedRole });

  if (!matched) {
    return {
      intentId: "fallback",
      source: "fallback",
      answer: locale.genericFallback,
      suggestions: locale.suggestions,
    };
  }

  return {
    intentId: matched.id,
    source: "fallback",
    answer: matched.answer?.[normalizedLanguage] || matched.answer?.vi || locale.genericFallback,
    suggestions: matched.suggestions?.[normalizedLanguage] || matched.suggestions?.vi || locale.suggestions,
  };
}

async function askAssistant({ message, role = "player", history = [], language = "vi" }) {
  const normalizedRole = ["player", "owner", "admin"].includes(role) ? role : "player";
  const normalizedLanguage = normalizeLanguage(language);
  const geminiResult = await askGemini({
    message,
    role: normalizedRole,
    history,
    language: normalizedLanguage,
  });
  if (geminiResult.result) {
    return geminiResult.result;
  }

  const fallbackResult = askAssistantFallback({ message, role: normalizedRole, language: normalizedLanguage });
  if (fallbackResult?.answer) {
    return fallbackResult;
  }

  const locale = LOCALES[normalizedLanguage] || LOCALES.vi;
  const retryable = geminiResult.errorCode === "ASSISTANT_TIMEOUT" || geminiResult.errorCode === "ASSISTANT_PROVIDER_UNAVAILABLE";
  throw createAssistantError(
    geminiResult.errorCode || "ASSISTANT_PROVIDER_UNAVAILABLE",
    locale.providerUnavailable,
    503,
    retryable
  );
}

module.exports = {
  askAssistant,
};
