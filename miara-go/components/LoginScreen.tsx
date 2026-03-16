// LoginScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";

import { ArrowLeft, Shield, Fingerprint, ChevronDown } from "lucide-react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useTranslation } from "react-i18next";
import { ToastMessage } from "../components/ToastMessage";
import { BioMetricScreen } from "./BioMetricScreen";
import { Logo } from "./ui/logo";

// =========================================================
// 🌍 Config pays — synchronisée avec AuthController.php
// Ajouter un pays ici ET dans $countryCodes du controller
// =========================================================
const COUNTRY_CONFIGS = [
  // ── Océan Indien (défaut) ──────────────────────────────────
  { code: "MG", flag: "🇲🇬", prefix: "+261", label: "Madagascar", localLen: 10, shortLen: 9 },
  { code: "RE", flag: "🇷🇪", prefix: "+262", label: "La Réunion", localLen: 10, shortLen: 9 },
  { code: "KM", flag: "🇰🇲", prefix: "+269", label: "Comores",    localLen: 7,  shortLen: 7 },
  { code: "MU", flag: "🇲🇺", prefix: "+230", label: "Maurice",    localLen: 8,  shortLen: 8 },
  // ── Europe ────────────────────────────────────────────────
  { code: "FR", flag: "🇫🇷", prefix: "+33",  label: "France",      localLen: 10, shortLen: 9 },
  { code: "GB", flag: "🇬🇧", prefix: "+44",  label: "Royaume-Uni", localLen: 10, shortLen: 10 },
  { code: "DE", flag: "🇩🇪", prefix: "+49",  label: "Allemagne",   localLen: 11, shortLen: 10 },
  // ── Amérique du Nord ──────────────────────────────────────
  { code: "US", flag: "🇺🇸", prefix: "+1",   label: "États-Unis",  localLen: 10, shortLen: 10 },
  { code: "CA", flag: "🇨🇦", prefix: "+1",   label: "Canada",      localLen: 10, shortLen: 10 },
  // ── Afrique ───────────────────────────────────────────────
  { code: "ZA", flag: "🇿🇦", prefix: "+27",  label: "Afrique du Sud", localLen: 9, shortLen: 9 },
] as const;

type CountryConfig = typeof COUNTRY_CONFIGS[number];

// Pays par défaut — correspond à DEFAULT_COUNTRY_CODE=MG dans .env
const DEFAULT_COUNTRY = COUNTRY_CONFIGS[0]; // MG

// =========================================================

interface LoginScreenProps {
  onLoginRequest: (phone: string, otp?: string) => void;
  onBackToSignup: () => void;
  onGoToRegister: () => void;
}

