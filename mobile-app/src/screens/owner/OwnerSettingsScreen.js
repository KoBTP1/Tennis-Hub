import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import Card from "../../components/Card";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";

export default function OwnerSettingsScreen({ onBack }) {
  const { isDarkMode, toggleTheme, theme } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <RoleTopBar onBack={onBack} />
      <ScreenContainer>
        <Card>
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.title, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Switch between light and dark appearance.</Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: colors.success }} />
          </View>
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  settingTextWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { marginTop: 4, fontSize: 13 },
});
