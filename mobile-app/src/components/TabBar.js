import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { radius } from "../styles/theme";

const iconByTab = {
  Home: "home-outline",
  Search: "search-outline",
  Bookings: "calendar-outline",
  Profile: "person-outline",
};

const activeIconByTab = {
  Home: "home",
  Search: "search",
  Bookings: "calendar",
  Profile: "person",
};

export default function TabBar({ tabs, active, onTabPress }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.wrap, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab} style={styles.item} onPress={() => onTabPress?.(tab)} activeOpacity={0.8}>
          <Ionicons
            name={tab === active ? activeIconByTab[tab] || "ellipse" : iconByTab[tab] || "ellipse-outline"}
            size={19}
            color={tab === active ? theme.success : theme.textSecondary}
          />
          <Text style={[styles.text, { color: theme.textSecondary }, tab === active ? { color: theme.success, fontWeight: "700" } : null]}>
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    paddingVertical: 10,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  item: { alignItems: "center", flex: 1 },
  text: { fontSize: 12, fontWeight: "500", marginTop: 3 },
});
