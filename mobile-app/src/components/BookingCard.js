import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "./Card";
import { useTheme } from "../context/ThemeContext";
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
  const { theme } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.thumb, { backgroundColor: theme.mutedBackground }]} />
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            {status ? <Text style={[styles.status, { color: theme.success, backgroundColor: theme.successSoft }]}>{status}</Text> : null}
          </View>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{subtitle}</Text>
          {date ? <Text style={[styles.meta, { color: theme.textSecondary }]}>{date}</Text> : null}
          {time ? <Text style={[styles.meta, { color: theme.textSecondary }]}>{time}</Text> : null}
          <Text style={styles.amount}>{amount}</Text>
        </View>
      </View>
      {actions.length ? (
        <View style={styles.actionRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.button,
                { backgroundColor: action.type === "danger" ? theme.dangerSoft : theme.infoSoft },
                action.type === "danger" ? styles.dangerButton : null,
              ]}
              onPress={action.onPress}
              disabled={!action.onPress}
            >
              <Text style={[styles.buttonText, { color: action.type === "danger" ? theme.danger : theme.info }, action.type === "danger" ? styles.dangerText : null]}>
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
  thumb: { width: 72, height: 72, borderRadius: radius.sm },
  info: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: "700" },
  status: {
    fontSize: 12,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  meta: { marginTop: 3, fontSize: 13 },
  amount: { marginTop: 8, fontSize: 20, fontWeight: "700", color: colors.success },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  button: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: radius.sm },
  buttonText: { fontWeight: "700" },
  dangerButton: {},
  dangerText: { fontWeight: "700" },
});
