// TripScreen.tsx — CREATE TRIP (Bolt style + Intelligent Vehicle Select)

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Switch,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, ChevronDown, Plus, Car, Bus, Truck } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { VehicleScreen } from "./VehicleScreen";
import { LuggageScreen } from "./LuggageScreen";
import { MeetingPointScreen } from "./MeetingPointScreen";

/* ===================== DATA ===================== */
interface Vehicle {
  id: number;
  marque: string;
  modele: string;
  immatriculation: string;
  nombre_portes: number;
  nombre_places: number;
  statut: string;
  type_vehicule: string;
}

interface Luggage {
  id: number;
  name: string;
  description?: string;
}

interface MeetingPoint {
  id: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  place_type: string;
  is_active: boolean;
}

// =========================================================
const LOCATIONS = [
  // Analamanga
  "Antananarivo", "Antananarivo Centre", "Ambohidratrimo", "Andramasina", "Anjozorobe", 
  "Ankazobe", "Antananarivo Atsimondrano", "Antananarivo Avaradrano", "Manjakandriana",
  
  // Vakinankaratra
  "Antsirabe I", "Antsirabe II", "Ambatonadrazaka", "Ambatolampy", "Betafo", "Faratsiho",
  
  // Itasy
  "Miarinarivo", "Arivonimamo", "Soavinandriana",
  
  // Bongolava
  "Tsiroanomandidy", "Fenoarivobe",
  
  // Haute Matsiatra
  "Fianarantsoa I", "Fianarantsoa II", "Ambohimahasoa", "Ikalamavony", "Isandra", "Lalangina", "Vohibato",
  
  // Amoron'i Mania
  "Ambositra", "Ambatofinandrahana", "Fandriana", "Manandriana",
  
  // Vatovavy
  "Mananjary", "Ifanadiana", "Nosy Varika",
  
  // Fitovinany
  "Manakara", "Ikongo", "Vohipeno",
  
  // Atsimo Atsinanana
  "Farafangana", "Vangaindrano", "Midongy Sud",
  
  // Ihorombe
  "Ihosy", "Iakora", "Ivohibe",
  
  // Menabe
  "Morondava", "Mahabo", "Manja", "Miandrivazo",
  
  // Atsimo Andrefana
  "Toliara I", "Toliara II", "Ampanihy", "Ankazoabo", "Benenitra", "Beroroha", "Betioky", "Morombe", "Sakaraha",
  
  // Androy
  "Ambovombe", "Bekily", "Beloha", "Tsiombe",
  
  // Anosy
  "Taolagnaro", "Amboasary", "Betroka",
  
  // Alaotra Mangoro
  "Ambatondrazaka", "Amparafaravola", "Andilamena", "Anosibe An'ala", "Moramanga",
  
  // Atsinanana
  "Toamasina I", "Toamasina II", "Antanambao Manampotsy", "Brickaville", "Mahanoro", "Marolambo", "Vatomandry",
  
  // Analanjirofo
  "Fenoarivo Atsinanana", "Fenerive Est", "Mananara Nord", "Maroantsetra", "Nosy Boraha", "Soanierana Ivongo", "Vavatenina",
  
  // Sofia
  "Antsohihy", "Analalava", "Bealanana", "Befandriana Nord", "Boriziny", "Mampikony", "Mandritsara",
  
  // Boeny
  "Mahajanga I", "Mahajanga II", "Ambatoboeny", "Marovoay", "Mitsinjo", "Soalala",
  
  // Betsiboka
  "Maevatanana", "Kandreho", "Tsaratanana",
  
  // Melaky
  "Maintirano", "Ambatomainty", "Antsalova", "Besalampy", "Morafenobe",
  
  // Diana
  "Antsiranana I", "Antsiranana II", "Ambilobe", "Ambanja", "Nosy Be", "Nosy Mitsio",
  
  // Sava
  "Sambava", "Andapa", "Antalaha", "Vohemar",
].sort(); // Tri alphabétique

