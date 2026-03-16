// ProfileScreen.tsx (Version multilingue avec t("helloProfile"))
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, LogOut } from "lucide-react-native";
import Feather from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next"; // 🔹 Import i18n

const API_BASE = "http://10.0.2.2:8080";

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
}

export default function ProfileScreen({ onLogout, onBack }: ProfileScreenProps) {
  const { t } = useTranslation(); // 🔹 Hook i18n
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    nom: "",
    prenom: "",
    phone: "",
    role: "",
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
        setProfile(user);
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      console.log("PROFILE API ERROR", e);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    onLogout();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initProfile();
    setRefreshing(false);
  };

  // Skeleton simple pour le profil
  const SkeletonProfile = () => (
    <View style={styles.card}>
      <View style={styles.avatarWrapperSkeleton} />
      <View style={{ height: 24, width: 160, backgroundColor: "#E5E7EB", borderRadius: 8, marginTop: 16 }} />
      <View style={{ height: 16, width: 120, backgroundColor: "#E5E7EB", borderRadius: 6, marginTop: 8 }} />
      <View style={{ height: 20, width: 80, backgroundColor: "#E5E7EB", borderRadius: 10, marginTop: 12 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile")}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* CONTENT */}
        <View style={styles.container}>
          {loading ? (
            <SkeletonProfile />
          ) : (
            <>
              {/* PROFILE CARD */}
              <View style={styles.card}>
                <View style={styles.avatarWrapper}>
                  <User size={72} color="#10B981" />
                </View>

                {/* 🔹 Nom complet */}
                <Text style={styles.name}>
                  {profile.prenom} {profile.nom}
                </Text>

                {/* 🔹 Bonjour multilingue */}
                <Text style={styles.hello}>{t("helloProfile", { prenom: profile.prenom })}</Text>

                <Text style={styles.info}>{profile.phone}</Text>

                <View style={styles.roleWrapper}>
                  <Text style={styles.role}>
                    {profile.role === "driver" ? t("driver") : t("passenger")}
                  </Text>
                </View>
              </View>

              {/* LOGOUT BUTTON */}
              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <LogOut size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>{t("logout")}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },

  /* HEADER */
  header: {
    backgroundColor: "#047857",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  container: { flex: 1, padding: 20, justifyContent: "center" },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 32,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    elevation: 8,
  },

  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarWrapperSkeleton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#E5E7EB",
  },

  name: { fontSize: 24, fontWeight: "800", marginTop: 18, color: "#111827" },
  hello: { fontSize: 16, color: "#6B7280", marginTop: 4 }, // 🔹 style pour helloProfile
  info: { fontSize: 14, color: "#6B7280", marginTop: 6 },

  roleWrapper: {
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#DCFCE7",
  },
  role: { fontSize: 14, fontWeight: "700", color: "#10B981", textAlign: "center" },

  logoutBtn: {
    marginTop: 40,
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  logoutText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});
