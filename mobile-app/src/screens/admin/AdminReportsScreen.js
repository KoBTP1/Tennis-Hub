import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import ScreenContainer from "../../components/ScreenContainer";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getAdminMonthlyReport, getAdminOverviewReport } from "../../services/adminService";
import { colors } from "../../styles/theme";

const DEFAULT_OVERVIEW = {
  totals: { users: 0, courts: 0, bookings: 0, revenue: 0, activeBookings: 0 },
  bookingStatus: { confirmed: 0, completed: 0, cancelled: 0 },
  topCourts: [],
};

export default function AdminReportsScreen({ onNavigate }) {
  const { token } = useAuth();
  const currentYear = new Date().getFullYear();
  const [overview, setOverview] = useState(DEFAULT_OVERVIEW);
  const [monthly, setMonthly] = useState({ year: currentYear, months: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadReports = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [overviewResponse, monthlyResponse] = await Promise.all([
          getAdminOverviewReport({ token }),
          getAdminMonthlyReport({ token, year: currentYear }),
        ]);

        if (!mounted) {
          return;
        }

        setOverview(overviewResponse.data || DEFAULT_OVERVIEW);
        setMonthly(monthlyResponse.data || { year: currentYear, months: [] });
      } catch (error) {
        Alert.alert("Load reports failed", error.message);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadReports();
    return () => {
      mounted = false;
    };
  }, [token, currentYear]);

  const monthlyRows = useMemo(() => {
    return (monthly.months || []).filter((item) => item.bookings > 0 || item.revenue > 0);
  }, [monthly.months]);

  const topCourts = overview.topCourts || [];
  const maxBookingStatusValue = Math.max(
    1,
    overview.bookingStatus.confirmed || 0,
    overview.bookingStatus.completed || 0,
    overview.bookingStatus.cancelled || 0
  );

  return (
    <View style={styles.root}>
      <AppHeader title="Reports & Analytics" leftText="‹" onLeftPress={() => onNavigate?.("dashboard")} />
      <ScreenContainer>
        <GradientBackground style={styles.export}>
          <Text style={styles.exportText}>Export Full Report</Text>
        </GradientBackground>

        <Text style={styles.section}>Overview</Text>
        <View style={styles.gridRow}>
          <StatCard value={overview.totals.users} label="Total Users" subtitle="From database" />
          <StatCard value={overview.totals.bookings} label="Total Bookings" subtitle="All statuses" accent={colors.purple} />
        </View>
        <View style={styles.gridRow}>
          <StatCard value={`$${overview.totals.revenue}`} label="Total Revenue" subtitle="All time" accent={colors.success} />
          <StatCard value={overview.totals.activeBookings} label="Active Bookings" subtitle="Confirmed" accent={colors.info} />
        </View>

        {isLoading ? <ActivityIndicator size="large" color={colors.info} style={styles.loader} /> : null}

        <Text style={styles.section}>Monthly Trends ({monthly.year || currentYear})</Text>
        <Card>
          {monthlyRows.length === 0 ? <Text style={styles.empty}>No booking data for this year.</Text> : null}
          {monthlyRows.map((line) => (
            <View key={line.month} style={styles.trendRow}>
              <Text style={styles.trendText}>
                Month {line.month} - {line.bookings} bookings - ${line.revenue}
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, Math.round((line.bookings / Math.max(1, overview.totals.bookings)) * 100))}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>

        <Text style={styles.section}>Top Performing Courts</Text>
        <Card>
          {topCourts.length === 0 ? <Text style={styles.empty}>No top courts yet.</Text> : null}
          {topCourts.map((court, index) => (
            <View key={String(court.courtId)} style={styles.courtRow}>
              <View style={styles.rank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.courtInfo}>
                <Text style={styles.courtName}>{court.courtName}</Text>
                <Text style={styles.courtSub}>{court.totalBookings} bookings</Text>
              </View>
              <Text style={styles.revenue}>${court.revenue}</Text>
            </View>
          ))}
        </Card>

        <Text style={styles.section}>Booking Status</Text>
        <Card>
          {[
            { label: "Confirmed", value: overview.bookingStatus.confirmed || 0, color: colors.success },
            { label: "Completed", value: overview.bookingStatus.completed || 0, color: "#6b7280" },
            { label: "Cancelled", value: overview.bookingStatus.cancelled || 0, color: colors.danger },
          ].map((status) => (
            <View key={status.label} style={styles.statusRow}>
              <Text style={styles.statusLabel}>{status.label}</Text>
              <Text style={styles.statusValue}>{status.value}</Text>
              <View style={styles.statusTrack}>
                <View
                  style={[
                    styles.statusFill,
                    {
                      backgroundColor: status.color,
                      width: `${Math.min(100, Math.round((status.value / maxBookingStatusValue) * 100))}%`,
                    },
                  ]}
                />
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
  loader: { marginTop: 8 },
  empty: { color: colors.textSecondary, fontStyle: "italic", marginBottom: 8 },
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