/* ===================== TYPES ===================== */
interface TripScreenProps {
  userId: number;
  onBack: () => void;
}

/* ===================== COMPONENT ===================== */
export function TripScreen({ userId, onBack }: TripScreenProps) {

  const { t } = useTranslation();
  const screenHeight = Dimensions.get("window").height;
  const slideAnim = useState(new Animated.Value(screenHeight))[0];

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ===================== STATES ===================== */
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [departureSuggestions, setDepartureSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);


  const [currentPage, setCurrentPage] = useState(1);
  const VEHICLES_PER_PAGE = 3;

  const [luggages, setLuggages] = useState<Luggage[]>([]);
  const [luggagePage, setLuggagePage] = useState(1);
  const LUGGAGES_PER_PAGE = 3;

  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([]);
  const [selectedMeetingPoints, setSelectedMeetingPoints] = useState<MeetingPoint[]>([]);
  const [showMeetingPointScreen, setShowMeetingPointScreen] = useState(false);

  const [showMeetingPointPicker, setShowMeetingPointPicker] = useState(false);
  const [showMeetingPointForm, setShowMeetingPointForm] = useState(false);
  const [meetingPointPage, setMeetingPointPage] = useState(1);
  const MEETING_POINTS_PER_PAGE = 3;

  const [availableSeats, setAvailableSeats] = useState("");
  const [price, setPrice] = useState("");
  const [luggageInfo, setLuggageInfo] = useState("");
  const [showLuggagePicker, setShowLuggagePicker] = useState(false);
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isBoosted, setIsBoosted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showLuggageForm, setShowLuggageForm] = useState(false);


  const getVehicleIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "voiture":
    case "berline":
      return <Car size={22} color="#111827" />;
    case "bus":
      return <Bus size={22} color="#111827" />;
    case "camion":
    case "van":
      return <Truck size={22} color="#111827" />;
    default:
      return <Car size={22} color="#111827" />;
  }
};

