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
  Alert,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Bell, 
  Globe, 
  HelpCircle, 
  Share2, 
  ChevronRight,
  Info,
  Star,
  Clock,
  Award,
  MapPin,
  CreditCard,
  Lock,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const API_BASE = "http://10.0.2.2:8080";

interface SettingItem {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  icon?: string;
  type?: "toggle" | "link" | "language" | "contact" | "share" | "info";
  section: "account" | "preferences" | "support";
  info?: string;
}

interface Props {
  onBack: () => void;
  onNavigate?: (route: string) => void;
}

interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  phone: string;
  role: string;
  email?: string;
  avatar?: string;
  rating?: number;
  trips_count?: number;
  member_since?: string;
}

/* ================= SETTINGS ================= */

const SETTINGS_DATA: SettingItem[] = [
  // ACCOUNT
  {
    id: "personalInfo",
    titleKey: "personalInfo",
    descriptionKey: "Vos informations personnelles",
    icon: "user",
    type: "info",
    section: "account",
    info: "Voir mes informations",
  },
  {
    id: "paymentMethods",
    titleKey: "paymentMethods",
    descriptionKey: "Gérez vos moyens de paiement",
    icon: "credit-card",
    type: "info",
    section: "account",
    info: "Cartes, Mobile Money, espèces",
  },
  {
    id: "savedPlaces",
    titleKey: "savedPlaces",
    descriptionKey: "Domicile, Travail, Lieux favoris",
    icon: "map-pin",
    type: "info",
    section: "account",
    info: "2 lieux enregistrés",
  },

  // PREFERENCES
  {
    id: "notifications",
    titleKey: "notifications",
    descriptionKey: "Alertes et rappels",
    icon: "bell",
    type: "toggle",
    section: "preferences",
  },
  {
    id: "privacy",
    titleKey: "privacyPolicy",
    descriptionKey: "Comment nous protégeons vos données",
    icon: "shield",
    type: "info",
    section: "preferences",
    info: "Chiffrement, RGPD",
  },
  {
    id: "security",
    titleKey: "security",
    descriptionKey: "Authentification à deux facteurs",
    icon: "lock",
    type: "info",
    section: "preferences",
    info: "Sécurisez votre compte",
  },
  {
    id: "language",
    titleKey: "language",
    descriptionKey: "Français, English, Malagasy",
    icon: "globe",
    type: "language",
    section: "preferences",
  },

  // SUPPORT
  {
    id: "help",
    titleKey: "helpCenter",
    descriptionKey: "FAQ, tutoriels, assistance",
    icon: "help-circle",
    type: "info",
    section: "support",
    info: "support@miarago.com",
  },
  {
    id: "contact",
    titleKey: "contact",
    descriptionKey: "Contactez-nous",
    icon: "phone",
    type: "contact",
    section: "support",
  },
  {
    id: "invite",
    titleKey: "invite",
    descriptionKey: "Partagez MiaraGo avec vos amis",
    icon: "share-2",
    type: "share",
    section: "support",
  },
];

