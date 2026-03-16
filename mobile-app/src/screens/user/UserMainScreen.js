import React, { useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
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

  return (
    <>
      <ActiveScreen
        onTabPress={handleTabPress}
        onNavigate={setActiveScreen}
        onOpenCourt={(courtId) => {
          setSelectedCourtId(courtId);
          setActiveScreen("court-detail");
        }}
      />
      <Modal
        visible={activeScreen === "court-detail" && Boolean(selectedCourtId)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveScreen(null)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetContent}>
            {selectedCourtId ? (
              <CourtDetailScreen
                courtId={selectedCourtId}
                asSheet
                onBack={() => setActiveScreen(null)}
                onTabPress={handleTabPress}
                showHeaderBookingAction={false}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    height: "78%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
});