const getStatusBadge = (status: string) => {
  const isAvailable = status === "disponible";

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor: isAvailable ? "#DCFCE7" : "#FEE2E2",
        },
      ]}
    >
      <Text
        style={{
          color: isAvailable ? "#059669" : "#DC2626",
          fontWeight: "600",
          fontSize: 12,
        }}
      >
        {status}
      </Text>
    </View>
  );
};


    
  useEffect(() => {
    fetchVehicles();
    fetchLuggages();
    fetchMeetingPoints();
  }, []);

  /* ===================== HELPERS ===================== */
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const formatTime = (t: Date) =>
    `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;

  const filterLocations = (text: string) =>
    LOCATIONS.filter((l) => l.toLowerCase().includes(text.toLowerCase())).slice(0, 5);

  /* ===================== SUBMIT ===================== */
  const createTrip = async () => {
  if (!departure || !destination || !date || !time || !vehicle) {
    Alert.alert(t("error"), t("fillRequiredFields"));
    return;
  }

  const seats = parseInt(availableSeats, 10);
  const tripPrice = parseInt(price, 10);

  if (!Number.isFinite(seats) || seats < 1 || seats > vehicle.nombre_places) {
    Alert.alert(t("error"), t("seatsBetween", { max: vehicle.nombre_places }));
    return;
  }

  if (!Number.isFinite(tripPrice) || tripPrice <= 0) {
    Alert.alert(t("error"), t("invalidPrice"));
    return;
  }

  /* ================= VEHICLE ================= */
  const vehicleId = vehicle.id;

  /* ================= LUGGAGE ================= */
  const luggageId =
    luggages.find((l) => l.name === luggageInfo)?.id || null;

  /* ================= MEETING POINT ================= */
  const meetingPointId =
    selectedMeetingPoints.length > 0
      ? selectedMeetingPoints[0].id
      : null;

  const payload = {
    user_id: userId,
    vehicle_id: vehicleId,
    luggage_id: luggageId,
    meeting_point_id: meetingPointId,

    departure,
    destination,
    departure_time: `${formatDate(date)} ${formatTime(time)}:00`,

    available_seats: seats,
    price: tripPrice,

    message: message || "",

    is_public: isPublic,
    is_boosted: isBoosted,

    status: "open",
  };

  console.log("CREATE TRIP PAYLOAD:", payload);

  setLoading(true);

  try {
    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080"
        : "http://localhost:8080";

    const res = await fetch(`${baseURL}/rides`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log("CREATE TRIP RESPONSE:", res.status, text);

    if (!res.ok) {
      throw new Error(text || "Trip creation failed");
    }

    Alert.alert(t("success"), t("tripCreated"));
    onBack();
  } catch (err) {
    console.error("CREATE TRIP ERROR:", err);
    Alert.alert(t("error"), t("tripCreationError"));
  } finally {
    setLoading(false);
  }
};

const fetchVehicles = async () => {
  try {
    const baseURL = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

    const res = await fetch(`${baseURL}/vehicles?user_id=${userId}`);
    console.log("VEHICLES STATUS:", res.status);

    const text = await res.text();
    console.log("VEHICLES RAW RESPONSE:", text);

    if (!text || text.trim() === "") {
      console.log("⚠️ Empty vehicles response");
      setVehicles([]);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      console.log("⚠️ JSON parse error:", jsonError, "Response:", text);
      setVehicles([]);
      return;
    }

    // Vérifie la structure
    if (!data.status || !Array.isArray(data.vehicles)) {
      console.log("⚠️ Invalid vehicles structure:", data);
      setVehicles([]);
      return;
    }

    // Formate les véhicules
    const formatted: Vehicle[] = data.vehicles.map((v: any) => ({
      id: Number(v.id),
      marque: v.marque,
      modele: v.modele,
      immatriculation: v.immatriculation,
      nombre_portes: Number(v.nombre_portes),
      nombre_places: Number(v.nombre_places),
      statut: v.statut,
      type_vehicule: v.type_vehicule,
    }));

    setVehicles(formatted);
  } catch (error) {
    console.log("Vehicle fetch failed", error);
    setVehicles([]);
  }
};

const deleteVehicle = async (vehicleId: number) => {
  try {
    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080"
        : "http://localhost:8080";

    const res = await fetch(`${baseURL}/vehicles/${vehicleId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.log("Delete vehicle failed:", res.status);
      Alert.alert(t("error"), t("vehicleDeleteError"));
      return;
    }

    // 🔥 Supprime localement sans refetch
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));

    // 🔥 Si le véhicule supprimé était sélectionné
    if (vehicle?.id === vehicleId) {
      setVehicle(null);
      setAvailableSeats("");
    }

    Alert.alert(t("success"), t("vehicleDeleted"));
  } catch (error) {
    console.log("Delete vehicle error:", error);
    Alert.alert(t("error"), t("vehicleDeleteError"));
  }
};

const totalPages = Math.ceil(vehicles.length / VEHICLES_PER_PAGE);

const paginatedVehicles = vehicles.slice(
  0,
  currentPage * VEHICLES_PER_PAGE
);


const fetchLuggages = async () => {
  try {
    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080"
        : "http://localhost:8080";

    const res = await fetch(`${baseURL}/luggages`);

    console.log("LUGGAGE STATUS:", res.status);

    // Lire la réponse brute
    const text = await res.text();
    console.log("LUGGAGE RAW RESPONSE:", text);

    // Si réponse vide, on renvoie un tableau vide
    if (!text || text.trim() === "") {
      console.log("⚠️ Empty luggage response");
      setLuggages([]);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      console.log("⚠️ JSON parse error:", jsonError, "Response:", text);
      setLuggages([]);
      return;
    }

    // Vérifier que la structure correspond à ce qu'on attend
    if (!data.status || !Array.isArray(data.luggages)) {
      console.log("⚠️ Invalid luggage structure:", data);
      setLuggages([]);
      return;
    }

    // Formater les bagages pour le frontend
    const formatted: Luggage[] = data.luggages.map((l: any) => ({
      id: Number(l.id),
      name: l.name ?? "Unnamed",
      description: l.description ?? "",
    }));

    setLuggages(formatted);

  } catch (error) {
    console.log("Luggage fetch failed:", error);
    setLuggages([]); // en cas d'erreur réseau ou autre
  }
};


