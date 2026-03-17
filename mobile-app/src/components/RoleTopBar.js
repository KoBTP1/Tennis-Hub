import React, { useEffect, useState } from "react";
import { Image, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { normalizeImageUrl } from "../utils/imageUrl";
import NotificationCenter from "./NotificationCenter";
import AssistantCenter from "./AssistantCenter";

export default function RoleTopBar({ onBack = null, onAvatarPress = null }) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top || 0, Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);
  const [isLanguageVisible, setIsLanguageVisible] = useState(false);
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
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={onAvatarPress ? 0.8 : 1}
            onPress={onAvatarPress || undefined}
            disabled={!onAvatarPress}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{String(greetingName).slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </TouchableOpacity>
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
            onPress={() => setIsLanguageVisible(true)}
          >
            {language === "vi" ? (
              <View style={styles.flagCircleViOuter}>
                <View style={styles.flagCircleVi}>
                  <Text style={styles.flagCircleViStar}>★</Text>
                </View>
              </View>
            ) : (
              <View style={styles.flagCircleEnOuter}>
                <View style={styles.flagCircleEn}>
                  <View style={styles.flagEnCrossHorizontalWhite} />
                  <View style={styles.flagEnCrossVerticalWhite} />
                  <View style={styles.flagEnCrossHorizontalRed} />
                  <View style={styles.flagEnCrossVerticalRed} />
                </View>
              </View>
            )}
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
      <Modal visible={isLanguageVisible} transparent animationType="fade" onRequestClose={() => setIsLanguageVisible(false)}>
        <View style={styles.langModalBackdrop}>
          <TouchableOpacity style={styles.langDismissLayer} activeOpacity={1} onPress={() => setIsLanguageVisible(false)} />
          <View style={styles.langModalCard}>
            <TouchableOpacity
              style={[styles.langOption, { borderColor: "#e5e7eb", backgroundColor: language === "vi" ? "#f3f4f6" : "#ffffff" }]}
              onPress={() => {
                setLanguage("vi");
                setIsLanguageVisible(false);
              }}
            >
              <View style={styles.flagCircleViOuterSmall}>
                <View style={styles.flagCircleViSmall}>
                  <Text style={styles.flagCircleViStarSmall}>★</Text>
                </View>
              </View>
              <Text style={styles.langOptionText}>{t("vietnamese")}</Text>
              {language === "vi" ? <Ionicons name="checkmark-circle" size={20} color="#1d4ed8" /> : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langOption, styles.langOptionLast, { borderColor: "#e5e7eb", backgroundColor: language === "en" ? "#f3f4f6" : "#ffffff" }]}
              onPress={() => {
                setLanguage("en");
                setIsLanguageVisible(false);
              }}
            >
              <View style={styles.langMiniFlagEn}>
                <View style={styles.flagEnCrossHorizontalWhite} />
                <View style={styles.flagEnCrossVerticalWhite} />
                <View style={styles.flagEnCrossHorizontalRed} />
                <View style={styles.flagEnCrossVerticalRed} />
              </View>
              <Text style={styles.langOptionText}>{t("english")}</Text>
              {language === "en" ? <Ionicons name="checkmark-circle" size={20} color="#1d4ed8" /> : null}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  flagCircleViOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  flagCircleEnOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  flagCircleEn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1d4ed8",
    overflow: "hidden",
    position: "relative",
  },
  flagCircleVi: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#da251d",
    alignItems: "center",
    justifyContent: "center",
  },
  flagCircleViStar: {
    color: "#ffde00",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  flagCircleViOuterSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  flagCircleViSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#da251d",
    alignItems: "center",
    justifyContent: "center",
  },
  flagCircleViStarSmall: {
    color: "#ffde00",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 12,
  },
  langModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.18)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 58,
    paddingRight: 10,
  },
  langDismissLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  langModalCard: {
    width: 190,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#ffffff",
    borderColor: "#d1d5db",
    padding: 8,
    shadowColor: "#020617",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
  },
  langOption: {
    borderBottomWidth: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  langOptionLast: { borderBottomWidth: 0 },
  langOptionText: { flex: 1, fontSize: 15, fontWeight: "700", color: "#14532d" },
  langMiniFlagEn: {
    width: 22,
    height: 16,
    borderRadius: 2,
    backgroundColor: "#1d4ed8",
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
    position: "relative",
  },
  flagEnCrossHorizontalWhite: {
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#ffffff",
  },
  flagEnCrossVerticalWhite: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#ffffff",
  },
  flagEnCrossHorizontalRed: {
    position: "absolute",
    top: 7,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#dc2626",
  },
  flagEnCrossVerticalRed: {
    position: "absolute",
    left: 9,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#dc2626",
  },
});
