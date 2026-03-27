import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from "react-native";

import { TouchableWithoutFeedback } from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { ArrowLeft, ChevronDown, Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import  { LuggageScreen } from "./LuggageScreen";




interface Luggage {
  id: number;
  name: string;
  description?: string;
}


const LOCATIONS = [
  "Antananarivo", "Antsirabe", "Toamasina", "Mahajanga", "Fianarantsoa",
  "Toliara", "Nosy Be", "Diego Suarez", "Maevatanana", "Sambava",
  "Antalaha", "Manakara", "Ambositra", "Antsohihy", "Farafangana",
  "Vangaindrano", "Vohipeno", "Mananjary", "Fenérive-Est", "Ambanja",
  "Ambatondrazaka", "Ihosy", "Moramanga", "Morondava", "Betafo",
  "Anjozorobe", "Ankazobe",
];

/* ===================== TYPES ===================== */
interface RideRequestScreenProps {
  userId: number;
  rideRequestId?: number;
  departure?: string;
  arrival?: string;
  onBack: () => void;
}

/* ===================== COMPONENT ===================== */
export default function RideRequestScreen({
  userId,
  departure = "",
  arrival = "",
  onBack,
}: RideRequestScreenProps) {
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
  const [departureLocation, setDepartureLocation] = useState(departure);
  const [arrivalLocation, setArrivalLocation] = useState(arrival);
  const [departureSuggestions, setDepartureSuggestions] = useState<string[]>([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState<string[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [seats, setSeats] = useState("1");
  
  const [luggages, setLuggages] = useState<Luggage[]>([]);
  const [selectedLuggage, setSelectedLuggage] = useState<string>("");
  
  const [luggagePage, setLuggagePage] = useState(1);
  const LUGGAGES_PER_PAGE = 3;

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showLuggagePicker, setShowLuggagePicker] = useState(false)
  const [showLuggageForm, setShowLuggageForm] = useState(false)

  /* ===================== HELPERS ===================== */
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const formatTime = (t: Date) =>
    `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  const filterLocations = (text: string) =>
    LOCATIONS.filter((l) => l.toLowerCase().includes(text.toLowerCase())).slice(0, 5);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) setTime(selectedTime);
  };

 useEffect(() => { 
    if (showLuggagePicker) {
    fetchLuggages();
  }
  }, [showLuggagePicker]);

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

  /* ===================== SUBMIT ===================== */
  const submit = async () => {
    if (!departureLocation || !arrivalLocation || !seats) {
      Toast.show({
        type: "error",
        text1: t("missingFieldsTitle"),
        text2: t("missingFieldsDesc"),
      });
      return;
    }

    const payload = {
      departure_location: departureLocation,
      arrival_location: arrivalLocation,
      desired_date: formatDate(date),
      desired_time: formatTime(time),
      seats_needed: Number(seats),
      luggage_info: selectedLuggage,
      message,
      status: "active",
      is_notified: 0,
    };

    try {
      setLoading(true);
      const baseURL =
        Platform.OS === "android"
           ? "http://10.0.2.2:8080"
           : "http://localhost:8080";

    const res = await fetch(`${baseURL}/ride-requests`,
     {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        Toast.show({
          type: "error",
          text1: t("serverErrorTitle"),
          text2: json?.messages?.error || t("serverErrorDesc"),
        });
        return;
      }

      Toast.show({
        type: "success",
        text1: t("successTitle"),
        text2: json?.message || t("successDesc"),
        position: "top",
        visibilityTime: 3000,
      });

      // Reset du formulaire
      setDepartureLocation("");
      setArrivalLocation("");
      setSeats("1");
      setSelectedLuggage("");
      setMessage("");
      onBack();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: t("networkErrorTitle"),
        text2: t("networkErrorDesc"),
      });
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <Modal transparent visible animationType="none">
        <TouchableWithoutFeedback onPress={onBack}>
        <View style={styles.overlay}>
           <TouchableWithoutFeedback>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack}>
              <ArrowLeft size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("newRequest")}</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
            <View style={styles.card}>
              {/* DEPART / ARRIVÉE */}
              <View style={styles.rowGrid}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.halfInput}
                    placeholder={t("departure")}
                    value={departureLocation}
                    onChangeText={(text) => {
                      setDepartureLocation(text);
                      setDepartureSuggestions(filterLocations(text));
                    }}
                  />
                  {departureSuggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                      {departureSuggestions.map((item) => (
                        <TouchableOpacity key={item} onPress={() => { setDepartureLocation(item); setDepartureSuggestions([]); }}>
                          <Text style={styles.suggestionItem}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.halfInput}
                    placeholder={t("arrival")}
                    value={arrivalLocation}
                    onChangeText={(text) => {
                      setArrivalLocation(text);
                      setArrivalSuggestions(filterLocations(text));
                    }}
                  />
                  {arrivalSuggestions.length > 0 && (
                    <View style={styles.suggestionBox}>
                      {arrivalSuggestions.map((item) => (
                        <TouchableOpacity key={item} onPress={() => { setArrivalLocation(item); setArrivalSuggestions([]); }}>
                          <Text style={styles.suggestionItem}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* DATE / TIME */}
              <View style={styles.rowGrid}>
                <TouchableOpacity style={styles.halfInput} onPress={() => setShowDatePicker(true)}>
                  <Text>{formatDate(date)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.halfInput} onPress={() => setShowTimePicker(true)}>
                  <Text>{formatTime(time)}</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "calendar"}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour
                  onChange={handleTimeChange}
                />
              )}

              {/* SEATS */}
              <TextInput
                style={styles.input}
                placeholder={t("seatingCapacity")}
                keyboardType="number-pad"
                value={seats}
                onChangeText={(t) => setSeats(t.replace(/[^0-9]/g, ""))}
              />

              {/* LUGGAGE */}
              <TouchableOpacity style={styles.select} onPress={() => setShowLuggagePicker(true)}>
                <Text style={{ color: selectedLuggage ? "#111827" : "#6B7280" }}>{selectedLuggage ? t(selectedLuggage) : t("luggage")}</Text>
                <ChevronDown size={18} />
              </TouchableOpacity>

              {/* MESSAGE */}
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder={t("messageOptional")}
                multiline
                value={message}
                onChangeText={setMessage}
              />
            </View>
          </ScrollView>

          {/* SUBMIT */}
          <TouchableOpacity style={styles.submit} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitLabel}>{t("publish")}</Text>}
          </TouchableOpacity>

          {/* LUGGAGE PICKER */}
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

          {/* LUGGAGE FORM */}
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
              </Animated.View>
            </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
            <Toast />
    </Modal>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#F9FAFB", borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { width: 49, height: 5, backgroundColor: "#D1D5DB", borderRadius: 3, alignSelf: "center", marginVertical: 10 },
  headerRow: { flexDirection: "row", paddingHorizontal: 16, alignItems: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  card: { backgroundColor: "#fff", margin: 16, padding: 16, borderRadius: 18 },
  rowGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  halfInput: { flex: 1, backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12 },
  input: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12, marginBottom: 12 },
  select: { backgroundColor: "#F1F5F9", padding: 12, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  submit: { position: "absolute", bottom: 20, left: 16, right: 16, backgroundColor: "#059669", paddingVertical: 16, borderRadius: 999, alignItems: "center" },
  submitLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, textAlign: "center" },
  sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  sheetItemText: { fontSize: 15, color: "#111827" },
  suggestionBox: { backgroundColor: "#fff", borderRadius: 12, marginTop: 4, paddingVertical: 6, elevation: 5, zIndex: 100 },
  suggestionItem: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },

  uberSheet: {
  backgroundColor: "#FFFFFF",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 20,
  paddingBottom: 24,
  paddingTop: 10,
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

uberCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F9FAFB",
  padding: 12,
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

emptyText: {
  fontSize: 14,
  color: "#6B7280",
},
});
