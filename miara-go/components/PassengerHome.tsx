// PassengerHome.tsx (version avec actions rapides améliorées - défilement vers les sections)
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Image,
  Linking,
  RefreshControl,
  TextInput,
  Animated,
  Easing,
  Modal,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Clock, 
  Sliders, 
  Car, 
  X, 
  Filter, 
  Star, 
  ChevronRight,
  PlusCircle,
  Wallet,
  FileText,
  TrendingUp,
  Compass,
  Rocket,
  CreditCard,
} from "lucide-react-native";
import QRCode from "react-native-qrcode-svg";
import { Header } from "../components/Header";
import RideRequestScreen from "./RideRequestScreen";
import RatingScreen from "./RatingScreen";
import PopUpRatingScreen from "./PopUpRatingScreen";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ===================== TYPES ===================== */
export interface Trip {
  driver_id: any;
  id: string;
  driver: {
    name: string;
    rating: number;
    avatar?: string;
    phone?: string | null;
  };
  vehicle: {
    model: string;
    plate: string;
    totalSeats: number;
    availableSeats: number;
  };
  departure: string;
  arrival: string;
  date: string;
  time: string;
  price: number;
  meetingPoints: string[];
  hasRated?: boolean;
}

export interface Offer {
  id: string;
  ride_request_id: string;
  price_per_seat: string;
  seats_offered: string;
  message: string;
  car_info: string;
}

// =========================================================
// 🔹 INTERFACE POUR LES FILTRES AMÉLIORÉS
// =========================================================
interface FilterOptions {
  sortType: "none" | "price" | "date" | "rating";
  onlyAvailable: boolean;
  priceRange: [number, number];
  maxPrice: number;
  departureFilter: string;
  arrivalFilter: string;
  minRating: number;
  selectedVehicleTypes: string[];
}

interface PassengerHomeProps {
  userId: number;
  onBookTrip?: (trip: Trip, offer: Offer | null, seats: number) => void;
  onSearch: (trips: Trip[], offers: Offer[]) => void;
  onNotifications?: () => void;
  onProfileClick?: () => void;
  userType?: "driver" | "passenger";
  onRateTrip?: (trip: Trip) => void;
}

