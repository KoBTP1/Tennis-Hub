import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "./Card";
import { API_BASE_URL } from "../config/api";
import { useTheme } from "../context/ThemeContext";
import { colors, radius } from "../styles/theme";

export default function CourtCard({
  name,
  location,
  price,
  distance,
  surface,
  rating,
  reviews,
  badge,
  imageUrl,
  imageUrls = [],
  mapUrl,
  actions = [],
  onPress,
  isFavorite = false,
  onToggleFavorite,
  primaryActionLabel = "XEM CHI TIẾT",
  onPrimaryAction,
  showPrimaryAction = true,
}) {
  const { theme } = useTheme();
  const [localFavorite, setLocalFavorite] = useState(Boolean(isFavorite));
  const apiOrigin = useMemo(() => API_BASE_URL.replace(/\/api\/?$/, ""), []);
  const effectiveFavorite = onToggleFavorite ? Boolean(isFavorite) : localFavorite;
  const primaryImage =
    normalizeImageUrl((Array.isArray(imageUrls) && imageUrls[0]) || imageUrl || "", apiOrigin);
  const mapQuery = String(location || "").trim();
  const googleMapUrl = useMemo(() => {
    const directUrl = String(mapUrl || "").trim();
    if (directUrl) {
      return directUrl;
    }
    const fallbackQuery = mapQuery || "Tennis court";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`;
  }, [mapQuery, mapUrl]);

  const coordinates = useMemo(() => {
    const source = googleMapUrl;
    const markerRegex = /query=([-+]?\d+(?:\.\d+)?),\s*([-+]?\d+(?:\.\d+)?)/i;
    const markerMatch = markerRegex.exec(source);
    if (!markerMatch) {
      return null;
    }
    const lat = Number(markerMatch[1]);
    const lon = Number(markerMatch[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    return { lat, lon };
  }, [googleMapUrl]);

  const openGoogleMaps = async () => {
    try {
      const canOpen = await Linking.canOpenURL(googleMapUrl);
      if (!canOpen) {
        Alert.alert("Map", "Cannot open Google Maps link.");
        return;
      }
      await Linking.openURL(googleMapUrl);
    } catch {
      Alert.alert("Map", "Cannot open Google Maps link.");
    }
  };

  const openNativeMaps = async () => {
    const fallbackQuery = mapQuery || "Tennis court";
    const nativeUrl = Platform.select({
      ios: coordinates
        ? `maps://?ll=${coordinates.lat},${coordinates.lon}&q=${encodeURIComponent(fallbackQuery)}`
        : `maps://?q=${encodeURIComponent(fallbackQuery)}`,
      android: coordinates ? `geo:${coordinates.lat},${coordinates.lon}?q=${coordinates.lat},${coordinates.lon}` : `geo:0,0?q=${encodeURIComponent(fallbackQuery)}`,
      default: googleMapUrl,
    });
    try {
      const canOpen = await Linking.canOpenURL(nativeUrl);
      if (!canOpen) {
        await openGoogleMaps();
        return;
      }
      await Linking.openURL(nativeUrl);
    } catch {
      await openGoogleMaps();
    }
  };

  const handleOpenMap = (event) => {
    event?.stopPropagation?.();
    if (Platform.OS === "web") {
      void openGoogleMaps();
      return;
    }
    Alert.alert("Open map", "Choose how you want to view this location.", [
      { text: "Cancel", style: "cancel" },
      { text: "Default Maps", onPress: () => void openNativeMaps() },
      { text: "Google Maps", onPress: () => void openGoogleMaps() },
    ]);
  };

  useEffect(() => {
    if (onToggleFavorite) {
      setLocalFavorite(Boolean(isFavorite));
    }
  }, [isFavorite, onToggleFavorite]);

  return (
    <Card style={[styles.card, { backgroundColor: theme.card }]}>
      <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
        <View style={styles.imageSection}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.bannerImage,
                { backgroundColor: theme.mutedBackground },
              ]}
            />
          )}
          <View style={styles.topOverlay}>
            <View style={styles.tagRow}>
              <View style={styles.greenTag}>
                <Text style={styles.tagText}>Đơn ngày</Text>
              </View>
              <View style={styles.pinkTag}>
                <Text style={styles.tagText}>Sự kiện</Text>
              </View>
            </View>
            <View style={styles.iconActions}>
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.85}
                onPress={(event) => {
                  event?.stopPropagation?.();
                  if (onToggleFavorite) {
                    onToggleFavorite();
                    return;
                  }
                  setLocalFavorite((prev) => !prev);
                }}
              >
                <Ionicons name={effectiveFavorite ? "heart" : "heart-outline"} size={16} color="#065f46" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.85} onPress={handleOpenMap}>
                <Ionicons name="location-outline" size={16} color="#065f46" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <TouchableOpacity style={styles.brandDot} onPress={handleOpenMap} activeOpacity={0.85}>
            <Ionicons name="navigate" size={16} color="#065f46" />
          </TouchableOpacity>
          <View style={styles.content}>
            <Text
              style={[styles.title, { color: theme.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              style={[styles.meta, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {location}
            </Text>
            <View style={styles.bottomMeta}>
              <Text style={[styles.sub, { color: theme.textSecondary }]}>
                {price}
              </Text>
              {rating ? (
                <Text style={[styles.sub, { color: theme.textSecondary }]}>
                  ★ {rating}
                  {reviews ? ` (${reviews})` : ""}
                </Text>
              ) : null}
            </View>
          </View>
          {showPrimaryAction ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={onPrimaryAction || onPress}
            >
              <Text style={styles.primaryBtnText}>{primaryActionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {badge ? (
          <View style={styles.badgeRow}>
            <Text
              style={[
                styles.badge,
                { color: theme.success, backgroundColor: theme.successSoft },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
      {actions.length ? (
        <View style={styles.actionRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.actionBtn,
                { backgroundColor: theme.gradientEnd || theme.info },
                action.type === "danger" ? styles.actionDangerBrand : null,
                action.disabled ? styles.actionDisabled : null,
              ]}
              onPress={action.onPress}
              disabled={Boolean(action.disabled)}
            >
              <Text style={[styles.actionText, { color: colors.white }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function normalizeImageUrl(inputUrl, apiOrigin) {
  const raw = String(inputUrl || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("file://")) {
    return Platform.OS === "web" ? "" : raw;
  }
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    return raw.startsWith("/") ? `${apiOrigin}${raw}` : `${apiOrigin}/${raw}`;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.pathname.startsWith("/uploads/")) {
      const fallback = new URL(apiOrigin);
      parsed.protocol = fallback.protocol;
      parsed.host = fallback.host;
      return parsed.toString();
    }
  } catch {
    return raw;
  }
  return raw;
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 0, overflow: "hidden", borderRadius: 14 },
  imageSection: { position: "relative" },
  bannerImage: { width: "100%", height: 130 },
  topOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagRow: { flexDirection: "row", gap: 6 },
  greenTag: {
    backgroundColor: "#22c55e",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinkTag: {
    backgroundColor: "#e879f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  iconActions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  brandDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f7fee7",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800", color: "#065f46" },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    fontSize: 12,
    fontWeight: "600",
  },
  meta: { marginTop: 2, fontSize: 13 },
  bottomMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sub: { fontSize: 13 },
  primaryBtn: {
    backgroundColor: "#f0b429",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  badgeRow: { paddingHorizontal: 10, paddingBottom: 8 },
  actionRow: { flexDirection: "row", marginTop: 10, gap: 8 },
  actionBtn: {
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionDangerBrand: { opacity: 0.9 },
  actionDisabled: { opacity: 0.45 },
  actionText: { fontWeight: "600" },
});
