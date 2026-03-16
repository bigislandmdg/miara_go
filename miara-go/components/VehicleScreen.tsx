// VehicleScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Alert,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator } from "react-native";

import { useTranslation } from "react-i18next";


interface Props {
  onBack: (vehicle?: any) => void;
  token?: string;          // 🔥 AJOUTÉ
  vehicleToEdit?: any;     // 🔥 AJOUTÉ (mode édition)
}

export function VehicleScreen({ onBack, token, vehicleToEdit }: Props) {

  const { t } = useTranslation(); 

  const isEdit = !!vehicleToEdit;

   /* ================= STATES ================= */
  const [marque, setMarque] = useState(vehicleToEdit?.marque || "");
  const [modele, setModele] = useState(vehicleToEdit?.modele || "");
  const [version, setVersion] = useState(vehicleToEdit?.version || "");
  const [immatriculation, setImmatriculation] =
    useState(vehicleToEdit?.immatriculation || "");
    
  const currentYear = new Date().getFullYear();

  const [anneeFabrication, setAnneeFabrication] =
      useState(vehicleToEdit?.annee_fabrication?.toString() || String(currentYear));

  const [showYearPicker, setShowYearPicker] = useState(false);

  const [couleur, setCouleur] = useState(vehicleToEdit?.couleur || "Blanc");
  

  const [kilometrage, setKilometrage] =
    useState(vehicleToEdit?.kilometrage_actuel || 0);

  const [puissance, setPuissance] =
    useState(vehicleToEdit?.puissance_ch || 100);

  const [portes, setPortes] =
    useState(vehicleToEdit?.nombre_portes || 4);

  const [places, setPlaces] =
    useState(vehicleToEdit?.nombre_places || 4);

  const [typeVehicule, setTypeVehicule] =
    useState(vehicleToEdit?.type_vehicule || "voiture");

  const [carburant, setCarburant] =
    useState(vehicleToEdit?.carburant || "essence");

  const [transmission, setTransmission] =
    useState(vehicleToEdit?.transmission || "automatique");

  const [dateMiseCirculation, setDateMiseCirculation] =
    useState(
      vehicleToEdit?.date_mise_circulation
        ? new Date(vehicleToEdit.date_mise_circulation)
        : new Date()
    );

  const [dateControle, setDateControle] =
    useState(
      vehicleToEdit?.date_dernier_controle
        ? new Date(vehicleToEdit.date_dernier_controle)
        : new Date()
    );

  const [status, setStatus] =
    useState(vehicleToEdit?.statut || "disponible");

  const [photo, setPhoto] = useState<string | null>(
    vehicleToEdit?.photo_url || null
  );

  const [showDate1, setShowDate1] = useState(false);
  const [showDate2, setShowDate2] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= IMAGE PICKER ================= */

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };
   /* ================= VALIDATION ================= */

  const validate = () => {
    if (!marque || !modele || !immatriculation) {
      Alert.alert(t("error"), t("fillRequiredFields"));
      return false;
    }
    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("marque", marque);
      formData.append("modele", modele);
      formData.append("version", version);
      formData.append("immatriculation", immatriculation);
      formData.append("couleur", couleur);
      formData.append("annee_fabrication", anneeFabrication);
      formData.append("kilometrage_actuel", String(kilometrage));
      formData.append("puissance_ch", String(puissance));
      formData.append("nombre_portes", String(portes));
      formData.append("nombre_places", String(places));
      formData.append("type_vehicule", typeVehicule);
      formData.append("carburant", carburant);
      formData.append("transmission", transmission);
      formData.append("statut", status);
      formData.append(
        "date_mise_circulation",
        dateMiseCirculation.toISOString().split("T")[0]
      );
      formData.append(
        "date_dernier_controle",
        dateControle.toISOString().split("T")[0]
      );

      // 🔥 Upload photo
      if (photo && photo.startsWith("file")) {
        formData.append("photo", {
          uri: photo,
          type: "image/jpeg",
          name: "vehicle.jpg",
        } as any);
      }

      // 🔥 URL adaptable Android / Windows / Mac
      const baseURL =
        Platform.OS === "android"
          ? "http://10.0.2.2:8080"
          : "http://localhost:8080";

      const url = isEdit
        ? `${baseURL}/vehicles/${vehicleToEdit.id}`
        : `${baseURL}/vehicles`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur serveur");
      }

      Alert.alert(
          t("success"),
          isEdit
            ? t("vehicleUpdated")
            : t("vehicleSaved")
       );


      onBack(data); // 🔥 retourne data backend
    } catch (error: any) {
     Alert.alert(t("error"), error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  const Card = ({ children }: any) => (
    <View style={styles.card}>{children}</View>
  );

  const Stepper = ({
    label,
    value,
    setValue,
    step = 1,
  }: any) => (
    <View style={styles.stepperRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <TouchableOpacity
          onPress={() => setValue(Math.max(0, value - step))}
          style={styles.stepBtn}
        >
          <Text style={styles.stepText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>{value}</Text>
        <TouchableOpacity
          onPress={() => setValue(value + step)}
          style={styles.stepBtn}
        >
          <Text style={styles.stepText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const PickerButton = ({
    label,
    value,
    options,
    setValue,
  }: any) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerRow}>
        {options.map((opt: string) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setValue(opt)}
            style={[
              styles.pill,
              value === opt && styles.pillActive,
            ]}
          >
            <Text
              style={
                value === opt
                  ? styles.pillTextActive
                  : styles.pillText
              }
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const provinces = [
     { name: "Antananarivo", code: "T" },
     { name: "Toamasina", code: "M" },
     { name: "Fianarantsoa", code: "F" },
     { name: "Mahajanga", code: "J" },
     { name: "Toliara", code: "U" },
     { name: "Antsiranana", code: "D" },
  ];

  const formatPlate = (value: string) => {
     let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "");

  // Plaque temporaire WW
  if (cleaned.startsWith("WW")) {
    return cleaned.slice(0, 3);
  }

  const numbers = cleaned.slice(0, 4).replace(/\D/g, "");
  const letters = cleaned.slice(4).replace(/[0-9]/g, "");

  let formatted = numbers;

  if (letters.length > 0) {
    formatted += " " + letters.slice(0, 3);
  }

  return formatted;
  };

const validatePlate = (plate: string) => {
  const cleaned = plate.replace(/\s/g, "");

  // Format standard : 4 chiffres + province + 1 à 2 lettres
  const regexStandard = /^[0-9]{4}[TMFJUD][A-Z]{1,2}$/;

  // Plaque temporaire
  const regexTemp = /^WW[TMFJUD]$/;

  return regexStandard.test(cleaned) || regexTemp.test(cleaned);
};


  return (
    <Modal animationType="slide">
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onBack()}>
            <ArrowLeft size={22} />
          </TouchableOpacity>
            <Text style={styles.title}>
                  {isEdit ? t("editVehicle") : t("newVehicle")}
            </Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* IDENTITÉ */}
           <Card>
          <Text style={styles.sectionTitle}>
            {t("generalInformation")}
          </Text>

  <View style={styles.gridRow}>
    <View style={styles.gridItem}>
      <TextInput
        placeholder={t("brand")}
        style={styles.input}
        value={marque}
        onChangeText={setMarque}
      />
    </View>

    <View style={styles.gridItem}>
      <TextInput
        placeholder={t("model")}
        style={styles.input}
        value={modele}
        onChangeText={setModele}
      />
    </View>
  </View>

  <View style={styles.gridRow}>
    <View style={styles.gridItem}>
      <TextInput
        placeholder={t("version")}
        style={styles.input}
        value={version}
        onChangeText={setVersion}
      />
    </View>

    <View style={styles.gridItem}>
    <View style={{ marginBottom: 16 }}>
  <Text style={styles.label}>{t("color")}</Text>
  <View style={styles.colorRow}>
    {[
      { name: "Blanc", code: "#FFFFFF" },
      { name: "Noir", code: "#000000" },
      { name: "Gris", code: "#9CA3AF" },
      { name: "Rouge", code: "#EF4444" },
      { name: "Bleu", code: "#3B82F6" },
      { name: "Vert", code: "#10B981" },
      { name: "Jaune", code: "#F59E0B" },
      { name: "Orange", code: "#F97316" },
      { name: "Violet", code: "#321e5f" },
      { name: "Marron", code: "#A0522D" },
      { name: "Rose", code: "#9c7789" },
      { name: "cyan", code: "#06B6D4" },
      { name: "Argent", code: "#C0C0C0" },
      { name : "teal", code: "#008080" },
      { name: "bluesky", code: "#87CEEB" },
      { name: "midnight-blue", code: "#191970" },
      { name: "vert-pomme", code: "#8DB600" },
      { name: "corail", code: "#FF7F50" },
    ].map((c) => (
      <TouchableOpacity
        key={c.name}
        onPress={() => setCouleur(c.name)}
        style={[
          styles.colorCircle,
          {
            backgroundColor: c.code,
            borderWidth: couleur === c.name ? 3 : 1,
          },
        ]}
      />
    ))}
  </View>
  <Text style={{ marginTop: 6 }}>
    {t("selectedColor")} : {t(couleur.toLowerCase())}
  </Text>
</View>

    </View>

  </View>

<View style={styles.gridRow}>
   <View style={styles.gridItem}>
      <TouchableOpacity
         style={styles.input}
          onPress={() => setShowYearPicker(true)}
         >
        <Text>{t("year")} : {anneeFabrication}</Text>
     </TouchableOpacity>
    </View>
      <View style={styles.gridItem}>
       <View style={{ marginBottom: 12 }}>
      <TextInput
          placeholder={t("plateExample")}
          style={[
          styles.input,
          immatriculation &&
          !validatePlate(immatriculation) && {
          borderWidth: 1,
          borderColor: "#EF4444",
        },
    ]}
    value={immatriculation}
    autoCapitalize="characters"
    maxLength={9}
    onChangeText={(text) =>
      setImmatriculation(formatPlate(text))
    }
  />

  {immatriculation !== "" && !validatePlate(immatriculation) && (
    <Text style={{ color: "#EF4444", fontSize: 12 }}>
       {t("invalidFormat")} : 1234 TAA
    </Text>
  )}
</View>
  </View>
</View>
</Card>
  {/* CARACTÉRISTIQUES */}
  <Card>
    <Text style={styles.sectionTitle}>{t("vehicleFeatures")}
</Text>

  <View style={styles.gridRow}>
    <View style={styles.gridItem}>
      <Stepper
        label={t("mileage")}
        value={kilometrage}
        setValue={setKilometrage}
        step={1000}
      />
    </View>

    <View style={styles.gridItem}>
      <Stepper
        label={t("power")}
        value={puissance}
        setValue={setPuissance}
        step={5}
      />
    </View>
  </View>

  <View style={styles.gridRow}>
    <View style={styles.gridItem}>
      <Stepper
        label={t("doors")}
        value={portes}
        setValue={setPortes}
      />
    </View>

    <View style={styles.gridItem}>
      <Stepper
        label={t("seats")}
        value={places}
        setValue={setPlaces}
      />
    </View>
  </View>
</Card>


          {/* TYPE & OPTIONS */}
          <Card>
             <Text style={styles.sectionTitle}>
                {t("typeAndEngine")}
             </Text>

            <PickerButton
              label={t("type")}
              value={typeVehicule}
              setValue={setTypeVehicule}
              options={["voiture", "suv", "van", "moto", "berline", "cabriolet", "coupe", "break", "minibus", "pick-up", "fourgon", "autre"]}
            />

            <PickerButton
              label={t("fuel")}
              value={carburant}
              setValue={setCarburant}
              options={[
                "essence",
                "diesel",
                "hybride",
                "electrique",
              ]}
            />

            <PickerButton
              label={t("transmission")}
              value={transmission}
              setValue={setTransmission}
              options={["automatique", "manuelle"]}
            />
          </Card>

          {/* DATES */}
          <Card>
            <Text style={styles.sectionTitle}>{t("dates")}</Text>

<View style={styles.gridRow}>
    <View style={styles.gridItem}>
        <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowDate1(true)}
            >
              <Text>
                {t("registrationDate")} :{" "}
                {dateMiseCirculation
                  .toISOString()
                  .split("T")[0]}
              </Text>
            </TouchableOpacity>
    </View>

    <View style={styles.gridItem}>
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => setShowDate2(true)}
            >
              <Text>
                {t("lastControlDate")} :{" "}
                {dateControle.toISOString().split("T")[0]}
              </Text>
            </TouchableOpacity>
           </View>
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>
              {t("status")}
            </Text>
            <PickerButton
               label={t("status")}
              value={status}
              setValue={setStatus}
              options={["disponible", "en location", "en maintenance"]}
            >
             
            </PickerButton>
          </Card>

        
           <Card>
            <TouchableOpacity
              style={styles.photoBox}
              onPress={pickImage}
            >
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                />
              ) : (
                <Text>{t("addPhoto")}</Text>
              )}
            </TouchableOpacity>
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
                {isEdit
                      ? t("updateVehicle")
                      : t("saveVehicle")}
              </Text>
            )}
          </TouchableOpacity>
     

        {showDate1 && (
          <DateTimePicker
            value={dateMiseCirculation}
            mode="date"
            display="default"
            onChange={(e, date) => {
              setShowDate1(false);
              if (date) setDateMiseCirculation(date);
            }}
          />
        )}

        {showDate2 && (
          <DateTimePicker
            value={dateControle}
            mode="date"
            display="default"
            onChange={(e, date) => {
              setShowDate2(false);
              if (date) setDateControle(date);
            }}
          />
        )}
      </ScrollView>
      </View>

      {showYearPicker && (
     <Modal transparent animationType="fade">
      <View style={styles.yearModalOverlay}>
       <View style={styles.yearModal}>
        <ScrollView>
          {Array.from(
            { length: 30 },
            (_, i) => currentYear - i
          ).map((year) => (
            <TouchableOpacity
              key={year}
              style={styles.yearItem}
              onPress={() => {
                setAnneeFabrication(String(year));
                setShowYearPicker(false);
              }}
            >
              <Text
                style={{
                  fontWeight:
                    anneeFabrication === String(year)
                      ? "700"
                      : "400",
                }}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
  )}

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

   photoBox: {
    height: 150,
    backgroundColor: "#E5E7EB",
    margin: 20,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },

  title: { fontSize: 18, fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 18,
    borderRadius: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },

  input: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },

  stepperRow: {
    marginBottom: 16,
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
  },

  gridRow: {
  flexDirection: "row",
  justifyContent: "space-between",
},

gridItem: {
  width: "48%",
},


  stepBtn: {
    backgroundColor: "#E5E7EB",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  stepText: { fontSize: 18, fontWeight: "600" },

  stepValue: {
    marginHorizontal: 18,
    fontSize: 16,
    fontWeight: "600",
  },

  pickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  pill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },

  pillActive: {
    backgroundColor: "#10B981",
  },

  pillText: { fontSize: 13 },

  pillTextActive: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },

  dateBtn: {
    backgroundColor: "#F9FAFB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },

  submit: {
    backgroundColor: "#10B981",
    margin: 20,
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  colorRow: {
  flexDirection: "row",
  flexWrap: "wrap",
},

colorCircle: {
  width: 14,
  height: 14,
  borderRadius: 20,
  marginRight: 12,
  marginBottom: 12,
  borderColor: "#10B981",
},

yearModalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
},

yearModal: {
  backgroundColor: "#fff",
  width: 200,
  maxHeight: 400,
  borderRadius: 20,
  padding: 20,
},

yearItem: {
  paddingVertical: 12,
  alignItems: "center",
},

});
