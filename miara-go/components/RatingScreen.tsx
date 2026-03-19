import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  ToastAndroid,
  Alert,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { Star, User, Calendar, Clock, MapPin, Award, CheckCircle } from "lucide-react-native";

const { width } = Dimensions.get("window");

/* ================== CONFIG ================== */
const API_BASE = "http://10.0.2.2:8080";

/* ================== TYPES ================== */
type UserProfile = {
  id: string;
  nom: string;
  prenom: string;
  phone: string;
  role: "driver" | "passenger";
  avatar?: string;
};

type TripUser = {
  id: string;
  nom: string;
  prenom: string;
  phone?: string;
  role: "driver" | "passenger";
  avatar?: string;
};

type TripDetails = {
  departure: string;
  arrival: string;
  date: string;
  time?: string;
};

type RatingScreenProps = {
  onBack: () => void;
  rideId: number;
  reviewerId: number;
  reviewedId: number;
  token: string;
  tripUser: TripUser;
  tripDetails: TripDetails;
  onBonusEarned?: (credits: number) => void;
};

/* ================== COMPONENT ================== */
const RatingScreen: React.FC<RatingScreenProps> = ({
  onBack,
  rideId,
  reviewerId,
  reviewedId,
  token,
  tripUser,
  tripDetails,
  onBonusEarned,
}) => {
  const { t } = useTranslation();

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hoveredStar, setHoveredStar] = useState<number>(-1);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Animations
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;
  const starScales = useRef(Array.from({ length: 5 }, () => new Animated.Value(1))).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  /* ================== ANIMATIONS D'ENTRÉE ================== */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ================== TOAST ================== */
  const showToast = (msg: string) => {
    Platform.OS === "android"
      ? ToastAndroid.show(msg, ToastAndroid.SHORT)
      : Alert.alert("", msg);
  };

  /* ================== SKELETON ANIMATION ================== */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(skeletonOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  /* ================== LOAD PROFILE ================== */
  const loadProfile = async () => {
    try {
      const localUser = await AsyncStorage.getItem("user");
      if (localUser) setProfile(JSON.parse(localUser));

      const storedToken = await AsyncStorage.getItem("token");
      if (!storedToken) return;

      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${storedToken}`, Accept: "application/json" },
      });

      if (!res.ok) return;

      const data = await res.json();
      const user = data?.user ?? data;
      if (user) {
        setProfile(user);
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }
    } catch (e) {
      console.log("PROFILE ERROR", e);
    } finally {
      setLoadingProfile(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  /* ================== REFRESH ================== */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
  };

  /* ================== PRELOAD EXISTING RATING ================== */
  useEffect(() => {
    const fetchExistingRating = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/ratings?ride_id=${rideId}&reviewer_id=${reviewerId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.length > 0) {
          setRating(Number(data[0].average_score));
          setComment(data[0].comment || "");
        }
      } catch (e) {
        console.log("FETCH EXISTING RATING ERROR", e);
      }
    };
    fetchExistingRating();
  }, [rideId, reviewerId]);

  /* ================== ANIMATION BOUTON ================== */
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /* ================== STAR ================== */
  const onStarPress = (index: number) => {
    animateButton();
    setRating(index + 1);
    
    // Animation de la star
    Animated.sequence([
      Animated.timing(starScales[index], { 
        toValue: 1.5, 
        duration: 150, 
        useNativeDriver: true 
      }),
      Animated.timing(starScales[index], { 
        toValue: 1, 
        duration: 150, 
        useNativeDriver: true 
      }),
    ]).start();

    // Animation de succès pour les notes élevées
    if (index + 1 >= 4 && tripUser.role === "driver") {
      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      successScale.setValue(0);
    }
  };

  /* ================== SUBMIT ================== */
  const submitRating = async () => {
    animateButton();

    if (!rideId || !reviewerId || !reviewedId) {
      showToast(t("invalidRideId"));
      console.log("INVALID IDs:", { rideId, reviewerId, reviewedId });
      return;
    }

    if (rating === 0) {
      showToast(t("chooseRating"));
      return;
    }

    try {
      setSubmitting(true);
      setSubmitted(false);

      const payload = {
        ride_id: rideId,
        reviewer_id: reviewerId,
        reviewed_id: reviewedId,
        average_score: rating,
        comment: comment?.trim() || null,
      };

      console.log("RATING PAYLOAD SENT:", payload);

      const res = await fetch(`${API_BASE}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.log("RATING ERROR:", text);
        throw new Error(text);
      }

      setSubmitted(true);

      if (tripUser.role === "driver" && rating >= 4 && onBonusEarned) {
        onBonusEarned(2);
        showToast(t("bonusEarned"));
        
        // Animation de succès prolongée
        Animated.spring(successScale, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }).start();
        
        setTimeout(() => onBack(), 2000);
      } else {
        showToast(t("thanksForRating"));
        setTimeout(() => onBack(), 1500);
      }

    } catch (e) {
      console.log("SUBMIT RATING ERROR", e);
      showToast(t("ratingError"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ================== RENDER STAR ================== */
  const renderStar = (index: number) => {
    const isActive = index < rating;
    const isHovered = index <= hoveredStar;
    const starColor = isActive || isHovered ? "#F59E0B" : "#E5E7EB";
    const fillColor = isActive || isHovered ? "#F59E0B" : "none";

    return (
      <TouchableOpacity
        key={index}
        onPress={() => onStarPress(index)}
        onPressIn={() => setHoveredStar(index)}
        onPressOut={() => setHoveredStar(-1)}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: starScales[index] }] }}>
          <Star
            size={44}
            color={starColor}
            fill={fillColor}
            strokeWidth={isActive || isHovered ? 1.5 : 1}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  /* ================== SKELETON UI ================== */
  if (loadingProfile) {
    return (
      <LinearGradient
        colors={["#f0fdf4", "#dcfce7"]}
        style={styles.container}
      >
        <Animated.View style={[styles.skeletonCard, { opacity: skeletonOpacity }]} />
      </LinearGradient>
    );
  }

  /* ================== UI ================== */
  return (
    <LinearGradient
      colors={["#f0fdf4", "#dcfce7"]}
      style={styles.container}
    >
      {/* HEADER MODERNE */}
      <LinearGradient
        colors={["#047857", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("rateRide")}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* PROFIL DE L'UTILISATEUR CONNECTÉ */}
          {profile && (
            <View style={styles.profileSection}>
              <LinearGradient
                colors={["#ecfdf5", "#d1fae5"]}
                style={styles.avatarContainer}
              >
                <User size={40} color="#047857" />
              </LinearGradient>
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{profile.prenom} {profile.nom}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>
                    {profile.role === "driver" ? t("driver") : t("passenger")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* SÉPARATEUR */}
          <View style={styles.divider} />

          {/* UTILISATEUR ÉVALUÉ */}
          <View style={styles.ratedUserSection}>
            <Text style={styles.sectionLabel}>{t("youAreRating")}</Text>
            
            <View style={styles.ratedUserCard}>
              <LinearGradient
                colors={["#fef3c7", "#fde68a"]}
                style={styles.ratedAvatar}
              >
                <User size={32} color="#92400E" />
              </LinearGradient>
              
              <View style={styles.ratedInfo}>
                <Text style={styles.ratedName}>
                  {tripUser.prenom} {tripUser.nom}
                </Text>
                <View style={[styles.roleBadge, styles.ratedRoleBadge]}>
                  <Text style={[styles.roleText, styles.ratedRoleText]}>
                    {tripUser.role === "driver" ? t("driver") : t("passenger")}
                  </Text>
                </View>
              </View>
            </View>

            {/* DÉTAILS DU TRAJET */}
            <View style={styles.tripDetails}>
              <View style={styles.tripDetailItem}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.tripDetailText}>
                  {tripDetails.departure} → {tripDetails.arrival}
                </Text>
              </View>
              
              <View style={styles.tripDetailRow}>
                <View style={styles.tripDetailItem}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.tripDetailSmall}>{tripDetails.date}</Text>
                </View>
                
                {tripDetails.time && (
                  <View style={styles.tripDetailItem}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.tripDetailSmall}>{tripDetails.time}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* STARS AVEC INDICATEUR */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>
              {rating === 0 
                ? t("tapToRate") 
                : rating === 1 ? t("poor") 
                : rating === 2 ? t("fair") 
                : rating === 3 ? t("good") 
                : rating === 4 ? t("veryGood") 
                : t("excellent")}
            </Text>
            
            <View style={styles.stars}>
              {[0, 1, 2, 3, 4].map((i) => renderStar(i))}
            </View>

            {/* BADGE DE NOTE ÉLEVÉE */}
            {rating >= 4 && tripUser.role === "driver" && (
              <Animated.View 
                style={[
                  styles.highRatingBadge,
                  { transform: [{ scale: successScale }] }
                ]}
              >
                <Award size={16} color="#92400E" />
                <Text style={styles.highRatingText}>
                  {t("driverBonus")}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* COMMENTAIRE */}
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>{t("commentOptional")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("shareExperience")}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

          {/* INDICATEUR DE SAISIE */}
          {comment.length > 0 && (
            <Text style={styles.charCount}>
              {comment.length} / 500
            </Text>
          )}

          {/* BOUTON DE SOUMISSION */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                rating === 0 && styles.submitButtonDisabled
              ]}
              onPress={submitRating}
              disabled={submitting || rating === 0}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : submitted ? (
                <View style={styles.submitSuccess}>
                  <CheckCircle size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>{t("submitted")}</Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>
                  {rating === 0 ? t("selectRating") : t("submitRating")}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* NOTE EXPLICATIVE */}
          {rating === 0 && (
            <Text style={styles.hint}>
              {t("ratingHint")}
            </Text>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default RatingScreen;

/* ================== STYLES AMÉLIORÉS ================== */
const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: "white",
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: "#ffffff",
    margin: 20,
    marginTop: 10,
    borderRadius: 30,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#047857",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  profileInfo: {
    flex: 1,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  roleBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },

  ratedUserSection: {
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  ratedUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },

  ratedAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  ratedInfo: {
    flex: 1,
  },

  ratedName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  ratedRoleBadge: {
    backgroundColor: "#fef3c7",
  },

  ratedRoleText: {
    color: "#92400E",
  },

  tripDetails: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 16,
  },

  tripDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  tripDetailText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },

  tripDetailRow: {
    flexDirection: "row",
    gap: 16,
  },

  tripDetailSmall: {
    fontSize: 13,
    color: "#6B7280",
  },

  ratingContainer: {
    alignItems: "center",
    marginVertical: 24,
  },

  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#047857",
    marginBottom: 12,
  },

  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  highRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    marginTop: 16,
    gap: 8,
  },

  highRatingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },

  commentContainer: {
    marginBottom: 16,
  },

  commentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
  },

  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    marginBottom: 16,
  },

  submitButton: {
    backgroundColor: "#047857",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#047857",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0.1,
  },

  submitSuccess: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  hint: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 12,
  },

  skeletonCard: {
    height: 500,
    margin: 20,
    borderRadius: 30,
    backgroundColor: "#E5E7EB",
  },
});
