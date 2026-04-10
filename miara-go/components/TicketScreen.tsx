// TicketScreen.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Share,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";
import { 
  Ticket, 
  Receipt, 
  Calendar, 
  Clock, 
  Users, 
  Car, 
  Star, 
  QrCode,
  Share2,
  Download,
  X,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import type { Trip } from "./PassengerHome";

const { width } = Dimensions.get("window");

interface HistoryItem {
  id: string;
  status: "pending" | "completed";
  seats: number;
  totalPrice: number;
  meetingPoint?: string;
  vehicleModel?: string;
  trip: Trip;
  createdAt?: string;
}

interface TicketScreenProps {
  visible: boolean;
  item: HistoryItem | null;
  onClose: () => void;
  onShare?: (item: HistoryItem) => void;
  onDownload?: (item: HistoryItem) => void;
}

export default function TicketScreen({ 
  visible, 
  item, 
  onClose, 
  onShare, 
  onDownload 
}: TicketScreenProps) {
  const { t } = useTranslation();
  
  const ticketScale = useRef(new Animated.Value(0.9)).current;
  const ticketOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(ticketScale, { 
          toValue: 1, 
          friction: 8, 
          tension: 40, 
          useNativeDriver: true 
        }),
        Animated.timing(ticketOpacity, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        }),
      ]).start();
    } else {
      ticketScale.setValue(0.9);
      ticketOpacity.setValue(0);
    }
  }, [visible]);

  if (!item) return null;

  const generateTicketNumber = (id: string) => {
    const prefix = "MGR";
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const shortId = id.slice(-6);
    return `${prefix}-${year}${month}-${shortId}`;
  };

  const formatDateForTicket = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const ticketNumber = generateTicketNumber(item.id);

  const handleShare = async () => {
    const message = `🎫 ${t("ticketTitle") || "TICKET MIARAGO"}\n\n` +
      `📅 ${formatDateForTicket(item.trip.date)} ${t("at") || "à"} ${item.trip.time}\n` +
      `📍 ${item.trip.departure} → ${item.trip.arrival}\n` +
      `👤 ${t("driver") || "Conducteur"}: ${item.trip.driver?.name}\n` +
      `⭐ ${t("rating") || "Note"}: ${item.trip.driver?.rating.toFixed(1)}/5\n` +
      `💰 ${t("amount") || "Montant"}: ${item.totalPrice.toLocaleString()} Ar\n` +
      `🎟️ ${t("reference") || "Réf"}: ${ticketNumber}\n` +
      `🪑 ${t("seats") || "Places"}: ${item.seats}\n\n` +
      `${t("thanksTicket") || "Merci d'avoir voyagé avec MiaraGo !"}`;

    try {
      await Share.share({
        message,
        title: `${t("ticketTitle") || "Ticket MiaraGo"} - ${ticketNumber}`,
      });
    } catch (error) {
      console.log("Share error:", error);
      Alert.alert(t("error") || "Erreur", t("shareError") || "Impossible de partager le ticket");
    }
  };

  const handleDownload = async () => {
    const ticketText = `${t("ticketTitle") || "MIARAGO - TICKET DE TRANSPORT"}\n${"=".repeat(40)}\n\n` +
      `${t("bookingRef") || "N° de réservation"}: ${ticketNumber}\n` +
      `${t("date") || "Date"}: ${formatDateForTicket(item.trip.date)}\n` +
      `${t("time") || "Heure"}: ${item.trip.time}\n` +
      `${t("tripRoute") || "Trajet"}: ${item.trip.departure} → ${item.trip.arrival}\n` +
      `${t("driver") || "Conducteur"}: ${item.trip.driver?.name}\n` +
      `${t("rating") || "Note"}: ${item.trip.driver?.rating.toFixed(1)}/5\n` +
      `${t("seats") || "Places"}: ${item.seats}\n` +
      `${t("amount") || "Montant"}: ${item.totalPrice.toLocaleString()} Ar\n` +
      `${t("vehicle") || "Véhicule"}: ${item.vehicleModel}\n\n` +
      `${"=".repeat(40)}\n${t("thanksTicket") || "Merci d'avoir voyagé avec MiaraGo !"}\n` +
      `support@miarago.com | www.miarago.com`;

    try {
      await Share.share({
        message: ticketText,
        title: `${t("ticketTitle") || "Ticket MiaraGo"} - ${ticketNumber}`,
      });
      Alert.alert(t("success") || "Succès", t("shareSuccess") || "Ticket partagé avec succès !");
    } catch (error) {
      console.log("Download error:", error);
      Alert.alert(t("error") || "Erreur", t("shareError") || "Impossible de partager le ticket");
    }
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.spring(ticketScale, { 
        toValue: 0.9, 
        friction: 8, 
        tension: 40, 
        useNativeDriver: true 
      }),
      Animated.timing(ticketOpacity, { 
        toValue: 0, 
        duration: 200, 
        useNativeDriver: true 
      }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeModal} />
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ scale: ticketScale }],
              opacity: ticketOpacity,
            }
          ]}
        >
          <LinearGradient
            colors={["#059669", "#047857"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <Ticket size={28} color="#fff" />
              <Text style={styles.logoText}>MiaraGo</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t("ticketTitle") || "TICKET DE TRANSPORT"}</Text>
            </View>
          </LinearGradient>

          <View style={styles.perforation} />
          <View style={styles.perforationLine} />

          <View style={styles.body}>
            <View style={styles.numberRow}>
              <Receipt size={14} color="#6B7280" />
              <Text style={styles.numberLabel}>{t("bookingRef") || "N° de réservation"}</Text>
              <Text style={styles.numberValue}>{ticketNumber}</Text>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.route}>
              <View style={styles.routePoint}>
                <View style={styles.routeDotStart} />
                <Text style={styles.routeCity}>{item.trip.departure}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={styles.routeDotEnd} />
                <Text style={styles.routeCity}>{item.trip.arrival}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>{t("date")}</Text>
                <Text style={styles.infoValue}>{formatDateForTicket(item.trip.date)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>{t("time")}</Text>
                <Text style={styles.infoValue}>{item.trip.time}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Users size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>{t("seats")}</Text>
                <Text style={styles.infoValue}>{item.seats}</Text>
              </View>
              <View style={styles.infoItem}>
                <Car size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>{t("vehicle")}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{item.vehicleModel}</Text>
              </View>
            </View>

            <View style={styles.driver}>
              <Image 
                source={{ uri: item.trip.driver?.avatar || "https://via.placeholder.com/80" }} 
                style={styles.driverAvatar} 
              />
              <View>
                <Text style={styles.driverLabel}>{t("driver")}</Text>
                <Text style={styles.driverName}>{item.trip.driver?.name}</Text>
              </View>
              <View style={styles.driverRating}>
                <Star size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.driverRatingText}>{item.trip.driver?.rating.toFixed(1)}</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>{t("total")}</Text>
              <Text style={styles.priceValue}>{item.totalPrice.toLocaleString()} Ar</Text>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrBorder}>
                <QRCode 
                  value={JSON.stringify({ 
                    id: item.id, 
                    ticketNumber,
                    departure: item.trip.departure, 
                    arrival: item.trip.arrival,
                    date: item.trip.date,
                    seats: item.seats
                  })} 
                  size={80} 
                />
              </View>
              <View style={styles.qrText}>
                <QrCode size={12} color="#6B7280" />
                <Text style={styles.qrLabel}>{t("qrLabel") || "Présentez ce QR code au conducteur"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("thanksTicket") || "Merci de voyager avec MiaraGo"}</Text>
            <Text style={styles.footerSubtext}>support@miarago.com | www.miarago.com</Text>
          </View>

          <View style={styles.cutLine} />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Share2 size={18} color="#059669" />
              <Text style={styles.actionText}>{t("share") || "Partager"}</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
              <Download size={18} color="#059669" />
              <Text style={styles.actionText}>{t("download") || "Télécharger"}</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionButton} onPress={closeModal}>
              <X size={18} color="#059669" />
              <Text style={styles.actionText}>{t("close") || "Fermer"}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.6)" 
  },
  backdrop: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0 
  },
  container: { 
    width: width - 32, 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    overflow: "hidden", 
    shadowColor: "#000", 
    shadowOpacity: 0.25, 
    shadowRadius: 24, 
    shadowOffset: { width: 0, height: 8 }, 
    elevation: 16 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  logoContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  logoText: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#fff" 
  },
  badge: { 
    backgroundColor: "rgba(255,255,255,0.2)", 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 20 
  },
  badgeText: { 
    fontSize: 10, 
    fontWeight: "600", 
    color: "#fff", 
    letterSpacing: 0.5 
  },
  perforation: { 
    position: "absolute", 
    top: 68, 
    left: 0, 
    right: 0, 
    height: 20, 
    overflow: "hidden" 
  },
  perforationLine: { 
    position: "absolute", 
    top: 78, 
    left: 0, 
    right: 0, 
    height: 1, 
    backgroundColor: "#E5E7EB", 
    borderStyle: "dashed" 
  },
  cutLine: { 
    height: 1, 
    backgroundColor: "#E5E7EB", 
    marginVertical: 0 
  },
  body: { 
    padding: 20 
  },
  numberRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginBottom: 16 
  },
  numberLabel: { 
    fontSize: 12, 
    color: "#6B7280", 
    flex: 1 
  },
  numberValue: { 
    fontSize: 14, 
    fontWeight: "700", 
    color: "#059669", 
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" 
  },
  divider: { 
    height: 1, 
    backgroundColor: "#F3F4F6", 
    marginVertical: 16 
  },
  route: { 
    marginBottom: 20 
  },
  routePoint: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    marginVertical: 6 
  },
  routeDotStart: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: "#10B981" 
  },
  routeDotEnd: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: "#EF4444" 
  },
  routeLine: { 
    width: 2, 
    height: 20, 
    backgroundColor: "#E5E7EB", 
    marginLeft: 4, 
    marginVertical: 2 
  },
  routeCity: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#111827" 
  },
  infoGrid: { 
    flexDirection: "row", 
    gap: 16, 
    marginBottom: 16 
  },
  infoRow: { 
    flexDirection: "row", 
    gap: 16, 
    marginBottom: 16 
  },
  infoItem: { 
    flex: 1, 
    backgroundColor: "#F9FAFB", 
    padding: 12, 
    borderRadius: 12, 
    alignItems: "center", 
    gap: 6 
  },
  infoLabel: { 
    fontSize: 10, 
    color: "#6B7280", 
    textTransform: "uppercase", 
    letterSpacing: 0.5 
  },
  infoValue: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#111827", 
    textAlign: "center" 
  },
  driver: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#F9FAFB", 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 16, 
    gap: 12 
  },
  driverAvatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22 
  },
  driverLabel: { 
    fontSize: 10, 
    color: "#6B7280" 
  },
  driverName: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#111827" 
  },
  driverRating: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    marginLeft: "auto" 
  },
  driverRatingText: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: "#F59E0B" 
  },
  priceContainer: { 
    backgroundColor: "#ECFDF5", 
    padding: 16, 
    borderRadius: 12, 
    alignItems: "center", 
    marginBottom: 16 
  },
  priceLabel: { 
    fontSize: 12, 
    color: "#059669", 
    marginBottom: 4 
  },
  priceValue: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#047857" 
  },
  qrContainer: { 
    alignItems: "center", 
    gap: 8 
  },
  qrBorder: { 
    padding: 8, 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    shadowColor: "#000", 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  qrText: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6 
  },
  qrLabel: { 
    fontSize: 10, 
    color: "#6B7280" 
  },
  footer: { 
    backgroundColor: "#F9FAFB", 
    padding: 16, 
    alignItems: "center", 
    borderTopWidth: 1, 
    borderTopColor: "#F3F4F6" 
  },
  footerText: { 
    fontSize: 12, 
    fontWeight: "500", 
    color: "#059669", 
    marginBottom: 4 
  },
  footerSubtext: { 
    fontSize: 10, 
    color: "#6B7280" 
  },
  actions: { 
    flexDirection: "row", 
    padding: 16, 
    gap: 16, 
    borderTopWidth: 1, 
    borderTopColor: "#F3F4F6" 
  },
  actionButton: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8, 
    paddingVertical: 10, 
    borderRadius: 30, 
    backgroundColor: "#F3F4F6" 
  },
  actionText: { 
    fontSize: 14, 
    fontWeight: "500", 
    color: "#059669" 
  },
  actionDivider: { 
    width: 1, 
    backgroundColor: "#E5E7EB" 
  },
});