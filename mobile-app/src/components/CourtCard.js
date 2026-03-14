import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "./Card";
import { colors, radius } from "../styles/theme";

export default function CourtCard({
  name,
  location,
  price,
  distance,
  surface,
  rating,
  reviews,
  badge,
  actions = [],
  onPress,
}) {
  return (
    <Card style={styles.card}>
      <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress}>
        <View style={styles.row}>
          <View style={styles.placeholder} />
          <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {name}
            </Text>
            {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          </View>
          <Text style={styles.meta}>{location}</Text>
          <Text style={styles.meta}>{price}</Text>
          <View style={styles.bottomMeta}>
            {rating ? <Text style={styles.sub}>★ {rating}{reviews ? ` (${reviews})` : ""}</Text> : null}
            {distance ? <Text style={styles.sub}>{distance}</Text> : null}
            {surface ? <Text style={styles.sub}>{surface}</Text> : null}
          </View>
        </View>
      </View>
      </TouchableOpacity>
      {actions.length ? (
        <View style={styles.actionRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[styles.actionBtn, action.disabled ? styles.actionDisabled : null]}
              onPress={action.onPress}
              disabled={Boolean(action.disabled)}
            >
              <Text style={[styles.actionText, action.type === "danger" ? styles.danger : null]}>{action.label}</Text>
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
  placeholder: { width: 78, height: 78, borderRadius: radius.sm, backgroundColor: "#eef0f5" },
  content: { flex: 1 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 20, color: colors.textPrimary, fontWeight: "700" },
  badge: {
    color: colors.success,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    fontSize: 12,
    fontWeight: "600",
  },
  meta: { color: colors.textSecondary, marginTop: 4, fontSize: 14 },
  bottomMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  sub: { color: colors.textSecondary, fontSize: 13 },
  actionRow: { flexDirection: "row", marginTop: 10, gap: 8 },
  actionBtn: { backgroundColor: colors.infoSoft, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 7 },
  actionDisabled: { opacity: 0.45 },
  actionText: { color: colors.info, fontWeight: "600" },
  danger: { color: colors.danger },
});
