// ChatScreen.tsx - Version finale complète
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  AlertCircle, 
  Check, 
  CheckCheck,
  Info,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  User,
  X,
  MessageCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

/* ===================== TYPES ===================== */
interface BackendMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: string;
  read_at: string | null;
  conversation_id: string;
  type: string;
  metadata: string | null;
  status: string;
  is_deleted: string;
  created_at: string;
  sender_nom?: string;
  sender_prenom?: string;
  sender_role?: string;
  receiver_nom?: string;
  receiver_prenom?: string;
  receiver_role?: string;
}

interface BackendResponse {
  status: boolean;
  messages?: BackendMessage[];
  total?: number;
}

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: string;
  fullDate: string;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
  type?: string;
  metadata?: any;
  sender_id?: string;
  receiver_id?: string;
  sender_nom?: string;
  sender_prenom?: string;
  sender_role?: string;
  receiver_nom?: string;
  receiver_prenom?: string;
  receiver_role?: string;
}

interface UserInfo {
  id: number;
  nom: string;
  prenom: string;
  phone: string;
  role: "user" | "driver";
  avatar?: string;
  rating?: number;
}

export interface Trip {
  id: string;
  driver_id: number;
  passenger_id?: number;
  driver?: {
    name: string;
    avatar?: string;
    contact?: string;
    rating?: number;
  };
  departure?: string;
  arrival?: string;
  date?: string;
  price?: number;
  time?: string;
  meetingPoints?: string[];
}

