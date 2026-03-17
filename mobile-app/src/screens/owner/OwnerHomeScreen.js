import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import Card from "../../components/Card";
import CourtCard from "../../components/CourtCard";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { getOwnerCourts } from "../../services/ownerService";
import { API_BASE_URL } from "../../config/api";
import { colors } from "../../styles/theme";
import { formatVNDPerHour } from "../../utils/currency";
import { useLanguage } from "../../context/LanguageContext";

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

export default function OwnerHomeScreen({ onOpenCourt, onNavigate, favoriteOverrides = {}, onFavoriteStateChange }) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [courtCards, setCourtCards] = useState([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const courtResponse = await getOwnerCourts({ status: "approved" });
      const courtList = Array.isArray(courtResponse?.data) ? courtResponse.data : [];
      const normalizedCards = courtList.map((court) => ({
        key: String(court.id || court._id || court.name),
        courtId: court.id || court._id,
        name: court.name,
        location:
          language === "en"
            ? court.locationEn || court.locationVi || court.location
            : court.locationVi || court.location || court.locationEn,
        mapUrl: court.mapUrl,
        pricePerHour: court.pricePerHour || 0,
        images: Array.isArray(court.images) ? court.images : [],
      }));
      setCourtCards(normalizedCards);
    } catch (error) {
      Alert.alert("Load owner home failed", error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <RoleTopBar onAvatarPress={() => onNavigate?.("edit-profile")} />
      <ScreenContainer>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("courts")}</Text>
        {isLoading ? <ActivityIndicator size="large" color={theme.info} /> : null}
        {!isLoading && courtCards.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t("noCourtsYet")}</Text>
          </Card>
        ) : null}

        {!isLoading &&
          courtCards.map((item) => {
            const favoriteKey = String(item.courtId || "");
            const hasOverride = Object.hasOwn(favoriteOverrides, favoriteKey);
            const isFavorite = hasOverride ? Boolean(favoriteOverrides[favoriteKey]) : false;
            return (
              <CourtCard
              key={item.key}
              name={item.name}
              location={item.location}
              mapUrl={item.mapUrl}
              price={formatVNDPerHour(item.pricePerHour)}
              imageUrl={normalizeImageUrl(Array.isArray(item.images) ? item.images[0] : "")}
              imageUrls={Array.isArray(item.images) ? item.images.map((imageUrl) => normalizeImageUrl(imageUrl)) : []}
              isFavorite={isFavorite}
              onToggleFavorite={() => onFavoriteStateChange?.(favoriteKey, !isFavorite)}
              showPrimaryAction={false}
              onPress={() => onOpenCourt?.(item.courtId)}
              />
            );
          })}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 4 },
  emptyText: { fontSize: 14 },
});
