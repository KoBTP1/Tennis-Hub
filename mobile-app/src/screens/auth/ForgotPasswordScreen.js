import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, View } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import GradientButton from "../../components/GradientButton";
import InputField from "../../components/InputField";
import ScreenContainer from "../../components/ScreenContainer";
import { LinearGradient } from "expo-linear-gradient";
import { requestPasswordReset, submitPasswordReset } from "../../services/authService";
import { useTheme } from "../../context/ThemeContext";
import { colors } from "../../styles/theme";

const requestSchema = Yup.object().shape({
  email: Yup.string().trim().email("Please enter a valid email address.").required("Email is required."),
});

const resetSchema = Yup.object().shape({
  token: Yup.string().trim().required("Reset token is required."),
  newPassword: Yup.string().min(6, "Password must be at least 6 characters.").required("New password is required."),
  confirmPassword: Yup.string()
    .required("Confirm password is required.")
    .oneOf([Yup.ref("newPassword")], "Confirm password does not match."),
});

export default function ForgotPasswordScreen({ onNavigateLogin }) {
  const { theme } = useTheme();
  const [step, setStep] = useState("request");
  const [requestMessage, setRequestMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [devTokenHint, setDevTokenHint] = useState("");
  const topInset = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  const handleRequestToken = async (values, { setSubmitting }) => {
    try {
      setErrorMessage("");
      const response = await requestPasswordReset(values.email);
      setRequestMessage(response?.message || "Reset instructions generated.");
      setDevTokenHint(response?.devResetToken || "");
      setStep("reset");
    } catch (error) {
      setErrorMessage(error.message || "Unable to request reset.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (values, { setSubmitting }) => {
    try {
      setErrorMessage("");
      await submitPasswordReset({
        token: values.token.trim(),
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setRequestMessage("Password reset successful. Please sign in with your new password.");
      setDevTokenHint("");
      setStep("done");
    } catch (error) {
      setErrorMessage(error.message || "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardAvoiding} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScreenContainer contentStyle={[styles.content, { paddingTop: 20 + topInset }]}>
        <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logo}>
          <Text style={styles.logoText}>🔐</Text>
        </LinearGradient>
        <Text style={[styles.title, { color: theme.text }]}>Forgot Password</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {step === "request" ? "Request a reset token" : "Enter token and new password"}
        </Text>

        <View style={styles.messageWrap}>
          {requestMessage ? <Text style={styles.successText}>{requestMessage}</Text> : null}
          {devTokenHint ? <Text style={styles.hintText}>Dev token: {devTokenHint}</Text> : null}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        {step === "request" ? (
          <Formik initialValues={{ email: "" }} validationSchema={requestSchema} onSubmit={handleRequestToken}>
            {({ values, isSubmitting, setFieldValue, setFieldTouched, handleSubmit }) => (
              <>
                <InputField
                  label="Email"
                  placeholder="your@email.com"
                  leftIcon="✉"
                  value={values.email}
                  onChangeText={(text) => setFieldValue("email", text)}
                  onBlur={() => setFieldTouched("email", true)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
                <GradientButton label={isSubmitting ? "Requesting..." : "Request Reset Token"} onPress={handleSubmit} />
              </>
            )}
          </Formik>
        ) : null}

        {step === "reset" ? (
          <Formik
            initialValues={{ token: devTokenHint || "", newPassword: "", confirmPassword: "" }}
            validationSchema={resetSchema}
            onSubmit={handleResetPassword}
          >
            {({ values, isSubmitting, setFieldValue, setFieldTouched, handleSubmit }) => (
              <>
                <InputField
                  label="Reset Token"
                  placeholder="Paste reset token"
                  leftIcon="🎟"
                  value={values.token}
                  onChangeText={(text) => setFieldValue("token", text)}
                  onBlur={() => setFieldTouched("token", true)}
                  editable={!isSubmitting}
                />
                <InputField
                  label="New Password"
                  placeholder="Enter new password"
                  leftIcon="🔒"
                  secureTextEntry
                  value={values.newPassword}
                  onChangeText={(text) => setFieldValue("newPassword", text)}
                  onBlur={() => setFieldTouched("newPassword", true)}
                  editable={!isSubmitting}
                />
                <InputField
                  label="Confirm Password"
                  placeholder="Confirm new password"
                  leftIcon="🔒"
                  secureTextEntry
                  value={values.confirmPassword}
                  onChangeText={(text) => setFieldValue("confirmPassword", text)}
                  onBlur={() => setFieldTouched("confirmPassword", true)}
                  editable={!isSubmitting}
                />
                <GradientButton label={isSubmitting ? "Resetting..." : "Reset Password"} onPress={handleSubmit} />
              </>
            )}
          </Formik>
        ) : null}

        {step === "done" ? <GradientButton label="Back to Sign In" onPress={onNavigateLogin} /> : null}
        {step !== "done" ? (
          <Text style={[styles.footer, { color: theme.textSecondary }]}>
            Back to{" "}
            <Text style={styles.footerLink} onPress={onNavigateLogin}>
              Sign In
            </Text>
          </Text>
        ) : null}
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
  title: { textAlign: "center", fontSize: 36, fontWeight: "800", color: colors.textPrimary },
  subtitle: { marginTop: 6, textAlign: "center", color: colors.textSecondary, fontSize: 16, marginBottom: 12 },
  messageWrap: { minHeight: 28, justifyContent: "center", marginBottom: 6 },
  successText: { color: colors.success, textAlign: "center", fontWeight: "600" },
  errorText: { color: colors.danger, textAlign: "center", fontWeight: "600" },
  hintText: { color: colors.info, textAlign: "center", marginTop: 4, fontWeight: "600" },
  footer: { marginTop: 12, textAlign: "center", color: colors.textSecondary, fontSize: 16 },
  footerLink: { color: colors.success, fontWeight: "700" },
});
