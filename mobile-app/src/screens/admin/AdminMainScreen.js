import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";
import AdminCourtsScreen from "./AdminCourtsScreen";
import AdminDashboardScreen from "./AdminDashboardScreen";
import AdminReportsScreen from "./AdminReportsScreen";
import AdminUsersScreen from "./AdminUsersScreen";

const screenByKey = {
  dashboard: AdminDashboardScreen,
  users: AdminUsersScreen,
  courts: AdminCourtsScreen,
  reports: AdminReportsScreen,
};

export default function AdminMainScreen() {
  const { theme } = useTheme();
  const [activeScreenKey, setActiveScreenKey] = useState("dashboard");

  const ActiveScreen = useMemo(() => screenByKey[activeScreenKey] || AdminDashboardScreen, [activeScreenKey]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ActiveScreen onNavigate={setActiveScreenKey} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});
