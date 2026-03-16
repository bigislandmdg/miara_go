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
} from "react-native";
import { Feather } from "@expo/vector-icons";

/* ===================== TYPES ===================== */

type BookingHistoryProps = {
  onBack: () => void;
  passengerId?: string;
};

interface Ride {
  id: string;
  departure: string;
  arrival: string;
  date: string;
  time: string;
  price: number;
  driver: {
    name: string;
    avatar: string;
  };
}

interface Booking {
  id: string;
  ride_id: string;
  offer_id: string | null;
  passenger_id: string;
  seats_reserved: string;
  total_price: string;
  created_at: string;
}

interface BookingItem {
  id: string;
  status: "upcoming" | "completed";
  seats: number;
  totalPrice: number;
  ride: Ride;
}

/* ===================== COMPONENT ===================== */

export default function BookingHistoryScreen({
  onBack,
  passengerId = "2",
}: BookingHistoryProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed">("all");

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
      .filter((b) => b.passenger_id === passengerId)
      .map((b) => {
        const ride = rides.find((r) => String(r.id) === String(b.ride_id));
        if (!ride) return null;

        return {
          id: b.id,
          status: b.offer_id ? "completed" : "upcoming",
          seats: Number(b.seats_reserved),
          totalPrice: Number(b.total_price),
          ride,
        };
      })
      .filter(Boolean) as BookingItem[];
  }, [bookings, rides, passengerId]);

  const filteredData = useMemo(() => {
    if (filter === "all") return mergedData;
    return mergedData.filter((i) => i.status === filter);
  }, [filter, mergedData]);

  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const renderItem = ({ item }: { item: BookingItem }) => {
    const isUpcoming = item.status === "upcoming";

    return (
      <View style={[styles.card, isUpcoming ? styles.upcomingCard : styles.completedCard]}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.route}>
            {item.ride.departure} → {item.ride.arrival}
          </Text>

          <View style={[styles.badge, isUpcoming ? styles.upcoming : styles.completed]}>
            <Text style={styles.badgeText}>
              {isUpcoming ? "À venir" : "Terminé"}
            </Text>
          </View>
        </View>

        {/* DATE */}
        <View style={styles.row}>
          <Feather name="calendar" size={14} color="#4B5563" />
          <Text style={styles.smallText}>
            {item.ride.date} • {item.ride.time}
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
              {item.ride.driver.name || "Conducteur"}
            </Text>
            <Text style={styles.smallText}>
              {item.seats} place(s) • {item.totalPrice.toLocaleString()} Ar
            </Text>
          </View>
        </View>
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
        <Text style={styles.title}>Mes Réservations</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* FILTER */}
      <View style={styles.tabs}>
        {["all", "upcoming", "completed"].map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f as any)}
            style={[styles.tab, filter === f && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f === "all" ? "Toutes" : f === "upcoming" ? "À venir" : "Terminées"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "gray", marginTop: 40 }}>
            Aucune réservation
          </Text>
        }
      />
    </View>
  );
}

/* ===================== STYLES ===================== */

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#10B981",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  tabs: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 16,
    overflow: "hidden",
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#10B981" },
  tabText: { color: "#4B5563", fontWeight: "500" },
  tabTextActive: { color: "#fff", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    width: width - 32,
    alignSelf: "center",
    elevation: 4,
  },
  upcomingCard: { borderLeftWidth: 4, borderLeftColor: "#10B981" },
  completedCard: { borderLeftWidth: 4, borderLeftColor: "#059669" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  route: { fontSize: 16, fontWeight: "700", color: "#111827" },

  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  upcoming: { backgroundColor: "#D1FAE5" },
  completed: { backgroundColor: "#A7F3D0" },
  badgeText: { fontSize: 12, color: "#065F46", fontWeight: "600" },

  row: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  smallText: { marginLeft: 6, fontSize: 12, color: "#6B7280" },

  driverRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14 },
  driver: { fontWeight: "600", fontSize: 14, color: "#111827" },
});
