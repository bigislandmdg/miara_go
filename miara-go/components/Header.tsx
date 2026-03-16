import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  GestureResponderEvent,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Bell, Menu } from "lucide-react-native";
import { useLanguage } from "../providers/LanguageProvider";
import { useTranslation } from "react-i18next";
import { SideMenu } from "./SideMenu";

/* ===================== API ===================== */
const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080";

/* ===================== TYPES ===================== */
interface User {
  id: string;
  nom: string;
  prenom: string;
}

interface Notification {
  id: string;
  driver_id: string;
  title: string;
  message: string;
  type: string;
  read: "t" | "f";
  created_at: string;
}

interface HeaderProps {
  title: string;
  onNotifications?: () => void;
  onProfileClick?: () => void;
  onMenuPress?: () => void;
}

/* ===================== COMPONENT ===================== */
export function Header({
  title,
  onNotifications,
  onProfileClick,
  onMenuPress,
}: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useTranslation();
  const { language } = useLanguage();

  const badgeScale = useRef(new Animated.Value(1)).current;

  /* 🔥 SIDEMENU STATE */
  const [menuVisible, setMenuVisible] = useState(false);
  const headerTranslate = useRef(new Animated.Value(0)).current

  /* ===================== INIT ===================== */
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
  Animated.timing(headerTranslate, {
    toValue: menuVisible ? 40 : 0,
    duration: 250,
    useNativeDriver: true,
  }).start()
}, [menuVisible])

  /* ===================== BADGE ANIMATION ===================== */
  useEffect(() => {
    if (unreadCount > 0) {
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.2,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [unreadCount]);

  /* ===================== LOAD USER ===================== */
  const loadUser = async () => {
    try {
      const localUser = await AsyncStorage.getItem("user");
      if (!localUser) return;

      const parsedUser: User = JSON.parse(localUser);
      setUser(parsedUser);

    } catch (e) {
      console.log("HEADER USER LOAD ERROR", e);
    }
  };



  /* ===================== AVATAR LETTER ===================== */
  const avatarLetter =
    user?.prenom?.trim().charAt(0).toUpperCase() ||
    user?.nom?.trim().charAt(0).toUpperCase() ||
    "?";

  /* ===================== UI ===================== */
  return (
    <>
     <Animated.View
  style={[
    styles.header,
    {
      zIndex: 400, // moins prioritaire que SideMenu
    },
  ]}
>
  {/* Icône menu */}
  <TouchableOpacity
  onPress={onMenuPress}
  style={{ marginRight: 12 }}
  activeOpacity={0.7}
>
  <Menu color="#ffffff" size={24} />
</TouchableOpacity>

  {/* Titre */}
  <View>
    <Text style={styles.title}>{title}</Text>
    {user && (
      <Text style={styles.subtitle}>
        {t("hello", "Bonjour")} 👋 {user.prenom}
      </Text>
    )}
  </View>

  {/* Avatar */}
  <View style={styles.row}>
    {/* Avatar */}
    <TouchableOpacity
      style={styles.avatar}
      activeOpacity={0.8}
      onPress={onProfileClick}
    >
      <Text style={styles.avatarText}>{avatarLetter}</Text>
    </TouchableOpacity>
  </View>
</Animated.View>
    </>
  );
}

/* ===================== PREMIUM STYLES ===================== */
const styles = StyleSheet.create({
  header: {
    backgroundColor: "#047857",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 22,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  subtitle: {
    color: "#D1FAE5",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  bellButton: {
    backgroundColor: "#ffffff",
    padding: 11,
    borderRadius: 24,
    marginRight: 14,
    fontSize:14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 32,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
});