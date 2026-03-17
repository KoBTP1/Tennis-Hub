import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { getMyBookings } from "../../services/bookingService";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { POLICY_CONTENT } from "../../constants/policyContent";
import { colors, radius } from "../../styles/theme";
import { normalizeImageUrl } from "../../utils/imageUrl";

export default function UserProfileScreen({ onTabPress, onNavigate }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const profileTopInset = Platform.OS === "web" ? 4 : Math.max(insets.top, 12);
  const [webBookings, setWebBookings] = useState([]);
  const [isLoadingWebBookings, setIsLoadingWebBookings] = useState(Platform.OS === "web");
  const [webBookingsError, setWebBookingsError] = useState("");
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);
  const palette = isDarkMode
    ? {
        background: "#0f172a",
        card: "#111827",
        textPrimary: "#E5E5E5",
        textSecondary: "#94a3b8",
        border: "#1e293b",
      }
    : {
        background: colors.background,
        card: colors.white,
        textPrimary: colors.textPrimary,
        textSecondary: colors.textSecondary,
        border: colors.border,
      };
  const avatarUrl = normalizeImageUrl(user?.avatar || user?.avatarUrl || "");
  const quickActions = [
    { key: "bookings", label: t("profileQuickBookings"), icon: "calendar-outline" },
    { key: "notifications", label: t("profileQuickNotifications"), icon: "notifications-outline" },
    { key: "courses", label: t("profileQuickCourses"), icon: "school-outline" },
    { key: "offers", label: t("profileQuickOffers"), icon: "gift-outline" },
  ];
  const activityRows = [
    { key: "my-team", label: t("profileActivityTeam"), icon: "people-outline" },
    { key: "my-lessons", label: t("profileActivityLessons"), icon: "reader-outline" },
    { key: "membership-packages", label: t("profileActivityMembership"), icon: "pricetag-outline" },
  ];
  const systemRows = [
    { key: "settings", label: t("profileSystemSettings"), icon: "settings-outline" },
    { key: "version", label: t("profileSystemVersion"), icon: "information-circle-outline" },
    { key: "policy", label: t("profileSystemPolicy"), icon: "shield-checkmark-outline" },
    { key: "news", label: t("profileSystemNews"), icon: "sparkles-outline" },
  ];

  const handleQuickAction = (key) => {
    if (key === "bookings") {
      onTabPress?.("Bookings");
      return;
    }
    Alert.alert(t("notifications"), t("featureUpdating"));
  };
  const handleSystemAction = (key) => {
    if (key === "settings") {
      onNavigate?.("settings");
      return;
    }
    if (key === "policy") {
      setIsPolicyVisible(true);
      return;
    }
    Alert.alert(t("notifications"), t("featureUpdating"));
  };

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    let mounted = true;
    const loadWebBookings = async () => {
      try {
        setIsLoadingWebBookings(true);
        setWebBookingsError("");
        const response = await getMyBookings();
        if (!mounted) {
          return;
        }
        setWebBookings(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setWebBookingsError(error?.message || t("bookingsLoadFailed"));
      } finally {
        if (mounted) {
          setIsLoadingWebBookings(false);
        }
      }
    };

    loadWebBookings();
    return () => {
      mounted = false;
    };
  }, [t]);

  const webBookingItems = useMemo(() => webBookings.slice(0, 8), [webBookings]);
  const policyData = language === "en" ? POLICY_CONTENT.en : POLICY_CONTENT.vi;
  let webBookingsContent = null;
  if (isLoadingWebBookings) {
    webBookingsContent = (
      <View style={styles.webEmptyWrap}>
        <ActivityIndicator size="small" color="#22c55e" />
      </View>
    );
  } else if (webBookingsError) {
    webBookingsContent = (
      <View style={styles.webEmptyWrap}>
        <Text style={[styles.webEmptyText, { color: "#ef4444" }]}>{webBookingsError}</Text>
      </View>
    );
  } else if (webBookingItems.length === 0) {
    webBookingsContent = (
      <View style={styles.webEmptyWrap}>
        <Text style={[styles.webEmptyText, { color: palette.textSecondary }]}>Ban chua co lich dat</Text>
      </View>
    );
  } else {
    webBookingsContent = (
      <View style={styles.webBookingsList}>
        {webBookingItems.map((booking) => {
          const courtName = booking?.courtId?.name || t("court");
          const dateValue = booking?.slotId?.date ? new Date(booking.slotId.date).toLocaleDateString("vi-VN") : "";
          const timeValue = booking?.slotId?.startTime && booking?.slotId?.endTime
            ? `${booking.slotId.startTime} - ${booking.slotId.endTime}`
            : "";
          const imageUrl = normalizeImageUrl(Array.isArray(booking?.courtId?.images) ? booking.courtId.images[0] || "" : "");
          return (
            <View key={booking?._id || `${courtName}-${dateValue}-${timeValue}`} style={[styles.webBookingRow, { borderColor: palette.border }]}>
              <View style={styles.webBookingThumbWrap}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.webBookingThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.webBookingThumbFallback}>
                    <Ionicons name="tennisball-outline" size={18} color="#15803d" />
                  </View>
                )}
              </View>
              <View style={styles.webBookingInfo}>
                <Text numberOfLines={1} style={[styles.webBookingTitle, { color: palette.textPrimary }]}>{courtName}</Text>
                <Text style={[styles.webBookingMeta, { color: palette.textSecondary }]}>{dateValue}</Text>
                <Text style={[styles.webBookingMeta, { color: palette.textSecondary }]}>{timeValue}</Text>
              </View>
              <Text style={styles.webBookingStatus}>{String(booking?.status || "").toUpperCase()}</Text>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <ScreenContainer backgroundColor={palette.background}>
        {Platform.OS === "web" && (
          <View style={styles.webSplit}>
            <View style={styles.webLeftColumn}>
              <Card style={[styles.profileCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate?.("edit-profile")}>
                  <LinearGradient
                    colors={["#14532d", "#1d4ed8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.profileRow}
                  >
                    <View style={styles.avatarWrap}>
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarText}>{(user?.name || "U").slice(0, 1).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileNameLight}>{user?.name || t("user")}</Text>
                      <Text style={styles.profileSubLight}>{user?.email || t("emailNotUpdated")}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#e2e8f0" />
                  </LinearGradient>
                </TouchableOpacity>
                <View style={styles.quickRow}>
                  {quickActions.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.quickAction, { backgroundColor: palette.card, borderColor: palette.border }]}
                      onPress={() => handleQuickAction(item.key)}
                    >
                      <View style={item.key === "notifications" ? styles.smallIconBtn : null}>
                        <Ionicons name={item.icon} size={20} color="#047857" />
                      </View>
                      <Text style={[styles.quickActionText, { color: palette.textPrimary }]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{t("profileSectionActivity")}</Text>
              <View style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                {activityRows.map((item, index) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.listRow, index === activityRows.length - 1 ? styles.listRowLast : null]}
                    onPress={() => Alert.alert(t("notifications"), t("featureUpdating"))}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons name={item.icon} size={20} color="#15803d" />
                      <Text style={[styles.rowLabel, { color: palette.textPrimary }]}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={palette.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.sectionTitle, styles.sectionSpacing, { color: palette.textPrimary }]}>{t("profileSectionSystem")}</Text>
              <View style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
                {systemRows.map((item, index) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.listRow, index === systemRows.length - 1 ? styles.listRowLast : null]}
                    onPress={() => handleSystemAction(item.key)}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons name={item.icon} size={20} color="#15803d" />
                      <Text style={[styles.rowLabel, { color: palette.textPrimary }]}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={palette.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.versionText, { color: palette.textSecondary }]}>{`${t("profileVersionPrefix")}: 2.8.9`}</Text>
            </View>
            <View style={styles.webRightColumn}>
              <Text style={[styles.webHeading, { color: palette.textPrimary }]}>Danh sach dat lich</Text>
              <Card style={[styles.webBookingsCard, { backgroundColor: palette.card, borderColor: palette.border }]}>{webBookingsContent}</Card>
            </View>
          </View>
        )}
        {Platform.OS === "web" ? null : (
          <>
        <Card style={[styles.profileCard, { marginTop: profileTopInset }, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => onNavigate?.("edit-profile")}>
            <LinearGradient
              colors={["#14532d", "#1d4ed8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.profileRow}
            >
              <View style={styles.avatarWrap}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{(user?.name || "U").slice(0, 1).toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileNameLight}>{user?.name || t("user")}</Text>
                <Text style={styles.profileSubLight}>{user?.email || t("emailNotUpdated")}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#e2e8f0" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.quickRow}>
            {quickActions.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.quickAction, { backgroundColor: palette.card, borderColor: palette.border }]}
                onPress={() => handleQuickAction(item.key)}
              >
                <View style={item.key === "notifications" ? styles.smallIconBtn : null}>
                  <Ionicons name={item.icon} size={20} color="#047857" />
                </View>
                <Text style={[styles.quickActionText, { color: palette.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>{t("profileSectionActivity")}</Text>
        <View style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {activityRows.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.listRow, index === activityRows.length - 1 ? styles.listRowLast : null]}
              onPress={() => Alert.alert(t("notifications"), t("featureUpdating"))}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={item.icon} size={20} color="#15803d" />
                <Text style={[styles.rowLabel, { color: palette.textPrimary }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionSpacing, { color: palette.textPrimary }]}>{t("profileSectionSystem")}</Text>
        <View style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {systemRows.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.listRow, index === systemRows.length - 1 ? styles.listRowLast : null]}
              onPress={() => handleSystemAction(item.key)}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={item.icon} size={20} color="#15803d" />
                <Text style={[styles.rowLabel, { color: palette.textPrimary }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.versionText, { color: palette.textSecondary }]}>{`${t("profileVersionPrefix")}: 2.8.9`}</Text>
          </>
        )}
      </ScreenContainer>
      <Modal visible={isPolicyVisible} transparent animationType="fade" onRequestClose={() => setIsPolicyVisible(false)}>
        <View style={styles.policyBackdrop}>
          <View style={[styles.policyCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={[styles.policyHeader, { borderBottomColor: palette.border }]}>
              <Text style={[styles.policyTitle, { color: palette.textPrimary }]}>{policyData.title}</Text>
              <TouchableOpacity onPress={() => setIsPolicyVisible(false)}>
                <Ionicons name="close" size={20} color={palette.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.policyUpdatedAt, { color: palette.textSecondary }]}>{policyData.updatedAt}</Text>
            <ScrollView style={styles.policyScroll} contentContainerStyle={styles.policyScrollContent} showsVerticalScrollIndicator>
              {policyData.sections.map((section) => (
                <View key={section.heading} style={styles.policySection}>
                  <Text style={[styles.policySectionHeading, { color: palette.textPrimary }]}>{section.heading}</Text>
                  <Text style={[styles.policySectionBody, { color: palette.textSecondary }]}>{section.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <TabBar tabs={["Home", "Bookings", "Profile"]} active="Profile" onTabPress={onTabPress} />
    </View>
  );
}

UserProfileScreen.propTypes = {
  onTabPress: PropTypes.func,
  onNavigate: PropTypes.func,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  profileCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  profileRow: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
  },
  avatar: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#065f46", fontWeight: "800", fontSize: 18 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 22, fontWeight: "800" },
  profileSub: { marginTop: 2, fontSize: 13 },
  profileNameLight: { fontSize: 22, fontWeight: "800", color: "#ffffff" },
  profileSubLight: { marginTop: 2, fontSize: 13, color: "#dbeafe" },
  quickRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  quickAction: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  quickActionText: { fontWeight: "700", fontSize: 12, textAlign: "center" },
  smallIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 17,
    fontWeight: "800",
  },
  sectionSpacing: { marginTop: 18 },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  listRow: {
    minHeight: 56,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listRowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { color: "#374151", fontSize: 16, fontWeight: "600" },
  versionText: { textAlign: "right", marginTop: 10, marginRight: 4, fontWeight: "600" },
  webSplit: { flexDirection: "row", gap: 12, minHeight: 560 },
  webLeftColumn: { width: 320 },
  webRightColumn: { flex: 1 },
  webHeading: { fontSize: 24, fontWeight: "800", marginTop: 2, marginBottom: 8, textAlign: "center" },
  webBookingsCard: { flex: 1, borderWidth: 1, borderRadius: 10, minHeight: 520, padding: 10 },
  webBookingsList: { gap: 10 },
  webBookingRow: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 82,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  webBookingThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#dcfce7",
  },
  webBookingThumb: { width: "100%", height: "100%" },
  webBookingThumbFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  webBookingInfo: { flex: 1 },
  webBookingTitle: { fontSize: 16, fontWeight: "700" },
  webBookingMeta: { marginTop: 2, fontSize: 12, fontWeight: "500" },
  webBookingStatus: { color: "#22c55e", fontSize: 11, fontWeight: "800" },
  webEmptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  webEmptyText: { fontSize: 15, fontWeight: "500" },
  policyBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  policyCard: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "88%",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  policyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 6,
  },
  policyTitle: { fontSize: 18, fontWeight: "800", flex: 1, marginRight: 8 },
  policyUpdatedAt: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  policyScroll: { flexGrow: 0 },
  policyScrollContent: { paddingBottom: 8 },
  policySection: { marginBottom: 10 },
  policySectionHeading: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  policySectionBody: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
});
