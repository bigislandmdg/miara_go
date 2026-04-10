// ProfileScreen.tsx (Version corrigée avec ChevronLeft)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  User, 
  LogOut, 
  Settings, 
  HelpCircle, 
  Shield, 
  Star, 
  Clock, 
  CreditCard,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  Award,
  Globe,
  Bell,
  Lock,
  Info,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

const API_BASE = "http://10.0.2.2:8080";
const { width } = Dimensions.get("window");

interface ProfileScreenProps {
  onLogout: () => void;
  onBack: () => void;
  userType?: "driver" | "passenger";
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

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  badge?: string;
  destructive?: boolean;
  info?: string;
}

export default function ProfileScreen({ onLogout, onBack, userType = "passenger" }: ProfileScreenProps) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    nom: "",
    prenom: "",
    phone: "",
    role: "",
    email: "",
    rating: 4.8,
    trips_count: 42,
    member_since: "2024",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initProfile();
  }, []);

  const initProfile = async () => {
    try {
      setLoading(true);
      const localUser = await AsyncStorage.getItem("user");
      if (localUser) setProfile(JSON.parse(localUser));
      await syncProfileFromAPI();
    } catch (e) {
      console.log("INIT PROFILE ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  const syncProfileFromAPI = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (response.status === 401) return;

      const data = await response.json();
      const user = data?.user ?? (data?.id ? data : null);

      if (user) {
        const enrichedProfile = {
          ...user,
          rating: user.rating || 4.8,
          trips_count: user.trips_count || 42,
          member_since: user.member_since || "2024",
        };
        setProfile(enrichedProfile);
        await AsyncStorage.setItem("user", JSON.stringify(enrichedProfile));
      }
    } catch (e) {
      console.log("PROFILE API ERROR", e);
    }
  };

  const logout = async () => {
    Alert.alert(
      t("logout"),
      t("logoutConfirmation"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove(["token", "user"]);
            onLogout();
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initProfile();
    setRefreshing(false);
  };

  const changeLanguage = () => {
    const languages = ["fr", "en", "mg"];
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    i18n.changeLanguage(languages[nextIndex]);
  };

  // =========================================================
  // 🔹 FONCTIONS D'INFORMATION AMÉLIORÉES
  // =========================================================
  const showPersonalInfo = () => {
    Alert.alert(
      t("personalInfo"),
      `${t("name")}: ${profile.prenom} ${profile.nom}\n${t("phone")}: ${profile.phone}\n${t("email")}: ${profile.email || "Non renseigné"}\n${t("role")}: ${profile.role === "driver" ? t("driver") : t("passenger")}`,
      [{ text: t("ok") }]
    );
  };

  const showPaymentMethods = () => {
    Alert.alert(
      t("paymentMethods"),
      t("paymentMethodsInfo"),
      [
        { text: t("later"), style: "cancel" },
        { 
          text: t("add"), 
          onPress: () => Alert.alert(t("info"), t("addPaymentMethod") + "\n\n• Carte bancaire\n• Mobile Money\n• Espèces") 
        }
      ]
    );
  };

  const showSavedPlaces = () => {
    Alert.alert(
      t("savedPlaces"),
      t("savedPlacesInfo"),
      [
        { text: t("later"), style: "cancel" },
        { 
          text: t("add"), 
          onPress: () => Alert.alert(t("info"), t("addPlaceInfo") + "\n\n• Domicile\n• Travail\n• École\n• Lieux favoris") 
        }
      ]
    );
  };

  const showNotifications = () => {
    Alert.alert(
      t("notifications"),
      t("notificationsInfo"),
      [
        { text: t("ok") }
      ]
    );
  };

  const showHelpCenter = () => {
    Alert.alert(
      t("helpCenter"),
      t("helpCenterInfo"),
      [
        { text: t("cancel"), style: "cancel" },
        { 
          text: t("contact"), 
          onPress: () => Linking.openURL("mailto:support@miarago.com") 
        }
      ]
    );
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      t("privacyPolicy"),
      t("privacyPolicyInfo"),
      [
        { text: t("ok") },
        { 
          text: t("readMore"), 
          onPress: () => Linking.openURL("https://miarago.com/privacy") 
        }
      ]
    );
  };

  const showSecurity = () => {
    Alert.alert(
      t("security"),
      t("securityInfo"),
      [
        { text: t("ok") }
      ]
    );
  };

  const MenuItem = ({ icon, label, value, onPress, badge, destructive, info }: MenuItemProps) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, destructive && styles.menuIconDestructive]}>
          {icon}
        </View>
        <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {badge && (
          <View style={styles.menuBadge}>
            <Text style={styles.menuBadgeText}>{badge}</Text>
          </View>
        )}
        {value && <Text style={styles.menuValue}>{value}</Text>}
        {info && <Info size={14} color="#9CA3AF" style={{ marginRight: 4 }} />}
        <ChevronRight size={18} color={destructive ? "#EF4444" : "#9CA3AF"} />
      </View>
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // Skeleton amélioré
  const SkeletonProfile = () => (
    <View>
      <View style={styles.profileHeaderSkeleton}>
        <View style={styles.avatarSkeleton} />
        <View style={styles.profileInfoSkeleton}>
          <View style={styles.nameSkeleton} />
          <View style={styles.phoneSkeleton} />
        </View>
      </View>
      <View style={styles.statsSkeleton}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCardSkeleton} />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* HEADER MODERNE */}
        <LinearGradient
          colors={["#047857", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile")}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        {loading ? (
          <SkeletonProfile />
        ) : (
          <>
            {/* PROFIL CARD MODERNE */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={["#10B981", "#059669"]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>
                      {profile.prenom?.charAt(0) || ""}{profile.nom?.charAt(0) || ""}
                    </Text>
                  </LinearGradient>
                  <View style={styles.verifiedBadge}>
                    <Shield size={12} color="#fff" />
                  </View>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {profile.prenom} {profile.nom}
                  </Text>
                  <View style={styles.profileContact}>
                    <Phone size={14} color="#6B7280" />
                    <Text style={styles.profilePhone}>{profile.phone}</Text>
                  </View>
                  {profile.email && (
                    <View style={styles.profileContact}>
                      <Mail size={14} color="#6B7280" />
                      <Text style={styles.profileEmail}>{profile.email}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* STATS CARDS */}
              <View style={styles.statsGrid}>
                <StatCard
                  icon={<Star size={20} color="#F59E0B" />}
                  value={profile.rating?.toFixed(1) || "4.8"}
                  label={t("rating")}
                />
                <StatCard
                  icon={<Clock size={20} color="#3B82F6" />}
                  value={profile.trips_count || 0}
                  label={t("trips")}
                />
                <StatCard
                  icon={<Award size={20} color="#8B5CF6" />}
                  value={profile.member_since || "2024"}
                  label={t("memberSince")}
                />
              </View>
            </View>

            {/* MENU PRINCIPAL */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{t("account")}</Text>
              
              <MenuItem
                icon={<User size={20} color="#10B981" />}
                label={t("personalInfo")}
                info="Voir mes informations"
                onPress={showPersonalInfo}
              />
              
              <MenuItem
                icon={<CreditCard size={20} color="#10B981" />}
                label={t("paymentMethods")}
                value="•••• 4242"
                info="Gérer mes moyens de paiement"
                onPress={showPaymentMethods}
              />
              
              <MenuItem
                icon={<MapPin size={20} color="#10B981" />}
                label={t("savedPlaces")}
                value="2"
                info="Domicile, Travail"
                onPress={showSavedPlaces}
              />
            </View>

            {/* MENU PRÉFÉRENCES */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{t("preferences")}</Text>
              
              <MenuItem
                icon={<Globe size={20} color="#10B981" />}
                label={t("language")}
                value={i18n.language === "fr" ? "Français" : i18n.language === "en" ? "English" : "Malagasy"}
                info="Changer la langue"
                onPress={changeLanguage}
              />
              
              <MenuItem
                icon={<Bell size={20} color="#10B981" />}
                label={t("notifications")}
                badge={t("on")}
                info="Alertes de trajets et promotions"
                onPress={showNotifications}
              />
            </View>

            {/* MENU SUPPORT */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>{t("support")}</Text>
              
              <MenuItem
                icon={<HelpCircle size={20} color="#10B981" />}
                label={t("helpCenter")}
                info="FAQ, tutoriels, assistance"
                onPress={showHelpCenter}
              />
              
              <MenuItem
                icon={<Lock size={20} color="#10B981" />}
                label={t("privacyPolicy")}
                info="Comment nous protégeons vos données"
                onPress={showPrivacyPolicy}
              />
              
              <MenuItem
                icon={<Shield size={20} color="#10B981" />}
                label={t("security")}
                info="Authentification à deux facteurs"
                onPress={showSecurity}
              />
            </View>

            {/* BOUTON DÉCONNEXION */}
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>{t("logout")}</Text>
            </TouchableOpacity>

            {/* VERSION */}
            <Text style={styles.versionText}>MiaraGo v1.0.0</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== STYLES MODERNES ===================== */
const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#F9FAFB" 
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /* HEADER MODERNE */
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
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
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* PROFIL CARD */
  profileCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatarGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  profileContact: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },
  profileEmail: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 6,
  },

  /* STATS GRID */
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },

  /* MENU SECTIONS */
  menuSection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  menuSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 20,
    marginTop: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconDestructive: {
    backgroundColor: "#FEE2E2",
  },
  menuLabel: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  menuLabelDestructive: {
    color: "#EF4444",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuValue: {
    fontSize: 14,
    color: "#6B7280",
    marginRight: 8,
  },
  menuBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  menuBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  /* BOUTON DÉCONNEXION */
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },

  /* VERSION */
  versionText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 16,
  },

  /* SKELETON */
  profileHeaderSkeleton: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarSkeleton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E5E7EB",
    marginRight: 16,
  },
  profileInfoSkeleton: {
    flex: 1,
  },
  nameSkeleton: {
    height: 24,
    width: "60%",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 8,
  },
  phoneSkeleton: {
    height: 16,
    width: "40%",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  statsSkeleton: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  statCardSkeleton: {
    flex: 1,
    height: 60,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    marginHorizontal: 4,
  },
});
