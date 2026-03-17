import React, { useState } from "react";
import { ActivityIndicator, Alert, Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { colors, radius } from "../../styles/theme";

export default function UserSettingsScreen({ onBack }) {
  const { logout, deleteAccount } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const handleLogout = () => {
    logout().catch(() => {
      Alert.alert(t("settingsLogoutFailedTitle"), t("settingsLogoutFailedMessage"));
    });
  };
  const handleToggleTheme = () => {
    toggleTheme().catch(() => {
      Alert.alert(t("settingsThemeFailedTitle"), t("settingsThemeFailedMessage"));
    });
  };
  const languageLabel = language === "vi" ? t("vietnamese") : t("english");
  const isVietnamese = language === "vi";
  const applyLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    setIsLanguageModalVisible(false);
  };
  const handleConfirmDeleteAccount = () => {
    setIsDeleting(true);
    deleteAccount()
      .catch((error) => {
        Alert.alert(t("settingsDeleteFailedTitle"), error?.message || t("settingsDeleteFailedMessage"));
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("settingsTitle")}</Text>
      </View>
      <ScreenContainer backgroundColor={theme.background}>
        <View style={styles.listWrap}>
          <TouchableOpacity style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => Alert.alert(t("notifications"), t("comingSoonContent"))}>
            <View style={styles.rowLeft}>
              <View style={styles.smallIconBtn}>
                <Ionicons name="notifications-outline" size={16} color="#065f46" />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settingsNotifications")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setIsLanguageModalVisible(true)}
          >
            <View style={styles.rowLeft}>
              {isVietnamese ? (
                <View style={[styles.flagCircle, styles.flagCircleVi]}>
                  <Text style={styles.flagCircleViStar}>★</Text>
                </View>
              ) : (
                <View style={[styles.flagCircle, styles.flagCircleEn]}>
                  <View style={styles.flagEnCrossHorizontalWhite} />
                  <View style={styles.flagEnCrossVerticalWhite} />
                  <View style={styles.flagEnCrossHorizontalRed} />
                  <View style={styles.flagEnCrossVerticalRed} />
                </View>
              )}
              <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settingsLanguage")}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.languageText, { color: theme.textSecondary }]}>{languageLabel}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <Ionicons name={isDarkMode ? "moon-outline" : "sunny-outline"} size={20} color="#166534" />
              <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settingsTheme")}</Text>
            </View>
            <View style={styles.switchWrap}>
              <Text style={[styles.languageText, { color: theme.textSecondary }]}>{isDarkMode ? t("settingsDark") : t("settingsLight")}</Text>
              <Switch
                value={isDarkMode}
                onValueChange={handleToggleTheme}
                trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                thumbColor={isDarkMode ? "#1d4ed8" : "#f8fafc"}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleLogout}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="log-out-outline" size={20} color="#166534" />
              <Text style={[styles.rowLabel, { color: theme.text }]}>{t("settingsLogout")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.card, borderColor: "#fecaca" }]}
            disabled={isDeleting}
            onPress={() => {
              Alert.alert(t("settingsDeleteConfirmTitle"), t("settingsDeleteConfirmMessage"), [
                { text: t("cancel"), style: "cancel" },
                {
                  text: t("settingsDeleteConfirmAction"),
                  style: "destructive",
                  onPress: handleConfirmDeleteAccount,
                },
              ]);
            }}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={styles.rowDanger}>{t("settingsDeleteAccount")}</Text>
            </View>
            {isDeleting ? <ActivityIndicator size="small" color={colors.danger} /> : <Ionicons name="chevron-forward" size={18} color={colors.danger} />}
          </TouchableOpacity>
        </View>
      </ScreenContainer>
      <Modal visible={isLanguageModalVisible} transparent animationType="fade" onRequestClose={() => setIsLanguageModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t("settingsChooseLanguage")}</Text>
              <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.langOption, { borderColor: theme.border, backgroundColor: language === "vi" ? "#dbeafe" : theme.inputBackground }]}
              onPress={() => applyLanguage("vi")}
            >
              <View style={[styles.flagCircle, styles.flagCircleVi]}>
                <Text style={styles.flagCircleViStar}>★</Text>
              </View>
              <Text style={[styles.langOptionText, { color: theme.text }]}>{t("vietnamese")}</Text>
              {language === "vi" ? <Ionicons name="checkmark-circle" size={20} color="#1d4ed8" /> : null}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langOption, { borderColor: theme.border, backgroundColor: language === "en" ? "#dbeafe" : theme.inputBackground }]}
              onPress={() => applyLanguage("en")}
            >
              <View style={[styles.flagCircle, styles.flagCircleEn]}>
                <View style={styles.flagEnCrossHorizontalWhite} />
                <View style={styles.flagEnCrossVerticalWhite} />
                <View style={styles.flagEnCrossHorizontalRed} />
                <View style={styles.flagEnCrossVerticalRed} />
              </View>
              <Text style={[styles.langOptionText, { color: theme.text }]}>{t("english")}</Text>
              {language === "en" ? <Ionicons name="checkmark-circle" size={20} color="#1d4ed8" /> : null}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 62,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", flex: 1, textAlign: "center", marginRight: 40 },
  listWrap: { gap: 12, marginTop: 6 },
  row: {
    height: 56,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowLabel: { fontSize: 16, fontWeight: "600" },
  rowDanger: { fontSize: 16, fontWeight: "600", color: "#ef4444" },
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
  flagCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  flagCircleVi: { backgroundColor: "#da251d" },
  flagCircleViStar: { color: "#ffde00", fontSize: 11, fontWeight: "800", lineHeight: 12 },
  flagCircleEn: { backgroundColor: "#1d4ed8", borderWidth: 1, borderColor: "#d1d5db", position: "relative" },
  flagEnCrossHorizontalWhite: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#ffffff",
  },
  flagEnCrossVerticalWhite: {
    position: "absolute",
    left: 9,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#ffffff",
  },
  flagEnCrossHorizontalRed: {
    position: "absolute",
    top: 9,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#dc2626",
  },
  flagEnCrossVerticalRed: {
    position: "absolute",
    left: 10,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#dc2626",
  },
  languageText: { fontSize: 14, fontWeight: "600" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  switchWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: "800" },
  langOption: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  langOptionText: { flex: 1, fontSize: 15, fontWeight: "700", marginLeft: 8 },
});
