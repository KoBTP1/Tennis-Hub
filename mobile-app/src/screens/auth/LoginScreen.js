import React, { useState } from "react";
import { Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import GradientButton from "../../components/GradientButton";
import InputField from "../../components/InputField";
import ScreenContainer from "../../components/ScreenContainer";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius } from "../../styles/theme";
import { useAuth } from "../../context/AuthContext";

const loginValidationSchema = Yup.object().shape({
  email: Yup.string().trim().email("Please enter a valid email address.").required("Email is required."),
  password: Yup.string().required("Password is required."),
});

function getLoginValidationMessage(errors, submitCount) {
  if (!submitCount) {
    return "";
  }

  return errors.email || errors.password || "";
}

export default function LoginScreen({ onNavigateRegister }) {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const topInset = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  const handleSignIn = async (values, { setSubmitting }) => {
    try {
      setErrorMessage("");
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        rememberMe,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to login. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentStyle={[styles.content, { paddingTop: 20 + topInset }]}>
      <LinearGradient colors={["#0FAF7C", "#1E66E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
        <Text style={styles.logoText}>🎾</Text>
      </LinearGradient>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to book your court</Text>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={loginValidationSchema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={handleSignIn}
      >
        {({ values, errors, isSubmitting, setFieldValue, setFieldTouched, handleSubmit, submitCount }) => (
          <>
            <View style={styles.messageWrap}>
              {Boolean(errorMessage || getLoginValidationMessage(errors, submitCount)) && (
                <Text style={styles.errorText}>{errorMessage || getLoginValidationMessage(errors, submitCount)}</Text>
              )}
            </View>

            <InputField
              label="Email"
              placeholder="your@email.com"
              leftIcon="✉"
              value={values.email}
              onChangeText={(text) => {
                if (errorMessage) {
                  setErrorMessage("");
                }
                setFieldValue("email", text);
              }}
              onBlur={() => setFieldTouched("email", true)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              leftIcon="🔒"
              secureTextEntry={!isPasswordVisible}
              value={values.password}
              onChangeText={(text) => {
                if (errorMessage) {
                  setErrorMessage("");
                }
                setFieldValue("password", text);
              }}
              onBlur={() => setFieldTouched("password", true)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              rightText={isPasswordVisible ? "Hide" : "Show"}
              onRightPress={() => setIsPasswordVisible((prev) => !prev)}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe((prev) => !prev)}
                activeOpacity={0.85}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <View style={styles.checkboxInner} /> : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <GradientButton
              label={isSubmitting ? "Signing In..." : "Sign In"}
              onPress={() => {
                if (errorMessage) {
                  setErrorMessage("");
                }
                handleSubmit();
              }}
            />
          </>
        )}
      </Formik>

      <Text style={styles.footer}>
        Don&apos;t have an account?{" "}
        <Text style={styles.footerLink} onPress={onNavigateRegister}>
          Sign Up
        </Text>
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: { fontSize: 24 },
  title: { textAlign: "center", fontSize: 40, fontWeight: "800", color: colors.textPrimary },
  subtitle: { marginTop: 6, textAlign: "center", color: colors.textSecondary, fontSize: 17, marginBottom: 14 },
  messageWrap: { minHeight: 24, justifyContent: "center", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  rememberText: { color: colors.textPrimary, fontSize: 16 },
  forgot: { color: colors.success, fontWeight: "700", fontSize: 16 },
  errorText: { color: colors.danger, fontWeight: "600", textAlign: "center" },
  footer: { marginTop: 14, textAlign: "center", color: colors.textSecondary, fontSize: 16 },
  footerLink: { color: colors.success, fontWeight: "700" },
});
