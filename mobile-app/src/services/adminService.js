import axios from "axios";
import { API_BASE_URL } from "../config/api";

const ADMIN_ENDPOINT = `${API_BASE_URL}/admin`;

function buildAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function getApiErrorMessage(error, fallbackMessage) {
  if (!axios.isAxiosError(error)) {
    return error?.message || fallbackMessage;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message === "Network Error" || !error?.response) {
    return `Cannot connect to backend API (${API_BASE_URL}).`;
  }

  return fallbackMessage;
}

export async function getAdminUsers({ token, keyword = "", role = "all", status = "all", page = 1, limit = 20 }) {
  try {
    const response = await axios.get(`${ADMIN_ENDPOINT}/users`, {
      headers: buildAuthHeaders(token),
      params: { keyword, role, status, page, limit },
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load users."));
  }
}

export async function updateAdminUserStatus({ token, userId, status }) {
  try {
    const response = await axios.patch(
      `${ADMIN_ENDPOINT}/users/${userId}/status`,
      { status },
      {
        headers: buildAuthHeaders(token),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update user status."));
  }
}

export async function getAdminCourts({ token, keyword = "", status = "all", page = 1, limit = 20 }) {
  try {
    const response = await axios.get(`${ADMIN_ENDPOINT}/courts`, {
      headers: buildAuthHeaders(token),
      params: { keyword, status, page, limit },
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load courts."));
  }
}

export async function getAdminCourtDetail({ token, courtId }) {
  try {
    const response = await axios.get(`${ADMIN_ENDPOINT}/courts/${courtId}`, {
      headers: buildAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load court detail."));
  }
}

export async function getAdminCourtSlots({ token, courtId, date = "" }) {
  try {
    const response = await axios.get(`${ADMIN_ENDPOINT}/courts/${courtId}/slots`, {
      headers: buildAuthHeaders(token),
      params: { date },
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load court slots."));
  }
}

export async function updateAdminCourtStatus({ token, courtId, status }) {
  try {
    const response = await axios.patch(
      `${ADMIN_ENDPOINT}/courts/${courtId}/status`,
      { status },
      {
        headers: buildAuthHeaders(token),
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update court status."));
  }
}

export async function getAdminOverviewReport({ token }) {
  try {
    const response = await axios.get(`${ADMIN_ENDPOINT}/reports/overview`, {
      headers: buildAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load overview report."));
  }
}

export async function getAdminMonthlyReport({ token, year }) {
  try {
    const response = await axios.get(`${ADMIN_ENDPOINT}/reports/monthly`, {
      headers: buildAuthHeaders(token),
      params: { year },
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to load monthly report."));
  }
}
