import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import BookingCard from "../../components/BookingCard";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { colors, radius } from "../../styles/theme";

const upcoming = [
  { title: "Downtown Tennis Center", subtitle: "Sun, Mar 15", time: "10:00", amount: "$25", status: "confirmed" },
  { title: "Westside Athletic Club", subtitle: "Sat, Mar 14", time: "16:00", amount: "$35", status: "confirmed" },
];

const past = [
  { title: "Sunrise Sports Club", subtitle: "Tue, Mar 10", time: "14:00", amount: "$30", status: "completed" },
  { title: "University Tennis Courts", subtitle: "Thu, Mar 5", time: "09:00", amount: "$20", status: "completed" },
];

export default function UserBookingsScreen({ onTabPress }) {
  return (
    <View style={styles.root}>
      <AppHeader title="My Bookings" />
      <ScreenContainer>
        <Card style={styles.tabFilter}>
          {["All", "Upcoming", "Past"].map((tab, index) => (
            <View key={tab} style={[styles.filterPill, index === 0 ? styles.filterPillActive : null]}>
              <Text style={[styles.filterText, index === 0 ? styles.filterTextActive : null]}>{tab}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
        {upcoming.map((item) => (
          <BookingCard key={item.title} {...item} actions={[{ label: "View Details" }]} />
        ))}

        <Text style={styles.sectionTitle}>Past Bookings</Text>
        {past.map((item) => (
          <BookingCard key={item.title} {...item} actions={[{ label: "Leave Review" }]} />
        ))}
      </ScreenContainer>
      <TabBar tabs={["Home", "Search", "Bookings", "Profile"]} active="Bookings" onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabFilter: { flexDirection: "row", gap: 8, padding: 6 },
  filterPill: { flex: 1, alignItems: "center", borderRadius: radius.sm, paddingVertical: 10 },
  filterPillActive: { backgroundColor: colors.info },
  filterText: { color: colors.textPrimary, fontWeight: "600" },
  filterTextActive: { color: colors.white },
  sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: "700", marginTop: 6 },
});
