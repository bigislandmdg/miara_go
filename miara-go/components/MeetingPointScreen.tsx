import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  FlatList,
} from "react-native";

import { ArrowLeft, Navigation, Map, Compass, ChevronDown, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import * as Location from 'expo-location';

export interface MeetingPoint {
  id: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  place_type: string;
  is_active: boolean;
}

interface Props {
  onBack: (meetingPoints?: MeetingPoint[]) => void;
  token?: string;
  meetingPointToEdit?: any;
  selectedPoints?: MeetingPoint[];
}

// =========================================================
// 🔹 LISTE DES VILLES DE MADAGASCAR (SANS DOUBLONS)
// =========================================================
const MADAGASCAR_CITIES = [
  // Analamanga
  "Antananarivo",
  "Antananarivo Centre",
  "Ambohidratrimo",
  "Andramasina",
  "Anjozorobe",
  "Ankazobe",
  "Manjakandriana",
  
  // Vakinankaratra
  "Antsirabe",
  "Ambatondrazaka",
  "Ambatolampy",
  "Betafo",
  "Faratsiho",
  
  // Itasy
  "Miarinarivo",
  "Arivonimamo",
  "Soavinandriana",
  
  // Bongolava
  "Tsiroanomandidy",
  "Fenoarivobe",
  
  // Haute Matsiatra
  "Fianarantsoa",
  "Ambohimahasoa",
  "Ikalamavony",
  
  // Amoron'i Mania
  "Ambositra",
  "Ambatofinandrahana",
  "Fandriana",
  
  // Vatovavy
  "Mananjary",
  "Ifanadiana",
  "Nosy Varika",
  
  // Fitovinany
  "Manakara",
  "Ikongo",
  "Vohipeno",
  
  // Atsimo Atsinanana
  "Farafangana",
  "Vangaindrano",
  "Midongy Sud",
  
  // Ihorombe
  "Ihosy",
  "Iakora",
  "Ivohibe",
  
  // Menabe
  "Morondava",
  "Mahabo",
  "Manja",
  "Miandrivazo",
  
  // Atsimo Andrefana
  "Toliara",
  "Ampanihy",
  "Ankazoabo",
  "Benenitra",
  "Beroroha",
  "Betioky",
  "Morombe",
  "Sakaraha",
  
  // Androy
  "Ambovombe",
  "Bekily",
  "Beloha",
  "Tsiombe",
  
  // Anosy
  "Taolagnaro",
  "Amboasary",
  "Betroka",
  
  // Alaotra Mangoro
  "Ambatondrazaka",
  "Amparafaravola",
  "Andilamena",
  "Anosibe An'ala",
  "Moramanga",
  
  // Atsinanana
  "Toamasina",
  "Brickaville",
  "Mahanoro",
  "Marolambo",
  "Vatomandry",
  
  // Analanjirofo
  "Fenoarivo Atsinanana",
  "Fenérive-Est",
  "Mananara Nord",
  "Maroantsetra",
  "Soanierana Ivongo",
  "Vavatenina",
  
  // Sofia
  "Antsohihy",
  "Analalava",
  "Bealanana",
  "Befandriana Nord",
  "Boriziny",
  "Mampikony",
  "Mandritsara",
  
  // Boeny
  "Mahajanga",
  "Ambatoboeny",
  "Marovoay",
  "Mitsinjo",
  "Soalala",
  
  // Betsiboka
  "Maevatanana",
  "Kandreho",
  "Tsaratanana",
  
  // Melaky
  "Maintirano",
  "Ambatomainty",
  "Antsalova",
  "Besalampy",
  "Morafenobe",
  
  // Diana
  "Antsiranana",
  "Diego Suarez",
  "Ambilobe",
  "Ambanja",
  "Nosy Be",
  
  // Sava
  "Sambava",
  "Andapa",
  "Antalaha",
  "Vohemar",
  
  // Villes supplémentaires sans doublons
  "Maevatanana",
  "Sambava",
  "Antalaha",
  "Manakara",
  "Ambositra",
  "Antsohihy",
  "Farafangana",
  "Vangaindrano",
  "Vohipeno",
  "Mananjary",
  "Fenérive-Est",
  "Ambanja",
  "Ambatondrazaka",
  "Ihosy",
  "Moramanga",
  "Morondava",
  "Betafo",
  "Anjozorobe",
  "Ankazobe",
].sort();

// =========================================================
// 🔹 SUPPRIMER LES DOUBLONS DANS LA LISTE
// =========================================================
const UNIQUE_CITIES = [...new Set(MADAGASCAR_CITIES)].sort();

export function MeetingPointScreen({
  onBack,
  token,
  meetingPointToEdit,
  selectedPoints = [],
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!meetingPointToEdit;

  /* ================= STATES ================= */
  const [name, setName] = useState(meetingPointToEdit?.name || "");
  const [city, setCity] = useState(meetingPointToEdit?.city || "");
  const [address, setAddress] = useState(meetingPointToEdit?.address || "");
  const [latitude, setLatitude] = useState(
    meetingPointToEdit?.latitude ? String(meetingPointToEdit.latitude) : ""
  );
  const [longitude, setLongitude] = useState(
    meetingPointToEdit?.longitude ? String(meetingPointToEdit.longitude) : ""
  );
  const [placeType, setPlaceType] = useState(meetingPointToEdit?.place_type || "gare");
  const [isActive, setIsActive] = useState(meetingPointToEdit?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // =========================================================
  // 🔹 ÉTATS POUR LE SÉLECTEUR DE VILLE
  // =========================================================
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [filteredCities, setFilteredCities] = useState(UNIQUE_CITIES);

  // Filtrer les villes en fonction de la recherche
  useEffect(() => {
    if (citySearch.trim() === "") {
      setFilteredCities(UNIQUE_CITIES);
    } else {
      const filtered = UNIQUE_CITIES.filter(c => 
        c.toLowerCase().includes(citySearch.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [citySearch]);

  // =========================================================
  // 🔹 Obtenir la position réelle avec Expo Location
  // =========================================================
  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t("permissionDenied"),
          t("locationPermissionMessage")
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error("Erreur de géolocalisation:", error);
      Alert.alert(t("error"), t("locationError"));
      return null;
    } finally {
      setGettingLocation(false);
    }
  };

  // =========================================================
  // 🔹 Utiliser la position réelle
  // =========================================================
  const useCurrentLocation = async () => {
    Alert.alert(
      t("useCurrentLocation"),
      t("currentLocationConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("confirm"),
          onPress: async () => {
            const location = await getCurrentLocation();
            if (location) {
              setLatitude(String(location.latitude));
              setLongitude(String(location.longitude));
              setAddress(`${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // 🔹 Ouvrir dans Google Maps
  // =========================================================
  const openInGoogleMaps = () => {
    if (!latitude || !longitude) {
      Alert.alert(t("error"), t("noCoordinates"));
      return;
    }

    const scheme = Platform.select({
      ios: 'maps://0,0?q=',
      android: 'geo:0,0?q=',
    });
    
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(name || address || "Meeting point");
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
      });
    }
  };

  // =========================================================
  // 🔹 Ouvrir dans Waze
  // =========================================================
  const openInWaze = () => {
    if (!latitude || !longitude) {
      Alert.alert(t("error"), t("noCoordinates"));
      return;
    }

    const url = `waze://?ll=${latitude},${longitude}&navigate=yes`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t("wazeNotInstalled"),
        t("installWaze"),
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("install"),
            onPress: () => {
              const storeUrl = Platform.select({
                ios: 'https://apps.apple.com/app/waze/id323229106',
                android: 'market://details?id=com.waze',
              });
              if (storeUrl) Linking.openURL(storeUrl);
            },
          },
        ]
      );
    });
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!name) {
      Alert.alert(t("error"), t("nameRequired"));
      return false;
    }
    if (!city) {
      Alert.alert(t("error"), t("cityRequired"));
      return false;
    }
    if (!latitude || !longitude) {
      Alert.alert(t("error"), t("coordinatesRequired"));
      return false;
    }
    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const baseURL = Platform.OS === "android" ? "http://10.0.2.2:8080" : "http://localhost:8080";

      const url = isEdit
        ? `${baseURL}/meeting-points/${meetingPointToEdit.id}`
        : `${baseURL}/meeting-points`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          city: city || "",
          address: address || `${latitude}, ${longitude}`,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          place_type: placeType,
          is_active: isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur serveur");
      }

      Alert.alert(t("success"), isEdit ? t("meetingPointUpdated") : t("meetingPointSaved"));

      const updatedPoints = [...selectedPoints, data.meeting_point];
      onBack(updatedPoints);

    } catch (error: any) {
      Alert.alert(t("error"), error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  const Card = ({ children }: any) => <View style={styles.card}>{children}</View>;

  const PickerButton = ({ label, value, options, setValue }: any) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerRow}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setValue(opt)}
            style={[styles.pill, value === opt && styles.pillActive]}
          >
            <Text style={value === opt ? styles.pillTextActive : styles.pillText}>
              {t(opt)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // =========================================================
  // 🔹 MODAL DE SÉLECTION DE VILLE (AVEC CLÉS UNIQUES)
  // =========================================================
  const CityPickerModal = () => (
    <Modal visible={cityModalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("selectCity")}</Text>
            <TouchableOpacity onPress={() => setCityModalVisible(false)}>
              <X size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t("searchCity")}
              value={citySearch}
              onChangeText={setCitySearch}
              autoFocus
            />
          </View>

          <FlatList
            data={filteredCities}
            keyExtractor={(item, index) => `${item}-${index}`} // 🔹 CLÉ UNIQUE
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityItem}
                onPress={() => {
                  setCity(item);
                  setCityModalVisible(false);
                  setCitySearch("");
                }}
              >
                <Text style={styles.cityItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyListText}>{t("noCityFound")}</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <Modal animationType="slide">
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onBack(selectedPoints)}>
            <ArrowLeft size={22} />
          </TouchableOpacity>

          <Text style={styles.title}>
            {isEdit ? t("editMeetingPoint") : t("newMeetingPoint")}
          </Text>

          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Formulaire principal */}
          <Card>
            <Text style={styles.sectionTitle}>{t("meetingPointInformation")}</Text>

            {/* Boutons d'actions cartographiques */}
            <View style={styles.locationButtons}>
              <TouchableOpacity 
                style={styles.locationButton} 
                onPress={useCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color="#10B981" />
                ) : (
                  <>
                    <Navigation size={16} color="#10B981" />
                    <Text style={styles.locationButtonText}>{t("useCurrentLocation")}</Text>
                  </>
                )}
              </TouchableOpacity>

              {latitude && longitude && (
                <>
                  <TouchableOpacity style={styles.mapButton} onPress={openInGoogleMaps}>
                    <Map size={16} color="#3B82F6" />
                    <Text style={styles.mapButtonText}>Google Maps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.mapButton} onPress={openInWaze}>
                    <Compass size={16} color="#00A6FF" />
                    <Text style={styles.mapButtonText}>Waze</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TextInput
              placeholder={t("name")}
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            
            {/* ========================================================= */}
            {/* 🔹 SÉLECTEUR DE VILLE AMÉLIORÉ */}
            {/* ========================================================= */}
            <TouchableOpacity
              style={styles.citySelector}
              onPress={() => setCityModalVisible(true)}
            >
              <Text style={[styles.citySelectorText, !city && styles.placeholderText]}>
                {city || t("selectCity")}
              </Text>
              <ChevronDown size={18} color="#6B7280" />
            </TouchableOpacity>
            
            <TextInput
              placeholder={t("address")}
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              multiline
            />
            
            <View style={styles.row}>
              <TextInput
                placeholder={t("latitude")}
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
                value={latitude}
                onChangeText={setLatitude}
              />
              <TextInput
                placeholder={t("longitude")}
                style={[styles.input, styles.halfInput]}
                keyboardType="numeric"
                value={longitude}
                onChangeText={setLongitude}
              />
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>{t("placeType")}</Text>
            <PickerButton
              label={t("type")}
              value={placeType}
              setValue={setPlaceType}
              options={["gare","arret_bus","aeroport","hotel","parking","centre_commercial","autre"]}
            />
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>{t("status")}</Text>
            <PickerButton
              label={t("active")}
              value={isActive ? "active" : "inactive"}
              setValue={(v: string) => setIsActive(v === "active")}
              options={["active","inactive"]}
            />
          </Card>

          <TouchableOpacity
            style={styles.submit}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {isEdit ? t("updateMeetingPoint") : t("saveMeetingPoint")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* MODAL DE SÉLECTION DE VILLE */}
        <CityPickerModal />
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 18,
    borderRadius: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 14 },
  input: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  label: { fontSize: 14, marginBottom: 6, fontWeight: "500" },
  pickerRow: { flexDirection: "row", flexWrap: "wrap" },
  pill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: { backgroundColor: "#10B981" },
  pillText: { fontSize: 13 },
  pillTextActive: { fontSize: 13, color: "#fff", fontWeight: "600" },
  submit: {
    backgroundColor: "#10B981",
    margin: 20,
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Boutons d'actions cartographiques
  locationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  locationButtonText: {
    marginLeft: 6,
    color: "#10B981",
    fontWeight: "500",
    fontSize: 13,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  mapButtonText: {
    marginLeft: 6,
    color: "#3B82F6",
    fontWeight: "500",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },

  // =========================================================
  // 🔹 STYLES POUR LE SÉLECTEUR DE VILLE
  // =========================================================
  citySelector: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  citySelectorText: {
    fontSize: 14,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 14,
    fontSize: 14,
  },
  cityItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cityItemText: {
    fontSize: 15,
    color: "#111827",
  },
  emptyListText: {
    textAlign: "center",
    paddingVertical: 30,
    color: "#6B7280",
    fontSize: 14,
  },
});

