import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "../services/notificationService";
import { colors, radius } from "../styles/theme";

export default function NotificationCenter({ visible, onClose }) {
  const { theme, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const panelBg = isDarkMode ? "#171b22" : "#111827";
  const panelText = "#f3f4f6";
  const panelMuted = "#9ca3af";

  const visibleItems = useMemo(() => {
    if (activeFilter === "unread") {
      return items.filter((item) => !item.isRead);
    }
    return items;
  }, [activeFilter, items]);

  const groupedSections = useMemo(() => {
    const seen = new Set();
    const freshItems = [];
    const todayItems = [];
    const previousItems = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const item of visibleItems) {
      if (!item?.id || seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      if (!item.isRead) {
        freshItems.push(item);
        continue;
      }
      const createdAt = new Date(item.createdAt);
      if (!Number.isNaN(createdAt.getTime()) && createdAt >= todayStart) {
        todayItems.push(item);
      } else {
        previousItems.push(item);
      }
    }

    return [
      { key: "fresh", title: t("notificationSectionFresh"), items: freshItems },
      { key: "today", title: t("notificationSectionToday"), items: todayItems },
      { key: "previous", title: t("notificationSectionPrevious"), items: previousItems },
    ].filter((section) => section.items.length > 0);
  }, [t, visibleItems]);

  const getRelativeTimeLabel = (inputDate) => {
    const date = new Date(inputDate);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    if (diffHours < 1) {
      const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return `${diffMinutes} ${t("notificationMinutes")}`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${t("notificationHours")}`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${t("notificationDays")}`;
  };

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
        <TouchableOpacity style={styles.dismissLayer} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: panelBg, borderColor: "#2a3240" }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: panelText }]}>{t("notifications")}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllRead}>
                <Text style={[styles.readAllText, { color: "#60a5fa" }]}>{t("notificationMarkAllRead")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color={panelMuted} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === "all" ? styles.filterPillActive : null]}
              onPress={() => setActiveFilter("all")}
            >
              <Text style={[styles.filterText, { color: activeFilter === "all" ? "#93c5fd" : panelText }]}>{t("filterAll")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterPill, activeFilter === "unread" ? styles.filterPillActive : null]}
              onPress={() => setActiveFilter("unread")}
            >
              <Text style={[styles.filterText, { color: activeFilter === "unread" ? "#93c5fd" : panelText }]}>{t("notificationUnread")}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.counter, { color: panelMuted }]}>{`${t("notificationUnreadCount")}: ${unreadCount}`}</Text>
          {isLoading ? <ActivityIndicator size="small" color={theme.info} style={styles.loader} /> : null}
          <ScrollView
            style={styles.list}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadNotifications} />}
          >
            {!isLoading && visibleItems.length === 0 ? (
              <Text style={[styles.empty, { color: panelMuted }]}>{t("notificationEmpty")}</Text>
            ) : null}
            {groupedSections.map((section) => (
              <View key={section.key}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: panelText }]}>{section.title}</Text>
                  {section.key === "fresh" && activeFilter === "all" ? (
                    <Text style={[styles.sectionLink, { color: "#60a5fa" }]}>{t("notificationViewAll")}</Text>
                  ) : null}
                </View>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      if (!item.isRead) {
                        void handleMarkOneRead(item.id);
                      }
                    }}
                    style={[styles.item, { borderColor: "#2a3240" }, !item.isRead ? styles.itemUnread : null]}
                  >
                    <View style={styles.itemHeaderRow}>
                      <Text style={[styles.itemTitle, { color: panelText }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {!item.isRead ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={[styles.itemMessage, { color: panelMuted }]} numberOfLines={2}>
                      {item.message}
                    </Text>
                    <Text style={[styles.itemTime, { color: "#60a5fa" }]}>{getRelativeTimeLabel(item.createdAt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
    backgroundColor: "rgba(2, 6, 23, 0.38)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 62,
    paddingRight: 8,
  },
  dismissLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  card: {
    width: 390,
    maxWidth: "96%",
    borderRadius: 14,
    borderWidth: 1,
    maxHeight: "82%",
    padding: 12,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "800" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  readAllBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  readAllText: { fontWeight: "700" },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  filterPill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "#2a3240" },
  filterPillActive: { backgroundColor: "#1e3a5f", borderColor: "#3b82f6" },
  filterText: { fontSize: 14, fontWeight: "700" },
  counter: { marginTop: 4, fontSize: 12 },
  loader: { marginTop: 8 },
  list: { marginTop: 8 },
  empty: { textAlign: "center", paddingVertical: 18 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, marginTop: 6 },
  sectionTitle: { fontSize: 30 / 2, fontWeight: "800" },
  sectionLink: { fontSize: 14, fontWeight: "700" },
  item: { borderWidth: 1, borderRadius: radius.sm, padding: 10, marginBottom: 8, backgroundColor: "#0f1623" },
  itemUnread: { borderColor: colors.info, backgroundColor: "#18263d" },
  itemHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: "700" },
  itemMessage: { marginTop: 4, fontSize: 13, lineHeight: 18 },
  itemTime: { marginTop: 4, fontSize: 13, fontWeight: "700" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#60a5fa" },
});
