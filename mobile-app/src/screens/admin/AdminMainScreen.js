import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import TabBar from "../../components/TabBar";
import { colors } from "../../styles/theme";
import AdminCourtsScreen from "./AdminCourtsScreen";
import AdminDashboardScreen from "./AdminDashboardScreen";
import AdminReportsScreen from "./AdminReportsScreen";
import AdminUsersScreen from "./AdminUsersScreen";

const tabs = ["Home", "Search", "Bookings", "Profile"];

const screenKeyByTab = {
  Home: "dashboard",
  Search: "users",
  Bookings: "courts",
  Profile: "reports",
};

const tabByScreenKey = {
  dashboard: "Home",
  users: "Search",
  courts: "Bookings",
  reports: "Profile",
};

const screenByKey = {
  dashboard: AdminDashboardScreen,
  users: AdminUsersScreen,
  courts: AdminCourtsScreen,
  reports: AdminReportsScreen,
};

export default function AdminMainScreen() {
  const [activeScreenKey, setActiveScreenKey] = useState("dashboard");

  const ActiveScreen = useMemo(() => screenByKey[activeScreenKey] || AdminDashboardScreen, [activeScreenKey]);
  const activeTab = tabByScreenKey[activeScreenKey] || "Home";

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <ActiveScreen onNavigate={setActiveScreenKey} />
      </View>
      <TabBar tabs={tabs} active={activeTab} onTabPress={(tab) => setActiveScreenKey(screenKeyByTab[tab] || "dashboard")} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});
