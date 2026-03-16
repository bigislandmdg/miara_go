// PassengerHome.tsx (version complète avec chip “Book” sur les offres)
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
  RefreshControl,
  TextInput,
  Animated,
  Easing,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { DollarSign, Users, Calendar, Clock, Sliders, Car } from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Header } from "../components/Header";
import RideRequestScreen from "./RideRequestScreen";
import RatingScreen from "./RatingScreen";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ===================== TYPES ===================== */
export interface Trip {
  driver_id: any;
  id: string;
  driver: {
    name: string;
    rating: number;
    avatar?: string;
    phone?: string | null;
  };
  vehicle: {
    model: string;
    plate: string;
    totalSeats: number;
    availableSeats: number;
  };
  departure: string;
  arrival: string;
  date: string;
  time: string;
  price: number;
  meetingPoints: string[];
  hasRated?: boolean; // indique si le passager a déjà évalué
}

export interface Offer {
  id: string;
  ride_request_id: string;
  price_per_seat: string;
  seats_offered: string;
  message: string;
  car_info: string;
}

interface PassengerHomeProps {
  userId: number;
  onBookTrip?: (trip: Trip, offer: Offer | null, seats: number) => void;
  onSearch: (trips: Trip[], offers: Offer[]) => void;
  onNotifications?: () => void;
  onProfileClick?: () => void;
  userType?: "driver" | "passenger"; // Pour savoir si c'est un passager
  onRateTrip?: (trip: Trip) => void; // callback pour ouvrir l'écran rating
}