const deleteLuggage = async (id: number) => {
  try {
    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080"
        : "http://localhost:8080";

    const res = await fetch(`${baseURL}/luggages/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      Alert.alert(t("error"), t("luggageDeleteError"));
      return;
    }

    setLuggages((prev) => prev.filter((l) => l.id !== id));

    if (luggageInfo === luggages.find(l => l.id === id)?.name) {
      setLuggageInfo("");
    }

    Alert.alert(t("success"), t("luggageDeleted"));
  } catch (error) {
    Alert.alert(t("error"), t("luggageDeleteError"));
  }
};

  const luggageTotalPages = Math.ceil(luggages.length / LUGGAGES_PER_PAGE);
  const paginatedLuggages = luggages.slice(0,luggagePage * LUGGAGES_PER_PAGE);

  const fetchMeetingPoints = async () => {
  try {
    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080"
        : "http://localhost:8080";

    const res = await fetch(`${baseURL}/meeting-points`);

    const text = await res.text();

    if (!text || text.trim() === "") {
      setMeetingPoints([]);
      return;
    }

    const data = JSON.parse(text);

    if (!Array.isArray(data.meeting_points)) {
      setMeetingPoints([]);
      return;
    }

    const formatted: MeetingPoint[] = data.meeting_points.map((m: any) => ({
      id: Number(m.id),
      name: m.name,
      city: m.city,
      latitude: Number(m.latitude),
      longitude: Number(m.longitude),
      address: m.address,
      place_type: m.place_type,
      is_active: m.is_active,
    }));

    setMeetingPoints(formatted);

  } catch (error) {
    console.log("MeetingPoints fetch failed", error);
    setMeetingPoints([]);
  }
};

const meetingPointTotalPages = Math.ceil(meetingPoints.length / MEETING_POINTS_PER_PAGE);
const paginatedMeetingPoints = meetingPoints.slice(0, meetingPointPage * MEETING_POINTS_PER_PAGE);

  /* ===================== UI ===================== */
  return (
    <Modal transparent visible animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack}>
              <ArrowLeft size={22} />
            </TouchableOpacity>
           <Text style={styles.headerTitle}>{t("creatingTrip")}</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
            <View style={styles.card}>
              {/* DEPART / DESTINATION */}
              <View style={styles.rowGrid}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.halfInput}
                    placeholder={t("departure")}
                    value={departure}
                    onChangeText={(text) => {
                      setDeparture(text);
                      setDepartureSuggestions(filterLocations(text));
                    }}
                  />
                  {departureSuggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                      {departureSuggestions.map((item) => (
                        <TouchableOpacity
                          key={item}
                          onPress={() => {
                            setDeparture(item);
                            setDepartureSuggestions([]);
                          }}
                        >
                          <Text style={styles.suggestionItem}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.halfInput}
                    placeholder={t("destination")}                    
                    value={destination}
                    onChangeText={(text) => {
                      setDestination(text);
                      setDestinationSuggestions(filterLocations(text));
                    }}
                  />
                  {destinationSuggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                      {destinationSuggestions.map((item) => (
                        <TouchableOpacity
                          key={item}
                          onPress={() => {
                            setDestination(item);
                            setDestinationSuggestions([]);
                          }}
                        >
                          <Text style={styles.suggestionItem}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* DATE / TIME */}
              <View style={styles.rowGrid}>
                <TouchableOpacity
                  style={styles.halfInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{date ? formatDate(date) : t("date")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.halfInput}
                  onPress={() => setShowTimePicker(true)}
                >
                 <Text>{time ? formatTime(time) : t("time")}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                  onChange={(e, d) => {
                    setShowDatePicker(false);
                    d && setDate(d);
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={time || new Date()}
                  mode="time"
                  is24Hour
                  onChange={(e, t) => {
                    setShowTimePicker(false);
                    t && setTime(t);
                  }}
                />
              )}

              {/* VEHICLE SELECT */}
              <TouchableOpacity
                style={styles.select}
                onPress={() => setShowVehiclePicker(true)}
              >
                <Text>
              {vehicle ? `${vehicle.marque} ${vehicle.modele} • ${vehicle.nombre_places} places`: t("chooseVehicle")}
              </Text>
                <ChevronDown size={18} />
              </TouchableOpacity>

              {/* PLACES / PRIX */}
              <View style={styles.rowGrid}>
                <TextInput
                  style={styles.halfInput}
                  placeholder={t("availableSeats")}
                  keyboardType="number-pad"
                  value={availableSeats}
                  onChangeText={(t) => setAvailableSeats(t.replace(/[^0-9]/g, ""))}
                />
                <TextInput
                  style={styles.halfInput}
                  placeholder={t("pricePerSeat")}
                  keyboardType="number-pad"
                  value={price}
                  onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                />
              </View>

              {/* LUGGAGE */}
              <TouchableOpacity
                style={styles.select}
                onPress={() => setShowLuggagePicker(true)}
              >
                <Text style={{ color: luggageInfo ? "#111827" : "#141515" }}>
                  {luggageInfo || t("luggage")}
                </Text>
                <ChevronDown size={18} />
              </TouchableOpacity>

              {/* MEETING POINTS */}
               <TouchableOpacity style={styles.select}
                      onPress={() => setShowMeetingPointScreen(true)}>
                 <Text>
                  {selectedMeetingPoints.length > 0
                    ? `${selectedMeetingPoints.length} meeting point(s)`: t("chooseMeetingPoints")}
                  </Text>
                <ChevronDown size={18} />
                </TouchableOpacity>

              {/* MESSAGE */}
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                placeholder={t("messageOptional")}
                value={message}
                onChangeText={setMessage}
              />

              {/* SWITCHES */}
              <View style={styles.switchRow}>
                <Text>{t("publicTrip")}</Text>
                <Switch value={isPublic} onValueChange={setIsPublic} />
              </View>

              <View style={styles.switchRow}>
                <Text>{t("boostVisibility")}</Text>
                <Switch value={isBoosted} onValueChange={setIsBoosted} />
              </View>
            </View>
          </ScrollView>

          {/* SUBMIT */}
          <TouchableOpacity
            style={styles.submit}
            onPress={createTrip}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : 
             <Text style={styles.submitLabel}>{t("publishTrip")}</Text>}
          </TouchableOpacity>

          {/* VEHICLE PICKER */}
          {showVehiclePicker && (
            <Modal transparent animationType="fade">
              <TouchableOpacity style={styles.backdrop} onPress={() => setShowVehiclePicker(false)}>
                <View style={styles.vehicleSheet}>
                   {/* HEADER AVEC PLUS ICON */}
                <View style={styles.vehicleHeader}>
                     <Text style={styles.vehicleTitleSheet}>
                      {t("chooseVehicle")}
                  </Text>
                <TouchableOpacity
                   onPress={() => {
                   setShowVehiclePicker(false);
                   setShowVehicleForm(true);
                  }}
              >
              <Plus size={22} color="#059669" />
              </TouchableOpacity>
               </View>

              {vehicles.length === 0 ? (
                 <Text style={styles.emptyText}>{t("noVehicle")}</Text>
                 ) : (
               paginatedVehicles.map((v) => {
    const disabled = v.statut !== "disponible";

    return (
      <TouchableOpacity
          key={v.id}
          disabled={disabled}
          activeOpacity={0.85}
              style={[
              styles.vehicleCard,
              disabled && { opacity: 0.5 },
          ]}
        onPress={() => {
        if (!disabled) {
           setVehicle(v);
           setAvailableSeats(String(v.nombre_places));
           setShowVehiclePicker(false);
        }
      }}
         onLongPress={() => {
         Alert.alert(
         t("deleteVehicle"),
          `${v.marque} ${v.modele} ?`,
         [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => deleteVehicle(v.id),
        },
      ]
    );
  }}
    delayLongPress={400}
    >
        {/* LEFT ICON */}
        <View style={styles.vehicleIconBox}>
          {getVehicleIcon(v.type_vehicule)}
        </View>

        {/* CENTER INFO */}
        <View style={{ flex: 1 }}>
          <Text style={styles.vehicleTitle}>
            {v.marque} {v.modele}
          </Text>

          <Text style={styles.vehicleSubtitle}>
            🚗 {v.immatriculation}
          </Text>

          <Text style={styles.vehicleSubtitle}>
            🚪 {v.nombre_portes} • 💺 {v.nombre_places}
          </Text>
        </View>

        {/* RIGHT BADGE */}
        {getStatusBadge(v.statut)}
      </TouchableOpacity>
    );
  })
)}

{/* PAGINATION */}
{vehicles.length > VEHICLES_PER_PAGE && currentPage < totalPages && (
  <TouchableOpacity
    style={styles.loadMoreButton}
    onPress={() => setCurrentPage((prev) => prev + 1)}
  >
    <Text style={styles.loadMoreText}>{t("loadMoreVehicles")}</Text>
  </TouchableOpacity>
)}

{/* RELOAD */}
{vehicles.length > 0 && (
  <TouchableOpacity
    style={styles.reloadButton}
    onPress={() => {
      setCurrentPage(1);
      fetchVehicles();
    }}
  >
     <Text style={styles.reloadText}>{t("reloadVehicles")}</Text>
     </TouchableOpacity>
   )}

      </View>
    </TouchableOpacity>
    </Modal>)}

       {/* LUGGAGE PICKER PRO BACKEND SYNC */}
{showLuggagePicker && (
  <Modal transparent animationType="fade">
    <TouchableOpacity
      style={styles.backdrop}
      activeOpacity={1}
      onPress={() => setShowLuggagePicker(false)}
    >
      <Animated.View
        style={[
          styles.vehicleSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleTitleSheet}>
            {t("luggageType")}
          </Text>

          <TouchableOpacity
            onPress={() => {
              setShowLuggagePicker(false);
              setShowLuggageForm(true);
            }}
          >
            <Plus size={22} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* LIST */}
        {luggages.length === 0 ? (
          <Text style={styles.emptyText}>
            {t("noLuggageOptions")}
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 350 }}>
            {paginatedLuggages.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.vehicleCard}
                onPress={() => {
                  setLuggageInfo(item.name);
                  setShowLuggagePicker(false);
                }}
                onLongPress={() => {
                  Alert.alert(
                    t("deleteLuggage"),
                    `${item.name} ?`,
                    [
                      { text: t("cancel"), style: "cancel" },
                      {
                        text: t("delete"),
                        style: "destructive",
                        onPress: () =>
                          deleteLuggage(item.id),
                      },
                    ]
                  );
                }}
                delayLongPress={400}
              >
                <Text style={styles.vehicleTitle}>
                  {item.name}
                </Text>

                {item.description && (
                  <Text style={styles.vehicleSubtitle}>
                    {item.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            {/* LOAD MORE */}
            {luggages.length > LUGGAGES_PER_PAGE &&
              luggagePage < luggageTotalPages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() =>
                    setLuggagePage((prev) => prev + 1)
                  }
                >
                  <Text style={styles.loadMoreText}>
                    {t("loadMore")}
                  </Text>
                </TouchableOpacity>
              )}

            {/* RELOAD */}
            <TouchableOpacity
              style={styles.reloadButton}
              onPress={() => {
                setLuggagePage(1);
                fetchLuggages();
              }}
            >
              <Text style={styles.reloadText}>
                {t("reload")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Animated.View>
    </TouchableOpacity>
  </Modal>
)}

          {/* VEHICLE FORM */}
          {showVehicleForm && (
          <VehicleScreen
              onBack={(newVehicle?: any) => {
                   setShowVehicleForm(false);
          if (newVehicle) {
            const formatted: Vehicle = {
              id: newVehicle.id,
              marque: newVehicle.marque,
              modele: newVehicle.modele,
              immatriculation: newVehicle.immatriculation,
              nombre_portes: newVehicle.nombre_portes,
              nombre_places: newVehicle.nombre_places,
              statut: newVehicle.statut,
              type_vehicule: newVehicle.type_vehicule,
          };

        setVehicles((prev) => [formatted, ...prev]);
      } else {
        // 🔥 sécurité : refetch si nécessaire
        fetchVehicles();
      }
    }}
    />
   )}

   {showLuggageForm && (
  <LuggageScreen
    onBack={(newLuggage?: any) => {
      setShowLuggageForm(false);

      if (newLuggage) {
        const formatted: Luggage = {
          id: newLuggage.id,
          name: newLuggage.name,
          description: newLuggage.description,
        };

        setLuggages((prev) => [formatted, ...prev]);
      } else {
        fetchLuggages();
      }
    }}
  />
)}
    {/* MEETING POINT PICKER PRO (comme vehicles & luggages) */}
{showMeetingPointScreen && (
  <Modal transparent animationType="fade">
    <TouchableOpacity
      style={styles.backdrop}
      activeOpacity={1}
      onPress={() => setShowMeetingPointScreen(false)}
    >
      <Animated.View
        style={[styles.vehicleSheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* HEADER */}
        <View style={styles.vehicleHeader}>
          <Text style={styles.vehicleTitleSheet}>{t("chooseMeetingPoints")}</Text>
          <TouchableOpacity
            onPress={() => {
              setShowMeetingPointScreen(false);
              setShowMeetingPointForm(true);
            }}
          >
            <Plus size={22} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* LISTE DES MEETING POINTS */}
        {meetingPoints.length === 0 ? (
          <Text style={styles.emptyText}>{t("noMeetingPoints")}</Text>
        ) : (
          <ScrollView style={{ maxHeight: 350 }}>
            {paginatedMeetingPoints.map((mp) => {
              const isSelected = selectedMeetingPoints.some(p => p.id === mp.id);
              return (
                <TouchableOpacity
                  key={mp.id}
                  style={[styles.vehicleCard, isSelected && { backgroundColor: "#DCFCE7" }]}
                  onPress={() => {
                    setSelectedMeetingPoints(prev => {
                      if (isSelected) return prev.filter(p => p.id !== mp.id);
                      return [...prev, mp];
                    });
                    setShowMeetingPointScreen(false);
                  }}
                  onLongPress={() => {
                    Alert.alert(
                      t("deleteMeetingPoint"),
                      `${mp.name} ?`,
                      [
                        { text: t("cancel"), style: "cancel" },
                        {
                          text: t("delete"),
                          style: "destructive",
                          onPress: async () => {
                            const baseURL = Platform.OS === "android"
                              ? "http://10.0.2.2:8080"
                              : "http://localhost:8080";
                            const res = await fetch(`${baseURL}/meeting-points/${mp.id}`, { method: "DELETE" });
                            if (res.ok) {
                              setMeetingPoints(prev => prev.filter(p => p.id !== mp.id));
                              setSelectedMeetingPoints(prev => prev.filter(p => p.id !== mp.id));
                              Alert.alert(t("success"), t("meetingPointDeleted"));
                            } else {
                              Alert.alert(t("error"), t("meetingPointDeleteError"));
                            }
                          },
                        },
                      ]
                    );
                  }}
                  delayLongPress={400}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleTitle}>{mp.name}</Text>
                    <Text style={styles.vehicleSubtitle}>📍 {mp.city}</Text>
                    <Text style={styles.vehicleSubtitle}>{mp.address}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* PAGINATION */}
            {meetingPoints.length > MEETING_POINTS_PER_PAGE &&
              meetingPointPage < meetingPointTotalPages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() => setMeetingPointPage(prev => prev + 1)}
                >
                  <Text style={styles.loadMoreText}>{t("loadMore")}</Text>
                </TouchableOpacity>
              )}

            {/* RELOAD */}
            {meetingPoints.length > 0 && (
              <TouchableOpacity
                style={styles.reloadButton}
                onPress={() => {
                  setMeetingPointPage(1);
                  fetchMeetingPoints();
                }}
              >
                <Text style={styles.reloadText}>{t("reload")}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </Animated.View>
    </TouchableOpacity>
  </Modal>
)}

{/* FORMULAIRE MEETING POINT */}
{showMeetingPointForm && (
  <MeetingPointScreen
    selectedPoints={selectedMeetingPoints}
    onBack={(points?: MeetingPoint[]) => {
      setShowMeetingPointForm(false);
      if (points) setMeetingPoints(prev => [...points, ...prev]);
      else fetchMeetingPoints();
    }}
  />
)}
</Animated.View>
</View>
</Modal>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#F9FAFB", borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { width: 48, height: 5, backgroundColor: "#D1D5DB", borderRadius: 3, alignSelf: "center", marginVertical: 10 },
  headerRow: { flexDirection: "row", paddingHorizontal: 16, alignItems: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  card: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 18 },
  rowGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  halfInput: { flex: 1, backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12 },
  input: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12, marginBottom: 12 },
  select: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  submit: { position: "absolute", bottom: 20, left: 16, right: 16, backgroundColor: "#059669", paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  submitLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  vehicleSheet: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  vehicleItem: { paddingVertical: 14 },
  vehicleSeats: { color: "#6B7280", fontSize: 12 },
  bottomSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  sheetItemText: { fontSize: 15, color: "#111827" },
  suggestionBox: { backgroundColor: "#fff", borderRadius: 12, marginTop: 4, paddingVertical: 6, elevation: 5, zIndex: 100 },
  suggestionItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },

  vehicleHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

vehicleTitleSheet: {
  fontSize: 16,
  fontWeight: "600",
},

vehicleCard: {
  flexDirection: "row",
  alignItems: "center",
  padding: 16,
  borderRadius: 18,
  backgroundColor: "#ffffff",
  marginBottom: 12,

  // SHADOW iOS
  shadowColor: "#000",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },

  // ANDROID
  elevation: 3,
},

vehicleIconBox: {
  width: 44,
  height: 44,
  borderRadius: 14,
  backgroundColor: "#F3F4F6",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
},

vehicleTitle: {
  fontSize: 15,
  fontWeight: "600",
  color: "#111827",
},

vehicleSubtitle: {
  fontSize: 12,
  color: "#6B7280",
  marginTop: 2,
},

statusBadge: {
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
},

emptyText: {
  textAlign: "center",
  paddingVertical: 30,
  color: "#9CA3AF",
},

loadMoreButton: {
  marginTop: 10,
  paddingVertical: 12,
  borderRadius: 12,
  backgroundColor: "#E5E7EB",
  alignItems: "center",
},

loadMoreText: {
  fontWeight: "600",
  color: "#111827",
},

reloadButton: {
  marginTop: 8,
  paddingVertical: 10,
  borderRadius: 12,
  backgroundColor: "#DCFCE7",
  alignItems: "center",
},

reloadText: {
  fontWeight: "600",
  color: "#059669",
},

});
