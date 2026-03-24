// BookingScreen.tsx — Version synchronisée avec le contrôleur PHP
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
import { ArrowLeft, Calendar, Clock, Car, Bus, Dog, Cat, Rabbit, Bird, Baby, Star } from "lucide-react-native";
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
  isBooked?: boolean;
  isOfferVehicle?: boolean;
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

  // 🔹 Options synchronisées avec le contrôleur (baby_on_board, pets_on_board, luggage_on_board)
  const [babyOnBoard, setBabyOnBoard] = useState(false);
  const [petsOnBoard, setPetsOnBoard] = useState(false);
  const [luggageOnBoard, setLuggageOnBoard] = useState(false);

  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleOption | null>(null);

  const [seatLayout, setSeatLayout] = useState<SeatCell[][]>([]);
  const [selectedSeatIndexes, setSelectedSeatIndexes] = useState<number[]>([]);

  const selectedSeatCount = selectedSeatIndexes.length;
  const pricePerSeat = offer ? Number(offer.price_per_seat) : trip.price;
  const totalPrice = selectedSeatCount * pricePerSeat;

  // Options pour bébés (conservées pour l'UI mais converties en booléen pour le contrôleur)
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
    // 🔹 Si au moins une option bébé est sélectionnée, activer baby_on_board
    const hasSelected = babyOptions.some(b => b.selected) || !babyOptions.find(b => b.label === label)?.selected;
    setBabyOnBoard(hasSelected);
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
    // 🔹 Si au moins un animal est sélectionné, activer pets_on_board
    const hasSelected = petOptions.some(p => p.selected) || !petOptions.find(p => p.type === type)?.selected;
    setPetsOnBoard(hasSelected);
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

  /* ================= FETCH VEHICLES ================= */
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const baseURL = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
        const res = await fetch(`${baseURL}/vehicles?user_id=${userId}`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const text = await res.text();

        const fallbackVehicle: VehicleOption = {
          label: "Toyota Hilux",
          seats: 5,
          type: "pickup",
          plate: "N/A",
          is_active: true,
          isBooked: false,
          isOfferVehicle: false,
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
          isBooked: v.is_booked === true,
          isOfferVehicle: false,
        }));

        if (offer?.car_info) {
          const offerVehicleIndex = formatted.findIndex(v => 
            v.label.toLowerCase().includes(offer.car_info?.toLowerCase() || '') ||
            offer.car_info?.toLowerCase().includes(v.label.toLowerCase())
          );
          
          if (offerVehicleIndex !== -1) {
            formatted[offerVehicleIndex].isOfferVehicle = true;
            setSelectedVehicle(formatted[offerVehicleIndex]);
          } else {
            setSelectedVehicle(formatted[0]);
          }
        } else {
          setSelectedVehicle(formatted[0]);
        }

        setVehicles(formatted);
        
      } catch (err) {
        console.log("Vehicle fetch failed → fallback", err);
        const fallbackVehicle: VehicleOption = {
          label: "Toyota Hilux",
          seats: 5,
          type: "pickup",
          plate: "N/A",
          is_active: true,
          isBooked: false,
          isOfferVehicle: false,
        };
        setVehicles([fallbackVehicle]);
        setSelectedVehicle(fallbackVehicle);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [userId, offer]);

  const handleSelectVehicle = (vehicle: VehicleOption) => {
    setSelectedVehicle(vehicle);
    setSelectedSeatIndexes([]);
    
    if (vehicle.isBooked) {
      Toast.show({
        type: "info",
        text1: t("vehicleBooked"),
        text2: t("vehicleAlreadyBookedInfo"),
      });
    }
  };

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

  const getVehicleIcon = (type?: string) => {
    const lower = type?.toLowerCase() || "";
    if (lower.includes("pickup") || lower.includes("hilux")) return <Car size={18} color="#fff" />;
    if (lower.includes("minibus") || lower.includes("sprinter")) return <Bus size={18} color="#fff" />;
    return <Car size={18} color="#fff" />;
  };

  const toggleSeat = (seatNumber: number) => {
    setSelectedSeatIndexes(prev =>
      prev.includes(seatNumber) ? prev.filter(s => s !== seatNumber) : [...prev, seatNumber]
    );
  };

  /* ================= CONFIRM BOOKING - SYNCHRONISÉ AVEC LE CONTRÔLEUR ================= */
  const confirmBooking = async () => {
    if (selectedSeatCount === 0) {
      Toast.show({ type: "error", text1: t("selectAtLeastOneSeat") });
      return;
    }
    
    if (selectedVehicle?.isBooked) {
      Toast.show({ 
        type: "error", 
        text1: t("vehicleUnavailable"), 
        text2: t("vehicleAlreadyBooked") 
      });
      return;
    }
    
    setLoading(true);
    try {
      // 🔹 Payload conforme au contrôleur BookingsController
      const payload = {
        ride_id: Number(trip.id),
        offer_id: offer ? Number(offer.id) : null,
        seats_reserved: selectedSeatCount,
        total_price: totalPrice,
        // 🔹 Statut "confirmed" directement (le contrôleur le met par défaut)
        // On peut l'omettre ou le mettre explicitement
        baby_on_board: babyOnBoard ? 1 : 0,      // 🔹 Correspond au champ dans le contrôleur
        pets_on_board: petsOnBoard ? 1 : 0,      // 🔹 Correspond au champ dans le contrôleur
        luggage_on_board: luggageOnBoard ? 1 : 0, // 🔹 Correspond au champ dans le contrôleur
        // Champs supplémentaires pour l'UI (non requis par le contrôleur)
        vehicle_type: selectedVehicle?.type,
        selected_seats: selectedSeatIndexes,
      };

      const baseURL = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
      const response = await fetch(`${baseURL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data: any = {};
      try { 
        data = text ? JSON.parse(text) : {}; 
      } catch { 
        data = {}; 
      }

      if (!response.ok) {
        // 🔹 Gestion des erreurs du contrôleur
        const errorMessage = data.messages?.error || data.message || t("serverError");
        throw new Error(errorMessage);
      }

      // 🔹 Mise à jour locale du véhicule comme réservé
      setVehicles(prev => 
        prev.map(v => 
          v.label === selectedVehicle?.label 
            ? { ...v, isBooked: true } 
            : v
        )
      );

      setShowSuccess(true);
      Toast.show({ 
        type: "success", 
        text1: t("bookingSuccess"), 
        text2: t("bookingConfirmedMessage") 
      });
      onBookingSuccess?.(trip);
    } catch (e: any) {
      Toast.show({ type: "error", text1: t("error"), text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return t("processing");
    if (selectedVehicle?.isBooked) return t("vehicleUnavailable");
    if (selectedSeatCount === 0) return t("confirmBooking");
    
    const formattedPrice = totalPrice.toLocaleString('fr-FR');
    return `${t("confirmBooking")} ${selectedSeatCount} ${t("seat")}${selectedSeatCount > 1 ? 's' : ''} • ${formattedPrice} Ar`;
  };

  /* ================= RENDER ================= */
  return (
    <Modal transparent animationType="none">
      <Pressable style={styles.overlay} onPress={closeSheet} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <TouchableOpacity onPress={closeSheet}><ArrowLeft size={22} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{t("bookTrip")}</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
          <View style={styles.card}>
            <Text style={styles.route}>{trip.departure} → {trip.arrival}</Text>
            <View style={styles.row}>
              <Calendar size={14} /><Text>{trip.date}</Text>
              <Clock size={14} /><Text>{trip.time}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Car size={18} />
              <Text style={styles.sectionTitle}>{t("vehicle")}</Text>
              {offer && (
                <View style={styles.offerBadge}>
                  <Star size={12} color="#fff" />
                  <Text style={styles.offerBadgeText}>{t("recommended")}</Text>
                </View>
              )}
            </View>
            
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
                      onPress={() => handleSelectVehicle(item)}
                      style={[
                        styles.glassCard,
                        selected && styles.glassCardSelected,
                        item.isBooked && styles.glassCardBooked,
                        item.isOfferVehicle && !selected && styles.glassCardOffer,
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: item.is_active ? "#22C55E" : "#EF4444" }]} />
                      
                      {item.isOfferVehicle && (
                        <View style={styles.offerVehicleBadge}>
                          <Star size={10} color="#fff" />
                          <Text style={styles.offerVehicleBadgeText}>{t("offer")}</Text>
                        </View>
                      )}
                      
                      {item.isBooked && (
                        <View style={styles.bookedBadge}>
                          <Text style={styles.bookedBadgeText}>{t("booked")}</Text>
                        </View>
                      )}
                      
                      <Text style={[
                        styles.vehicleTitle, 
                        selected && { color: "#fff" },
                        item.isBooked && !selected && styles.bookedText
                      ]}>
                        {item.label}
                      </Text>
                      
                      <View style={[styles.plateContainer, item.isBooked && !selected && { opacity: 0.7 }]}>
                        <Text style={styles.plateText}>{item.plate}</Text>
                      </View>
                      
                      <View style={styles.metaRow}>
                        <Text style={[
                          styles.metaText, 
                          selected && { color: "#E0F2FE" },
                          item.isBooked && !selected && { color: "#9CA3AF" }
                        ]}>
                          {item.seats} places
                        </Text>
                        <Text style={[
                          styles.metaText, 
                          selected && { color: "#E0F2FE" },
                          item.isBooked && !selected && { color: "#9CA3AF" }
                        ]}>
                          {item.type}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {t("chooseSeats")} • {selectedVehicle?.seats} {t("seats")}
            </Text>
            {selectedVehicle?.isBooked ? (
              <View style={styles.bookedMessage}>
                <Text style={styles.bookedMessageText}>
                  {t("vehicleBookedMessage")}
                </Text>
                <Text style={styles.bookedMessageSubtext}>
                  {t("cannotSelectSeats")}
                </Text>
              </View>
            ) : (
              seatLayout.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.seatRow}>
                  {row.map((seat, i) => {
                    if (seat === "aisle") return <View key={i} style={{ width: 20 }} />;
                    if (seat === "driver") return <View key={i} style={[styles.seat, styles.driverSeat]}><Text>C</Text></View>;
                    const selected = selectedSeatIndexes.includes(seat as number);
                    return (
                      <TouchableOpacity 
                        key={i} 
                        onPress={() => toggleSeat(seat as number)} 
                        style={[styles.seat, selected && styles.seatSelected]}
                      >
                        <Text style={{ color: selected ? "#fff" : "#111" }}>{seat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("options")}</Text>

            {/* Baby on Board */}
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

            {/* Luggage - Switch synchronisé */}
            <View style={styles.optionRow}>
              <Text>{t("luggageOnBoard")}</Text>
              <Switch 
                value={luggageOnBoard} 
                onValueChange={(value) => {
                  setLuggageOnBoard(value);
                  // Pas besoin d'action supplémentaire, le contrôleur reçoit la valeur directement
                }} 
              />
            </View>

            {/* Pets */}
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

          <View style={styles.card}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("total")}</Text>
              <Text style={styles.totalPrice}>{totalPrice.toLocaleString()} Ar</Text>
            </View>
            {selectedSeatCount > 0 && (
              <Text style={styles.totalDetail}>
                {selectedSeatCount} × {pricePerSeat.toLocaleString()} Ar
              </Text>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[
            styles.confirmBtn, 
            (selectedVehicle?.isBooked || selectedSeatCount === 0) && styles.confirmBtnDisabled
          ]} 
          onPress={confirmBooking} 
          disabled={loading || selectedVehicle?.isBooked || selectedSeatCount === 0}
        >
          <Text style={styles.confirmText}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>

        <Modal visible={showSuccess} transparent animationType="fade">
          <Pressable style={styles.successOverlay} onPress={closeSheet}>
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>{t("bookingConfirmed")} 🎉</Text>
              <TouchableOpacity style={styles.successBtn} onPress={closeSheet}>
                <Text style={{ color: "#fff" }}>OK</Text>
              </TouchableOpacity>
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
  
  totalRow: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  totalPrice: { 
    fontWeight: "800", 
    color: "#047857",
    fontSize: 20,
  },
  totalDetail: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "right",
  },
  
  confirmBtn: { 
    position: "absolute", 
    bottom: Platform.OS === "android" ? 20 : 30, 
    left: 16, 
    right: 16, 
    backgroundColor: "#059669", 
    padding: 18, 
    borderRadius: 30, 
    alignItems: "center",
    shadowColor: "#059669",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  confirmBtnDisabled: { 
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  confirmText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16,
  },
  
  successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  successBox: { backgroundColor: "#fff", padding: 20, borderRadius: 16, width: "85%", alignItems: "center" },
  successTitle: { fontSize: 18, fontWeight: "700" },
  successBtn: { marginTop: 16, backgroundColor: "#059669", paddingHorizontal: 30, paddingVertical: 10, borderRadius: 12 },
  
  glassCard: { 
    backgroundColor: "hsla(0, 0%, 100%, 0.75)", 
    padding: 18, 
    marginRight: 16, 
    borderRadius: 24, 
    width: 220, 
    shadowColor: "#000", 
    shadowOpacity: 0.12, 
    shadowRadius: 12, 
    elevation: 6,
    position: "relative",
  },
  glassCardSelected: { backgroundColor: "#059669" },
  glassCardBooked: { 
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  glassCardOffer: {
    borderWidth: 2,
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    gap: 4,
  },
  offerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  
  offerVehicleBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 10,
  },
  offerVehicleBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  
  statusDot: { position: "absolute", top: 14, right: 14, width: 10, height: 10, borderRadius: 5 },
  
  bookedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  bookedBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  bookedText: {
    color: "#9CA3AF",
  },
  vehicleTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  plateContainer: { marginTop: 8, alignSelf: "flex-start", backgroundColor: "#cbc7b7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#111" },
  plateText: { fontWeight: "800", fontSize: 12, letterSpacing: 1, color: "#212020" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  metaText: { fontSize: 12, color: "#4B5563" },

  bookedMessage: {
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  bookedMessageText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B91C1C",
    marginBottom: 8,
  },
  bookedMessageSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

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
