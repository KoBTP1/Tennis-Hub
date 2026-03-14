import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import BookingCard from "../../components/BookingCard";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import GradientButton from "../../components/GradientButton";
import ScreenContainer from "../../components/ScreenContainer";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../styles/theme";

export default function OwnerDashboardScreen() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <View style={styles.root}>
      <AppHeader title="Owner Dashboard" />
      <ScreenContainer>
        <GradientBackground style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "O").slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.heroTitle}>{user?.name || "Owner User"}</Text>
            <Text style={styles.heroSub}>{user?.email || "-"}</Text>
            <Text style={styles.heroMeta}>Role: {(user?.role || "owner").toUpperCase()}</Text>
          </View>
        </GradientBackground>

        <View style={styles.gridRow}>
          <StatCard value="2" label="My Courts" accent={colors.success} />
          <StatCard value="1" label="Active Bookings" accent={colors.info} />
        </View>
        <View style={styles.gridRow}>
          <StatCard value="$45" label="Total Revenue" accent={colors.success} />
          <StatCard value="2" label="Total Bookings" accent={colors.info} />
        </View>

        <Text style={styles.section}>Quick Actions</Text>
        <Card style={styles.actionCard}>
          <Text style={styles.actionText}>Add New Court</Text>
          <Text style={styles.arrow}>→</Text>
        </Card>
        <Card style={styles.actionCard}>
          <Text style={styles.actionText}>Manage Schedule</Text>
          <Text style={styles.arrow}>→</Text>
        </Card>
        <Card style={styles.actionCard}>
          <Text style={styles.actionText}>View Bookings</Text>
          <Text style={styles.arrow}>→</Text>
        </Card>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Recent Bookings</Text>
          <Text style={styles.link}>View All</Text>
        </View>
        <BookingCard
          title="Alex Morgan"
          subtitle="Downtown Tennis Center"
          date="2026-03-15 at 10:00"
          amount="$25"
          status="confirmed"
        />

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
  gridRow: { flexDirection: "row", gap: 10 },
  section: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginTop: 4 },
  actionCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  actionText: { fontSize: 17, color: colors.textPrimary, fontWeight: "600" },
  arrow: { color: colors.textSecondary, fontSize: 18 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: colors.success, fontWeight: "700" },
  logoutButton: { marginTop: 6, marginBottom: 4 },
  logoutButtonText: { color: colors.white },
});
