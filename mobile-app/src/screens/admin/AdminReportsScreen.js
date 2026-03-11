import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import ScreenContainer from "../../components/ScreenContainer";
import StatCard from "../../components/StatCard";
import { colors } from "../../styles/theme";

const topCourts = [
  { rank: 1, name: "Downtown Tennis Center", bookings: "45 bookings", revenue: "$1125" },
  { rank: 2, name: "Sunrise Sports Club", bookings: "38 bookings", revenue: "$1140" },
  { rank: 3, name: "University Tennis Courts", bookings: "42 bookings", revenue: "$840" },
];

export default function AdminReportsScreen() {
  return (
    <View style={styles.root}>
      <AppHeader title="Reports & Analytics" leftText="‹" />
      <ScreenContainer>
        <GradientBackground style={styles.export}>
          <Text style={styles.exportText}>Export Full Report</Text>
        </GradientBackground>

        <Text style={styles.section}>Overview</Text>
        <View style={styles.gridRow}>
          <StatCard value="156" label="Total Users" subtitle="+12 this month" />
          <StatCard value="892" label="Total Bookings" subtitle="+78 this month" accent={colors.purple} />
        </View>
        <View style={styles.gridRow}>
          <StatCard value="$24,560" label="Total Revenue" subtitle="All time" accent={colors.success} />
          <StatCard value="45" label="Active Bookings" subtitle="Right now" accent={colors.info} />
        </View>

        <Text style={styles.section}>Monthly Trends (2026)</Text>
        <Card>
          {[
            "Jan                             65 bookings   $1820",
            "Feb                             72 bookings   $2145",
            "Mar                             78 bookings   $2456",
          ].map((line) => (
            <View key={line} style={styles.trendRow}>
              <Text style={styles.trendText}>{line}</Text>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
          ))}
        </Card>

        <Text style={styles.section}>Top Performing Courts</Text>
        <Card>
          {topCourts.map((court) => (
            <View key={court.rank} style={styles.courtRow}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>{court.rank}</Text>
              </View>
              <View style={styles.courtInfo}>
                <Text style={styles.courtName}>{court.name}</Text>
                <Text style={styles.courtSub}>{court.bookings}</Text>
              </View>
              <Text style={styles.revenue}>{court.revenue}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.section}>Booking Status</Text>
        <Card>
          {[
            { label: "Confirmed", value: 45, color: colors.success },
            { label: "Completed", value: 847, color: "#6b7280" },
            { label: "Cancelled", value: 12, color: colors.danger },
          ].map((status) => (
            <View key={status.label} style={styles.statusRow}>
              <Text style={styles.statusLabel}>{status.label}</Text>
              <Text style={styles.statusValue}>{status.value}</Text>
              <View style={styles.statusTrack}>
                <View style={[styles.statusFill, { backgroundColor: status.color }]} />
              </View>
            </View>
          ))}
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  export: { alignItems: "center", paddingVertical: 14, borderRadius: 12 },
  exportText: { color: colors.white, fontWeight: "700", fontSize: 16 },
  section: { color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginTop: 4 },
  gridRow: { flexDirection: "row", gap: 10 },
  trendRow: { marginBottom: 12 },
  trendText: { color: colors.textPrimary, marginBottom: 4 },
  progressTrack: { height: 6, borderRadius: 99, backgroundColor: "#e5e7eb" },
  progressFill: { height: 6, width: "78%", borderRadius: 99, backgroundColor: colors.purple },
  courtRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  rank: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple },
  rankText: { color: colors.white, fontWeight: "700" },
  courtInfo: { flex: 1, marginLeft: 10 },
  courtName: { color: colors.textPrimary, fontWeight: "700" },
  courtSub: { color: colors.textSecondary, fontSize: 12 },
  revenue: { color: colors.success, fontWeight: "700" },
  statusRow: { marginBottom: 10 },
  statusLabel: { color: colors.textPrimary },
  statusValue: { color: colors.textSecondary, marginBottom: 4 },
  statusTrack: { height: 6, borderRadius: 99, backgroundColor: "#e5e7eb" },
  statusFill: { height: 6, width: "70%", borderRadius: 99 },
});
