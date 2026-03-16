import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BookingCard from "../../components/BookingCard";
import Card from "../../components/Card";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { getOwnerBookings, updateOwnerBookingStatus } from "../../services/ownerService";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";
import { formatVND } from "../../utils/currency";
import { normalizeImageUrl } from "../../utils/imageUrl";

function resolveBookingImage(item) {
  const images = item?.court?.images;
  if (Array.isArray(images) && images.length > 0) {
    const firstImage = String(images[0] || "").trim();
    if (firstImage) {
      return normalizeImageUrl(firstImage);
    }
  }

  const fallbackCandidates = [item?.court?.imageUrl, item?.court?.image];
  const matchedFallback = fallbackCandidates.find((value) => String(value || "").trim());
  return matchedFallback ? normalizeImageUrl(matchedFallback) : "";
}

export default function OwnerBookingsScreen({ onTabPress }) {
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const filters = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "pending", label: "Pending" },
      { key: "confirmed", label: "Confirmed" },
      { key: "completed", label: "Completed" },
      { key: "cancelled", label: "Cancelled" },
    ],
    []
  );

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const response = await getOwnerBookings({ status: selectedStatus });
      setBookings(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      Alert.alert("Load bookings failed", error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [selectedStatus]);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await updateOwnerBookingStatus(bookingId, status);
      await loadBookings();
    } catch (error) {
      Alert.alert("Update booking failed", error?.response?.data?.message || error.message);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <RoleTopBar />
      <ScreenContainer>
        <Card style={styles.filters}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedStatus(filter.key)}
              style={[
                styles.pill,
                {
                  backgroundColor: theme.mode === "dark" ? theme.inputBackground : "#f3f4f6",
                  borderColor: theme.border,
                },
                selectedStatus === filter.key ? styles.pillActive : null,
              ]}
            >
              <Text style={[styles.pillText, { color: theme.mode === "dark" ? theme.textSecondary : theme.text }, selectedStatus === filter.key ? styles.pillTextActive : null]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>

        <View style={styles.statsRow}>
          <Card style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {bookings.filter((item) => item.status === "pending" || item.status === "confirmed").length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text }]}>{bookings.filter((item) => item.status === "completed").length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {formatVND(bookings.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0))}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Revenue</Text>
          </Card>
        </View>

        {isLoading ? <ActivityIndicator size="large" color={theme.info} /> : null}
        {!isLoading &&
          bookings.map((item) => (
            <BookingCard
              key={item.id}
              title={item.player?.name || "Player"}
              subtitle={item.court?.name || "Court"}
              date={item.slot?.date || "-"}
              time={`${item.slot?.startTime || ""} - ${item.slot?.endTime || ""}`}
              amount={formatVND(item.totalPrice || 0)}
              status={item.status}
              imageUrl={resolveBookingImage(item)}
              actions={
                item.status === "pending"
                  ? [
                      { label: "Confirm", onPress: () => handleUpdateStatus(item.id, "confirmed") },
                      { label: "Cancel", type: "danger", onPress: () => handleUpdateStatus(item.id, "cancelled") },
                    ]
                  : item.status === "confirmed"
                    ? [
                        { label: "Mark Complete", onPress: () => handleUpdateStatus(item.id, "completed") },
                        { label: "Cancel", type: "danger", onPress: () => handleUpdateStatus(item.id, "cancelled") },
                      ]
                    : []
              }
            />
          ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1 },
  pillActive: { backgroundColor: colors.info },
  pillText: { fontWeight: "600" },
  pillTextActive: { color: colors.white },
  statsRow: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  statLabel: {},
});
