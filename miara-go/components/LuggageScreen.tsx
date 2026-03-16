// LuggageScreen.tsx

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
  ActivityIndicator,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { Animated, Dimensions, TouchableWithoutFeedback } from "react-native";
import { useRef, useEffect } from "react";

interface Props {
  onBack: (luggage?: any) => void;
  token?: string;
  luggageToEdit?: any;
}

export function LuggageScreen({
  onBack,
  token,
  luggageToEdit,
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!luggageToEdit;

  /* ================= STATES ================= */

  const [name, setName] = useState(
    luggageToEdit?.name || ""
  );
  const [description, setDescription] = useState(
    luggageToEdit?.description || ""
  );
  const [loading, setLoading] = useState(false);


  /* ================= ANIMATION ================= */

const screenHeight = Dimensions.get("window").height;
const slideAnim = useRef(new Animated.Value(screenHeight)).current;

useEffect(() => {
  Animated.timing(slideAnim, {
    toValue: 0,
    duration: 280,
    useNativeDriver: true,
  }).start();
}, []);

  /* ================= VALIDATION ================= */

  const validate = () => {
    if (!name) {
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
      ? `${baseURL}/luggages/${luggageToEdit.id}`
      : `${baseURL}/luggages`;

    const response = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        description,
      }),
    });

    console.log("STATUS:", response.status);

    const text = await response.text();
    console.log("RAW RESPONSE:", text);

    let data: any = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      console.log("⚠️ JSON parse failed");
      throw new Error("Réponse serveur invalide");
    }

    if (!response.ok) {
    throw new Error(
       data?.message ||
       data?.messages?.error ||
        "Erreur serveur"
    );
   }

  
    if (!response.ok) {
      throw new Error(data.message || "Erreur serveur");
    }

    Alert.alert(
      t("success"),
      isEdit ? t("luggageUpdated") : t("luggageSaved")
    );

    onBack(data.luggage || data);

  } catch (error: any) {
    console.log("LUGGAGE CREATE ERROR:", error);
    Alert.alert(t("error"), error.message);
  } finally {
    setLoading(false);
  }
};



  /* ================= UI COMPONENTS ================= */

  const Card = ({ children }: any) => (
    <View style={styles.card}>{children}</View>
  );

  /* ================= UI ================= */

  return (
   <Modal transparent visible animationType="none">
  <TouchableWithoutFeedback onPress={() => onBack()}>
    <View style={styles.overlay}>
      <TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />

          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => onBack()}>
              <ArrowLeft size={22} />
            </TouchableOpacity>

            <Text style={styles.title}>
              {isEdit ? t("editLuggage") : t("newLuggage")}
            </Text>

            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Card>
              <Text style={styles.sectionTitle}>
                {t("generalInformation")}
              </Text>

              <Text style={styles.label}>
                {t("luggageName")}
              </Text>

              <TextInput
                placeholder={t("luggageName")}
                style={styles.input}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>
                {t("description")}
              </Text>

              <TextInput
                placeholder={t("description")}
                style={[
                  styles.input,
                  { height: 100, textAlignVertical: "top" },
                ]}
                multiline
                value={description}
                onChangeText={setDescription}
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
                  {isEdit
                    ? t("updateLuggage")
                    : t("saveLuggage")}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },

  input: {
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

  overlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "flex-end",
},

sheet: {
  backgroundColor: "#F9FAFB",
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingBottom: 30,
  maxHeight: "90%",
},

handle: {
  width: 40,
  height: 5,
  backgroundColor: "#D1D5DB",
  borderRadius: 4,
  alignSelf: "center",
  marginVertical: 10,
},
});
