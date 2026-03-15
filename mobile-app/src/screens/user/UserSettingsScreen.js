import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";
import { getMyBookings } from "../../services/bookingService";

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
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await getMyBookings();
        const items = Array.isArray(response?.data) ? response.data : [];

        const generated = items.slice(0, 8).map((booking) => {
          const status = booking?.status || "confirmed";
          const courtName = booking?.courtId?.name || "Court";
          const date = booking?.slotId?.date ? String(booking.slotId.date).slice(0, 10) : "N/A";
          const time = booking?.slotId?.startTime && booking?.slotId?.endTime ? `${booking.slotId.startTime}-${booking.slotId.endTime}` : "";
          return {
            id: booking?._id || `${courtName}-${date}-${time}`,
            title: `Booking ${status}`,
            body: `${courtName} · ${date}${time ? ` · ${time}` : ""}`,
            time: booking?.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "-",
            read: status === "completed" || status === "cancelled",
          };
        });

        if (!mounted) {
          return;
        }
        setNotifications(generated);
      } catch {
        if (!mounted) {
          return;
        }
        setNotifications([]);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();
    return () => {
      mounted = false;
    };
  }, []);

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
          {!isLoading && notifications.length === 0 ? (
            <Text style={[styles.settingSubtitle, { color: palette.textSecondary }]}>No notifications from booking history yet.</Text>
          ) : null}
          {isLoading ? <ActivityIndicator size="small" color={colors.info} /> : null}
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
