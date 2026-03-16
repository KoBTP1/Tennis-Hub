import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Card from "../../components/Card";
import GradientButton from "../../components/GradientButton";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";
import { getVietnamesePhoneErrorMessage, isValidVietnamesePhone, normalizePhoneNumber } from "../../utils/validation";

function getPalette(isDarkMode) {
  if (isDarkMode) {
    return {
      background: "#0f172a",
      card: "#111827",
      border: "#1e293b",
      textPrimary: "#E5E5E5",
      textSecondary: "#94a3b8",
      inputBg: "#0b1220",
    };
  }

  return {
    background: colors.background,
    card: colors.white,
    border: colors.border,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    inputBg: colors.white,
  };
}

export default function EditProfileScreen({ onBack }) {
  const { user, updateProfile } = useAuth();
  const { isDarkMode } = useTheme();
  const palette = getPalette(isDarkMode);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name is required.");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidVietnamesePhone(normalizedPhone)) {
      Alert.alert("Validation", getVietnamesePhoneErrorMessage());
      return;
    }

    const isPasswordChangeRequested = Boolean(currentPassword || newPassword || confirmNewPassword);
    if (isPasswordChangeRequested) {
      if (!currentPassword.trim()) {
        Alert.alert("Validation", "Current password is required.");
        return;
      }
      if (newPassword.trim().length < 6) {
        Alert.alert("Validation", "New password must be at least 6 characters.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        Alert.alert("Validation", "Confirm password does not match new password.");
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        phone: normalizedPhone,
      };

      if (isPasswordChangeRequested) {
        payload.currentPassword = currentPassword.trim();
        payload.newPassword = newPassword.trim();
      }

      await updateProfile(payload);
      Alert.alert("Success", "Profile updated successfully.", [{ text: "OK", onPress: onBack }]);
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <RoleTopBar onBack={onBack} />
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer backgroundColor={palette.background}>
          <Card style={[styles.card, { backgroundColor: palette.card }]}>
          <Text style={[styles.label, { color: palette.textSecondary }]}>Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor={palette.textSecondary}
            style={[
              styles.input,
              {
                color: palette.textPrimary,
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.textSecondary }]}>Email</Text>
          <TextInput
            value={user?.email || ""}
            editable={false}
            placeholderTextColor={palette.textSecondary}
            style={[
              styles.input,
              styles.disabledInput,
              {
                color: palette.textSecondary,
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.textSecondary }]}>Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={palette.textSecondary}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                color: palette.textPrimary,
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
              },
            ]}
          />

          <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Change Password (Optional)</Text>

          <Text style={[styles.label, { color: palette.textSecondary }]}>Current Password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={palette.textSecondary}
            secureTextEntry
            style={[
              styles.input,
              {
                color: palette.textPrimary,
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.textSecondary }]}>New Password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={palette.textSecondary}
            secureTextEntry
            style={[
              styles.input,
              {
                color: palette.textPrimary,
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.textSecondary }]}>Confirm New Password</Text>
          <TextInput
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            placeholder="Confirm new password"
            placeholderTextColor={palette.textSecondary}
            secureTextEntry
            style={[
              styles.input,
              {
                color: palette.textPrimary,
                borderColor: palette.border,
                backgroundColor: palette.inputBg,
              },
            ]}
          />
          </Card>

          <GradientButton
            label={isSaving ? "Saving..." : "Save Changes"}
            onPress={handleSave}
            style={styles.saveBtn}
            textStyle={styles.saveText}
          />
        </ScreenContainer>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  keyboardAvoiding: { flex: 1 },
  card: { paddingVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 4, marginBottom: 8 },
  label: { fontSize: 14, marginTop: 2, marginBottom: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  disabledInput: { opacity: 0.8 },
  saveBtn: { marginTop: 4 },
  saveText: { color: colors.white },
});
