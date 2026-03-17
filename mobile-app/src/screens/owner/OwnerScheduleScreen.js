import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "../../components/Card";
import GradientButton from "../../components/GradientButton";
import RoleTopBar from "../../components/RoleTopBar";
import ScreenContainer from "../../components/ScreenContainer";
import { createOwnerSlot, deleteOwnerSlot, getOwnerCourts, getOwnerSlots, updateOwnerSlot } from "../../services/ownerService";
import { useTheme } from "../../context/ThemeContext";
import { colors, radius } from "../../styles/theme";

function isValidTimeFormat(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || "").trim());
}

function toMinutes(value) {
  const [hour, minute] = String(value || "")
    .split(":")
    .map((item) => Number(item));
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return hour * 60 + minute;
}

export default function OwnerScheduleScreen({ onNavigate, embedded = false }) {
  const { theme } = useTheme();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = 5; hour <= 23; hour += 1) {
      for (let minute = 0; minute < 60; minute += 30) {
        const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        options.push({ label: value, value });
      }
    }
    return options;
  }, []);

  const [courts, setCourts] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const selectedDate = today;
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingSlotId, setEditingSlotId] = useState("");
  const [isStartPickerVisible, setIsStartPickerVisible] = useState(false);
  const [isEndPickerVisible, setIsEndPickerVisible] = useState(false);
  const existingRanges = useMemo(() => {
    return slots
      .filter((slot) => slot.id !== editingSlotId)
      .map((slot) => ({
        start: toMinutes(slot.startTime),
        end: toMinutes(slot.endTime),
      }))
      .filter((slot) => slot.start !== null && slot.end !== null);
  }, [slots, editingSlotId]);
  const startTimeOptions = useMemo(() => {
    return timeOptions.map((item) => {
      const minute = toMinutes(item.value);
      const isOccupied = existingRanges.some((range) => minute >= range.start && minute < range.end);
      return { ...item, disabled: isOccupied };
    });
  }, [timeOptions, existingRanges]);
  const endTimeOptions = useMemo(() => {
    if (!startTime) {
      return timeOptions.map((item) => ({ ...item, disabled: true }));
    }

    const startMinute = toMinutes(startTime);
    return timeOptions
      .filter((item) => item.value !== startTime)
      .map((item) => {
        const endMinute = toMinutes(item.value);
        const invalidOrder = endMinute <= startMinute;
        const hasOverlap =
          !invalidOrder && existingRanges.some((range) => startMinute < range.end && range.start < endMinute);
        return { ...item, disabled: invalidOrder || hasOverlap };
      });
  }, [timeOptions, startTime, existingRanges]);

  const loadCourts = async () => {
    try {
      const response = await getOwnerCourts();
      const list = Array.isArray(response?.data) ? response.data : [];
      setCourts(list);
      if (list.length && !selectedCourtId) {
        setSelectedCourtId(list[0].id);
      }
    } catch (error) {
      Alert.alert("Load courts failed", error?.response?.data?.message || error.message);
    }
  };

  const loadSlots = async (courtId, date) => {
    if (!courtId) {
      setSlots([]);
      return;
    }
    try {
      setIsLoading(true);
      const response = await getOwnerSlots(courtId, date);
      setSlots(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      Alert.alert("Load slots failed", error?.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    loadSlots(selectedCourtId, selectedDate);
  }, [selectedCourtId, selectedDate]);

  const handleAddSlot = async () => {
    if (!selectedCourtId || !selectedDate || !startTime || !endTime) {
      Alert.alert("Validation", "Please select court/date and fill start/end time.");
      return;
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      Alert.alert("Validation", "Time must be in HH:mm format (example: 09:30).");
      return;
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    if (startMinutes >= endMinutes) {
      Alert.alert("Validation", "End time must be after start time.");
      return;
    }

    try {
      const payload = {
        date: selectedDate,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
      };
      if (editingSlotId) {
        await updateOwnerSlot(editingSlotId, payload);
      } else {
        await createOwnerSlot(selectedCourtId, payload);
      }
      setStartTime("");
      setEndTime("");
      setEditingSlotId("");
      await loadSlots(selectedCourtId, selectedDate);
    } catch (error) {
      Alert.alert(editingSlotId ? "Update slot failed" : "Create slot failed", error?.response?.data?.message || error.message);
    }
  };

  const handleEditSlot = (slot) => {
    if (slot.isBooked) {
      return;
    }
    setEditingSlotId(slot.id);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
  };

  const handleCancelEdit = () => {
    setEditingSlotId("");
    setStartTime("");
    setEndTime("");
  };

  const handleSelectStartTime = (value) => {
    setStartTime(value);
    setIsStartPickerVisible(false);

    if (endTime) {
      const [startHour, startMinute] = value.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const nextStartMinutes = startHour * 60 + startMinute;
      const currentEndMinutes = endHour * 60 + endMinute;
      const overlap = existingRanges.some((range) => nextStartMinutes < range.end && range.start < currentEndMinutes);
      if (nextStartMinutes >= currentEndMinutes || overlap) {
        setEndTime("");
      }
    }
  };

  const handleSelectEndTime = (value) => {
    if (startTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = value.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      if (startMinutes >= endMinutes) {
        Alert.alert("Validation", "End time must be after start time.");
        return;
      }
    }

    setEndTime(value);
    setIsEndPickerVisible(false);
  };

  const handleDeleteSlot = (slotId) => {
    const performDelete = async () => {
      try {
        await deleteOwnerSlot(slotId);
        await loadSlots(selectedCourtId, selectedDate);
      } catch (error) {
        Alert.alert("Delete slot failed", error?.response?.data?.message || error.message);
      }
    };

    if (Platform.OS === "web") {
      const accepted = globalThis.confirm?.("Delete this slot?");
      if (accepted) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete Slot", "Delete this slot?", [
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
      {embedded ? null : <RoleTopBar onAvatarPress={() => onNavigate?.("edit-profile")} />}
      <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScreenContainer>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Select Court</Text>
          <View style={styles.daysRow}>
            {courts.map((court) => (
              <TouchableOpacity key={court.id} style={{ flex: 1 }} onPress={() => setSelectedCourtId(court.id)}>
                <Card style={[styles.dayCard, selectedCourtId === court.id ? styles.activeDay : null]}>
                  <Text style={[styles.dayText, { color: theme.text }, selectedCourtId === court.id ? styles.activeDayText : null]} numberOfLines={1}>
                    {court.name}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Date (Today only)</Text>
          <Card>
            <View style={styles.selectRow}>
              <Text style={[styles.select, { color: theme.text }]}>{selectedDate}</Text>
              <Text style={styles.selectArrow}>Today</Text>
            </View>
          </Card>

          <Text style={[styles.title, { color: theme.text }]}>Add Slot</Text>
          <Card>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>Use 24-hour format (HH:mm), e.g. 08:00</Text>
            <TouchableOpacity
              style={[styles.slotInput, styles.slotPickerButton, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => setIsStartPickerVisible(true)}
            >
              <Text style={[styles.slotPickerText, { color: startTime ? theme.text : "#9ca3af" }]}>
                {startTime || "Start time (HH:mm)"}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.slotInput, styles.slotPickerButton, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
              onPress={() => {
                if (!startTime) {
                  Alert.alert("Choose start time", "Please choose start time first.");
                  return;
                }
                setIsEndPickerVisible(true);
              }}
            >
              <Text style={[styles.slotPickerText, { color: endTime ? theme.text : "#9ca3af" }]}>
                {endTime || "End time (HH:mm)"}
              </Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            <GradientButton label={editingSlotId ? "Update Time Slot" : "+   Add Time Slot"} onPress={handleAddSlot} />
            {editingSlotId ? <GradientButton label="Cancel Edit" onPress={handleCancelEdit} style={styles.cancelEditButton} /> : null}
          </Card>

          <Text style={[styles.title, { color: theme.text }]}>Time Slots for {selectedDate}</Text>
          {isLoading ? <ActivityIndicator size="large" color={theme.info} /> : null}
          {!isLoading &&
            slots.map((slot) => (
              <Card key={slot.id} style={styles.slotRow}>
                <View>
                  <Text style={[styles.slotTime, { color: theme.text }]}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                  <Text style={[styles.slotSub, { color: theme.textSecondary }]}>{slot.date}</Text>
                </View>
                <View>
                  <Text style={styles.slotPrice}>{slot.isBooked ? "Booked" : "Available"}</Text>
                  <Text style={[styles.slotStatus, slot.isBooked ? styles.booked : null]}>{slot.status}</Text>
                </View>
                <View style={styles.actions}>
                  <Text style={[styles.edit, slot.isBooked ? styles.disabledText : null]} onPress={() => !slot.isBooked && handleEditSlot(slot)}>
                    Edit
                  </Text>
                  <Text style={[styles.delete, slot.isBooked ? styles.disabledText : null]} onPress={() => !slot.isBooked && handleDeleteSlot(slot.id)}>
                    Delete
                  </Text>
                </View>
              </Card>
            ))}
        </ScreenContainer>
      </KeyboardAvoidingView>

      <SelectionModal
        visible={isStartPickerVisible}
        title="Choose start time"
        options={startTimeOptions}
        selectedValue={startTime}
        onClose={() => setIsStartPickerVisible(false)}
        onSelect={handleSelectStartTime}
      />

      <SelectionModal
        visible={isEndPickerVisible}
        title="Choose end time"
        options={endTimeOptions}
        selectedValue={endTime}
        onClose={() => setIsEndPickerVisible(false)}
        onSelect={handleSelectEndTime}
      />
    </View>
  );
}

function SelectionModal({ visible, title, options, selectedValue, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent} showsVerticalScrollIndicator>
            {options.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modalItem,
                  selectedValue === item.value ? styles.modalItemActive : null,
                  item.disabled ? styles.modalItemDisabled : null,
                ]}
                onPress={() => !item.disabled && onSelect(item.value)}
                disabled={Boolean(item.disabled)}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedValue === item.value ? styles.modalItemTextActive : null,
                    item.disabled ? styles.modalItemDisabledText : null,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  label: { color: colors.textSecondary, fontWeight: "600" },
  select: { color: colors.textPrimary, fontSize: 16 },
  selectRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectArrow: { color: colors.textSecondary, fontSize: 12 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginTop: 4 },
  daysRow: { flexDirection: "row", gap: 8 },
  dayCard: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: radius.md },
  activeDay: { borderColor: colors.success, backgroundColor: colors.successSoft },
  dayText: { color: colors.textPrimary, fontWeight: "600" },
  activeDayText: { color: colors.success },
  hint: { marginBottom: 10, fontSize: 13 },
  slotInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  slotPickerButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  slotPickerText: { fontSize: 15 },
  slotRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  slotTime: { fontSize: 20, fontWeight: "700", color: colors.textPrimary },
  slotSub: { color: colors.textSecondary },
  slotPrice: { fontSize: 18, color: colors.success, fontWeight: "700" },
  slotStatus: { color: colors.success, fontWeight: "600" },
  booked: { color: colors.textSecondary },
  actions: { flexDirection: "row", gap: 10 },
  edit: { color: colors.info, fontWeight: "700" },
  delete: { color: colors.danger, fontWeight: "700" },
  disabledText: { opacity: 0.45 },
  cancelEditButton: { marginTop: 8, opacity: 0.7 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  modalCard: {
    maxHeight: "72%",
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#0b1220",
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 14,
  },
  modalTitle: { color: "#E5E5E5", fontSize: 18, fontWeight: "700", marginBottom: 10 },
  modalList: { maxHeight: "100%" },
  modalListContent: { paddingBottom: 4 },
  modalItem: {
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  modalItemActive: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
  },
  modalItemText: { color: "#cbd5e1", fontSize: 14 },
  modalItemTextActive: { color: colors.success, fontWeight: "700" },
  modalItemDisabled: { opacity: 0.35 },
  modalItemDisabledText: { color: "#7c8aa0" },
  modalCloseBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseText: { color: "#cbd5e1", fontWeight: "600" },
});
