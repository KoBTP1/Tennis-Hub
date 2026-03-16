import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import { colors, radius } from "../styles/theme";

export default function NotificationCenter({ visible, onClose }) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await getMyNotifications({ page: 1, limit: 50 });
      setItems(Array.isArray(response?.data) ? response.data : []);
      setUnreadCount(Number(response?.unreadCount || 0));
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      return;
    }
    loadNotifications();
  }, [visible]);

  const handleMarkOneRead = async (id) => {
    try {
      await markNotificationRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllRead}>
                <Text style={[styles.readAllText, { color: theme.info }]}>Read all</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.counter, { color: theme.textSecondary }]}>Unread: {unreadCount}</Text>
          {isLoading ? <ActivityIndicator size="small" color={theme.info} style={styles.loader} /> : null}
          <ScrollView
            style={styles.list}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadNotifications} />}
          >
            {!isLoading && items.length === 0 ? (
              <Text style={[styles.empty, { color: theme.textSecondary }]}>No notifications yet.</Text>
            ) : null}
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  if (!item.isRead) {
                    void handleMarkOneRead(item.id);
                  }
                }}
                style={[styles.item, { borderColor: theme.border }, !item.isRead ? styles.itemUnread : null]}
              >
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.itemMessage, { color: theme.textSecondary }]}>{item.message}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    padding: 12,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    maxHeight: "78%",
    padding: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  readAllBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  readAllText: { fontWeight: "700" },
  counter: { marginTop: 4, fontSize: 12 },
  loader: { marginTop: 8 },
  list: { marginTop: 8 },
  empty: { textAlign: "center", paddingVertical: 18 },
  item: { borderWidth: 1, borderRadius: radius.sm, padding: 10, marginBottom: 8, backgroundColor: "#ffffff08" },
  itemUnread: { borderColor: colors.info, backgroundColor: "#3b82f614" },
  itemTitle: { fontSize: 14, fontWeight: "700" },
  itemMessage: { marginTop: 4, fontSize: 13, lineHeight: 18 },
});
