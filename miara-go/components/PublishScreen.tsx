// PublishScreen.tsx — MODAL BOTTOM SHEET (Bolt style + Dynamic Vehicles)
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { ArrowLeft, Rocket, Search, ChevronDown, Car, Bus, Truck, Plus } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { VehicleScreen } from "./VehicleScreen";
import { LuggageScreen } from "./LuggageScreen";
import { MeetingPointScreen } from "./MeetingPointScreen";

/* ===================== NAV ===================== */
type RootStackParamList = { PassengerHome: undefined };
type PublishScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/* ===================== TYPES ===================== */
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


/* ===================== COMPONENT ===================== */
export function PublishScreen({
  rideRequestId: initialRideRequestId,
  user,
  userId,
  userType,
  onBack,
  userCredits = 500,
  onCreditUpdate,
}: {
  rideRequestId?: string;
  user?: any | null;
  userId?: number | string | null;
  userType?: "passenger" | "driver" | null;
  onBack: () => void;
  userCredits?: number;
  onCreditUpdate?: (newCredits: number) => void;
}) {

  
  const navigation = useNavigation<PublishScreenNavigationProp>();
  const { t } = useTranslation();

  /* ===================== MODAL ANIMATION ===================== */
  const screenHeight = Dimensions.get("window").height;
  const slideAnim = useState(new Animated.Value(screenHeight))[0];
  useEffect(() => {
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  }, []);

  /* ===================== MODE ===================== */
  //const [mode, setMode] = useState<"publish" | "search">(userType === "driver" ? "publish" : "search");

  const [mode, setMode] = useState<"publish">("publish");

  /* ===================== FORM STATES ===================== */
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [totalSeats, setTotalSeats] = useState("");
  const [message, setMessage] = useState("");
  const [luggages, setLuggages] = useState<Luggage[]>([]);
  const [selectedLuggage, setSelectedLuggage] = useState<string>("");
 const [rideRequestId, setRideRequestId] = useState("");

useEffect(() => {
  if (initialRideRequestId) {
    setRideRequestId(String(initialRideRequestId));
  }
}, [initialRideRequestId]);
  const [price, setPrice] = useState("");
  const [showLuggageForm, setShowLuggageForm] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const [isPublic, setIsPublic] = useState(true);
  const [enableBoost, setEnableBoost] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const VEHICLES_PER_PAGE = 5;
  const [vehiclePage, setVehiclePage] = useState(1);

const vehicleTotalPages = Math.ceil(
  vehicles.length / VEHICLES_PER_PAGE
);

const paginatedVehicles = vehicles.slice(
  0,
  vehiclePage * VEHICLES_PER_PAGE
);

  const [luggagePage, setLuggagePage] = useState(1);
  const LUGGAGES_PER_PAGE = 3;

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showLuggagePicker, setShowLuggagePicker] = useState(false);

  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([]);
  const [selectedMeetingPoints, setSelectedMeetingPoints] = useState<MeetingPoint[]>([]);
  const [showMeetingPointScreen, setShowMeetingPointScreen] = useState(false);
  
  const [showMeetingPointPicker, setShowMeetingPointPicker] = useState(false);
  const [showMeetingPointForm, setShowMeetingPointForm] = useState(false);
  const [meetingPointPage, setMeetingPointPage] = useState(1);
  const MEETING_POINTS_PER_PAGE = 3;

  /* ===================== USER RESOLVE ===================== */
  const [resolvedUserId, setResolvedUserId] = useState<number | null>(null);
  const [resolvedRole, setResolvedRole] = useState<"driver" | "passenger" | null>(null);

  useEffect(() => {
    if (user) {
      const id = Number(user.id);
      if (!isNaN(id)) setResolvedUserId(id);
      if (user.role === "driver" || user.role === "passenger") setResolvedRole(user.role);
      return;
    }
    const fallbackId = Number(userId);
    if (!isNaN(fallbackId)) setResolvedUserId(fallbackId);
    if (userType === "driver" || userType === "passenger") setResolvedRole(userType);
  }, [user, userId, userType]);

  /* ===================== HELPERS ===================== */
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const formatTime = (t: Date) =>
    `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;

  const totalCost = (isPublic ? 10 : 0) + (enableBoost ? 50 : 0);

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
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
      <View style={[styles.statusBadge, { backgroundColor: isAvailable ? "#DCFCE7" : "#FEE2E2" }]}>
        <Text style={{ color: isAvailable ? "#059669" : "#DC2626", fontWeight: "600", fontSize: 12 }}>
          {status}
        </Text>
      </View>
    );
  };

  /* ===================== FETCH VEHICLES ===================== */
  const fetchVehicles = async () => {
    try {
      const baseURL = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";
      const res = await fetch(`${baseURL}/vehicles?user_id=${resolvedUserId}`);
      if (!res.ok) return console.log("Vehicle fetch error:", res.status);
      const data = await res.json();
      if (!data.status || !Array.isArray(data.vehicles)) return setVehicles([]);
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
    } catch (err) {
      console.log("Vehicle fetch failed", err);
    }
  };

  useEffect(() => { 
    if (resolvedUserId)
       fetchVehicles(); 
    if (showLuggagePicker) {
    fetchLuggages();
    }

     if (showMeetingPointScreen) {
    fetchMeetingPoints();
    }

      }, [resolvedUserId, showLuggagePicker, showMeetingPointScreen]);

  const fetchLuggages = async () => {
  try {
    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080"
        : "http://localhost:8080";

    const res = await fetch(`${baseURL}/luggages`);

    const text = await res.text();
    if (!text || text.trim() === "") {
      setLuggages([]);
      return;
    }

    const data = JSON.parse(text);

    if (!data.status || !Array.isArray(data.luggages)) {
      setLuggages([]);
      return;
    }

    const formatted: Luggage[] = data.luggages.map((l: any) => ({
      id: Number(l.id),
      name: l.name,
      description: l.description ?? "",
    }));

    setLuggages(formatted);

  } catch (err) {
    console.log("Luggage fetch failed", err);
    setLuggages([]);
  }
};

const deleteVehicle = async (id: number) => {
  try {
    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080"
        : "http://localhost:8080";

    const res = await fetch(`${baseURL}/vehicles/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      Alert.alert(t("error"), t("vehicleDeleteError"));
      return;
    }

    setVehicles((prev) => prev.filter((v) => v.id !== id));

    if (vehicle?.id === id) {
      setVehicle(null);
    }

    Alert.alert(t("success"), t("vehicleDeleted"));
  } catch (error) {
    Alert.alert(t("error"), t("vehicleDeleteError"));
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

    if (selectedLuggage === luggages.find(l => l.id === id)?.name) {
      setSelectedLuggage("");
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
  


  /* ===================== DRIVER — OFFER ===================== */
  const publishOffer = async () => {
    if (resolvedRole !== "driver") return Alert.alert(t("error"), t("notDriverAccount"));
    if (!resolvedUserId) return Alert.alert(t("error"), t("driverIdMissing"));
    if (!rideRequestId || !price || !totalSeats || !message || !vehicle)
      return Alert.alert(t("error"), t("missingFields"));
    if (totalCost > userCredits)
      return Alert.alert(t("insufficientCredits"), `${t("missing")} ${totalCost - userCredits} ${t("credits")}`);

    const payload = {
      ride_request_id: Number(rideRequestId),
      driver_id: resolvedUserId,
      price_per_seat: Number(price),
      seats_offered: Number(totalSeats),
      message,
      car_info: `${vehicle.marque} ${vehicle.modele}`,
      status: "pending",
      luggage_info: selectedLuggage,
    };

    setLoading(true);
    try {
      const res = await fetch("http://10.0.2.2:8080/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        return Alert.alert("Erreur", text || "Erreur serveur");
      }
      onCreditUpdate?.(userCredits - totalCost);
      Alert.alert(t("success"), t("offerPublished"));
      onBack();
    } catch {
      Alert.alert(t("error"), t("serverUnavailable"));
    } finally { setLoading(false); }
  };

  /* ===================== PASSENGER — REQUEST ===================== */
  const publishRequest = async () => {
    if (resolvedRole !== "passenger") return Alert.alert(t("error"), t("notPassengerAccount"));
    if (!resolvedUserId) return Alert.alert(t("error"), t("passengerIdMissing"));
    if (!departure || !arrival || !date) return Alert.alert(t("error"), t("departureArrivalDateRequired"));

    const desiredTime = time ? `${formatTime(time)}:00` : "00:00:00";

    const payload = {
      passenger_id: resolvedUserId,
      departure_location: departure,
      arrival_location: arrival,
      desired_date: `${formatDate(date)} ${desiredTime}`,
      desired_time: desiredTime,
      seats_needed: Number(totalSeats) || 1,
      luggage_info: selectedLuggage,
      message,
      status: "active",
      is_notified: false,
    };

    setLoading(true);
    try {
      const res = await fetch("http://10.0.2.2:8080/ride-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        return Alert.alert("Erreur", text || "Erreur serveur");
      }
      Alert.alert(t("success"), t("searchPublished"));
      navigation.replace("PassengerHome");
    } catch {
      Alert.alert(t("error"), t("serverUnavailable"));
    } finally { setLoading(false); }
  };

  const handlePublish = () => (mode === "publish" ? publishOffer() : publishRequest());

  /* ===================== UI ===================== */
  return (
    <Modal transparent visible animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />
          {/* HEADER */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack}><ArrowLeft size={22} /></TouchableOpacity>
            <Text style={styles.headerTitle}>{mode === "publish" ? t("publishOffer") : t("publishSearch")}</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* TABS */}
          <View style={styles.tabs}>
           {/*}
            <TouchableOpacity style={[styles.tab, mode === "search" && styles.activeTab]} onPress={() => setMode("search")}>
              <Search size={16} color={mode === "search" ? "#fff" : "#111"} />
              <Text style={[styles.tabLabel, mode === "search" && styles.tabOn]}>{t("search")}</Text>
            </TouchableOpacity>*/}
            <TouchableOpacity style={[styles.tab, mode === "publish" && styles.activeTab]} onPress={() => setMode("publish")}>
              <Rocket size={16} color={mode === "publish" ? "#fff" : "#111"} />
              <Text style={[styles.tabLabel, mode === "publish" && styles.tabOn]}>{t("propose")}</Text>
            </TouchableOpacity>
          </View>

          {/* CONTENT */}
          <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
            <View style={styles.card}>
              {/* PASSENGER SEARCH */}
              {/* 
                {mode === "search" && (
              <View style={styles.gridContainer}>

     
      <View style={styles.gridRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>{t("departure")}</Text>
          <TextInput
            style={styles.inputField}
            value={departure}
            onChangeText={setDeparture}
            placeholder={t("departure")}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>{t("arrival")}</Text>
          <TextInput
            style={styles.inputField}
            value={arrival}
            onChangeText={setArrival}
            placeholder={t("arrival")}
          />
        </View>
      </View>

     
      <View style={styles.gridRow}>
        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.label}>{t("date")}</Text>
          <Text style={styles.valueText}>
            {date ? formatDate(date) : t("date")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.label}>{t("time")}</Text>
          <Text style={styles.valueText}>
            {time ? formatTime(time) : t("time")}
          </Text>
        </TouchableOpacity>
      </View>

     
      <View style={styles.gridRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>{t("seats")}</Text>
          <TextInput
            style={styles.inputField}
            keyboardType="number-pad"
            value={totalSeats}
            onChangeText={(t) =>
              setTotalSeats(t.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
          />
        </View>

        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => setShowLuggagePicker(true)}
        >
          <Text style={styles.label}>{t("luggage")}</Text>
          <View style={styles.rowBetween}>
            <Text
              style={[
                styles.valueText,
                !selectedLuggage && styles.placeholderText,
              ]}
            >
              {selectedLuggage || t("luggage")}
            </Text>
            <ChevronDown size={18} color="#6B7280" />
          </View>
        </TouchableOpacity>
      </View>

     
      <View style={styles.fullWidth}>
        <Text style={styles.label}>{t("messageOptional")}</Text>
        <TextInput
          style={styles.textArea}
          multiline
          value={message}
          onChangeText={setMessage}
          placeholder={t("messageOptional")}
        />
      </View>
    </View>
  )}
  */}

              {/* DRIVER PUBLISH */}
              {mode === "publish" && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder={t("requestId")}
                    keyboardType="number-pad"
                    value={rideRequestId}
                    onChangeText={(t) => setRideRequestId(t.replace(/[^0-9]/g, ""))}
                  />

                  <View style={styles.rowGrid}>
                    <TextInput
                      style={styles.halfInput}
                      placeholder={t("pricePerSeat")}
                      keyboardType="number-pad"
                      value={price}
                      onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                    />
                    <TextInput
                      style={styles.halfInput}
                      placeholder={t("seatsOffered")}
                      keyboardType="number-pad"
                      value={totalSeats}
                      onChangeText={(t) => setTotalSeats(t.replace(/[^0-9]/g, ""))}
                    />
                  </View>

                  {/* VEHICLE PICKER */}
                  <TouchableOpacity style={styles.select} onPress={() => setShowVehiclePicker(true)}>
                    <Text>{vehicle ? `${vehicle.marque} ${vehicle.modele} • ${vehicle.nombre_places} places` : t("chooseVehicle")}</Text>
                    <ChevronDown size={18} />
                  </TouchableOpacity>

                  {/* LUGGAGE PICKER */}
                  <TouchableOpacity style={styles.select} onPress={() => setShowLuggagePicker(true)}>
                    <Text style={{ color: selectedLuggage ? "#111827" : "#6B7280" }}>{selectedLuggage || t("luggage")}</Text>
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

                                  <TextInput style={[styles.input, { height: 80 }]} multiline placeholder={t("message")} value={message} onChangeText={setMessage} />

                                <View style={styles.switchRow}>
                                  <Text>{t("publicPublication")}</Text>
                                  <Switch value={isPublic} onValueChange={setIsPublic} />
                                </View>

                  <View style={styles.switchRow}>
                    <Text>{t("boostVisibility")}</Text>
                    <Switch value={enableBoost} onValueChange={setEnableBoost} />
                  </View>

                  <Text style={styles.costText}>
                    {t("cost")} : {totalCost} {t("credits")} • {t("balance")} : {userCredits}
                  </Text>
                </>
              )}
            </View>
          </ScrollView>

          {/* SUBMIT */}
          <TouchableOpacity style={styles.submit} disabled={loading} onPress={handlePublish}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitLabel}>{mode === "publish" ? t("publishOfferBtn") : t("publishSearchBtn")}</Text>}
          </TouchableOpacity>

          {/* DATE / TIME PICKERS */}
          {showDatePicker && (
            <DateTimePicker value={date || new Date()} mode="date" display={Platform.OS === "ios" ? "inline" : "calendar"} onChange={(e: DateTimePickerEvent, d?: Date) => { setShowDatePicker(false); if (d) setDate(d); }} />
          )}
          {showTimePicker && (
            <DateTimePicker value={time || new Date()} mode="time" is24Hour onChange={(e: DateTimePickerEvent, t?: Date) => { setShowTimePicker(false); if (t) setTime(t); }} />
          )}


