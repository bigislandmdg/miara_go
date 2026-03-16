import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const mockReviews = [
  {
    id: "1",
    rating: 5,
    comment: "Excellent conducteur, très ponctuel !",
    passenger: "Marie Razafy",
    date: "2025-11-03",
  },
  {
    id: "2",
    rating: 4,
    comment: "Bon trajet, véhicule confortable.",
    passenger: "Jean Rakoto",
    date: "2025-11-01",
  },
];

export function ReviewsHistoryScreen({
  onBack,
  userType,
}: {
  onBack: () => void;
  userType: "passenger" | "driver";
}) {
  const avgRating = 4.8;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Mes Évaluations</Text>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.ratingCircle}>
            <Text style={styles.avgRating}>{avgRating}</Text>
            <Feather name="star" size={24} color="#fbbf24" />
          </View>
          <Text style={styles.reviewCount}>{mockReviews.length} avis</Text>
        </View>

        {/* Reviews list */}
        <FlatList
          data={mockReviews}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.passengerName}>{item.passenger}</Text>

                {/* Stars */}
                <View style={styles.starRow}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Feather
                      key={i}
                      name="star"
                      size={14}
                      color="#fbbf24"
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.comment}>{item.comment}</Text>

              <Text style={styles.reviewDate}>
                {new Date(item.date).toLocaleDateString("fr-FR")}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  header: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },

  content: {
    padding: 16,
  },

  summaryCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  ratingCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avgRating: {
    fontSize: 28,
    fontWeight: "600",
    color: "#78350f",
  },

  reviewCount: {
    fontSize: 13,
    color: "#6B7280",
  },

  reviewCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },

  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  passengerName: {
    fontSize: 14,
    color: "#374151",
  },

  starRow: {
    flexDirection: "row",
    gap: 2,
  },

  comment: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 6,
  },

  reviewDate: {
    fontSize: 11,
    color: "#9CA3AF",
  },
});
