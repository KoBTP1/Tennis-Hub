import Constants from "expo-constants";

function getExpoHost() {
  const hostUri = Constants.expoConfig?.hostUri || "";
  if (!hostUri) {
    return "";
  }

  return hostUri.split(":")[0];
}

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
  const expoHost = getExpoHost();

  if (!expoHost) {
    return configuredUrl;
  }

  return configuredUrl.replace("localhost", expoHost).replace("127.0.0.1", expoHost);
}

export const API_BASE_URL = resolveApiBaseUrl();
