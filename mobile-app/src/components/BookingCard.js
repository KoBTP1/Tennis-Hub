import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "./Card";
import { colors, radius } from "../styles/theme";

export default function BookingCard({
  title,
  subtitle,
  date,
  time,
  amount,
  status,
  actions = [],
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.thumb} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {status ? <Text style={styles.status}>{status}</Text> : null}
          </View>
          <Text style={styles.meta}>{subtitle}</Text>
          {date ? <Text style={styles.meta}>{date}</Text> : null}
          {time ? <Text style={styles.meta}>{time}</Text> : null}
          <Text style={styles.amount}>{amount}</Text>
        </View>
      </View>
      {actions.length ? (
        <View style={styles.actionRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.button, action.type === "danger" ? styles.dangerButton : null]}
            >
              <Text style={[styles.buttonText, action.type === "danger" ? styles.dangerText : null]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  row: { flexDirection: "row", gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: radius.sm, backgroundColor: "#eef0f5" },
  info: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 17, color: colors.textPrimary, fontWeight: "700" },
  status: {
    fontSize: 12,
    color: colors.success,
    backgroundColor: colors.successSoft,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  meta: { marginTop: 3, color: colors.textSecondary, fontSize: 13 },
  amount: { marginTop: 8, fontSize: 20, fontWeight: "700", color: colors.success },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  button: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.infoSoft },
  buttonText: { color: colors.info, fontWeight: "700" },
  dangerButton: { backgroundColor: colors.dangerSoft },
  dangerText: { color: colors.danger, fontWeight: "700" },
});
