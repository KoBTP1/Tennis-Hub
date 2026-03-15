import React, { useMemo, useState } from "react";
import { View } from "react-native";
import TabBar from "../../components/TabBar";
import OwnerBookingsScreen from "./OwnerBookingsScreen";
import OwnerCourtsScreen from "./OwnerCourtsScreen";
import OwnerDashboardScreen from "./OwnerDashboardScreen";
import OwnerScheduleScreen from "./OwnerScheduleScreen";

const tabs = ["Home", "Courts", "Schedule", "Bookings"];

const screenByTab = {
  Home: OwnerDashboardScreen,
  Courts: OwnerCourtsScreen,
  Schedule: OwnerScheduleScreen,
  Bookings: OwnerBookingsScreen,
};

export default function OwnerMainScreen() {
  const [activeTab, setActiveTab] = useState("Home");

  const ActiveScreen = useMemo(() => screenByTab[activeTab] || OwnerDashboardScreen, [activeTab]);

  return (
    <View style={{ flex: 1 }}>
      <ActiveScreen onTabPress={setActiveTab} onNavigate={setActiveTab} />
      <TabBar tabs={tabs} active={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}
