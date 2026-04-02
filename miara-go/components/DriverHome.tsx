// DriverHome.tsx - Version avec en-tête des actions rapides
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  MessageSquare,
  MoreVertical,
  Trash,
  Car,
  Route,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Navigation2,
  Rocket,
  Compass,
  PlusCircle,
  Wallet,
  FileText,
} from "lucide-react-native";

import { Header } from "../components/Header";
import { useTranslation } from "react-i18next";
import { SideMenu } from "./SideMenu";
import { MainView } from "./Navigation";
import { PublishScreen } from "./PublishScreen";
import RideRequestScreen from "./RideRequestScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PopUpRatingScreen from "./PopUpRatingScreen";

import { Alert } from "react-native";

const { width, height } = Dimensions.get("window");

/* ===================== TYPES ===================== */
type TripStatus = "open" | "full" | "completed" | "cancelled";

interface Vehicle {
  model: string;
  plate: string;
  image?: string;
  totalSeats: number;
  availableSeats: number;
}

interface DriverTrip {
  id: string;
  departure: string;
  arrival: string;
  date: string;
  time: string;
  price: number;
  status: TripStatus;
  vehicle?: Vehicle;
}

interface RideRequest {
  id: string;
  departure_location: string;
  arrival_location: string;
  desired_date: string;
  desired_time: string;
  seats_needed: string;
  message?: string;
  status?: "active" | "closed" | "completed";
}

interface DriverHomeProps {
  onNotifications?: () => void;
  onPublish?: () => void;
  onProfileClick?: () => void;
  onViewChange?: (route: MainView) => void;
}

/* ===================== PAGINATION ===================== */
const ITEMS_PER_PAGE = 1;

