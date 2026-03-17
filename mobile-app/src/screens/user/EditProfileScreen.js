import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Card from "../../components/Card";
import GradientButton from "../../components/GradientButton";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";
import { normalizeImageUrl } from "../../utils/imageUrl";
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
  const { user, updateProfile, updateAvatar } = useAuth();
  const { isDarkMode } = useTheme();
  const palette = getPalette(isDarkMode);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarUri = normalizeImageUrl(user?.avatar || user?.avatarUrl || "");
  const accountRole = String(user?.role || "user").toUpperCase();

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== "web") {
        const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        let permissionResult = currentPermission;
        if (!currentPermission.granted) {
          permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }
        if (!permissionResult.granted) {
          Alert.alert("Permission required", "Please allow photo access to update your avatar.");
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) {
        return;
      }
      const selectedAsset = Array.isArray(result.assets) ? result.assets[0] : null;
      if (!selectedAsset) {
        return;
      }
      setIsUploadingAvatar(true);
      await updateAvatar(selectedAsset);
      Alert.alert("Success", "Avatar updated successfully.");
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to update avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
        address: address.trim(),
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
          <View style={styles.avatarSection}>
            <View style={[styles.avatarWrap, { borderColor: palette.border, backgroundColor: palette.inputBg }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{(name || user?.name || "U").slice(0, 1).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.avatarButton, { borderColor: palette.border, backgroundColor: palette.inputBg }]}
              onPress={() => {
                void handlePickAvatar();
              }}
              disabled={isUploadingAvatar}
            >
              <Ionicons name="camera-outline" size={16} color={colors.info} />
              <Text style={[styles.avatarButtonText, { color: palette.textPrimary }]}>
                {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
              </Text>
            </TouchableOpacity>
          </View>
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

          <Text style={[styles.label, { color: palette.textSecondary }]}>Role</Text>
          <TextInput
            value={accountRole}
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

          <Text style={[styles.label, { color: palette.textSecondary }]}>Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Your address"
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
  avatarSection: { alignItems: "center", marginBottom: 10 },
  avatarWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { fontSize: 30, fontWeight: "800", color: "#065f46" },
  avatarButton: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarButtonText: { fontWeight: "700", fontSize: 13 },
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
