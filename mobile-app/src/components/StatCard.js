import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import { colors } from "../styles/theme";

export default function StatCard({ value, label, accent = colors.info, subtitle }) {
  return (
    <Card style={styles.card}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 92, justifyContent: "center", alignItems: "center", gap: 4 },
  dot: { width: 22, height: 22, borderRadius: 11, marginBottom: 6 },
  value: { fontSize: 30, color: colors.textPrimary, fontWeight: "700" },
  label: { fontSize: 14, color: colors.textSecondary },
  subtitle: { fontSize: 12, color: colors.textSecondary },
});
