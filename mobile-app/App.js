import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { screenRegistry } from "./src/navigation/screenRegistry";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

// Change this key to quickly preview any generated screen.
const PREVIEW_SCREEN = null;

function AuthenticatedArea() {
  const { user, isBootstrapping, isAuthenticated } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
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
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <MainScreen />
      <View style={[styles.themeToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={{ color: theme.text, fontWeight: "700" }}>Dark Mode</Text>
        <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: theme.success }} />
      </View>
    </View>
  );
}

export default function App() {
  const Screen = PREVIEW_SCREEN ? screenRegistry[PREVIEW_SCREEN] : null;
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContainer Screen={Screen} />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContainer({ Screen }) {
  const { theme, isDarkMode } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {Screen ? <Screen /> : <AuthenticatedArea />}
    </View>
  );
}

const styles = StyleSheet.create({
  themeToggle: {
    position: "absolute",
    right: 14,
    bottom: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
