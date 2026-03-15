import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { useTheme } from "../../context/ThemeContext";
import { searchCourts } from "../../services/courtService";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "../../styles/theme";

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

export default function UserHomeScreen({ onTabPress, onOpenCourt }) {
  const { isDarkMode, theme } = useTheme();
  const topInset = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const palette = getPalette(isDarkMode);
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

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
        setCourts(Array.isArray(response?.data) ? response.data : []);
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
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: 12 + topInset }]}
      >
        <Text style={[styles.headerTitle, isDarkMode ? styles.softWhiteText : null]}>Tennis Courts</Text>
      </LinearGradient>

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
            courts.map((court) => (
              <TouchableOpacity key={court._id || court.id || court.name} activeOpacity={0.9} onPress={() => onOpenCourt?.(court._id || court.id)}>
                <Card style={[styles.courtCard, { backgroundColor: palette.card }]}>
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>${court.pricePerHour || 0}/hr</Text>
                  </View>
                  <View style={[styles.courtImageWrap, { backgroundColor: palette.imageBg }]}>
                    {Array.isArray(court.images) && court.images[0] ? (
                      <Image source={{ uri: court.images[0] }} style={styles.courtImage} resizeMode="cover" />
                    ) : (
                      <Ionicons name="image-outline" size={66} color="#9ca3af" />
                    )}
                  </View>
                  <View style={styles.courtInfo}>
                    <Text style={[styles.courtTitle, { color: palette.textPrimary }]}>{court.name}</Text>
                    <Text style={[styles.courtMeta, { color: palette.textSecondary }]}>{court.location}</Text>
                    <View style={styles.courtMetaRow}>
                      <Text style={[styles.distance, { marginLeft: 0 }]}>${court.pricePerHour || 0}/hour</Text>
                      <Text style={[styles.surface, { color: palette.textSecondary }]}>{court.status || "approved"}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
        </ScreenContainer>
      </KeyboardAvoidingView>
      <TabBar tabs={["Home", "Bookings", "Profile"]} active="Home" onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { color: colors.white, fontSize: 30, fontWeight: "700" },
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
  courtCard: { marginBottom: 2, padding: 0, overflow: "hidden" },
  pricePill: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 3,
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pricePillText: { color: colors.success, fontWeight: "700", fontSize: 14 },
  courtImageWrap: {
    height: 168,
    backgroundColor: "#ebedf0",
    alignItems: "center",
    justifyContent: "center",
  },
  courtImage: { width: "100%", height: "100%" },
  courtInfo: { paddingHorizontal: 14, paddingVertical: 10 },
  courtTitle: { fontSize: 34 / 2, fontWeight: "800", color: "#111827" },
  courtMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 16 },
  courtMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  distance: { marginLeft: "auto", color: colors.success, fontSize: 16, fontWeight: "600" },
  surface: { color: "#6b7280", fontSize: 15 },
});
