import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Card from "../../components/Card";
import CourtCard from "../../components/CourtCard";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getAdminCourts, updateAdminCourtStatus } from "../../services/adminService";
import { colors, radius } from "../../styles/theme";
import { formatVNDPerHour } from "../../utils/currency";

const DEFAULT_STATS = {
  totalCourts: 0,
  byStatus: { pending: 0, approved: 0, suspended: 0, rejected: 0 },
};

function normalizeImageUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("file://")) {
    return raw;
  }
  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  if (raw.startsWith("/")) {
    return `${apiOrigin}${raw}`;
  }
  return `${apiOrigin}/${raw}`;
}

export default function AdminCourtsScreen({ onNavigate, onOpenCourt }) {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [courts, setCourts] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [totalCourts, setTotalCourts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const loadCourts = useCallback(
    async (keywordOverride = "") => {
      if (!token) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await getAdminCourts({
          token,
          keyword: keywordOverride,
          status: selectedStatus,
          page: 1,
          limit: 50,
        });
        setCourts(response.data || []);
        setStats(response.stats || DEFAULT_STATS);
        setTotalCourts(response.pagination?.total || 0);
      } catch (error) {
        Alert.alert("Load courts failed", error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [token, selectedStatus]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourts(keyword.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, loadCourts]);

  const filters = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "approved", label: "Approved" },
      { key: "pending", label: "Pending" },
      { key: "suspended", label: "Suspended" },
      { key: "rejected", label: "Rejected" },
    ],
    []
  );

  const handleUpdateStatus = async (court, status) => {
    if (!token || isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);
      await updateAdminCourtStatus({
        token,
        courtId: court.mongoId || court.id,
        status,
      });
      await loadCourts(keyword.trim());
      Alert.alert("Success", `Court ${court.name} is now ${status}.`);
    } catch (error) {
      Alert.alert("Update failed", error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getBadge = (status) => {
    if (!status) {
      return "Pending";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <RoleTopBar />
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer>
          <Card style={styles.searchCard}>
            <TextInput
              placeholder="Search courts by name, location or owner..."
              placeholderTextColor="#9ca3af"
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                },
              ]}
              value={keyword}
              onChangeText={setKeyword}
            />
          </Card>

        <View style={styles.filters}>
          {filters.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.pill,
                {
                  backgroundColor: theme.mode === "dark" ? theme.inputBackground : colors.white,
                  borderColor: theme.border,
                },
                selectedStatus === item.key ? styles.pillActive : null,
              ]}
              onPress={() => setSelectedStatus(item.key)}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: theme.mode === "dark" ? colors.white : colors.textPrimary },
                  selectedStatus === item.key ? styles.pillTextActive : null,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCourts || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.mode === "dark" ? colors.white : colors.textSecondary }]}>Total Courts</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.byStatus.approved || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.mode === "dark" ? colors.white : colors.textSecondary }]}>Approved</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.byStatus.pending || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.mode === "dark" ? colors.white : colors.textSecondary }]}>Pending</Text>
          </Card>
        </View>

        <Text style={[styles.count, { color: theme.mode === "dark" ? colors.white : colors.textSecondary }]}>{totalCourts} courts found</Text>
        {isLoading ? <ActivityIndicator size="large" color={colors.info} style={styles.loader} /> : null}
        {!isLoading && courts.length === 0 ? <Text style={[styles.empty, { color: theme.mode === "dark" ? colors.white : colors.textSecondary }]}>No courts found.</Text> : null}
          {!isLoading &&
            courts.map((court) => (
              <CourtCard
                key={court.id}
                name={court.name}
                location={court.location}
                mapUrl={court.mapUrl}
                price={formatVNDPerHour(court.pricePerHour)}
                imageUrls={Array.isArray(court.images) ? court.images.map((item) => normalizeImageUrl(item)) : []}
                imageUrl={normalizeImageUrl(Array.isArray(court.images) ? court.images[0] || "" : "")}
                rating={court.rating ? court.rating.toFixed(1) : "-"}
                reviews={court.reviewsCount || 0}
                badge={getBadge(court.status)}
                primaryActionLabel="XEM CHI TIẾT"
                onPrimaryAction={() => onOpenCourt?.(court.mongoId || court.id)}
                onPress={() => onOpenCourt?.(court.mongoId || court.id)}
                actions={[
                  {
                    label: "Approve",
                    disabled: court.status === "approved",
                    onPress: () => handleUpdateStatus(court, "approved"),
                  },
                  {
                    label: "Suspend",
                    type: "danger",
                    disabled: court.status === "suspended",
                    onPress: () => handleUpdateStatus(court, "suspended"),
                  },
                  {
                    label: "Reject",
                    type: "danger",
                    disabled: court.status === "rejected",
                    onPress: () => handleUpdateStatus(court, "rejected"),
                  },
                ]}
              />
            ))}
        </ScreenContainer>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  searchCard: { paddingVertical: 6 },
  searchInput: { minHeight: 40, fontSize: 16 },
  filters: { flexDirection: "row", gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  pillActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  pillText: { fontWeight: "600", color: colors.textPrimary },
  pillTextActive: { color: colors.white },
  statRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 30, fontWeight: "800", color: colors.info },
  statLabel: { color: colors.textSecondary },
  count: { color: colors.textSecondary, marginTop: 4 },
  loader: { marginTop: 12 },
  empty: { color: colors.textSecondary, fontStyle: "italic", marginTop: 6 },
});
