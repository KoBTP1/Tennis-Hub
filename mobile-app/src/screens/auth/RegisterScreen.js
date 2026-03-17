import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import GradientButton from "../../components/GradientButton";
import InputField from "../../components/InputField";
import ScreenContainer from "../../components/ScreenContainer";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";
import { useAuth } from "../../context/AuthContext";
import { getVietnamesePhoneErrorMessage, isValidVietnamesePhone, normalizePhoneNumber } from "../../utils/validation";

const registerValidationSchema = Yup.object().shape({
  name: Yup.string().trim().required("Full name is required."),
  email: Yup.string().trim().email("Please enter a valid email address.").required("Email is required."),
  address: Yup.string().trim().required("Address is required."),
  password: Yup.string().min(6, "Password must be at least 6 characters.").required("Password is required."),
  confirmPassword: Yup.string()
    .required("Confirm password is required.")
    .oneOf([Yup.ref("password")], "Confirm password does not match."),
  phone: Yup.string()
    .required("Phone number is required.")
    .test("vn-phone", getVietnamesePhoneErrorMessage(), (value) => isValidVietnamesePhone(value || "")),
});

function getRegisterValidationMessage(errors, submitCount) {
  if (!submitCount) {
    return "";
  }

  return errors.name || errors.email || errors.address || errors.phone || errors.password || errors.confirmPassword || "";
}

export default function RegisterScreen({ onNavigateLogin }) {
  const { register } = useAuth();
  const { theme } = useTheme();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const topInset = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      setErrorMessage("");
      setSuccessMessage("");
      await register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        phone: normalizePhoneNumber(values.phone),
        address: values.address.trim(),
        role: "player",
      });
      setSuccessMessage("Account created successfully. Redirecting to Sign In...");
      setTimeout(() => {
        onNavigateLogin?.();
      }, 700);
    } catch (error) {
      setSuccessMessage("");
      setErrorMessage(error.message || "Unable to register. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenContainer contentStyle={[styles.content, { paddingTop: 20 + topInset }]}>
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
          <Text style={styles.logoText}>🎾</Text>
        </LinearGradient>
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join us to book your tennis court</Text>

      <Formik
        initialValues={{ name: "", email: "", address: "", phone: "", password: "", confirmPassword: "" }}
        validationSchema={registerValidationSchema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={handleRegister}
      >
        {({ values, errors, isSubmitting, setFieldValue, setFieldTouched, handleSubmit, submitCount }) => (
          <>
            <View style={styles.messageWrap}>
              {Boolean(errorMessage || getRegisterValidationMessage(errors, submitCount)) && (
                <Text style={styles.errorText}>{errorMessage || getRegisterValidationMessage(errors, submitCount)}</Text>
              )}
              {Boolean(successMessage) && <Text style={styles.successText}>{successMessage}</Text>}
            </View>

            <InputField
              label="Full Name"
              placeholder="Enter your name"
              leftIcon="👤"
              value={values.name}
              onChangeText={(text) => {
                if (errorMessage || successMessage) {
                  setErrorMessage("");
                  setSuccessMessage("");
                }
                setFieldValue("name", text);
              }}
              onBlur={() => setFieldTouched("name", true)}
              editable={!isSubmitting}
            />

            <InputField
              label="Email"
              placeholder="your@email.com"
              leftIcon="✉"
              value={values.email}
              onChangeText={(text) => {
                if (errorMessage || successMessage) {
                  setErrorMessage("");
                  setSuccessMessage("");
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
              label="Phone Number"
              placeholder="0912345678"
              leftIcon="☎"
              value={values.phone}
              onChangeText={(text) => {
                if (errorMessage || successMessage) {
                  setErrorMessage("");
                  setSuccessMessage("");
                }
                setFieldValue("phone", text);
              }}
              onBlur={() => setFieldTouched("phone", true)}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />

            <InputField
              label="Address"
              placeholder="Enter your address"
              leftIcon="🏠"
              value={values.address}
              onChangeText={(text) => {
                if (errorMessage || successMessage) {
                  setErrorMessage("");
                  setSuccessMessage("");
                }
                setFieldValue("address", text);
              }}
              onBlur={() => setFieldTouched("address", true)}
              editable={!isSubmitting}
            />

            <InputField
              label="Password"
              placeholder="Create a password"
              leftIcon="🔒"
              secureTextEntry={!isPasswordVisible}
              value={values.password}
              onChangeText={(text) => {
                if (errorMessage || successMessage) {
                  setErrorMessage("");
                  setSuccessMessage("");
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

            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              leftIcon="🔒"
              secureTextEntry={!isConfirmPasswordVisible}
              value={values.confirmPassword}
              onChangeText={(text) => {
                if (errorMessage || successMessage) {
                  setErrorMessage("");
                  setSuccessMessage("");
                }
                setFieldValue("confirmPassword", text);
              }}
              onBlur={() => setFieldTouched("confirmPassword", true)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
              rightText={isConfirmPasswordVisible ? "Hide" : "Show"}
              onRightPress={() => setIsConfirmPasswordVisible((prev) => !prev)}
            />
            <GradientButton
              label={isSubmitting ? "Creating Account..." : "Create Account"}
              style={styles.button}
              onPress={() => {
                if (errorMessage || successMessage) {
                  setErrorMessage("");
                  setSuccessMessage("");
                }
                handleSubmit();
              }}
            />
          </>
        )}
      </Formik>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Already have an account?{" "}
          <Text style={styles.footerLink} onPress={onNavigateLogin}>
            Sign In
          </Text>
        </Text>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: { flex: 1 },
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
  messageWrap: { minHeight: 26, justifyContent: "center", marginBottom: 4 },
  errorText: { color: colors.danger, fontWeight: "600", textAlign: "center" },
  successText: { color: colors.success, fontWeight: "600", textAlign: "center" },
  button: { marginTop: 4 },
  footer: { marginTop: 12, color: colors.textSecondary, fontSize: 16, textAlign: "center" },
  footerLink: { color: colors.success, fontWeight: "700" },
});
