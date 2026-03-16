// BookingScreen.tsx — Version finale Ultra Premium (sécurisée)
import React, { JSX, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  Switch,
} from "react-native";
import { ArrowLeft, Calendar, Clock, Car, Bus, Dog, Cat, Rabbit, Bird, Baby } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Trip, Offer } from "./PassengerHome";
import { useTranslation } from "react-i18next";

/* ================= TYPES ================= */
type SeatCell = number | "driver" | "aisle";

interface BabyOption {
  label: string;
  icon: JSX.Element;
  selected: boolean;
}

interface PetOption {
  type: string;
  icon: JSX.Element;
  selected: boolean;
}

interface VehicleOption {
  label: string;
  seats: number;
  type: string;
  plate?: string;
  is_active?: boolean;
  image?: string | null;
}

interface BookingScreenProps {
  trip: Trip;
  offer?: Offer;
  userId: number;
  onClose?: () => void;
  onBookingSuccess?: (trip: Trip) => void;
}

/* ================= COMPONENT ================= */
export default function BookingScreen({
  trip,
  offer,
  userId,
  onClose,
  onBookingSuccess,
}: BookingScreenProps) {
  const { t } = useTranslation();
  const screenHeight = Dimensions.get("window").height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [babyOnBoard, setBabyOnBoard] = useState(false);
  const [petsOnBoard, setPetsOnBoard] = useState(false);
  const [luggageOnBoard, setLuggageOnBoard] = useState(false);

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);

  const [seatLayout, setSeatLayout] = useState<SeatCell[][]>([]);
  const [selectedSeatIndexes, setSelectedSeatIndexes] = useState<number[]>([]);

  const selectedSeatCount = selectedSeatIndexes.length;
  const totalPrice = selectedSeatCount * (offer ? Number(offer.price_per_seat) : trip.price);

  const [babyOptions, setBabyOptions] = useState<BabyOption[]>([
      { label: t("0–6 mois"), icon: <Baby size={24} color="#111827" />, selected: false },
      { label: t("6–12 mois"), icon: <Baby size={24} color="#111827" />, selected: false },
      { label: t("12–18 mois"), icon: <Baby size={24} color="#111827" />, selected: false },
      { label: t("18–30 mois"), icon: <Baby size={24} color="#111827" />, selected: false },
  ]);

  const toggleBabyOption = (label: string) => {
     setBabyOptions(prev =>
       prev.map(b => b.label === label ? { ...b, selected: !b.selected } : b)
     );
    };

  const [petOptions, setPetOptions] = useState<PetOption[]>([
  { type: t("dog"), icon: <Dog size={24} color="#111827" />, selected: false },
  { type: t("cat"), icon: <Cat size={24} color="#111827" />, selected: false },
  { type: t("bird"), icon: <Bird size={24} color="#111827" />, selected: false },
  { type: t("rabbit"), icon: <Rabbit size={24} color="#111827" />, selected: false },
]);

