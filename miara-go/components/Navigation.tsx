import React, { useRef, useState, memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Pressable,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../providers/LanguageProvider";
import {
  Home,
  Clock,
  CreditCard,
  Star,
  Plus,
  User,
  MapPin,
  X,
  Briefcase,
  Wallet,
  Award,
  Bell,
  Settings,
} from "lucide-react-native";

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
  notificationCount?: number;
  onNotificationPress?: () => void;
}

/* ===================== COMPONENT ===================== */
export const Navigation = memo(({
  userType,
  currentView,
  onViewChange,
  onLogout,
  userCredits = 0,
  userName,
  notificationCount = 0,
  onNotificationPress,
}: NavigationProps) => {
  const [showPlusModal, setShowPlusModal] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();

  const avatarLetter = userName
    ? userName.trim().charAt(0).toUpperCase()
    : null;

  /* ===================== ANIMATIONS ===================== */
  const animatePress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  /* ===================== SAFE NAVIGATION ===================== */
  const safeNavigate = useCallback((view: MainView) => {
    if (!view) return;
    animatePress(() => onViewChange(view));
  }, [onViewChange]);

  /* ===================== TABS ===================== */
  const passengerTabs: { id: MainView; label: string; icon: any; iconName?: string }[] = useMemo(() => [
    { id: "home", label: t("home", "Accueil"), icon: Home },
    { id: "history", label: t("history", "Historique"), icon: Clock },
  ], [t]);

  const driverTabs: { id: MainView; label: string; icon: any; iconName?: string }[] = useMemo(() => [
    { id: "home", label: t("home", "Accueil"), icon: Home },
    { id: "wallet", label: t("wallet", "Portefeuille"), icon: Wallet },
    { id: "rating", label: t("rating", "Évaluations"), icon: Award },
  ], [t]);

  const tabs = useMemo(() => {
    if (userType === "passenger") return passengerTabs;
    if (userType === "driver") return driverTabs;
    return [];
  }, [userType, passengerTabs, driverTabs]);

  const leftTabs = useMemo(() => tabs.slice(0, Math.ceil(tabs.length / 2)), [tabs]);
  const rightTabs = useMemo(() => tabs.slice(Math.ceil(tabs.length / 2)), [tabs]);

  const showPlusButton = userType === "driver";

  /* ===================== MODAL ===================== */
  const openModal = useCallback(() => {
    setShowPlusModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get("window").height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowPlusModal(false));
  }, [slideAnim]);

  /* ===================== RENDER TAB ===================== */
  const renderTab = useCallback((tab: { id: MainView; label: string; icon: any }) => {
    const isActive = currentView === tab.id;
    const IconComponent = tab.icon;
    const isHoveredState = isHovered === tab.id;

    return (
      <TouchableOpacity
        key={tab.id}
        style={[styles.navButton, isActive && styles.navButtonActive]}
        onPress={() => safeNavigate(tab.id)}
        onPressIn={() => setIsHovered(tab.id)}
        onPressOut={() => setIsHovered(null)}
        activeOpacity={0.8}
        accessibilityLabel={tab.label}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Animated.View 
          style={[
            styles.iconContainer,
            isActive && styles.iconContainerActive,
            isHoveredState && styles.iconContainerHovered,
            { transform: [{ scale: isActive ? pulseAnim : 1 }] }
          ]}
        >
          <IconComponent
            size={isActive ? 24 : 22}
            color={isActive ? "#FFFFFF" : "#64748B"}
            strokeWidth={isActive ? 2.2 : 1.8}
            fill={isActive ? "rgba(255,255,255,0.1)" : "none"}
          />
          {isActive && (
            <Animated.View style={[styles.activeDot]} />
          )}
        </Animated.View>
        <Text style={[
          styles.label,
          isActive && styles.labelActive,
          isHoveredState && styles.labelHovered
        ]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  }, [currentView, isHovered, safeNavigate, pulseAnim]);

  /* ===================== RENDER BADGE ===================== */
  const renderBadge = useCallback((count: number) => {
    if (count <= 0) return null;
    return (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>
          {count > 99 ? "99+" : count}
        </Text>
      </View>
    );
  }, []);

  /* ===================== RENDER ===================== */
  return (
    <>
      {/* ===================== BOTTOM NAV ===================== */}
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.navContainer}>
          {/* Left Tabs */}
          {leftTabs.map(renderTab)}

          {/* Plus Button - Driver Only */}
          {showPlusButton && (
            <TouchableOpacity
              style={styles.plusButtonWrapper}
              onPress={openModal}
              activeOpacity={0.9}
              accessibilityLabel={t("createTrip", "Créer un trajet")}
              accessibilityRole="button"
            >
              <Animated.View 
                style={[
                  styles.plusButton,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <Plus size={32} color="#FFFFFF" strokeWidth={2.5} />
                <View style={styles.plusGlow} />
              </Animated.View>
              <Text style={styles.plusLabel}>
                {t("publish", "Publier")}
              </Text>
            </TouchableOpacity>
          )}

          {/* Right Tabs */}
          {rightTabs.map(renderTab)}

          {/* Profile Button */}
          <TouchableOpacity
            style={[styles.navButton, currentView === "profile" && styles.navButtonActive]}
            onPress={() => safeNavigate("profile")}
            activeOpacity={0.8}
            accessibilityLabel={t("profile", "Profil")}
            accessibilityRole="button"
            accessibilityState={{ selected: currentView === "profile" }}
          >
            <Animated.View 
              style={[
                styles.avatarContainer,
                currentView === "profile" && styles.avatarActive,
                { transform: [{ scale: currentView === "profile" ? pulseAnim : 1 }] }
              ]}
            >
              {avatarLetter ? (
                <Text style={[
                  styles.avatarText,
                  currentView === "profile" && styles.avatarTextActive
                ]}>
                  {avatarLetter}
                </Text>
              ) : (
                <User
                  size={22}
                  color={currentView === "profile" ? "#FFFFFF" : "#64748B"}
                  strokeWidth={currentView === "profile" ? 2.2 : 1.8}
                />
              )}
              {renderBadge(notificationCount)}
            </Animated.View>
            <Text style={[
              styles.label,
              currentView === "profile" && styles.labelActive
            ]}>
              {t("profile", "Profil")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ===================== PLUS MODAL ===================== */}
      <Modal 
        visible={showPlusModal} 
        transparent 
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={closeModal}
        >
          <Animated.View
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Handle */}
            <View style={styles.sheetHandle} />
            
            {/* Close Button */}
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={closeModal}
              activeOpacity={0.7}
            >
              <X size={22} color="#64748B" strokeWidth={2} />
            </TouchableOpacity>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("quickActions", "Actions rapides")}
              </Text>
              <Text style={styles.modalSubtitle}>
                {t("selectAction", "Sélectionnez une action")}
              </Text>
            </View>

            {/* Grid Actions */}
            <View style={styles.grid}>
              {/* Create Trip */}
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => {
                  closeModal();
                  safeNavigate("trip");
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, styles.iconCircleGreen]}>
                  <MapPin size={28} color="#059669" strokeWidth={2} />
                </View>
                <Text style={[styles.gridText, styles.gridTextGreen]}>
                  {t("createTrip", "Créer un trajet")}
                </Text>
                <Text style={styles.gridSubtext}>
                  {t("publishRide", "Publier un nouveau trajet")}
                </Text>
              </TouchableOpacity>

              {/* Additional Action: My Rides */}
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() => {
                  closeModal();
                  safeNavigate("rideRequests");
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, styles.iconCircleBlue]}>
                  <Briefcase size={28} color="#3B82F6" strokeWidth={2} />
                </View>
                <Text style={[styles.gridText, styles.gridTextBlue]}>
                  {t("myRides", "Mes trajets")}
                </Text>
                <Text style={styles.gridSubtext}>
                  {t("manageRides", "Gérer vos trajets")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <Text style={styles.versionText}>
                Version 1.0.1
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
});

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      android: {
        paddingBottom: 0,
      },
    }),
  },

  navContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 4,
  },

  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 12,
    minHeight: 56,
  },
  navButtonActive: {
    // Active state styling
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginBottom: 2,
    position: "relative",
  },
  iconContainerActive: {
    backgroundColor: "#059669",
    shadowColor: "#059669",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  iconContainerHovered: {
    backgroundColor: "rgba(5, 150, 105, 0.08)",
  },

  activeDot: {
    position: "absolute",
    bottom: -2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#059669",
  },

  label: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
    letterSpacing: 0.2,
    marginTop: 1,
    textAlign: "center",
  },
  labelActive: {
    color: "#059669",
    fontWeight: "600",
  },
  labelHovered: {
    color: "#059669",
  },

  plusButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
    marginHorizontal: 4,
    width: 72,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#059669",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    position: "relative",
  },
  plusGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "rgba(5, 150, 105, 0.2)",
    transform: [{ scale: 0.8 }],
    opacity: 0.6,
  },
  plusLabel: {
    fontSize: 9,
    color: "#059669",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.3,
  },

  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#334155",
  },
  avatarTextActive: {
    color: "#FFFFFF",
  },

  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    zIndex: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },

  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 8,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 12,
  },

  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  modalHeader: {
    marginTop: 8,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "400",
  },

  grid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },

  gridItem: {
    alignItems: "center",
    width: 140,
    padding: 8,
    borderRadius: 16,
    backgroundColor: "transparent",
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  iconCircleGreen: {
    backgroundColor: "#ECFDF5",
  },
  iconCircleBlue: {
    backgroundColor: "#EFF6FF",
  },

  gridText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  gridTextGreen: {
    color: "#9faca8",
  },
  gridTextBlue: {
    color: "#3B82F6",
  },
  gridSubtext: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 2,
  },

  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    alignItems: "center",
  },
  versionText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "400",
    letterSpacing: 0.5,
  },
});

Navigation.displayName = 'Navigation';