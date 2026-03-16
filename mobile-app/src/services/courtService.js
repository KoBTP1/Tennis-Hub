import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const COURTS_ENDPOINT = `${API_BASE_URL}/courts`;

async function getAuthHeaders() {
  const session = await getCurrentSession();
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  return {};
}

export async function getCourts() {
  const headers = await getAuthHeaders();
  const response = await axios.get(COURTS_ENDPOINT, { headers });
  return response.data;
}

export async function searchCourts({ keyword = "", location = "", page = 1, limit = 20 } = {}) {
  const headers = await getAuthHeaders();
  const response = await axios.get(COURTS_ENDPOINT, {
    headers,
    params: {
      keyword: keyword.trim(),
      location: location.trim(),
      page,
      limit,
    },
  });
  return response.data;
}

export async function getCourtDetail(id) {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${COURTS_ENDPOINT}/${id}`, { headers });
  return response.data;
}

export async function getCourtSlots(id, date) {
  const headers = await getAuthHeaders();
  const params = date ? { date } : {};
  const response = await axios.get(`${COURTS_ENDPOINT}/${id}/slots`, { headers, params });
  return response.data;
}

export async function toggleCourtFavorite(id) {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${COURTS_ENDPOINT}/${id}/favorite`, {}, { headers });
  return response.data;
}
