import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import GradientButton from "../../components/GradientButton";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { colors } from "../../styles/theme";
import { useAuth } from "../../context/AuthContext";

const menuItems = ["Edit Profile", "Notifications", "Payment Methods", "My Bookings", "Help & Support", "Settings"];

export default function UserProfileScreen({ onTabPress }) {
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
      <AppHeader title="Profile" />
      <ScreenContainer>
        <GradientBackground style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "User").slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{user?.name || "Guest User"}</Text>
            <Text style={styles.subtitle}>Tennis Enthusiast</Text>
            <Text style={styles.meta}>{user?.email || "-"}</Text>
            <Text style={styles.meta}>{user?.phone || "-"}</Text>
            <Text style={styles.meta}>Member since January 2026</Text>
          </View>
        </GradientBackground>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </Card>
        </View>

        <Card style={styles.menuList}>
          {menuItems.map((item, index) => (
            <View key={item} style={[styles.menuItem, index === menuItems.length - 1 ? styles.lastMenu : null]}>
              <Text style={styles.menuText}>{item}</Text>
              <Text style={styles.menuArrow}>→</Text>
            </View>
          ))}
        </Card>

        <GradientButton
          label={isLoggingOut ? "Signing Out..." : "Sign Out"}
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        />
      </ScreenContainer>
      <TabBar tabs={["Home", "Search", "Bookings", "Profile"]} active="Profile" onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  profileCard: { flexDirection: "row", gap: 12, borderRadius: 12, padding: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontWeight: "800", color: colors.success },
  info: { flex: 1 },
  name: { fontSize: 30, fontWeight: "800", color: colors.white },
  subtitle: { color: colors.infoSoft, marginTop: 2 },
  meta: { color: "#e5e7eb", marginTop: 5, fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 16 },
  statValue: { fontSize: 34, fontWeight: "800", color: colors.info },
  statLabel: { color: colors.textSecondary },
  menuList: { paddingVertical: 0 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastMenu: { borderBottomWidth: 0 },
  menuText: { color: colors.textPrimary, fontSize: 17 },
  menuArrow: { color: colors.textSecondary },
  logoutButton: { marginTop: 6 },
  logoutButtonText: { color: colors.white },
});
