import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const OWNER_ENDPOINT = `${API_BASE_URL}/owner`;

async function getAuthHeaders() {
  const session = await getCurrentSession();
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  return {};
}

export async function getOwnerDashboard() {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${OWNER_ENDPOINT}/dashboard`, { headers });
  return response.data;
}

export async function getOwnerCourts({ keyword = "", status = "all", page = 1, limit = 50 } = {}) {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${OWNER_ENDPOINT}/courts`, {
    headers,
    params: { keyword, status, page, limit },
  });
  return response.data;
}

export async function createOwnerCourt(payload) {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${OWNER_ENDPOINT}/courts`, payload, { headers });
  return response.data;
}

export async function updateOwnerCourt(courtId, payload) {
  const headers = await getAuthHeaders();
  const response = await axios.patch(`${OWNER_ENDPOINT}/courts/${courtId}`, payload, { headers });
  return response.data;
}

export async function deleteOwnerCourt(courtId) {
  const headers = await getAuthHeaders();
  const response = await axios.delete(`${OWNER_ENDPOINT}/courts/${courtId}`, { headers });
  return response.data;
}

export async function getOwnerSlots(courtId, date = "") {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${OWNER_ENDPOINT}/courts/${courtId}/slots`, {
    headers,
    params: { date },
  });
  return response.data;
}

export async function createOwnerSlot(courtId, payload) {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${OWNER_ENDPOINT}/courts/${courtId}/slots`, payload, { headers });
  return response.data;
}

export async function updateOwnerSlot(slotId, payload) {
  const headers = await getAuthHeaders();
  const response = await axios.patch(`${OWNER_ENDPOINT}/slots/${slotId}`, payload, { headers });
  return response.data;
}

export async function deleteOwnerSlot(slotId) {
  const headers = await getAuthHeaders();
  const response = await axios.delete(`${OWNER_ENDPOINT}/slots/${slotId}`, { headers });
  return response.data;
}

export async function getOwnerBookings({ status = "all", page = 1, limit = 50 } = {}) {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${OWNER_ENDPOINT}/bookings`, {
    headers: {
      ...headers,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    params: { status, page, limit, _ts: Date.now() },
  });
  return response.data;
}

export async function updateOwnerBookingStatus(bookingId, status) {
  const headers = await getAuthHeaders();
  const response = await axios.patch(`${OWNER_ENDPOINT}/bookings/${bookingId}/status`, { status }, { headers });
  return response.data;
}
