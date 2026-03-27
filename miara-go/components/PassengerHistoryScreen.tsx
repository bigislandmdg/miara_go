import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { Car, MapPin, Calendar, Clock, ChevronRight, Star, CheckCircle, Clock as ClockIcon } from "lucide-react-native";

import type { Trip } from "./PassengerHome";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

type PassengerHistoryProps = {
  onBack: () => void;
  onBookingPress: (trip: Trip, bookingId: string) => void;
};

interface Booking {
  id: string;
  ride_id: string;
  offer_id: string | null;
  seats_reserved: string;
  total_price: string;
  status: string;
  created_at: string;
}

interface HistoryItem {
  id: string;
  status: "pending" | "completed";
  seats: number;
  totalPrice: number;
  meetingPoint?: string;
  vehicleModel?: string;
  trip: Trip;
  createdAt?: string;
}

const ITEMS_PER_PAGE = 4;

export default function PassengerHistoryScreen({
  onBack,
  onBookingPress,
}: PassengerHistoryProps) {

  const { t } = useTranslation();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<"pending" | "completed">("pending");

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  /* ================= FETCH WITH ERROR HANDLING ================= */

  const safeFetchJson = async (url: string) => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`HTTP Error ${response.status}: ${url}`);
        return null;
      }
      
      const text = await response.text();
      
      // Vérifier si la réponse est vide
      if (!text || text.trim() === "") {
        console.log(`Empty response from ${url}`);
        return null;
      }
      
      // Essayer de parser le JSON
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.log(`JSON parse error for ${url}:`, parseError);
        console.log(`Response preview: ${text.substring(0, 100)}`);
        return null;
      }
    } catch (networkError) {
      console.log(`Network error for ${url}:`, networkError);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ridesData, bookingsData] = await Promise.all([
        safeFetchJson("http://10.0.2.2:8080/rides"),
        safeFetchJson("http://10.0.2.2:8080/bookings"),
      ]);

      // Gérer les trajets
      const ridesArray = ridesData?.rides ?? [];
      const bookingsArray = bookingsData?.bookings ?? [];

      if (ridesArray.length === 0 && bookingsArray.length === 0) {
        console.log("No data received from server");
      }

      const mappedTrips: Trip[] = ridesArray.map((r: any) => ({
        id: String(r.id),
        departure: r.departure ?? "",
        arrival: r.arrival ?? "",
        date: r.date ?? "",
        time: r.time ?? "",
        price: Number(r.price ?? 0),
        meetingPoints: r.meetingPoint ? [r.meetingPoint.name] : [],
        driver: {
          name: r.driver?.name ?? "Driver",
          rating: Number(r.driver?.rating ?? 4.7),
          avatar: r.driver?.avatar ?? "https://via.placeholder.com/80",
        },
        vehicle: {
          model: `${r.vehicle?.marque ?? ""} ${r.vehicle?.model ?? ""}`.trim() || "Véhicule",
          plate: r.vehicle?.plate ?? "",
          totalSeats: Number(r.vehicle?.totalSeats ?? 4),
          availableSeats: Number(r.availableSeats ?? 0),
        },
      }));

      setTrips(mappedTrips);
      setBookings(bookingsArray);
      setPage(1);
      setHasMore(true);
    } catch (e) {
      console.log("History fetch error:", e);
      setError("Impossible de charger l'historique. Vérifiez votre connexion.");
      setTrips([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  /* ================= MERGE BOOKINGS + RIDES ================= */

  const historyData: HistoryItem[] = useMemo(() => {
    return bookings
      .map((b) => {
        const trip = trips.find((t) => t.id === String(b.ride_id));
        if (!trip) return null;

        return {
          id: b.id,
          status: b.status === "pending" ? "pending" : "completed",
          seats: Number(b.seats_reserved),
          totalPrice: Number(b.total_price),
          meetingPoint: trip.meetingPoints?.[0] ?? "",
          vehicleModel: trip.vehicle?.model ?? "",
          trip,
          createdAt: b.created_at,
        };
      })
      .filter(Boolean) as HistoryItem[];
  }, [bookings, trips]);

  /* ================= FILTER + PAGINATION ================= */

  const filteredData = historyData.filter((h) => h.status === activeTab);
  const paginatedData = filteredData.slice(0, page * ITEMS_PER_PAGE);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    if (page * ITEMS_PER_PAGE >= filteredData.length) {
      setHasMore(false);
      return;
    }
    setLoadingMore(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 300);
  };

  /* ================= SKELETON ================= */

  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonLarge} />
          <View style={styles.skeletonMedium} />
        </View>
      </View>
      <View style={styles.skeletonDivider} />
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonIconSmall} />
        <View style={styles.skeletonSmall} />
      </View>
      <View style={styles.skeletonFooter} />
    </View>
  );

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item, index }: { item: HistoryItem; index: number }) => {
    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header with status */}
        <View style={styles.cardHeader}>
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.routeDotStart} />
              <Text style={styles.routeText} numberOfLines={1}>{item.trip.departure}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <View style={styles.routeDotEnd} />
              <Text style={styles.routeText} numberOfLines={1}>{item.trip.arrival}</Text>
            </View>
          </View>
          
          <View style={[
            styles.statusBadge,
            item.status === "pending" ? styles.statusPendingBadge : styles.statusCompletedBadge
          ]}>
            {item.status === "pending" ? (
              <ClockIcon size={12} color="#B45309" />
            ) : (
              <CheckCircle size={12} color="#047857" />
            )}
            <Text style={[
              styles.statusBadgeText,
              item.status === "pending" ? styles.statusPendingText : styles.statusCompletedText
            ]}>
              {item.status === "pending" ? t("pending") : t("completed")}
            </Text>
          </View>
        </View>

        {/* Trip details */}
        <View style={styles.tripDetails}>
          <View style={styles.detailRow}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.trip.date}</Text>
            <View style={styles.dotSeparator} />
            <Clock size={14} color="#6B7280" />
            <Text style={styles.detailText}>{item.trip.time}</Text>
          </View>

          <View style={styles.detailRow}>
            <Car size={14} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.vehicleModel || t("vehicle")}
            </Text>
          </View>

          {item.meetingPoint && (
            <View style={styles.detailRow}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.meetingPoint}
              </Text>
            </View>
          )}
        </View>

        {/* Driver info */}
        <View style={styles.driverSection}>
          <Image
            source={{ uri: item.trip.driver?.avatar || "https://via.placeholder.com/80" }}
            style={styles.driverAvatar}
          />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{item.trip.driver?.name || t("driver")}</Text>
            <View style={styles.ratingContainer}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{(item.trip.driver?.rating || 4.7).toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Price and booking info */}
        <View style={styles.priceSection}>
          <View>
            <Text style={styles.priceLabel}>{t("total")}</Text>
            <Text style={styles.priceValue}>{item.totalPrice.toLocaleString()} Ar</Text>
            <Text style={styles.seatsInfo}>{item.seats} {t("seats")}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onBookingPress(item.trip, item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsButtonText}>{t("seeDetails")}</Text>
            <ChevronRight size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  /* ================= UI ================= */

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Car size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === "pending" ? "Aucun trajet en attente" : "Aucun trajet terminé"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "pending" 
          ? "Vous n'avez pas de réservation en attente pour le moment." 
          : "Vous n'avez pas encore de trajets terminés."}
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: "#FEF2F2" }]}>
        <Feather name="alert-circle" size={48} color="#EF4444" />
      </View>
      <Text style={styles.emptyTitle}>Erreur de chargement</Text>
      <Text style={styles.emptySubtitle}>{error || "Impossible de charger vos trajets."}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
        <Text style={styles.retryButtonText}>Réessayer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#059669", "#047857"]}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("passengerHistoryTitle")}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            {t("pending")}
          </Text>
          {activeTab === "pending" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.tabActive]}
          onPress={() => setActiveTab("completed")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}>
            {t("completed")}
          </Text>
          {activeTab === "completed" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 16 }}
        >
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </ScrollView>
      ) : error ? (
        <ErrorState />
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator color="#059669" />
              </View>
            ) : null
          }
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