/* ===================== COMPONENT ===================== */
export default function PassengerHome({
  userId,
  onBookTrip,
  onSearch,
  onNotifications,
  onProfileClick,
  userType = "passenger",
}: PassengerHomeProps) {
  const { t } = useTranslation();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);

  // =========================================================
  // 🔹 ÉTAT POUR LE POPUP VITA MALAGASY
  // =========================================================
  const [showVitaPopup, setShowVitaPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  // =========================================================
  // 🔹 ÉTATS POUR LES FILTRES AMÉLIORÉS
  // =========================================================
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sortType: "none",
    onlyAvailable: false,
    priceRange: [0, 100000],
    maxPrice: 100000,
    departureFilter: "",
    arrivalFilter: "",
    minRating: 0,
    selectedVehicleTypes: [],
  });
  
  // État pour les filtres temporaires (pendant l'édition dans le modal)
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);
  
  // Statistiques des prix pour le slider
  const [priceStats, setPriceStats] = useState({ min: 0, max: 100000, avg: 25000 });

  const slideAnim = useRef(new Animated.Value(500)).current;

  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [rideRequestModalVisible, setRideRequestModalVisible] = useState(false);
  const [selectedRideRequestId, setSelectedRideRequestId] = useState<number | null>(null);

  const [selectedTripForRating, setSelectedTripForRating] = useState<Trip | null>(null);
  const [ratingToken, setRatingToken] = useState<string>("");

  const PAGE_SIZE = 10;
  const [tripPage, setTripPage] = useState(1);
  const [offerPage, setOfferPage] = useState(1);

  // =========================================================
  // 🔹 REFS POUR LE DÉFILEMENT
  // =========================================================
  const scrollViewRef = useRef<ScrollView>(null);
  const tripsSectionRef = useRef<View>(null);
  const offersSectionRef = useRef<View>(null);
  
  // Positions des sections pour le défilement
  const [tripsSectionY, setTripsSectionY] = useState(0);
  const [offersSectionY, setOffersSectionY] = useState(0);

  /* ===================== EFFET POUR AFFICHER LE POPUP ===================== */
  useEffect(() => {
    const checkPopupStatus = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem("hasSeenVitaPopup");
        
        if (hasSeen !== "true" && !hasShownPopup) {
          setTimeout(() => {
            setShowVitaPopup(true);
            setHasShownPopup(true);
          }, 1000);
        }
      } catch (error) {
        console.log("Error checking popup status", error);
        if (!hasShownPopup) {
          setTimeout(() => {
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
    console.log("Rating submitted:", { rating, comment, userType: "passenger" });
    
    if (rating >= 4) {
      Alert.alert(
        t("vitaPopup.bonusTitle") || "Bonus ! 🎉",
        t("vitaPopup.bonusMessage") || "+2 crédits offerts pour votre soutien à l'économie locale !",
        [{ text: "Merci !" }]
      );
    }
  };

  // Types de véhicules disponibles (extraits des trajets)
  const vehicleTypes = useMemo(() => {
    const types = new Set<string>();
    trips.forEach(trip => {
      if (trip.vehicle?.model) {
        const modelParts = trip.vehicle.model.split(' ');
        const model = modelParts.length > 0 ? modelParts[0] : 'Autre';
        types.add(model);
      }
    });
    return Array.from(types);
  }, [trips]);

  /* ===================== FETCH ===================== */
  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.trim()) return null;
      return JSON.parse(text);
    } catch (e) {
      console.log("Fetch error:", e);
      return null;
    }
  };

  const fetchTrips = async () => {
    setLoadingTrips(true);
    const json = await safeFetchJson("http://10.0.2.2:8080/rides");

    if (Array.isArray(json?.rides)) {
      const fetchedTrips = json.rides.map((r: any) => ({
        id: String(r.id),
        departure: r.departure ?? "",
        arrival: r.arrival ?? "",
        date: r.date ?? "",
        time: r.time ?? "",
        price: Number(r.price ?? 0),
        meetingPoints: Array.isArray(r.meetingPoints) ? r.meetingPoints : [],
        hasRated: r.hasRated ?? false,
        driver_id: r.driver?.id ?? 0,
        driver: {
          name: r.driver?.name ?? "Driver",
          rating: Number(r.driver?.rating ?? 4.7),
          avatar: r.driver?.avatar ?? "",
          phone: r.driver?.phone ?? null,
        },
        vehicle: {
          model: r.vehicle?.model ?? "Car",
          plate: r.vehicle?.immatriculation ?? "",
          totalSeats: Number(r.vehicle?.nombre_places ?? 4),
          availableSeats: Number(r.vehicle?.availableSeats ?? 1),
        },
      }));
      
      setTrips(fetchedTrips);
      
      if (fetchedTrips.length > 0) {
        const prices = fetchedTrips.map((t: Trip) => t.price);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const avgPrice = Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
        
        setPriceStats({
          min: minPrice,
          max: maxPrice,
          avg: avgPrice
        });
        setFilters(prev => ({ ...prev, priceRange: [minPrice, maxPrice], maxPrice }));
      }
    } else {
      setTrips([]);
    }
    setLoadingTrips(false);
  };

  const fetchOffers = async () => {
    setLoadingOffers(true);
    const json = await safeFetchJson("http://10.0.2.2:8080/offers");
    if (Array.isArray(json?.offers)) {
      setOffers(json.offers);
    } else {
      setOffers([]);
    }
    setLoadingOffers(false);
  };

  useEffect(() => {
    fetchTrips();
    fetchOffers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setTripPage(1);
    setOfferPage(1);
    await Promise.all([fetchTrips(), fetchOffers()]);
    setRefreshing(false);
  };

  /* ===================== GESTION DU MODAL DE FILTRE ===================== */
  const openFilterModal = () => {
    setTempFilters({...filters});
    setFilterVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeFilterModal = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setFilterVisible(false));
  };

  const applyFilters = () => {
    setFilters({...tempFilters});
    setTripPage(1);
    setOfferPage(1);
    closeFilterModal();
  };

  const resetFilters = () => {
    const resetOptions: FilterOptions = {
      sortType: "none",
      onlyAvailable: false,
      priceRange: [priceStats.min, priceStats.max],
      maxPrice: priceStats.max,
      departureFilter: "",
      arrivalFilter: "",
      minRating: 0,
      selectedVehicleTypes: [],
    };
    setTempFilters({...resetOptions});
    setFilters({...resetOptions});
    setSearchText("");
    setTripPage(1);
    setOfferPage(1);
    closeFilterModal();
  };

  const toggleVehicleType = (type: string) => {
    setTempFilters(prev => {
      const selected = prev.selectedVehicleTypes.includes(type)
        ? prev.selectedVehicleTypes.filter(t => t !== type)
        : [...prev.selectedVehicleTypes, type];
      return { ...prev, selectedVehicleTypes: selected };
    });
  };

  /* ===================== FILTRAGE AMÉLIORÉ ===================== */
  const filteredTrips = useMemo(() => {
    try {
      let result = [...trips];
      const q = searchText.toLowerCase().trim();

      if (q) {
        result = result.filter(
          (t) =>
            (t.departure?.toLowerCase() || '').includes(q) ||
            (t.arrival?.toLowerCase() || '').includes(q) ||
            (t.driver?.name?.toLowerCase() || '').includes(q)
        );
      }

      if (filters.onlyAvailable) {
        result = result.filter((t) => (t.vehicle?.availableSeats || 0) > 0);
      }

      result = result.filter(
        (t) => t.price >= filters.priceRange[0] && t.price <= filters.priceRange[1]
      );

      if (filters.departureFilter) {
        result = result.filter((t) =>
          (t.departure?.toLowerCase() || '').includes(filters.departureFilter.toLowerCase())
        );
      }

      if (filters.arrivalFilter) {
        result = result.filter((t) =>
          (t.arrival?.toLowerCase() || '').includes(filters.arrivalFilter.toLowerCase())
        );
      }

      if (filters.minRating > 0) {
        result = result.filter((t) => (t.driver?.rating || 0) >= filters.minRating);
      }

      if (filters.selectedVehicleTypes.length > 0) {
        result = result.filter((t) => {
          const vehicleModel = t.vehicle?.model?.split(' ')[0] || '';
          return filters.selectedVehicleTypes.some(type => 
            vehicleModel.toLowerCase().includes(type.toLowerCase())
          );
        });
      }

      if (filters.sortType === "price") {
        result.sort((a, b) => a.price - b.price);
      } else if (filters.sortType === "date") {
        result.sort(
          (a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime()
        );
      } else if (filters.sortType === "rating") {
        result.sort((a, b) => (b.driver?.rating || 0) - (a.driver?.rating || 0));
      }

      return result;
    } catch (error) {
      console.error("Error filtering trips:", error);
      return [];
    }
  }, [searchText, trips, filters]);

  const filteredOffers = useMemo(() => {
    try {
      const q = searchText.toLowerCase().trim();
      if (!q) return offers;
      return offers.filter(
        (o) => 
          (o.car_info?.toLowerCase() || '').includes(q) || 
          (o.message?.toLowerCase() || '').includes(q)
      );
    } catch (error) {
      console.error("Error filtering offers:", error);
      return [];
    }
  }, [searchText, offers]);

  const paginatedTrips = useMemo(() => {
    return filteredTrips.slice(0, tripPage * PAGE_SIZE);
  }, [filteredTrips, tripPage]);

  const paginatedOffers = useMemo(() => {
    return filteredOffers.slice(0, offerPage * PAGE_SIZE);
  }, [filteredOffers, offerPage]);

  const getMapsDirectionUrl = (from: string, to: string) =>
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;

  /* ===================== HANDLER RATING ===================== */
  const openRatingScreen = async (trip: Trip) => {
    if (trip.hasRated) return;
    const token = await AsyncStorage.getItem("token");
    if (!token) return;
    setRatingToken(token);
    setSelectedTripForRating(trip);
  };

  /* ===================== NOUVEAUX HANDLERS POUR ACTIONS RAPIDES AVEC DÉFILEMENT ===================== */
  
  // Fonction pour faire défiler vers la section des trajets
  const scrollToTripsSection = () => {
    if (tripsSectionRef.current && scrollViewRef.current) {
      // Mesurer la position de la section des trajets
      tripsSectionRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          // Faire défiler avec un offset pour ne pas coller au bord
          scrollViewRef.current?.scrollTo({ y: y - 80, animated: true });
        },
        () => {
          // Fallback: utiliser scrollTo avec une valeur approximative
          scrollViewRef.current?.scrollTo({ y: 400, animated: true });
        }
      );
    } else {
      // Fallback simple
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }
  };

  // Fonction pour faire défiler vers la section des offres
  const scrollToOffersSection = () => {
    if (offersSectionRef.current && scrollViewRef.current) {
      // Mesurer la position de la section des offres
      offersSectionRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          // Faire défiler avec un offset pour ne pas coller au bord
          scrollViewRef.current?.scrollTo({ y: y - 80, animated: true });
        },
        () => {
          // Fallback: utiliser scrollTo avec une valeur approximative
          scrollViewRef.current?.scrollTo({ y: 800, animated: true });
        }
      );
    } else {
      // Fallback simple
      scrollViewRef.current?.scrollTo({ y: 800, animated: true });
    }
  };

  // Fonction pour rechercher un trajet (avec défilement)
  const handleSearchTrip = () => {
    // Si aucun trajet n'est disponible, afficher un message
    if (filteredTrips.length === 0) {
      Alert.alert(
        t("noTrips") || "Aucun trajet",
        t("noTripsMessage") || "Aucun trajet disponible pour le moment",
        [{ text: t("ok") || "OK" }]
      );
      return;
    }
    
    // Faire défiler vers la section des trajets
    scrollToTripsSection();
    
    // Optionnel: afficher un petit toast ou feedback
    // Vous pouvez ajouter un ToastMessage ici si vous avez le composant
  };

  // Fonction pour voir les offres (avec défilement)
  const handleViewOffers = () => {
    // Si aucune offre n'est disponible, afficher un message
    if (filteredOffers.length === 0) {
      Alert.alert(
        t("noOffers") || "Aucune offre",
        t("noOffersMessage") || "Aucune offre disponible pour le moment",
        [{ text: t("ok") || "OK" }]
      );
      return;
    }
    
    // Faire défiler vers la section des offres
    scrollToOffersSection();
  };

  /* ===================== RENDER ===================== */
  const renderTrip = ({ item }: { item: Trip }) => {
    if (!item) return null;
    
    return (
      <View style={styles.card}>
        <Text style={styles.route}>
          {item.departure || ''} → {item.arrival || ''}
        </Text>

        <View style={styles.driverRow}>
          <Image
            source={{ uri: item.driver?.avatar || "https://via.placeholder.com/80" }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.driver}>{item.driver?.name || ''}</Text>
            <View style={styles.ratingContainer}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{(item.driver?.rating || 0).toFixed(1)}</Text>
            </View>
            <Text style={styles.smallText}>
              {item.vehicle?.model || ''} • {item.vehicle?.plate || ''}
            </Text>
          </View>

          {userType === "passenger" && (
            <TouchableOpacity
              style={[
                styles.ratingBadge,
                { backgroundColor: item.hasRated ? "#D1FAE5" : "#bcb7a3" },
              ]}
              onPress={() => openRatingScreen(item)}
            >
              <Text style={{ fontSize: 12, fontWeight: "700" }}>
                {item.hasRated ? "✅ " + (t("rated") || 'Noté') : "⭐ " + (t("rateTrip") || 'Noter')}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.qrContainer}
            onPress={() => Linking.openURL(getMapsDirectionUrl(item.departure || '', item.arrival || ''))}
          >
            <QRCode value={getMapsDirectionUrl(item.departure || '', item.arrival || '')} size={56} />
            <Text style={styles.qrHint}>{t("tripLabel") || 'Trajet'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.info}>
          <Calendar size={14} /> {item.date || ''}
        </Text>

        <View style={styles.tripBottomRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.info}>
              <Clock size={14} /> {item.time || ''}
            </Text>

            <Text style={styles.info}>
              <DollarSign size={14} /> {item.price || 0} Ar
            </Text>
            
            <Text style={styles.smallText}>
              <Users size={14} /> {item.vehicle?.availableSeats || 0}/{item.vehicle?.totalSeats || 0} {t("seats") || 'places'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bookChips}
            onPress={() => onBookTrip?.(item, null, 1)}
          >
            <Text style={styles.bookChipsText}>{t("book") || 'Réserver'}</Text>
          </TouchableOpacity>
        </View>

        {item.driver?.phone && (
          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: "#1b2a52" }]}
            onPress={() => Linking.openURL(`tel:${item.driver.phone}`)}
          >
            <Text style={styles.bookText}>{t("callDriver") || 'Appeler'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ===================== RENDER OFFER =====================
  const renderOffer = ({ item }: { item: Offer }) => {
    if (!item) return null;
    
    const trip = trips.find((t) => t.id === String(item.ride_request_id));
    if (!trip) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.route}>
          {t("offerFor") || 'Offre pour'} {trip.departure || ''} → {trip.arrival || ''}
        </Text>

        <View style={styles.offerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.info}>
              <Car size={14} /> {item.car_info || ''}
            </Text>
            <Text style={styles.info}>
              <Users size={14} /> {item.seats_offered || 0} {t("seats") || 'places'}
            </Text>
            <Text style={styles.info}>
              <DollarSign size={14} /> {item.price_per_seat || 0} Ar
            </Text>
          </View>

          <TouchableOpacity
            style={styles.bookChip}
            onPress={() => onBookTrip?.(trip, item, Number(item.seats_offered || 1))}
          >
            <Text style={styles.bookChipText}>{t("book") || 'Réserver'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ===================== RENDER FILTER CHIP =====================
  const renderFilterChip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      {/* POPUP VITA MALAGASY */}
      <PopUpRatingScreen
        visible={showVitaPopup}
        onClose={() => setShowVitaPopup(false)}
        onRatingSubmit={handleRatingSubmit}
        userType="passenger"
        userId={userId}
      />

      <Header title="MiaraGo" onNotifications={onNotifications} onProfileClick={onProfileClick} />

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B7280" style={{ marginRight: 8 }} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("searchPlaceholder") || 'Rechercher...'}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, filters.sortType !== "none" && { backgroundColor: "#065F46" }]}
          onPress={openFilterModal}
        >
          <Filter size={20} color="#fff" />
          {filters.sortType !== "none" && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Filtres actifs sous forme de chips */}
      {(filters.sortType !== "none" || filters.onlyAvailable || filters.minRating > 0 || filters.selectedVehicleTypes.length > 0) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersScroll}>
          <View style={styles.activeFiltersContainer}>
            {filters.sortType !== "none" && (
              renderFilterChip(
                filters.sortType === "price" ? "💰 Prix" : 
                filters.sortType === "date" ? "📅 Date" : "⭐ Note",
                true,
                () => setFilters(prev => ({ ...prev, sortType: "none" }))
              )
            )}
            {filters.onlyAvailable && (
              renderFilterChip("✅ Disponible", true, () => 
                setFilters(prev => ({ ...prev, onlyAvailable: false }))
              )
            )}
            {filters.minRating > 0 && (
              renderFilterChip(`⭐ ${filters.minRating}+`, true, () => 
                setFilters(prev => ({ ...prev, minRating: 0 }))
              )
            )}
            {filters.selectedVehicleTypes.map((type, index) => (
              renderFilterChip(type, true, () => 
                setFilters(prev => ({ 
                  ...prev, 
                  selectedVehicleTypes: prev.selectedVehicleTypes.filter(t => t !== type) 
                }))
              )
            ))}
          </View>
        </ScrollView>
      )}

      {/* ACTIONS RAPIDES POUR PASSAGER - AMÉLIORÉES AVEC DÉFILEMENT */}
      <View style={styles.quickActionsSection}>
  <View style={styles.quickActionsHeader}>
    <Text style={styles.quickActionsTitle}>{t("quickActions")}</Text>
    <Text style={styles.quickActionsHint}>
      {filteredTrips.length} {t("tripsCount")} • {filteredOffers.length} {t("offersCount")}
    </Text>
  </View>

  <View style={styles.quickActionsRow}>
    <TouchableOpacity
      style={styles.quickActionItem}
      activeOpacity={0.7}
      onPress={handleSearchTrip}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: "#ECFDF5" }]}>
        <Compass size={24} color="#047857" />
      </View>
      <Text style={styles.quickActionLabel}>{t("searchTrip")}</Text>
      <Text style={styles.quickActionCount}>{filteredTrips.length} {t("tripsCount")}</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.quickActionItem}
      activeOpacity={0.7}
      onPress={handleViewOffers}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: "#bcb7a3" }]}>
        <Rocket size={24} color="#3b342f" />
      </View>
      <Text style={styles.quickActionLabel}>{t("offers")}</Text>
      <Text style={styles.quickActionCount}>{filteredOffers.length} {t("offersCount")}</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.quickActionItem}
      activeOpacity={0.7}
      onPress={() => {
        setSelectedRideRequestId(1);
        setRideRequestModalVisible(true);
      }}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: "#EFF6FF" }]}>
        <FileText size={24} color="#1b2a52" />
      </View>
      <Text style={styles.quickActionLabel}>{t("rideRequests")}</Text>
      <Text style={styles.quickActionCount}>{t("newBadge")}</Text>
    </TouchableOpacity>
  </View>
   </View>

      {/* ScrollView principale avec ref pour le défilement */}
      <ScrollView
        ref={scrollViewRef}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION TRAJETS - AVEC REF POUR LE DÉFILEMENT */}
        <View 
          ref={tripsSectionRef}
          onLayout={(event) => {
            // Enregistrer la position Y de la section des trajets
            const layout = event.nativeEvent.layout;
            setTripsSectionY(layout.y);
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("availableTrips") || 'Trajets disponibles'} ({filteredTrips.length})
            </Text>
            {paginatedTrips.length < filteredTrips.length && (
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => setTripPage((p) => p + 1)}
              >
                <Text style={styles.seeMoreText}>{t("seeMore") || 'Voir plus'}</Text>
                <ChevronRight size={16} color="#047857" />
              </TouchableOpacity>
            )}
          </View>

          {loadingTrips && filteredTrips.length === 0 ? (
            <Text style={styles.loadingText}>{t("loading") || "Chargement..."}</Text>
          ) : filteredTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <Compass size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>{t("noTripsFound") || "Aucun trajet trouvé"}</Text>
              <Text style={styles.emptyStateSubtext}>{t("tryAdjustingFilters") || "Essayez d'ajuster vos filtres"}</Text>
            </View>
          ) : (
            <FlatList 
              data={paginatedTrips} 
              keyExtractor={(i) => i?.id || Math.random().toString()} 
              renderItem={renderTrip} 
              scrollEnabled={false} 
            />
          )}
        </View>

        {/* SECTION OFFRES - AVEC REF POUR LE DÉFILEMENT */}
        <View 
          ref={offersSectionRef}
          onLayout={(event) => {
            // Enregistrer la position Y de la section des offres
            const layout = event.nativeEvent.layout;
            setOffersSectionY(layout.y);
          }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t("offers") || 'Offres'} ({filteredOffers.length})
            </Text>
            {paginatedOffers.length < filteredOffers.length && (
              <TouchableOpacity 
                style={styles.seeMoreButton}
                onPress={() => setOfferPage((p) => p + 1)}
              >
                <Text style={styles.seeMoreText}>{t("seeMore") || 'Voir plus'}</Text>
                <ChevronRight size={16} color="#047857" />
              </TouchableOpacity>
            )}
          </View>

          {loadingOffers && filteredOffers.length === 0 ? (
            <Text style={styles.loadingText}>{t("loading") || "Chargement..."}</Text>
          ) : filteredOffers.length === 0 ? (
            <View style={styles.emptyState}>
              <Rocket size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>{t("noOffersFound") || "Aucune offre trouvée"}</Text>
              <Text style={styles.emptyStateSubtext}>{t("checkBackLater") || "Revenez plus tard"}</Text>
            </View>
          ) : (
            <FlatList 
              data={paginatedOffers} 
              keyExtractor={(i) => String(i?.id || Math.random())} 
              renderItem={renderOffer} 
              scrollEnabled={false} 
            />
          )}
        </View>
        
        {/* Espace en bas */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {rideRequestModalVisible && (
        <RideRequestScreen
          userId={userId}
          rideRequestId={selectedRideRequestId || undefined}
          onBack={() => setRideRequestModalVisible(false)}
        />
      )}

      {/* FILTER MODAL */}
      <Modal visible={filterVisible} transparent animationType="none">
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeFilterModal} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.handleBar} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.filterTitle}>{t("filterSort") || 'Filtrer et trier'}</Text>
              <TouchableOpacity onPress={closeFilterModal}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Tri */}
              <Text style={styles.filterSectionTitle}>{t("sortBy") || 'Trier par'}</Text>
              <View style={styles.filterOptionsRow}>
                {[
                  { value: "price", label: "💰 " + (t("sortByPrice") || 'Prix') },
                  { value: "date", label: "📅 " + (t("sortByDate") || 'Date') },
                  { value: "rating", label: "⭐ " + (t("sortByRating") || 'Note') },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOptionPill,
                      tempFilters.sortType === option.value && styles.filterOptionPillActive,
                    ]}
                    onPress={() => setTempFilters(prev => ({ ...prev, sortType: option.value as any }))}
                  >
                    <Text style={[
                      styles.filterOptionPillText,
                      tempFilters.sortType === option.value && styles.filterOptionPillTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Disponibilité */}
              <TouchableOpacity
                style={styles.filterRow}
                onPress={() => setTempFilters(prev => ({ ...prev, onlyAvailable: !prev.onlyAvailable }))}
              >
                <Text>{t("onlyAvailable") || 'Uniquement disponibles'}</Text>
                <View style={[styles.checkbox, tempFilters.onlyAvailable && styles.checkboxActive]}>
                  {tempFilters.onlyAvailable && <Text style={{ color: "#fff" }}>✓</Text>}
                </View>
              </TouchableOpacity>

              {/* Prix min */}
              <Text style={styles.filterSectionTitle}>{t("priceRange") || 'Fourchette de prix'}</Text>
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceLabel}>{tempFilters.priceRange[0].toLocaleString()} Ar</Text>
                <Text style={styles.priceLabel}>{tempFilters.priceRange[1].toLocaleString()} Ar</Text>
              </View>
              
              {/* Note minimale */}
              <Text style={styles.filterSectionTitle}>{t("minRating") || 'Note minimum'}</Text>
              <View style={styles.ratingButtons}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      tempFilters.minRating >= rating && styles.ratingButtonActive,
                    ]}
                    onPress={() => setTempFilters(prev => ({ ...prev, minRating: rating }))}
                  >
                    <Star 
                      size={16} 
                      color={tempFilters.minRating >= rating ? "#fff" : "#3b342f"} 
                      fill={tempFilters.minRating >= rating ? "#fff" : "#3b342f"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Types de véhicules */}
              {vehicleTypes.length > 0 && (
                <>
                  <Text style={styles.filterSectionTitle}>{t("vehicleTypes") || 'Types de véhicules'}</Text>
                  <View style={styles.vehicleTypesContainer}>
                    {vehicleTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.vehicleTypeChip,
                          tempFilters.selectedVehicleTypes.includes(type) && styles.vehicleTypeChipActive,
                        ]}
                        onPress={() => toggleVehicleType(type)}
                      >
                        <Text style={[
                          styles.vehicleTypeChipText,
                          tempFilters.selectedVehicleTypes.includes(type) && styles.vehicleTypeChipTextActive,
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Boutons d'action */}
              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                  <Text style={styles.resetButtonText}>{t("reset") || 'Réinitialiser'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                  <Text style={styles.applyButtonText}>{t("apply") || 'Appliquer'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* RATING MODAL */}
      {selectedTripForRating && (
        <Modal visible transparent animationType="slide">
          <RatingScreen
            rideId={Number(selectedTripForRating.id)}
            reviewerId={userId}
            reviewedId={selectedTripForRating.driver_id}
            token={ratingToken}
            tripUser={{
              id: selectedTripForRating.driver_id,
              nom: selectedTripForRating.driver.name.split(" ")[1] || "",
              prenom: selectedTripForRating.driver.name.split(" ")[0] || "",
              role: "driver",
              phone: selectedTripForRating.driver.phone || "",
            }}
            tripDetails={{
              departure: selectedTripForRating.departure,
              arrival: selectedTripForRating.arrival,
              date: selectedTripForRating.date,
            }}
            onBack={() => setSelectedTripForRating(null)}
            onBonusEarned={(credits) => {
              console.log("Bonus gagné:", credits);
            }}
          />
        </Modal>
      )}
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  // =========================================================
  // 🔹 STYLES POUR LES ACTIONS RAPIDES
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
  quickActionsHint: {
    fontSize: 12,
    color: "#9CA3AF",
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
    borderRadius: 14,
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
  quickActionCount: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  
  // États vides
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  loadingText: {
    textAlign: "center",
    color: "#6B7280",
    marginVertical: 20,
  },

  searchWrapper: { 
    flexDirection: "row", 
    marginHorizontal: 16, 
    marginTop: 12, 
    marginBottom: 8, 
    alignItems: "center" 
  },
  searchBox: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    borderRadius: 14, 
    elevation: 3 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 14, 
    color: "#111827", 
    padding: 0 
  },
  filterButton: { 
    marginLeft: 12, 
    backgroundColor: "#047857", 
    padding: 12, 
    borderRadius: 12,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3b342f",
    borderWidth: 2,
    borderColor: "#fff",
  },
  
  // Styles pour les filtres actifs
  activeFiltersScroll: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  activeFiltersContainer: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#047857",
  },
  filterChipText: {
    fontSize: 12,
    color: "#374151",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  // =========================================================
  // 🔹 STYLES POUR L'EN-TÊTE DES SECTIONS
  // =========================================================
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700",
    color: "#111827",
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

  card: { 
    backgroundColor: "#fff", 
    marginHorizontal: 16, 
    marginBottom: 16, 
    borderRadius: 20, 
    padding: 14 
  },
  route: { 
    fontWeight: "700", 
    fontSize: 15 
  },
  driverRow: { 
    flexDirection: "row", 
    marginTop: 12, 
    alignItems: "center", 
    gap: 12 
  },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22 
  },
  driver: { 
    fontWeight: "600" 
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#6B7280",
  },
  smallText: { 
    fontSize: 12, 
    color: "#6B7280",
    marginTop: 2,
  },
  info: { 
    marginTop: 6, 
    fontSize: 13 
  },
  bookButton: { 
    marginTop: 12, 
    backgroundColor: "#047857", 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: "center" 
  },
  bookText: { 
    color: "#fff", 
    fontWeight: "700" 
  },
  qrContainer: { 
    alignItems: "center" 
  },
  qrHint: { 
    fontSize: 10, 
    color: "#6B7280" 
  },
  loadMore: { 
    textAlign: "center", 
    color: "#1d1f23", 
    marginBottom: 16 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.4)", 
    justifyContent: "flex-end" 
  },
  bottomSheet: { 
    backgroundColor: "#fff", 
    padding: 20, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  handleBar: { 
    width: 40, 
    height: 5, 
    backgroundColor: "#D1D5DB", 
    borderRadius: 3, 
    alignSelf: "center", 
    marginBottom: 16 
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterTitle: { 
    fontWeight: "700", 
    fontSize: 18 
  },
  filterSectionTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginTop: 16,
    marginBottom: 12,
    color: "#374151",
  },
  filterOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterOptionPill: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  filterOptionPillActive: {
    backgroundColor: "#047857",
  },
  filterOptionPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  filterOptionPillTextActive: {
    color: "#fff",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#047857",
    borderColor: "#047857",
  },
  priceRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#047857",
  },
  ratingButtons: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  ratingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingButtonActive: {
    backgroundColor: "#047857",
  },
  vehicleTypesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vehicleTypeChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vehicleTypeChipActive: {
    backgroundColor: "#047857",
  },
  vehicleTypeChipText: {
    fontSize: 13,
    color: "#374151",
  },
  vehicleTypeChipTextActive: {
    color: "#fff",
  },
  filterActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  resetButtonText: {
    fontWeight: "600",
    color: "#6B7280",
  },
  applyButton: { 
    flex: 2,
    backgroundColor: "#047857", 
    paddingVertical: 14, 
    borderRadius: 14, 
    alignItems: "center" 
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  // Styles pour les offres
  offerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bookChip: {
    backgroundColor: "#047857",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  bookChipText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  bookChips: {
    backgroundColor: "#047857",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  bookChipsText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  tripBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  ratingBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginRight: 8, 
    alignSelf: "flex-start" 
  },
});

