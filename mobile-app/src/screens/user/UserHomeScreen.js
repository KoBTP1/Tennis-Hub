import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import CourtCard from "../../components/CourtCard";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { API_BASE_URL } from "../../config/api";
import { useTheme } from "../../context/ThemeContext";
import { searchCourts, toggleCourtFavorite } from "../../services/courtService";
import { LinearGradient } from "expo-linear-gradient";
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

export default function UserHomeScreen({ onTabPress, onOpenCourt }) {
  const { isDarkMode, theme } = useTheme();
  const palette = getPalette(isDarkMode);
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);

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
  }, [searchKeyword]);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <RoleTopBar />

      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer contentStyle={styles.content} backgroundColor={palette.background}>
          <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hero}>
            <Text style={[styles.heroTitle, isDarkMode ? styles.softWhiteText : null]}>Find Your Court</Text>
            <Text style={styles.heroSub}>Book the perfect tennis court near you</Text>
          </LinearGradient>

          <Card style={[styles.searchCard, { backgroundColor: palette.card }]}>
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              placeholder="Search courts by name or location..."
              placeholderTextColor="#9ca3af"
              style={[styles.searchInput, { color: palette.textPrimary }]}
            />
          </Card>

          <View style={styles.sectionRow}>
            <View style={styles.sectionTitleWrap}>
              <Ionicons name="location-outline" size={18} color={colors.success} />
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Nearby Courts</Text>
            </View>
            <Text style={styles.link}>{courts.length} courts</Text>
          </View>

          {isLoading ? <ActivityIndicator size="small" color={theme.info} /> : null}
          {!isLoading && courts.length === 0 ? (
            <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No courts found.</Text>
          ) : null}
          {!isLoading &&
            courts.map((court) => {
              const courtId = court._id || court.id;
              const images = Array.isArray(court.images)
                ? court.images.map((item) => resolveCourtImageUrl(item)).filter(Boolean)
                : [];
              const isFavorite = favoriteIds.includes(String(courtId));
              return (
                <CourtCard
                  key={courtId || court.name}
                  name={court.name}
                  location={court.location}
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
                    } catch {
                      setFavoriteIds(previous);
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
  softWhiteText: { color: "#E5E5E5" },
  content: { paddingTop: 12, paddingHorizontal: 12, paddingBottom: 24 },
  hero: { borderRadius: radius.md, padding: 18 },
  heroTitle: { color: colors.white, fontSize: 46, fontWeight: "800" },
  heroSub: { color: "#dbeafe", marginTop: 6, fontSize: 18 },
  searchCard: { paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { color: colors.textPrimary, fontSize: 17, minHeight: 38, flex: 1 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  sectionTitleWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 34, fontWeight: "800", color: colors.textPrimary },
  link: { color: colors.success, fontWeight: "700", fontSize: 16 },
  emptyText: { textAlign: "center", marginTop: 4, marginBottom: 8, fontSize: 15 },
});