export default function SettingsScreen({ onBack, onNavigate }: Props) {
  const { t, i18n } = useTranslation();

  const [sections, setSections] = useState<SettingItem[]>([]);
  const [languageModal, setLanguageModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [infoModal, setInfoModal] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<{ title: string; content: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({
    notifications: true,
  });

  useEffect(() => {
    setSections(SETTINGS_DATA);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setProfile(user);
      }
    } catch (e) {
      console.log("Error loading profile", e);
    }
  };

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

  const emailSupport = () => {
    Linking.openURL("mailto:support@miarago.com");
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

  /* ================= INFO MODALS ================= */
  const showPersonalInfo = () => {
    if (!profile) return;
    setSelectedInfo({
      title: t("personalInfo"),
      content: `${t("name")}: ${profile.prenom} ${profile.nom}\n${t("phone")}: ${profile.phone}\n${t("role")}: ${profile.role === "driver" ? t("driver") : t("passenger")}`,
    });
    setInfoModal(true);
  };

  const showPaymentMethods = () => {
    setSelectedInfo({
      title: t("paymentMethods"),
      content: t("paymentMethodsInfo") + "\n\n• Carte bancaire\n• Mobile Money\n• Espèces\n\nAppuyez sur 'Ajouter' pour enregistrer un moyen de paiement",
    });
    setInfoModal(true);
  };

  const showSavedPlaces = () => {
    setSelectedInfo({
      title: t("savedPlaces"),
      content: t("savedPlacesInfo") + "\n\n• Domicile\n• Travail\n• École\n\n2 lieux enregistrés",
    });
    setInfoModal(true);
  };

  const showPrivacyPolicy = () => {
    setSelectedInfo({
      title: t("privacyPolicy"),
      content: t("privacyPolicyInfo"),
    });
    setInfoModal(true);
  };

  const showSecurity = () => {
    setSelectedInfo({
      title: t("security"),
      content: t("securityInfo") + "\n\n• Authentification à deux facteurs\n• Historique des connexions\n• Appareils connectés",
    });
    setInfoModal(true);
  };

  const showHelpCenter = () => {
    setSelectedInfo({
      title: t("helpCenter"),
      content: t("helpCenterInfo") + "\n\n📧 support@miarago.com\n🌐 miarago.com/help",
    });
    setInfoModal(true);
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
    } else if (item.type === "info") {
      switch (item.id) {
        case "personalInfo":
          showPersonalInfo();
          break;
        case "paymentMethods":
          showPaymentMethods();
          break;
        case "savedPlaces":
          showSavedPlaces();
          break;
        case "privacy":
          showPrivacyPolicy();
          break;
        case "security":
          showSecurity();
          break;
        case "help":
          showHelpCenter();
          break;
        default:
          break;
      }
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
          <View style={styles.iconContainer}>
            <Feather name={item.icon as any} size={20} color="#047857" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t(item.titleKey)}</Text>
            {item.descriptionKey && (
              <Text style={styles.description}>{item.descriptionKey}</Text>
            )}
            {item.info && (
              <View style={styles.infoRow}>
                <Info size={12} color="#9CA3AF" />
                <Text style={styles.infoText}>{item.info}</Text>
              </View>
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
            item.type === "share" ||
            item.type === "info") && (
            <ChevronRight size={20} color="#9CA3AF" />
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
      <LinearGradient
        colors={["#047857", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("settings")}</Text>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <FlatList
        ListHeaderComponent={
          <>
            {/* ACCOUNT SECTION */}
            <Text style={styles.sectionTitle}>{t("account")}</Text>
            {groupedSections.account.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}

            {/* PREFERENCES SECTION */}
            <Text style={styles.sectionTitle}>{t("preferences")}</Text>
            {groupedSections.preferences.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}

            {/* SUPPORT SECTION */}
            <Text style={styles.sectionTitle}>{t("support")}</Text>
            {groupedSections.support.map((item) => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}
          </>
        }
        data={[]}
        renderItem={null as any}
        contentContainerStyle={styles.listContent}
      />

      {/* LANGUAGE MODAL */}
      <Modal visible={languageModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("language")}</Text>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleLanguageChange("fr")}
            >
              <Text style={styles.modalItemText}>🇫🇷 Français</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleLanguageChange("en")}
            >
              <Text style={styles.modalItemText}>🇬🇧 English</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => handleLanguageChange("mg")}
            >
              <Text style={styles.modalItemText}>🇲🇬 Malagasy</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setLanguageModal(false)}
            >
              <Text style={styles.cancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONTACT MODAL */}
      <Modal visible={contactModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("contact")}</Text>

            <TouchableOpacity style={styles.modalItem} onPress={callSupport}>
              <Phone size={20} color="#047857" />
              <Text style={styles.modalItemText}> 📞 {t("supportActions.callSupport")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalItem} onPress={whatsappSupport}>
              <Text style={styles.modalItemText}>💬 {t("supportActions.whatsappSupport")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalItem} onPress={emailSupport}>
              <Mail size={20} color="#047857" />
              <Text style={styles.modalItemText}> 📧 {t("supportActions.emailSupport") || "Email"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setContactModal(false)}
            >
              <Text style={styles.cancelText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* INFO MODAL */}
      <Modal visible={infoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.infoModal]}>
            {selectedInfo && (
              <>
                <Text style={styles.modalTitle}>{selectedInfo.title}</Text>
                <ScrollView style={styles.infoContent}>
                  <Text style={styles.infoContentText}>{selectedInfo.content}</Text>
                </ScrollView>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setInfoModal(false)}
                >
                  <Text style={styles.modalButtonText}>{t("ok")}</Text>
                </TouchableOpacity>
              </>
            )}
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },

  listContent: {
    paddingBottom: 30,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 25,
    marginBottom: 10,
    marginLeft: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
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
    color: "#6B7280",
    marginTop: 2,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },

  infoText: {
    fontSize: 12,
    color: "#9CA3AF",
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
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  },

  infoModal: {
    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#111827",
  },

  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },

  modalItemText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },

  modalCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },

  cancelText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },

  infoContent: {
    maxHeight: 300,
    marginBottom: 20,
  },

  infoContentText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },

  modalButton: {
    backgroundColor: "#047857",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },

  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

