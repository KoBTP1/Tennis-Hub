import React, { useEffect, useState } from "react";
import { Alert, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { normalizeImageUrl } from "../utils/imageUrl";
import NotificationCenter from "./NotificationCenter";
import AssistantCenter from "./AssistantCenter";

export default function RoleTopBar({ onBack = null }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top || 0, Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const greetingName = user?.name || "User";
  const dateLocale = language === "en" ? "en-US" : "vi-VN";
  const greetingDate = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const resolveUserAvatar = () => {
    const candidates = [
      user?.avatar,
      user?.avatarUrl,
      user?.profileImage,
      user?.profileImageUrl,
      user?.image,
      user?.photoUrl,
    ];
    const matched = candidates.find((value) => String(value || "").trim());
    return matched ? normalizeImageUrl(matched) : "";
  };
  const avatarUrl = resolveUserAvatar();

  useEffect(() => {
    let mounted = true;
    // Dynamic import avoids extra load when header renders before auth.
    const loadUnread = async () => {
      try {
        const { getMyNotifications } = await import("../services/notificationService");
        const response = await getMyNotifications({ page: 1, limit: 1 });
        if (mounted) {
          setUnreadCount(Number(response?.unreadCount || 0));
        }
      } catch {
        if (mounted) {
          setUnreadCount(0);
        }
      }
    };
    loadUnread();
    const timer = setInterval(loadUnread, 20000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.topHeader, { paddingTop: topInset + 8 }]}
      >
        <View style={styles.headerLeft}>
          {onBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={16} color="#065f46" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{String(greetingName).slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.headerDate}>{greetingDate}</Text>
            <Text style={styles.headerName}>{greetingName}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsAssistantVisible(true)}>
            <Ionicons name="sparkles-outline" size={16} color="#065f46" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsNotificationVisible(true)}>
            <Ionicons name="notifications-outline" size={16} color="#065f46" />
            {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.languageBtn}
            onPress={() =>
              Alert.alert(t("languageTitle"), t("languagePrompt"), [
                { text: t("vietnamese"), onPress: () => setLanguage("vi") },
                { text: t("english"), onPress: () => setLanguage("en") },
                { text: t("cancel"), style: "cancel" },
              ])
            }
          >
            <Text style={styles.languageStar}>★</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <NotificationCenter
        visible={isNotificationVisible}
        onClose={() => {
          setIsNotificationVisible(false);
          setUnreadCount(0);
        }}
      />
      <AssistantCenter
        visible={isAssistantVisible}
        onClose={() => {
          setIsAssistantVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontWeight: "800", color: "#065f46" },
  headerDate: { color: "#fff", fontSize: 13, fontWeight: "600" },
  headerName: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  languageBtn: {
    width: 28,
    height: 22,
    borderRadius: 3,
    backgroundColor: "#da251d",
    alignItems: "center",
    justifyContent: "center",
  },
  languageStar: { color: "#ffde00", fontSize: 14, fontWeight: "800", lineHeight: 16 },
});
