import React, { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

/* ===================== TYPES ===================== */

type BookingHistoryProps = {
  onBack: () => void;
  passengerId?: string;
};

interface Driver {
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
}: BookingHistoryProps) {
  const { t } = useTranslation();
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  /* ===================== FETCH DATA ===================== */

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const [ridesRes, bookingsRes] = await Promise.all([
          fetch("http://10.0.2.2:8080/rides"),
          fetch("http://10.0.2.2:8080/bookings"),
        ]);

        const ridesJson = await ridesRes.json();
        const bookingsJson = await bookingsRes.json();

        if (!mounted) return;

        setRides(ridesJson?.rides ?? []);
        setBookings(bookingsJson?.bookings ?? []);
      } catch (e) {
        console.log("❌ BookingHistory fetch error", e);
        Alert.alert(t("error"), t("fetchError"));
      } finally {
        mounted && setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

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

  /* ===================== STATUS CONFIG ===================== */
  const getStatusConfig = (status: string) => {
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
  };

  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: BookingItem }) => {
    const statusConfig = getStatusConfig(item.status);
    const isCancelled = item.status === "cancelled";
    const isPending = item.status === "pending";

    return (
      <View style={[styles.card, isCancelled && styles.cancelledCard]}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.route}>
            {item.ride.departure} → {item.ride.arrival}
          </Text>

          <View style={[styles.badge, { backgroundColor: statusConfig.bgColor }]}>
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
            {t("bookedOn")} {new Date(item.createdAt).toLocaleDateString("fr-FR")}
          </Text>
        </View>

        {/* DRIVER */}
        <View style={styles.driverRow}>
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
        </View>

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

          {/* 🔹 CORRECTION: Utilisation d'icônes existantes */}
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
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t("cancelBooking")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>{t("contactDriver")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("myBookings")}</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* FILTER TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabs}>
          {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f as any)}
              style={[styles.tab, filter === f && styles.tabActive]}
            >
              <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
                {f === "all" ? t("all") : t(f)}
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>{t("noBookings")}</Text>
            <Text style={styles.emptySubtext}>{t("noBookingsDesc")}</Text>
          </View>
        }
      />
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

  tabsScroll: {
    marginHorizontal: 16,
    marginTop: 16,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
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
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
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
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 13,
  },
  contactButton: {
    flex: 1,
    backgroundColor: "#ECFDF5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  contactButtonText: {
    color: "#10B981",
    fontWeight: "600",
    fontSize: 13,
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
});

