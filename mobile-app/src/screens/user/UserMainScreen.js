import React, { useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import CourtDetailScreen from "./CourtDetailScreen";
import EditProfileScreen from "./EditProfileScreen";
import UserPaymentResultScreen from "./UserPaymentResultScreen";
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
  const [activeScreenParams, setActiveScreenParams] = useState(null);
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [favoriteRevision, setFavoriteRevision] = useState(0);
  const [favoriteByCourtId, setFavoriteByCourtId] = useState({});

  const syncFavoriteState = (courtId, isFavorited) => {
    const key = String(courtId || "").trim();
    if (!key) {
      return;
    }
    setFavoriteByCourtId((prev) => ({
      ...prev,
      [key]: Boolean(isFavorited),
    }));
  };

  const ActiveScreen = useMemo(() => tabScreenByName[activeTab] || UserHomeScreen, [activeTab]);

  const handleTabPress = (tab) => {
    setActiveScreen(null);
    setActiveScreenParams(null);
    setSelectedCourtId(null);
    setActiveTab(tab);
  };

  const handleNavigate = (target) => {
    if (!target) {
      return;
    }
    if (typeof target === "string") {
      setActiveScreen(target);
      setActiveScreenParams(null);
      return;
    }
    const screen = String(target?.screen || "").trim();
    if (!screen) {
      return;
    }
    setActiveScreen(screen);
    setActiveScreenParams(target?.params || null);
  };

  if (activeScreen === "edit-profile") {
    return <EditProfileScreen onBack={() => setActiveScreen(null)} />;
  }

  if (activeScreen === "settings") {
    return <UserSettingsScreen onBack={() => setActiveScreen(null)} onNavigate={setActiveScreen} />;
  }

  if (activeScreen === "payment-result") {
    return (
      <UserPaymentResultScreen
        result={activeScreenParams}
        onBack={() => {
          setActiveScreen(null);
          setActiveScreenParams(null);
          setActiveTab("Bookings");
        }}
      />
    );
  }

  return (
    <>
      <ActiveScreen
        onTabPress={handleTabPress}
        onNavigate={handleNavigate}
        favoritesRevision={favoriteRevision}
        onFavoriteChanged={() => setFavoriteRevision((prev) => prev + 1)}
        favoriteOverrides={favoriteByCourtId}
        onFavoriteStateChange={syncFavoriteState}
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
                allowBooking
                showBookingActions
                showHeaderBookingAction={false}
                favoriteRevision={favoriteRevision}
                onFavoriteChanged={() => setFavoriteRevision((prev) => prev + 1)}
                forcedFavoriteState={favoriteByCourtId[String(selectedCourtId || "")]}
                onFavoriteStateChange={syncFavoriteState}
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
