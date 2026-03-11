import React from "react";
import { LinearGradient } from "expo-linear-gradient";

export default function GradientBackground({
  children,
  style,
  colors = ["#0FAF7C", "#1E66E8"],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
}) {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
}
