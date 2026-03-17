import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert, Platform, TouchableOpacity } from "react-native";
import BookingCard from "../../components/BookingCard";
import Card from "../../components/Card";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";
import { getMyBookings, cancelBooking } from "../../services/bookingService";
import { confirmMockPayment } from "../../services/paymentService";
import { formatVND } from "../../utils/currency";
import { normalizeImageUrl } from "../../utils/imageUrl";

function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      card: "#111827",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
      border: "#1e293b",
    };
  }

  return {
    background: colors.background,
    card: colors.white,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    border: colors.border,
  };
}

export default function UserBookingsScreen({ onTabPress, onNavigate }) {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [payingBookingId, setPayingBookingId] = useState("");
  const palette = getPalette(isDarkMode);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getMyBookings();
      // res is { success: true, message: "...", data: [...] } from backend
      setBookings(res.data || []);
    } catch (err) {
      setError(err.message || t("bookingsLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    const performCancel = async () => {
      try {
        await cancelBooking(id);
        Alert.alert(t("bookingSuccessTitle"), t("bookingsCancelSuccess"));
        await fetchBookings();
      } catch (err) {
        Alert.alert(t("error"), err.message || t("bookingsCancelFailed"));
      }
    };

    if (Platform.OS === "web") {
      const accepted = globalThis.confirm?.(t("bookingsCancelConfirm"));
      if (!accepted) {
        return;
      }
      await performCancel();
      return;
    }

    Alert.alert(
      t("bookingsCancelTitle"),
      t("bookingsCancelConfirm"),
      [
        { text: t("no"), style: "cancel" },
        { 
          text: t("yes"), 
          style: "destructive",
          onPress: () => {
            void performCancel();
          },
        }
      ]
    );
  };

  const handleConfirmPayment = async (bookingId) => {
    try {
      setPayingBookingId(bookingId);
      await confirmMockPayment(bookingId);
      Alert.alert(t("payment"), t("bookingsPaymentSuccess"));
      await fetchBookings();
    } catch (err) {
      Alert.alert(t("bookingsPaymentError"), err.message || t("bookingsPaymentErrorMessage"));
    } finally {
      setPayingBookingId("");
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const pastBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");
  const filteredBookings =
    activeFilter === "upcoming" ? upcomingBookings : activeFilter === "past" ? pastBookings : bookings;
  const filterTabs = [
    { key: "all", label: t("filterAll") },
    { key: "upcoming", label: t("filterUpcoming") },
    { key: "past", label: t("filterPast") },
  ];
  const formatBookingStatus = (status) => {
    const key = String(status || "").toLowerCase();
    const statusMap = {
      pending: t("statusPending"),
      confirmed: t("statusConfirmed"),
      completed: t("statusCompleted"),
      cancelled: t("statusCancelled"),
    };
    return statusMap[key] || status;
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <RoleTopBar onAvatarPress={() => onNavigate?.("edit-profile")} />
      <ScreenContainer backgroundColor={palette.background}>
        <Card style={[styles.tabFilter, { backgroundColor: palette.card }]}>
          {filterTabs.map((tab) => (
            <TouchableOpacity key={tab.key} style={[styles.filterPill, activeFilter === tab.key ? styles.filterPillActive : null]} onPress={() => setActiveFilter(tab.key)}>
              <Text style={[styles.filterText, { color: palette.textPrimary }, activeFilter === tab.key ? styles.filterTextActive : null]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.info} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
              {activeFilter === "all" ? t("bookingsAllTitle") : `${filterTabs.find((tab) => tab.key === activeFilter)?.label || ""} ${t("bookingsTitleSuffix")}`}
            </Text>
            {filteredBookings.length === 0 ? (
              <Text style={[styles.emptyText, { color: palette.textSecondary }]}>{t("bookingsNoItemsInFilter")}</Text>
            ) : null}
            {filteredBookings.map((item) => {
              const dateStr = item.slotId?.date ? new Date(item.slotId.date).toDateString() : "";
              const canCancel = item.status === "confirmed" || item.status === "pending";
              const canPay =
                item.status === "pending" &&
                (item.paymentStatus === "unpaid" || item.paymentStatus === "failed" || !item.paymentStatus);
              const payLabel = payingBookingId === item._id ? t("bookingsProcessing") : t("bookingsConfirmPayment");
              return (
                <BookingCard 
                  key={item._id} 
                  title={item.courtId?.name || t("court")} 
                  subtitle={dateStr}
                  time={`${item.slotId?.startTime || ""} - ${item.slotId?.endTime || ""}`}
                  amount={item.paymentStatus === "paid" ? `${t("paymentPaid")} ${formatVND(item.totalPrice || 0)}` : `${t("paymentUnpaid")} ${formatVND(item.totalPrice || 0)}`}
                  status={formatBookingStatus(item.status)}
                  imageUrl={normalizeImageUrl(Array.isArray(item.courtId?.images) ? item.courtId.images[0] || "" : "")}
                  actions={
                    [
                      ...(canPay
                        ? [{ label: payLabel, onPress: () => handleConfirmPayment(item._id) }]
                        : []),
                      ...(canCancel
                        ? [{ label: t("bookingsCancelAction"), type: "danger", onPress: () => handleCancelBooking(item._id) }]
                        : []),
                    ]
                  } 
                />
              );
            })}
          </>
        )}
      </ScreenContainer>
      <TabBar tabs={["Home", "Bookings", "Profile"]} active="Bookings" onTabPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabFilter: { flexDirection: "row", gap: 8, padding: 6 },
  filterPill: { flex: 1, alignItems: "center", borderRadius: radius.sm, paddingVertical: 10 },
  filterPillActive: { backgroundColor: colors.info },
  filterText: { color: colors.textPrimary, fontWeight: "600" },
  filterTextActive: { color: colors.white },
  sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: "700", marginTop: 6, marginBottom: 8 },
  loader: { marginTop: 20 },
  errorText: { color: colors.danger, marginTop: 20, textAlign: "center" },
  emptyText: { color: colors.textSecondary, marginTop: 4, marginBottom: 12 },
});
