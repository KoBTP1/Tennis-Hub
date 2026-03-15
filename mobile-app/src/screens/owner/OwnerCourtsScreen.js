import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import AppHeader from "../../components/AppHeader";
import CourtCard from "../../components/CourtCard";
import GradientButton from "../../components/GradientButton";
import Card from "../../components/Card";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { createOwnerCourt, deleteOwnerCourt, getOwnerCourts, updateOwnerCourt } from "../../services/ownerService";
import { colors, radius } from "../../styles/theme";

export default function OwnerCourtsScreen({ onTabPress }) {
  const { theme } = useTheme();
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const resetForm = () => {
    setEditingCourtId(null);
    setName("");
    setLocation("");
    setPricePerHour("");
    setDescription("");
    setImageUrl("");
  };

  const loadCourts = async () => {
    try {
      setIsLoading(true);
      const response = await getOwnerCourts();
      setCourts(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      Alert.alert("Load courts failed", error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
  }, []);

  const handleSaveCourt = async () => {
    if (!name.trim() || !location.trim() || !pricePerHour.trim()) {
      Alert.alert("Validation", "Please enter name, location and price.");
      return;
    }

    const parsedPrice = Number(pricePerHour);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      Alert.alert("Validation", "Price per hour must be a valid number >= 0.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        location: location.trim(),
        pricePerHour: parsedPrice,
        description: description.trim(),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
      };
      if (editingCourtId) {
        await updateOwnerCourt(editingCourtId, payload);
      } else {
        await createOwnerCourt(payload);
      }
      resetForm();
      await loadCourts();
    } catch (error) {
      Alert.alert("Save court failed", error?.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCourt = (court) => {
    setEditingCourtId(court.id);
    setName(court.name || "");
    setLocation(court.location || "");
    setPricePerHour(String(court.pricePerHour || ""));
    setDescription(court.description || "");
    setImageUrl(Array.isArray(court.images) ? court.images[0] || "" : "");
  };

  const handleDeleteCourt = (courtId) => {
    const performDelete = async () => {
      try {
        await deleteOwnerCourt(courtId);
        await loadCourts();
      } catch (error) {
        Alert.alert("Delete court failed", error?.response?.data?.message || error.message);
      }
    };

    if (Platform.OS === "web") {
      const accepted = globalThis.confirm?.("Are you sure you want to delete this court?");
      if (accepted) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete Court", "Are you sure you want to delete this court?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: performDelete,
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader title="Manage Courts" leftText="‹" onLeftPress={() => onTabPress?.("Home")} />
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer>
          <Card>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderLeft}>
                <Text style={[styles.formHeaderText, { color: theme.text }]}>{editingCourtId ? "Editing court" : "Create new court"}</Text>
              </View>
            </View>
            <TextInput
              placeholder="Court name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Location"
              placeholderTextColor="#9ca3af"
              value={location}
              onChangeText={setLocation}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Price per hour"
              placeholderTextColor="#9ca3af"
              value={pricePerHour}
              keyboardType="numeric"
              onChangeText={setPricePerHour}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              style={[styles.input, styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <TextInput
              placeholder="Image URL (optional)"
              placeholderTextColor="#9ca3af"
              value={imageUrl}
              onChangeText={setImageUrl}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            <GradientButton
              label={isSaving ? "Saving..." : editingCourtId ? "Update Court" : "Add New Court"}
              onPress={handleSaveCourt}
            />
            {editingCourtId ? <GradientButton label="Cancel Edit" onPress={resetForm} style={styles.secondaryButton} /> : null}
          </Card>

          {isLoading ? <ActivityIndicator size="large" color={theme.info} /> : null}
          {!isLoading &&
            courts.map((court) => (
              <CourtCard
                key={court.id}
                name={court.name}
                location={court.location}
                price={`$${court.pricePerHour}/hour`}
                badge={court.status}
                imageUrl={
                  (Array.isArray(court.images) && court.images[0]) ||
                  court.imageUrl ||
                  court.image ||
                  ""
                }
                actions={[
                  { label: "Edit", onPress: () => handleEditCourt(court) },
                  { label: "Delete", type: "danger", onPress: () => handleDeleteCourt(court.id) },
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
  formHeader: { marginBottom: 8 },
  formHeaderLeft: { alignSelf: "flex-start", borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#e2e8f0" },
  formHeaderText: { fontSize: 12, fontWeight: "700", padding: 0 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 15,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  secondaryButton: { marginTop: 8, opacity: 0.7 },
});
