import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const PAYMENTS_ENDPOINT = `${API_BASE_URL}/payments`;
const VNPAY_RETURN_PATH = `${PAYMENTS_ENDPOINT}/vnpay/return`;

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

export async function createVnpayPayment(bookingId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${PAYMENTS_ENDPOINT}/vnpay/create`, { bookingId }, { headers });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Không thể khởi tạo thanh toán VNPay."));
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

export function isVnpayReturnUrl(url) {
  const normalized = String(url || "");
  return normalized.startsWith(VNPAY_RETURN_PATH) || normalized.includes("/api/payments/vnpay/return");
}

export async function processVnpayReturnUrl(returnUrl) {
  try {
    const targetUrl = String(returnUrl || "").trim();
    if (!targetUrl) {
      throw new Error("VNPay return URL is missing.");
    }
    const response = await axios.get(targetUrl);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Không thể xử lý callback VNPay."));
  }
}
