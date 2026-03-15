import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import BookingCard from "../../components/BookingCard";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";

const items = [
  {
    title: "Alex Morgan",
    subtitle: "Downtown Tennis Center",
    date: "Mar 15, 2026",
    time: "10:00 (1 hour)",
    amount: "$25",
    status: "confirmed",
    actions: [{ label: "Mark Complete" }, { label: "Cancel", type: "danger" }],
  },
  {
    title: "Alex Morgan",
    subtitle: "University Tennis Courts",
    date: "Mar 5, 2026",
    time: "09:00 (1 hour)",
    amount: "$20",
    status: "completed",
  },
];

export default function OwnerBookingsScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader title="View Bookings" leftText="‹" />
      <ScreenContainer>
        <Card style={styles.filters}>
          {["All", "Confirmed", "Completed", "Cancelled"].map((tab, index) => (
            <View key={tab} style={[styles.pill, index === 0 ? styles.pillActive : null]}>
              <Text style={[styles.pillText, index === 0 ? styles.pillTextActive : null]}>{tab}</Text>
            </View>
          ))}
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={styles.statValue}>$45</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </Card>
        </View>

        {items.map((item, index) => (
          <BookingCard key={`${item.title}-${index}`} {...item} />
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.full, backgroundColor: "#f3f4f6" },
  pillActive: { backgroundColor: colors.info },
  pillText: { color: colors.textPrimary, fontWeight: "600" },
  pillTextActive: { color: colors.white },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  statLabel: { color: colors.textSecondary },
});
