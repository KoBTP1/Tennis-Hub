import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function ScreenContainer({ children, contentStyle, backgroundColor }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: backgroundColor || theme.background }]}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 14, gap: 12 },
});
