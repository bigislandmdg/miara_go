// OTPVerificationScreen.tsx — Version corrigée avec traductions complètes
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
  Alert,
} from "react-native";
import { ArrowLeft, Shield, RefreshCw } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ToastMessage } from "../components/ToastMessage";
import { Logo } from "./ui/logo";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../providers/LanguageProvider";

// =========================================================
// 🔓 DEV MODE - Mettre à true pour bypass l'authentification OTP
// =========================================================
const DEV_MODE = true;  // ← Changez à false pour désactiver le mode développement

/* ================= BASE URL CONFIG ================= */
const getBaseURL = () => {
  if (__DEV__) {
    return Platform.OS === "android"
      ? "http://10.0.2.2:8080"
      : "http://localhost:8080";
  }
  return "https://your-production-api.com";
};

/* ================= PROPS TYPES ================= */
interface OTPVerificationScreenProps {
  phoneNumber: string;
  role: "driver" | "passenger";
  otpFromLogin?: string;
  onBack?: () => void;
  onVerified?: (role: "driver" | "passenger", userId: number, token: string) => void;
  onExpired?: () => void;
}

export default function OTPVerificationScreen({
  phoneNumber,
  otpFromLogin,
  onBack,
  onVerified,
  onExpired,
}: OTPVerificationScreenProps) {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const baseURL = getBaseURL();

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(300);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [otpExpired, setOtpExpired] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
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
    if (timer === 0) {
      setOtpExpired(true);
      return;
    }
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
    if (otp.join("").length === 6 && !otpExpired) {
      handleVerify();
    }
  }, [otp, otpExpired]);

  /* ================= ANIMATION SHAKE ================= */
  const animateShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  /* ================= INPUT HANDLER ================= */
  const handleChange = (index: number, value: string) => {
    if (otpExpired) return;
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
/*const handleVerify = async () => {
  const code = otp.join("");
  if (code.length !== 6) return;
  if (otpExpired) {
    ToastMessage.show(t("otpExpired", "Code OTP expiré"));
    animateShake();
    return;
  }

  // 🔓 DEV MODE BYPASS - Décommentez les lignes suivantes pour bypass
  if (DEV_MODE) {
    console.log("🚀 DEV MODE - OTP verification bypassed");
    setIsVerifying(true);
    
    // Simuler une vérification réussie
    setTimeout(async () => {
      const mockUserId = 1;
      const mockToken = "dev_token_123456";
      const mockRole = "passenger";
      
      await AsyncStorage.multiSet([
        ["token", mockToken],
        ["user", JSON.stringify({ id: mockUserId, role: mockRole, phone: phoneNumber })],
        ["role", mockRole],
        ["isLoggedIn", "true"],
      ]);
      
      onVerified?.(mockRole as "driver" | "passenger", mockUserId, mockToken);
      ToastMessage.show(t("loginSuccess", "Connexion réussie (DEV MODE)"));
      setIsVerifying(false);
    }, 500);
    
    return;
  }

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
      animateShake();
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
    animateShake();
  } finally {
    setIsVerifying(false);
  }
  };

  /* ================= RESEND OTP ================= */
/*const handleResend = async () => {
  if (isResending) return;
  
  // 🔓 DEV MODE BYPASS - Décommentez pour bypass
  if (DEV_MODE) {
    console.log("🚀 DEV MODE - Resend OTP bypassed");
    setIsResending(true);
    setTimeout(() => {
      setTimer(300);
      setOtpExpired(false);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      ToastMessage.show(t("otpResent", "Nouveau code envoyé (DEV MODE)"));
      setIsResending(false);
    }, 500);
    return;
  }
  
  setIsResending(true);
  
  try {
    const res = await fetch(`${baseURL}/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneNumber }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.message?.includes("expired") || data.message?.includes("invalid")) {
        ToastMessage.show(t("otpExpiredResend", "Code expiré, veuillez vous reconnecter"));
        redirectToLogin();
        return;
      }
      throw new Error(data.message || "Resend failed");
    }

    setTimer(300);
    setOtpExpired(false);
    setOtp(["", "", "", "", "", ""]);
    inputs.current[0]?.focus();
    ToastMessage.show(t("otpResent", "Nouveau code envoyé"));
  } catch (error) {
    console.log("Resend error:", error);
    ToastMessage.show(t("networkError", "Erreur réseau"));
    
    Alert.alert(
      t("error", "Erreur"),
      t("resendFailed", "Impossible de renvoyer le code. Voulez-vous réessayer ?"),
      [
        { text: t("cancel", "Annuler"), style: "cancel" },
        { text: t("retry", "Réessayer"), onPress: () => handleResend() },
        { text: t("backToLogin", "Retour à la connexion"), onPress: redirectToLogin },
      ]
    );
  } finally {
    setIsResending(false);
  }
};
*/

  /* ================= VERIFY OTP ================= */
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    if (otpExpired) {
      ToastMessage.show(t("otpExpired", "Code OTP expiré"));
      animateShake();
      return;
    }

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
        animateShake();
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
      animateShake();
    } finally {
      setIsVerifying(false);
    }
  };



  /* ================= REDIRECTION VERS LOGIN ================= */
  const redirectToLogin = () => {
    Alert.alert(
      t("sessionExpired", "Session expirée"),
      t("otpExpiredMessage", "Votre code OTP a expiré. Veuillez vous reconnecter."),
      [
        {
          text: t("ok", "OK"),
          onPress: async () => {
            await AsyncStorage.multiRemove(["token", "user", "role", "isLoggedIn"]);
            if (onExpired) {
              onExpired();
            } else if (onBack) {
              onBack();
            }
          },
        },
      ]
    );
  };

  /* ================= RESEND OTP ================= */
  const handleResend = async () => {
    if (isResending) return;
    
    setIsResending(true);
    
    try {
      const res = await fetch(`${baseURL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message?.includes("expired") || data.message?.includes("invalid")) {
          ToastMessage.show(t("otpExpiredResend", "Code expiré, veuillez vous reconnecter"));
          redirectToLogin();
          return;
        }
        throw new Error(data.message || "Resend failed");
      }

      setTimer(300);
      setOtpExpired(false);
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      ToastMessage.show(t("otpResent", "Nouveau code envoyé"));
    } catch (error) {
      console.log("Resend error:", error);
      ToastMessage.show(t("networkError", "Erreur réseau"));
      
      Alert.alert(
        t("error", "Erreur"),
        t("resendFailed", "Impossible de renvoyer le code. Voulez-vous réessayer ?"),
        [
          { text: t("cancel", "Annuler"), style: "cancel" },
          { text: t("retry", "Réessayer"), onPress: () => handleResend() },
          { text: t("backToLogin", "Retour à la connexion"), onPress: redirectToLogin },
        ]
      );
    } finally {
      setIsResending(false);
    }
  };

  /* ================= FORMAT TIMER ================= */
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
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
          {otpExpired && (
            <Animated.View style={[styles.expiredWarning, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.expiredWarningText}>
                {t("otpExpiredWarning", "Code OTP expiré. Veuillez renvoyer un nouveau code.")}
              </Text>
            </Animated.View>
          )}

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={styles.otpContainer}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { inputs.current[i] = r; }}
                  style={[
                    styles.otpInput,
                    focusedIndex === i && styles.otpInputFocused,
                    otpExpired && styles.otpInputExpired,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleChange(i, v)}
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() => setFocusedIndex(null)}
                  editable={!otpExpired}
                />
              ))}
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[styles.button, (isVerifying || otpExpired) && { opacity: 0.6 }]}
            onPress={handleVerify}
            disabled={isVerifying || otpExpired}
          >
            <Text style={styles.buttonText}>
              {isVerifying ? t("verifying", "Vérification...") : t("continueBtn", "Continuer")}
            </Text>
          </TouchableOpacity>

          {timer > 0 && !otpExpired ? (
            <Text style={styles.timerText}>
              {t("resendIn", "Renvoyer dans")} {formatTimer(timer)}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isResending} style={styles.resendButton}>
              {isResending ? (
                <Text style={styles.resendText}>{t("sending", "Envoi...")}</Text>
              ) : (
                <>
                  <RefreshCw size={16} color="#047857" />
                  <Text style={styles.resendText}>
                    {otpExpired ? t("resendNewCode", "Renvoyer un nouveau code") : t("resendOTP", "Renvoyer le code")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={redirectToLogin} style={styles.backToLoginButton}>
            <Text style={styles.backToLoginText}>
              {t("backToLogin", "Retour à la connexion")}
            </Text>
          </TouchableOpacity>

          <View style={styles.securityBox}>
            <Shield size={22} color="#059669" />
            <Text style={styles.securityText}>
              {t("secureLoginNote", "Connexion sécurisée - Code à usage unique")}
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
  backButton: { backgroundColor: "#fff", padding: 10, borderRadius: 999, elevation: 4 },
  title: { fontSize: 28, fontWeight: "800", color: "#064e3b", marginTop: 16 },
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
    backgroundColor: "#fff",
  },
  otpInputFocused: { borderColor: "#10B981", transform: [{ scale: 1.05 }] },
  otpInputExpired: { borderColor: "#EF4444", backgroundColor: "#FEF2F2", color: "#991B1B" },
  button: { backgroundColor: "#047857", height: 48, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  timerText: { textAlign: "center", marginTop: 16, color: "#6b7280", fontSize: 14 },
  resendButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 16, gap: 8 },
  resendText: { textAlign: "center", color: "#047857", fontWeight: "600", fontSize: 14 },
  backToLoginButton: { marginTop: 20, alignItems: "center" },
  backToLoginText: { color: "#6B7280", fontSize: 13, textDecorationLine: "underline" },
  securityBox: { marginTop: 28, flexDirection: "row", justifyContent: "center", alignItems: "center", backgroundColor: "#ecfdf5", padding: 14, borderRadius: 20 },
  securityText: { marginLeft: 10, color: "#047857", fontWeight: "600" },
  expiredWarning: { backgroundColor: "#FEF2F2", padding: 12, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: "#FECACA" },
  expiredWarningText: { color: "#B91C1C", textAlign: "center", fontSize: 13, fontWeight: "500" },
});