/* ================= STYLES ================= */

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  header: {
    flexDirection: "row",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    position: "relative",
  },

  tabActive: {
    backgroundColor: "transparent",
  },

  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
  },

  tabTextActive: {
    color: "#059669",
    fontWeight: "600",
  },

  tabIndicator: {
    position: "absolute",
    bottom: -1,
    left: "30%",
    right: "30%",
    height: 2,
    backgroundColor: "#059669",
    borderRadius: 1,
  },

  listContent: {
    padding: 16,
    paddingBottom: 100,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  routeContainer: {
    flex: 1,
    marginRight: 12,
  },

  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  routeDotStart: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },

  routeDotEnd: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#664c4c",
  },

  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginLeft: 3,
    marginVertical: 4,
  },

  routeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },

  statusPendingBadge: {
    backgroundColor: "#FEF3C7",
  },

  statusCompletedBadge: {
    backgroundColor: "#D1FAE5",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  statusPendingText: {
    color: "#5f442f",
  },

  statusCompletedText: {
    color: "#047857",
  },

  tripDetails: {
    gap: 8,
    marginBottom: 16,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
  },

  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
  },

  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 16,
  },

  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },

  driverInfo: {
    flex: 1,
  },

  driverName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  ratingText: {
    fontSize: 12,
    color: "#6B7280",
  },

  priceSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  priceLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },

  priceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },

  seatsInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 6,
  },

  detailsButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },

  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },

  // Skeleton styles
  skeletonCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },

  skeletonIconSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },

  skeletonContent: {
    flex: 1,
  },

  skeletonLarge: {
    height: 18,
    width: "70%",
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 8,
  },

  skeletonMedium: {
    height: 14,
    width: "50%",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },

  skeletonSmall: {
    height: 12,
    width: "40%",
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },

  skeletonDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },

  skeletonFooter: {
    height: 36,
    width: "40%",
    backgroundColor: "#E5E7EB",
    borderRadius: 20,
    alignSelf: "flex-end",
  },
});
