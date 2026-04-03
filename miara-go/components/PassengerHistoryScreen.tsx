// PassengerHistoryScreen.tsx - Version avec traductions complètes
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
  Modal,
  Share,
  Alert,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Star, 
  CheckCircle, 
  Clock as ClockIcon,
  Share2,
  Ticket,
  Receipt,
  QrCode,
  Download,
  X,
  Users,
} from "lucide-react-native";

import type { Trip } from "./PassengerHome";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import QRCode from "react-native-qrcode-svg";

type PassengerHistoryProps = {
  onBack: () => void;
  onBookingPress: (trip: Trip, bookingId: string) => void;
};

interface Booking {
  id: string;
  ride_id: string;
  offer_id: string | null;
  seats_reserved: string;
  total_price: string;
  status: string;
  created_at: string;
}

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

const ITEMS_PER_PAGE = 4;

export default function PassengerHistoryScreen({
  onBack,
  onBookingPress,
}: PassengerHistoryProps) {

  const { t } = useTranslation();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // États pour le modal ticket
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicketItem, setSelectedTicketItem] = useState<HistoryItem | null>(null);
  
  // Animations principales
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const ticketScale = useRef(new Animated.Value(0.9)).current;
  const ticketOpacity = useRef(new Animated.Value(0)).current;
  
  // Stockage des animations pour les items
  const itemAnimationsRef = useRef<{ fade: Animated.Value; slide: Animated.Value; started: boolean }[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  /* ================= FETCH WITH ERROR HANDLING ================= */
  const safeFetchJson = async (url: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const text = await response.text();
      if (!text || text.trim() === "") return null;
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.log(`JSON parse error for ${url}:`, parseError);
        return null;
      }
    } catch (networkError) {
      console.log(`Network error for ${url}:`, networkError);
      return null;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ridesData, bookingsData] = await Promise.all([
        safeFetchJson("http://10.0.2.2:8080/rides"),
        safeFetchJson("http://10.0.2.2:8080/bookings"),
      ]);

      const ridesArray = ridesData?.rides ?? [];
      const bookingsArray = bookingsData?.bookings ?? [];

      const mappedTrips: Trip[] = ridesArray.map((r: any) => ({
        id: String(r.id),
        departure: r.departure ?? "",
        arrival: r.arrival ?? "",
        date: r.date ?? "",
        time: r.time ?? "",
        price: Number(r.price ?? 0),
        meetingPoints: r.meetingPoint ? [r.meetingPoint.name] : [],
        driver: {
          name: r.driver?.name ?? "Driver",
          rating: Number(r.driver?.rating ?? 4.7),
          avatar: r.driver?.avatar ?? "https://via.placeholder.com/80",
          phone: r.driver?.phone ?? null,
        },
        vehicle: {
          model: `${r.vehicle?.marque ?? ""} ${r.vehicle?.model ?? ""}`.trim() || "Véhicule",
          plate: r.vehicle?.plate ?? "",
          totalSeats: Number(r.vehicle?.totalSeats ?? 4),
          availableSeats: Number(r.availableSeats ?? 0),
        },
      }));

      setTrips(mappedTrips);
      setBookings(bookingsArray);
      setPage(1);
      setHasMore(true);
    } catch (e) {
      console.log("History fetch error:", e);
      setError(t("fetchError") || "Impossible de charger l'historique. Vérifiez votre connexion.");
      setTrips([]);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  /* ================= MERGE BOOKINGS + RIDES ================= */
  const historyData: HistoryItem[] = useMemo(() => {
    return bookings
      .map((b) => {
        const trip = trips.find((t) => t.id === String(b.ride_id));
        if (!trip) return null;
        return {
          id: b.id,
          status: b.status === "pending" ? "pending" : "completed",
          seats: Number(b.seats_reserved),
          totalPrice: Number(b.total_price),
          meetingPoint: trip.meetingPoints?.[0] ?? "",
          vehicleModel: trip.vehicle?.model ?? "",
          trip,
          createdAt: b.created_at,
        };
      })
      .filter(Boolean) as HistoryItem[];
  }, [bookings, trips]);

  const filteredData = historyData.filter((h) => h.status === activeTab);
  const paginatedData = filteredData.slice(0, page * ITEMS_PER_PAGE);

  // Effet pour initialiser les animations des items
  useEffect(() => {
    if (paginatedData.length > 0) {
      while (itemAnimationsRef.current.length < paginatedData.length) {
        itemAnimationsRef.current.push({
          fade: new Animated.Value(0),
          slide: new Animated.Value(30),
          started: false,
        });
      }
      
      paginatedData.forEach((_, index) => {
        const anim = itemAnimationsRef.current[index];
        if (anim && !anim.started) {
          anim.started = true;
          Animated.parallel([
            Animated.timing(anim.fade, {
              toValue: 1,
              duration: 400,
              delay: index * 80,
              useNativeDriver: true,
            }),
            Animated.timing(anim.slide, {
              toValue: 0,
              duration: 400,
              delay: index * 80,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    }
  }, [paginatedData]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    if (page * ITEMS_PER_PAGE >= filteredData.length) {
      setHasMore(false);
      return;
    }
    setLoadingMore(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
    }, 300);
  };

  /* ================= TICKET FUNCTIONS ================= */
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

  const openTicketModal = (item: HistoryItem) => {
    setSelectedTicketItem(item);
    setShowTicketModal(true);
    Animated.parallel([
      Animated.spring(ticketScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(ticketOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeTicketModal = () => {
    Animated.parallel([
      Animated.spring(ticketScale, { toValue: 0.9, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(ticketOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowTicketModal(false);
      setSelectedTicketItem(null);
    });
  };

  const shareTicket = async (item: HistoryItem) => {
    const ticketNumber = generateTicketNumber(item.id);
    try {
      await Share.share({
        message: `🎫 ${t("ticketTitle") || "TICKET MIARAGO"}\n\n` +
          `📅 ${formatDateForTicket(item.trip.date)} ${t("at") || "à"} ${item.trip.time}\n` +
          `📍 ${item.trip.departure} → ${item.trip.arrival}\n` +
          `👤 ${t("driver") || "Conducteur"}: ${item.trip.driver?.name}\n` +
          `⭐ ${t("rating") || "Note"}: ${item.trip.driver?.rating.toFixed(1)}/5\n` +
          `💰 ${t("amount") || "Montant"}: ${item.totalPrice.toLocaleString()} Ar\n` +
          `🎟️ ${t("reference") || "Réf"}: ${ticketNumber}\n` +
          `🪑 ${t("seats") || "Places"}: ${item.seats}\n\n` +
          `${t("thanksTicket") || "Merci d'avoir voyagé avec MiaraGo !"}`,
        title: `${t("ticketTitle") || "Ticket MiaraGo"} - ${ticketNumber}`,
      });
    } catch (error) {
      console.log("Share error:", error);
      Alert.alert(t("error") || "Erreur", t("shareError") || "Impossible de partager le ticket");
    }
  };

  const downloadTicket = async (item: HistoryItem) => {
    const ticketNumber = generateTicketNumber(item.id);
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

  const shareReceipt = async (item: HistoryItem) => {
    try {
      await Share.share({
        message: `🚗 ${t("tripRoute") || "Trajet"} ${item.trip.departure} → ${item.trip.arrival}\n` +
          `📅 ${t("date") || "Date"}: ${item.trip.date} ${t("at") || "à"} ${item.trip.time}\n` +
          `💰 ${t("amount") || "Montant"}: ${item.totalPrice.toLocaleString()} Ar\n` +
          `👤 ${t("driver") || "Conducteur"}: ${item.trip.driver?.name}\n` +
          `⭐ ${t("rating") || "Note"}: ${item.trip.driver?.rating.toFixed(1)}/5\n` +
          `✅ ${t("bookingRef") || "Réservation"} #${item.id}`,
        title: `${t("receiptTitle") || "Reçu de réservation"} - MiaraGo`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  /* ================= SKELETON ================= */
  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonLarge} />
          <View style={styles.skeletonMedium} />
        </View>
      </View>
      <View style={styles.skeletonDivider} />
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonIconSmall} />
        <View style={styles.skeletonSmall} />
      </View>
      <View style={styles.skeletonFooter} />
    </View>
  );

  /* ================= RENDER ITEM ================= */
  const renderItem = ({ item, index }: { item: HistoryItem; index: number }) => {
    const anim = itemAnimationsRef.current[index] || { fade: new Animated.Value(1), slide: new Animated.Value(0), started: true };
    
    return (
      <Animated.View
        style={[
          styles.card,
          {
            opacity: anim.fade,
            transform: [{ translateY: anim.slide }],
          },
        ]}
      >
        <TouchableOpacity activeOpacity={0.95}>
          <View style={styles.cardHeader}>
            <View style={styles.routeContainer}>
              <View style={styles.routePoint}>
                <View style={styles.routeDotStart} />
                <Text style={styles.routeText} numberOfLines={1}>{item.trip.departure}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={styles.routeDotEnd} />
                <Text style={styles.routeText} numberOfLines={1}>{item.trip.arrival}</Text>
              </View>
            </View>
            
            <View style={[
              styles.statusBadge,
              item.status === "pending" ? styles.statusPendingBadge : styles.statusCompletedBadge
            ]}>
              {item.status === "pending" ? (
                <ClockIcon size={12} color="#B45309" />
              ) : (
                <CheckCircle size={12} color="#047857" />
              )}
              <Text style={[
                styles.statusBadgeText,
                item.status === "pending" ? styles.statusPendingText : styles.statusCompletedText
              ]}>
                {item.status === "pending" ? t("pending") : t("completed")}
              </Text>
            </View>
          </View>

          <View style={styles.tripDetails}>
            <View style={styles.detailRow}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.trip.date}</Text>
              <View style={styles.dotSeparator} />
              <Clock size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.trip.time}</Text>
            </View>

            <View style={styles.detailRow}>
              <Car size={14} color="#6B7280" />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.vehicleModel || t("vehicle")}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>{t("total")}</Text>
              <Text style={styles.priceValue}>{item.totalPrice.toLocaleString()} Ar</Text>
              <Text style={styles.seatsInfo}>{item.seats} {t("seats")}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.detailsButton} onPress={() => onBookingPress(item.trip, item.id)}>
                <Text style={styles.detailsButtonText}>{t("seeDetails")}</Text>
                <ChevronRight size={14} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.ticketButton} onPress={() => openTicketModal(item)}>
                <Ticket size={16} color="#059669" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.shareButton} onPress={() => shareReceipt(item)}>
                <Share2 size={16} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  /* ================= TICKET MODAL ================= */
  const TicketModalComponent = () => {
    if (!selectedTicketItem) return null;
    
    const ticketNumber = generateTicketNumber(selectedTicketItem.id);
    
    return (
      <Modal visible={showTicketModal} transparent animationType="none">
        <View style={styles.ticketOverlay}>
          <TouchableOpacity style={styles.ticketBackdrop} activeOpacity={1} onPress={closeTicketModal} />
          <Animated.View 
            style={[
              styles.ticketContainer,
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
              style={styles.ticketHeader}
            >
              <View style={styles.ticketLogoContainer}>
                <Ticket size={28} color="#fff" />
                <Text style={styles.ticketLogoText}>MiaraGo</Text>
              </View>
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeText}>{t("ticketTitle") || "TICKET DE TRANSPORT"}</Text>
              </View>
            </LinearGradient>

            <View style={styles.ticketPerforation} />
            <View style={styles.ticketPerforationLine} />

            <View style={styles.ticketBody}>
              <View style={styles.ticketNumberRow}>
                <Receipt size={14} color="#6B7280" />
                <Text style={styles.ticketNumberLabel}>{t("bookingRef") || "N° de réservation"}</Text>
                <Text style={styles.ticketNumberValue}>{ticketNumber}</Text>
              </View>
              
              <View style={styles.ticketDivider} />

              <View style={styles.ticketRoute}>
                <View style={styles.ticketRoutePoint}>
                  <View style={styles.ticketRouteDotStart} />
                  <Text style={styles.ticketRouteCity}>{selectedTicketItem.trip.departure}</Text>
                </View>
                <View style={styles.ticketRouteLine} />
                <View style={styles.ticketRoutePoint}>
                  <View style={styles.ticketRouteDotEnd} />
                  <Text style={styles.ticketRouteCity}>{selectedTicketItem.trip.arrival}</Text>
                </View>
              </View>

              <View style={styles.ticketInfoGrid}>
                <View style={styles.ticketInfoItem}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.ticketInfoLabel}>{t("date")}</Text>
                  <Text style={styles.ticketInfoValue}>{formatDateForTicket(selectedTicketItem.trip.date)}</Text>
                </View>
                <View style={styles.ticketInfoItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.ticketInfoLabel}>{t("time")}</Text>
                  <Text style={styles.ticketInfoValue}>{selectedTicketItem.trip.time}</Text>
                </View>
              </View>

              <View style={styles.ticketInfoRow}>
                <View style={styles.ticketInfoItem}>
                  <Users size={16} color="#6B7280" />
                  <Text style={styles.ticketInfoLabel}>{t("seats")}</Text>
                  <Text style={styles.ticketInfoValue}>{selectedTicketItem.seats}</Text>
                </View>
                <View style={styles.ticketInfoItem}>
                  <Car size={16} color="#6B7280" />
                  <Text style={styles.ticketInfoLabel}>{t("vehicle")}</Text>
                  <Text style={styles.ticketInfoValue} numberOfLines={1}>{selectedTicketItem.vehicleModel}</Text>
                </View>
              </View>

              <View style={styles.ticketDriver}>
                <Image source={{ uri: selectedTicketItem.trip.driver?.avatar || "https://via.placeholder.com/80" }} style={styles.ticketDriverAvatar} />
                <View>
                  <Text style={styles.ticketDriverLabel}>{t("driver")}</Text>
                  <Text style={styles.ticketDriverName}>{selectedTicketItem.trip.driver?.name}</Text>
                </View>
                <View style={styles.ticketDriverRating}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ticketDriverRatingText}>{selectedTicketItem.trip.driver?.rating.toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.ticketPriceContainer}>
                <Text style={styles.ticketPriceLabel}>{t("total")}</Text>
                <Text style={styles.ticketPriceValue}>{selectedTicketItem.totalPrice.toLocaleString()} Ar</Text>
              </View>

              <View style={styles.ticketQRContainer}>
                <View style={styles.ticketQRBorder}>
                  <QRCode 
                    value={JSON.stringify({ 
                      id: selectedTicketItem.id, 
                      ticketNumber,
                      departure: selectedTicketItem.trip.departure, 
                      arrival: selectedTicketItem.trip.arrival,
                      date: selectedTicketItem.trip.date,
                      seats: selectedTicketItem.seats
                    })} 
                    size={80} 
                  />
                </View>
                <View style={styles.ticketQRText}>
                  <QrCode size={12} color="#6B7280" />
                  <Text style={styles.ticketQRLabel}>{t("qrLabel") || "Présentez ce QR code au conducteur"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.ticketFooter}>
              <Text style={styles.ticketFooterText}>{t("thanksTicket") || "Merci de voyager avec MiaraGo"}</Text>
              <Text style={styles.ticketFooterSubtext}>support@miarago.com | www.miarago.com</Text>
            </View>

            <View style={styles.ticketCutLine} />

            <View style={styles.ticketActions}>
              <TouchableOpacity style={styles.ticketActionButton} onPress={() => shareTicket(selectedTicketItem)}>
                <Share2 size={18} color="#059669" />
                <Text style={styles.ticketActionText}>{t("share") || "Partager"}</Text>
              </TouchableOpacity>
              <View style={styles.ticketActionDivider} />
              <TouchableOpacity style={styles.ticketActionButton} onPress={() => downloadTicket(selectedTicketItem)}>
                <Download size={18} color="#059669" />
                <Text style={styles.ticketActionText}>{t("download") || "Télécharger"}</Text>
              </TouchableOpacity>
              <View style={styles.ticketActionDivider} />
              <TouchableOpacity style={styles.ticketActionButton} onPress={closeTicketModal}>
                <X size={18} color="#059669" />
                <Text style={styles.ticketActionText}>{t("close") || "Fermer"}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  /* ================= UI ================= */
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Car size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === "pending" ? t("noPendingTrips") || "Aucun trajet en attente" : t("noCompletedTrips") || "Aucun trajet terminé"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "pending" 
          ? t("noPendingTripsDesc") || "Vous n'avez pas de réservation en attente pour le moment." 
          : t("noCompletedTripsDesc") || "Vous n'avez pas encore de trajets terminés."}
      </Text>
    </View>
  );

  const ErrorState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: "#FEF2F2" }]}>
        <Feather name="alert-circle" size={48} color="#EF4444" />
      </View>
      <Text style={styles.emptyTitle}>{t("error") || "Erreur de chargement"}</Text>
      <Text style={styles.emptySubtitle}>{error || t("fetchError") || "Impossible de charger vos trajets."}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
        <Text style={styles.retryButtonText}>{t("retry") || "Réessayer"}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#059669", "#047857"]} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("passengerHistoryTitle") || "Mon historique"}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.tabTextActive]}>
            {t("pending") || "En attente"}
          </Text>
          {activeTab === "pending" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.tabActive]}
          onPress={() => setActiveTab("completed")}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}>
            {t("completed") || "Terminés"}
          </Text>
          {activeTab === "completed" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={{ padding: 16 }}>
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : error ? (
        <ErrorState />
      ) : (
        <FlatList
          data={paginatedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#059669" style={styles.loadingMore} /> : null}
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TicketModalComponent />
    </View>
  );
}

// Styles (identiques à votre version existante)
const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: { flexDirection: "row", paddingTop: Platform.OS === "ios" ? 50 : 40, paddingBottom: 20, paddingHorizontal: 20, alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  title: { flex: 1, textAlign: "center", color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  tabsContainer: { flexDirection: "row", backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", position: "relative" },
  tabActive: { backgroundColor: "transparent" },
  tabText: { fontSize: 15, fontWeight: "500", color: "#6B7280" },
  tabTextActive: { color: "#059669", fontWeight: "600" },
  tabIndicator: { position: "absolute", bottom: -1, left: "30%", right: "30%", height: 2, backgroundColor: "#059669", borderRadius: 1 },
  listContent: { padding: 16, paddingBottom: 100 },
  loadingMore: { paddingVertical: 20 },
  card: { backgroundColor: "#fff", borderRadius: 20, marginBottom: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  routeContainer: { flex: 1, marginRight: 12 },
  routePoint: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeDotStart: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },
  routeDotEnd: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444" },
  routeLine: { width: 2, height: 16, backgroundColor: "#E5E7EB", marginLeft: 3, marginVertical: 4 },
  routeText: { fontSize: 14, fontWeight: "600", color: "#111827", flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 },
  statusPendingBadge: { backgroundColor: "#FEF3C7" },
  statusCompletedBadge: { backgroundColor: "#D1FAE5" },
  statusBadgeText: { fontSize: 11, fontWeight: "600" },
  statusPendingText: { color: "#B45309" },
  statusCompletedText: { color: "#047857" },
  tripDetails: { gap: 8, marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 12, color: "#6B7280", flex: 1 },
  dotSeparator: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#D1D5DB" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  priceValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  seatsInfo: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  actionButtons: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailsButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#059669", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  detailsButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  ticketButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FEF3C7", justifyContent: "center", alignItems: "center" },
  shareButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center" },
  ticketOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)" },
  ticketBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  ticketContainer: { width: width - 32, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 16 },
  ticketHeader: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ticketLogoContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketLogoText: { fontSize: 18, fontWeight: "800", color: "#fff" },
  ticketBadge: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  ticketBadgeText: { fontSize: 10, fontWeight: "600", color: "#fff", letterSpacing: 0.5 },
  ticketPerforation: { position: "absolute", top: 68, left: 0, right: 0, height: 20, overflow: "hidden" },
  ticketPerforationLine: { position: "absolute", top: 78, left: 0, right: 0, height: 1, backgroundColor: "#E5E7EB", borderStyle: "dashed" },
  ticketCutLine: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 0 },
  ticketBody: { padding: 20 },
  ticketNumberRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  ticketNumberLabel: { fontSize: 12, color: "#6B7280", flex: 1 },
  ticketNumberValue: { fontSize: 14, fontWeight: "700", color: "#059669", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  ticketDivider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  ticketRoute: { marginBottom: 20 },
  ticketRoutePoint: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 6 },
  ticketRouteDotStart: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  ticketRouteDotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444" },
  ticketRouteLine: { width: 2, height: 20, backgroundColor: "#E5E7EB", marginLeft: 4, marginVertical: 2 },
  ticketRouteCity: { fontSize: 16, fontWeight: "700", color: "#111827" },
  ticketInfoGrid: { flexDirection: "row", gap: 16, marginBottom: 16 },
  ticketInfoRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  ticketInfoItem: { flex: 1, backgroundColor: "#F9FAFB", padding: 12, borderRadius: 12, alignItems: "center", gap: 6 },
  ticketInfoLabel: { fontSize: 10, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  ticketInfoValue: { fontSize: 13, fontWeight: "600", color: "#111827", textAlign: "center" },
  ticketDriver: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", padding: 12, borderRadius: 12, marginBottom: 16, gap: 12 },
  ticketDriverAvatar: { width: 44, height: 44, borderRadius: 22 },
  ticketDriverLabel: { fontSize: 10, color: "#6B7280" },
  ticketDriverName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  ticketDriverRating: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" },
  ticketDriverRatingText: { fontSize: 12, fontWeight: "600", color: "#F59E0B" },
  ticketPriceContainer: { backgroundColor: "#ECFDF5", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  ticketPriceLabel: { fontSize: 12, color: "#059669", marginBottom: 4 },
  ticketPriceValue: { fontSize: 22, fontWeight: "800", color: "#047857" },
  ticketQRContainer: { alignItems: "center", gap: 8 },
  ticketQRBorder: { padding: 8, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  ticketQRText: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketQRLabel: { fontSize: 10, color: "#6B7280" },
  ticketFooter: { backgroundColor: "#F9FAFB", padding: 16, alignItems: "center", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  ticketFooterText: { fontSize: 12, fontWeight: "500", color: "#059669", marginBottom: 4 },
  ticketFooterSubtext: { fontSize: 10, color: "#6B7280" },
  ticketActions: { flexDirection: "row", padding: 16, gap: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  ticketActionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 30, backgroundColor: "#F3F4F6" },
  ticketActionText: { fontSize: 14, fontWeight: "500", color: "#059669" },
  ticketActionDivider: { width: 1, backgroundColor: "#E5E7EB" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", paddingHorizontal: 40 },
  retryButton: { marginTop: 20, backgroundColor: "#059669", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30 },
  retryButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  skeletonCard: { backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16 },
  skeletonRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  skeletonIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E5E7EB", marginRight: 12 },
  skeletonIconSmall: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#E5E7EB", marginRight: 8 },
  skeletonContent: { flex: 1 },
  skeletonLarge: { height: 18, width: "70%", backgroundColor: "#E5E7EB", borderRadius: 8, marginBottom: 8 },
  skeletonMedium: { height: 14, width: "50%", backgroundColor: "#E5E7EB", borderRadius: 6 },
  skeletonSmall: { height: 12, width: "40%", backgroundColor: "#E5E7EB", borderRadius: 6 },
  skeletonDivider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },
  skeletonFooter: { height: 36, width: "40%", backgroundColor: "#E5E7EB", borderRadius: 20, alignSelf: "flex-end" },
});