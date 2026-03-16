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
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

/* ================== CONFIG ================== */
const API_BASE = "http://10.0.2.2:8080";

/* ================== TYPES ================== */
type UserProfile = {
  id: string;
  nom: string;
  prenom: string;
  phone: string;
  role: "driver" | "passenger";
};

type TripUser = {
  id: string;
  nom: string;
  prenom: string;
  phone?: string;
  role: "driver" | "passenger";
};

type TripDetails = {
  departure: string;
  arrival: string;
  date: string;
};

type RatingScreenProps = {
  onBack: () => void;
  rideId: number;       // ✅ number
  reviewerId: number;   // ✅ number
  reviewedId: number;   // ✅ number
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

  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;
  const starScales = useRef(Array.from({ length: 5 }, () => new Animated.Value(1))).current;

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

  /* ================== STAR ================== */
  const onStarPress = (index: number) => {
    setRating(index + 1);
    Animated.sequence([
      Animated.timing(starScales[index], { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(starScales[index], { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  /* ================== SUBMIT ================== */
  const submitRating = async () => {
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

      if (tripUser.role === "driver" && rating >= 4 && onBonusEarned) {
        onBonusEarned(2);
        showToast(t("bonusEarned"));
      } else {
        showToast(t("thanksForRating"));
      }

      onBack();
    } catch (e) {
      console.log("SUBMIT RATING ERROR", e);
      showToast(t("ratingError"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ================== SKELETON UI ================== */
  if (loadingProfile) {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.skeletonCard, { opacity: skeletonOpacity }]} />
      </View>
    );
  }

  /* ================== UI ================== */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("rateRide")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />
        }
      >
        <View style={styles.card}>
          {/* PROFIL */}
          {profile && (
            <View style={styles.profileBox}>
              <Feather name="user" size={36} color="#047857" />
              <Text style={styles.name}>{profile.prenom} {profile.nom}</Text>
              <Text style={styles.role}>{profile.role === "driver" ? t("driver") : t("passenger")}</Text>
            </View>
          )}

          {/* UTILISATEUR ÉVALUÉ */}
          <View style={styles.profileBox}>
            <Text style={styles.section}>{t("youAreRating")}</Text>
            <Text style={styles.name}>{tripUser.prenom} {tripUser.nom}</Text>
            <Text style={styles.role}>{tripUser.role === "driver" ? t("driver") : t("passenger")}</Text>
            <Text style={styles.trip}>{tripDetails.departure} → {tripDetails.arrival}</Text>
          </View>

          {/* STARS */}
          <View style={styles.stars}>
            {starScales.map((scale, i) => (
              <TouchableOpacity key={i} onPress={() => onStarPress(i)}>
                <Animated.View style={{ transform: [{ scale }] }}>
                  <Feather name="star" size={38} color={i < rating ? "#FACC15" : "#E5E7EB"} />
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>

          {/* COMMENT */}
          <TextInput
            style={styles.input}
            placeholder={t("commentOptional")}
            multiline
            value={comment}
            onChangeText={setComment}
          />

          {/* BONUS */}
          {tripUser.role === "driver" && rating >= 4 && (
            <View style={styles.bonus}>
              <Text style={styles.bonusText}>{t("driverBonus")}</Text>
            </View>
          )}

          {/* SUBMIT */}
          <TouchableOpacity style={styles.button} onPress={submitRating} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("send")}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default RatingScreen;

/* ================== STYLES ================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  header: { backgroundColor: "#047857", padding: 18, flexDirection: "row", alignItems: "center" },
  headerTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 17, fontWeight: "700" },
  card: { backgroundColor: "#fff", margin: 16, padding: 24, borderRadius: 26 },
  profileBox: { alignItems: "center", marginBottom: 18 },
  section: { fontSize: 13, color: "#9CA3AF" },
  name: { fontSize: 17, fontWeight: "700" },
  role: { color: "#047857", fontWeight: "600" },
  trip: { color: "#6B7280", marginTop: 6 },
  stars: { flexDirection: "row", justifyContent: "center", marginVertical: 22 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 18, padding: 14, minHeight: 90 },
  bonus: { backgroundColor: "#FEF3C7", padding: 12, borderRadius: 16, marginVertical: 16 },
  bonusText: { color: "#92400E", fontWeight: "600", textAlign: "center" },
  button: { backgroundColor: "#047857", paddingVertical: 16, borderRadius: 20, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  skeletonCard: { height: 380, margin: 16, borderRadius: 26, backgroundColor: "#E5E7EB" },
});