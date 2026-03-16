// OTPVerificationScreen.tsx — v2 Ultra Premium Production Ready

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { ArrowLeft, Shield } from "lucide-react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastMessage } from "../components/ToastMessage";
import { Logo } from "./ui/logo";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../providers/LanguageProvider";

/* ================= BASE URL CONFIG ================= */
const getBaseURL = () => {
  if (__DEV__) {
    return Platform.OS === "android"
      ? "http://10.0.2.2:8080"
      : "http://localhost:8080";
  }
  return "https://your-production-api.com"; // 🔥 METTRE TON URL PROD ICI
};

/* ================= NAVIGATION TYPES ================= */
export type RootStackParamList = {
  Auth: undefined;
  DriverApp: undefined;
  PassengerApp: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OTPVerificationScreenProps {
  phoneNumber: string;
  role: "driver" | "passenger";
  otpFromLogin?: string;
  onBack?: () => void;
  onVerified?: (role: "driver" | "passenger", userId: number, token: string) => void;
}

export default function OTPVerificationScreen({
  phoneNumber,
  otpFromLogin,
  onBack,
  onVerified,
}: OTPVerificationScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const baseURL = getBaseURL();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(300);
  const [isVerifying, setIsVerifying] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputs = useRef<Array<TextInput | null>>(Array(6).fill(null));

  /* ================= AUTO LANGUAGE ================= */
  useEffect(() => {
    if (!language) {
      const detected =
        Intl?.DateTimeFormat()?.resolvedOptions()?.locale?.slice(0, 2) ?? "fr";

      if (["fr", "en", "mg"].includes(detected)) changeLanguage(detected);
      else changeLanguage("fr");
    }
  }, []);

  /* ================= FADE ANIMATION ================= */
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => {
      setTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  /* ================= AUTO FILL OTP ================= */
  useEffect(() => {
    if (otpFromLogin?.length === 6) {
      setOtp(otpFromLogin.split(""));
      inputs.current[5]?.focus();
    }
  }, [otpFromLogin]);

  /* ================= AUTO SUBMIT ================= */
  useEffect(() => {
    if (otp.join("").length === 6) {
      handleVerify();
    }
  }, [otp]);

  /* ================= INPUT HANDLER ================= */
  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (!value && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== 6) return;

    setIsVerifying(true);

    try {
      const res = await fetch(`${baseURL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber, otp_code: code }),
      });

      const data = await res.json();

      if (!res.ok || !data.status) {
        ToastMessage.show(t("otpIncorrect", "OTP incorrect"));
        setOtp(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }

      const token = data.token;
      const user = data.user;
      const userRole = user.role;

      await AsyncStorage.multiSet([
        ["token", token],
        ["user", JSON.stringify(user)],
        ["role", userRole],
        ["isLoggedIn", "true"],
      ]);

      onVerified?.(userRole, Number(user.id), token);

      ToastMessage.show(t("loginSuccess", "Connexion réussie"));
    } catch {
      ToastMessage.show(t("networkError", "Erreur réseau"));
    } finally {
      setIsVerifying(false);
    }
  };

  /* ================= RESEND OTP ================= */
  const handleResend = async () => {
    try {
      setTimer(300);

      await fetch(`${baseURL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      ToastMessage.show(t("otpResent", "Nouveau code envoyé"));
    } catch {
      ToastMessage.show(t("networkError", "Erreur réseau"));
    }
  };

  /* ================= UI ================= */
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f0fdf4" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack || navigation.goBack}
            style={styles.backButton}
          >
            <ArrowLeft size={26} color="#064e3b" />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Logo fontSize={64} variant="light" />
          <Text style={styles.title}>{t("otpVerification")}</Text>
          <Text style={styles.subtitle}>
            {t("codeSentTo")} {phoneNumber}
          </Text>
        </View>

        <Animated.View style={{ opacity: fadeAnim, paddingHorizontal: 24 }}>
          <View style={styles.otpContainer}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                style={[
                  styles.otpInput,
                  focusedIndex === i && styles.otpInputFocused,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(v) => handleChange(i, v)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(null)}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.button, isVerifying && { opacity: 0.6 }]}
            onPress={handleVerify}
            disabled={isVerifying}
          >
            <Text style={styles.buttonText}>
              {isVerifying ? t("verifying") : t("continueBtn")}
            </Text>
          </TouchableOpacity>

          {timer > 0 ? (
            <Text style={styles.timerText}>
              {t("resendIn")} {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>{t("resendOTP")}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.securityBox}>
            <Shield size={22} color="#059669" />
            <Text style={styles.securityText}>
              {t("secureLoginNote")}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: { position: "absolute", top: 48, left: 20, zIndex: 10 },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  backButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 999,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#064e3b",
    marginTop: 16,
  },
  subtitle: { marginTop: 6, color: "#6b7280" },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    marginVertical: 20,
  },
  otpInput: {
    width: 46,
    height: 58,
    borderWidth: 1.5,
    borderColor: "#047857",
    borderRadius: 14,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#064e3b",
  },
  otpInputFocused: {
    borderColor: "#10B981",
    transform: [{ scale: 1.05 }],
  },
  button: {
    backgroundColor: "#047857",
    height: 48,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  timerText: { textAlign: "center", marginTop: 16, color: "#6b7280" },
  resendText: {
    textAlign: "center",
    marginTop: 16,
    color: "#047857",
    fontWeight: "600",
  },
  securityBox: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    padding: 14,
    borderRadius: 20,
  },
  securityText: { marginLeft: 10, color: "#047857", fontWeight: "600" },
});