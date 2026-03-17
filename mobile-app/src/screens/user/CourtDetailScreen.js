import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, Image, Linking, Modal, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors, radius } from "../../styles/theme";
import { getCourtDetail, getCourtSlots, toggleCourtFavorite } from "../../services/courtService";
import { createBooking } from "../../services/bookingService";

function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      card: "#111827",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
    };
  }

  return {
    background: colors.background,
    card: colors.white,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
  };
}

function resolveCourtImageUrl(inputUrl) {
  const raw = String(inputUrl || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image/")) {
    try {
      const parsed = new URL(raw);
      if (parsed.pathname.startsWith("/uploads/")) {
        const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
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
  if (raw.startsWith("file://")) {
    return Platform.OS === "web" ? "" : raw;
  }
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  if (raw.startsWith("/")) {
    return `${apiOrigin}${raw}`;
  }
  return `${apiOrigin}/${raw}`;
}

function parseStyledText(input) {
  let raw = String(input || "").trim();
  const style = { fontWeight: "500", fontStyle: "normal", fontSize: 16, color: null, textAlign: "left" };
  const wrappers = [
    { regex: /^\[size=(\d{1,2})\](.*)\[\/size\]$/is, apply: (match) => ({ key: "fontSize", value: Math.max(12, Math.min(Number(match[1]) || 16, 30)), text: match[2] }) },
    { regex: /^\[color=(#[0-9a-f]{6})\](.*)\[\/color\]$/is, apply: (match) => ({ key: "color", value: match[1], text: match[2] }) },
    { regex: /^\[align=(left|center|right)\](.*)\[\/align\]$/is, apply: (match) => ({ key: "textAlign", value: match[1], text: match[2] }) },
  ];
  let hasWrapper = true;
  while (hasWrapper) {
    hasWrapper = false;
    for (const wrapper of wrappers) {
      const matched = wrapper.regex.exec(raw);
      if (matched) {
        const result = wrapper.apply(matched);
        style[result.key] = result.value;
        raw = String(result.text || "").trim();
        hasWrapper = true;
        break;
      }
    }
  }
  const boldMatch = /^\*\*(.*)\*\*$/s.exec(raw);
  if (boldMatch) {
    style.fontWeight = "700";
    raw = String(boldMatch[1] || "").trim();
  }
  const italicMatch = /^\*(.*)\*$/s.exec(raw);
  if (italicMatch) {
    style.fontStyle = "italic";
    raw = String(italicMatch[1] || "").trim();
  }
  return {
    text: raw,
    style,
  };
}

function parseServiceContent(rawContent) {
  const lines = String(rawContent || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("#")) {
      const title = line.replace(/^#+\s*/, "").trim() || "Dich vu";
      current = { title, rows: [] };
      sections.push(current);
      continue;
    }
    if (!line.includes("|")) {
      continue;
    }
    const [name, ...rest] = line.split("|");
    const price = rest.join("|");
    if (!current) {
      current = { title: "Dich vu", rows: [] };
      sections.push(current);
    }
    current.rows.push({
      name: String(name || "").trim(),
      price: String(price || "").trim(),
    });
  }
  return sections.filter((item) => item.rows.length > 0);
}

function decodeHtmlText(rawText) {
  return String(rawText || "")
    .replaceAll(/<[^>]*>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function parseServiceHtmlTables(rawHtml) {
  const html = String(rawHtml || "");
  if (!/<table[\s\S]*?>/i.test(html)) {
    return [];
  }
  const tableMatches = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  return tableMatches
    .map((tableHtml, tableIndex) => {
      const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      const rows = rowMatches
        .map((rowHtml) => {
          const cellMatches = rowHtml.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) || [];
          const cells = cellMatches.map((cellHtml) => decodeHtmlText(cellHtml)).filter(Boolean);
          return cells;
        })
        .filter((cells) => cells.length > 0);
      if (!rows.length) {
        return null;
      }
      const bodyRows = rows.length > 1 ? rows.slice(1) : rows;
      return {
        title: `Dich vu ${tableIndex + 1}`,
        rows: bodyRows.map((cells) => ({
          name: String(cells[0] || "").trim(),
          price: String(cells[1] || cells.slice(1).join(" | ") || "").trim(),
        })),
      };
    })
    .filter((section) => section && section.rows.some((row) => row.name || row.price));
}

function buildServicePreviewHtml(rawHtml) {
  const safeHtml = String(rawHtml || "")
    .replaceAll(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replaceAll("</script>", "<\\/script>");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { margin: 0; padding: 10px; font-family: Inter, Arial, sans-serif; color: #111827; background: transparent; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; }
      td, th { border: 1px solid #9ca3af; padding: 8px; vertical-align: top; }
    </style>
  </head>
  <body>${safeHtml}</body>
</html>`;
}

function normalizeExternalUrl(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) {
    return "";
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return `https://${raw}`;
}

const ZALO_ICON_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1024px-Icon_of_Zalo.svg.png";

function getFacebookMessageCandidates(rawUrl) {
  const normalized = normalizeExternalUrl(rawUrl);
  if (!normalized) {
    return [];
  }
  const candidates = [];
  try {
    candidates.push(`fb://facewebmodal/f?href=${encodeURIComponent(normalized)}`);
  } catch {
    // Keep fallback link.
  }
  candidates.push(normalized);
  return [...new Set(candidates)];
}

function getZaloMessageCandidates(rawUrl) {
  const normalized = normalizeExternalUrl(rawUrl);
  if (!normalized) {
    return [];
  }
  const candidates = [normalized];
  if (/^https?:\/\/zalo\.me\//i.test(normalized)) {
    candidates.unshift(normalized.replace(/^https?:\/\//i, "zalo://"));
  }
  return [...new Set(candidates)];
}

export default function CourtDetailScreen({
  courtId,
  onBack,
  onTabPress,
  asSheet = false,
  allowBooking = true,
  detailActionLabel = "",
  showBookingActions = allowBooking,
  showHeaderBookingAction = showBookingActions,
  favoriteRevision = 0,
  onFavoriteChanged,
  fetchCourtDetail = getCourtDetail,
  fetchCourtSlots = getCourtSlots,
  forcedFavoriteState = undefined,
  onFavoriteStateChange = null,
}) {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const [court, setCourt] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const effectiveFavorite = typeof forcedFavoriteState === "boolean" ? forcedFavoriteState : isFavorite;
  const palette = getPalette(isDarkMode);
  const selectedDate = new Date().toISOString().split("T")[0];
  const primaryImageUrl = resolveCourtImageUrl(Array.isArray(court?.images) ? court.images[0] : "");
  const galleryImages = Array.isArray(court?.images)
    ? court.images.map((item) => resolveCourtImageUrl(item)).filter(Boolean)
    : [];
  const sortedSlots = useMemo(
    () =>
      [...slots].sort((left, right) =>
        String(left?.startTime || "").localeCompare(String(right?.startTime || ""))
      ),
    [slots]
  );
  const serviceSections = useMemo(() => parseServiceContent(court?.serviceContent || ""), [court?.serviceContent]);
  const serviceHtmlSections = useMemo(() => parseServiceHtmlTables(court?.serviceContent || ""), [court?.serviceContent]);
  const contactLabel = language === "en" ? "Contact" : "Liên hệ";
  const localizedLocation = useMemo(() => {
    if (language === "en") {
      return String(court?.locationEn || court?.locationVi || court?.location || "").trim();
    }
    return String(court?.locationVi || court?.location || court?.locationEn || "").trim();
  }, [court?.location, court?.locationEn, court?.locationVi, language]);
  const hasHtmlServiceContent = /<[^>]+>/.test(String(court?.serviceContent || ""));
  const slotTimeRangeLabel = (() => {
    if (!Array.isArray(slots) || slots.length === 0) {
      return "--:-- - --:--";
    }
    const validSlots = slots.filter((slot) => String(slot?.startTime || "").trim() && String(slot?.endTime || "").trim());
    if (validSlots.length === 0) {
      return "--:-- - --:--";
    }
    const sortedByStart = [...validSlots].sort((left, right) =>
      String(left.startTime || "").localeCompare(String(right.startTime || ""))
    );
    const sortedByEnd = [...validSlots].sort((left, right) =>
      String(left.endTime || "").localeCompare(String(right.endTime || ""))
    );
    const firstStart = String(sortedByStart[0]?.startTime || "").trim();
    const lastEnd = String(sortedByEnd.at(-1)?.endTime || "").trim();
    return `${firstStart || "--:--"} - ${lastEnd || "--:--"}`;
  })();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedDate || "").trim());
      const queryDate = isValidDateFormat ? selectedDate : "";
      const [courtData, slotsData] = await Promise.all([
        fetchCourtDetail(courtId),
        fetchCourtSlots(courtId, queryDate),
      ]);
      setCourt(courtData?.data || null);
      if (typeof forcedFavoriteState !== "boolean") {
        setIsFavorite(Boolean(courtData?.data?.isFavorited));
      }
      setSlots(Array.isArray(slotsData?.data) ? slotsData.data : []);
    } catch (err) {
      setError(err.message || t("loadCourtDetailsFailed"));
      Alert.alert(t("error"), err.message || t("loadCourtDetailsFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courtId, selectedDate, favoriteRevision, fetchCourtDetail, fetchCourtSlots, forcedFavoriteState]);

  useEffect(() => {
    if (typeof forcedFavoriteState === "boolean") {
      setIsFavorite(forcedFavoriteState);
    }
  }, [forcedFavoriteState]);

  const handleToggleFavorite = async () => {
    const previous = effectiveFavorite;
    const optimisticNext = !previous;
    setIsFavorite(optimisticNext);
    onFavoriteStateChange?.(courtId, optimisticNext);
    if ((user?.role || "").toLowerCase() !== "player") {
      return;
    }
    try {
      const response = await toggleCourtFavorite(courtId);
      const serverFavorite = Boolean(response?.data?.isFavorited);
      setIsFavorite(serverFavorite);
      onFavoriteStateChange?.(courtId, serverFavorite);
      onFavoriteChanged?.();
    } catch {
      setIsFavorite(previous);
      onFavoriteStateChange?.(courtId, previous);
      Alert.alert(t("favorite"), t("favoriteUpdateFailed"));
    }
  };

  const handleBook = async (slot) => {
    const selectedCourtId = court?._id || court?.id;
    const selectedSlotId = slot?._id || slot?.id;
    if (!selectedCourtId || !selectedSlotId) {
      Alert.alert(t("bookingFailed"), t("missingCourtOrSlot"));
      return;
    }

    try {
      setIsBooking(true);
      await createBooking({
        courtId: selectedCourtId,
        slotId: selectedSlotId,
      });
      Alert.alert(t("bookingSuccessTitle"), t("bookingSuccessMessage"));
      onBack();
      onTabPress("Bookings");
    } catch (err) {
      Alert.alert(t("bookingFailed"), err.message || t("bookingFailed"));
    } finally {
      setIsBooking(false);
    }
  };

  const handleHeaderBook = () => {
    if (!allowBooking || isBooking) {
      return;
    }
    const firstAvailableSlot = slots.find((slot) => slot?.status === "available");
    if (!firstAvailableSlot) {
      Alert.alert(t("bookingFailed"), t("noAvailableSlots"));
      return;
    }
    void handleBook(firstAvailableSlot);
  };

  const getCoordinates = () => {
    const source = String(court?.mapUrl || "").trim();
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
  };

  const getGoogleMapUrl = () => {
    const directUrl = String(court?.mapUrl || "").trim();
    if (directUrl) {
      return directUrl;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      String(localizedLocation || court?.name || "Tennis court").trim()
    )}`;
  };

  const openGoogleMaps = async () => {
    const mapUrl = getGoogleMapUrl();
    try {
      const canOpen = await Linking.canOpenURL(mapUrl);
      if (!canOpen) {
        Alert.alert(t("map"), t("cannotOpenGoogleMaps"));
        return;
      }
      await Linking.openURL(mapUrl);
    } catch {
      Alert.alert(t("map"), t("cannotOpenGoogleMaps"));
    }
  };

  const openNativeMaps = async () => {
    const fallbackQuery = String(localizedLocation || court?.name || "Tennis court").trim();
    const coordinates = getCoordinates();
    const nativeUrl = Platform.select({
      ios: coordinates
        ? `maps://?ll=${coordinates.lat},${coordinates.lon}&q=${encodeURIComponent(fallbackQuery)}`
        : `maps://?q=${encodeURIComponent(fallbackQuery)}`,
      android: coordinates
        ? `geo:${coordinates.lat},${coordinates.lon}?q=${coordinates.lat},${coordinates.lon}`
        : `geo:0,0?q=${encodeURIComponent(fallbackQuery)}`,
      default: getGoogleMapUrl(),
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

  const handleOpenMap = () => {
    if (Platform.OS === "web") {
      void openGoogleMaps();
      return;
    }
    Alert.alert(t("openMap"), t("chooseMapView"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("defaultMaps"), onPress: () => void openNativeMaps() },
      { text: t("googleMaps"), onPress: () => void openGoogleMaps() },
    ]);
  };

  const handleOpenContactLink = async (type, rawUrl) => {
    const candidates = type === "facebook" ? getFacebookMessageCandidates(rawUrl) : getZaloMessageCandidates(rawUrl);
    if (!candidates.length) {
      return;
    }
    for (const candidate of candidates) {
      try {
        const canOpen = await Linking.canOpenURL(candidate);
        if (canOpen) {
          await Linking.openURL(candidate);
          return;
        }
      } catch {
        // Try next candidate.
      }
    }
    Alert.alert(t("contact"), t("contactCannotOpenLink"));
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <View style={[styles.loadingWrap, asSheet ? styles.sheetTopSpacing : null]}>
          <TouchableOpacity style={styles.roundBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color="#065f46" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.info} />
        </View>
      </View>
    );
  }

  if (error || !court) {
    return (
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <View style={[styles.loadingWrap, asSheet ? styles.sheetTopSpacing : null]}>
          <TouchableOpacity style={styles.roundBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color="#065f46" />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || t("courtNotFound")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, asSheet ? styles.sheetRoot : null, { backgroundColor: palette.background }]}>
      <View style={styles.heroWrap}>
        {primaryImageUrl ? (
          <Image source={{ uri: primaryImageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: "#d1d5db", alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="image-outline" size={42} color="#6b7280" />
          </View>
        )}
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.roundBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={18} color="#065f46" />
          </TouchableOpacity>
          <View style={styles.rightActionWrap}>
            <TouchableOpacity style={styles.roundBtn} onPress={handleOpenMap}>
              <Ionicons name="location-outline" size={17} color="#065f46" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn} onPress={handleToggleFavorite}>
              <Ionicons name={effectiveFavorite ? "heart" : "heart-outline"} size={17} color="#065f46" />
            </TouchableOpacity>
            {showHeaderBookingAction ? (
              <TouchableOpacity style={styles.bookHeaderBtn} onPress={allowBooking ? handleHeaderBook : () => setActiveTab("info")}>
                <Text style={styles.bookHeaderText}>{detailActionLabel || t("book")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
      <ScreenContainer backgroundColor={palette.background}>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={styles.ratingText}>{t("noRatingYet")}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {[
            { key: "info", label: t("tabInfo") },
            { key: "service", label: t("tabService") },
            { key: "images", label: t("tabImages") },
            { key: "terms", label: t("tabTerms") },
            { key: "reviews", label: t("tabReviews") },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, activeTab === tab.key ? styles.tabActive : null]}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : null]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === "images" ? (
          <>
            {galleryImages.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryRow}>
                {galleryImages.map((img) => (
                  <TouchableOpacity
                    key={img}
                    activeOpacity={0.9}
                    onPress={() => {
                      setPreviewImageUrl(img);
                      setIsImagePreviewVisible(true);
                    }}
                  >
                    <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{t("noImages")}</Text>
            )}
          </>
        ) : null}

        {activeTab === "info" ? (
          <Card style={[styles.infoCard, { backgroundColor: palette.card }]}>
            <Text style={[styles.title, { color: palette.textPrimary }]}>{court.name}</Text>
            <View style={styles.infoLine}>
              <Ionicons name="location" size={16} color="#047857" />
              <Text style={[styles.meta, { color: palette.textSecondary }]}>{localizedLocation}</Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons name="time" size={16} color="#047857" />
              <Text style={[styles.meta, { color: palette.textSecondary }]}>{court.openingHours || slotTimeRangeLabel}</Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons name="call" size={16} color="#047857" />
              <Text style={[styles.meta, { color: palette.textSecondary }]}>{`${contactLabel}: ${court.contactPhone || "--"}`}</Text>
            </View>
            {court.facebookLink ? (
              <View style={styles.infoLine}>
                <Ionicons name="logo-facebook" size={16} color="#047857" />
                <TouchableOpacity onPress={() => void handleOpenContactLink("facebook", court.facebookLink)}>
                  <Text style={styles.metaLink}>{t("contactFacebookAction")}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {court.zaloLink ? (
              <View style={styles.infoLine}>
                <Image source={{ uri: ZALO_ICON_URL }} style={styles.zaloIcon} resizeMode="contain" />
                <TouchableOpacity onPress={() => void handleOpenContactLink("zalo", court.zaloLink)}>
                  <Text style={styles.metaLink}>{t("contactZaloAction")}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={[styles.slotHeading, { color: palette.textPrimary }]}>{t("availableSlots")}</Text>
            {sortedSlots.length ? (
              sortedSlots.map((slot, index) => {
                const isAvailable = slot?.status === "available";
                const slotId = slot?._id || slot?.id || `${slot?.startTime || "slot"}-${slot?.endTime || "end"}-${index}`;
                const slotLabel = `${String(slot?.startTime || "--:--").trim()} - ${String(slot?.endTime || "--:--").trim()}`;
                return (
                  <View key={slotId} style={[styles.slotRow, index === sortedSlots.length - 1 ? styles.slotRowLast : null]}>
                    <View style={styles.slotInfo}>
                      <Text style={[styles.slotTime, { color: palette.textPrimary }]}>{slotLabel}</Text>
                      <Text
                        style={[
                          styles.slotStatus,
                          isAvailable ? styles.statusAvailable : styles.statusBooked,
                        ]}
                      >
                        {isAvailable ? t("available") : t("booked")}
                      </Text>
                    </View>
                    {showBookingActions ? (
                      <TouchableOpacity
                        style={[styles.bookBtn, !isAvailable || isBooking ? styles.bookBtnDisabled : null]}
                        disabled={!isAvailable || isBooking}
                        onPress={() => void handleBook(slot)}
                      >
                        <Text style={styles.bookBtnText}>{t("book")}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{t("noAvailableSlots")}</Text>
            )}
          </Card>
        ) : null}

        {activeTab === "service" ? (
          serviceSections.length ? (
            serviceSections.map((section, sectionIndex) => {
              const parsedTitle = parseStyledText(section.title);
              return (
                <Card key={`${section.title}-${sectionIndex}`} style={[styles.serviceCard, { backgroundColor: palette.card }]}>
                  <Text style={[styles.serviceTitle, { color: parsedTitle.style.color || palette.textPrimary, textAlign: parsedTitle.style.textAlign }, parsedTitle.style]}>{parsedTitle.text}</Text>
                  <View style={styles.serviceTable}>
                    {section.rows.map((row, index) => {
                      const parsedName = parseStyledText(row.name);
                      const parsedPrice = parseStyledText(row.price);
                      return (
                        <View key={`${section.title}-${row.name}-${index}`} style={[styles.serviceRow, index === section.rows.length - 1 ? styles.serviceRowLast : null]}>
                          <Text style={[styles.serviceName, { color: parsedName.style.color || palette.textPrimary, textAlign: parsedName.style.textAlign }, parsedName.style]}>{parsedName.text}</Text>
                          <Text style={[styles.servicePrice, { color: parsedPrice.style.color || palette.textPrimary, textAlign: parsedPrice.style.textAlign }, parsedPrice.style]}>{parsedPrice.text}</Text>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              );
            })
          ) : serviceHtmlSections.length ? (
            serviceHtmlSections.map((section, sectionIndex) => (
              <Card key={`${section.title}-${sectionIndex}`} style={[styles.serviceCard, { backgroundColor: palette.card }]}>
                <Text style={[styles.serviceTitle, { color: palette.textPrimary }]}>{section.title}</Text>
                <View style={styles.serviceTable}>
                  {section.rows.map((row, index) => (
                    <View key={`${section.title}-${row.name}-${index}`} style={[styles.serviceRow, index === section.rows.length - 1 ? styles.serviceRowLast : null]}>
                      <Text style={[styles.serviceName, { color: palette.textPrimary }]}>{row.name || "--"}</Text>
                      <Text style={[styles.servicePrice, { color: palette.textPrimary }]}>{row.price || "--"}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ))
          ) : hasHtmlServiceContent ? (
            <Card style={[styles.serviceCard, { backgroundColor: palette.card }]}>
              <WebView source={{ html: buildServicePreviewHtml(court?.serviceContent || "") }} style={styles.serviceHtmlWebView} />
            </Card>
          ) : (
            <Card style={{ backgroundColor: palette.card }}>
              <Text style={[styles.placeholderText, { color: palette.textSecondary }]}>{t("comingSoonContent")}</Text>
            </Card>
          )
        ) : null}

        {activeTab !== "info" && activeTab !== "images" && activeTab !== "service" ? (
          <Card style={{ backgroundColor: palette.card }}>
            <Text style={[styles.placeholderText, { color: palette.textSecondary }]}>
              {t("comingSoonContent")}
            </Text>
          </Card>
        ) : null}
      </ScreenContainer>
      <Modal visible={isImagePreviewVisible} transparent animationType="fade" onRequestClose={() => setIsImagePreviewVisible(false)}>
        <View style={styles.previewBackdrop}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setIsImagePreviewVisible(false)}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          {previewImageUrl ? <Image source={{ uri: previewImageUrl }} style={styles.previewImage} resizeMode="contain" /> : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sheetRoot: { borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden" },
  loadingWrap: { paddingHorizontal: 12, paddingTop: 14 },
  sheetTopSpacing: { paddingTop: 8 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  heroWrap: { position: "relative" },
  heroImage: { width: "100%", height: 180 },
  heroActions: {
    position: "absolute",
    top: 14,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightActionWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  roundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  bookHeaderBtn: {
    backgroundColor: "#f0b429",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  bookHeaderText: { color: "#fff", fontWeight: "800", fontSize: 22 / 1.5 },
  ratingBadge: {
    alignSelf: "center",
    marginTop: -18,
    marginBottom: 8,
    backgroundColor: "#10b981",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  infoCard: { borderRadius: 14 },
  infoLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  errorText: { color: colors.danger, fontSize: 16, textAlign: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary, marginBottom: 8 },
  meta: { fontSize: 16, color: colors.textSecondary },
  metaLink: { fontSize: 16, color: "#10b981", fontWeight: "600" },
  zaloIcon: { width: 16, height: 16, borderRadius: 4 },
  price: { fontSize: 18, color: colors.success, fontWeight: "bold", marginBottom: 4 },
  description: { fontSize: 15, color: colors.textPrimary, marginTop: 8, lineHeight: 22 },
  mapInlineBtn: { marginTop: 4, alignSelf: "flex-start" },
  tabsRow: { marginTop: 12, marginBottom: 8 },
  tabButton: { marginRight: 18, paddingBottom: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#10b981" },
  tabLabel: { color: "#6b7280", fontWeight: "600", fontSize: 15 },
  tabLabelActive: { color: "#10b981", fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: 16 },
  slotHeading: { fontSize: 18, fontWeight: "800", marginTop: 14, marginBottom: 6 },
  slotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d1d5db",
  },
  slotRowLast: { borderBottomWidth: 0 },
  slotInfo: { flex: 1 },
  slotTime: { fontSize: 16, fontWeight: "bold" },
  slotStatus: { fontSize: 14, marginTop: 4 },
  statusAvailable: { color: colors.success },
  statusBooked: { color: colors.textSecondary },
  bookBtn: { backgroundColor: colors.info, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
  bookBtnDisabled: { backgroundColor: "#ccc" },
  bookBtnText: { color: colors.white, fontWeight: "bold", fontSize: 16 },
  galleryRow: { gap: 10, paddingRight: 10 },
  galleryImage: { width: 190, height: 260, borderRadius: 12, marginBottom: 8, backgroundColor: "#e5e7eb" },
  serviceCard: { borderRadius: 12, marginBottom: 10 },
  serviceTitle: { fontSize: 20, fontWeight: "800", marginBottom: 8 },
  serviceTable: {
    borderWidth: 1,
    borderColor: "#9ca3af",
    borderRadius: 10,
    overflow: "hidden",
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#9ca3af",
    paddingHorizontal: 10,
    gap: 8,
  },
  serviceRowLast: { borderBottomWidth: 0 },
  serviceName: { flex: 1, fontSize: 15, fontWeight: "500" },
  servicePrice: { fontSize: 15, fontWeight: "600" },
  serviceHtmlWebView: { width: "100%", height: 360, backgroundColor: "transparent" },
  placeholderText: { fontSize: 14, lineHeight: 20 },
  previewBackdrop: { flex: 1, backgroundColor: "rgba(2, 6, 23, 0.9)", alignItems: "center", justifyContent: "center", padding: 12 },
  previewClose: { position: "absolute", top: 40, right: 20, zIndex: 2 },
  previewImage: { width: "100%", height: "86%" },
});
