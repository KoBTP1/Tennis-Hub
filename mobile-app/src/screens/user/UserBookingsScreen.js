import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert } from "react-native";
import AppHeader from "../../components/AppHeader";
import BookingCard from "../../components/BookingCard";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import TabBar from "../../components/TabBar";
import { colors, radius } from "../../styles/theme";
import { getMyBookings, cancelBooking } from "../../services/bookingService";

export default function UserBookingsScreen({ onTabPress }) {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const pastBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

  return (
    <View style={styles.root}>
      <AppHeader title="My Bookings" />
      <ScreenContainer>
        <Card style={styles.tabFilter}>
          {["All", "Upcoming", "Past"].map((tab, index) => (
            <View key={tab} style={[styles.filterPill, index === 0 ? styles.filterPillActive : null]}>
              <Text style={[styles.filterText, index === 0 ? styles.filterTextActive : null]}>{tab}</Text>
            </View>
          ))}
        </Card>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.info} style={styles.loader} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
            {upcomingBookings.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming bookings.</Text>
            ) : null}
            {upcomingBookings.map((item) => {
              const dateStr = item.slotId?.date ? new Date(item.slotId.date).toDateString() : "";
              return (
                <BookingCard 
                  key={item._id} 
                  title={item.courtId?.name || "Court"} 
                  subtitle={dateStr}
                  time={`${item.slotId?.startTime || ""} - ${item.slotId?.endTime || ""}`}
                  amount="Paid"
                  status={item.status}
                  actions={[{ 
                    label: "Cancel Booking", 
                    type: "danger", 
                    onPress: () => handleCancelBooking(item._id) 
                  }]} 
                />
              );
            })}

            <Text style={styles.sectionTitle}>Past & Cancelled Bookings</Text>
            {pastBookings.length === 0 ? (
              <Text style={styles.emptyText}>No past bookings.</Text>
            ) : null}
            {pastBookings.map((item) => {
              const dateStr = item.slotId?.date ? new Date(item.slotId.date).toDateString() : "";
              return (
                <BookingCard 
                  key={item._id} 
                  title={item.courtId?.name || "Court"} 
                  subtitle={dateStr}
                  time={`${item.slotId?.startTime || ""} - ${item.slotId?.endTime || ""}`}
                  amount="Paid"
                  status={item.status}
                  actions={[]} 
                />
              );
            })}
          </>
        )}
      </ScreenContainer>
      <TabBar tabs={["Home", "Search", "Bookings", "Profile"]} active="Bookings" onTabPress={onTabPress} />
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
