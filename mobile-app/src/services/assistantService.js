import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const ASSISTANT_ENDPOINT = `${API_BASE_URL}/assistant`;

async function getAuthHeaders() {
  const session = await getCurrentSession();
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  return {};
}

function normalizeAssistantError(error) {
  const responseData = error?.response?.data || {};
  const payloadError = responseData?.error || {};
  const fallbackMessage = responseData?.message || "Không thể kết nối trợ lý lúc này. Vui lòng thử lại.";

  return {
    code: String(payloadError?.code || "ASSISTANT_REQUEST_FAILED"),
    message: String(payloadError?.message || fallbackMessage),
    retryable: Boolean(payloadError?.retryable),
    statusCode: Number(error?.response?.status || 0),
    raw: error,
  };
}

export async function askAssistant(message, history = [], language = "vi") {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${ASSISTANT_ENDPOINT}/ask`,
      {
        message: String(message || "").trim(),
        history: Array.isArray(history) ? history : [],
        language: language === "en" ? "en" : "vi",
      },
      { headers }
    );
    if (response?.data?.success === false) {
      throw { response: { data: response.data, status: 400 } };
    }
    return response.data;
  } catch (error) {
    throw normalizeAssistantError(error);
  }
}
