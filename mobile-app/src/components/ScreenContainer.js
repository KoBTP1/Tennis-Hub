import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors } from "../styles/theme";

export default function ScreenContainer({ children, contentStyle }) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, contentStyle]}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: 14, gap: 12 },
});
