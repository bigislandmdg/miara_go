// LuggageScreen.tsx (Version avec menu select pour le nom du bagage)
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
  FlatList,
} from "react-native";
import { ArrowLeft, ChevronDown, Package, Check } from "lucide-react-native";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { Animated, Dimensions, TouchableWithoutFeedback } from "react-native";
import { useRef, useEffect } from "react";

interface Props {
  onBack: (luggage?: any) => void;
  token?: string;
  luggageToEdit?: any;
}

// Liste prédéfinie des types de bagages
const PREDEFINED_LUGGAGE_TYPES = [
  { id: "1", name: "Valise cabine", description: "Petite valise pour cabine d'avion" },
  { id: "2", name: "Valise moyenne", description: "Valise standard 50-70cm" },
  { id: "3", name: "Valise grande", description: "Grande valise pour longs séjours" },
  { id: "4", name: "Sac à dos", description: "Sac à dos de voyage" },
  { id: "5", name: "Sac de sport", description: "Sac de sport ou gym bag" },
  { id: "6", name: "Équipement sportif", description: "Skis, golf, vélo..." },
  { id: "7", name: "Carton", description: "Carton de déménagement" },
  { id: "8", name: "Autre", description: "Autre type de bagage" },
];

export function LuggageScreen({
  onBack,
  token,
  luggageToEdit,
}: Props) {
  const { t } = useTranslation();
  const isEdit = !!luggageToEdit;

  /* ================= STATES ================= */
  const [name, setName] = useState(luggageToEdit?.name || "");
  const [description, setDescription] = useState(luggageToEdit?.description || "");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customName, setCustomName] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

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
    if (!name && !customName) {
      Alert.alert(t("error"), t("fillRequiredFields"));
      return false;
    }
    return true;
  };

  /* ================= SELECT LUGGAGE TYPE ================= */
  const selectLuggageType = (luggage: typeof PREDEFINED_LUGGAGE_TYPES[0]) => {
    setName(luggage.name);
    if (!description && luggage.description) {
      setDescription(luggage.description);
    }
    setShowDropdown(false);
    setShowCustomInput(false);
    setCustomName("");
  };

  const selectCustomOption = () => {
    setShowCustomInput(true);
    setName("");
    setShowDropdown(false);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    const finalName = showCustomInput ? customName : name;
    
    if (!finalName?.trim()) {
      Alert.alert(t("error"), t("fillRequiredFields"));
      return;
    }

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
          name: finalName.trim(),
          description: description.trim(),
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
          data?.message || data?.messages?.error || "Erreur serveur"
        );
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

  const DropdownItem = ({ item, onPress, isSelected }: any) => (
    <TouchableOpacity
      style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dropdownItemContent}>
        <Text style={[styles.dropdownItemName, isSelected && styles.dropdownItemNameSelected]}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={styles.dropdownItemDesc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      {isSelected && <Check size={18} color="#059669" />}
    </TouchableOpacity>
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
                <TouchableOpacity onPress={() => onBack()} style={styles.backButton}>
                  <ArrowLeft size={22} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.title}>
                  {isEdit ? t("editLuggage") : t("newLuggage")}
                </Text>

                <View style={{ width: 32 }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                <Card>
                  <Text style={styles.sectionTitle}>
                    {t("generalInformation")}
                  </Text>

                  {/* SELECT DROPDOWN POUR LE TYPE DE BAGAGE */}
                  <Text style={styles.label}>
                    {t("luggageName")} <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowDropdown(!showDropdown)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownButtonText, !name && !customName && styles.placeholderText]}>
                      {showCustomInput && customName
                        ? customName
                        : name || t("selectLuggageType") || "Sélectionnez un type de bagage"}
                    </Text>
                    <ChevronDown size={20} color="#6B7280" />
                  </TouchableOpacity>

                  {/* DROPDOWN MENU */}
                  {showDropdown && (
                    <View style={styles.dropdownMenu}>
                      <FlatList
                        data={PREDEFINED_LUGGAGE_TYPES}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <DropdownItem
                            item={item}
                            isSelected={name === item.name && !showCustomInput}
                            onPress={() => selectLuggageType(item)}
                          />
                        )}
                        scrollEnabled={false}
                      />
                      <TouchableOpacity
                        style={[styles.dropdownItem, styles.customOption]}
                        onPress={selectCustomOption}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownItemContent}>
                          <Text style={styles.dropdownItemName}>
                            {t("customLuggage") || "➕ Autre (personnalisé)"}
                          </Text>
                          <Text style={styles.dropdownItemDesc}>
                            {t("customLuggageDesc") || "Saisir un type de bagage personnalisé"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* CHAMP PERSONNALISÉ */}
                  {showCustomInput && (
                    <View style={styles.customInputContainer}>
                      <Text style={styles.customLabel}>
                        {t("customLuggageName") || "Nom du bagage personnalisé"}
                      </Text>
                      <TextInput
                        placeholder={t("customLuggagePlaceholder") || "Ex: Instrument de musique, Matériel photo..."}
                        style={styles.input}
                        value={customName}
                        onChangeText={setCustomName}
                        autoFocus
                      />
                      {!showCustomInput && !name && (
                        <TouchableOpacity
                          style={styles.clearCustomButton}
                          onPress={() => {
                            setShowCustomInput(false);
                            setCustomName("");
                          }}
                        >
                          <Text style={styles.clearCustomText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* CHAMP DESCRIPTION */}
                  <Text style={styles.label}>
                    {t("description")}
                  </Text>
                  <TextInput
                    placeholder={t("descriptionPlaceholder") || "Dimensions, couleur, marque..."}
                    style={[
                      styles.input,
                      { height: 100, textAlignVertical: "top" },
                    ]}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                  />

                  {/* INFO TIP */}
                  <View style={styles.infoTip}>
                    <Package size={16} color="#059669" />
                    <Text style={styles.infoTipText}>
                      {t("luggageInfoTip") || "Choisissez le type de bagage qui correspond le mieux à votre équipement"}
                    </Text>
                  </View>
                </Card>

                <TouchableOpacity
                  style={styles.submit}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {isEdit ? t("updateLuggage") : t("saveLuggage")}
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
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
  },
  title: { 
    fontSize: 18, 
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111827",
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
    color: "#374151",
  },
  requiredStar: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 15,
    color: "#111827",
  },
  dropdownButton: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    marginTop: -12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#ECFDF5",
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  dropdownItemNameSelected: {
    color: "#059669",
  },
  dropdownItemDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  customOption: {
    borderBottomWidth: 0,
  },
  customInputContainer: {
    marginBottom: 16,
    position: "relative",
  },
  customLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  clearCustomButton: {
    position: "absolute",
    right: 12,
    top: 40,
  },
  clearCustomText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  infoTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTipText: {
    flex: 1,
    fontSize: 12,
    color: "#047857",
    lineHeight: 18,
  },
  submit: {
    backgroundColor: "#10B981",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    paddingBottom: 10,
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
