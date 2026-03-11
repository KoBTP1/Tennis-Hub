import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import CourtCard from "../../components/CourtCard";
import ScreenContainer from "../../components/ScreenContainer";
import { colors, radius } from "../../styles/theme";

const courts = [
  { name: "Downtown Tennis Center", location: "Downtown", price: "$25/hour", rating: "4.8", reviews: 124, badge: "Active" },
  { name: "Sunrise Sports Club", location: "Eastside", price: "$30/hour", rating: "4.9", reviews: 89, badge: "Active" },
  { name: "University Tennis Courts", location: "University District", price: "$20/hour", rating: "4.5", reviews: 203, badge: "Active" },
];

export default function AdminCourtsScreen() {
  return (
    <View style={styles.root}>
      <AppHeader title="Manage Courts" leftText="‹" />
      <ScreenContainer>
        <Card style={styles.searchCard}>
          <TextInput
            placeholder="Search courts by name, location or owner..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </Card>

        <View style={styles.filters}>
          {["All", "Active", "Pending"].map((f, index) => (
            <View key={f} style={[styles.pill, index === 0 ? styles.pillActive : null]}>
              <Text style={[styles.pillText, index === 0 ? styles.pillTextActive : null]}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Total Courts</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
        </View>

        <Text style={styles.count}>5 courts found</Text>
        {courts.map((court) => (
          <CourtCard
            key={court.name}
            {...court}
            actions={[
              { label: "View Details" },
              { label: "Approve" },
              { label: "Suspend", type: "danger" },
            ]}
          />
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchCard: { paddingVertical: 6 },
  searchInput: { minHeight: 40, fontSize: 16 },
  filters: { flexDirection: "row", gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  pillActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  pillText: { fontWeight: "600", color: colors.textPrimary },
  pillTextActive: { color: colors.white },
  statRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 30, fontWeight: "800", color: colors.info },
  statLabel: { color: colors.textSecondary },
  count: { color: colors.textSecondary, marginTop: 4 },
});
