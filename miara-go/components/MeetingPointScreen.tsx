import React, { useState } from "react";
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
} from "react-native";

import { ArrowLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";

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
  selectedPoints?: MeetingPoint[]; // 🔹 AJOUT
}

export function MeetingPointScreen({
  onBack,
  token,
  meetingPointToEdit,
  selectedPoints = [], // 🔹 valeur par défaut
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

  /* ================= VALIDATION ================= */
  const validate = () => {
    if (!name || !city || !address) {
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

      const baseURL =
        Platform.OS === "android"
          ? "http://10.0.2.2:8080"
          : "http://localhost:8080";

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
          city,
          address,
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

      Alert.alert(
        t("success"),
        isEdit ? t("meetingPointUpdated") : t("meetingPointSaved")
      );

      // 🔹 renvoyer les points sélectionnés ou le nouveau
      onBack([...selectedPoints, data]);

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
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
          <Card>
            <Text style={styles.sectionTitle}>{t("meetingPointInformation")}</Text>

            <TextInput placeholder={t("name")} style={styles.input} value={name} onChangeText={setName} />
            <TextInput placeholder={t("city")} style={styles.input} value={city} onChangeText={setCity} />
            <TextInput placeholder={t("address")} style={styles.input} value={address} onChangeText={setAddress} />
            <TextInput placeholder={t("latitude")} style={styles.input} keyboardType="numeric" value={latitude} onChangeText={setLatitude} />
            <TextInput placeholder={t("longitude")} style={styles.input} keyboardType="numeric" value={longitude} onChangeText={setLongitude} />
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

          <TouchableOpacity style={styles.submit} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{isEdit ? t("updateMeetingPoint") : t("saveMeetingPoint")}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  title: { fontSize: 18, fontWeight: "600" },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 20, padding: 18, borderRadius: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 14 },
  input: { backgroundColor: "#F9FAFB", padding: 14, borderRadius: 14, marginBottom: 12 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: "500" },
  pickerRow: { flexDirection: "row", flexWrap: "wrap" },
  pill: { backgroundColor: "#F3F4F6", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  pillActive: { backgroundColor: "#10B981" },
  pillText: { fontSize: 13 },
  pillTextActive: { fontSize: 13, color: "#fff", fontWeight: "600" },
  submit: { backgroundColor: "#10B981", margin: 20, padding: 18, borderRadius: 30, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});