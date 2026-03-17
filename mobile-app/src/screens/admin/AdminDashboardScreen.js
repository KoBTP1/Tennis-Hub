import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "../../components/Card";
import GradientButton from "../../components/GradientButton";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminOverviewReport } from "../../services/adminService";
import { colors } from "../../styles/theme";
import { formatVND } from "../../utils/currency";

export default function AdminDashboardScreen({ onNavigate }) {
  const { token, logout } = useAuth();
  const { theme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [overview, setOverview] = useState({
    totals: { users: 0, courts: 0, bookings: 0, revenue: 0, activeBookings: 0 },
  });

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      if (!token) {
        setIsLoadingOverview(false);
        return;
      }

      try {
        setIsLoadingOverview(true);
        const response = await getAdminOverviewReport({ token });
        if (!mounted) {
          return;
        }

        setOverview(response.data || { totals: { users: 0, courts: 0, bookings: 0, revenue: 0, activeBookings: 0 } });
      } catch (error) {
        Alert.alert("Load dashboard failed", error.message);
      } finally {
        if (mounted) {
          setIsLoadingOverview(false);
        }
      }
    };

    loadOverview();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <RoleTopBar onAvatarPress={() => onNavigate?.("editProfile")} />
      <ScreenContainer>
        <View style={styles.gridRow}>
          <StatCard value={overview.totals.users} label="Total Users" subtitle="From database" accent={colors.info} iconName="people-outline" />
          <StatCard value={overview.totals.courts} label="Total Courts" subtitle="From database" accent={colors.success} iconName="tennisball-outline" />
        </View>
        <View style={styles.gridRow}>
          <StatCard value={overview.totals.bookings} label="Total Bookings" subtitle="All statuses" accent={colors.info} iconName="receipt-outline" />
          <StatCard value={formatVND(overview.totals.revenue)} label="Total Revenue" subtitle="All time" accent={colors.success} iconName="cash-outline" />
        </View>
        {isLoadingOverview ? <ActivityIndicator size="small" color={colors.info} /> : null}

        <Text style={[styles.section, { color: theme.text }]}>Quick Access</Text>
        {[
          { label: "Manage Users", key: "users" },
          { label: "Manage Courts", key: "courts" },
          { label: "View Reports", key: "reports" },
          { label: "Edit Profile", key: "editProfile" },
        ].map((item) => (
          <TouchableOpacity key={item.label} activeOpacity={0.85} onPress={() => onNavigate?.(item.key)}>
            <Card style={styles.actionCard}>
              <Text style={[styles.actionText, { color: theme.text }]}>{item.label}</Text>
              <Text style={[styles.arrow, { color: theme.textSecondary }]}>→</Text>
            </Card>
          </TouchableOpacity>
        ))}

        <GradientButton
          label={isLoggingOut ? "Logging out..." : "Logout"}
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  gridRow: { flexDirection: "row", gap: 10 },
  section: { fontSize: 26, fontWeight: "700", color: colors.textPrimary, marginTop: 8 },
  actionCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  actionText: { fontSize: 17, color: colors.textPrimary, fontWeight: "600" },
  arrow: { color: colors.textSecondary, fontSize: 18 },
  logoutButton: { marginTop: 6, marginBottom: 4 },
  logoutButtonText: { color: colors.white },
});
