import React, { useMemo, useState } from "react";
import CourtDetailScreen from "./CourtDetailScreen";
import EditProfileScreen from "./EditProfileScreen";
import UserSettingsScreen from "./UserSettingsScreen";
import UserBookingsScreen from "./UserBookingsScreen";
import UserHomeScreen from "./UserHomeScreen";
import UserProfileScreen from "./UserProfileScreen";

const tabScreenByName = {
  Home: UserHomeScreen,
  Bookings: UserBookingsScreen,
  Profile: UserProfileScreen,
};

export default function UserMainScreen() {
  const [activeTab, setActiveTab] = useState("Home");
  const [activeScreen, setActiveScreen] = useState(null);
  const [selectedCourtId, setSelectedCourtId] = useState(null);

  const ActiveScreen = useMemo(() => tabScreenByName[activeTab] || UserHomeScreen, [activeTab]);

  const handleTabPress = (tab) => {
    setActiveScreen(null);
    setSelectedCourtId(null);
    setActiveTab(tab);
  };

  if (activeScreen === "edit-profile") {
    return <EditProfileScreen onBack={() => setActiveScreen(null)} />;
  }

  if (activeScreen === "settings") {
    return <UserSettingsScreen onBack={() => setActiveScreen(null)} />;
  }

  if (activeScreen === "court-detail" && selectedCourtId) {
    return <CourtDetailScreen courtId={selectedCourtId} onBack={() => setActiveScreen(null)} onTabPress={handleTabPress} />;
  }

  return (
    <ActiveScreen
      onTabPress={handleTabPress}
      onNavigate={setActiveScreen}
      onOpenCourt={(courtId) => {
        setSelectedCourtId(courtId);
        setActiveScreen("court-detail");
      }}
    />
  );
}
