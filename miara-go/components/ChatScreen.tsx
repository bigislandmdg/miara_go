// ChatScreen.tsx
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Send, Phone, AlertCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";

/* ===================== TYPES ===================== */
interface BackendMessage {
  id: number;
  ride_id: number;
  sender_id: number;
  content: string;
  created_at?: string;
}

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: string;
  status?: "sending" | "sent" | "error";
}

export interface Trip {
  id: string;
  driver: {
    name: string;
    avatar?: string;
    contact?: string;
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

  const [userId, setUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const isFetching = useRef(false);

  /* ===================== SPINNER ===================== */
  useEffect(() => {
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

  /* ===================== LOAD USER ===================== */
  useEffect(() => {
    AsyncStorage.getItem("user").then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserId(parsed.id);
      }
    });
  }, []);

  /* ===================== FETCH MESSAGES ===================== */
  const fetchMessages = async () => {
    if (!userId || isFetching.current) return;

    try {
      isFetching.current = true;

      const res = await fetch(
        `http://10.0.2.2:8080/messages?ride_id=${trip.id}`
      );

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();

      const messagesArray: BackendMessage[] = Array.isArray(data)
        ? data
        : data.messages && Array.isArray(data.messages)
        ? data.messages
        : [];

      const formatted: Message[] = messagesArray.map((m) => ({
        id: String(m.id),
        text: m.content ?? "—",
        sender: m.sender_id === userId ? "me" : "other",
        timestamp: m.created_at
          ? new Date(m.created_at).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        status: "sent",
      }));

      setMessages((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(formatted)) {
          return prev;
        }
        return formatted;
      });
    } catch (e) {
      console.log("Fetch error:", e);
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  /* ===================== SEND ===================== */
  const handleSend = async () => {
    if (!newMessage.trim() || !userId || sending) return;

    setSending(true);
    const tempId = Date.now().toString();
    const text = newMessage;
    setNewMessage("");

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text,
        sender: "me",
        timestamp: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "sending",
      },
    ]);

    try {
      const res = await fetch("http://10.0.2.2:8080/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride_id: trip.id,
          sender_id: userId,
          content: text,
        }),
      });

      if (!res.ok) throw new Error("Network error");

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "sent" } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m))
      );
    } finally {
      setSending(false);
    }
  };

  /* ===================== RETRY ===================== */
  const retrySend = (msg: Message) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setNewMessage(msg.text);
  };

  /* ===================== CALL DRIVER ===================== */
  const handleCall = () => {
    if (currentUserType === "passenger") {
      if (!trip.driver?.contact) {
        Alert.alert(t("appName"), t("noDriverNumber"));
        return;
      }

      Alert.alert(
        t("appName"),
        `${t("callDriver")} ${trip.driver.name}?`,
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("call"),
            onPress: () => Linking.openURL(`tel:${trip.driver.contact}`),
          },
        ]
      );
    } else {
      Alert.alert(t("appName"), t("driverCannotCallFromHere"));
    }
  };

  /* ===================== UI ===================== */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <ArrowLeft color="white" />
        </TouchableOpacity>

        <Image
          source={{
            uri:
              trip.driver.avatar && trip.driver.avatar.length > 0
                ? trip.driver.avatar
                : "https://via.placeholder.com/80",
          }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.headerText}>
            {trip.driver.name ?? "Driver"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleCall}
          disabled={!trip.driver?.contact}
          style={{ opacity: trip.driver?.contact ? 1 : 0.5 }}
        >
          <Phone color="white" />
        </TouchableOpacity>
      </View>

      {/* TRIP INFO */}
      <View style={styles.tripInfo}>
        <Text style={styles.tripText}>
          {trip.departure ?? "—"} → {trip.arrival ?? "—"}
        </Text>
        <Text style={styles.tripText}>
          {trip.date ?? "—"} • {trip.time ?? "—"}
        </Text>
        <Text style={styles.tripText}>
          {t("youAre")}:{" "}
          {currentUserType === "driver" ? t("driver") : t("passenger")}
        </Text>
      </View>

      {/* MESSAGES */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messages}
        onContentSizeChange={() =>
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100)
        }
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.row,
              msg.sender === "me"
                ? { justifyContent: "flex-end" }
                : { justifyContent: "flex-start" },
            ]}
          >
            <View
              style={[
                styles.bubble,
                msg.sender === "me"
                  ? styles.myBubble
                  : styles.otherBubble,
              ]}
            >
              <Text
                style={{ color: msg.sender === "me" ? "#fff" : "#111" }}
              >
                {msg.text}
              </Text>

              <View style={styles.statusRow}>
                <Text style={styles.time}>{msg.timestamp}</Text>

                {msg.status === "sending" && (
                  <Animated.View
                    style={[
                      styles.spinner,
                      { transform: [{ rotate: spin }] },
                    ]}
                  />
                )}

                {msg.status === "error" && (
                  <TouchableOpacity onPress={() => retrySend(msg)}>
                    <AlertCircle size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* INPUT */}
      <View style={styles.inputRow}>
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={t("typeMessage")}
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} style={styles.send}>
          <Send color="white" size={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#047857",
    padding: 14,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, marginHorizontal: 8 },
  headerText: { color: "#fff", fontWeight: "700" },
  tripInfo: {
    backgroundColor: "#fff",
    margin: 12,
    padding: 12,
    borderRadius: 12,
  },
  tripText: { fontSize: 14, color: "#111", marginVertical: 2 },
  messages: { flex: 1, padding: 12 },
  row: { flexDirection: "row", marginVertical: 6 },
  bubble: {
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
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  time: { fontSize: 10, color: "#9CA3AF" },
  spinner: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: "#D1FAE5",
    borderTopColor: "#10B981",
    borderRadius: 5,
  },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  send: {
    backgroundColor: "#047857",
    padding: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
});