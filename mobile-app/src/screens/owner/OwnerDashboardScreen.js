import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import GradientButton from "../../components/GradientButton";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getOwnerDashboard } from "../../services/ownerService";
import { colors } from "../../styles/theme";
import { formatVND } from "../../utils/currency";

export default function OwnerDashboardScreen({ onNavigate }) {
  const { user, logout } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    totals: { courts: 0, bookings: 0, activeBookings: 0, revenue: 0 },
  });

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await getOwnerDashboard();
        if (!mounted) {
          return;
        }
        setDashboard(
          response?.data || {
            totals: { courts: 0, bookings: 0, activeBookings: 0, revenue: 0 },
          }
        );
      } catch (error) {
        Alert.alert("Load dashboard failed", error?.response?.data?.message || error.message);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

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
      <RoleTopBar />
      <ScreenContainer>
        <GradientBackground style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "O").slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.heroTitle, isDarkMode ? styles.softWhiteText : null]}>{user?.name || "Owner User"}</Text>
            <Text style={styles.heroSub}>{user?.email || "-"}</Text>
            <Text style={styles.heroMeta}>Role: {(user?.role || "owner").toUpperCase()}</Text>
          </View>
        </GradientBackground>

        <View style={styles.gridRow}>
          <StatCard value={dashboard.totals.courts} label="My Courts" accent={colors.success} iconName="tennisball-outline" />
          <StatCard value={dashboard.totals.activeBookings} label="Active Bookings" accent={colors.info} iconName="calendar-clear-outline" />
        </View>
        <View style={styles.gridRow}>
          <StatCard value={formatVND(dashboard.totals.revenue)} label="Total Revenue" accent={colors.success} iconName="cash-outline" />
          <StatCard value={dashboard.totals.bookings} label="Total Bookings" accent={colors.info} iconName="receipt-outline" />
        </View>
        {isLoading ? <ActivityIndicator size="small" color={colors.info} /> : null}

        <Text style={[styles.section, { color: theme.text }]}>Quick Actions</Text>
        <TouchableOpacity activeOpacity={0.85} onPress={() => onNavigate?.("Manage")}>
          <Card style={styles.actionCard}>
            <Text style={[styles.actionText, { color: theme.text }]}>Add New Court</Text>
            <Text style={styles.arrow}>→</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={() => onNavigate?.("Bookings")}>
          <Card style={styles.actionCard}>
            <Text style={[styles.actionText, { color: theme.text }]}>View Bookings</Text>
            <Text style={styles.arrow}>→</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={() => onNavigate?.("settings")}>
          <Card style={styles.actionCard}>
            <Text style={[styles.actionText, { color: theme.text }]}>Settings</Text>
            <Text style={styles.arrow}>→</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={() => onNavigate?.("edit-profile")}>
          <Card style={styles.actionCard}>
            <Text style={[styles.actionText, { color: theme.text }]}>Edit Profile</Text>
            <Text style={styles.arrow}>→</Text>
          </Card>
        </TouchableOpacity>

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
  hero: { flexDirection: "row", gap: 12, borderRadius: 12, padding: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontWeight: "800", color: colors.success },
  info: { flex: 1 },
  heroTitle: { color: colors.white, fontSize: 20, fontWeight: "800" },
  heroSub: { color: colors.infoSoft, marginTop: 3 },
  heroMeta: { color: "#e5e7eb", marginTop: 4, fontSize: 13, fontWeight: "600" },
  softWhiteText: { color: "#E5E5E5" },
  gridRow: { flexDirection: "row", gap: 10 },
  section: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  actionCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  actionText: { fontSize: 17, color: colors.textPrimary, fontWeight: "600" },
  arrow: { color: colors.textSecondary, fontSize: 18 },
  logoutButton: { marginTop: 6, marginBottom: 4 },
  logoutButtonText: { color: colors.white },
});
