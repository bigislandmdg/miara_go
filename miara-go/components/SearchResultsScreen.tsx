// SearchResultsScreen.tsx (Optimisée & Clean)
import React, { useEffect, useRef, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  FlatList,
  TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { DollarSign, Users } from "lucide-react-native";
import { Trip, Offer } from "../components/PassengerHome";

interface Props {
  visible: boolean;
  trips?: Trip[];
  offers?: Offer[];
  searchQuery?: { departure: string; arrival: string };
  onClose?: () => void;
  onSelectTrip?: (trip: Trip, offer: Offer | null) => void;
}

export function SearchResultsScreen({
  visible,
  trips = [],
  offers = [],
  searchQuery,
  onClose,
  onSelectTrip,
}: Props) {
  const screenHeight = Dimensions.get("window").height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  const [localDeparture, setLocalDeparture] = useState(
    searchQuery?.departure ?? ""
  );
  const [localArrival, setLocalArrival] = useState(searchQuery?.arrival ?? "");

  // Sync with parent searchQuery when modal opens
  useEffect(() => {
    setLocalDeparture(searchQuery?.departure ?? "");
    setLocalArrival(searchQuery?.arrival ?? "");
  }, [searchQuery]);

  // Modal slide animation
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : screenHeight,
      duration: visible ? 280 : 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose?.());
  };

  // Filter trips dynamically
  const filteredTrips = useMemo(() => {
    return trips.filter(
      (t) =>
        t.departure.toLowerCase().includes(localDeparture.toLowerCase()) &&
        t.arrival.toLowerCase().includes(localArrival.toLowerCase())
    );
  }, [trips, localDeparture, localArrival]);

  // Render a trip card
  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectTrip?.(item, null)}
    >
      <Text style={styles.route}>
        {item.departure} → {item.arrival}
      </Text>
      <Text style={styles.price}>{item.price.toLocaleString()} Ar</Text>
    </TouchableOpacity>
  );

  // Render an offer card
  const renderOffer = ({ item }: { item: Offer }) => {
    const relatedTrip = trips.find((t) => t.id === String(item.ride_request_id));
    if (!relatedTrip) return null;

    return (
      <View style={styles.card}>
        <Text>🚗 {item.car_info}</Text>
        <Text style={styles.subText}>
          📍 {relatedTrip.departure} → {relatedTrip.arrival}
        </Text>
        <Text>
          <DollarSign size={14} /> {Number(item.price_per_seat).toLocaleString()} Ar
        </Text>
        <Text>
          <Users size={14} /> {item.seats_offered} places
        </Text>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => onSelectTrip?.(relatedTrip, item)}
        >
          <Text style={{ color: "#fff" }}>Réserver</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <Pressable style={styles.overlay} onPress={closeModal} />

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={closeModal}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Résultats</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* SEARCH & INFO */}
        <View style={styles.infoBox}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Départ"
              value={localDeparture}
              onChangeText={setLocalDeparture}
              style={styles.searchInput}
            />
            <TextInput
              placeholder="Arrivée"
              value={localArrival}
              onChangeText={setLocalArrival}
              style={styles.searchInput}
            />
          </View>
          <Text style={styles.routeText}>
            {localDeparture || "Départ"} → {localArrival || "Arrivée"}
          </Text>
          <Text style={styles.subText}>{filteredTrips.length} trajets trouvés</Text>
        </View>

        {/* OFFERS + TRIPS LIST */}
        <FlatList
          data={[...offers.map((o) => ({ type: "offer", data: o })), 
                 ...filteredTrips.map((t) => ({ type: "trip", data: t }))]}
          keyExtractor={(item, index) =>
            item.type === "offer" ? `offer-${item.data.id}` : `trip-${item.data.id}`
          }
          renderItem={({ item }) =>
            item.type === "offer"
              ? renderOffer({ item: item.data as Offer })
              : renderTrip({ item: item.data as Trip })
          }
          ListHeaderComponent={
            <Text style={styles.section}>Résultats de la recherche</Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </Animated.View>
    </Modal>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: "95%",
  },
  header: {
    backgroundColor: "#ffff",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "black",
    fontSize: 20,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
    fontSize: 16,
  },
  routeText: { fontSize: 18, fontWeight: "500" },
  subText: { color: "#6B7280", marginTop: 4 },
  section: { fontSize: 18, fontWeight: "700", margin: 16 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  route: { fontWeight: "600", fontSize: 16 },
  price: { color: "#10B981", marginTop: 4 },
  bookButton: {
    marginTop: 10,
    backgroundColor: "#10B981",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
