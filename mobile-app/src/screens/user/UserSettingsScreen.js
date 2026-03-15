import React, { useMemo, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";

const defaultNotifications = [
  { id: "1", title: "Booking confirmed", body: "Your court booking for tomorrow is confirmed.", time: "2h ago", read: false },
  { id: "2", title: "Promo available", body: "You have a new 10% discount code for weekday bookings.", time: "1d ago", read: false },
  { id: "3", title: "Reminder", body: "Your upcoming match starts in 30 minutes.", time: "2d ago", read: true },
];

function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      card: "#111827",
      border: "#1e293b",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
      badge: "#1d4ed8",
    };
  }

  return {
    background: colors.background,
    card: colors.white,
    border: colors.border,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    badge: colors.info,
  };
}

export default function UserSettingsScreen({ onBack }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const palette = getPalette(isDarkMode);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <AppHeader title="Settings" leftText="‹" onLeftPress={onBack} />
      <ScreenContainer backgroundColor={palette.background}>
        <Card style={[styles.card, { backgroundColor: palette.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitle, { color: palette.textSecondary }]}>
                Switch between light and dark appearance.
              </Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: colors.success }} />
          </View>
        </Card>

        <Card style={[styles.card, { backgroundColor: palette.card }]}>
          <View style={styles.notificationHeader}>
            <View>
              <Text style={[styles.settingTitle, { color: palette.textPrimary }]}>Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: palette.textSecondary }]}>
                {unreadCount} unread
              </Text>
            </View>
            <TouchableOpacity onPress={markAllAsRead}>
              <Text style={styles.markReadText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>

          {notifications.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.notificationItem,
                { borderBottomColor: palette.border },
                index === notifications.length - 1 ? styles.lastItem : null,
              ]}
            >
              <View style={styles.notificationTextWrap}>
                <Text style={[styles.notificationTitle, { color: palette.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.notificationBody, { color: palette.textSecondary }]}>{item.body}</Text>
                <Text style={[styles.notificationTime, { color: palette.textSecondary }]}>{item.time}</Text>
              </View>
              {!item.read ? <View style={[styles.unreadDot, { backgroundColor: palette.badge }]} /> : null}
            </View>
          ))}
        </Card>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: { paddingVertical: 12 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  settingTextWrap: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "700" },
  settingSubtitle: { marginTop: 4, fontSize: 13 },
  notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  markReadText: { color: colors.info, fontWeight: "600", fontSize: 13 },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  lastItem: { borderBottomWidth: 0 },
  notificationTextWrap: { flex: 1 },
  notificationTitle: { fontSize: 14, fontWeight: "700" },
  notificationBody: { marginTop: 2, fontSize: 13 },
  notificationTime: { marginTop: 4, fontSize: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
