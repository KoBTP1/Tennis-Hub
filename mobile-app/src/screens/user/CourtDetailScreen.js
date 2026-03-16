import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, Image, Linking, Modal, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

export default function CourtDetailScreen({
  courtId,
  onBack,
  onTabPress,
  asSheet = false,
  allowBooking = true,
  detailActionLabel = "",
  showBookingActions = allowBooking,
  showHeaderBookingAction = showBookingActions,
}) {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [court, setCourt] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isFavorite, setIsFavorite] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
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
        getCourtDetail(courtId),
        getCourtSlots(courtId, queryDate),
      ]);
      setCourt(courtData?.data || null);
      setIsFavorite(Boolean(courtData?.data?.isFavorited));
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
  }, [courtId, selectedDate]);

  const handleToggleFavorite = async () => {
    const previous = isFavorite;
    setIsFavorite(!previous);
    if ((user?.role || "").toLowerCase() !== "player") {
      return;
    }
    try {
      const response = await toggleCourtFavorite(courtId);
      setIsFavorite(Boolean(response?.data?.isFavorited));
    } catch {
      setIsFavorite(previous);
      Alert.alert("Favorite", "Unable to update favorite at this moment.");
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
      String(court?.location || court?.name || "Tennis court").trim()
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
    const fallbackQuery = String(court?.location || court?.name || "Tennis court").trim();
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
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={17} color="#065f46" />
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
              <Text style={[styles.meta, { color: palette.textSecondary }]}>{court.location}</Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons name="time" size={16} color="#047857" />
              <Text style={[styles.meta, { color: palette.textSecondary }]}>{slotTimeRangeLabel}</Text>
            </View>
            <View style={styles.infoLine}>
              <Ionicons name="navigate" size={16} color="#047857" />
              <Text style={[styles.metaLink, { color: "#10b981" }]}>{t("viewCourtOnMap")}</Text>
            </View>
            <TouchableOpacity style={styles.mapInlineBtn} onPress={handleOpenMap}>
              <Text style={styles.metaLink}>{t("openMapInline")}</Text>
            </TouchableOpacity>

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

        {activeTab !== "info" && activeTab !== "images" ? (
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
  placeholderText: { fontSize: 14, lineHeight: 20 },
  previewBackdrop: { flex: 1, backgroundColor: "rgba(2, 6, 23, 0.9)", alignItems: "center", justifyContent: "center", padding: 12 },
  previewClose: { position: "absolute", top: 40, right: 20, zIndex: 2 },
  previewImage: { width: "100%", height: "86%" },
});
