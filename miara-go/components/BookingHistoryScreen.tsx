import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
  Animated,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ===================== TYPES ===================== */

type BookingHistoryProps = {
  onBack: () => void;
  passengerId?: string;
  onCancelBooking?: (bookingId: string) => void;
  onContactDriver?: (driver: Driver) => void;
};

interface Driver {
  id?: string;
  name: string;
  avatar: string;
  phone?: string;
  rating?: number;
}

interface Ride {
  id: string;
  departure: string;
  arrival: string;
  date: string;
  time: string;
  price: number;
  driver: Driver;
  vehicle?: {
    model: string;
    plate: string;
    totalSeats: number;
    availableSeats: number;
  };
}

interface Booking {
  id: string;
  ride_id: string;
  offer_id: string | null;
  seats_reserved: string;
  total_price: string;
  status: string;
  baby_on_board: string;
  pets_on_board: string;
  luggage_on_board: string;
  created_at: string;
  updated_at: string;
}

interface BookingItem {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  seats: number;
  totalPrice: number;
  ride: Ride;
  createdAt: string;
  hasBaby: boolean;
  hasPets: boolean;
  hasLuggage: boolean;
}

/* ===================== COMPONENT ===================== */

export default function BookingHistoryScreen({
  onBack,
  passengerId = "2",
  onCancelBooking,
  onContactDriver,
}: BookingHistoryProps) {
  const { t } = useTranslation();
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  /* ===================== ANIMATIONS ===================== */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ===================== FETCH DATA ===================== */
  const fetchData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const [ridesRes, bookingsRes] = await Promise.all([
        fetch("http://10.0.2.2:8080/rides", { headers }),
        fetch("http://10.0.2.2:8080/bookings", { headers }),
      ]);

      if (!ridesRes.ok || !bookingsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const ridesJson = await ridesRes.json();
      const bookingsJson = await bookingsRes.json();

      setRides(ridesJson?.rides ?? []);
      setBookings(bookingsJson?.bookings ?? []);
    } catch (e) {
      console.log("❌ BookingHistory fetch error", e);
      Alert.alert(t("error"), t("fetchError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ===================== REFRESH ===================== */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  /* ===================== MERGE BOOKINGS + RIDES ===================== */
  const mergedData: BookingItem[] = useMemo(() => {
    return bookings
      .map((b) => {
        const ride = rides.find((r) => String(r.id) === String(b.ride_id));
        if (!ride) return null;

        return {
          id: b.id,
          status: b.status as "pending" | "confirmed" | "cancelled" | "completed",
          seats: Number(b.seats_reserved),
          totalPrice: Number(b.total_price),
          ride,
          createdAt: b.created_at,
          hasBaby: b.baby_on_board === "1",
          hasPets: b.pets_on_board === "1",
          hasLuggage: b.luggage_on_board === "1",
        };
      })
      .filter(Boolean) as BookingItem[];
  }, [bookings, rides]);

  const filteredData = useMemo(() => {
    if (filter === "all") return mergedData;
    return mergedData.filter((i) => i.status === filter);
  }, [filter, mergedData]);

  // Statistiques pour le header
  const stats = useMemo(() => {
    const total = mergedData.length;
    const pending = mergedData.filter(b => b.status === "pending").length;
    const confirmed = mergedData.filter(b => b.status === "confirmed").length;
    const completed = mergedData.filter(b => b.status === "completed").length;
    const cancelled = mergedData.filter(b => b.status === "cancelled").length;
    const totalSpent = mergedData.reduce((sum, b) => sum + b.totalPrice, 0);
    
    return { total, pending, confirmed, completed, cancelled, totalSpent };
  }, [mergedData]);

  /* ===================== CANCEL BOOKING ===================== */
  const handleCancelBooking = useCallback(async () => {
    if (!selectedBooking) return;
    
    setCancelling(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`http://10.0.2.2:8080/bookings/${selectedBooking.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      // Mettre à jour la liste localement
      setBookings(prev => 
        prev.map(b => 
          b.id === selectedBooking.id 
            ? { ...b, status: "cancelled", updated_at: new Date().toISOString() }
            : b
        )
      );

      Alert.alert(t("success"), t("bookingCancelled"));
      onCancelBooking?.(selectedBooking.id);
    } catch (error) {
      console.log("Cancel booking error:", error);
      Alert.alert(t("error"), t("cancelError"));
    } finally {
      setCancelling(false);
      setCancelModalVisible(false);
      setSelectedBooking(null);
    }
  }, [selectedBooking, t, onCancelBooking]);

  /* ===================== STATUS CONFIG ===================== */
  const getStatusConfig = useCallback((status: string) => {
    switch (status) {
      case "pending":
        return {
          label: t("pending"),
          bgColor: "#FEF3C7",
          textColor: "#B45309",
          icon: "clock",
        };
      case "confirmed":
        return {
          label: t("confirmed"),
          bgColor: "#D1FAE5",
          textColor: "#047857",
          icon: "check-circle",
        };
      case "completed":
        return {
          label: t("completed"),
          bgColor: "#DBEAFE",
          textColor: "#1D4ED8",
          icon: "check-square",
        };
      case "cancelled":
        return {
          label: t("cancelled"),
          bgColor: "#FEE2E2",
          textColor: "#DC2626",
          icon: "x-circle",
        };
      default:
        return {
          label: t("pending"),
          bgColor: "#FEF3C7",
          textColor: "#B45309",
          icon: "clock",
        };
    }
  }, [t]);

  /* ===================== FORMAT DATE ===================== */
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  /* ===================== RENDER ITEM ===================== */
  const renderItem = useCallback(({ item, index }: { item: BookingItem; index: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const isCancelled = item.status === "cancelled";
    const isPending = item.status === "pending";
    const isCompleted = item.status === "completed";
    
    // Animation d'entrée différée
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const itemSlideAnim = useRef(new Animated.Value(20)).current;
    
    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemFadeAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(itemSlideAnim, {
          toValue: 0,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.card,
          isCancelled && styles.cancelledCard,
          {
            opacity: itemFadeAnim,
            transform: [{ translateY: itemSlideAnim }],
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.route}>
            {item.ride.departure} → {item.ride.arrival}
          </Text>

          <View style={[styles.badge, { backgroundColor: statusConfig.bgColor }]}>
            <Feather name={statusConfig.icon as any} size={12} color={statusConfig.textColor} />
            <Text style={[styles.badgeText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* DATE & TIME */}
        <View style={styles.row}>
          <Feather name="calendar" size={14} color="#6B7280" />
          <Text style={styles.smallText}>
            {item.ride.date} • {item.ride.time}
          </Text>
        </View>

        {/* RESERVATION DATE */}
        <View style={styles.row}>
          <Feather name="clock" size={14} color="#6B7280" />
          <Text style={styles.smallText}>
            {t("bookedOn")} {formatDate(item.createdAt)}
          </Text>
        </View>

        {/* DRIVER */}
        <TouchableOpacity 
          style={styles.driverRow}
          onPress={() => onContactDriver?.(item.ride.driver)}
          activeOpacity={0.7}
        >
          <Image
            source={{
              uri: item.ride.driver.avatar || "https://via.placeholder.com/100",
            }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.driver}>
              {item.ride.driver.name || t("driver")}
            </Text>
            {item.ride.driver.rating && (
              <View style={styles.ratingContainer}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>{item.ride.driver.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
          {!isCancelled && (
            <Feather name="chevron-right" size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>

        {/* DETAILS */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Feather name="users" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.seats} {t("seats")}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Feather name="dollar-sign" size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {item.totalPrice.toLocaleString()} Ar
            </Text>
          </View>

          {item.hasBaby && (
            <View style={styles.detailItem}>
              <Feather name="heart" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{t("babyOnBoard")}</Text>
            </View>
          )}

          {item.hasPets && (
            <View style={styles.detailItem}>
              <Feather name="heart" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{t("petsOnBoard")}</Text>
            </View>
          )}

          {item.hasLuggage && (
            <View style={styles.detailItem}>
              <Feather name="briefcase" size={14} color="#6B7280" />
              <Text style={styles.detailText}>{t("luggageOnBoard")}</Text>
            </View>
          )}
        </View>

        {/* VEHICLE INFO */}
        {item.ride.vehicle && (
          <View style={styles.vehicleContainer}>
            <Feather name="truck" size={14} color="#6B7280" />
            <Text style={styles.vehicleText}>
              {item.ride.vehicle.model} • {item.ride.vehicle.plate}
            </Text>
          </View>
        )}

        {/* ACTION BUTTONS */}
        {isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setSelectedBooking(item);
                setCancelModalVisible(true);
              }}
            >
              <Feather name="x-circle" size={16} color="#DC2626" />
              <Text style={styles.cancelButtonText}>{t("cancelBooking")}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => onContactDriver?.(item.ride.driver)}
            >
              <Feather name="phone" size={16} color="#10B981" />
              <Text style={styles.contactButtonText}>{t("contactDriver")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COMPLETED ACTION */}
        {isCompleted && (
          <TouchableOpacity style={styles.rebookButton}>
            <Feather name="repeat" size={16} color="#fff" />
            <Text style={styles.rebookButtonText}>{t("bookAgain")}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }, [getStatusConfig, t, formatDate, onContactDriver]);

  /* ===================== RENDER ===================== */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER AVEC STATS */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("myBookings")}</Text>
        <View style={{ width: 22 }} />
      </Animated.View>

      {/* CARTE STATISTIQUES */}
      <Animated.View 
        style={[
          styles.statsCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>{t("total")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#B45309" }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>{t("pending")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#047857" }]}>{stats.confirmed}</Text>
            <Text style={styles.statLabel}>{t("confirmed")}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#1D4ED8" }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>{t("completed")}</Text>
          </View>
        </View>
        
        <View style={styles.totalSpentContainer}>
          <Text style={styles.totalSpentLabel}>{t("totalSpent")}</Text>
          <Text style={styles.totalSpentAmount}>{stats.totalSpent.toLocaleString()} Ar</Text>
        </View>
      </Animated.View>

      {/* FILTER TABS */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        <View style={styles.tabs}>
          {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f as any)}
              style={[styles.tab, filter === f && styles.tabActive]}
            >
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f === "all" ? t("all") : t(f)}
                {f !== "all" && (
                  <Text style={styles.tabCount}>
                    {" "}({mergedData.filter(b => b.status === f).length})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={filteredData}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#10B981"]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>{t("noBookings")}</Text>
            <Text style={styles.emptySubtext}>{t("noBookingsDesc")}</Text>
          </View>
        }
      />

      {/* MODAL D'ANNULATION */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Feather name="alert-triangle" size={48} color="#DC2626" />
            </View>
            <Text style={styles.modalTitle}>{t("cancelBooking")}</Text>
            <Text style={styles.modalMessage}>
              {t("cancelBookingConfirm")}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setCancelModalVisible(false)}
                disabled={cancelling}
              >
                <Text style={styles.modalCancelButtonText}>{t("no")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCancelBooking}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>{t("yes")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===================== STYLES ===================== */

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#10B981",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  // Carte statistiques
  statsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#10B981",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E7EB",
  },
  totalSpentContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalSpentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  totalSpentAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },

  tabsScroll: {
    marginTop: 16,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 30,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: "#10B981",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabCount: {
    fontSize: 12,
    fontWeight: "400",
  },

  listContent: {
    padding: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cancelledCard: {
    opacity: 0.7,
    backgroundColor: "#FEF2F2",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  route: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  smallText: {
    fontSize: 12,
    color: "#6B7280",
  },

  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  driver: {
    fontWeight: "600",
    fontSize: 14,
    color: "#111827",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: "#6B7280",
  },

  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#374151",
  },

  vehicleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  vehicleText: {
    fontSize: 12,
    color: "#6B7280",
  },

  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 13,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ECFDF5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  contactButtonText: {
    color: "#10B981",
    fontWeight: "600",
    fontSize: 13,
  },
  rebookButton: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  rebookButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: width - 48,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
  },
  modalCancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  modalConfirmButton: {
    backgroundColor: "#DC2626",
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

