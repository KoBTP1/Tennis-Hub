import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, ActivityIndicator, Alert, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";
import { getCourtDetail, getCourtSlots } from "../../services/courtService";
import { createBooking } from "../../services/bookingService";

function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      card: "#111827",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
    };
  }

  return {
    background: colors.background,
    card: colors.white,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
  };
}

export default function CourtDetailScreen({ courtId, onBack, onTabPress }) {
  const { isDarkMode } = useTheme();
  const [court, setCourt] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const palette = getPalette(isDarkMode);
  const selectedDate = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const isValidDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedDate || "").trim());
      const queryDate = isValidDateFormat ? selectedDate : "";
      const [courtData, slotsData] = await Promise.all([
        getCourtDetail(courtId),
        getCourtSlots(courtId, queryDate),
      ]);
      setCourt(courtData?.data || null);
      setSlots(Array.isArray(slotsData?.data) ? slotsData.data : []);
    } catch (err) {
      setError(err.message || "Failed to load court details");
      Alert.alert("Error", err.message || "Failed to load court details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courtId, selectedDate]);

  const handleBook = async (slot) => {
    const selectedCourtId = court?._id || court?.id;
    const selectedSlotId = slot?._id || slot?.id;
    if (!selectedCourtId || !selectedSlotId) {
      Alert.alert("Booking Failed", "Court or slot information is missing.");
      return;
    }

    try {
      setIsBooking(true);
      await createBooking({
        courtId: selectedCourtId,
        slotId: selectedSlotId,
      });
      Alert.alert("Success", "Booking created successfully!");
      onBack();
      onTabPress("Bookings");
    } catch (err) {
      Alert.alert("Booking Failed", err.message || "Failed to create booking.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <AppHeader title="Court Details" leftText="‹" onLeftPress={onBack} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.info} />
        </View>
      </View>
    );
  }

  if (error || !court) {
    return (
      <View style={[styles.root, { backgroundColor: palette.background }]}>
        <AppHeader title="Court Details" leftText="‹" onLeftPress={onBack} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || "Court not found"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <AppHeader title={court.name} leftText="‹" onLeftPress={onBack} />
      <ScreenContainer backgroundColor={palette.background}>
        <Card style={{ backgroundColor: palette.card }}>
          {Array.isArray(court.images) && court.images[0] ? (
            <Image source={{ uri: court.images[0] }} style={styles.courtImage} resizeMode="cover" />
          ) : null}
          <Text style={[styles.title, { color: palette.textPrimary }]}>{court.name}</Text>
          <Text style={[styles.meta, { color: palette.textSecondary }]}><Ionicons name="location-outline" size={16} /> {court.location}</Text>
          {court.pricePerHour ? (
            <Text style={styles.price}>${court.pricePerHour}/hr</Text>
          ) : null}
          <Text style={[styles.meta, { color: palette.textSecondary }]}>Status: {court.status || "approved"}</Text>
          {court.description ? (
            <Text style={[styles.description, { color: palette.textPrimary }]}>{court.description}</Text>
          ) : null}
        </Card>

        <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Available Slots ({selectedDate})</Text>
        
        {!slots || slots.length === 0 ? (
          <Text style={[styles.emptyText, { color: palette.textSecondary }]}>No available slots for this date.</Text>
        ) : (
          slots?.map((slot, index) => {
            const isAvailable = slot.status === "available";
            return (
              <Card key={index} style={[styles.slotCard, { backgroundColor: palette.card }]}>
                <View style={styles.slotInfo}>
                  <Text style={[styles.slotTime, { color: palette.textPrimary }]}>{slot.startTime} - {slot.endTime}</Text>
                  <Text style={[styles.slotStatus, isAvailable ? styles.statusAvailable : styles.statusBooked]}>
                    {slot.status === "available" ? "Available" : "Booked"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookBtn, !isAvailable || isBooking ? styles.bookBtnDisabled : null]}
                  disabled={!isAvailable || isBooking}
                  onPress={() => handleBook(slot)}
                >
                  <Text style={styles.bookBtnText}>Book</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: colors.danger, fontSize: 16, textAlign: "center" },
  courtImage: { width: "100%", height: 180, borderRadius: 12, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.textPrimary, marginBottom: 8 },
  meta: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 },
  price: { fontSize: 18, color: colors.success, fontWeight: "bold", marginBottom: 4 },
  description: { fontSize: 15, color: colors.textPrimary, marginTop: 8, lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  emptyText: { color: colors.textSecondary, textAlign: "center", marginTop: 16 },
  slotCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingVertical: 12 },
  slotInfo: { flex: 1 },
  slotTime: { fontSize: 16, fontWeight: "bold", color: colors.textPrimary },
  slotStatus: { fontSize: 14, marginTop: 4 },
  statusAvailable: { color: colors.success },
  statusBooked: { color: colors.textSecondary },
  bookBtn: { backgroundColor: colors.info, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.md },
  bookBtnDisabled: { backgroundColor: "#ccc" },
  bookBtnText: { color: colors.white, fontWeight: "bold", fontSize: 16 },
});
