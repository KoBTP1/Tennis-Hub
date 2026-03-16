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

export async function askAssistant(message, history = []) {
  const headers = await getAuthHeaders();
  const response = await axios.post(
    `${ASSISTANT_ENDPOINT}/ask`,
    {
      message: String(message || "").trim(),
      history: Array.isArray(history) ? history : [],
    },
    { headers }
  );
  return response.data;
}
