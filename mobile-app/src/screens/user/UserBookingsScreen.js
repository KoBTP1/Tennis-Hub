import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import AppHeader from "../../components/AppHeader";
import BookingCard from "../../components/BookingCard";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";
import { getMyBookings, cancelBooking } from "../../services/bookingService";
import { confirmMockPayment } from "../../services/paymentService";

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

export default function UserBookingsScreen({ onTabPress }) {
  const { isDarkMode } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
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
      setError(err.message || "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes", 
          style: "destructive",
          onPress: async () => {
            try {
              await cancelBooking(id);
              Alert.alert("Success", "Booking cancelled successfully.");
              fetchBookings();
            } catch (err) {
              Alert.alert("Error", err.message || "Failed to cancel booking.");
            }
          }
        }
      ]
    );
  };

  const handleConfirmPayment = async (bookingId) => {
    try {
      setPayingBookingId(bookingId);
      await confirmMockPayment(bookingId);
      Alert.alert("Payment", "Mock payment confirmed successfully.");
      await fetchBookings();
    } catch (err) {
      Alert.alert("Payment Error", err.message || "Unable to confirm payment.");
    } finally {
      setPayingBookingId("");
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const pastBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");
  const filteredBookings =
    activeFilter === "Upcoming" ? upcomingBookings : activeFilter === "Past" ? pastBookings : bookings;

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <AppHeader title="My Bookings" />
      <ScreenContainer backgroundColor={palette.background}>
        <Card style={[styles.tabFilter, { backgroundColor: palette.card }]}>
          {["All", "Upcoming", "Past"].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.filterPill, activeFilter === tab ? styles.filterPillActive : null]} onPress={() => setActiveFilter(tab)}>
              <Text style={[styles.filterText, { color: palette.textPrimary }, activeFilter === tab ? styles.filterTextActive : null]}>{tab}</Text>
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
              {activeFilter === "All" ? "All Bookings" : `${activeFilter} Bookings`}
            </Text>
            {filteredBookings.length === 0 ? (
              <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No bookings in this filter.</Text>
            ) : null}
            {filteredBookings.map((item) => {
              const dateStr = item.slotId?.date ? new Date(item.slotId.date).toDateString() : "";
              const canCancel = item.status === "confirmed" || item.status === "pending";
              const canPay =
                item.status === "pending" &&
                (item.paymentStatus === "unpaid" || item.paymentStatus === "failed" || !item.paymentStatus);
              const payLabel = payingBookingId === item._id ? "Processing..." : "Confirm Payment";
              return (
                <BookingCard 
                  key={item._id} 
                  title={item.courtId?.name || "Court"} 
                  subtitle={dateStr}
                  time={`${item.slotId?.startTime || ""} - ${item.slotId?.endTime || ""}`}
                  amount={item.paymentStatus === "paid" ? "Paid" : `Unpaid $${item.totalPrice || 0}`}
                  status={item.status}
                  imageUrl={Array.isArray(item.courtId?.images) ? item.courtId.images[0] || "" : ""}
                  actions={
                    [
                      ...(canPay
                        ? [{ label: payLabel, onPress: () => handleConfirmPayment(item._id) }]
                        : []),
                      ...(canCancel
                        ? [{ label: "Cancel Booking", type: "danger", onPress: () => handleCancelBooking(item._id) }]
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
