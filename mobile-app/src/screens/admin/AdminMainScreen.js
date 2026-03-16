import React, { useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";
import EditProfileScreen from "../user/EditProfileScreen";
import AdminCourtDetailScreen from "./AdminCourtDetailScreen";
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
  const [selectedCourtId, setSelectedCourtId] = useState(null);

  const ActiveScreen = useMemo(() => screenByKey[activeScreenKey] || AdminDashboardScreen, [activeScreenKey]);

  if (activeScreenKey === "editProfile") {
    return <EditProfileScreen onBack={() => setActiveScreenKey("dashboard")} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <ActiveScreen
          onNavigate={setActiveScreenKey}
          onOpenCourt={(courtId) => {
            setSelectedCourtId(courtId);
            setActiveScreenKey("courtDetail");
          }}
        />
      </View>
      <Modal
        visible={activeScreenKey === "courtDetail" && Boolean(selectedCourtId)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setActiveScreenKey("courts");
          setSelectedCourtId(null);
        }}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheetContent}>
            {selectedCourtId ? (
              <AdminCourtDetailScreen
                courtId={selectedCourtId}
                onBack={() => {
                  setActiveScreenKey("courts");
                  setSelectedCourtId(null);
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
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
