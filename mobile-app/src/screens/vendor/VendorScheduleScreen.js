import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import GradientButton from "../../components/GradientButton";
import ScreenContainer from "../../components/ScreenContainer";
import { colors, radius } from "../../styles/theme";

const slots = [
  { time: "08:00", price: "$25", status: "Available" },
  { time: "09:00", price: "$25", status: "Booked" },
  { time: "10:00", price: "$25", status: "Available" },
  { time: "11:00", price: "$25", status: "Available" },
  { time: "14:00", price: "$25", status: "Available" },
  { time: "15:00", price: "$25", status: "Booked" },
  { time: "16:00", price: "$25", status: "Available" },
];

export default function VendorScheduleScreen() {
  return (
    <View style={styles.root}>
      <AppHeader title="Manage Schedule" leftText="‹" />
      <ScreenContainer>
        <Text style={styles.label}>Select Court</Text>
        <Card>
          <Text style={styles.select}>Downtown Tennis Center - Downtown</Text>
        </Card>

        <Text style={styles.title}>Select Date</Text>
        <View style={styles.daysRow}>
          {["Tue 11", "Wed 12", "Thu 13", "Fri 14"].map((day, index) => (
            <Card key={day} style={[styles.dayCard, index === 1 ? styles.activeDay : null]}>
              <Text style={[styles.dayText, index === 1 ? styles.activeDayText : null]}>{day}</Text>
            </Card>
          ))}
        </View>

        <GradientButton label="+   Add Time Slot" />

        <Text style={styles.title}>Time Slots for 2026-03-12</Text>
        {slots.map((slot) => (
          <Card key={slot.time} style={styles.slotRow}>
            <View>
              <Text style={styles.slotTime}>{slot.time}</Text>
              <Text style={styles.slotSub}>1 hour</Text>
            </View>
            <View>
              <Text style={styles.slotPrice}>{slot.price}</Text>
              <Text style={[styles.slotStatus, slot.status === "Booked" ? styles.booked : null]}>{slot.status}</Text>
            </View>
            <View style={styles.actions}>
              <Text style={styles.edit}>Edit</Text>
              <Text style={styles.delete}>Delete</Text>
            </View>
          </Card>
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  label: { color: colors.textSecondary, fontWeight: "600" },
  select: { color: colors.textPrimary, fontSize: 16 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginTop: 4 },
  daysRow: { flexDirection: "row", gap: 8 },
  dayCard: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: radius.md },
  activeDay: { borderColor: colors.success, backgroundColor: colors.successSoft },
  dayText: { color: colors.textPrimary, fontWeight: "600" },
  activeDayText: { color: colors.success },
  slotRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  slotTime: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  slotSub: { color: colors.textSecondary },
  slotPrice: { fontSize: 18, color: colors.success, fontWeight: "700" },
  slotStatus: { color: colors.success, fontWeight: "600" },
  booked: { color: colors.textSecondary },
  actions: { flexDirection: "row", gap: 10 },
  edit: { color: colors.info, fontWeight: "700" },
  delete: { color: colors.danger, fontWeight: "700" },
});
