import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { 
  Info, 
  CheckCircle, 
  Shield, 
  Mail, 
  ChevronRight,
  Phone,
  Globe,
  MessageCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

/* ===================== TYPES ===================== */
interface AboutSection {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon?: string;
  type?: "info" | "features" | "security" | "contact";
  content?: string;
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
    type: "info",
    content: "aboutSection.miaraGo.content",
  },
  {
    id: "2",
    titleKey: "aboutSection.features.title",
    descriptionKey: "aboutSection.features.description",
    icon: "check-circle",
    type: "features",
    content: "aboutSection.features.content",
  },
  {
    id: "3",
    titleKey: "aboutSection.security.title",
    descriptionKey: "aboutSection.security.description",
    icon: "shield",
    type: "security",
    content: "aboutSection.security.content",
  },
  {
    id: "4",
    titleKey: "aboutSection.contact.title",
    descriptionKey: "aboutSection.contact.description",
    icon: "mail",
    type: "contact",
    content: "aboutSection.contact.content",
  },
];

/* ===================== COMPONENT ===================== */
export default function AboutScreen({ onBack }: Props) {
  const { t } = useTranslation();
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [infoModal, setInfoModal] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<{ title: string; content: string } | null>(null);
  const [contactModal, setContactModal] = useState(false);

  useEffect(() => {
    setSections(ABOUT_DATA);
  }, []);

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

  const openWebsite = () => {
    Linking.openURL("https://miarago.com");
    setContactModal(false);
  };

  /* ================= INFO MODALS ================= */
  const showMiaraGoInfo = () => {
    setSelectedInfo({
      title: t("aboutSection.miaraGo.title"),
      content: t("aboutSection.miaraGo.content") + "\n\n" +
        "🚀 " + t("abouts.mission") + "\n" +
        "• " + t("abouts.missionDesc") + "\n\n" +
        "🎯 " + t("abouts.vision") + "\n" +
        "• " + t("abouts.visionDesc") + "\n\n" +
        "📅 " + t("abouts.founded") + ": 2024",
    });
    setInfoModal(true);
  };

  const showFeatures = () => {
    setSelectedInfo({
      title: t("aboutSection.features.title"),
      content: t("aboutSection.features.content") + "\n\n" +
        "✅ " + t("features.feature1") + "\n" +
        "• " + t("features.feature1Desc") + "\n\n" +
        "✅ " + t("features.feature2") + "\n" +
        "• " + t("features.feature2Desc") + "\n\n" +
        "✅ " + t("features.feature3") + "\n" +
        "• " + t("features.feature3Desc") + "\n\n" +
        "✅ " + t("features.feature4") + "\n" +
        "• " + t("features.feature4Desc"),
    });
    setInfoModal(true);
  };

  const showSecurity = () => {
    setSelectedInfo({
      title: t("aboutSection.security.title"),
      content: t("aboutSection.security.content") + "\n\n" +
        "🔒 " + t("securities.security1") + "\n" +
        "• " + t("securities.security1Desc") + "\n\n" +
        "🔐 " + t("securities.security2") + "\n" +
        "• " + t("securities.security2Desc") + "\n\n" +
        "🛡️ " + t("securities.security3") + "\n" +
        "• " + t("securities.security3Desc") + "\n\n" +
        "📊 " + t("securities.security4") + "\n" +
        "• " + t("securities.security4Desc"),
    });
    setInfoModal(true);
  };

  const handlePress = (item: AboutSection) => {
    if (item.type === "contact") {
      setContactModal(true);
    } else if (item.type === "info") {
      showMiaraGoInfo();
    } else if (item.type === "features") {
      showFeatures();
    } else if (item.type === "security") {
      showSecurity();
    }
  };

  /* ===================== RENDER ITEM ===================== */
  const renderItem = useCallback(
    ({ item }: { item: AboutSection }) => {
      return (
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={() => handlePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <Feather name={item.icon as any} size={22} color="#047857" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{t(item.titleKey)}</Text>
                <Text style={styles.description}>{t(item.descriptionKey)}</Text>
                <View style={styles.infoRow}>
                  <Info size={12} color="#9CA3AF" />
                  <Text style={styles.infoText}>{t("tapForMore")}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [t]
  );

  /* ===================== UI ===================== */
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

        <Text style={styles.headerTitle}>{t("about")}</Text>

        <View style={{ width: 40 }} />
      </LinearGradient>

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

      {/* CONTACT MODAL */}
      <Modal visible={contactModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("aboutSection.contact.title")}</Text>

            <TouchableOpacity style={styles.modalItem} onPress={callSupport}>
              <Phone size={20} color="#047857" />
              <Text style={styles.modalItemText}> 📞 {t("supportActions.callSupport")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalItem} onPress={whatsappSupport}>
              <MessageCircle size={20} color="#047857" />
              <Text style={styles.modalItemText}> 💬 {t("supportActions.whatsappSupport")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalItem} onPress={emailSupport}>
              <Mail size={20} color="#047857" />
              <Text style={styles.modalItemText}> 📧 {t("supportActions.emailSupport")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalItem} onPress={openWebsite}>
              <Globe size={20} color="#047857" />
              <Text style={styles.modalItemText}> 🌐 {t("supportActions.website")}</Text>
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

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },

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
    alignItems: "center",
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
    marginBottom: 4,
  },

  description: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },

  infoText: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#6B7280",
    fontSize: 14,
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
    maxHeight: "80%",
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
    maxHeight: 400,
    marginBottom: 20,
  },

  infoContentText: {
    fontSize: 15,
    lineHeight: 24,
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
