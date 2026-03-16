import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import Toast from "react-native-toast-message";

interface Offer {
  id: string;
  driver: {
    name: string;
    rating: number;
    avatar: string;
    totalTrips: number;
  };
  pricePerSeat: number;
  seatsOffered: number;
  message: string;
  carInfo: string;
  timestamp: string;
}

interface OffersReceivedScreenProps {
  onBack: () => void;
  requestDetails: {
    departure: string;
    arrival: string;
    date: string;
    seatsNeeded: number;
  };
}

const mockOffers: Offer[] = [
  {
    id: "1",
    driver: {
      name: "Rabe Andry",
      rating: 4.8,
      avatar:
        "https://images.unsplash.com/photo-1565758695116-214f702fc7f2?w=800",
      totalTrips: 47,
    },
    pricePerSeat: 42000,
    seatsOffered: 2,
    message:
      "Bonjour ! Je peux vous emmener, véhicule climatisé et confortable. Départ vers 7h du matin.",
    carInfo: "Toyota Corolla 2020",
    timestamp: "Il y a 1 heure",
  },
  {
    id: "2",
    driver: {
      name: "Hery Rakoto",
      rating: 4.9,
      avatar:
        "https://images.unsplash.com/photo-1565758695116-214f702fc7f2?w=800",
      totalTrips: 89,
    },
    pricePerSeat: 45000,
    seatsOffered: 2,
    message:
      "Départ prévu à 6h. Trajet direct sans arrêts inutiles. Très ponctuel.",
    carInfo: "Honda Civic 2019",
    timestamp: "Il y a 3 heures",
  },
  {
    id: "3",
    driver: {
      name: "Fidy Andriana",
      rating: 4.7,
      avatar:
        "https://images.unsplash.com/photo-1565758695116-214f702fc7f2?w=800",
      totalTrips: 32,
    },
    pricePerSeat: 40000,
    seatsOffered: 3,
    message:
      "Je peux prendre jusqu'à 3 personnes. Départ flexible entre 6h et 8h.",
    carInfo: "4x4 Nissan",
    timestamp: "Il y a 5 heures",
  },
];

