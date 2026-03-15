import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
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
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
        <Text style={styles.icon}>{leftIcon || " "}</Text>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
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
            <Text style={[styles.rightActionText, { color: theme.success }]}>{rightText}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: 14, marginBottom: spacing.xs, fontWeight: "600" },
  inputWrap: {
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  icon: { width: 24, textAlign: "center", color: "#9ca3af", fontSize: 16, marginLeft: 6 },
  input: { flex: 1, paddingVertical: 10, paddingRight: 12, fontSize: 16 },
  rightAction: { paddingHorizontal: 10, paddingVertical: 8 },
  rightActionText: { fontWeight: "700", fontSize: 13 },
});
