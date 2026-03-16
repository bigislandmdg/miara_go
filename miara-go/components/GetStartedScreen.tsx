// GetStartedScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import * as Localization from "expo-localization";
import CountryFlag from "react-native-country-flag";
import { ChevronLeft, LanguagesIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../providers/LanguageProvider";
import { Logo } from "./ui/logo";
import { ChevronRight } from "react-native-feather";

const { height } = Dimensions.get("window");
const SHEET_HEIGHT = height * 0.41;
const LANG_SHEET_HEIGHT = height * 0.25;

interface GetStartedScreenProps {
  onSignup: () => void;
  onLogin: () => void;
}

export function GetStartedScreen({ onSignup, onLogin }: GetStartedScreenProps) {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const [visible, setVisible] = useState(false);
  const [langVisible, setLangVisible] = useState(false);

  /* ===================== 🌍 AUTO LOCALE ===================== */
  useEffect(() => {
    if (!language) {
      const locales = Localization.getLocales();
      const detected = locales?.[0]?.languageCode ?? "fr";
      if (["fr", "en", "mg"].includes(detected)) {
        changeLanguage(detected);
      } else {
        changeLanguage("fr");
      }
    }
  }, []);

  /* ===================== ANIMATIONS ===================== */
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const langTranslateY = useRef(new Animated.Value(LANG_SHEET_HEIGHT)).current;
  const langBackdropOpacity = useRef(new Animated.Value(0)).current;

  /* ===================== MAIN SHEET ===================== */
  const openSheet = () => {
    setVisible(true);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: SHEET_HEIGHT, damping: 20, stiffness: 180, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  /* ===================== LANGUAGE SHEET ===================== */
  const openLangSheet = () => {
    setLangVisible(true);
    Animated.parallel([
      Animated.spring(langTranslateY, { toValue: 0, damping: 18, stiffness: 160, useNativeDriver: true }),
      Animated.timing(langBackdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeLangSheet = () => {
    Animated.parallel([
      Animated.spring(langTranslateY, { toValue: LANG_SHEET_HEIGHT, damping: 20, stiffness: 180, useNativeDriver: true }),
      Animated.timing(langBackdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setLangVisible(false));
  };

  /* ===================== SWIPE ===================== */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove: (_, g) => g.dy > 0 && translateY.setValue(g.dy),
      onPanResponderRelease: (_, g) =>
        g.dy > 120 || g.vy > 1.4
          ? closeSheet()
          : Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(),
    })
  ).current;

  const panLangResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6,
      onPanResponderMove: (_, g) => g.dy > 0 && langTranslateY.setValue(g.dy),
      onPanResponderRelease: (_, g) =>
        g.dy > 90 || g.vy > 1.4
          ? closeLangSheet()
          : Animated.spring(langTranslateY, { toValue: 0, useNativeDriver: true }).start(),
    })
  ).current;

  /* ===================== UI ===================== */
  return (
    <View style={styles.container}>
      {/* ===== HERO ===== */}
      <View style={styles.hero}>
        <View style={styles.center}>
          <Logo fontSize={82} variant="light" />
          <Text style={styles.title}>{t("appName")}</Text>
          <Text style={styles.subtitle}>{t("tagline")}</Text>

          <TouchableOpacity onPress={openLangSheet} style={styles.langButton}>
            <LanguagesIcon size={24} color="#059669" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity  onPress={openSheet} style={styles.startButton} activeOpacity={0.85}>
            <View style={styles.startContent}>
              <Text style={styles.startText}>{t("start")}</Text>
              <ChevronRight color="#059669" />
            </View>
        </TouchableOpacity>
      </View>

      {/* ===================== MAIN BOTTOM SHEET ===================== */}
      <Modal transparent visible={visible} animationType="none">
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeSheet} />
        </Animated.View>

         <Animated.View
           {...panResponder.panHandlers}
            style={[styles.sheet, { transform: [{ translateY }] }]}
         >
         <View style={styles.handle} />

          {/* 🔥 LOGO + TEXTE */}
          <View style={styles.brandingContainer}>
          <Logo fontSize={40}/>
          {/* adapte la prop selon ton composant: size, width, fontSize, etc */}

            <Text style={styles.subtitle}>
              {t("welcomeSubtitle")}
            </Text>
          </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={onSignup}>
        <View style={styles.btnContent}>
          <Text style={styles.primaryText}>
            {t("createAccountTitle")}
           </Text>
           <ChevronRight  color="#059669" />
          </View>
        </TouchableOpacity>

       {/* 🔥 DIVIDER */}
      <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
      <View style={styles.dividerLine} />
</View>

   <TouchableOpacity style={styles.secondaryBtn} onPress={onLogin}>
  <View style={styles.btnContent}>
    <Text style={styles.secondaryText}>
      {t("loginButtonTitle")}
    </Text>
    <ChevronRight  color="#059669" />
  </View>
</TouchableOpacity>
</Animated.View>

      </Modal>

      {/* ===================== LANGUAGE SHEET ===================== */}
      <Modal transparent visible={langVisible} animationType="none">
        <Animated.View style={[styles.backdrop, { opacity: langBackdropOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeLangSheet} />
        </Animated.View>

        <Animated.View
          {...panLangResponder.panHandlers}
          style={[styles.langSheet, { transform: [{ translateY: langTranslateY }] }]}
        >
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{t("chooseLanguage")}</Text>

          {[
            { code: "mg", label: "Malagasy", iso: "MG" },
            { code: "fr", label: "Français", iso: "FR" },
            { code: "en", label: "English", iso: "US" },
          ].map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.langRow}
              onPress={() => {
                changeLanguage(lang.code);
                closeLangSheet();
              }}
            >
              <CountryFlag isoCode={lang.iso} size={22} />
              <Text style={[styles.langText, language === lang.code && styles.langActive]}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Modal>
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECFDF5" },
  hero: { flex: 1, padding: 40, justifyContent: "space-between", alignItems: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { marginTop: 18, fontSize: 32, fontWeight: "800", color: "#064E3B" },
  subtitle: { marginTop: 12, fontSize: 15, color: "#065F46", textAlign: "center", maxWidth: 300 },
  langButton: { position: "absolute", top: -20, right: -20, padding: 8 },
  startButton: { paddingVertical: 16, paddingHorizontal: 64 },
  startText: { fontSize: 18, fontWeight: "900", color: "#059669" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { position: "absolute", bottom: 0, width: "100%", height: SHEET_HEIGHT, backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  langSheet: { position: "absolute", bottom: 0, width: "100%", height: LANG_SHEET_HEIGHT, backgroundColor: "#FFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: "#CBD5E1", alignSelf: "center", marginBottom: 16 },
  primaryBtn: { height: 56, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  primaryText: { color: "#059669", fontSize: 16, fontWeight: "800" },
  secondaryBtn: { height: 56, justifyContent: "center", alignItems: "center" },
  secondaryText: { color: "#059669", fontSize: 16, fontWeight: "800" },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: "#064E3B", textAlign: "center", marginBottom: 12 },
  langRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  langText: { fontSize: 16, color: "#065F46", fontWeight: "600" },
  langActive: { color: "#059669", fontWeight: "800" },
  brandingContainer: {
  alignItems: "center",
  marginBottom: 24,
  paddingHorizontal: 20,
  
},

btnContent: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

dividerContainer: {
  flexDirection: "row",
  alignItems: "center",
  marginVertical: 13,
},

dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: "#E5E7EB",
},

startContent: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
},


});
