import React, { useMemo, useState } from "react";
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

  const ActiveScreen = useMemo(() => tabScreenByName[activeTab] || UserHomeScreen, [activeTab]);

  return <ActiveScreen onTabPress={setActiveTab} />;
}
