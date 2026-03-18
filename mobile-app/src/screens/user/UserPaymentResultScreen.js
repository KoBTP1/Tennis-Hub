import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import ScreenContainer from "../../components/ScreenContainer";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";
import { formatVND } from "../../utils/currency";

function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      card: "#111827",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
      border: "#1e293b",
      success: "#22c55e",
      danger: "#ef4444",
      warning: "#f59e0b",
    };
  }
  return {
    background: colors.background,
    card: colors.white,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    border: colors.border,
    success: "#16a34a",
    danger: "#dc2626",
    warning: "#d97706",
  };
}

function buildResultCopy(status, t) {
  if (status === "success") {
    return {
      icon: "checkmark-circle",
      colorKey: "success",
      title: t("paymentResultSuccessTitle"),
      message: t("paymentResultSuccessMessage"),
    };
  }
  if (status === "cancelled") {
    return {
      icon: "close-circle",
      colorKey: "warning",
      title: t("paymentResultCancelledTitle"),
      message: t("paymentResultCancelledMessage"),
    };
  }
  return {
    icon: "alert-circle",
    colorKey: "danger",
    title: t("paymentResultFailedTitle"),
    message: t("paymentResultFailedMessage"),
  };
}

export default function UserPaymentResultScreen({ result, onBack }) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const palette = getPalette(isDarkMode);
  const normalizedStatus = String(result?.status || "failed");
  const copy = buildResultCopy(normalizedStatus, t);
  const iconColor = palette[copy.colorKey] || palette.textPrimary;
  const amount = Number(result?.amount || 0);

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <ScreenContainer backgroundColor={palette.background}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Ionicons name={copy.icon} size={68} color={iconColor} />
          <Text style={[styles.title, { color: palette.textPrimary }]}>{copy.title}</Text>
          <Text style={[styles.message, { color: palette.textSecondary }]}>{copy.message}</Text>

          <View style={[styles.detailBox, { borderColor: palette.border }]}>
            <Text style={[styles.detailLine, { color: palette.textPrimary }]}>
              {`${t("paymentResultBookingId")}: ${String(result?.bookingId || "--")}`}
            </Text>
            <Text style={[styles.detailLine, { color: palette.textPrimary }]}>
              {`${t("paymentResultTransactionId")}: ${String(result?.transactionId || "--")}`}
            </Text>
            <Text style={[styles.detailLine, { color: palette.textPrimary }]}>
              {`${t("paymentResultAmount")}: ${amount > 0 ? formatVND(amount) : "--"}`}
            </Text>
            {result?.detailMessage ? (
              <Text style={[styles.detailLine, { color: palette.textSecondary }]}>
                {`${t("paymentResultDetail")}: ${String(result.detailMessage)}`}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
            <Text style={styles.primaryBtnText}>{t("paymentResultBackToBookings")}</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </View>
  );
}

UserPaymentResultScreen.propTypes = {
  result: PropTypes.shape({
    status: PropTypes.string,
    bookingId: PropTypes.string,
    transactionId: PropTypes.string,
    amount: PropTypes.number,
    detailMessage: PropTypes.string,
  }),
  onBack: PropTypes.func,
};

UserPaymentResultScreen.defaultProps = {
  result: null,
  onBack: () => {},
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: 18,
    padding: 18,
    alignItems: "center",
  },
  title: { marginTop: 10, fontSize: 24, fontWeight: "800", textAlign: "center" },
  message: { marginTop: 8, fontSize: 15, textAlign: "center", lineHeight: 22 },
  detailBox: {
    width: "100%",
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailLine: { fontSize: 14, fontWeight: "600" },
  primaryBtn: {
    marginTop: 20,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.info,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