export function LoginScreen({ onLoginRequest, onBackToSignup, onGoToRegister }: LoginScreenProps) {
  const { t } = useTranslation();

  const [phone, setPhone] = useState("");        // chiffres bruts : "341234567" ou "0341234567"
  const [formatted, setFormatted] = useState(""); // affiché : "34 12 345 67" ou "034 12 345 67"
  const [view, setView] = useState<"login" | "biometric">("login");
  const [operator, setOperator] = useState<"yas" | "orange" | "airtel" | "invalid" | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // --- Sélecteur de pays ---
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(DEFAULT_COUNTRY);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lastSentRef = useRef<string>("");

  // =========================================================
  // FORMAT PHONE
  // Gère les deux longueurs : shortLen (sans 0) et localLen (avec 0)
  //
  // MG exemples :
  //   "341234567"  (9 chiffres) → "34 12 345 67"
  //   "0341234567" (10 chiffres)→ "034 12 345 67"
  // =========================================================
  const formatPhone = (digits: string, country: CountryConfig): string => {
    const isShort = digits.length <= country.shortLen;

    if (isShort) {
      // Format court XX XX XXX XX  (ex: 34 12 345 67)
      let f = digits;
      if (f.length > 2) f = f.slice(0, 2) + " " + f.slice(2);
      if (f.length > 5) f = f.slice(0, 5) + " " + f.slice(5);
      if (f.length > 9) f = f.slice(0, 9) + " " + f.slice(9);
      return f;
    } else {
      // Format long 0XX XX XXX XX  (ex: 034 12 345 67)
      let f = digits;
      if (f.length > 3) f = f.slice(0, 3) + " " + f.slice(3);
      if (f.length > 6) f = f.slice(0, 6) + " " + f.slice(6);
      if (f.length > 9) f = f.slice(0, 9) + " " + f.slice(9);
      return f;
    }
  };

  // =========================================================
  // DETECT OPERATOR — uniquement Madagascar
  // Fonctionne avec les deux formats (avec ou sans 0 initial)
  //   "34..." ou "034..." → même résultat
  // =========================================================
  const detectOperator = (digits: string, country: CountryConfig) => {
    if (country.code !== "MG") return null;
    // Normaliser sur 9 chiffres (sans le 0 initial si présent)
    const n = digits.startsWith("0") ? digits.slice(1) : digits;
    if (n.startsWith("34")) return "yas";
    if (n.startsWith("32")) return "orange";
    if (n.startsWith("33")) return "airtel";
    return "invalid";
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // =========================================================
  // HANDLE PHONE CHANGE
  //
  // ✅ Accepte shortLen (9) OU localLen (10) chiffres
  //    Les deux sont envoyés tels quels au AuthController
  //    qui normalise : "341234567" + "MG"  → "+261341234567"
  //                    "0341234567" + "MG" → "+261341234567"
  // =========================================================
  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, "");

    // Bloquer au-delà du localLen (format le plus long)
    if (digits.length > selectedCountry.localLen) return;

    setPhone(digits);
    setFormatted(formatPhone(digits, selectedCountry));

    const op = detectOperator(digits, selectedCountry);
    setOperator(op as any);

    // Shake si opérateur invalide dès que 2 chiffres significatifs saisis (MG)
    const significantLen = digits.startsWith("0") ? 3 : 2;
    if (selectedCountry.code === "MG" && digits.length >= significantLen && op === "invalid") {
      triggerShake();
    }

    // ✅ Valide si shortLen (9) OU localLen (10) + opérateur OK
    const isLengthOk =
      digits.length === selectedCountry.shortLen ||
      digits.length === selectedCountry.localLen;
    const isOperatorOk = selectedCountry.code !== "MG" || op !== "invalid";
    const valid = isLengthOk && isOperatorOk;

    setIsValid(valid);

    if (valid && lastSentRef.current !== digits) {
      lastSentRef.current = digits;
      autoSendOTP(digits);
    }
  };

  // Changer de pays → reset du champ phone
  const handleSelectCountry = (country: CountryConfig) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setPhone("");
    setFormatted("");
    setOperator(null);
    setIsValid(false);
    lastSentRef.current = "";
  };

  // =========================================================
  // BUILD PHONE PAYLOAD
  // Envoie le brut + country_code → AuthController normalise
  // =========================================================
  const buildPhonePayload = (rawDigits: string) => ({
    phone: rawDigits,
    country_code: selectedCountry.code,
  });

  // ------------------- AUTO SEND OTP -------------------
  const fetchRealOtp = async (rawPhone: string) => {
  try {

    const params = new URLSearchParams({
      phone: rawPhone,
      country_code: selectedCountry.code,
    });

    const res = await fetch(
      `http://10.0.2.2:8080/auth/get-last-otp?${params}`
    );

    const rawText = await res.text();

    // ⚠️ réponse vide
    if (!rawText || rawText.trim().length === 0) {
      console.log("⚠️ OTP API returned empty response");
      ToastMessage.show("⚠️ Aucun OTP reçu du serveur");
      return null;
    }

    let data;

    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.log("❌ Invalid JSON:", rawText);
      return null;
    }

    if (res.ok && data?.otp_code) {
      ToastMessage.show(t("otpMessage", { otp: data.otp_code }));
      return data.otp_code.toString();
    }

    ToastMessage.show("❌ OTP introuvable");

  } catch (err) {

    console.log("❌ OTP fetch error:", err);
    ToastMessage.show(t("serverUnavailable"));

    }
     return null;
  };

  const autoSendOTP = async (rawPhone: string) => {
    if (isSendingOtp) return;

    try {
      setIsSendingOtp(true);
      ToastMessage.show("⏳ Envoi du code OTP...");

      const response = await fetch("http://10.0.2.2:8080/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPhonePayload(rawPhone)),
      });

      const rawText = await response.text();

      if (!rawText || rawText.trim().length === 0) {
        ToastMessage.show("❌ Réponse vide du serveur");
      return;
      }

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        console.log("❌ Invalid JSON:", rawText);
        ToastMessage.show("❌ Réponse serveur invalide");
      return;
      }

      if (!response.ok) {
        ToastMessage.show(data.message || "❌ Échec d'envoi OTP");
        return;
      }

      ToastMessage.show("✅ Code OTP envoyé");

      const realOtp = await fetchRealOtp(rawPhone);
      if (realOtp) {
        onLoginRequest(rawPhone, realOtp);
      }
    } catch (err) {
      console.log("AUTO SEND OTP failed:", err);
      ToastMessage.show(t("serverUnavailable"));
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ------------------- LOGIN -------------------
  const loginUser = async () => {
    if (isLoggingIn) return;

    try {
      setIsLoggingIn(true);

      const res = await fetch("http://10.0.2.2:8080/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPhonePayload(phone)),
      });

      const rawText = await res.text();
      if (!rawText.trim()) {
        ToastMessage.show("❌ Réponse serveur vide");
        return;
      }

      const data = JSON.parse(rawText);

      if (!res.ok) {
        ToastMessage.show(data.message || t("userNotFound"));
        triggerShake();
        return;
      }

      if (data.otp_code) {
        ToastMessage.show(t("otpMessage", { otp: data.otp_code }));
      }

      onLoginRequest(phone, data.otp_code);
    } catch (e) {
      console.log("LOGIN ERROR:", e);
      ToastMessage.show(t("serverUnavailable"));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ------------------- BIOMETRIC -------------------
  const handleBiometricLogin = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        ToastMessage.show(t("biometricUnavailable"));
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("biometricLogin"),
        fallbackLabel: t("fallbackOtp"),
      });

      if (result.success) {
        ToastMessage.show(t("biometricSuccess"));
        onLoginRequest(phone || "biometric", "BIOMETRIC_AUTH");
      }
    } catch (e) {
      console.log("BIOMETRIC ERROR", e);
    }
  };

  if (view === "biometric") {
    return (
      <BioMetricScreen
        onCancel={() => setView("login")}
        onSuccess={() => onLoginRequest("biometric", "BIOMETRIC_AUTH")}
        deviceId={""}
      />
    );
  }

  const operatorColor =
    selectedCountry.code === "MG"
      ? ({ yas: "#facc15", orange: "#fb923c", airtel: "#ef4444", invalid: "#dc2626", null: "#9ca3af" } as Record<string, string>)[operator ?? "null"]
      : "#047857";

  const handleSubmit = () => {
    if (!isValid || isLoggingIn) return;
    loginUser();
  };

  // maxLength affiché = localLen + espaces (format le plus long)
  const maxDisplayLength = selectedCountry.localLen + Math.floor(selectedCountry.localLen / 3);

  // ------------------- MODAL SÉLECTEUR PAYS -------------------
  const CountryPickerModal = () => (
    <Modal
      visible={showCountryPicker}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>
            {t('selectCountry')}</Text>
          <FlatList
            data={COUNTRY_CONFIGS}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  item.code === selectedCountry.code && styles.countryItemSelected,
                ]}
                onPress={() => handleSelectCountry(item)}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.countryLabel}>{item.label}</Text>
                  <Text style={styles.countryPrefix}>{item.prefix}</Text>
                </View>
                {item.code === selectedCountry.code && (
                  <Text style={{ color: "#047857", fontWeight: "700" }}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f0fdf4" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 30 }}>
        <View style={styles.logoContainer}>
          <Logo fontSize={64} variant="light" />
          <Text style={styles.title}></Text>
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={onBackToSignup} style={styles.backButton}>
            <ArrowLeft size={26} color="#111" />
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.formContainer, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.label}>{t("phoneLabel")}</Text>

          {/* ── Champ phone avec sélecteur de pays ── */}
          <View style={[styles.inputWrapper, { borderColor: operatorColor }]}>

            {/* Bouton drapeau + prefix */}
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryPicker(true)}
              disabled={isSendingOtp}
            >
              <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
              <Text style={styles.prefixText}>{selectedCountry.prefix}</Text>
              <ChevronDown size={14} color="#6b7280" style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.inputDivider} />

            {/* Champ numéro */}
            <TextInput
              value={formatted}
              onChangeText={handlePhoneChange}
              placeholder={selectedCountry.code === "MG" ? "034 12 345 67" : t("phonePlaceholder")}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              maxLength={maxDisplayLength}
              editable={!isSendingOtp}
            />
          </View>

          {/* Hint deux formats acceptés — visible uniquement quand le champ est vide (MG) */}
          {selectedCountry.code === "MG" && phone.length === 0 && (
            <Text style={styles.hintText}>
              {t("acceptedFormat")}:{" "}
              <Text style={{ fontWeight: "700", color: "#6b7280" }}>034 12 345 67</Text>
              {"  ou  "}
              <Text style={{ fontWeight: "700", color: "#6b7280" }}>34 12 345 67</Text>
            </Text>
          )}

          {/* Indicateur opérateur (MG uniquement) */}
          {selectedCountry.code === "MG" && operator && operator !== "invalid" && (
            <Text style={[styles.operatorBadge, { color: operatorColor }]}>
              {({ yas: "YAS (YAS)", orange: "Orange", airtel: "Airtel" } as Record<string, string>)[operator]}
            </Text>
          )}

          <View style={{ alignItems: "center", marginTop: 20 }}>
            <TouchableOpacity onPress={() => setView("biometric")} style={styles.biometricButton}>
              <Fingerprint size={22} color="#047857" />
              <Text style={styles.biometricText}>{t("biometricLogin")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isLoggingIn}
            style={[
              styles.button,
              {
                backgroundColor: !isValid || isLoggingIn ? "#9ca3af" : "#047857",
                opacity: isLoggingIn ? 0.8 : 1,
              },
            ]}
          >
            {isLoggingIn ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator color="#fff" />
                <Text style={{ color: "white", fontWeight: "700", marginLeft: 10 }}>
                  Connexion...
                </Text>
              </View>
            ) : (
              <Text style={{ color: "white", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 }}>
                {t("loginButton")}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onGoToRegister} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={styles.registerText}>
              {t("noAccount")} <Text style={styles.registerLink}>{t("createAccount")}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.securityBox}>
          <Shield size={22} color="#059669" />
          <Text style={{ marginLeft: 10, color: "#047857" }}>{t("secureLoginNote")}</Text>
        </View>
      </ScrollView>

      {/* Modal sélecteur pays */}
      <CountryPickerModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { position: "absolute", top: 48, left: 20, zIndex: 20 },
  backButton: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  formContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 28,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  label: { fontSize: 13, color: "#6b7280", marginBottom: 8, fontWeight: "600", letterSpacing: 0.3 },

  // ── Input wrapper avec drapeau ──
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: 18,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    overflow: "hidden",
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: "100%",
    gap: 4,
  },
  flagEmoji: { fontSize: 22 },
  prefixText: { fontSize: 14, fontWeight: "700", color: "#374151" },
  inputDivider: { width: 1, height: 28, backgroundColor: "#e5e7eb" },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 1,
  },

  // ── Hint formats acceptés ──
  hintText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 5,
    marginLeft: 4,
  },

  // ── Badge opérateur ──
  operatorBadge: { fontSize: 12, fontWeight: "600", marginTop: 6, marginLeft: 4 },

  logoContainer: { alignItems: "center", marginBottom: 40 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 16 },
  biometricButton: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "center",
  },
  biometricText: { color: "#047857", fontWeight: "600" },
  button: {
    marginTop: 28,
    height: 54,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#047857",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  registerText: { color: "#374151", fontSize: 14, fontWeight: "500" },
  registerLink: { color: "#047857", fontWeight: "700" },
  securityBox: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginHorizontal: 24,
  },

  // ── Modal pays ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 14,
  },
  countryItemSelected: { backgroundColor: "#f0fdf4" },
  countryFlag: { fontSize: 28 },
  countryLabel: { fontSize: 15, fontWeight: "600", color: "#111827" },
  countryPrefix: { fontSize: 13, color: "#6b7280", marginTop: 2 },
});
