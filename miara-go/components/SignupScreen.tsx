// SignupScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { ArrowLeft, Shield, User, UserCog, ChevronDown } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../providers/LanguageProvider";
import { Logo } from "./ui/logo";

// =========================================================
// 🔓 DEV MODE - Mettre à true pour bypass l'inscription
// =========================================================
const DEV_MODE = true;  // ← Changez à false pour désactiver le mode développement


type RootStackParamList = {
  PassengerHome: undefined;
  DriverHome: undefined;
  Signup: undefined;
  Login: undefined;
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export interface SignupData {
  firstName: string;
  lastName: string;
  phone: string;
  roles: ("passenger" | "driver")[];
}

interface Props {
  onSignup: (data: SignupData) => void;
  onBackToLogin: () => void;
}

// =========================================================
// 🌍 Config pays — identique à LoginScreen.tsx
// Synchronisée avec AuthController.php $countryCodes
// Ajouter un pays ici ET dans $countryCodes du controller
// =========================================================
const COUNTRY_CONFIGS = [
  // ── Océan Indien (défaut) ──────────────────────────────────
  { code: "MG", flag: "🇲🇬", prefix: "+261", label: "Madagascar",    localLen: 10, shortLen: 9  },
  { code: "RE", flag: "🇷🇪", prefix: "+262", label: "La Réunion",    localLen: 10, shortLen: 9  },
  { code: "KM", flag: "🇰🇲", prefix: "+269", label: "Comores",       localLen: 7,  shortLen: 7  },
  { code: "MU", flag: "🇲🇺", prefix: "+230", label: "Maurice",       localLen: 8,  shortLen: 8  },
  // ── Europe ────────────────────────────────────────────────
  { code: "FR", flag: "🇫🇷", prefix: "+33",  label: "France",        localLen: 10, shortLen: 9  },
  { code: "GB", flag: "🇬🇧", prefix: "+44",  label: "Royaume-Uni",   localLen: 10, shortLen: 10 },
  { code: "DE", flag: "🇩🇪", prefix: "+49",  label: "Allemagne",     localLen: 11, shortLen: 10 },
  // ── Amérique du Nord ──────────────────────────────────────
  { code: "US", flag: "🇺🇸", prefix: "+1",   label: "États-Unis",    localLen: 10, shortLen: 10 },
  { code: "CA", flag: "🇨🇦", prefix: "+1",   label: "Canada",        localLen: 10, shortLen: 10 },
  // ── Afrique ───────────────────────────────────────────────
  { code: "ZA", flag: "🇿🇦", prefix: "+27",  label: "Afrique du Sud",localLen: 9,  shortLen: 9  },
] as const;

type CountryConfig = typeof COUNTRY_CONFIGS[number];

// Pays par défaut — correspond à DEFAULT_COUNTRY_CODE=MG dans .env
const DEFAULT_COUNTRY = COUNTRY_CONFIGS[0]; // MG

// =========================================================

export function SignupScreen({ onSignup, onBackToLogin }: Props) {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  // ===================== FORM STATES =====================
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [digits, setDigits] = useState("");       // chiffres bruts : "341234567" ou "0341234567"
  const [formatted, setFormatted] = useState(""); // affiché : "34 12 345 67" ou "034 12 345 67"
  const [roles, setRoles] = useState<("passenger" | "driver")[]>([]);
  const [loading, setLoading] = useState(false);
  const [operator, setOperator] = useState<"yas" | "orange" | "airtel" | "invalid" | null>(null);
  const [error, setError] = useState("");

  // --- Sélecteur de pays (même structure que LoginScreen) ---
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(DEFAULT_COUNTRY);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // ===================== AUTO LANGUAGE =====================
  useEffect(() => {
    if (!language) {
      const locales = Platform.OS === "web" ? ["fr"] : Intl?.DateTimeFormat()?.resolvedOptions()?.locale || "fr";
      const detected = locales?.[0]?.slice(0, 2) ?? "fr";
      if (["fr", "en", "mg"].includes(detected)) changeLanguage(detected);
      else changeLanguage("fr");
    }
  }, []);

  // ===================== SHAKE ANIMATION =====================
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ===================== FORMAT PHONE =====================
  // Identique à LoginScreen — gère shortLen (sans 0) et localLen (avec 0)
  //   "341234567"  (9)  → "34 12 345 67"
  //   "0341234567" (10) → "034 12 345 67"
  const formatPhone = (d: string, country: CountryConfig): string => {
    const isShort = d.length <= country.shortLen;
    if (isShort) {
      let f = d;
      if (f.length > 2) f = f.slice(0, 2) + " " + f.slice(2);
      if (f.length > 5) f = f.slice(0, 5) + " " + f.slice(5);
      if (f.length > 9) f = f.slice(0, 9) + " " + f.slice(9);
      return f;
    } else {
      let f = d;
      if (f.length > 3) f = f.slice(0, 3) + " " + f.slice(3);
      if (f.length > 6) f = f.slice(0, 6) + " " + f.slice(6);
      if (f.length > 9) f = f.slice(0, 9) + " " + f.slice(9);
      return f;
    }
  };

  // ===================== DETECT OPERATOR =====================
  // Identique à LoginScreen — fonctionne avec ou sans 0 initial (MG uniquement)
  const detectOperator = (d: string, country: CountryConfig) => {
    if (country.code !== "MG") return null;
    const n = d.startsWith("0") ? d.slice(1) : d;
    if (n.startsWith("34") || n.startsWith("38")) return "yas";
    if (n.startsWith("32")) return "orange";
    if (n.startsWith("33")) return "airtel";
    return "invalid";
  };

  // ===================== HANDLE PHONE CHANGE =====================
  // ✅ Accepte shortLen (9) OU localLen (10) — identique à LoginScreen
  //    AuthController normalise : "341234567" + "MG" → "+261341234567"
  //                               "0341234567" + "MG" → "+261341234567"
  const handlePhoneChange = (text: string) => {
    const raw = text.replace(/\D/g, "");
    if (raw.length > selectedCountry.localLen) return;

    setDigits(raw);
    setFormatted(formatPhone(raw, selectedCountry));

    const op = detectOperator(raw, selectedCountry);
    setOperator(op as any);

    // Shake + erreur si préfixe invalide (MG uniquement)
    const significantLen = raw.startsWith("0") ? 3 : 2;
    if (selectedCountry.code === "MG" && raw.length >= significantLen && op === "invalid") {
      triggerShake();
      setError(t("invalidPrefix", "Préfixe invalide : 032 / 033 / 034 / 038"));
    } else {
      setError("");
    }
  };

  // Changer de pays → reset du champ phone (identique à LoginScreen)
  const handleSelectCountry = (country: CountryConfig) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    setDigits("");
    setFormatted("");
    setOperator(null);
    setError("");
  };

  // ===================== BUILD PHONE PAYLOAD =====================
  // Identique à LoginScreen — brut + country_code → AuthController normalise
  const buildPhonePayload = () => ({
    phone: digits,
    country_code: selectedCountry.code,
  });

  // ===================== ROLES =====================
  const toggleRole = (role: "passenger" | "driver") => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // ===================== VALIDATION =====================
  const isPhoneValid =
    (digits.length === selectedCountry.shortLen || digits.length === selectedCountry.localLen) &&
    (selectedCountry.code !== "MG" || operator !== "invalid");

  // ===================== SUBMIT =====================
  /*const handleSignup = async () => {
    if (!nom || !prenom || !isPhoneValid || roles.length === 0) {
      setError(t("fillAllFields", "Veuillez remplir tous les champs."));
      triggerShake();
      return;
    }

    const payload = {
      nom,
      prenom,
      ...buildPhonePayload(), // phone + country_code
      role: roles.includes("passenger") ? "user" : roles[0],
    };

    setLoading(true);

    try {
      const response = await fetch("http://10.0.2.2:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message || t("serverUnavailable", "Serveur inaccessible."));
        triggerShake();
        setLoading(false);
        return;
      }

      const frontendRole: "passenger" | "driver" =
        roles.includes("passenger") ? "passenger" : "driver";

      onSignup({
        firstName: prenom,
        lastName: nom,
        phone: digits,
        roles: [frontendRole],
      });

      //if (frontendRole === "driver") navigation.navigate("DriverHome");
      //else navigation.navigate("PassengerHome");
    } catch {
      setError(t("serverUnavailable", "Serveur inaccessible."));
      triggerShake();
    }

    setLoading(false);
  };
  */

  // ===================== SUBMIT =====================
const handleSignup = async () => {
  // 🔓 DEV MODE - Validation simplifiée
  if (DEV_MODE) {
    // Validation minimale : juste nom, prénom et au moins un rôle
    if (!nom || !prenom || roles.length === 0) {
      setError(t("fillAllFields", "Veuillez remplir tous les champs."));
      triggerShake();
      return;
    }
    
    console.log("🚀 DEV MODE - Signup bypassed with:", { nom, prenom, digits, roles });
    setLoading(true);
    
    setTimeout(() => {
      const mockRole: "passenger" | "driver" = roles.includes("passenger") ? "passenger" : "driver";
      
      // Utiliser le numéro saisi (même invalide) ou un défaut
      const mockPhone = digits || "341234567";
      
      const mockSignupData: SignupData = {
        firstName: prenom,
        lastName: nom,
        phone: mockPhone,
        roles: [mockRole],
      };
      
      console.log("📝 DEV MODE - Mock signup data:", mockSignupData);
      onSignup(mockSignupData);
      setLoading(false);
    }, 500);
    
    return;
  }

  // Code original inchangé...
  const payload = {
    nom,
    prenom,
    ...buildPhonePayload(),
    role: roles.includes("passenger") ? "user" : roles[0],
  };

  setLoading(true);

  try {
    const response = await fetch("http://10.0.2.2:8080/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.message || t("serverUnavailable", "Serveur inaccessible."));
      triggerShake();
      setLoading(false);
      return;
    }

    const frontendRole: "passenger" | "driver" =
      roles.includes("passenger") ? "passenger" : "driver";

    onSignup({
      firstName: prenom,
      lastName: nom,
      phone: digits,
      roles: [frontendRole],
    });
  } catch {
    setError(t("serverUnavailable", "Serveur inaccessible."));
    triggerShake();
  }

  setLoading(false);
};


  const operatorColor = (
    selectedCountry.code === "MG"
      ? { yas: "#e6c026", orange: "#fb923c", airtel: "#ef4444", invalid: "#dc2626", null: "#9ca3af" }
      : { null: "#047857" }
  )[operator ?? "null"] ?? "#047857";

  // maxLength affiché = localLen + espaces
  const maxDisplayLength = selectedCountry.localLen + Math.floor(selectedCountry.localLen / 3);

  // ===================== MODAL SÉLECTEUR PAYS =====================
  // Identique à LoginScreen
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
          <Text style={styles.modalTitle}>Sélectionner un pays</Text>
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

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackToLogin} style={styles.backButton}>
            <ArrowLeft size={26} color="#111" />
          </TouchableOpacity>
        </View>

        {/* LOGO */}
        <View style={styles.logoContainer}>
          <Logo fontSize={64} variant="light" />
          <Text style={styles.title}>{t("createAccount", "Créer un compte")}</Text>
        </View>

        {/* FORM */}
        <Animated.View style={[styles.formContainer, { transform: [{ translateX: shakeAnim }] }]}>

          <Text style={styles.label}>{t("firstName", "Prénom")}</Text>
          <TextInput
            value={prenom}
            onChangeText={setPrenom}
            placeholder={t("firstNamePlaceholder", "Votre prénom")}
            style={styles.input}
          />

          <Text style={styles.label}>{t("lastName", "Nom")}</Text>
          <TextInput
            value={nom}
            onChangeText={setNom}
            placeholder={t("lastNamePlaceholder", "Votre nom")}
            style={styles.input}
          />

          {/* ── Champ phone — même structure que LoginScreen ── */}
          <Text style={styles.label}>{t("phoneLabel", "Numéro de téléphone")}</Text>
          <View style={[styles.phoneWrapper, { borderColor: operatorColor }]}>

            {/* Bouton drapeau + prefix */}
            <TouchableOpacity
              style={styles.countrySelector}
              onPress={() => setShowCountryPicker(true)}
              disabled={loading}
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
              placeholder={selectedCountry.code === "MG" ? "034 12 345 67" : t("phonePlaceholder", "Numéro")}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              maxLength={maxDisplayLength}
              editable={!loading}
            />
          </View>

          {/* Hint deux formats acceptés (MG, champ vide) */}
          {selectedCountry.code === "MG" && digits.length === 0 && (
            <Text style={styles.hintText}>
              Formats acceptés :{" "}
              <Text style={{ fontWeight: "700", color: "#6b7280" }}>034 12 345 67</Text>
              {"  ou  "}
              <Text style={{ fontWeight: "700", color: "#6b7280" }}>34 12 345 67</Text>
            </Text>
          )}

          {/* Badge opérateur (MG uniquement) */}
          {selectedCountry.code === "MG" && operator && operator !== "invalid" && (
            <Text style={[styles.operatorBadge, { color: operatorColor }]}>
              ➜ {t("operator", "Opérateur")} :{" "}
              {{ yas: "📶 Telma (YAS)", orange: "🟠 Orange", airtel: "🔴 Airtel" }[operator]}
            </Text>
          )}

          {/* Message d'erreur */}
          {error !== "" && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* ROLES */}
          <Text style={[styles.label, { marginTop: 20 }]}>{t("youAre", "Vous êtes…")}</Text>
          <View style={styles.rolesRow}>
            <TouchableOpacity
              onPress={() => toggleRole("passenger")}
              style={[styles.roleCard, roles.includes("passenger") && styles.roleActive]}
            >
              <User size={30} color={roles.includes("passenger") ? "#065f46" : "#6b7280"} />
              <Text style={styles.roleLabel}>{t("passenger", "Passager")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleRole("driver")}
              style={[styles.roleCard, roles.includes("driver") && styles.roleActive]}
            >
              <UserCog size={30} color={roles.includes("driver") ? "#065f46" : "#6b7280"} />
              <Text style={styles.roleLabel}>{t("driver", "Conducteur")}</Text>
            </TouchableOpacity>
          </View>

          {/* LINK TO LOGIN */}
          <TouchableOpacity onPress={onBackToLogin} style={{ alignSelf: "center", marginTop: 18, marginBottom: 6 }}>
            <Text style={styles.loginLink}>
              {t("alreadyHaveAccount", "Déjà un compte ?")}{" "}
              <Text style={styles.loginLinkBold}>{t("loginButton", "Se connecter")}</Text>
            </Text>
          </TouchableOpacity>

          {/* SUBMIT */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={!isPhoneValid || roles.length === 0}
            style={[
              styles.button,
              { backgroundColor: isPhoneValid && roles.length > 0 ? "#10b981" : "#9ca3af" },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                {t("createAccount", "Créer mon compte")}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* SECURITY */}
        <View style={styles.securityBox}>
          <Shield size={22} color="#059669" />
          <Text style={{ color: "#047857" }}>{t("secureSignupNote")}</Text>
        </View>
      </ScrollView>

      {/* Modal sélecteur pays */}
      <CountryPickerModal />
    </KeyboardAvoidingView>
  );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
  header: { position: "absolute", top: 40, left: 20, zIndex: 20 },
  backButton: {
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  logoContainer: { alignItems: "center", marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", marginTop: 16 },
  loginLink: { color: "#6b7280", fontSize: 14, fontWeight: "500" },
  loginLinkBold: { color: "#047857", fontWeight: "700" },
  formContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 24,
    padding: 26,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
  },
  label: { fontSize: 15, fontWeight: "600", color: "#111827", marginTop: 10 },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: "#fafafa",
    marginBottom: 14,
  },

  // ── Phone wrapper — identique à LoginScreen ──
  phoneWrapper: {
    borderWidth: 1.5,
    borderRadius: 16,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    overflow: "hidden",
    marginTop: 8,
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
    fontWeight: "500",
    color: "#111",
    letterSpacing: 1,
  },

  // ── Hint & badges ──
  hintText: { fontSize: 11, color: "#9ca3af", marginTop: 5, marginLeft: 4 },
  operatorBadge: { fontSize: 13, fontWeight: "600", marginTop: 6, marginLeft: 4 },
  errorText: { marginTop: 8, color: "#dc2626", fontWeight: "600", fontSize: 13 },

  // ── Roles ──
  rolesRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  roleCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  roleActive: { backgroundColor: "#e0f2fe", borderColor: "#0284c7" },
  roleLabel: { marginTop: 6, fontWeight: "600", color: "#0c4a6e" },

  button: {
    marginTop: 28,
    height: 54,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
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

  // ── Modal pays — identique à LoginScreen ──
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

