import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const PAYMENTS_ENDPOINT = `${API_BASE_URL}/payments`;

async function getAuthHeaders() {
  const session = await getCurrentSession();
  if (session?.token) {
    return { Authorization: `Bearer ${session.token}` };
  }
  return {};
}

function getApiErrorMessage(error, fallbackMessage) {
  if (!axios.isAxiosError(error)) {
    return error?.message || fallbackMessage;
  }
  return error?.response?.data?.message || fallbackMessage;
}

export async function confirmMockPayment(bookingId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${PAYMENTS_ENDPOINT}/mock/confirm`,
      { bookingId },
      { headers }
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to confirm mock payment."));
  }
}

export async function getBookingPaymentStatus(bookingId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${PAYMENTS_ENDPOINT}/booking/${bookingId}`, { headers });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch payment status."));
  }
}
