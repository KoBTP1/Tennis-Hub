import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { screenRegistry } from "./src/navigation/screenRegistry";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { LanguageProvider } from "./src/context/LanguageContext";

// Change this key to quickly preview any generated screen.
const PREVIEW_SCREEN = null;

function AuthenticatedArea() {
  const { user, isBootstrapping, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [activeAuthScreen, setActiveAuthScreen] = useState("LoginScreen");

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
    </View>
  );
}

export default function App() {
  const Screen = PREVIEW_SCREEN ? screenRegistry[PREVIEW_SCREEN] : null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppContainer Screen={Screen} />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
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
