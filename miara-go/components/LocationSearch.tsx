import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";

const popularCities = [
  "Antananarivo",
  "Toamasina",
  "Antsirabe",
  "Fianarantsoa",
  "Mahajanga",
  "Toliara",
  "Antsiranana",
  "Moramanga",
  "Manjakandriana",
  "Ambatondrazaka",
  "Nosy-Be",
];

// Clé de stockage pour l’historique
const HISTORY_KEY = "search_history";

export default function LocationSearch({
  searchText,
  setSearchText,
  onSelect,
}: {
  searchText: string;
  setSearchText: (txt: string) => void;
  onSelect: (city: string) => void;
}) {
  const [history, setHistory] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  // Charger l’historique
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    })();
  }, []);

  // Filtrer les villes selon la saisie
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredCities([]);
      return;
    }

    const lower = searchText.toLowerCase();
    const result = popularCities.filter((city) =>
      city.toLowerCase().includes(lower)
    );

    setFilteredCities(result);
  }, [searchText]);

  // Ajouter à l’historique
  const addToHistory = async (city: string) => {
    const updated = [city, ...history.filter((c) => c !== city)].slice(0, 10);
    setHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const removeHistoryItem = async (city: string) => {
    const updated = history.filter((c) => c !== city);
    setHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  const handleSelect = (city: string) => {
    addToHistory(city);
    onSelect(city);
  };

  return (
    <View style={{ padding: 16 }}>

      {/* Champ de saisie */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderRadius: 10,
          paddingHorizontal: 12,
          marginBottom: 16,
        }}
      >
        <Feather name="search" size={18} color="#10B981" />
        <TextInput
          style={{ flex: 1, marginLeft: 8, fontSize: 16 }}
          placeholder="Rechercher une ville..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView>
        {/* 🔥 Auto-complétion */}
        {filteredCities.length > 0 && (
          <>
            <Text style={{ fontSize: 14, marginBottom: 8, color: "#6B7280" }}>
              Résultats
            </Text>

            {filteredCities.map((city) => (
              <TouchableOpacity
                key={city}
                onPress={() => handleSelect(city)}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Text style={{ fontSize: 16 }}>{city}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 12 }} />
          </>
        )}

        {/* 🕘 Historique */}
        {history.length > 0 && (
          <>
            <Text style={{ fontSize: 14, marginBottom: 8, color: "#6B7280" }}>
              Historique
            </Text>

            {history.map((city) => (
              <View
                key={city}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleSelect(city)}
                >
                  <Text style={{ fontSize: 16 }}>{city}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => removeHistoryItem(city)}>
                  <Feather name="x" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={{ height: 12 }} />
          </>
        )}

        {/* ⭐ Populaires */}
        <Text style={{ fontSize: 14, marginBottom: 8, color: "#6B7280" }}>
          Villes populaires
        </Text>

        {popularCities.map((city) => (
          <TouchableOpacity
            key={city}
            onPress={() => handleSelect(city)}
            style={{
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text style={{ fontSize: 16 }}>{city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
