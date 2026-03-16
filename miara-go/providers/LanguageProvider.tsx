// LanguageProvider.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import i18n from "../i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { LANGUAGE_KEY } from "../i18n";

type LangContextType = {
  language: string;
  changeLanguage: (lang: string) => Promise<void>;
};

const LanguageContext = createContext<LangContextType>({
  language: "fr",
  changeLanguage: async () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(i18n.language || "fr");

  // ---------------- AUTO DETECTION LANGUE DU DEVICE ----------------
  useEffect(() => {
    (async () => {
      try {
        // Vérifier si on a déjà une langue stockée
        const storedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (storedLang) {
          await changeLanguage(storedLang);
          return;
        }

        // Sinon détecter la langue du device via Expo Localization
        const locales = Localization.getLocales();
        const deviceLang = locales?.[0]?.languageCode || "fr";

        // Vérifier si la langue est supportée
        const validLangs = ["fr", "en", "mg"];
        const detectedLang = validLangs.includes(deviceLang) ? deviceLang : "fr";

        await changeLanguage(detectedLang);
      } catch (e) {
        console.log("LanguageProvider error:", e);
        await changeLanguage("fr"); // fallback
      }
    })();
  }, []);

  // ---------------- CHANGE LANGUAGE ----------------
  const changeLanguage = async (lang: string) => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setLanguage(lang);
    } catch (e) {
      console.log("Erreur lors du changement de langue:", e);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ---------------- HOOK POUR UTILISER LA LANGUE ----------------
export const useLanguage = () => useContext(LanguageContext);
