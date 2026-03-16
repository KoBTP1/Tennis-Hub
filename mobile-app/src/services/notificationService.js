import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const NOTIFICATION_ENDPOINT = `${API_BASE_URL}/notifications`;

async function getAuthHeaders() {
  const session = await getCurrentSession();
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  return {};
}

export async function getMyNotifications({ page = 1, limit = 30 } = {}) {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${NOTIFICATION_ENDPOINT}/my`, {
    headers,
    params: { page, limit },
  });
  return response.data;
}

export async function markNotificationRead(id) {
  const headers = await getAuthHeaders();
  const response = await axios.patch(`${NOTIFICATION_ENDPOINT}/${id}/read`, {}, { headers });
  return response.data;
}

export async function markAllNotificationsRead() {
  const headers = await getAuthHeaders();
  const response = await axios.patch(`${NOTIFICATION_ENDPOINT}/read-all`, {}, { headers });
  return response.data;
}
