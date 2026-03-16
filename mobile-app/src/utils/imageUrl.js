import { Platform } from "react-native";
import { API_BASE_URL } from "../config/api";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function normalizeImageUrl(inputUrl) {
  const raw = String(inputUrl || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("file://")) {
    return Platform.OS === "web" ? "" : raw;
  }
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image/")) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/uploads/")) {
        const fallback = new URL(API_ORIGIN);
        parsed.protocol = fallback.protocol;
        parsed.host = fallback.host;
        return parsed.toString();
      }
    } catch {
      return raw;
    }
    return raw;
  }
  if (raw.startsWith("/")) {
    return `${API_ORIGIN}${raw}`;
  }
  return `${API_ORIGIN}/${raw}`;
}
