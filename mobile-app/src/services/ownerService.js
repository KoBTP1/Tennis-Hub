import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { getCurrentSession } from "./authService";

const OWNER_ENDPOINT = `${API_BASE_URL}/owner`;
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL;
  }
})();

function normalizeServerAssetUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return "";
  }
  try {
    const parsed = new URL(raw);
    if (parsed.pathname.startsWith("/uploads/")) {
      const fallback = new URL(API_ORIGIN);
      parsed.protocol = fallback.protocol;
      parsed.host = fallback.host;
      return parsed.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

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

export async function getOwnerCourtDetail(courtId) {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${OWNER_ENDPOINT}/courts/${courtId}`, {
    headers,
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

export async function uploadOwnerCourtImage(asset) {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  const assetUri = String(asset?.uri || "");
  const fileName = String(asset?.fileName || "").trim() || `court-${Date.now()}.jpg`;
  const fileType = String(asset?.mimeType || "").trim() || "image/jpeg";

  if (asset?.file) {
    formData.append("image", asset.file);
  } else if (assetUri) {
    formData.append("image", { uri: assetUri, name: fileName, type: fileType });
  } else {
    throw new Error("Selected image is invalid.");
  }

  const response = await axios.post(`${OWNER_ENDPOINT}/uploads/image`, formData, {
    headers: {
      ...headers,
      "Content-Type": "multipart/form-data",
    },
  });

  const serverUrl = String(response?.data?.data?.url || "").trim();
  const serverPath = String(response?.data?.data?.path || "").trim();
  let normalizedUrl = normalizeServerAssetUrl(serverUrl);
  if (!normalizedUrl && serverPath) {
    const normalizedPath = serverPath.startsWith("/") ? serverPath : `/${serverPath}`;
    normalizedUrl = `${API_ORIGIN}${normalizedPath}`;
  }

  return {
    ...response.data,
    data: {
      ...response.data?.data,
      url: normalizedUrl,
    },
  };
}
