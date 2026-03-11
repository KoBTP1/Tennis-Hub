import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import CourtCard from "../../components/CourtCard";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { colors, radius } from "../../styles/theme";

const courts = [
  { name: "Downtown Tennis Center", location: "Downtown", price: "$25/hr", distance: "0.5 km", surface: "Hard Court", rating: "4.8", reviews: 124 },
  { name: "Sunrise Sports Club", location: "Eastside", price: "$30/hr", distance: "1.2 km", surface: "Clay Court", rating: "4.9", reviews: 89 },
];

export default function UserSearchScreen({ onTabPress }) {
  return (
    <View style={styles.root}>
      <AppHeader title="Search Courts" leftText="‹" />
      <ScreenContainer>
        <Card style={styles.searchCard}>
          <TextInput placeholder="Search by name or location..." placeholderTextColor="#9ca3af" style={styles.searchInput} />
        </Card>

        <Text style={styles.filterLabel}>Court Surface</Text>
        <View style={styles.chipRow}>
          {["All Courts", "Hard Court", "Clay Court"].map((chip, index) => (
            <View key={chip} style={[styles.chip, index === 0 ? styles.chipActive : null]}>
              <Text style={[styles.chipText, index === 0 ? styles.chipTextActive : null]}>{chip}</Text>
            </View>
          ))}
        </View>

        <Card>
          <Text style={styles.locationsTitle}>Popular Locations</Text>
          {["Downtown", "Eastside", "Westside", "University District"].map((item) => (
            <Text key={item} style={styles.locationItem}>
              {item}
            </Text>
          ))}
        </Card>

        <Text style={styles.resultCount}>5 courts found</Text>
        {courts.map((court) => (
          <CourtCard key={court.name} {...court} />
        ))}
      </ScreenContainer>
      <TabBar tabs={["Home", "Search", "Bookings", "Profile"]} active="Search" onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchCard: { paddingVertical: 6 },
  searchInput: { color: colors.textPrimary, fontSize: 16, minHeight: 40 },
  filterLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: "600", marginTop: 2 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 9 },
  chipActive: { backgroundColor: colors.success },
  chipText: { color: colors.textPrimary, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  locationsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: colors.textPrimary },
  locationItem: { marginBottom: 10, color: colors.textPrimary, fontSize: 15 },
  resultCount: { color: colors.textSecondary, marginTop: 4 },
});
