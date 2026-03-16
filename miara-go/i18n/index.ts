import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { resources } from "./resources";

export const LANGUAGE_KEY = "APP_LANGUAGE";

/* ===================== LANGUAGE DETECTOR ===================== */
const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      callback(savedLang || "fr");
    } catch {
      callback("fr");
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  },
};

/* ===================== I18N INIT ===================== */
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // important pour React Native
    },
  });

export default i18n;
