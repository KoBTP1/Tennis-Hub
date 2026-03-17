import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CourtCard from "../../components/CourtCard";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { API_BASE_URL } from "../../config/api";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { searchCourts, toggleCourtFavorite } from "../../services/courtService";
import { colors, radius } from "../../styles/theme";
import { formatVNDPerHour } from "../../utils/currency";
function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      card: "#111827",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
      inputBg: "#0b1220",
      imageBg: "#1f2937",
      border: "#1e293b",
    };
  }

  return {
    background: colors.background,
    card: colors.white,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    inputBg: colors.white,
    imageBg: "#ebedf0",
    border: colors.border,
  };
}

function resolveCourtImageUrl(inputUrl) {
  const raw = String(inputUrl || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image/")) {
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

export default function UserHomeScreen({
  onTabPress,
  onOpenCourt,
  onNavigate,
  favoritesRevision = 0,
  onFavoriteChanged,
  favoriteOverrides = {},
  onFavoriteStateChange,
}) {
  const { isDarkMode, theme } = useTheme();
  const { t, language } = useLanguage();
  const palette = getPalette(isDarkMode);
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCourts = async () => {
      try {
        setIsLoading(true);
        const response = await searchCourts({
          keyword: searchKeyword,
          page: 1,
          limit: 50,
        });
        if (!mounted) {
          return;
        }
        const list = Array.isArray(response?.data) ? response.data : [];
        setCourts(list);
        const nextFavorites = list
          .filter((item) => Boolean(item?.isFavorited))
          .map((item) => String(item?._id || item?.id || ""));
        setFavoriteIds(nextFavorites.filter(Boolean));
      } catch {
        if (!mounted) {
          return;
        }
        setCourts([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      loadCourts();
    }, 250);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [searchKeyword, favoritesRevision]);

  const decoratedCourts = useMemo(
    () =>
      courts.map((court) => {
        const courtId = court._id || court.id;
        const favoriteKey = String(courtId || "");
        const hasOverride = Object.hasOwn(favoriteOverrides, favoriteKey);
        const isFavorite = hasOverride ? Boolean(favoriteOverrides[favoriteKey]) : favoriteIds.includes(favoriteKey);
        return { court, courtId, isFavorite };
      }),
    [courts, favoriteOverrides, favoriteIds]
  );

  const visibleCourts = useMemo(
    () => (showFavoritesOnly ? decoratedCourts.filter((item) => item.isFavorite) : decoratedCourts),
    [decoratedCourts, showFavoritesOnly]
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <RoleTopBar onAvatarPress={() => onNavigate?.("edit-profile")} />

      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer contentStyle={styles.content} backgroundColor={palette.background}>
          <View style={styles.searchRow}>
            <View style={[styles.searchWrap, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                value={searchKeyword}
                onChangeText={setSearchKeyword}
                placeholder={t("homeSearchPlaceholder")}
                placeholderTextColor="#9ca3af"
                style={[styles.searchInput, { color: palette.textPrimary }]}
              />
              <Ionicons name="scan-outline" size={18} color={theme.success} />
            </View>
            <TouchableOpacity
              style={[styles.heartBtn, { borderColor: palette.border, backgroundColor: palette.card }]}
              onPress={() => setShowFavoritesOnly((prev) => !prev)}
            >
              <Ionicons name={showFavoritesOnly ? "heart" : "heart-outline"} size={20} color={theme.success} />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleWrap}>
              <Ionicons name="location-outline" size={18} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                {showFavoritesOnly ? (language === "en" ? "Favorites" : "Sân đã tym") : t("homeNearbyCourts")}
              </Text>
            </View>
            <Text style={styles.link}>{`${visibleCourts.length} ${t("homeCourtsCount")}`}</Text>
          </View>

          {isLoading ? <ActivityIndicator size="small" color={theme.info} /> : null}
          {!isLoading && visibleCourts.length === 0 ? (
            <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{t("homeNoCourtsFound")}</Text>
          ) : null}
          {!isLoading &&
            visibleCourts.map(({ court, courtId, isFavorite }) => {
              const images = Array.isArray(court.images)
                ? court.images.map((item) => resolveCourtImageUrl(item)).filter(Boolean)
                : [];
              return (
                <CourtCard
                  key={courtId || court.name}
                  name={court.name}
                  location={
                    language === "en"
                      ? court.locationEn || court.locationVi || court.location
                      : court.locationVi || court.location || court.locationEn
                  }
                  mapUrl={court.mapUrl}
                  price={formatVNDPerHour(court.pricePerHour || 0)}
                  imageUrl={images[0] || ""}
                  imageUrls={images}
                  isFavorite={isFavorite}
                  onToggleFavorite={async () => {
                    const id = String(courtId);
                    const previous = favoriteIds;
                    const optimistic = previous.includes(id)
                      ? previous.filter((item) => item !== id)
                      : [...previous, id];
                    setFavoriteIds(optimistic);
                    onFavoriteStateChange?.(id, optimistic.includes(id));
                    try {
                      const response = await toggleCourtFavorite(courtId);
                      const serverFavorite = Boolean(response?.data?.isFavorited);
                      setFavoriteIds((prev) => {
                        if (serverFavorite && !prev.includes(id)) {
                          return [...prev, id];
                        }
                        if (!serverFavorite && prev.includes(id)) {
                          return prev.filter((item) => item !== id);
                        }
                        return prev;
                      });
                      onFavoriteStateChange?.(id, serverFavorite);
                      onFavoriteChanged?.();
                    } catch {
                      setFavoriteIds(previous);
                      onFavoriteStateChange?.(id, previous.includes(id));
                    }
                  }}
                  showPrimaryAction={false}
                  onPress={() => onOpenCourt?.(courtId)}
                />
              );
            })}
        </ScreenContainer>
      </KeyboardAvoidingView>
      <TabBar tabs={["Home", "Bookings", "Profile"]} active="Home" onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  content: { paddingTop: 12, paddingHorizontal: 12, paddingBottom: 24 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heartBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInput: { color: colors.textPrimary, fontSize: 17, minHeight: 38, flex: 1 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 32, fontWeight: "800", color: colors.textPrimary },
  link: { color: colors.success, fontWeight: "700", fontSize: 16 },
  emptyText: { textAlign: "center", marginTop: 4, marginBottom: 8, fontSize: 15 },
});
