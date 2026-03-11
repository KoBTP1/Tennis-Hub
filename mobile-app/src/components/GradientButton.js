import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing } from "../styles/theme";

export default function GradientButton({ label, onPress, style, textStyle }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.touch, style]}>
      <LinearGradient colors={["#0FAF7C", "#1E66E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: { width: "100%" },
  gradient: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6,
  },
  label: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
