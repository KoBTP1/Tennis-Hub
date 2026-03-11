import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../styles/theme";

export default function InputField({
  label,
  placeholder,
  leftIcon,
  secureTextEntry,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  editable,
  onBlur,
  rightText,
  onRightPress,
}) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.icon}>{leftIcon || " "}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          onBlur={onBlur}
        />
        {rightText ? (
          <TouchableOpacity onPress={onRightPress} style={styles.rightAction} disabled={!editable}>
            <Text style={styles.rightActionText}>{rightText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { color: colors.textPrimary, fontSize: 14, marginBottom: spacing.xs, fontWeight: "600" },
  inputWrap: {
    backgroundColor: "#f7f8fb",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#eef0f4",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  icon: { width: 24, textAlign: "center", color: "#9ca3af", fontSize: 16, marginLeft: 6 },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: 10, paddingRight: 12, fontSize: 16 },
  rightAction: { paddingHorizontal: 10, paddingVertical: 8 },
  rightActionText: { color: colors.success, fontWeight: "700", fontSize: 13 },
});
