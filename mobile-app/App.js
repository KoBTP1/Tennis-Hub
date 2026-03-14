import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { screenRegistry } from "./src/navigation/screenRegistry";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { colors } from "./src/styles/theme";

// Change this key to quickly preview any generated screen.
const PREVIEW_SCREEN = null;

function AuthenticatedArea() {
  const { user, isBootstrapping, isAuthenticated } = useAuth();
  const [activeAuthScreen, setActiveAuthScreen] = useState("LoginScreen");

  const mainScreenName = useMemo(() => {
    const role = (user?.role || "").toLowerCase();
    if (role === "admin") {
      return "AdminMainScreen";
    }
    if (role === "owner") {
      return "OwnerDashboardScreen";
    }
    return "UserMainScreen";
  }, [user?.role]);

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.gradientEnd} />
      </View>
    );
  }

  if (!isAuthenticated) {
    const AuthScreen = screenRegistry[activeAuthScreen];
    return (
      <AuthScreen
        onNavigateRegister={() => setActiveAuthScreen("RegisterScreen")}
        onNavigateLogin={() => setActiveAuthScreen("LoginScreen")}
      />
    );
  }

  const MainScreen = screenRegistry[mainScreenName];
  return <MainScreen />;
}

export default function App() {
  const Screen = PREVIEW_SCREEN ? screenRegistry[PREVIEW_SCREEN] : null;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthProvider>{Screen ? <Screen /> : <AuthenticatedArea />}</AuthProvider>
    </View>
  );
}
