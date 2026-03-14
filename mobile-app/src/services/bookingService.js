import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const BOOKINGS_ENDPOINT = `${API_BASE_URL}/bookings`;

async function getAuthHeaders() {
  const session = await getCurrentSession();
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  return {};
}

export async function createBooking(data) {
  const headers = await getAuthHeaders();
  const response = await axios.post(BOOKINGS_ENDPOINT, data, { headers });
  return response.data;
}

export async function getMyBookings() {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${BOOKINGS_ENDPOINT}/my`, { headers });
  return response.data;
}

export async function cancelBooking(id) {
  const headers = await getAuthHeaders();
  const response = await axios.delete(`${BOOKINGS_ENDPOINT}/${id}`, { headers });
  return response.data;
}