/* ===================== COMPONENT ===================== */
export function ChatScreen({
  trip,
  currentUserType,
  onBack,
}: {
  trip: Trip;
  currentUserType: "driver" | "passenger";
  onBack: () => void;
}) {
  const { t } = useTranslation();

  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOtherUser, setLoadingOtherUser] = useState(true);
  const [showTripInfo, setShowTripInfo] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputScaleAnim = useRef(new Animated.Value(1)).current;
  const isFetching = useRef(false);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const initialFetchDone = useRef(false);

  /* ===================== ANIMATIONS ===================== */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  /* ===================== LOAD CURRENT USER ===================== */
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser({
            id: parsed.id,
            nom: parsed.nom,
            prenom: parsed.prenom,
            phone: parsed.phone,
            role: parsed.role,
            avatar: parsed.avatar,
            rating: parsed.rating || 4.5,
          });
        }
      } catch (error) {
        console.log("Error loading user:", error);
      }
    };
    
    loadCurrentUser();
  }, []);

  /* ===================== FETCH MESSAGES ===================== */
  const fetchMessages = async (isInitial = false) => {
    if (!currentUser || isFetching.current) return;

    try {
      isFetching.current = true;
      
      let url;
      if (otherUser && otherUser.id) {
        url = `http://10.0.2.2:8080/messages?ride_id=${trip.id}&user_id=${currentUser.id}&other_id=${otherUser.id}&limit=50`;
      } else {
        url = `http://10.0.2.2:8080/messages?ride_id=${trip.id}&limit=50`;
      }
      console.log("Fetching messages from:", url);
      
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      
      if (!text || text.trim() === "") {
        console.log("Empty response from server");
        setMessages([]);
        setLoading(false);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.log("JSON parse error:", parseError);
        setMessages([]);
        setLoading(false);
        return;
      }
      
      if (!data.status) {
        throw new Error("Erreur API");
      }

      const messagesArray: BackendMessage[] = data.messages || [];

      const formatted: Message[] = messagesArray.map((m) => {
        const date = new Date(m.created_at.replace(' ', 'T'));
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateStr = "";
        if (date.toDateString() === today.toDateString()) {
          dateStr = "Aujourd'hui";
        } else if (date.toDateString() === yesterday.toDateString()) {
          dateStr = "Hier";
        } else {
          dateStr = date.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          });
        }

        let metadata = null;
        try {
          metadata = m.metadata ? JSON.parse(m.metadata) : null;
        } catch {
          metadata = m.metadata;
        }

        return {
          id: m.id,
          text: m.content,
          sender: m.sender_id === String(currentUser.id) ? "me" : "other",
          timestamp: date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          fullDate: dateStr,
          status: m.sender_id === String(currentUser.id) 
            ? (m.status === "read" ? "read" : m.status === "delivered" ? "delivered" : "sent")
            : undefined,
          type: m.type,
          metadata: metadata,
          sender_id: m.sender_id,
          receiver_id: m.receiver_id,
          sender_nom: m.sender_nom,
          sender_prenom: m.sender_prenom,
          sender_role: m.sender_role,
          receiver_nom: m.receiver_nom,
          receiver_prenom: m.receiver_prenom,
          receiver_role: m.receiver_role,
        };
      });

      setMessages(formatted);
      setApiError(null);
      
      if (formatted.length > 0 && !otherUser) {
        let driverInfo = null;
        let passengerInfo = null;
        
        for (const msg of formatted) {
        // Dans la partie où on extrait driverInfo
        if (msg.sender_role === "driver") {
        driverInfo = {
            id: parseInt(msg.sender_id || "0"),
            nom: msg.sender_nom || "",
            prenom: msg.sender_prenom || "",
            phone: msg.sender_id === "1" ? "+261341234567" : "", // Numéro direct pour le conducteur
            role: "driver" as "user" | "driver",
            rating: 4.5,
          };
        } else if (msg.receiver_role === "driver") {
        driverInfo = {
          id: parseInt(msg.receiver_id || "0"),
          nom: msg.receiver_nom || "",
          prenom: msg.receiver_prenom || "",
          phone: msg.receiver_id === "1" ? "+261341234567" : "",
          role: "driver" as "user" | "driver",
          rating: 4.5,
        };
       }
          
          if (msg.sender_role === "user") {
            passengerInfo = {
              id: parseInt(msg.sender_id || "0"),
              nom: msg.sender_nom || "",
              prenom: msg.sender_prenom || "",
              phone: "",
              role: "user" as "user" | "driver",
              rating: 4.5,
            };
          } else if (msg.receiver_role === "user") {
            passengerInfo = {
              id: parseInt(msg.receiver_id || "0"),
              nom: msg.receiver_nom || "",
              prenom: msg.receiver_prenom || "",
              phone: "",
              role: "user" as "user" | "driver",
              rating: 4.5,
            };
          }
        }
        
        if (currentUser.role === "user" && driverInfo) {
          setOtherUser(driverInfo);
        } else if (currentUser.role === "driver" && passengerInfo) {
          setOtherUser(passengerInfo);
        }
        
        setLoadingOtherUser(false);
      }

      const hasUnread = messagesArray.some(m => 
        m.receiver_id === String(currentUser.id) && m.read === "0"
      );
      if (hasUnread) {
        markMessagesAsRead();
      }

      if (isInitial) {
        initialFetchDone.current = true;
      }

    } catch (e) {
      console.log("Fetch error:", e);
      if (isInitial && messages.length === 0 && !initialFetchDone.current) {
        setApiError("Erreur de connexion au serveur");
      }
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  };

  /* ===================== MARK MESSAGES AS READ ===================== */
  const markMessagesAsRead = async () => {
    if (!currentUser || !trip.id) return;

    try {
      const res = await fetch("http://10.0.2.2:8080/messages/read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: parseInt(trip.id),
          user_id: currentUser.id
        })
      });
      
      const text = await res.text();
      if (!text || text.trim() === "") return;
      
      console.log("Mark as read response:", text);
    } catch (error) {
      console.log("Error marking messages as read:", error);
    }
  };

  /* ===================== FETCH OTHER USER PHONE ===================== */
  /* ===================== FETCH OTHER USER PHONE ===================== */
  /* ===================== FETCH OTHER USER PHONE ===================== */
