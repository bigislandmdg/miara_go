import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../providers/LanguageProvider";

/* ===================== TYPES ===================== */
export type MainView =
  | "home"
  | "trip"
  | "publish"
  | "wallet"
  | "profile"
  | "notifications"
  | "booking"
  | "history"
  | "search-results"
  | "rating"
  | "about"
  | "settings"
  | "help"
  | "rideRequests"
  | "chat";

interface NavigationProps {
  userType: "passenger" | "driver" | null;
  currentView: MainView;
  onViewChange: (view: MainView) => void;
  onLogout: () => void;
  userCredits?: number;
  userName?: string;
}

/* ===================== COMPONENT ===================== */
export function Navigation({
  userType,
  currentView,
  onViewChange,
  onLogout,
  userCredits = 0,
  userName,
}: NavigationProps) {
  const [showPlusModal, setShowPlusModal] = useState(false);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;

  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const avatarLetter = userName
    ? userName.trim().charAt(0).toUpperCase()
    : null;

  /* ===================== SAFE NAVIGATION ===================== */
  const safeNavigate = (view: MainView) => {
    if (!view) return;
    onViewChange(view);
  };

  /* ===================== TABS ===================== */
  const passengerTabs: { id: MainView; label: string; icon: any }[] = [
    { id: "home", label: t("home", "Accueil"), icon: "home" },
    { id: "history", label: t("history", "Historique"), icon: "clock" },
  ];

  const driverTabs: { id: MainView; label: string; icon: any }[] = [
    { id: "home", label: t("trips", "Trajets"), icon: "truck" },
    { id: "wallet", label: t("wallet", "Wallet"), icon: "credit-card" },
    { id: "rating", label: t("rating", "Notes"), icon: "star" },
  ];

  const tabs =
    userType === "passenger"
      ? passengerTabs
      : userType === "driver"
      ? driverTabs
      : [];

  const leftTabs = tabs.slice(0, Math.ceil(tabs.length / 2));
  const rightTabs = tabs.slice(Math.ceil(tabs.length / 2));

  const showPlusButton = userType === "driver";

  /* ===================== MODAL ===================== */
  const openModal = () => {
    setShowPlusModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get("window").height,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setShowPlusModal(false));
  };

  const renderTab = (tab: { id: MainView; label: string; icon: any }) => {
    const isActive = currentView === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        style={styles.navButton}
        onPress={() => safeNavigate(tab.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconPill, isActive && styles.iconPillActive]}>
          <Feather
            name={tab.icon}
            size={22}
            color={isActive ? "#fff" : "#6B7280"}
          />
        </View>
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* ===================== BOTTOM NAV ===================== */}
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.navContainer}>
          {leftTabs.map(renderTab)}

          {showPlusButton && (
            <TouchableOpacity
              style={styles.plusButton}
              onPress={openModal}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={30} color="#fff" />
            </TouchableOpacity>
          )}

          {rightTabs.map(renderTab)}

          {/* PROFILE */}
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => safeNavigate("profile")}
          >
            <View
              style={[
                styles.avatarPill,
                currentView === "profile" && styles.avatarActive,
              ]}
            >
              {avatarLetter ? (
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              ) : (
                <Feather
                  name="user"
                  size={20}
                  color={currentView === "profile" ? "#fff" : "#6B7280"}
                />
              )}
            </View>
            <Text
              style={[
                styles.label,
                currentView === "profile" && styles.labelActive,
              ]}
            >
              {t("profile", "Profil")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ===================== PLUS MODAL ===================== */}
      <Modal visible={showPlusModal} transparent animationType="none">
        <Pressable style={styles.modalOverlay} onPress={closeModal} />

        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.modalTitle}>
            {t("quickActions", "Action rapide")}
          </Text>

          <View style={styles.grid}>
            {/* Seul bouton "Créer un trajet" */}
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => {
                closeModal();
                safeNavigate("trip");
              }}
            >
              <View style={styles.iconCircle}>
                <Feather name="map-pin" size={26} color="#047857" />
              </View>
              <Text style={styles.gridText}>
                {t("createTrip", "Créer un trajet")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  safeArea: { backgroundColor: "#fff" },
  navContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 6,
  },
  navButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
  },
  iconPillActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  label: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  labelActive: { color: "#059669", fontWeight: "600" },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 24,
    backgroundColor: "#047857",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -52,
    shadowColor: "#047857",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 20,
  },
  avatarPill: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarActive: { backgroundColor: "#059669" },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 30,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 12,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  grid: { flexDirection: "row", justifyContent: "space-around" },
  gridItem: { alignItems: "center", width: 120 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridText: { fontSize: 13, fontWeight: "500", color: "#047857" },
});

