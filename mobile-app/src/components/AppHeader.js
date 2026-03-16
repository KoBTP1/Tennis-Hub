import React from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { radius, spacing } from "../styles/theme";
import GradientBackground from "./GradientBackground";

export default function AppHeader({ title, leftText, rightText, onLeftPress, onRightPress }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const androidStatusBar = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;
  const topInset = Math.max(insets.top || 0, androidStatusBar);
  const headerTextColor = theme.mode === "dark" ? "#E5E5E5" : theme.card;

  return (
    <GradientBackground style={[styles.wrap, { paddingTop: spacing.sm + topInset }]}>
      <View style={styles.row}>
        {leftText ? (
          <TouchableOpacity onPress={onLeftPress} style={styles.sideButton}>
            <Text style={[styles.sideText, { color: headerTextColor }]}>{leftText}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sideSpace} />
        )}
        <Text style={[styles.title, { color: headerTextColor }]}>{title}</Text>
        {rightText ? (
          <TouchableOpacity onPress={onRightPress} style={styles.sideButton}>
            <Text style={[styles.sideText, { color: headerTextColor }]}>{rightText}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sideSpace} />
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 26, fontWeight: "700", flex: 1, textAlign: "left" },
  sideButton: { minWidth: 40, minHeight: 36, justifyContent: "center" },
  sideText: { fontSize: 20, fontWeight: "600" },
  sideSpace: { width: 40, minHeight: 36 },
});
