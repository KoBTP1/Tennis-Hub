import React, { useEffect, useMemo, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import CourtCard from "../../components/CourtCard";
import GradientButton from "../../components/GradientButton";
import Card from "../../components/Card";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { useTheme } from "../../context/ThemeContext";
import { createOwnerCourt, deleteOwnerCourt, getOwnerCourts, updateOwnerCourt, uploadOwnerCourtImage } from "../../services/ownerService";
import { colors, radius } from "../../styles/theme";
import { formatVNDPerHour } from "../../utils/currency";

export default function OwnerCourtsScreen({ onOpenCourt, embedded = false }) {
  const { theme } = useTheme();
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState(null);
  const [name, setName] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [activeSelector, setActiveSelector] = useState(null);
  const [pendingProvinceName, setPendingProvinceName] = useState("");
  const [pendingDistrictName, setPendingDistrictName] = useState("");
  const [pendingWardName, setPendingWardName] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSuggestingAddress, setIsSuggestingAddress] = useState(false);
  const [previewCoordinates, setPreviewCoordinates] = useState(null);
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const [draftCoordinates, setDraftCoordinates] = useState(null);
  const [isResolvingPinnedAddress, setIsResolvingPinnedAddress] = useState(false);

  const resetForm = () => {
    setEditingCourtId(null);
    setName("");
    setAddressDetail("");
    setPricePerHour("");
    setDescription("");
    setImageUrls([]);
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setPendingProvinceName("");
    setPendingDistrictName("");
    setPendingWardName("");
    setAddressSuggestions([]);
    setPreviewCoordinates(null);
  };

  const isSameName = (left, right) => String(left || "").localeCompare(String(right || ""), "vi", { sensitivity: "base" }) === 0;

  const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Unable to load address data.");
    }
    return response.json();
  };

  const loadProvinces = async () => {
    try {
      setIsAddressLoading(true);
      const data = await fetchJson("https://provinces.open-api.vn/api/p/");
      const items = Array.isArray(data) ? data.map((item) => ({ code: item.code, name: item.name })) : [];
      setProvinces(items);
    } catch {
      setProvinces([]);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const loadDistricts = async (provinceCode) => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }
    try {
      setIsAddressLoading(true);
      const data = await fetchJson(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
      const items = Array.isArray(data?.districts) ? data.districts.map((item) => ({ code: item.code, name: item.name })) : [];
      setDistricts(items);
    } catch {
      setDistricts([]);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const loadWards = async (districtCode) => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    try {
      setIsAddressLoading(true);
      const data = await fetchJson(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const items = Array.isArray(data?.wards) ? data.wards.map((item) => ({ code: item.code, name: item.name })) : [];
      setWards(items);
    } catch {
      setWards([]);
    } finally {
      setIsAddressLoading(false);
    }
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
    loadProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince?.code) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      return;
    }
    loadDistricts(selectedProvince.code);
  }, [selectedProvince?.code]);

  useEffect(() => {
    if (!selectedDistrict?.code) {
      setWards([]);
      setSelectedWard(null);
      return;
    }
    loadWards(selectedDistrict.code);
  }, [selectedDistrict?.code]);

  useEffect(() => {
    if (!pendingProvinceName || provinces.length === 0) {
      return;
    }
    const matched = provinces.find((item) => isSameName(item.name, pendingProvinceName));
    if (matched) {
      setSelectedProvince(matched);
      setPendingProvinceName("");
    }
  }, [pendingProvinceName, provinces]);

  useEffect(() => {
    if (!pendingDistrictName || districts.length === 0) {
      return;
    }
    const matched = districts.find((item) => isSameName(item.name, pendingDistrictName));
    if (matched) {
      setSelectedDistrict(matched);
      setPendingDistrictName("");
    }
  }, [pendingDistrictName, districts]);

  useEffect(() => {
    if (!pendingWardName || wards.length === 0) {
      return;
    }
    const matched = wards.find((item) => isSameName(item.name, pendingWardName));
    if (matched) {
      setSelectedWard(matched);
      setPendingWardName("");
    }
  }, [pendingWardName, wards]);

  useEffect(() => {
    const keyword = [addressDetail.trim(), selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(", ");
    if (addressDetail.trim().length < 2 || !keyword) {
      setAddressSuggestions([]);
      setPreviewCoordinates(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSuggestingAddress(true);
        const data = await fetchJson(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(keyword)}`
        );
        const items = Array.isArray(data)
          ? data
              .map((item) => ({
                displayName: String(item?.display_name || "").trim(),
                lat: Number(item?.lat),
                lon: Number(item?.lon),
              }))
              .filter((item) => item.displayName)
          : [];
        setAddressSuggestions(items);
        if (items[0] && Number.isFinite(items[0].lat) && Number.isFinite(items[0].lon)) {
          setPreviewCoordinates({ lat: items[0].lat, lon: items[0].lon });
        } else {
          setPreviewCoordinates(null);
        }
      } catch {
        setAddressSuggestions([]);
        setPreviewCoordinates(null);
      } finally {
        setIsSuggestingAddress(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [addressDetail, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]);

  const handleSaveCourt = async () => {
    if (!name.trim() || !addressDetail.trim() || !pricePerHour.trim()) {
      Alert.alert("Validation", "Please enter name, address and price.");
      return;
    }
    if (isUploadingImage) {
      Alert.alert("Image upload", "Image is still uploading. Please wait a moment.");
      return;
    }

    const parsedPrice = Number(pricePerHour);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      Alert.alert("Validation", "Price per hour must be a valid number >= 0.");
      return;
    }

    try {
      setIsSaving(true);
      const composedLocation = [
        addressDetail.trim(),
        selectedWard?.name || "",
        selectedDistrict?.name || "",
        selectedProvince?.name || "",
      ]
        .filter(Boolean)
        .join(", ");
      const payload = {
        name: name.trim(),
        location: composedLocation,
        pricePerHour: parsedPrice,
        description: description.trim(),
        mapUrl: getGoogleMapsSearchUrl(composedLocation, previewCoordinates),
        images: imageUrls,
      };
      if (editingCourtId) {
        await updateOwnerCourt(editingCourtId, payload);
      } else {
        await createOwnerCourt(payload);
      }
      resetForm();
      await loadCourts();
      Alert.alert("Success", editingCourtId ? "Court updated successfully." : "Add new court successfully.");
    } catch (error) {
      Alert.alert("Save court failed", error?.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCourt = (court) => {
    setEditingCourtId(court.id);
    setName(court.name || "");
    const rawLocation = String(court.location || "").trim();
    const parts = rawLocation.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 4) {
      setAddressDetail(parts.slice(0, -3).join(", "));
      setPendingWardName(parts.at(-3) || "");
      setPendingDistrictName(parts.at(-2) || "");
      setPendingProvinceName(parts.at(-1) || "");
    } else {
      setAddressDetail(rawLocation);
      setPendingWardName("");
      setPendingDistrictName("");
      setPendingProvinceName("");
    }
    setPricePerHour(String(court.pricePerHour || ""));
    setDescription(court.description || "");
    setImageUrls(Array.isArray(court.images) ? court.images.map((item) => String(item || "").trim()).filter(Boolean) : []);
  };

  const getGoogleMapsSearchUrl = (queryText, coordinates = null) => {
    if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lon)) {
      return `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lon}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(queryText || "").trim())}`;
  };
  const reverseGeocodeCoordinates = async ({ lat, lon }) => {
    const data = await fetchJson(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    );
    const address = data?.address || {};
    const detail =
      address.house_number && address.road
        ? `${address.house_number} ${address.road}`
        : address.road || address.neighbourhood || address.suburb || address.city_district || data?.name || "";
    return String(detail || "").trim();
  };
  const getOsmEmbedUrl = (queryText, coordinates = null) => {
    if (coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lon)) {
      return `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${coordinates.lat},${coordinates.lon}`;
    }
    return `https://www.openstreetmap.org/export/embed.html?layer=mapnik&query=${encodeURIComponent(String(queryText || "").trim())}`;
  };
  const fullAddress = useMemo(
    () => [addressDetail.trim(), selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(", "),
    [addressDetail, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]
  );
  const embeddedMapUrl = useMemo(() => getOsmEmbedUrl(fullAddress, previewCoordinates), [fullAddress, previewCoordinates]);
  const initialPickerLat = Number.isFinite(previewCoordinates?.lat) ? previewCoordinates.lat : 21.028511;
  const initialPickerLon = Number.isFinite(previewCoordinates?.lon) ? previewCoordinates.lon : 105.804817;
  const mapPickerHtml = useMemo(
    () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
      .hint {
        position: absolute; top: 10px; left: 10px; z-index: 1000;
        background: rgba(17,24,39,0.85); color: #fff; padding: 8px 10px; border-radius: 8px;
        font-family: sans-serif; font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div class="hint">Tap map to place pin</div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const map = L.map('map').setView([${initialPickerLat}, ${initialPickerLon}], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '' }).addTo(map);
      let marker = L.marker([${initialPickerLat}, ${initialPickerLon}], { draggable: true }).addTo(map);
      function sendPicked(lat, lon) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'picked', lat, lon }));
      }
      sendPicked(${initialPickerLat}, ${initialPickerLon});
      map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        sendPicked(lat, lng);
      });
      marker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        sendPicked(pos.lat, pos.lng);
      });
    </script>
  </body>
