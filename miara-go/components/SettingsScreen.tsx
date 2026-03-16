import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Switch,
  Modal,
  Linking,
  Share,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface SettingItem {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon?: string;
  type?: "toggle" | "link" | "language" | "contact" | "share";
  section: "account" | "preferences" | "support";
}

interface Props {
  onBack: () => void;
  onNavigate?: (route: string) => void;
}

/* ================= SETTINGS ================= */

const SETTINGS_DATA: SettingItem[] = [
  {
    id: "account",
    titleKey: "settingsSection.account.title",
    descriptionKey: "settingsSection.account.description",
    icon: "user",
    type: "link",
    section: "account",
  },
  {
    id: "notifications",
    titleKey: "settingsSection.notifications.title",
    descriptionKey: "settingsSection.notifications.description",
    icon: "bell",
    type: "toggle",
    section: "preferences",
  },
  {
    id: "privacy",
    titleKey: "settingsSection.privacy.title",
    descriptionKey: "settingsSection.privacy.description",
    icon: "shield",
    type: "link",
    section: "preferences",
  },
  {
    id: "language",
    titleKey: "settingsSection.language.title",
    descriptionKey: "settingsSection.language.description",
    icon: "globe",
    type: "language",
    section: "preferences",
  },

  /* SUPPORT */

  {
    id: "contact",
    titleKey: "settingsSection.contact.title",
    descriptionKey: "settingsSection.contact.description",
    icon: "phone",
    type: "contact",
    section: "support",
  },

  {
    id: "invite",
    titleKey: "settingsSection.invite.title",
    descriptionKey: "settingsSection.invite.description",
    icon: "share-2",
    type: "share",
    section: "support",
  },

  {
    id: "help",
    titleKey: "help",
    icon: "help-circle",
    type: "link",
    section: "support",
  },
];

export default function SettingsScreen({ onBack, onNavigate }: Props) {
  const { t, i18n } = useTranslation();

  const [sections, setSections] = useState<SettingItem[]>([]);
  const [languageModal, setLanguageModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);

  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({
    notifications: true,
  });

  useEffect(() => {
    setSections(SETTINGS_DATA);
  }, []);

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageModal(false);
  };

  /* ================= CONTACT SUPPORT ================= */

  const callSupport = () => {
    Linking.openURL("tel:+261340000000");
    setContactModal(false);
  };

  const whatsappSupport = () => {
    Linking.openURL("https://wa.me/261340000000");
    setContactModal(false);
  };

  /* ================= SHARE APP ================= */

  const shareApp = async () => {
  try {
    await Share.share({
      message: t("supportActions.inviteMessage"),
    });
  } catch (error) {
    console.log("Share error", error);
  }
};

  const handlePress = (item: SettingItem) => {
    if (item.type === "link" && onNavigate) {
      onNavigate(item.id);
    } else if (item.type === "toggle") {
      handleToggle(item.id);
    } else if (item.type === "language") {
      setLanguageModal(true);
    } else if (item.type === "contact") {
      setContactModal(true);
    } else if (item.type === "share") {
      shareApp();
    }
  };

  const renderSectionTitle = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderItem = useCallback(
    ({ item }: { item: SettingItem }) => (
      <TouchableOpacity
        onPress={() => handlePress(item)}
        style={styles.card}
        activeOpacity={0.7}
      >
        <View style={styles.row}>
          {item.icon && (
            <View style={styles.iconContainer}>
              <Feather name={item.icon as any} size={20} color="#047857" />
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t(item.titleKey)}</Text>
            {item.descriptionKey && (
              <Text style={styles.description}>{t(item.descriptionKey)}</Text>
            )}
          </View>

          {item.type === "toggle" && (
            <Switch
              value={toggles[item.id]}
              onValueChange={() => handleToggle(item.id)}
              trackColor={{ false: "#D1D5DB", true: "#34D399" }}
              thumbColor="#FFFFFF"
            />
          )}

          {(item.type === "link" ||
            item.type === "language" ||
            item.type === "contact" ||
            item.type === "share") && (
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          )}
        </View>
      </TouchableOpacity>
    ),
    [t, toggles]
  );

  const groupedSections = {
    account: sections.filter((s) => s.section === "account"),
    preferences: sections.filter((s) => s.section === "preferences"),
    support: sections.filter((s) => s.section === "support"),
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("settings")}</Text>

        <View style={{ width: 24 }} />
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {renderSectionTitle(t("principal"))}
            {groupedSections.account.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}

            {renderSectionTitle(t("settings"))}
            {groupedSections.preferences.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}

            {renderSectionTitle(t("support"))}
            {groupedSections.support.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}
          </>
        }
        data={[]}
        renderItem={null as any}
      />

      {/* LANGUAGE MODAL */}

      <Modal visible={languageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {t("settingsSection.language.title")}
            </Text>

            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => handleLanguageChange("fr")}
            >
              <Text style={styles.langText}>🇫🇷 Français</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => handleLanguageChange("en")}
            >
              <Text style={styles.langText}>🇬🇧 English</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.langBtn}
              onPress={() => handleLanguageChange("mg")}
            >
              <Text style={styles.langText}>🇲🇬 Malagasy</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLanguageModal(false)}>
              <Text style={styles.cancel}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONTACT SUPPORT MODAL */}

      <Modal visible={contactModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>

             <Text style={styles.modalTitle}>{t("supportActions.chooseContact")}</Text>

            <TouchableOpacity style={styles.langBtn} onPress={callSupport}>
              <Text style={styles.langText}>📞 {t("supportActions.callSupport")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.langBtn} onPress={whatsappSupport}>
              <Text style={styles.langText}>💬 {t("supportActions.whatsappSupport")}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setContactModal(false)}>
              <Text style={styles.cancel}>{t("cancel")}</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#047857",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7281",
    marginTop: 25,
    marginBottom: 10,
    marginLeft: 16,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  description: {
    fontSize: 13,
    color: "#6B7281",
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    backgroundColor: "white",
    width: "85%",
    borderRadius: 20,
    padding: 25,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  langBtn: {
    paddingVertical: 12,
  },

  langText: {
    fontSize: 16,
  },

  cancel: {
    marginTop: 15,
    textAlign: "center",
    color: "#EF4444",
    fontWeight: "600",
  },
});
