import React, { useEffect, useRef, useState, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"

/* ===================== TYPES ===================== */
interface Notification {
  id: string
  driver_id: string
  ride_request_id: string
  title: string
  message: string
  type: string
  read: "t" | "f"
  created_at: string
}

interface Props {
  onBack: () => void
  driverId?: string
}

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080"

/* ===================== ICON CONFIG ===================== */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "ride_request":
      return { name: "map-pin", color: "#047857", bg: "#ECFDF5" }
    case "payment":
      return { name: "dollar-sign", color: "#065F46", bg: "#ECFDF5" }
    case "rating":
      return { name: "star", color: "#059669", bg: "#ECFDF5" }
    default:
      return { name: "bell", color: "#6B7280", bg: "#F3F4F6" }
  }
}

/* ===================== COMPONENT ===================== */
export default function NotificationsScreen({
  onBack,
  driverId = "1",
}: Props) {
  const { t, i18n } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([])

  const lastDeletedRef = useRef<Notification | null>(null)
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  /* ===================== FETCH ===================== */
  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/notifications?driver_id=${driverId}`
      )

      if (!res.ok) {
        setNotifications([])
        return
      }

      const text = await res.text()
      if (!text.trim()) {
        setNotifications([])
        return
      }

      const data = JSON.parse(text)

      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications)
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.log("Erreur fetch notifications:", error)
      setNotifications([])
    }
  }

  /* ===================== DELETE + UNDO ===================== */
  const deleteNotification = async (notification: Notification) => {
    try {
      lastDeletedRef.current = notification
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notification.id)
      )

      await fetch(
        `${BASE_URL}/notifications/${notification.id}`,
        { method: "DELETE" }
      )

      fetchNotifications()

      undoTimeoutRef.current = setTimeout(() => {
        lastDeletedRef.current = null
      }, 5000)

      Alert.alert(
        t("notificationDeleted"),
        t("undoPossible"),
        [
          { text: t("undo"), onPress: undoDelete },
          { text: "OK" },
        ]
      )
    } catch (error) {
      if (lastDeletedRef.current) {
        setNotifications((prev) => [
          lastDeletedRef.current!,
          ...prev,
        ])
        lastDeletedRef.current = null
      }
    }
  }

  const undoDelete = async () => {
    if (!lastDeletedRef.current) return

    try {
      await fetch(`${BASE_URL}/notifications/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastDeletedRef.current),
      })
      fetchNotifications()
    } catch (error) {
      console.error("Erreur undo :", error)
    } finally {
      lastDeletedRef.current = null
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    }
  }

  /* ===================== RENDER ITEM ===================== */
  const renderItem = useCallback(({ item }: { item: Notification }) => {
    const { name, color, bg } = getNotificationIcon(item.type)
    const isUnread = item.read === "f"

    return (
      <View style={styles.cardWrapper}>
        <View
          style={[
            styles.notificationCard,
            isUnread && styles.unreadCard,
          ]}
        >
          <View style={styles.row}>
            <View style={[styles.iconContainer, { backgroundColor: bg }]}>
              <Feather name={name as any} size={22} color={color} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.title}</Text>

                {isUnread && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>

              <Text style={styles.time}>
                {formatDate(item.created_at)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => deleteNotification(item)}
            >
              <Feather name="trash-2" size={18} color="#B91C1C" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }, [])

  /* ===================== UI ===================== */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {t("notifications")}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={10}
        windowSize={10}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t("noNotifications")}
          </Text>
        }
      />
    </View>
  )
}

/* ===================== PREMIUM STYLES ===================== */

const emerald = "#10B981"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#047857",
    elevation: 6,
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

  notificationCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },

  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: emerald,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  message: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 6,
  },

  time: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: emerald,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 60,
    color: "#6B7281",
    fontSize: 14,
  },
})
