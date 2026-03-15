import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";

export default function GradientBackground({
  children,
  style,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
}) {
  const { theme } = useTheme();
  const gradientColors = colors || [theme.gradientStart, theme.gradientEnd];
  return (
    <LinearGradient colors={gradientColors} start={start} end={end} style={style}>
      {children}
    </LinearGradient>
  );
}
