import React, { useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import TabBar from "../../components/TabBar";
import OwnerBookingsScreen from "./OwnerBookingsScreen";
import OwnerCourtDetailScreen from "./OwnerCourtDetailScreen";
import OwnerDashboardScreen from "./OwnerDashboardScreen";
import EditProfileScreen from "../user/EditProfileScreen";
import OwnerHomeScreen from "./OwnerHomeScreen";
import OwnerManageScreen from "./OwnerManageScreen";
import OwnerSettingsScreen from "./OwnerSettingsScreen";

const tabs = ["Home", "Manage", "Bookings", "Profile"];

const screenByTab = {
  Home: OwnerHomeScreen,
  Manage: OwnerManageScreen,
  Bookings: OwnerBookingsScreen,
  Profile: OwnerDashboardScreen,
};

export default function OwnerMainScreen() {
  const [activeTab, setActiveTab] = useState("Home");
  const [activeScreen, setActiveScreen] = useState(null);
  const [selectedCourtId, setSelectedCourtId] = useState(null);

  const ActiveScreen = useMemo(() => screenByTab[activeTab] || OwnerHomeScreen, [activeTab]);
  const handleTabPress = (tab) => {
    setActiveScreen(null);
    setSelectedCourtId(null);
    setActiveTab(tab);
  };

  if (activeScreen === "settings") {
    return <OwnerSettingsScreen onBack={() => setActiveScreen(null)} />;
  }

  if (activeScreen === "edit-profile") {
    return <EditProfileScreen onBack={() => setActiveScreen(null)} />;
  }

  return (
    <>
      <View style={{ flex: 1 }}>
      <ActiveScreen
        onTabPress={handleTabPress}
        onNavigate={(next) => {
          if (next === "settings") {
            setActiveScreen("settings");
            return;
          }
          if (next === "edit-profile") {
            setActiveScreen("edit-profile");
            return;
          }
          setActiveScreen(null);
          setActiveTab(next);
        }}
        onOpenCourt={(courtId) => {
          setSelectedCourtId(courtId);
          setActiveScreen("court-detail");
        }}
      />
      <TabBar tabs={tabs} active={activeTab} onTabPress={handleTabPress} />
      </View>
      <Modal
        visible={activeScreen === "court-detail" && Boolean(selectedCourtId)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setActiveScreen(null);
          setSelectedCourtId(null);
        }}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetContent}>
            {selectedCourtId ? (
              <OwnerCourtDetailScreen
                courtId={selectedCourtId}
                onBack={() => {
                  setActiveScreen(null);
                  setSelectedCourtId(null);
                }}
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
