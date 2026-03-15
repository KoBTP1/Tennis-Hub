import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import GradientButton from "../../components/GradientButton";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { key: "edit-profile", label: "Edit Profile" },
  { key: "my-bookings", label: "My Bookings" },
  { key: "settings", label: "Settings" },
];

function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
      border: "#1e293b",
      card: "#111827",
    };
  }

  return {
    background: colors.background,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    border: colors.border,
    card: colors.white,
  };
}

export default function UserProfileScreen({ onTabPress, onNavigate }) {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const palette = getPalette(isDarkMode);

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

  const handleMenuPress = (key) => {
    if (key === "my-bookings") {
      onTabPress?.("Bookings");
      return;
    }

    onNavigate?.(key);
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <AppHeader title="Profile" />
      <ScreenContainer backgroundColor={palette.background}>
        <GradientBackground style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || "User").slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: palette.textPrimary }]}>{user?.name || "Guest User"}</Text>
            <Text style={styles.subtitle}>Tennis Enthusiast</Text>
            <Text style={styles.meta}>{user?.email || "-"}</Text>
            <Text style={styles.meta}>{user?.phone || "-"}</Text>
            <Text style={styles.meta}>Member since January 2026</Text>
          </View>
        </GradientBackground>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
            <Text style={styles.statValue}>12</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Bookings</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
            <Text style={styles.statValue}>8</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Reviews</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: palette.card }]}>
            <Text style={styles.statValue}>5</Text>
            <Text style={[styles.statLabel, { color: palette.textSecondary }]}>Favorites</Text>
          </Card>
        </View>

        <Card style={[styles.menuList, { backgroundColor: palette.card }]}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => handleMenuPress(item.key)}
              style={[
                styles.menuItem,
                { borderBottomColor: palette.border },
                index === menuItems.length - 1 ? styles.lastMenu : null,
              ]}
            >
              <Text style={[styles.menuText, { color: palette.textPrimary }]}>{item.label}</Text>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
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
