import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { useTheme } from "../context/ThemeContext";
import { colors } from "../styles/theme";

export default function StatCard({ value, label, accent = colors.info, subtitle }) {
  const { theme } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 92, justifyContent: "center", alignItems: "center", gap: 4 },
  dot: { width: 22, height: 22, borderRadius: 11, marginBottom: 6 },
  value: { fontSize: 30, fontWeight: "700" },
  label: { fontSize: 14 },
  subtitle: { fontSize: 12 },
});
