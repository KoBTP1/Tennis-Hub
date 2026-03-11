import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../styles/theme";

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
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => (
        <TouchableOpacity key={tab} style={styles.item} onPress={() => onTabPress?.(tab)} activeOpacity={0.8}>
          <Ionicons
            name={tab === active ? activeIconByTab[tab] || "ellipse" : iconByTab[tab] || "ellipse-outline"}
            size={19}
            color={tab === active ? colors.success : colors.textSecondary}
          />
          <Text style={[styles.text, tab === active ? styles.active : null]}>{tab}</Text>
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
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  item: { alignItems: "center", flex: 1 },
  text: { fontSize: 12, color: colors.textSecondary, fontWeight: "500", marginTop: 3 },
  active: { color: colors.success, fontWeight: "700" },
});
