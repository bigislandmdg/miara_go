import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

/* ===================== TYPES ===================== */
interface AboutSection {
  id: string;
  titleKey: string;       // 🔹 clé de traduction
  descriptionKey: string; // 🔹 clé de traduction
  icon?: string;
}

interface Props {
  onBack: () => void;
}

/* ===================== DATA ===================== */
const ABOUT_DATA: AboutSection[] = [
  {
    id: "1",
    titleKey: "aboutSection.miaraGo.title",
    descriptionKey: "aboutSection.miaraGo.description",
    icon: "info",
  },
  {
    id: "2",
    titleKey: "aboutSection.features.title",
    descriptionKey: "aboutSection.features.description",
    icon: "check-circle",
  },
  {
    id: "3",
    titleKey: "aboutSection.security.title",
    descriptionKey: "aboutSection.security.description",
    icon: "shield",
  },
  {
    id: "4",
    titleKey: "aboutSection.contact.title",
    descriptionKey: "aboutSection.contact.description",
    icon: "mail",
  },
];

/* ===================== COMPONENT ===================== */
export default function AboutScreen({ onBack }: Props) {
  const { t } = useTranslation();
  const [sections, setSections] = useState<AboutSection[]>([]);

   // Récupère les sections traduites depuis i18n
  const aboutSections = t("aboutSections", { returnObjects: true });

  useEffect(() => {
    // Simuler un fetch si besoin
    setSections(ABOUT_DATA);
  }, []);

  /* ===================== RENDER ITEM ===================== */
  const renderItem = useCallback(
    ({ item }: { item: AboutSection }) => {
      return (
        <View style={styles.cardWrapper}>
          <View style={styles.card}>
            <View style={styles.row}>
              {item.icon && (
                <View style={styles.iconContainer}>
                  <Feather name={item.icon as any} size={22} color="#047857" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t(item.titleKey)}</Text>
                <Text style={styles.description}>{t(item.descriptionKey)}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [t]
  );

  /* ===================== UI ===================== */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("about")}</Text>

        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("noContent")}</Text>
        }
      />
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#047857",
    elevation: 6,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },

  listContent: {
    padding: 16,
    paddingBottom: 30,
  },

  cardWrapper: {
    marginBottom: 14,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  description: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#6B7281",
    fontSize: 14,
  },
});