/* ===================== COMPONENT ===================== */
export function DriverHome({
  onNotifications,
  onPublish,
  onProfileClick,
  onViewChange,
}: DriverHomeProps) {
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [openTripMenuId, setOpenTripMenuId] = useState<string | null>(null);
  const [openOfferMenuId, setOpenOfferMenuId] = useState<string | null>(null);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const [openRequestMenuId, setOpenRequestMenuId] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [selectedRideRequest, setSelectedRideRequest] = useState<RideRequest | null>(null);
  const [showPublishScreen, setShowPublishScreen] = useState(false);
  const [showRideRequestScreen, setShowRideRequestScreen] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // =========================================================
  // 🔹 ÉTAT POUR LE POPUP DE RATING VITA MALAGASY
  // =========================================================
  const [showVitaPopup, setShowVitaPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);
  
  const { t } = useTranslation();

  /* ===================== EFFET POUR AFFICHER LE POPUP ===================== */
  useEffect(() => {
    const checkPopupStatus = async () => {
      try {
        console.log("🔍 DriverHome - Vérification du popup Vita Malagasy...");
        
        // 🔹 DÉCOMMENTEZ POUR RÉINITIALISER ET TESTER
        // await AsyncStorage.removeItem("hasSeenVitaPopup");
        
        const hasSeen = await AsyncStorage.getItem("hasSeenVitaPopup");
        console.log("DriverHome - hasSeenVitaPopup:", hasSeen);
        console.log("DriverHome - hasShownPopup:", hasShownPopup);
        
        if (hasSeen !== "true" && !hasShownPopup) {
          console.log("✅ DriverHome - Le popup va s'afficher dans 1 seconde...");
          setTimeout(() => {
            console.log("🎉 DriverHome - AFFICHAGE DU POPUP !");
            setShowVitaPopup(true);
            setHasShownPopup(true);
          }, 1000);
        } else {
          console.log("❌ DriverHome - Popup non affiché car déjà vu ou hasShownPopup = true");
        }
      } catch (error) {
        console.log("DriverHome - Error checking popup status", error);
        if (!hasShownPopup) {
          setTimeout(() => {
            console.log("🎉 DriverHome - AFFICHAGE DU POPUP (après erreur) !");
            setShowVitaPopup(true);
            setHasShownPopup(true);
          }, 1000);
        }
      }
    };
    
    checkPopupStatus();
  }, []);

  /* ===================== GESTION DU SUBMIT DU RATING ===================== */
  const handleRatingSubmit = (rating: number, comment: string) => {
    console.log("DriverHome - Rating submitted:", { rating, comment, userType: "driver" });
    
    if (rating >= 4) {
      console.log("DriverHome - Bonus credits awarded for high rating!");
      Alert.alert(
        t("vitaPopup.bonusTitle") || "Bonus ! 🎉",
        t("vitaPopup.bonusMessage") || "+2 crédits offerts pour votre soutien à l'économie locale !",
        [{ text: "Merci !" }]
      );
    }
  };

  /* ===================== FETCH ===================== */
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([fetchTrips(), fetchRideRequests(), fetchCredits()]);
  };

  const fetchTrips = async () => {
    try {
      setLoadingTrips(true);
      const res = await fetch("http://10.0.2.2:8080/rides");
      const data = await res.json();
      if (Array.isArray(data?.rides)) setTrips(data.rides);
      else setTrips([]);
    } catch {
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchRideRequests = async () => {
    try {
      setLoadingRequests(true);
      setLoadingOffers(true);

      const res = await fetch("http://10.0.2.2:8080/ride-requests");
      const data = await res.json();

      if (Array.isArray(data?.ride_requests)) {
        setRideRequests(data.ride_requests);
      } else {
        setRideRequests([]);
      }
    } catch {
      setRideRequests([]);
    } finally {
      setLoadingRequests(false);
      setLoadingOffers(false);
    }
  };

  const deleteTrip = async (id: string) => {
    try {
      const res = await fetch(`http://10.0.2.2:8080/rides/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data?.status) {
        throw new Error("Delete failed");
      }

      setTrips(prev => prev.filter(t => t.id !== id));
      Alert.alert("Succès", "Trajet supprimé.");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de supprimer le trajet.");
    }
  };

  const deleteRideRequest = async (id: string) => {
    try {
      const res = await fetch(`http://10.0.2.2:8080/ride-requests/${id}`, 
        { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.status) throw new Error("Delete failed");
      setRideRequests(prev => prev.filter(r => r.id !== id));
      Alert.alert("Succès", "Demande supprimée.");
    } catch { 
      Alert.alert("Erreur", "Impossible de supprimer la demande."); 
    }
  };

  const fetchCredits = async () => {
    try {
      const res = await fetch("http://10.0.2.2:8080/credits/wallet/1");
      const data = await res.json();
      const valid = (data.credits || [])
        .filter((c: any) => c.status === "valid")
        .reduce((sum: number, c: any) => sum + Number(c.credit_amount), 0);
      setTotalCredits(valid);
    } catch {
      setTotalCredits(0);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTripPage(1);
    setRequestPage(1);
    await loadAll();
    setRefreshing(false);
  };

  /* ===================== Filters & Modal ===================== */
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    | "date"
    | "departure"
    | "destination"
    | "vehicle"
    | "offerPrice"
    | "offerSeats"
    | "offerMessage"
    | null
>(null);

  const [modalInput, setModalInput] = useState("");

  // Filtres pour les trajets
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterDeparture, setFilterDeparture] = useState<string | null>(null);
  const [filterDestination, setFilterDestination] = useState<string | null>(null);
  const [filterVehicle, setFilterVehicle] = useState<string | null>(null);

  // Filtres synchronisés pour les demandes de trajets
  const [requestFilterDate, setRequestFilterDate] = useState<string | null>(null);
  const [requestFilterDeparture, setRequestFilterDeparture] = useState<string | null>(null);
  const [requestFilterDestination, setRequestFilterDestination] = useState<string | null>(null);

  /* ===================== Offer Filters ===================== */
  const [filterOfferPrice, setFilterOfferPrice] = useState<string | null>(null);
  const [filterOfferSeats, setFilterOfferSeats] = useState<string | null>(null);
  const [filterOfferMessage, setFilterOfferMessage] = useState<string | null>(null);

  // Fonctions de toggle pour les trajets
  const toggleDate = (date: string | null) => {
    setFilterDate(prev => (prev === date ? null : date));
    setTripPage(1);
  };

  const toggleDeparture = (departure: string) => {
    setFilterDeparture(prev => (prev === departure ? null : departure));
    setTripPage(1);
  };

  const toggleDestination = (destination: string) => {
    setFilterDestination(prev => (prev === destination ? null : destination));
    setTripPage(1);
  };

  const toggleVehicle = (vehicle: string) => {
    setFilterVehicle(prev => (prev === vehicle ? null : vehicle));
    setTripPage(1);
  };

  // Fonctions de toggle synchronisées pour les demandes
  const toggleRequestDate = (date: string | null) => {
    setRequestFilterDate(prev => (prev === date ? null : date));
    setRequestPage(1);
  };

  const toggleRequestDeparture = (departure: string) => {
    setRequestFilterDeparture(prev => (prev === departure ? null : departure));
    setRequestPage(1);
  };

  const toggleRequestDestination = (destination: string) => {
    setRequestFilterDestination(prev => (prev === destination ? null : destination));
    setRequestPage(1);
  };

  // Fonctions pour ouvrir les modals de filtre des demandes
  const openRequestDateFilter = () => {
    setModalType("date");
    setModalInput(requestFilterDate || "");
    setModalVisible(true);
  };

  const openRequestDepartureFilter = () => {
    setModalType("departure");
    setModalInput(requestFilterDeparture || "");
    setModalVisible(true);
  };

  const openRequestDestinationFilter = () => {
    setModalType("destination");
    setModalInput(requestFilterDestination || "");
    setModalVisible(true);
  };

  // Appliquer le filtre pour les demandes
  const applyRequestFilter = (value: string) => {
    if (modalType === "date") {
      setRequestFilterDate(value);
    } else if (modalType === "departure") {
      setRequestFilterDeparture(value);
    } else if (modalType === "destination") {
      setRequestFilterDestination(value);
    }
    setRequestPage(1);
  };

  /* ===================== Pagination ===================== */
  const [tripPage, setTripPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const normalizeDate = (date: string) => {
    try {
      return new Date(date).toISOString().slice(0, 10);
    } catch {
      return null;
    }
  };

  /* ===================== FILTER LOGIC ===================== */
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      if (filterDate && normalizeDate(t.date) !== filterDate)
        return false;
      if (filterDeparture && !t.departure.toLowerCase().includes(filterDeparture.toLowerCase()))
        return false;
      if (filterDestination && !t.arrival.toLowerCase().includes(filterDestination.toLowerCase()))
        return false;
      if (filterVehicle && !t.vehicle?.model?.toLowerCase().includes(filterVehicle.toLowerCase()))
        return false;
      return true;
    });
  }, [trips, filterDate, filterDeparture, filterDestination, filterVehicle]);

  const filteredRideRequests = useMemo(() => {
    return rideRequests.filter(r => {
      if (requestFilterDate && normalizeDate(r.desired_date) !== requestFilterDate)
        return false;
      if (requestFilterDeparture && !r.departure_location.toLowerCase().includes(requestFilterDeparture.toLowerCase()))
        return false;
      if (requestFilterDestination && !r.arrival_location.toLowerCase().includes(requestFilterDestination.toLowerCase()))
        return false;
      return true;
    });
  }, [rideRequests, requestFilterDate, requestFilterDeparture, requestFilterDestination]);

  const paginatedTrips = useMemo(
    () => filteredTrips.slice(0, tripPage * ITEMS_PER_PAGE),
    [filteredTrips, tripPage]
  );

  const paginatedRideRequests = useMemo(
    () => filteredRideRequests.slice(0, requestPage * ITEMS_PER_PAGE), 
    [filteredRideRequests, requestPage]
  );

  /* ===================== Status Config ===================== */
  const statusConfig: any = {
    open: { bg: "#DBEAFE", text: "#1b2a52", label: t("open") },
    full: { bg: "#FEF3C7", text: "#60544a", label: t("full") },
    completed: { bg: "#D1FAE5", text: "#047857", label: t("completed") },
    cancelled: { bg: "#FECACA", text: "#B91C1C", label: t("cancelled") },
  };

  const requestStatusConfig: any = {
    active: { bg: "#DCFCE7", text: "#047857", label: t("active") },
    closed: { bg: "#F3F4F6", text: "#6B7280", label: t("closed") },
    completed: { bg: "#DBEAFE", text: "#1b2a52", label: t("completed") },
  };

  /* ===================== Skeleton ===================== */
  const SkeletonCard = () => (
    <View style={[styles.card, { backgroundColor: "#E5E7EB" }]}>
      <View style={styles.skeletonLineLarge} />
      <View style={styles.skeletonLineSmall} />
    </View>
  );

  /* ===================== Render Trip ===================== */
  const renderTrip = ({ item }: { item: DriverTrip }) => {
    const config = statusConfig[item.status] ?? statusConfig.open;

    const handleLongPress = () => {
      Alert.alert(
        "Suppression",
        "Supprimer ce trajet ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => deleteTrip(item.id),
          },
        ]
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.cardHeader}>
            <Text style={styles.route}>
              {item.departure} → {item.arrival}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setOpenTripMenuId(
                  openTripMenuId === item.id ? null : item.id
                )
              }
            >
              <MoreVertical size={18} color="#047857" />
            </TouchableOpacity>
          </View>

          {/* STATUS */}
          <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={{ color: config.text, fontWeight: "600" }}>
              {config.label}
            </Text>
          </View>

          {/* DETAILS */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.date}</Text>
            </View>

            <View style={styles.detailRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.time}</Text>
            </View>

            <View style={styles.detailRow}>
              <DollarSign size={14} color="#6B7280" />
              <Text style={styles.detailText}>{item.price} Ar</Text>
            </View>

            {item.vehicle && (
              <View style={styles.detailRow}>
                <Car size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.vehicle.model} - {item.vehicle.plate} (
                  {item.vehicle.availableSeats}/{item.vehicle.totalSeats} sièges)
                </Text>
              </View>
            )}
          </View>

          {/* MENU */}
          {openTripMenuId === item.id && (
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  Alert.alert(t("deleteTrip"), t("deleteTripConfirmation"), [
                    { text: t("cancel"), style: "cancel" },
                    {
                      text: t("delete"), 
                      style: "destructive",
                      onPress: () => {
                        setOpenTripMenuId(null);
                        deleteTrip(item.id);
                      },
                    },
                  ])
                }
              >
                <Trash size={16} color="#B91C1C" />
                <Text style={[styles.menuText, { color: "#B91C1C" }]}>
                  {t("delete")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderRequest = ({ item }: { item: RideRequest }) => {
    const config = requestStatusConfig[item.status ?? "active"];

    const handleLongPress = () => {
      Alert.alert(
        "Suppression",
        "Supprimer cette demande ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => deleteRideRequest(item.id),
          },
        ]
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.95}
        delayLongPress={400}
        onPress={() => {
          if (item.status === "active") {
            setSelectedRideRequest(item);
            setShowPublishScreen(true);
          } else {
            Alert.alert(
              "Information",
              "Cette demande n'est plus active."
            );
          }
        }}
        onLongPress={handleLongPress}
      >
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.cardHeader}>
            <Text style={styles.route}>
              {item.departure_location} → {item.arrival_location}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setOpenRequestMenuId(
                  openRequestMenuId === item.id ? null : item.id
                )
              }
            >
              <MoreVertical size={18} color="#047857" />
            </TouchableOpacity>
          </View>

          {/* STATUS + PUBLISH CHIP */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            
            {/* STATUS CHIP */}
            <View style={[styles.badge, { backgroundColor: config.bg }]}>
              <Text style={{ color: config.text, fontWeight: "600" }}>
                {config.label}
              </Text>
            </View>

            {/* CHIP PUBLISH */}
            {item.status === "active" && (
              <TouchableOpacity
                style={styles.publishChip}
                onPress={() => {
                  setSelectedRideRequest(item);
                  setShowPublishScreen(true);
                }}
              >
                <Text style={styles.publishChipText}>{t("publishOffer")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* DETAILS */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Calendar size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.desired_date}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.desired_time}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Users size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.seats_needed} {t("seats")}
              </Text>
            </View>

            {item.message && (
              <View style={styles.detailRow}>
                <MessageSquare size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {item.message}
                </Text>
              </View>
            )}
          </View>

          {/* MENU */}
          {openRequestMenuId === item.id && (
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  Alert.alert(
                    "Suppression",
                    "Supprimer cette demande ?",
                    [
                      { text: "Annuler", style: "cancel" },
                      {
                        text: "Supprimer",
                        style: "destructive",
                        onPress: () => {
                          setOpenRequestMenuId(null);
                          deleteRideRequest(item.id);
                        },
                      },
                    ]
                  )
                }
              >
                <Trash size={16} color="#B91C1C" />
                <Text
                  style={[
                    styles.menuText,
                    { color: "#B91C1C" },
                  ]}
                >
                  {t("delete")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /* ===================== UI ===================== */
  return (
    <View style={styles.container}>
      {/* POPUP VITA MALAGASY */}
      <PopUpRatingScreen
        visible={showVitaPopup}
        onClose={() => setShowVitaPopup(false)}
        onRatingSubmit={handleRatingSubmit}
        userType="driver"
        userId={1}
      />

      <Header
        title="MiaraGo"
        onNotifications={onNotifications}
        onProfileClick={onProfileClick}
        onMenuPress={() => setMenuVisible(true)}
      />

      <SideMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={(route: MainView) => {
          setMenuVisible(false);
          onViewChange?.(route);
        }}
        onLogout={() => {
          setMenuVisible(false);
          onViewChange?.("home");
        }}
      />

      {/* Affichage conditionnel des écrans */}
      {showRideRequestScreen ? (
        <RideRequestScreen
          userId={1}
          onBack={() => setShowRideRequestScreen(false)}
        />
      ) : showPublishScreen && selectedRideRequest ? (
        <PublishScreen
          rideRequestId={selectedRideRequest.id}
          userType="driver"
          userId={1}
          onBack={() => {
            setShowPublishScreen(false);
            setSelectedRideRequest(null);
          }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* CARTE D'INFORMATIONS UNIFIÉE */}
          <View style={styles.unifiedStatsCard}>
            <View style={styles.unifiedStatsHeader}>
              <View style={styles.unifiedStatsIcon}>
                <TrendingUp size={20} color="#047857" />
              </View>
              <Text style={styles.unifiedStatsTitle}>{t("dashboardOverview")}</Text>
            </View>
            
            <View style={styles.unifiedStatsRow}>
              {/* Trajets */}
              <TouchableOpacity
                style={styles.unifiedStatItem}
                activeOpacity={0.7}
                onPress={() => onViewChange?.("trip")}
              >
                <View style={[styles.unifiedStatIcon, { backgroundColor: "#ECFDF5" }]}>
                  <Compass size={24} color="#047857" />
                </View>
                <View style={styles.unifiedStatContent}>
                  <Text style={styles.unifiedStatValue}>{trips.length}</Text>
                  <Text style={styles.unifiedStatLabel}>{t("trips")}</Text>
                </View>
              </TouchableOpacity>

              {/* Séparateur vertical */}
              <View style={styles.unifiedDivider} />

              {/* Demandes de trajets */}
              <TouchableOpacity
                style={styles.unifiedStatItem}
                activeOpacity={0.7}
                onPress={() => setShowRideRequestScreen(true)}
              >
                <View style={[styles.unifiedStatIcon, { backgroundColor: "#EFF6FF" }]}>
                  <Rocket size={24} color="#1b2a52" />
                </View>
                <View style={styles.unifiedStatContent}>
                  <Text style={styles.unifiedStatValue}>{rideRequests.length}</Text>
                  <Text style={styles.unifiedStatLabel}>{t("rideRequests")}</Text>
                </View>
              </TouchableOpacity>

              {/* Séparateur vertical */}
              <View style={styles.unifiedDivider} />

              {/* Crédits */}
              <TouchableOpacity
                style={styles.unifiedStatItem}
                activeOpacity={0.7}
                onPress={() => Alert.alert(t("credits"), `${totalCredits}`)}
              >
                <View style={[styles.unifiedStatIcon, { backgroundColor: "#bcb7a3" }]}>
                  <CreditCard size={24} color="#3b342f" />
                </View>
                <View style={styles.unifiedStatContent}>
                  <Text style={styles.unifiedStatValue}>{totalCredits}</Text>
                  <Text style={styles.unifiedStatLabel}>{t("credits")}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ACTIONS RAPIDES AVEC EN-TÊTE */}
          <View style={styles.quickActionsSection}>
            {/* En-tête des actions rapides */}
            <View style={styles.quickActionsHeader}>
              <Text style={styles.quickActionsTitle}>{t("quickActions") || "Actions rapides"}</Text>
              <TouchableOpacity 
                style={styles.quickActionsSeeAll}
                onPress={() => {
                  // Action pour voir toutes les actions rapides
                  console.log("Voir toutes les actions rapides");
                }}
              >
              </TouchableOpacity>
            </View>

            {/* Icônes des actions rapides */}
            <View style={styles.quickActionsRow}>
              {/* Créer un trajet */}
              <TouchableOpacity
                style={styles.quickActionItem}
                activeOpacity={0.7}
                onPress={() => onViewChange?.("trip")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: "#ECFDF5" }]}>
                  <PlusCircle size={24} color="#047857" />
                </View>
                <Text style={styles.quickActionLabel}>{t("createTrip") || "Créer"}</Text>
              </TouchableOpacity>

              {/* Portefeuille */}
              <TouchableOpacity
                style={styles.quickActionItem}
                activeOpacity={0.7}
                onPress={() => onViewChange?.("wallet")}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: "#bcb7a3" }]}>
                  <Wallet size={24} color="#3b342f" />
                </View>
                <Text style={styles.quickActionLabel}>{t("wallet") || "Wallet"}</Text>
              </TouchableOpacity>

              {/* Demande de trajet */}
              <TouchableOpacity
                style={styles.quickActionItem}
                activeOpacity={0.7}
                onPress={() => setShowRideRequestScreen(true)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: "#EFF6FF" }]}>
                  <FileText size={24} color="#1b2a52" />
                </View>
                <Text style={styles.quickActionLabel}>{t("rideRequests") || "Demande"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ========================================================= */}
          {/* 🔹 SECTION MES TRAJETS AVEC "VOIR PLUS" ALIGNÉ À DROITE */}
          {/* ========================================================= */}
          <View style={styles.sectionHeader}>
            <Text style={styles.section}>
              {t("myTrips")} ({filteredTrips.length})
            </Text>
            {paginatedTrips.length < filteredTrips.length && (
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => setTripPage(p => p + 1)}
              >
                <Text style={styles.seeMoreText}>{t("seeMore")}</Text>
                <ChevronRight size={16} color="#047857" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtres pour les trajets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersCarousel}
          >
            <TouchableOpacity
              style={[styles.filterChip, filterDate && { backgroundColor: "#047857" }]}
              onPress={() =>
                toggleDate(filterDate ? null : new Date().toISOString().slice(0, 10))
              }
            >
              <Calendar size={14} color={filterDate ? "#FFF" : "#374151"} />
              <Text style={[styles.filterText, filterDate && { color: "#FFF" }]}>
                {filterDate || t("date")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterDeparture && { backgroundColor: "#047857" }]}
              onPress={() => {
                setModalType("departure");
                setModalInput(filterDeparture || "");
                setModalVisible(true);
              }}
            >
              <Route size={14} color={filterDeparture ? "#FFF" : "#374151"} />
              <Text style={[styles.filterText, filterDeparture && { color: "#FFF" }]}>
                {filterDeparture || t("departure")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterDestination && { backgroundColor: "#047857" }]}
              onPress={() => {
                setModalType("destination");
                setModalInput(filterDestination || "");
                setModalVisible(true);
              }}
            >
              <Route size={14} color={filterDestination ? "#FFF" : "#374151"} />
              <Text style={[styles.filterText, filterDestination && { color: "#FFF" }]}>
                {filterDestination || t("destination")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterVehicle && { backgroundColor: "#047857" }]}
              onPress={() => {
                setModalType("vehicle");
                setModalInput(filterVehicle || "");
                setModalVisible(true);
              }}
            >
              <Car size={14} color={filterVehicle ? "#FFF" : "#374151"} />
              <Text style={[styles.filterText, filterVehicle && { color: "#FFF" }]}>
                {filterVehicle || t("vehicle")}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Trips List */}
          {loadingTrips ? (
            [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <FlatList
              data={paginatedTrips}
              renderItem={renderTrip}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}

          {/* MODAL de filtres */}
          <Modal transparent visible={modalVisible} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>{t("filter")}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={modalInput}
                  onChangeText={setModalInput}
                  placeholder={t("enterValue")}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={{ color: "#B91C1C" }}>{t("cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (modalType === "departure") {
                        setFilterDeparture(modalInput);
                      }
                      if (modalType === "destination") {
                        setFilterDestination(modalInput);
                      }
                      if (modalType === "vehicle") {
                        setFilterVehicle(modalInput);
                      }
                      if (modalType === "date") {
                        setFilterDate(modalInput);
                      }
                      if (modalType === "offerPrice") {
                        setFilterOfferPrice(modalInput);
                      }
                      if (modalType === "offerSeats") {
                        setFilterOfferSeats(modalInput);
                      }
                      if (modalType === "offerMessage") {
                        setFilterOfferMessage(modalInput);
                      }

                      // Appliquer les filtres synchronisés pour les demandes
                      applyRequestFilter(modalInput);

                      setTripPage(1);
                      setOfferPage(1);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{ color: "#047857" }}>{t("ok")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ========================================================= */}
          {/* 🔹 SECTION DEMANDES DE TRAJETS AVEC "VOIR PLUS" ALIGNÉ À DROITE */}
          {/* ========================================================= */}
          <View style={styles.sectionHeader}>
            <Text style={styles.section}>
              {t("myRideRequests")} ({filteredRideRequests.length})
            </Text>
            {paginatedRideRequests.length < filteredRideRequests.length && (
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => setRequestPage(p => p + 1)}
              >
                <Text style={styles.seeMoreText}>{t("seeMore")}</Text>
                <ChevronRight size={16} color="#047857" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Filtres synchronisés pour les demandes */}
          <View style={[styles.filtersRow, { marginHorizontal: 16, marginBottom: 10 }]}>
            <TouchableOpacity
              style={[styles.filterChip, requestFilterDate && { backgroundColor: "#047857" }]}
              onPress={openRequestDateFilter}
            >
              <Calendar size={14} color={requestFilterDate ? "#FFF" : "#374151"} />
              <Text style={[styles.filterText, requestFilterDate && { color: "#FFF" }]}>
                {requestFilterDate || t("date")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, requestFilterDeparture && { backgroundColor: "#047857" }]}
              onPress={openRequestDepartureFilter}
            >
              <Route size={14} color={requestFilterDeparture ? "#FFF" : "#374151"} />
              <Text style={[styles.filterText, requestFilterDeparture && { color: "#FFF" }]}>
                {requestFilterDeparture || t("departure")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, requestFilterDestination && { backgroundColor: "#047857" }]}
              onPress={openRequestDestinationFilter}
            >
              <Route size={14} color={requestFilterDestination ? "#FFF" : "#374151"} />
              <Text style={[styles.filterText, requestFilterDestination && { color: "#FFF" }]}>
                {requestFilterDestination || t("destination")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Liste des demandes filtrées */}
          {loadingOffers ? (
            [...Array(2)].map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <FlatList
              data={paginatedRideRequests}
              renderItem={renderRequest}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  section: { fontSize: 16, fontWeight: "700", margin: 16 },

  // =========================================================
  // 🔹 STYLES POUR LA CARTE UNIFIÉE
  // =========================================================
  unifiedStatsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  unifiedStatsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  unifiedStatsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  unifiedStatsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  unifiedStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unifiedStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  unifiedStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  unifiedStatContent: {
    flex: 1,
  },
  unifiedStatValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  unifiedStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  unifiedDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
  },

  // =========================================================
  // 🔹 STYLES POUR LES ACTIONS RAPIDES AVEC EN-TÊTE
  // =========================================================
  quickActionsSection: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  quickActionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickActionsSeeAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  quickActionsSeeAllText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#059669",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  quickActionItem: {
    alignItems: "center",
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },

  // Styles existants
  statsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    alignItems: "center",
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: { fontSize: 20, fontWeight: "700", marginTop: 4 },
  statLabel: { fontSize: 12, color: "#6B7280" },

  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  route: { fontWeight: "600", fontSize: 15 },

  details: { marginTop: 10, gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { fontSize: 13, color: "#374151" },

  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },

  menu: {
    position: "absolute",
    right: 12,
    top: 44,
    backgroundColor: "#FFF",
    borderRadius: 14,
    elevation: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  menuText: { fontWeight: "600" },

  loadMore: {
    alignSelf: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  loadMoreText: { fontWeight: "600", color: "#374151" },

  skeletonLineLarge: { height: 14, width: "70%", backgroundColor: "#D1D5DB", borderRadius: 6 },
  skeletonLineSmall: { height: 12, width: "40%", backgroundColor: "#D1D5DB", borderRadius: 6, marginTop: 10 },

  sectionRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginHorizontal: 16, 
    marginTop: 16 
  },
  filtersRow: { flexDirection: "row", gap: 8 },
  filterChip: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 14, 
    backgroundColor: "#E5E7EB" 
  },
  filterText: { fontSize: 12, fontWeight: "600", color: "#374151" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontWeight: "700", marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    marginTop: 16,
  },
  filtersCarousel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: "center",
  },

  publishChip: {
    backgroundColor: "#047857",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  publishChipText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#047857",
    marginRight: 4,
  },
});