</html>`,
    [initialPickerLat, initialPickerLon]
  );

  const handleOpenMap = async (targetCourt) => {
    const directUrl = String(targetCourt?.mapUrl || "").trim();
    const fallbackUrl = getGoogleMapsSearchUrl(targetCourt?.location || targetCourt?.name);
    const url = directUrl || fallbackUrl;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Map", "Cannot open this map link.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Map", "Cannot open this map link.");
    }
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
        onPress: () => {
          void performDelete();
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const currentPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
        let permissionResult = currentPermission;
        if (!currentPermission.granted) {
          permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        }

        if (!permissionResult.granted) {
          Alert.alert("Permission required", "Please allow photo access to pick an image.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ]);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const pickedAssets = Array.isArray(result.assets) ? result.assets : [];
      if (pickedAssets.length === 0) {
        Alert.alert("Image picker", "Could not read selected image.");
        return;
      }
      const remainingSlots = Math.max(0, 8 - imageUrls.length);
      if (remainingSlots === 0) {
        Alert.alert("Image limit", "You can upload up to 8 images per court.");
        return;
      }
      const selectedAssets = pickedAssets.slice(0, remainingSlots);
      if (selectedAssets.length < pickedAssets.length) {
        Alert.alert("Image limit", "Only the first selected images were added (max 8 per court).");
      }

      setIsUploadingImage(true);
      const uploadedUrls = [];
      for (const asset of selectedAssets) {
        const uploaded = await uploadOwnerCourtImage(asset);
        const uploadedUrl = String(uploaded?.data?.url || "").trim();
        if (!uploadedUrl) {
          throw new Error("Upload succeeded but image URL is missing.");
        }
        uploadedUrls.push(uploadedUrl);
      }
      setImageUrls((prev) => {
        const merged = [...prev, ...uploadedUrls];
        return [...new Set(merged)];
      });
    } catch (error) {
      Alert.alert("Image picker failed", error?.message || "Unable to open image picker.");
    } finally {
      setIsUploadingImage(false);
    }
  };
  const handleRemoveImage = (targetUrl) => {
    setImageUrls((prev) => prev.filter((url) => url !== targetUrl));
  };
  let submitButtonLabel = "Add New Court";
  if (isSaving) {
    submitButtonLabel = "Saving...";
  } else if (editingCourtId) {
    submitButtonLabel = "Update Court";
  }
  let selectorTitle = "Select ward";
  let selectorItems = wards;
  if (activeSelector === "province") {
    selectorTitle = "Select province/city";
    selectorItems = provinces;
  } else if (activeSelector === "district") {
    selectorTitle = "Select district";
    selectorItems = districts;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {embedded ? null : <RoleTopBar />}
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer>
          <Card>
            <View style={styles.formHeader}>
              <View style={[styles.formHeaderLeft, { backgroundColor: theme.mode === "dark" ? theme.infoSoft : "#e2e8f0" }]}>
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
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => setActiveSelector("province")}
            >
              <Text style={{ color: selectedProvince?.name ? theme.text : "#9ca3af" }}>
                {selectedProvince?.name || "Province / City"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => setActiveSelector("district")}
            >
              <Text style={{ color: selectedDistrict?.name ? theme.text : "#9ca3af" }}>
                {selectedDistrict?.name || "District"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => setActiveSelector("ward")}
            >
              <Text style={{ color: selectedWard?.name ? theme.text : "#9ca3af" }}>
                {selectedWard?.name || "Ward"}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TextInput
              placeholder="Specific address"
              placeholderTextColor="#9ca3af"
              value={addressDetail}
              onChangeText={setAddressDetail}
              autoCapitalize="sentences"
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            />
            {isSuggestingAddress ? <ActivityIndicator size="small" color={theme.info} style={styles.suggestionLoading} /> : null}
            {addressSuggestions.length > 0 ? (
              <View style={[styles.suggestionBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
                {addressSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.displayName}
                    style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      const firstSegment = item.displayName.split(",")[0]?.trim() || item.displayName;
                      setAddressDetail(firstSegment);
                      setAddressSuggestions([]);
                      if (Number.isFinite(item.lat) && Number.isFinite(item.lon)) {
                        setPreviewCoordinates({ lat: item.lat, lon: item.lon });
                      }
                    }}
                  >
                    <Text style={{ color: theme.textSecondary }} numberOfLines={2}>
                      {item.displayName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {fullAddress ? (
              <View style={[styles.mapPreviewWrap, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                {Platform.OS === "web" ? (
                  <Text style={[styles.mapPreviewText, { color: theme.textSecondary }]}>
                    Map preview is available on mobile app.
                  </Text>
                ) : (
                  <WebView source={{ uri: embeddedMapUrl }} style={styles.mapWebView} />
                )}
                <TouchableOpacity
                  style={[styles.mapPickButton, { borderTopColor: theme.border }]}
                  onPress={() => {
                    setDraftCoordinates(previewCoordinates);
                    setIsMapPickerVisible(true);
                  }}
                >
                  <Ionicons name="pin-outline" size={16} color={theme.info} />
                  <Text style={[styles.mapPickButtonText, { color: theme.text }]}>Pick location on map</Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
            <View style={[styles.imageBox, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
              {imageUrls.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScrollContent}>
                  {imageUrls.map((url) => (
                    <View key={url} style={styles.imageThumbWrap}>
                      <Image source={{ uri: url }} style={styles.previewImage} resizeMode="cover" />
                      <TouchableOpacity onPress={() => handleRemoveImage(url)} style={[styles.clearIconButton, { backgroundColor: theme.card }]}>
                        <Ionicons name="close" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyImageState}>
                  <Text style={[styles.emptyImageText, { color: theme.textSecondary }]}>No image selected</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handlePickImage}
              style={[styles.imagePickerButton, { borderColor: theme.border, backgroundColor: theme.card }]}
              disabled={isUploadingImage}
            >
              <Ionicons name="images-outline" size={18} color={theme.info} />
              <Text style={[styles.imagePickerText, { color: theme.text }]}>
                {isUploadingImage ? "Uploading..." : "Pick image(s)"}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.imageHint, { color: theme.textSecondary }]}>
              {isUploadingImage
                ? "Uploading selected image(s) to server..."
                : "You can select multiple images. These URLs are shared for both web and mobile."}
            </Text>
            <GradientButton
              label={submitButtonLabel}
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
                mapUrl={court.mapUrl}
                price={formatVNDPerHour(court.pricePerHour)}
                imageUrls={Array.isArray(court.images) ? court.images : []}
                imageUrl={
                  (Array.isArray(court.images) && court.images[0]) ||
                  court.imageUrl ||
                  court.image ||
                  ""
                }
                primaryActionLabel="XEM CHI TIẾT"
                onPrimaryAction={() => onOpenCourt?.(court.id)}
                onPress={() => onOpenCourt?.(court.id)}
                actions={[
                  { label: "Map", onPress: () => handleOpenMap(court) },
                  { label: "Edit", onPress: () => handleEditCourt(court) },
                  { label: "Delete", type: "danger", onPress: () => handleDeleteCourt(court.id) },
                ]}
              />
            ))}
        </ScreenContainer>
      </KeyboardAvoidingView>
      <Modal visible={isMapPickerVisible} transparent animationType="fade" onRequestClose={() => setIsMapPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.mapPickerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select pinned location</Text>
              <TouchableOpacity onPress={() => setIsMapPickerVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: mapPickerHtml }}
              style={styles.mapPickerWebView}
              onMessage={(event) => {
                try {
                  const payload = JSON.parse(String(event?.nativeEvent?.data || "{}"));
                  if (payload?.type === "picked" && Number.isFinite(payload?.lat) && Number.isFinite(payload?.lon)) {
                    setDraftCoordinates({ lat: payload.lat, lon: payload.lon });
                  }
                } catch {
                  // ignore malformed bridge messages
                }
              }}
            />
            <View style={styles.mapPickerFooter}>
              <TouchableOpacity style={styles.mapPickerCancel} onPress={() => setIsMapPickerVisible(false)}>
                <Text style={[styles.mapPickerCancelText, { color: theme.textSecondary }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapPickerConfirm, { backgroundColor: theme.info }]}
                onPress={async () => {
                  if (!draftCoordinates || !Number.isFinite(draftCoordinates.lat) || !Number.isFinite(draftCoordinates.lon)) {
                    setIsMapPickerVisible(false);
                    return;
                  }
                  setIsResolvingPinnedAddress(true);
                  try {
                    setPreviewCoordinates(draftCoordinates);
                    const resolvedDetail = await reverseGeocodeCoordinates(draftCoordinates);
                    if (resolvedDetail) {
                      setAddressDetail(resolvedDetail);
                    }
                  } catch {
                    // Keep existing address detail if reverse geocode fails.
                  } finally {
                    setIsResolvingPinnedAddress(false);
                    setIsMapPickerVisible(false);
                  }
                }}
                disabled={isResolvingPinnedAddress}
              >
                <Text style={styles.mapPickerConfirmText}>{isResolvingPinnedAddress ? "Confirming..." : "Confirm"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(activeSelector)} transparent animationType="fade" onRequestClose={() => setActiveSelector(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{selectorTitle}</Text>
              <TouchableOpacity onPress={() => setActiveSelector(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {isAddressLoading ? <ActivityIndicator size="small" color={theme.info} /> : null}
            <ScrollView style={styles.modalList}>
              {selectorItems.map((item) => (
                <TouchableOpacity
                  key={String(item.code)}
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    if (activeSelector === "province") {
                      setSelectedProvince(item);
                      setSelectedDistrict(null);
                      setSelectedWard(null);
                    } else if (activeSelector === "district") {
                      setSelectedDistrict(item);
                      setSelectedWard(null);
                    } else {
                      setSelectedWard(item);
                    }
                    setActiveSelector(null);
                  }}
                >
                  <Text style={{ color: theme.text }}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  selectInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  suggestionLoading: { marginTop: -4, marginBottom: 8 },
  suggestionBox: { borderWidth: 1, borderRadius: 10, marginBottom: 10, overflow: "hidden" },
  suggestionItem: { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  mapPreviewWrap: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  mapWebView: { width: "100%", height: 190, backgroundColor: "#e5e7eb" },
  mapPreviewButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mapPreviewText: { fontWeight: "600" },
  mapPickButton: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mapPickButtonText: { fontWeight: "700" },
  mapPickerCard: {
    width: "100%",
    maxWidth: 720,
    height: "78%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  mapPickerWebView: { width: "100%", flex: 1, borderRadius: 10, overflow: "hidden" },
  mapPickerFooter: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 10 },
  mapPickerCancel: { paddingHorizontal: 8, paddingVertical: 8 },
  mapPickerCancelText: { fontWeight: "600" },
  mapPickerConfirm: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  mapPickerConfirmText: { color: colors.white, fontWeight: "700" },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  imageBox: {
    width: "100%",
    minHeight: 150,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
    padding: 8,
  },
  imageScrollContent: { gap: 10, paddingRight: 4 },
  imageThumbWrap: {
    width: 160,
    height: 130,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  emptyImageState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyImageText: { fontSize: 13 },
  imageHint: { marginBottom: 10, fontSize: 12, marginTop: 6 },
  previewImage: { width: "100%", height: "100%", borderRadius: 10 },
  imagePickerButton: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePickerText: { fontSize: 14, fontWeight: "700" },
  clearIconButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalList: { maxHeight: 360 },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1 },
  secondaryButton: { marginTop: 8, opacity: 0.7 },
});