useEffect(() => {
  const fetchOtherUserPhone = async () => {
    if (!otherUser) return;

    try {
      console.log("🔍 Fetching phone for user ID:", otherUser.id);
      const res = await fetch(`http://10.0.2.2:8080/users/${otherUser.id}`);
      
      if (res.ok) {
        const text = await res.text();
        console.log("📞 Raw response:", text);
        
        if (!text || text.trim() === "") {
          console.log("⚠️ Empty response");
          return;
        }
        
        const data = JSON.parse(text);
        console.log("✅ Parsed user data:", data);
        
        const user = data.user || data;
        if (user && user.phone) {
          setOtherUser(prev => ({
            id: prev?.id || 0,
            nom: prev?.nom || "",
            prenom: prev?.prenom || "",
            phone: user.phone,
            role: prev?.role || "driver",
            rating: prev?.rating || 4.5,
          }));
          console.log("📞 Phone number set to:", user.phone);
        } else {
          console.log("⚠️ No phone number found in response");
        }
      } else {
        console.log("❌ HTTP error:", res.status);
      }
    } catch (error) {
      console.log("❌ Error fetching phone:", error);
    }
  };

  if (otherUser && !otherUser.phone) {
    fetchOtherUserPhone();
  }
}, [otherUser]);

  /* ===================== START FETCHING ===================== */
  useEffect(() => {
    if (currentUser && !initialFetchDone.current) {
      fetchMessages(true);
    }
  }, [currentUser]);

  /* ===================== POLLING FOR NEW MESSAGES ===================== */
  useEffect(() => {
    if (!currentUser || !initialFetchDone.current) return;

    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    pollingInterval.current = setInterval(() => {
      if (!isFetching.current) {
        fetchMessages(false);
      }
    }, 5000);
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [currentUser, initialFetchDone.current]);

  /* ===================== FETCH UNREAD COUNT ===================== */
  const fetchUnreadCount = async () => {
    if (!currentUser) return;

    try {
      const res = await fetch(`http://10.0.2.2:8080/messages/unread/${currentUser.id}`);
      const text = await res.text();
      
      if (!text || text.trim() === "") {
        setUnreadCount(0);
        return;
      }
      
      const data = JSON.parse(text);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.log("Error fetching unread count:", error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  /* ===================== SEND ===================== */
  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser || !otherUser || sending) return;

    Animated.sequence([
      Animated.timing(inputScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSending(true);
    const tempId = Date.now().toString();
    const text = newMessage;
    setNewMessage("");

    const now = new Date();
    const tempMessage: Message = {
      id: tempId,
      text,
      sender: "me",
      timestamp: now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      fullDate: "Aujourd'hui",
      status: "sending",
      type: "text",
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const payload = {
        ride_id: parseInt(trip.id),
        sender_id: currentUser.id,
        receiver_id: otherUser.id,
        content: text,
        type: "text"
      };

      console.log("Sending message:", payload);

      const res = await fetch("http://10.0.2.2:8080/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.log("Send error response:", errorText);
        throw new Error(errorText);
      }

      const responseText = await res.text();
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response");
      }

      const response = JSON.parse(responseText);
      console.log("Send response:", response);

      setMessages((prev) =>
        prev.map((m) => 
          m.id === tempId 
            ? { 
                ...m, 
                id: response.data?.id || response.id || String(Date.now()), 
                status: "sent" 
              } 
            : m
        )
      );

      setTimeout(() => fetchMessages(false), 500);

    } catch (error) {
      console.log("Send error:", error);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m))
      );
      Alert.alert("Erreur", "Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  };

  /* ===================== RETRY ===================== */
  const retrySend = (msg: Message) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setNewMessage(msg.text);
  };

  /* ===================== GET AVATAR LETTERS ===================== */
  const getAvatarLetters = (user: UserInfo | null) => {
    if (!user) return "?";
    const firstLetter = user.prenom?.charAt(0).toUpperCase() || "";
    const secondLetter = user.nom?.charAt(0).toUpperCase() || "";
    return firstLetter + secondLetter;
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#10B981", // vert
      "#3B82F6", // bleu
      "#F59E0B", // orange
      "#EF4444", // rouge
      "#8B5CF6", // violet
      "#EC4899", // rose
      "#14B8A6", // turquoise
      "#F97316", // orange foncé
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  /* ===================== CONTACT FUNCTIONS ===================== */
  const makePhoneCall = () => {
    if (!otherUser?.phone) return;
    setContactModalVisible(false);
    Linking.openURL(`tel:${otherUser.phone}`);
  };

  const openWhatsApp = () => {
    if (!otherUser?.phone) return;
    setContactModalVisible(false);
    let phoneNumber = otherUser.phone.replace(/\+/g, '');
    Linking.openURL(`https://wa.me/${phoneNumber}`);
  };

  const sendSMS = () => {
    if (!otherUser?.phone) return;
    setContactModalVisible(false);
    Linking.openURL(`sms:${otherUser.phone}`);
  };

  /* ===================== RENDER STATUS ICON ===================== */
  const renderStatusIcon = (status?: string, message?: Message) => {
    switch (status) {
      case "sending":
        return <ActivityIndicator size={10} color="#9CA3AF" />;
      case "sent":
        return <Check size={12} color="#9CA3AF" />;
      case "delivered":
        return <CheckCheck size={12} color="#9CA3AF" />;
      case "read":
        return <CheckCheck size={12} color="#34D399" />;
      case "error":
        return (
          <TouchableOpacity onPress={() => message && retrySend(message)}>
            <AlertCircle size={14} color="#EF4444" />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  /* ===================== RENDER MESSAGE ===================== */
  const renderMessageContent = (msg: Message) => {
    if (msg.type === "image" && msg.metadata) {
      return (
        <TouchableOpacity onPress={() => Linking.openURL(msg.metadata)}>
          <Text style={[styles.messageText, { color: msg.sender === "me" ? "#fff" : "#111", textDecorationLine: 'underline' }]}>
            📷 {msg.text}
          </Text>
        </TouchableOpacity>
      );
    } else if (msg.type === "location" && msg.metadata) {
      const location = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
      return (
        <TouchableOpacity 
          onPress={() => Linking.openURL(`https://maps.google.com/?q=${location.latitude},${location.longitude}`)}
        >
          <Text style={[styles.messageText, { color: msg.sender === "me" ? "#fff" : "#111", textDecorationLine: 'underline' }]}>
            📍 {msg.text}
          </Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <Text style={[styles.messageText, { color: msg.sender === "me" ? "#fff" : "#111" }]}>
          {msg.text}
        </Text>
      );
    }
  };

  /* ===================== UI ===================== */
  const otherUserFullName = otherUser 
    ? `${otherUser.prenom} ${otherUser.nom}`.trim() 
    : "Chargement...";

  const otherUserAvatarLetters = otherUser ? getAvatarLetters(otherUser) : "?";
  const otherUserAvatarColor = otherUser ? getAvatarColor(otherUser.prenom + otherUser.nom) : "#10B981";
  const otherUserRating = otherUser?.rating || 4.5;
  const otherUserRole = otherUser?.role === "driver" ? t("driver") : t("passenger");

  const groupedMessages = messages.reduce((groups, message) => {
    const date = message.fullDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* HEADER */}
      <LinearGradient
        colors={["#047857", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <ArrowLeft color="white" size={22} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => setShowTripInfo(!showTripInfo)}
          activeOpacity={0.7}
        >
          {/* Avatar lettre */}
          <View style={[styles.avatarLetter, { backgroundColor: otherUserAvatarColor }]}>
            <Text style={styles.avatarLetterText}>{otherUserAvatarLetters}</Text>
          </View>
          
          <View style={styles.userTextContainer}>
            {!otherUser ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.headerName} numberOfLines={1}>
                  {otherUserFullName}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>⭐ {otherUserRating.toFixed(1)} • {otherUserRole}</Text>
                  {unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setContactModalVisible(true)}
            disabled={!otherUser?.phone}
            style={[styles.headerButton, !otherUser?.phone && styles.disabledButton]}
          >
            <Phone color="white" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowTripInfo(!showTripInfo)}
          >
            <Info color="white" size={20} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* TRIP INFO CARD */}
      {showTripInfo && (
        <Animated.View 
          style={[
            styles.tripInfoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.tripInfoHeader}>
            <Text style={styles.tripInfoTitle}>{t("tripDetails")}</Text>
            <TouchableOpacity onPress={() => setShowTripInfo(false)}>
              <Text style={styles.tripInfoClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tripInfoRow}>
            <MapPin size={16} color="#047857" />
            <Text style={styles.tripInfoText}>
              {trip.departure ?? "—"} → {trip.arrival ?? "—"}
            </Text>
          </View>
          
          <View style={styles.tripInfoRow}>
            <Calendar size={16} color="#047857" />
            <Text style={styles.tripInfoText}>{trip.date ?? "—"}</Text>
          </View>
          
          <View style={styles.tripInfoRow}>
            <Clock size={16} color="#047857" />
            <Text style={styles.tripInfoText}>{trip.time ?? "—"}</Text>
          </View>
          
          {trip.price && (
            <View style={styles.tripInfoRow}>
              <DollarSign size={16} color="#047857" />
              <Text style={styles.tripInfoText}>{trip.price} Ar</Text>
            </View>
          )}
          
          {otherUser && (
            <View style={styles.tripInfoRow}>
              <User size={16} color="#047857" />
              <Text style={styles.tripInfoText}>
                {otherUser.role === "driver" ? t("driver") : t("passenger")}: {otherUser.prenom} {otherUser.nom}
              </Text>
            </View>
          )}
          
          <View style={styles.tripInfoRole}>
            <User size={14} color="#6B7280" />
            <Text style={styles.tripInfoRoleText}>
              {t("youAre")}: {currentUserType === "driver" ? t("driver") : t("passenger")}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* MESSAGES */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100)
        }
      >
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#047857" />
            <Text style={styles.loadingText}>{t("loadingMessages")}</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("noMessages")}</Text>
            <Text style={styles.emptySubtext}>{t("startConversation")}</Text>
          </View>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <View key={date}>
              <View style={styles.dateSeparator}>
                <Text style={styles.dateText}>{date}</Text>
              </View>
              {dateMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.sender === "me"
                      ? { justifyContent: "flex-end" }
                      : { justifyContent: "flex-start" },
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.sender === "me"
                        ? styles.myBubble
                        : styles.otherBubble,
                    ]}
                  >
                    {renderMessageContent(msg)}

                    <View style={styles.messageFooter}>
                      <Text style={styles.messageTime}>{msg.timestamp}</Text>
                      {msg.sender === "me" && (
                        <View style={styles.statusContainer}>
                          {renderStatusIcon(msg.status, msg)}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* INPUT */}
      <Animated.View 
        style={[
          styles.inputContainer,
          { transform: [{ scale: inputScaleAnim }] }
        ]}
      >
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={t("typeMessage")}
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled
          ]}
        >
          <Send color="white" size={18} />
        </TouchableOpacity>
      </Animated.View>

      {/* CONTACT MODAL */}
      <Modal
        visible={contactModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setContactModalVisible(false)}
        >
          <View style={styles.contactModal}>
            <View style={styles.contactModalHeader}>
              <Text style={styles.contactModalTitle}>
                Contacter {otherUser?.prenom} {otherUser?.nom}
              </Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.contactOption} onPress={makePhoneCall}>
              <View style={[styles.contactIcon, { backgroundColor: "#10B981" }]}>
                <Phone size={22} color="#fff" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactOptionTitle}>Appeler</Text>
                <Text style={styles.contactOptionNumber}>{otherUser?.phone || "Numéro non disponible"}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={openWhatsApp}>
              <View style={[styles.contactIcon, { backgroundColor: "#25D366" }]}>
                <MessageCircle size={22} color="#fff" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactOptionTitle}>WhatsApp</Text>
                <Text style={styles.contactOptionNumber}>{otherUser?.phone || "Numéro non disponible"}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={sendSMS}>
              <View style={[styles.contactIcon, { backgroundColor: "#3B82F6" }]}>
                <MessageCircle size={22} color="#fff" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactOptionTitle}>SMS</Text>
                <Text style={styles.contactOptionNumber}>{otherUser?.phone || "Numéro non disponible"}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCancel} onPress={() => setContactModalVisible(false)}>
              <Text style={styles.contactCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F9FAFB" 
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  
  avatarLetter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarLetterText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  
  userTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  
  headerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  
  ratingText: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.9,
  },
  
  unreadBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  tripInfoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  
  tripInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  
  tripInfoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  
  tripInfoClose: {
    fontSize: 18,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  
  tripInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  
  tripInfoText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  
  tripInfoRole: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 8,
  },
  
  tripInfoRoleText: {
    fontSize: 13,
    color: "#6B7280",
  },
  
  messages: {
    flex: 1,
  },
  
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 18,
  },
  
  myBubble: {
    backgroundColor: "#047857",
    borderBottomRightRadius: 4,
  },
  
  otherBubble: {
    backgroundColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  
  messageTime: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  
  statusContainer: {
    width: 16,
    alignItems: "center",
  },
  
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 5,
  },
  
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: "#111827",
  },
  
  sendButton: {
    backgroundColor: "#047857",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#047857",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  
  // Modal contact
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  contactModal: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    width: "85%",
    alignSelf: "center",
  },
  contactModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  contactModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  contactOptionNumber: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  contactCancel: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  contactCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});
