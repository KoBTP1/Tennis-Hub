const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 12000);
const GEMINI_MODEL_FALLBACKS = ["gemini-2.0-flash", "gemini-2.5-flash"];

const FAQ_ITEMS = [
  {
    id: "book-slot",
    keywords: ["dat lich", "dat san", "booking", "book", "slot trong", "khung gio"],
    answer:
      "De dat lich, ban vao chi tiet san, chon khung gio con trong va xac nhan dat. Neu khong thay slot trong, hay doi ngay khac hoac chon san khac.",
    suggestions: ["Lam sao huy lich da dat?", "Toi muon xem lich da dat", "Gia thue san tinh the nao?"],
  },
  {
    id: "cancel-booking",
    keywords: ["huy lich", "cancel booking", "huy dat", "hoan lich"],
    answer:
      "Ban vao tab Bookings, chon lich muon huy va bam thao tac huy (neu lich do con cho phep huy). Trang thai se duoc cap nhat sau khi xac nhan.",
    suggestions: ["Chinh sach huy lich la gi?", "Toi muon dat lai lich cu", "Lam sao xem trang thai booking?"],
  },
  {
    id: "price",
    keywords: ["gia", "price", "chi phi", "bao nhieu tien", "phi dat san"],
    answer:
      "Gia san duoc hien thi theo tung san va tinh theo gio. Ban mo chi tiet san de xem gia chinh xac va cac khung gio dang co.",
    suggestions: ["Co khuyen mai khong?", "San nao re nhat gan toi?", "Toi muon xem san con trong hom nay"],
  },
  {
    id: "owner-manage",
    keywords: ["chu san", "owner", "quan ly san", "tao san", "sua san"],
    roles: ["owner"],
    answer:
      "Tai vai tro owner, ban co the them/sua/xoa san trong tab Manage. Sau khi cap nhat thong tin, he thong se dong bo de nguoi choi tim thay san.",
    suggestions: ["Lam sao cap nhat gia san?", "Toi muon them hinh anh san", "Lam sao xem lich dat cua san?"],
  },
  {
    id: "admin",
    keywords: ["admin", "quan tri", "bao cao", "duyet san", "nguoi dung"],
    roles: ["admin"],
    answer:
      "Tai vai tro admin, ban co the quan ly nguoi dung, quan ly san va xem bao cao tong quan trong dashboard.",
    suggestions: ["Lam sao xem thong ke doanh thu?", "Toi muon khoa tai khoan", "Lam sao duyet san moi?"],
  },
  {
    id: "map",
    keywords: ["ban do", "map", "chi duong", "vi tri san"],
    answer:
      "Ban co the bam bieu tuong vi tri tren card hoac trong chi tiet san de mo Google Maps va xem duong den san.",
    suggestions: ["Toi khong mo duoc map", "San nao gan toi?", "Lam sao luu san yeu thich?"],
  },
  {
    id: "favorite",
    keywords: ["yeu thich", "favorite", "luu san", "tim"],
    answer:
      "Ban bam bieu tuong trai tim de luu hoac bo luu san yeu thich. Danh sach yeu thich se duoc cap nhat theo tai khoan cua ban.",
    suggestions: ["Lam sao dat san nhanh?", "Toi muon xem thong bao", "Lam sao doi ngon ngu?"],
  },
];

const FALLBACK_SUGGESTIONS = [
  "Lam sao dat san?",
  "Toi muon xem slot trong hom nay",
  "Lam sao huy booking?",
];

function normalizeText(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-z0-9\s]/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
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

function getRoleInstruction(role) {
  if (role === "owner") {
    return "Nguoi dung hien tai la owner. Uu tien huong dan quan ly san, slot, booking va noi dung van hanh san.";
  }
  if (role === "admin") {
    return "Nguoi dung hien tai la admin. Uu tien noi dung quan tri, bao cao, quan ly users va courts.";
  }
  return "Nguoi dung hien tai la player. Uu tien dat san, xem slot trong, gia san, huy booking, map.";
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

async function askGemini({ message, role, history }) {
  if (!GEMINI_API_KEY) {
    return null;
  }
  const requestedModel = String(GEMINI_MODEL || "")
    .trim()
    .replace(/^models\//, "");
  const modelCandidates = [requestedModel, ...GEMINI_MODEL_FALLBACKS]
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  for (const modelName of modelCandidates) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    try {
      const instruction =
        "Ban la TennisHub Assistant. Tra loi bang tieng Viet, ngan gon, than thien, de hieu. " +
        "Neu khong chac chan, noi ro gioi han va de xuat buoc tiep theo. " +
        "Khong tu tao thong tin khong co can cu." +
        ` ${getRoleInstruction(role)}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: instruction }],
          },
          contents: buildGeminiContents({ history, message }),
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 350,
          },
        }),
      });

      if (!response.ok) {
        continue;
      }
      const payload = await response.json();
      const answerText = String(
        payload?.candidates?.[0]?.content?.parts?.map((part) => String(part?.text || "")).join("\n") || ""
      ).trim();
      if (!answerText) {
        continue;
      }
      return {
        intentId: "gemini",
        answer: answerText,
        suggestions: FALLBACK_SUGGESTIONS,
      };
    } catch {
      // Try next model candidate.
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

function askAssistantFallback({ message, role = "player" }) {
  const normalizedRole = ["player", "owner", "admin"].includes(role) ? role : "player";
  const matched = detectBestIntent({ message, role: normalizedRole });

  if (!matched) {
    return {
      intentId: "fallback",
      answer:
        "Mình chua hieu ro cau hoi. Ban co the hoi cu the hon ve dat san, slot trong, gia san, huy booking, map hoac quan ly san.",
      suggestions: FALLBACK_SUGGESTIONS,
    };
  }

  return {
    intentId: matched.id,
    answer: matched.answer,
    suggestions: matched.suggestions || FALLBACK_SUGGESTIONS,
  };
}

async function askAssistant({ message, role = "player", history = [] }) {
  const normalizedRole = ["player", "owner", "admin"].includes(role) ? role : "player";
  const geminiResult = await askGemini({ message, role: normalizedRole, history });
  if (geminiResult) {
    return geminiResult;
  }
  return askAssistantFallback({ message, role: normalizedRole });
}

module.exports = {
  askAssistant,
};