/* ===================== COMPONENT ===================== */
export default function PassengerHome({
  userId,
  onBookTrip,
  onSearch,
  onNotifications,
  onProfileClick,
  userType = "passenger",
}: PassengerHomeProps) {
  const { t } = useTranslation();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortType, setSortType] = useState<"none" | "price" | "date">("none");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const slideAnim = useRef(new Animated.Value(500)).current; // Modal filter slide

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [rideRequestModalVisible, setRideRequestModalVisible] = useState(false);
  const [selectedRideRequestId, setSelectedRideRequestId] = useState<number | null>(null);

  const [selectedTripForRating, setSelectedTripForRating] = useState<Trip | null>(null);
  const [ratingToken, setRatingToken] = useState<string>(""); // token pour RatingScreen

  const [infoCards] = useState([
    { id: 1, title: t("publishRideTitle"), description: t("publishRideDesc") },
  ]);

  const PAGE_SIZE = 3;
  const [tripPage, setTripPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);

  /* ===================== FETCH ===================== */
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.trim()) return null;
      return JSON.parse(text);
    } catch (e) {
      console.log("Fetch error:", e);
      return null;
    }
  };

  const fetchTrips = async () => {
    setLoadingTrips(true);
    const json = await safeFetchJson("http://10.0.2.2:8080/rides");

    if (Array.isArray(json?.rides)) {
      setTrips(
        json.rides.map((r: any) => ({
          id: String(r.id),
          departure: r.departure ?? "",
          arrival: r.arrival ?? "",
          date: r.date ?? "",
          time: r.time ?? "",
          price: Number(r.price ?? 0),
          meetingPoints: r.meetingPoints ?? [],
          hasRated: r.hasRated ?? false,
          driver_id: r.driver?.id ?? 0,
          driver: {
            name: r.driver?.name ?? "Driver",
            rating: Number(r.driver?.rating ?? 4.7),
            avatar: r.driver?.avatar ?? "",
            phone: r.driver?.phone ?? null,
          },
          vehicle: {
            model: r.vehicle?.model ?? "Car",
            plate: r.vehicle?.immatriculation ?? "",
            totalSeats: Number(r.vehicle?.nombre_places ?? 4),
            availableSeats: Number(r.vehicle?.availableSeats ?? 1),
          },
        }))
      );
    } else setTrips([]);
    setLoadingTrips(false);
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    const json = await safeFetchJson("http://10.0.2.2:8080/offers");
    if (Array.isArray(json?.offers)) setOffers(json.offers);
    else setOffers([]);
    setLoadingOffers(false);
  };

  useEffect(() => {
    fetchTrips();
    fetchOffers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTripPage(1);
    setOfferPage(1);
    await Promise.all([fetchTrips(), fetchOffers()]);
    setRefreshing(false);
  };

  /* ===================== SEARCH / FILTER ===================== */
  const filteredTrips = useMemo(() => {
    let result = [...trips];
    const q = searchText.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (t) =>
          t.departure.toLowerCase().includes(q) ||
          t.arrival.toLowerCase().includes(q) ||
          t.driver.name.toLowerCase().includes(q)
      );
    }
    if (onlyAvailable) {
      result = result.filter((t) => t.vehicle.availableSeats > 0);
    }
    if (sortType === "price") result.sort((a, b) => a.price - b.price);
    if (sortType === "date")
      result.sort(
        (a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime()
      );
    return result;
  }, [searchText, trips, sortType, onlyAvailable]);

  const filteredOffers = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return offers;
    return offers.filter(
      (o) => o.car_info.toLowerCase().includes(q) || o.message?.toLowerCase().includes(q)
    );
  }, [searchText, offers]);

  const paginatedTrips = filteredTrips.slice(0, tripPage * PAGE_SIZE);
  const paginatedOffers = filteredOffers.slice(0, offerPage * PAGE_SIZE);

  const getMapsDirectionUrl = (from: string, to: string) =>
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;

  /* ===================== HANDLER RATING ===================== */
  const openRatingScreen = async (trip: Trip) => {
    if (trip.hasRated) return;
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    setRatingToken(token);
    setSelectedTripForRating(trip);
  };

  const handleRatingSubmitted = (trip: Trip) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === trip.id ? { ...t, hasRated: true } : t))
    );
    setSelectedTripForRating(null);
  };

  /* ===================== RENDER ===================== */
  const renderTrip = ({ item }: { item: Trip }) => (
    <View style={styles.card}>
      <Text style={styles.route}>
        {item.departure} → {item.arrival}
      </Text>

      <View style={styles.driverRow}>
        <Image
          source={{ uri: item.driver.avatar || "https://via.placeholder.com/80" }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.driver}>{item.driver.name}</Text>
          <Text style={styles.smallText}>
            {item.vehicle.model} • {item.vehicle.plate}
          </Text>
        </View>

        {userType === "passenger" && (
          <TouchableOpacity
            style={[
              styles.ratingBadge,
              { backgroundColor: item.hasRated ? "#D1FAE5" : "#FDE68A" },
            ]}
            onPress={() => openRatingScreen(item)}
          >
            <Text style={{ fontSize: 12, fontWeight: "700" }}>
              {item.hasRated ? "✅ " + t("rated") : "⭐ " + t("rateTrip")}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.qrContainer}
          onPress={() => Linking.openURL(getMapsDirectionUrl(item.departure, item.arrival))}
        >
          <QRCode value={getMapsDirectionUrl(item.departure, item.arrival)} size={56} />
          <Text style={styles.qrHint}>{t("tripLabel")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.info}>
  <Calendar size={14} /> {item.date}
</Text>

<View style={styles.tripBottomRow}>
  <View style={{ flex: 1 }}>
    <Text style={styles.info}>
      <Clock size={14} /> {item.time}
    </Text>

    <Text style={styles.info}>
      <DollarSign size={14} /> {item.price} Ar
    </Text>
  </View>

  <TouchableOpacity
    style={styles.bookChips}
    onPress={() => onBookTrip?.(item, null, 1)}
  >
    <Text style={styles.bookChipsText}>{t("book")}</Text>
  </TouchableOpacity>
</View>

{item.driver.phone && (
  <TouchableOpacity
    style={[styles.bookButton, { backgroundColor: "#2563EB" }]}
    onPress={() => Linking.openURL(`tel:${item.driver.phone}`)}
  >
    <Text style={styles.bookText}>{t("callDriver")}</Text>
  </TouchableOpacity>
)}
        </View>
  );

  // ===================== RENDER OFFER =====================
  const renderOffer = ({ item }: { item: Offer }) => {
    const trip = trips.find((t) => t.id === String(item.ride_request_id));
    if (!trip) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.route}>
          {t("offerFor")} {trip.departure} → {trip.arrival}
        </Text>

        <View style={styles.offerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.info}>
              <Car size={14} /> {item.car_info}
            </Text>
            <Text style={styles.info}>
              <Users size={14} /> {item.seats_offered} {t("seats")}
            </Text>
            <Text style={styles.info}>
              <DollarSign size={14} /> {item.price_per_seat} Ar
            </Text>
          </View>

          {/* Chip “Book” */}
          <TouchableOpacity
            style={styles.bookChip}
            onPress={() => onBookTrip?.(trip, item, Number(item.seats_offered))}
          >
            <Text style={styles.bookChipText}>{t("book")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <Header title="MiaraGo" onNotifications={onNotifications} onProfileClick={onProfileClick} />

      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("searchPlaceholder")}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          style={[styles.filterButton, filterVisible && { backgroundColor: "#065F46" }]}
          onPress={() => {
            setFilterVisible(true);
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }).start();
          }}
        >
          <Sliders size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          {infoCards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.infoCard}
              onPress={() => {
                setSelectedRideRequestId(card.id);
                setRideRequestModalVisible(true);
              }}
            >
              <Text style={styles.infoCardTitle}>{card.title}</Text>
              <Text style={styles.infoCardDescription}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.section}>{t("availableTrips")}</Text>
        <FlatList data={paginatedTrips} keyExtractor={(i) => i.id} renderItem={renderTrip} scrollEnabled={false} />
        {paginatedTrips.length < filteredTrips.length && (
          <TouchableOpacity onPress={() => setTripPage((p) => p + 1)}>
            <Text style={styles.loadMore}>{t("seeMore")}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.section}>{t("offers")}</Text>
        <FlatList data={paginatedOffers} keyExtractor={(i) => String(i.id)} renderItem={renderOffer} scrollEnabled={false} />
        {paginatedOffers.length < filteredOffers.length && (
          <TouchableOpacity onPress={() => setOfferPage((p) => p + 1)}>
            <Text style={styles.loadMore}>{t("seeMore")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {rideRequestModalVisible && (
        <RideRequestScreen
          userId={userId}
          rideRequestId={selectedRideRequestId || undefined}
          onBack={() => setRideRequestModalVisible(false)}
        />
      )}

      {/* ===================== FILTER MODAL ===================== */}
      <Modal visible={filterVisible} transparent animationType="none">
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setFilterVisible(false)} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handleBar} />
            <Text style={styles.filterTitle}>{t("filterSort")}</Text>
            <TouchableOpacity style={styles.filterOption} onPress={() => setSortType("price")}>
              <Text>💰 {t("sortByPrice")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => setSortType("date")}>
              <Text>📅 {t("sortByDate")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterOption} onPress={() => setOnlyAvailable((v) => !v)}>
              <Text>{onlyAvailable ? "✅" : "⬜"} {t("onlyAvailable")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                Animated.timing(slideAnim, {
                  toValue: 500,
                  duration: 250,
                  easing: Easing.in(Easing.ease),
                  useNativeDriver: true,
                }).start(() => setFilterVisible(false));
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{t("apply")}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ===================== RATING MODAL ===================== */}
      {selectedTripForRating && (
        <Modal visible transparent animationType="slide">
          <RatingScreen
            rideId={Number(selectedTripForRating.id)}
            reviewerId={userId}
            reviewedId={selectedTripForRating.driver_id}
            token={ratingToken}
            tripUser={{
              id: selectedTripForRating.driver_id,
              nom: selectedTripForRating.driver.name.split(" ")[1] || "",
              prenom: selectedTripForRating.driver.name.split(" ")[0] || "",
              role: "driver",
              phone: selectedTripForRating.driver.phone || "",
            }}
            tripDetails={{
              departure: selectedTripForRating.departure,
              arrival: selectedTripForRating.arrival,
              date: selectedTripForRating.date,
            }}
            onBack={() => setSelectedTripForRating(null)}
            onBonusEarned={(credits) => {
              console.log("Bonus gagné:", credits);
            }}
          />
        </Modal>
      )}
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  searchWrapper: { flexDirection: "row", marginHorizontal: 16, marginTop: 12, marginBottom: 8, alignItems: "center" },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, elevation: 3 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  filterButton: { marginLeft: 12, backgroundColor: "#047857", padding: 12, borderRadius: 12 },
  section: { fontSize: 16, fontWeight: "700", margin: 16 },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 14 },
  route: { fontWeight: "700", fontSize: 15 },
  driverRow: { flexDirection: "row", marginTop: 12, alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  driver: { fontWeight: "600" },
  smallText: { fontSize: 12, color: "#6B7280" },
  info: { marginTop: 6, fontSize: 13 },
  bookButton: { marginTop: 12, backgroundColor: "#047857", paddingVertical: 12, borderRadius: 14, alignItems: "center" },
  bookText: { color: "#fff", fontWeight: "700" },
  qrContainer: { alignItems: "center" },
  qrHint: { fontSize: 10, color: "#6B7280" },
  loadMore: { textAlign: "center", color: "#1d1f23", marginBottom: 16 },
  infoCard: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 12, elevation: 3 },
  infoCardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  infoCardDescription: { fontSize: 12, color: "#6B7280" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: { backgroundColor: "#fff", padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleBar: { width: 40, height: 5, backgroundColor: "#D1D5DB", borderRadius: 3, alignSelf: "center", marginBottom: 16 },
  filterTitle: { fontWeight: "700", fontSize: 16, marginBottom: 16 },
  filterOption: { paddingVertical: 12 },
  applyButton: { marginTop: 20, backgroundColor: "#047857", padding: 14, borderRadius: 14, alignItems: "center" },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8, alignSelf: "flex-start" },

  // ===================== NOUVEAUX STYLES OFFRES =====================
  offerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bookChip: {
  backgroundColor: "#047857",
  paddingVertical: 6,
  paddingHorizontal: 14,
  borderRadius: 16,
},
bookChipText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 13,
},

  bookChips: {
      backgroundColor: "#047857",
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
  },
  
  bookChipsText: {
     color: "#fff",
     fontWeight: "700",
     fontSize: 13,
  },

  tripBottomRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 6,
},
});

