import React from "react";
import { StyleSheet, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import CourtCard from "../../components/CourtCard";
import GradientButton from "../../components/GradientButton";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";

const myCourts = [
  { name: "Downtown Tennis Center", location: "Downtown", price: "$25/hour", surface: "Hard", rating: "4.8", reviews: 124 },
  { name: "University Tennis Courts", location: "University District", price: "$20/hour", surface: "Hard", rating: "4.5", reviews: 203 },
];

export default function OwnerCourtsScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader title="Manage Courts" leftText="‹" />
      <ScreenContainer>
        <GradientButton label="+   Add New Court" />
        {myCourts.map((court) => (
          <CourtCard
            key={court.name}
            {...court}
            actions={[
              { label: "Edit" },
              { label: "Delete", type: "danger" },
            ]}
          />
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
