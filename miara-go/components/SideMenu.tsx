import React, { JSX, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Pressable,
  Alert,
  ScrollView,
  Platform,
} from "react-native";

import {
  Wallet,
  User,
  Bell,
  LogOut,
  Settings,
  HelpCircle,
  Info,
} from "lucide-react-native";

import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { MainView } from "../components/Navigation";

/* ================= API ================= */

const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080";

/* ================= DIMENSIONS ================= */

const { width, height } = Dimensions.get("window");
const MENU_WIDTH = width * 0.82;

/* ================= VERSION ================= */

const APP_VERSION =
  Constants?.expoConfig?.version ||
  Constants?.manifest?.version ||
  "1.0.0";

/* ================= TYPES ================= */

interface UserType {
  id: string;
  nom: string;
  prenom: string;
  role?: string;
  phone?: string;
}

interface NotificationType {
  id: string;
  read: "t" | "f";
}

interface SideMenuProps {
  visible: boolean;
  user?: UserType | null;
  onClose: () => void;
  onNavigate: (route: MainView) => void;
  onLogout: () => void;
}

/* ================= COMPONENT ================= */

export function SideMenu({
  visible,
  user,
  onClose,
  onNavigate,
  onLogout,
}: SideMenuProps): JSX.Element | null {
  const { t } = useTranslation();

  const translateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const [menuUser, setMenuUser] = useState<UserType | null>(user || null);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ================= LOAD USER ================= */

  useEffect(() => {
    if (!user) {
      AsyncStorage.getItem("user").then((localUser) => {
        if (localUser) {
          const parsed = JSON.parse(localUser);
          setMenuUser(parsed);
          fetchUnreadNotifications(parsed.id);
        }
      });
    } else {
      setMenuUser(user);
      fetchUnreadNotifications(user.id);
    }
  }, [user]);

  /* ================= FETCH NOTIFICATIONS ================= */

  const fetchUnreadNotifications = async (userId: string) => {
    try {
      const res = await fetch(
        `${API_URL}/notifications?driver_id=${userId}`
      );

      if (!res.ok) return;

      const text = await res.text();

      if (!text) return;

      const data = JSON.parse(text);

      if (data?.status && Array.isArray(data.notifications)) {
        const unread = data.notifications.filter(
          (n: NotificationType) => n.read === "f"
        );

        setUnreadCount(unread.length);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.log("Erreur notifications SideMenu", error);
      setUnreadCount(0);
    }
  };

  /* ================= ANIMATION ================= */

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -MENU_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  /* ================= MENU ITEM ================= */

  const MenuItem = ({
    icon,
    label,
    route,
    danger,
    badge,
  }: {
    icon: React.ReactNode;
    label: string;
    route: MainView | "logout";
    danger?: boolean;
    badge?: number;
  }) => (
    <TouchableOpacity
      style={[styles.item, danger && styles.dangerItem]}
      activeOpacity={0.7}
      onPress={() => {
        onClose();

        if (route === "logout") {
          Alert.alert(
            t("confirmation"),
            t("logout_confirm"),
            [
              { text: t("cancel"), style: "cancel" },
              {
                text: t("logout"),
                style: "destructive",
                onPress: onLogout,
              },
            ]
          );
        } else {
          onNavigate(route);
        }
      }}
    >
      <View style={styles.itemIcon}>{icon}</View>

      <Text style={[styles.itemText, danger && { color: "#DC2626" }]}>
        {label}
      </Text>

      {typeof badge === "number" && badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>
            {badge > 99 ? "99+" : badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* MENU */}
      <Animated.View
        style={[styles.menu, { transform: [{ translateX }] }]}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

          {/* PROFILE */}

          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {menuUser?.prenom?.charAt(0)?.toUpperCase() || "U"}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>
                {menuUser?.prenom || "Utilisateur"} {menuUser?.nom || ""}
              </Text>

              {menuUser?.role && (
                <Text style={styles.userRole}>{menuUser.role}</Text>
              )}

              {menuUser?.phone && (
                <Text style={styles.userPhone}>{menuUser.phone}</Text>
              )}
            </View>
          </View>

          {/* PRINCIPAL */}

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("principal")}</Text>

            <MenuItem
              icon={<Wallet size={20} color="#047857" />}
              label={t("wallet")}
              route="wallet"
            />

            <MenuItem
              icon={<User size={20} color="#047857" />}
              label={t("profile")}
              route="profile"
            />

            <MenuItem
              icon={<Bell size={20} color="#047857" />}
              label={t("notifications")}
              route="notifications"
              badge={unreadCount}
            />
          </View>

          {/* SUPPORT */}

          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{t("support")}</Text>

            <MenuItem
              icon={<Settings size={20} color="#374151" />}
              label={t("settings")}
              route="settings"
            />

            <MenuItem
              icon={<HelpCircle size={20} color="#374151" />}
              label={t("help")}
              route="help"
            />

            <MenuItem
              icon={<Info size={20} color="#374151" />}
              label={t("about")}
              route="about"
            />
          </View>

          {/* LOGOUT */}

          <View style={styles.menuSection}>
            <MenuItem
              icon={<LogOut size={20} color="#DC2626" />}
              label={t("logout")}
              route="logout"
              danger
            />
          </View>

          {/* FOOTER VERSION */}

          <View style={styles.footer}>
            <View style={styles.versionChip}>
              <Text style={styles.versionText}>
                Version {APP_VERSION}
              </Text>
            </View>

            <Text style={styles.footerText}>
              © MiaraGo
            </Text>
          </View>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

container:{
...StyleSheet.absoluteFillObject,
zIndex:1000,
height
},

overlay:{
...StyleSheet.absoluteFillObject,
backgroundColor:"rgba(0,0,0,0.45)"
},

menu:{
position:"absolute",
left:0,
top:0,
bottom:0,
width:MENU_WIDTH,
backgroundColor:"#fff",
elevation:50
},

profileSection:{
backgroundColor:"#047857",
paddingTop:65,
paddingBottom:25,
paddingHorizontal:20,
flexDirection:"row",
alignItems:"center"
},

avatar:{
width:55,
height:55,
borderRadius:30,
backgroundColor:"#10B981",
alignItems:"center",
justifyContent:"center",
marginRight:15
},

avatarText:{
color:"#fff",
fontWeight:"800",
fontSize:22
},

userName:{
color:"#fff",
fontWeight:"800",
fontSize:17
},

userRole:{
color:"#D1FAE5",
fontSize:13
},

userPhone:{
color:"#D1FAE5",
fontSize:13
},

menuSection:{
paddingHorizontal:16,
paddingTop:22
},

sectionTitle:{
fontSize:12,
fontWeight:"700",
color:"#6B7280",
marginBottom:10,
textTransform:"uppercase"
},

item:{
flexDirection:"row",
alignItems:"center",
paddingVertical:14,
paddingHorizontal:12,
borderRadius:10,
marginBottom:6
},

itemIcon:{
width:28,
alignItems:"center"
},

itemText:{
marginLeft:16,
fontSize:15,
fontWeight:"600",
color:"#111827",
flex:1
},

dangerItem:{
backgroundColor:"rgba(220,38,38,0.1)"
},

menuBadge:{
backgroundColor:"#EF4444",
borderRadius:12,
minWidth:22,
paddingHorizontal:6,
paddingVertical:2,
alignItems:"center"
},

menuBadgeText:{
color:"#fff",
fontSize:11,
fontWeight:"800"
},

footer:{
marginTop:30,
alignItems:"center"
},

versionChip:{
backgroundColor:"#F3F4F6",
paddingHorizontal:14,
paddingVertical:6,
borderRadius:20,
marginBottom:15
},

versionText:{
fontSize:12,
color:"#374151",
fontWeight:"600"
},

footerText:{
fontSize:11,
color:"#9CA3AF"
}

});