export function OffersReceivedScreen({
  onBack,
  requestDetails,
}: OffersReceivedScreenProps) {
  const handleAccept = (driverName: string) => {
    Toast.show({
      type: "success",
      text1: `Offre acceptée`,
      text2: `Vous serez redirigé vers le paiement.`,
    });
  };

  const handleReject = (driverName: string) => {
    Toast.show({
      type: "info",
      text1: `Offre refusée`,
      text2: `${driverName} a été notifié.`,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offres reçues</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Demande */}
        <View style={styles.requestCard}>
          <Text style={styles.requestTitle}>Votre demande</Text>

          <View style={styles.requestRow}>
            <Icon name="map-pin" size={16} color="green" />
            <Text style={styles.requestText}>{requestDetails.departure}</Text>
            <Text style={styles.requestArrow}>→</Text>
            <Icon name="map-pin" size={16} color="red" />
            <Text style={styles.requestText}>{requestDetails.arrival}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="calendar" size={16} color="blue" />
              <Text style={styles.infoText}>
                {new Date(requestDetails.date).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="users" size={16} color="purple" />
              <Text style={styles.infoText}>
                {requestDetails.seatsNeeded} place
                {requestDetails.seatsNeeded > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Nombre d'offres */}
        <Text style={styles.offerCount}>
          {mockOffers.length} conducteur{mockOffers.length > 1 ? "s" : ""} intéressé
          {mockOffers.length > 1 ? "s" : ""}
        </Text>

        {/* Liste des offres */}
        {mockOffers.map((offer) => (
          <View key={offer.id} style={styles.offerCard}>
            {/* Driver */}
            <View style={styles.driverRow}>
              <View style={styles.driverInfo}>
                <Image
                  source={{ uri: offer.driver.avatar }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={styles.driverName}>{offer.driver.name}</Text>
                  <View style={styles.driverStats}>
                    <View style={styles.ratingRow}>
                      <Icon name="star" size={16} color="#facc15" />
                      <Text style={styles.ratingText}>{offer.driver.rating}</Text>
                    </View>
                    <Text style={styles.totalTrips}>{offer.driver.totalTrips} trajets</Text>
                  </View>
                </View>
              </View>

              <View style={styles.priceInfo}>
                <Text style={styles.priceText}>
                  {offer.pricePerSeat.toLocaleString()} Ar
                </Text>
                <Text style={styles.priceSubtitle}>par siège</Text>
              </View>
            </View>

            {/* Offre */}
            <View style={styles.offerDetails}>
              <View style={styles.seatsRow}>
                <View style={styles.seatsInfo}>
                  <Icon name="users" size={16} color="purple" />
                  <Text style={styles.seatsText}>
                    {offer.seatsOffered} place{offer.seatsOffered > 1 ? "s" : ""} proposées
                  </Text>
                </View>
                {offer.seatsOffered >= requestDetails.seatsNeeded && (
                  <View style={styles.sufficientBadge}>
                    <Text style={styles.sufficientText}>Suffisant</Text>
                  </View>
                )}
              </View>
              {offer.carInfo && (
                <Text style={styles.carInfo}>🚗 {offer.carInfo}</Text>
              )}
            </View>

            {/* Message */}
            {offer.message && (
              <View style={styles.messageBox}>
                <View style={styles.messageRow}>
                  <Icon name="message-circle" size={16} color="blue" />
                  <Text style={styles.messageText}>{offer.message}</Text>
                </View>
              </View>
            )}

            <Text style={styles.timestamp}>Offre reçue {offer.timestamp}</Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject(offer.driver.name)}
              >
                <Icon name="x" size={18} color="red" style={{ marginRight: 6 }} />
                <Text style={styles.rejectText}>Refuser</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAccept(offer.driver.name)}
              >
                <Icon name="check" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.acceptText}>Accepter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 <Text style={{ fontWeight: "600" }}>Conseil :</Text> Comparez les
            offres et contactez les conducteurs avant d’accepter.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: "#e5e7eb", backgroundColor: "white" },
  backText: { color: "#2563eb", fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 12 },
  scrollContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  requestCard: { backgroundColor: "#eff6ff", borderRadius: 12, borderWidth: 1, borderColor: "#bfdbfe", padding: 12, marginBottom: 16 },
  requestTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  requestRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  requestText: { fontSize: 14 },
  requestArrow: { marginHorizontal: 4, fontSize: 14, color: "#6b7280" },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  infoText: { fontSize: 14 },
  offerCount: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  offerCard: { backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  driverRow: { flexDirection: "row", justifyContent: "space-between" },
  driverInfo: { flexDirection: "row" },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  driverName: { fontSize: 16, fontWeight: "500" },
  driverStats: { flexDirection: "row", marginTop: 4, alignItems: "center" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  ratingText: { fontSize: 14, marginLeft: 4 },
  totalTrips: { fontSize: 12, color: "#374151" },
  priceInfo: { alignItems: "flex-end" },
  priceText: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  priceSubtitle: { fontSize: 12, color: "#6b7280" },
  offerDetails: { backgroundColor: "#f3f4f6", borderRadius: 12, padding: 8, marginTop: 12 },
  seatsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  seatsInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  seatsText: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  sufficientBadge: { backgroundColor: "#d1fae5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  sufficientText: { fontSize: 10, color: "#059669", fontWeight: "600" },
  carInfo: { fontSize: 14, color: "#374151" },
  messageBox: { backgroundColor: "white", borderRadius: 12, padding: 8, marginTop: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  messageRow: { flexDirection: "row", alignItems: "center" },
  messageText: { fontSize: 14, marginLeft: 4, color: "#111827" },
  timestamp: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  actionsRow: { flexDirection: "row", marginTop: 12, gap: 8 },
  rejectButton: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 10, borderRadius: 12, borderWidth: 1, borderColor: "#fca5a5" },
  rejectText: { color: "red", fontWeight: "500" },
  acceptButton: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", padding: 10, borderRadius: 12, backgroundColor: "#10b981" },
  acceptText: { color: "white", fontWeight: "500" },
  footer: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#93c5fd", borderRadius: 12, padding: 12, marginTop: 16 },
  footerText: { fontSize: 14, color: "#374151" },
});
