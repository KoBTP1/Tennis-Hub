import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const SESSION_STORAGE_KEY = "tennishub_session";
const REMEMBER_ME_STORAGE_KEY = "tennishub_remember_me";
const AUTH_ENDPOINT = `${API_BASE_URL}/auth`;

const normalizeEmail = (email) => email.trim().toLowerCase();
function getApiErrorMessage(error, fallbackMessage) {
  if (!axios.isAxiosError(error)) {
    return error?.message || fallbackMessage;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === "ECONNABORTED") {
    return "Request timeout. Please check your connection and backend server.";
  }

  if (error?.message === "Network Error" || !error?.response) {
    return `Cannot connect to backend API (${API_BASE_URL}). Check Wi-Fi, firewall, and backend server.`;
  }

  return fallbackMessage;
}

export async function registerUser({ name, email, password, phone = "", address = "", role = "player" }) {
  try {
    const response = await axios.post(`${AUTH_ENDPOINT}/register`, {
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      confirmPassword: password,
      phone: phone.trim(),
      address: String(address || "").trim(),
      role,
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to register. Please try again."));
  }
}

export async function loginUser({ email, password, rememberMe = false }) {
  try {
    const response = await axios.post(`${AUTH_ENDPOINT}/login`, {
      email: normalizeEmail(email),
      password,
    });

    const session = {
      token: response.data.token,
      user: response.data.user,
    };

    // Always persist session for current app runtime; bootstrap controls restore by remember flag.
    await AsyncStorage.multiSet([
      [SESSION_STORAGE_KEY, JSON.stringify(session)],
      [REMEMBER_ME_STORAGE_KEY, rememberMe ? "true" : "false"],
    ]);

    return session;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Invalid email or password."));
  }
}

export async function getCurrentSession(options = {}) {
  const { enforceRemember = false } = options;
  if (enforceRemember) {
    const rememberRaw = await AsyncStorage.getItem(REMEMBER_ME_STORAGE_KEY);
    if (rememberRaw !== "true") {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession);

    if (!session?.token || !session?.user) {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    const profileResponse = await axios.get(`${AUTH_ENDPOINT}/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    const nextSession = { token: session.token, user: profileResponse.data.user };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    return nextSession;
  } catch {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export async function logoutUser() {
  await AsyncStorage.multiRemove([SESSION_STORAGE_KEY, REMEMBER_ME_STORAGE_KEY]);
}

export async function updateSessionUser(nextUser) {
  const rawSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession);
    const mergedUser = { ...session.user, ...nextUser };
    const nextSession = { ...session, user: mergedUser };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    return nextSession;
  } catch {
    return null;
  }
}

async function getAuthHeaders() {
  const session = await getCurrentSession();
  if (!session?.token) {
    return {};
  }
  return { Authorization: `Bearer ${session.token}` };
}

export async function updateMyProfile(payload) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.patch(`${AUTH_ENDPOINT}/me`, payload, { headers });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update profile."));
  }
}

export async function uploadMyAvatar(asset) {
  try {
    const headers = await getAuthHeaders();
    const formData = new FormData();
    if (asset?.file) {
      formData.append("avatar", asset.file);
    } else {
      const uri = String(asset?.uri || "").trim();
      if (!uri) {
        throw new Error("Avatar file is required.");
      }
      const ext = uri.split(".").pop() || "jpg";
      formData.append("avatar", {
        uri,
        name: asset?.fileName || `avatar.${ext}`,
        type: asset?.mimeType || "image/jpeg",
      });
    }
    const response = await axios.post(`${AUTH_ENDPOINT}/me/avatar`, formData, {
      headers: {
        ...headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to update avatar."));
  }
}

export async function deleteMyAccount() {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.delete(`${AUTH_ENDPOINT}/me`, { headers });
    await logoutUser();
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to delete account."));
  }
}

export async function requestPasswordReset(email) {
  try {
    const response = await axios.post(`${AUTH_ENDPOINT}/forgot-password`, {
      email: normalizeEmail(email),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to request password reset."));
  }
}

export async function submitPasswordReset({ token, newPassword, confirmPassword }) {
  try {
    const response = await axios.post(`${AUTH_ENDPOINT}/reset-password`, {
      token,
      newPassword,
      confirmPassword,
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Unable to reset password."));
  }
}
