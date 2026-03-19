// ChatScreen.tsx - Version finale corrigée
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

  const scrollViewRef = useRef<ScrollView>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const inputScaleAnim = useRef(new Animated.Value(1)).current;
  const isFetching = useRef(false);
  const initialLoadDone = useRef(false);

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

  /* ===================== FETCH OTHER USER INFO ===================== */
  // Dans ChatScreen.tsx - Remplacer la partie FETCH OTHER USER INFO par ceci :

/* ===================== EXTRACT OTHER USER FROM MESSAGES ===================== */
useEffect(() => {
  const extractOtherUserFromMessages = () => {
    if (!currentUser || messages.length === 0) return;

    // Chercher le premier message pour extraire les infos de l'autre utilisateur
    const firstMessage = messages[0] as any; // Cast pour accéder aux champs backend
    
    if (firstMessage) {
      // Déterminer qui est l'autre utilisateur
      if (firstMessage.sender === "other") {
        // Si le premier message est de "other", on prend ses infos
        setOtherUser({
          id: parseInt(firstMessage.sender_id),
          nom: firstMessage.sender_nom || "",
          prenom: firstMessage.sender_prenom || "",
          phone: "",
          role: firstMessage.sender_role === "driver" ? "driver" : "user",
          rating: 4.5,
        });
      } else {
        // Sinon, on prend les infos du receiver
        setOtherUser({
          id: parseInt(firstMessage.receiver_id),
          nom: firstMessage.receiver_nom || "",
          prenom: firstMessage.receiver_prenom || "",
          phone: "",
          role: firstMessage.receiver_role === "driver" ? "driver" : "user",
          rating: 4.5,
        });
      }
      setLoadingOtherUser(false);
    }
  };

  extractOtherUserFromMessages();
}, [messages, currentUser]);

/* ===================== FETCH OTHER USER PHONE ===================== */
useEffect(() => {
  const fetchOtherUserPhone = async () => {
    if (!otherUser) return;

    try {
      const res = await fetch(`http://10.0.2.2:8080/users/${otherUser.id}`);
      if (res.ok) {
        const data = await res.json();
        const user = data.user || data;
        if (user) {
          setOtherUser(prev => ({
            id: prev?.id || 0,
            nom: prev?.nom || "",
            prenom: prev?.prenom || "",
            phone: user.phone || "",
            role: prev?.role || "driver",
            rating: prev?.rating || 4.5,
          }));
        }
      }
    } catch (error) {
      console.log("Error fetching phone:", error);
    }
  };

  fetchOtherUserPhone();
}, [otherUser?.id]);

// Supprimer l'ancien useEffect FETCH OTHER USER INFO  

  /* ===================== MARK MESSAGES AS READ ===================== */
  const markMessagesAsRead = async () => {
    if (!currentUser || !trip.id) return;

    try {
      await fetch("http://10.0.2.2:8080/messages/read", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: parseInt(trip.id),
          user_id: currentUser.id
        })
      });
    } catch (error) {
      console.log("Error marking messages as read:", error);
    }
  };

  /* ===================== FETCH MESSAGES ===================== */
  const fetchMessages = async () => {
    if (!currentUser || !otherUser || isFetching.current) return;

    try {
      isFetching.current = true;
      
      const url = `http://10.0.2.2:8080/messages?ride_id=${trip.id}&user_id=${currentUser.id}&other_id=${otherUser.id}&limit=50`;
      console.log("Fetching messages from:", url);
      
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: BackendResponse = await res.json();
      
      if (!data.status) {
        throw new Error("Erreur API");
      }

      const messagesArray: BackendMessage[] = data.messages || [];
      console.log("Messages reçus:", messagesArray.length);

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
        };
      });

      setMessages((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(formatted)) {
          return prev;
        }
        return formatted;
      });

      // Marquer les messages comme lus si nécessaire
      const hasUnread = messagesArray.some(m => 
        m.receiver_id === String(currentUser.id) && m.read === "0"
      );
      if (hasUnread) {
        markMessagesAsRead();
      }

    } catch (e) {
      console.log("Fetch error:", e);
      setApiError("Erreur de connexion au serveur");
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser || !otherUser) return;

    if (!initialLoadDone.current) {
      fetchMessages();
      initialLoadDone.current = true;
    }
    
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentUser, otherUser, trip.id]);

  /* ===================== FETCH UNREAD COUNT ===================== */
  const fetchUnreadCount = async () => {
    if (!currentUser) return;

    try {
      const res = await fetch(`http://10.0.2.2:8080/messages/unread/${currentUser.id}`);
      const data = await res.json();
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.log("Error fetching unread count:", error);
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

      const response = await res.json();
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

  /* ===================== CALL ===================== */
  const handleCall = () => {
    if (!otherUser) return;

    const contact = otherUser.phone;
    
    if (!contact) {
      Alert.alert(t("appName"), "Numéro de téléphone non disponible");
      return;
    }

    const userName = `${otherUser.prenom} ${otherUser.nom}`;

    Alert.alert(
      t("appName"),
      `Appeler ${userName}?`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("call"),
          onPress: () => Linking.openURL(`tel:${contact}`),
        },
      ]
    );
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
    : "Utilisateur";

  const otherUserAvatar = otherUser?.avatar;
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
          <Image
            source={{
              uri: otherUserAvatar && otherUserAvatar.length > 0
                ? otherUserAvatar
                : "https://via.placeholder.com/80",
            }}
            style={styles.avatar}
          />
          <View style={styles.userTextContainer}>
            {loadingOtherUser ? (
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
            onPress={handleCall}
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

      {/* API ERROR MESSAGE */}
      {apiError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
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
    paddingHorizontal: 16,
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
  
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
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
  
  errorContainer: {
    backgroundColor: "#FEE2E2",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    textAlign: "center",
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
});