const togglePet = (type: string) => {
  setPetOptions(prev =>
    prev.map(p => p.type === type ? { ...p, selected: !p.selected } : p)
  );
};

  /* ================= ANIMATION ================= */
  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
  }, []);

  const closeSheet = () => {
    Animated.timing(slideAnim, { toValue: screenHeight, duration: 250, useNativeDriver: true }).start(() => {
      setShowSuccess(false);
      onClose?.();
    });
  };

  /* ================= FETCH VEHICLES SÉCURISÉ ================= */
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const baseURL = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
        const res = await fetch(`${baseURL}/vehicles?user_id=${userId}`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();

        // fallback si réponse vide ou invalide
        const fallbackVehicle: VehicleOption = {
          label: "Toyota Hilux",
          seats: 5,
          type: "pickup",
          plate: "N/A",
          is_active: true,
        };

        if (!text) {
          console.log("Empty vehicle response → fallback");
          setVehicles([fallbackVehicle]);
          setSelectedVehicle(fallbackVehicle);
          return;
        }

        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.log("JSON parse failed (vehicles):", err);
          setVehicles([fallbackVehicle]);
          setSelectedVehicle(fallbackVehicle);
          return;
        }

        if (!data || !Array.isArray(data.vehicles) || data.vehicles.length === 0) {
          console.log("No vehicles found → fallback");
          setVehicles([fallbackVehicle]);
          setSelectedVehicle(fallbackVehicle);
          return;
        }

        const formatted: VehicleOption[] = data.vehicles.map((v: any) => ({
          label: `${v.marque ?? "Unknown"} ${v.modele ?? ""}`,
          seats: Number(v.nombre_places) || 2,
          type: v.type_vehicule || "unknown",
          plate: v.immatriculation || "N/A",
          image: v.photos || null,
          is_active: v.status === "active",
        }));

        setVehicles(formatted);
        setSelectedVehicle(formatted[0]);
      } catch (err) {
        console.log("Vehicle fetch failed → fallback", err);
        const fallbackVehicle: VehicleOption = {
          label: "Toyota Hilux",
          seats: 5,
          type: "pickup",
          plate: "N/A",
          is_active: true,
        };
        setVehicles([fallbackVehicle]);
        setSelectedVehicle(fallbackVehicle);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [userId]);

  /* ================= GENERATE SEAT LAYOUT ================= */
  useEffect(() => {
    if (!selectedVehicle) return;

    const generateSeatLayout = (seats: number, type?: string): SeatCell[][] => {
      const layout: SeatCell[][] = [];
      let seatNumber = 1;
      const lowerType = type?.toLowerCase() || "";

      const isSprinter = seats >= 20 || lowerType.includes("sprinter") || lowerType.includes("minibus");
      const isFiveSeater = seats === 5 || lowerType.includes("hilux") || lowerType.includes("pickup") || lowerType.includes("corolla");

      if (isFiveSeater) {
        layout.push(["driver", seatNumber++]);
        layout.push([seatNumber++, seatNumber++, seatNumber++, "aisle"]);
        return layout;
      }

      if (!isSprinter) {
        const baseLayout: SeatCell[][] = [["driver"]];
        let remainingSeats = seats;
        while (remainingSeats > 0) {
          const row: SeatCell[] = [];
          const rowSeats = Math.min(2, remainingSeats);
          for (let i = 0; i < rowSeats; i++) row.push(seatNumber++);
          baseLayout.push(row);
          remainingSeats -= rowSeats;
        }
        return baseLayout;
      }

      // Sprinter / minibus
      layout.push(["driver", seatNumber++, seatNumber++]);
      let remainingSeats = seats - 2;
      if (remainingSeats > 0) {
        layout.push([seatNumber++, seatNumber++, "aisle"]);
        remainingSeats -= 2;
      }
      for (let i = 0; i < 2; i++) {
        if (remainingSeats <= 0) break;
        const row: SeatCell[] = [];
        for (let j = 0; j < 3 && remainingSeats > 0; j++) {
          row.push(seatNumber++);
          remainingSeats--;
        }
        row.push("aisle");
        layout.push(row);
      }
      while (remainingSeats > 4) {
        const row: SeatCell[] = [];
        for (let i = 0; i < 2 && remainingSeats > 0; i++) {
          row.push(seatNumber++);
          remainingSeats--;
        }
        row.push("aisle");
        if (remainingSeats > 0) row.push(seatNumber++);
        remainingSeats--;
        layout.push(row);
      }
      if (remainingSeats > 0) {
        const lastRow: SeatCell[] = [];
        while (remainingSeats > 0) {
          lastRow.push(seatNumber++);
          remainingSeats--;
        }
        layout.push(lastRow);
      }

      return layout;
    };

    setSeatLayout(generateSeatLayout(selectedVehicle.seats, selectedVehicle.type));
    setSelectedSeatIndexes([]);
  }, [selectedVehicle]);

  /* ================= VEHICLE ICON ================= */
  const getVehicleIcon = (type?: string) => {
    const lower = type?.toLowerCase() || "";
    if (lower.includes("pickup") || lower.includes("hilux")) return <Car size={18} color="#fff" />;
    if (lower.includes("minibus") || lower.includes("sprinter")) return <Bus size={18} color="#fff" />;
    return <Car size={18} color="#fff" />;
  };

  /* ================= SEAT TOGGLE ================= */
  const toggleSeat = (seatNumber: number) => {
    setSelectedSeatIndexes(prev =>
      prev.includes(seatNumber) ? prev.filter(s => s !== seatNumber) : [...prev, seatNumber]
    );
  };

  /* ================= CONFIRM BOOKING SÉCURISÉ ================= */
  const confirmBooking = async () => {
    if (selectedSeatCount === 0) {
      Toast.show({ type: "error", text1: t("selectAtLeastOneSeat") });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ride_id: Number(trip.id),
        offer_id: offer ? Number(offer.id) : null,
        seats_reserved: selectedSeatCount,
        total_price: totalPrice,
        status: "pending",
        vehicle_type: selectedVehicle?.type,
        selected_seats: selectedSeatIndexes,
        baby_on_board: babyOnBoard ? 1 : 0,
        pets_on_board: petsOnBoard ? 1 : 0,
        luggage_on_board: luggageOnBoard ? 1 : 0,
      };

      const baseURL = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
      const response = await fetch(`${baseURL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data: any = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }

      if (!response.ok) throw new Error(data.message || t("serverError"));

      setShowSuccess(true);
      Toast.show({ type: "success", text1: t("bookingSent") });
      onBookingSuccess?.(trip);
    } catch (e: any) {
      Toast.show({ type: "error", text1: t("error"), text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <Modal transparent animationType="none">
      <Pressable style={styles.overlay} onPress={closeSheet} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={closeSheet}><ArrowLeft size={22} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{t("bookTrip")}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
          {/* TRAJET */}
          <View style={styles.card}>
            <Text style={styles.route}>{trip.departure} → {trip.arrival}</Text>
            <View style={styles.row}>
              <Calendar size={14} /><Text>{trip.date}</Text>
              <Clock size={14} /><Text>{trip.time}</Text>
            </View>
          </View>

          {/* VEHICLES */}
          <View style={styles.card}>
            <View style={styles.row}><Car size={18} /><Text style={styles.sectionTitle}>{t("vehicle")}</Text></View>
            {loadingVehicles ? (
              <Text>{t("loadingVehicles")}...</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -16, paddingLeft: 16 }}>
                {vehicles.map((item, index) => {
                  const selected = item.label === selectedVehicle?.label;
                  return (
                    <TouchableOpacity
                      key={(item.plate ?? "unknown") + "-" + index}
                      activeOpacity={0.9}
                      onPress={() => setSelectedVehicle(item)}
                      style={[styles.glassCard, selected && styles.glassCardSelected]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: item.is_active ? "#22C55E" : "#EF4444" }]} />
                      <Text style={[styles.vehicleTitle, selected && { color: "#fff" }]}>{item.label}</Text>
                      <View style={styles.plateContainer}><Text style={styles.plateText}>{item.plate}</Text></View>
                      <View style={styles.metaRow}>
                        <Text style={[styles.metaText, selected && { color: "#E0F2FE" }]}>{item.seats} places</Text>
                        <Text style={[styles.metaText, selected && { color: "#E0F2FE" }]}>{item.type}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* SEATS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("chooseSeats")}</Text>
            {seatLayout.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.seatRow}>
                {row.map((seat, i) => {
                  if (seat === "aisle") return <View key={i} style={{ width: 20 }} />;
                  if (seat === "driver") return <View key={i} style={[styles.seat, styles.driverSeat]}><Text>C</Text></View>;
                  const selected = selectedSeatIndexes.includes(seat as number);
                  return (
                    <TouchableOpacity key={i} onPress={() => toggleSeat(seat as number)} style={[styles.seat, selected && styles.seatSelected]}>
                      <Text style={{ color: selected ? "#fff" : "#111" }}>{seat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* OPTIONS */}
          <View style={styles.card}>
  <Text style={styles.sectionTitle}>{t("options")}</Text>

  {/* Baby on Board */}
  {/* Baby ScrollView */}
<Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t("babyOnBoard")}</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -16, paddingLeft: 16 }}>
  {babyOptions.map((baby, index) => (
    <TouchableOpacity
      key={baby.label + "-" + index}
      onPress={() => toggleBabyOption(baby.label)}
      style={[styles.babyCard, baby.selected && styles.babyCardSelected]}
    >
      {baby.icon}
      <Text style={[styles.babyLabel, baby.selected && { color: "#fff" }]}>{baby.label}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>

  {/* Luggage */}
  <View style={styles.optionRow}>
    <Text>{t("luggageOnBoard")}</Text>
    <Switch value={luggageOnBoard} onValueChange={setLuggageOnBoard} />
  </View>

  {/* Pets ScrollView */}
  <Text style={[styles.sectionTitle, { marginTop: 12 }]}>{t("petsOnBoard")}</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -16, paddingLeft: 16 }}>
    {petOptions.map((pet, index) => (
      <TouchableOpacity
        key={pet.type + "-" + index}
        onPress={() => togglePet(pet.type)}
        style={[
          styles.petCard,
          pet.selected && styles.petCardSelected
        ]}
      >
        {pet.icon}
        <Text style={[styles.petLabel, pet.selected && { color: "#fff" }]}>{t(pet.type)}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
          {/* TOTAL */}
          <View style={styles.card}>
            <View style={styles.totalRow}><Text>{t("total")}</Text><Text style={styles.totalPrice}>{totalPrice.toFixed(2)} Ar</Text></View>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.confirmBtn} onPress={confirmBooking} disabled={loading}>
          <Text style={styles.confirmText}>{loading ? t("processing") : t("confirmBooking")}</Text>
        </TouchableOpacity>

        {/* SUCCESS */}
        <Modal visible={showSuccess} transparent animationType="fade">
          <Pressable style={styles.successOverlay} onPress={closeSheet}>
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>{t("bookingSent")} 🎉</Text>
              <TouchableOpacity style={styles.successBtn} onPress={closeSheet}><Text style={{ color: "#fff" }}>OK</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </Animated.View>
    </Modal>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { position: "absolute", bottom: 0, width: "100%", backgroundColor: "#F9FAFB", borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "95%" },
  handle: { width: 44, height: 5, backgroundColor: "#D1D5DB", alignSelf: "center", borderRadius: 3, marginVertical: 10 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600" },
  card: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 18 },
  route: { fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  sectionTitle: { fontWeight: "600", marginBottom: 10 },
  seatRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  seat: { width: 44, height: 44, borderRadius: 10, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center", marginHorizontal: 4 },
  seatSelected: { backgroundColor: "#10B981" },
  driverSeat: { backgroundColor: "#9CA3AF" },
  optionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalPrice: { fontWeight: "700", color: "#047857" },
  confirmBtn: { position: "absolute", bottom: Platform.OS === "android" ? 20 : 30, left: 16, right: 16, backgroundColor: "#059669", padding: 16, borderRadius: 999, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "600" },
  successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  successBox: { backgroundColor: "#fff", padding: 20, borderRadius: 16, width: "85%", alignItems: "center" },
  successTitle: { fontSize: 18, fontWeight: "700" },
  successBtn: { marginTop: 16, backgroundColor: "#059669", paddingHorizontal: 30, paddingVertical: 10, borderRadius: 12 },
  glassCard: { backgroundColor: "hsla(0, 0%, 100%, 0.75)", padding: 18, marginRight: 16, borderRadius: 24, width: 220, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  glassCardSelected: { backgroundColor: "#059669" },
  statusDot: { position: "absolute", top: 14, right: 14, width: 10, height: 10, borderRadius: 5 },
  vehicleTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  plateContainer: { marginTop: 8, alignSelf: "flex-start", backgroundColor: "#cbc7b7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#111" },
  plateText: { fontWeight: "800", fontSize: 12, letterSpacing: 1, color: "#212020" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  metaText: { fontSize: 12, color: "#4B5563" },

  petCard: {
  backgroundColor: "#E5E7EB",
  padding: 16,
  marginRight: 16,
  borderRadius: 20,
  width: 80,
  height: 70,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#eff3f7",
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4,
},
petCardSelected: {
  backgroundColor: "#059669",
  color: "#cbc7b7"
},
petLabel: {
  marginTop: 8,
  fontSize: 12,
  fontWeight: "600",
  textAlign: "center",
  color: "#111827",
},

babyCard: {
  backgroundColor: "#E5E7EB",
  padding: 16,
  marginRight: 16,
  borderRadius: 20,
  width: 80,
  height: 70,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#eff3f7",
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 4,
},
babyCardSelected: {
  backgroundColor: "#059669",
},
babyLabel: {
  marginTop: 8,
  fontSize: 12,
  fontWeight: "600",
  textAlign: "center",
  color: "#111827",
},

});
