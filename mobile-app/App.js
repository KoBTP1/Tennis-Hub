import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, StatusBar as RNStatusBar, StyleSheet, Switch, Text, View } from "react-native";
import { screenRegistry } from "./src/navigation/screenRegistry";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

// Change this key to quickly preview any generated screen.
const PREVIEW_SCREEN = null;

function AuthenticatedArea() {
  const { user, isBootstrapping, isAuthenticated } = useAuth();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const [activeAuthScreen, setActiveAuthScreen] = useState("LoginScreen");
  const topInset = Platform.OS === "android" ? RNStatusBar.currentHeight || 0 : 0;

  const mainScreenName = useMemo(() => {
    const role = (user?.role || "").toLowerCase();
    if (role === "admin") {
      return "AdminMainScreen";
    }
    if (role === "owner") {
      return "OwnerMainScreen";
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
        onNavigateForgotPassword={() => setActiveAuthScreen("ForgotPasswordScreen")}
      />
    );
  }

  const MainScreen = screenRegistry[mainScreenName];
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <MainScreen />
      <View
        style={[
          styles.themeToggle,
          {
            top: topInset + 10,
            backgroundColor: theme.card,
            borderColor: theme.gradientEnd || theme.info || theme.success,
          },
        ]}
      >
        <Text style={{ color: theme.text, fontWeight: "700", fontSize: 13 }}>
          {isDarkMode ? "🌙" : "☀"}
        </Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: "#9ca3af", true: theme.success }}
          thumbColor="#ffffff"
        />
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
      <ExpoStatusBar style={isDarkMode ? "light" : "dark"} />
      {Screen ? <Screen /> : <AuthenticatedArea />}
    </View>
  );
}

const styles = StyleSheet.create({
  themeToggle: {
    position: "absolute",
    right: 10,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 0,
    shadowOpacity: 0,
  },
});
