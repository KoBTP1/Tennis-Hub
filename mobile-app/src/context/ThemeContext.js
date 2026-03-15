import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { darkTheme, lightTheme } from "../theme/theme";

const THEME_STORAGE_KEY = "tennishub_theme_mode";
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");
  const [isThemeBootstrapping, setIsThemeBootstrapping] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode === "dark" || savedMode === "light") {
          setMode(savedMode);
        }
      } finally {
        setIsThemeBootstrapping(false);
      }
    };

    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextMode = mode === "dark" ? "light" : "dark";
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  };

  const value = useMemo(
    () => ({
      mode,
      isDarkMode: mode === "dark",
      isThemeBootstrapping,
      theme: mode === "dark" ? darkTheme : lightTheme,
      toggleTheme,
    }),
    [mode, isThemeBootstrapping]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }
  return context;
}