{/* VEHICLE PICKER PRO */}
{showVehiclePicker && (
  <Modal transparent animationType="fade">
    <TouchableOpacity
      style={styles.backdrop}
      activeOpacity={1}
      onPress={() => setShowVehiclePicker(false)}
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
          <View>
            <Text style={styles.vehicleTitleSheet}>
            {t("chooseVehicle")}
          </Text>
           <Text style={styles.uberSubtitle}>
              {vehicles.length} {t("available")}
            </Text>
          </View>
          

          <TouchableOpacity
            onPress={() => {
              setShowVehiclePicker(false);
              setShowVehicleForm(true);
            }}
          >
            <Plus size={22} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* LIST */}
        {vehicles.length === 0 ? (
          <Text style={styles.emptyText}>
            {t("noVehicle")}
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 400 }}>
            {paginatedVehicles.map((v) => {
              const disabled = v.statut !== "disponible";

              return (
                <TouchableOpacity
                  key={v.id}
                  disabled={disabled}
                  activeOpacity={0.9}
                  style={[
                    styles.vehicleCard,
                    disabled && { opacity: 0.5 },
                  ]}
                  onPress={() => {
                    if (!disabled) {
                      setVehicle(v);
                      setTotalSeats(String(v.nombre_places));
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
                          onPress: () =>
                            deleteVehicle(Number(v.id)),
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
                  <View style={{ flex: 1, marginLeft: 12 }}>
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
            })}

            {/* LOAD MORE */}
            {vehicles.length > VEHICLES_PER_PAGE &&
              vehiclePage < vehicleTotalPages && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={() =>
                    setVehiclePage((prev) => prev + 1)
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
                setVehiclePage(1);
                fetchVehicles();
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


  {/* ===================== LUGGAGE PICKER — UBER STYLE ===================== */}
{showLuggagePicker && (
  <Modal transparent animationType="fade">
    <TouchableOpacity
      style={styles.backdrop}
      activeOpacity={1}
      onPress={() => setShowLuggagePicker(false)}
    >
      <Animated.View
        style={[
          styles.uberSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* HANDLE */}
        <View style={styles.sheetHandle} />

        {/* HEADER */}
        <View style={styles.uberHeader}>
          <View>
            <Text style={styles.uberTitle}>{t("luggageType")}</Text>
            <Text style={styles.uberSubtitle}>
              {luggages.length} {t("available")}
            </Text>
          </View>

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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t("noLuggageOptions")}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ maxHeight: 420 }}
            showsVerticalScrollIndicator={false}
          >
            {paginatedLuggages.map((item) => {
              const isSelected = selectedLuggage === item.name;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={[
                    styles.uberCard,
                    isSelected && styles.uberCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedLuggage(String(item.name));
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
                            deleteLuggage(Number(item.id)),
                        },
                      ]
                    );
                  }}
                >
                  <View style={styles.uberIconBox}>
                    <Text style={{ fontSize: 18 }}>🎒</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.uberCardTitle}>
                      {item.name}
                    </Text>

                    {item.description && (
                      <Text style={styles.uberCardSubtitle}>
                        {item.description}
                      </Text>
                    )}
                  </View>

                  {isSelected && (
                    <View style={styles.selectedDot} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* LOAD MORE */}
            {luggages.length > LUGGAGES_PER_PAGE &&
              luggagePage < luggageTotalPages && (
                <TouchableOpacity
                  style={styles.loadMoreUber}
                  onPress={() =>
                    setLuggagePage((prev) => prev + 1)
                  }
                >
                  <Text style={styles.loadMoreUberText}>
                    {t("loadMore")}
                  </Text>
                </TouchableOpacity>
              )}

            {/* RELOAD */}
            <TouchableOpacity
              style={styles.reloadUber}
              onPress={() => {
                setLuggagePage(1);
                fetchLuggages();
              }}
            >
              <Text style={styles.reloadUberText}>
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
                const formatted = {
                    id: newLuggage.id,
                    name: newLuggage.name,
                    description: newLuggage.description ?? "",
              };

                   setLuggages((prev) => [formatted, ...prev]);
                   setSelectedLuggage(formatted.name); // 🔥 sélection auto
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
  sheet: { backgroundColor: "#F9FAFB", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "95%" },
  handle: { width: 48, height: 5, backgroundColor: "#D1D5DB", borderRadius: 3, alignSelf: "center", marginVertical: 10 },
  headerRow: { flexDirection: "row", paddingHorizontal: 16, alignItems: "center", marginBottom: 8 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  tabs: { marginHorizontal: 16, backgroundColor: "#E5E7EB", padding: 4, borderRadius: 999, flexDirection: "row" },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, flexDirection: "row", justifyContent: "center", gap: 6 },
  activeTab: { backgroundColor: "#059669" },
  tabLabel: { fontSize: 14, fontWeight: "500", color: "#111" },
  tabOn: { color: "#fff" },
  card: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 18 },
  rowGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  halfInput: { flex: 1, backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12 },
  input: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12, marginBottom: 12 },
  select: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 10 },
  submit: { position: "absolute", bottom: 20, left: 16, right: 16, backgroundColor: "#059669", paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  submitLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  costText: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
 
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  vehicleSeats: { fontSize: 12, color: "#6B7280" },
  statusBadge: { position: "absolute", top: 14, right: 14, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  emptyText: { textAlign: "center", color: "#6B7280", marginVertical: 20 },

  
  uberSheet: {
  backgroundColor: "#FFFFFF",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 20,
  paddingBottom: 24,
  paddingTop: 10,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 20,
  elevation: 20,
},

sheetHandle: {
  width: 50,
  height: 5,
  backgroundColor: "#E5E7EB",
  borderRadius: 3,
  alignSelf: "center",
  marginBottom: 16,
},

uberHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
},

uberTitle: {
  fontSize: 18,
  fontWeight: "700",
  color: "#111827",
},

uberSubtitle: {
  fontSize: 13,
  color: "#6B7280",
  marginTop: 2,
},

addButton: {
  backgroundColor: "#059669",
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: "center",
  alignItems: "center",
},

uberCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F9FAFB",
  padding: 14,
  borderRadius: 16,
  marginBottom: 12,
},

uberCardSelected: {
  borderWidth: 1.5,
  borderColor: "#059669",
  backgroundColor: "#ECFDF5",
},

uberIconBox: {
  width: 42,
  height: 42,
  borderRadius: 14,
  backgroundColor: "#E5E7EB",
  justifyContent: "center",
  alignItems: "center",
},

uberCardTitle: {
  fontSize: 15,
  fontWeight: "600",
  color: "#111827",
},

uberCardSubtitle: {
  fontSize: 12,
  color: "#6B7280",
  marginTop: 3,
},

selectedDot: {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "#059669",
},

emptyContainer: {
  paddingVertical: 40,
  alignItems: "center",
},

loadMoreUber: {
  paddingVertical: 14,
  alignItems: "center",
},

loadMoreUberText: {
  color: "#059669",
  fontWeight: "600",
},

reloadUber: {
  paddingVertical: 10,
  alignItems: "center",
},

reloadUberText: {
  fontSize: 12,
  color: "#9CA3AF",
},

vehicleSheet: {
  position: "absolute",
  bottom: 0,
  width: "100%",
  backgroundColor: "#fff",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: 20,
  elevation: 15,
},

vehicleHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 15,
},

vehicleTitleSheet: {
  fontSize: 18,
  fontWeight: "700",
},

vehicleCard: {
  flexDirection: "row",
  alignItems: "center",
  padding: 14,
  borderRadius: 14,
  backgroundColor: "#F9FAFB",
  marginBottom: 12,
},

vehicleIconBox: {
  width: 45,
  height: 45,
  borderRadius: 12,
  backgroundColor: "#ECFDF5",
  justifyContent: "center",
  alignItems: "center",
},

vehicleTitle: {
  fontSize: 15,
  fontWeight: "600",
},

vehicleSubtitle: {
  fontSize: 13,
  color: "#6B7280",
},

loadMoreButton: {
  padding: 12,
  alignItems: "center",
},

loadMoreText: {
  color: "#059669",
  fontWeight: "600",
},

reloadButton: {
  padding: 12,
  alignItems: "center",
},

reloadText: {
  color: "#323539",
  fontWeight: "600",
},

gridContainer: {
  gap: 10,
},

gridRow: {
  flexDirection: "row",
  gap: 12,
},

inputWrapper: {
  flex: 1,
  backgroundColor: "#F9FAFB",
  borderRadius: 14,
  paddingHorizontal: 14,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  minHeight: 20,
  justifyContent: "center",
},

label: {
  fontSize: 12,
  color: "#6B7280",
  marginBottom: 2,
},

inputField: {
  fontSize: 15,
  fontWeight: "500",
  color: "#111827",
},

valueText: {
  fontSize: 15,
  fontWeight: "500",
  color: "#111827",
},

placeholderText: {
  color: "#9CA3AF",
},

rowBetween: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

fullWidth: {
  width: "100%",
},

textArea: {
  backgroundColor: "#F9FAFB",
  borderRadius: 14,
  padding: 14,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  minHeight: 90,
  textAlignVertical: "top",
  fontSize: 15,
},

});
