import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import GradientButton from "../../components/GradientButton";
import ScreenContainer from "../../components/ScreenContainer";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../styles/theme";

export default function AdminDashboardScreen() {
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
      <AppHeader title="Admin Dashboard" />
      <ScreenContainer>
        <GradientBackground style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "A").slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.heroTitle}>{user?.name || "Admin User"}</Text>
            <Text style={styles.heroSub}>{user?.email || "-"}</Text>
            <Text style={styles.heroMeta}>Role: {(user?.role || "admin").toUpperCase()}</Text>
          </View>
        </GradientBackground>

        <View style={styles.gridRow}>
          <StatCard value="156" label="Total Users" subtitle="+12 this month" accent={colors.info} />
          <StatCard value="23" label="Total Courts" subtitle="Active courts" accent={colors.success} />
        </View>
        <View style={styles.gridRow}>
          <StatCard value="892" label="Total Bookings" subtitle="45 active now" accent={colors.info} />
          <StatCard value="$24,560" label="Total Revenue" subtitle="All time" accent={colors.success} />
        </View>

        <Text style={styles.section}>Quick Access</Text>
        {["Manage Users", "Manage Courts", "View Reports"].map((item) => (
          <Card key={item} style={styles.actionCard}>
            <Text style={styles.actionText}>{item}</Text>
            <Text style={styles.arrow}>→</Text>
          </Card>
        ))}

        <Text style={styles.section}>Recent Activity</Text>
        <Card>
          <Text style={styles.activityTitle}>New user registered</Text>
          <Text style={styles.activitySub}>Emily Chen joined as a player</Text>
        </Card>

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
  heroTitle: { color: colors.white, fontSize: 28, fontWeight: "800" },
  heroSub: { color: colors.infoSoft, marginTop: 4, fontSize: 14 },
  heroMeta: { color: "#e5e7eb", marginTop: 5, fontSize: 13, fontWeight: "600" },
  gridRow: { flexDirection: "row", gap: 10 },
  section: { fontSize: 26, fontWeight: "700", color: colors.textPrimary, marginTop: 8 },
  actionCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 18 },
  actionText: { fontSize: 17, color: colors.textPrimary, fontWeight: "600" },
  arrow: { color: colors.textSecondary, fontSize: 18 },
  activityTitle: { color: colors.textPrimary, fontWeight: "700", fontSize: 16 },
  activitySub: { color: colors.textSecondary, marginTop: 4 },
  logoutButton: { marginTop: 6, marginBottom: 4 },
  logoutButtonText: { color: colors.white },
});
