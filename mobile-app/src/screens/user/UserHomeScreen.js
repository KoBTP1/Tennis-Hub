import React from "react";
import { Platform, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "../../styles/theme";

const nearbyCourts = [
  { name: "Downtown Tennis Center", location: "Downtown", price: "$25/hr", distance: "0.5 km", surface: "Hard Court", rating: "4.8", reviews: 124 },
  { name: "Sunrise Sports Club", location: "Eastside", price: "$30/hr", distance: "1.2 km", surface: "Clay Court", rating: "4.9", reviews: 89 },
];

export default function UserHomeScreen({ onTabPress }) {
  const topInset = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0FAF7C", "#1E66E8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: 12 + topInset }]}
      >
        <Text style={styles.headerTitle}>Tennis Courts</Text>
      </LinearGradient>

      <ScreenContainer contentStyle={styles.content}>
        <LinearGradient colors={["#0FAF7C", "#1E66E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hero}>
          <Text style={styles.heroTitle}>Find Your Court</Text>
          <Text style={styles.heroSub}>Book the perfect tennis court near you</Text>
        </LinearGradient>

        <Card style={styles.searchCard}>
          <Ionicons name="search-outline" size={20} color="#9ca3af" />
          <TextInput placeholder="Search courts by location..." placeholderTextColor="#9ca3af" style={styles.searchInput} />
        </Card>

        <View style={styles.sectionRow}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="location-outline" size={18} color={colors.success} />
            <Text style={styles.sectionTitle}>Nearby Courts</Text>
          </View>
          <Text style={styles.link}>View All</Text>
        </View>

        {nearbyCourts.map((court) => (
          <Card key={court.name} style={styles.courtCard}>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>{court.price}</Text>
            </View>
            <View style={styles.courtImageWrap}>
              <Ionicons name="image-outline" size={66} color="#9ca3af" />
            </View>
            <View style={styles.courtInfo}>
              <Text style={styles.courtTitle}>{court.name}</Text>
              <Text style={styles.courtMeta}>{court.location}</Text>
              <View style={styles.courtMetaRow}>
                <Text style={styles.rating}>★ {court.rating}</Text>
                <Text style={styles.reviewCount}>({court.reviews})</Text>
                <Text style={styles.distance}>{court.distance}</Text>
                <Text style={styles.surface}>{court.surface}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScreenContainer>
      <TabBar tabs={["Home", "Search", "Bookings", "Profile"]} active="Home" onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { color: colors.white, fontSize: 30, fontWeight: "700" },
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
  courtInfo: { paddingHorizontal: 14, paddingVertical: 10 },
  courtTitle: { fontSize: 34 / 2, fontWeight: "800", color: "#111827" },
  courtMeta: { color: colors.textSecondary, marginTop: 4, fontSize: 16 },
  courtMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  rating: { color: "#f59e0b", fontWeight: "700", fontSize: 16 },
  reviewCount: { color: colors.textSecondary, fontSize: 14 },
  distance: { marginLeft: "auto", color: colors.success, fontSize: 16, fontWeight: "600" },
  surface: { color: "#6b7280", fontSize: 15 },
});
