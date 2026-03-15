import React, { useMemo, useState } from "react";
import EditProfileScreen from "./EditProfileScreen";
import UserSettingsScreen from "./UserSettingsScreen";
import UserBookingsScreen from "./UserBookingsScreen";
import UserHomeScreen from "./UserHomeScreen";
import UserProfileScreen from "./UserProfileScreen";
import UserSearchScreen from "./UserSearchScreen";

const tabScreenByName = {
  Home: UserHomeScreen,
  Search: UserSearchScreen,
  Bookings: UserBookingsScreen,
  Profile: UserProfileScreen,
};

export default function UserMainScreen() {
  const [activeTab, setActiveTab] = useState("Home");
  const [activeScreen, setActiveScreen] = useState(null);

  const ActiveScreen = useMemo(() => tabScreenByName[activeTab] || UserHomeScreen, [activeTab]);

  const handleTabPress = (tab) => {
    setActiveScreen(null);
    setActiveTab(tab);
  };

  if (activeScreen === "edit-profile") {
    return <EditProfileScreen onBack={() => setActiveScreen(null)} />;
  }

  if (activeScreen === "settings") {
    return <UserSettingsScreen onBack={() => setActiveScreen(null)} />;
  }

  return (
    <ActiveScreen
      onTabPress={handleTabPress}
      onNavigate={setActiveScreen}
    />
  );
}
