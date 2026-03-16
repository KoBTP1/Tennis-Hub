import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RoleTopBar from "../../components/RoleTopBar";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";
import OwnerCourtsScreen from "./OwnerCourtsScreen";
import OwnerScheduleScreen from "./OwnerScheduleScreen";

export default function OwnerManageScreen({ onTabPress, onOpenCourt }) {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState("courts");

  return (
    <View style={styles.root}>
      <RoleTopBar />
      <View style={[styles.switchRow, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        {[
          { key: "courts", label: "Tạo sân" },
          { key: "slots", label: "Slot" },
        ].map((section) => {
          const isActive = activeSection === section.key;
          return (
            <TouchableOpacity
              key={section.key}
              style={[
                styles.switchBtn,
                {
                  backgroundColor: isActive ? theme.info : "transparent",
                  borderColor: theme.border,
                },
              ]}
              onPress={() => setActiveSection(section.key)}
            >
              <Text style={[styles.switchText, { color: isActive ? colors.white : theme.text }]}>{section.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.content}>
        {activeSection === "courts" ? (
          <OwnerCourtsScreen onTabPress={onTabPress} onOpenCourt={onOpenCourt} embedded />
        ) : (
          <OwnerScheduleScreen onTabPress={onTabPress} embedded />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  switchRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  switchBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.full,
    alignItems: "center",
    paddingVertical: 9,
  },
  switchText: { fontSize: 14, fontWeight: "700" },
  content: { flex: 1 },
});
