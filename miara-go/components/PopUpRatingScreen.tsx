// PopUpRatingScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { Heart, Star, X, Award } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface PopUpRatingScreenProps {
  visible: boolean;
  onClose: () => void;
  onRatingSubmit?: (rating: number, comment: string) => void;
  userType?: "driver" | "passenger";
  userId?: number;
}

interface VitaMessage {
  title: string;
  message: string;
  icon: string;
}

export default function PopUpRatingScreen({
  visible,
  onClose,
  onRatingSubmit,
  userType = "driver",
  userId,
}: PopUpRatingScreenProps) {
  const { t } = useTranslation();
  
  const [vitaRating, setVitaRating] = useState(0);
  const [vitaComment, setVitaComment] = useState("");
  
  // Animations
  const popupScale = useRef(new Animated.Value(0)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const starScales = useRef(Array.from({ length: 5 }, () => new Animated.Value(1))).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const heartBeat = useRef(new Animated.Value(1)).current;
  
  // Messages du popup
  const vitaMessages: VitaMessage[] = [
    {
      title: t("vitaPopup.title") || "Soutenez l'économie locale ! 🇲🇬",
      message: t("vitaPopup.message") || "En choisissant MiaraGo, vous contribuez au développement du transport malgache. Chaque trajet partagé fait vivre notre communauté !",
      icon: "🌿",
    },
    {
      title: t("vitaPopup.titleMg") || "Fiaraha-miasa ho an'i Madagasikara ! 🇲🇬",
      message: t("vitaPopup.messageMg") || "MiaraGo dia manampy ny toekarena eto an-toerana. Misaotra anao nisafidy ny fitaterana malagasy !",
      icon: "🤝",
    },
    {
      title: t("vitaPopup.titleGreen") || "Ensemble pour un Madagascar plus vert ! 🌱",
      message: t("vitaPopup.messageGreen") || "Moins de voitures, moins de pollution. Vous contribuez à un avenir plus durable pour notre île.",
      icon: "🌍",
    },
  ];

  const [currentVitaMessage, setCurrentVitaMessage] = useState<VitaMessage>(vitaMessages[0]);

  // Sélectionner un message aléatoire au montage
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * vitaMessages.length);
    setCurrentVitaMessage(vitaMessages[randomIndex]);
  }, []);

  // Animation d'entrée
  useEffect(() => {
    if (visible) {
      animatePopupIn();
    } else {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setVitaRating(0);
    setVitaComment("");
    popupScale.setValue(0);
    popupOpacity.setValue(0);
  };

  const animatePopupIn = () => {
    Animated.parallel([
      Animated.spring(popupScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Animation de battement de cœur
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeat, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(heartBeat, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animatePopupOut = () => {
    Animated.parallel([
      Animated.spring(popupScale, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      heartBeat.stopAnimation();
      onClose();
    });
  };

  const animateStar = (index: number) => {
    Animated.sequence([
      Animated.timing(starScales[index], {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(starScales[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRating = (rating: number) => {
    setVitaRating(rating);
    animateStar(rating - 1);
    
    // Message personnalisé selon la note
    if (rating === 5) {
      Alert.alert(
        t("vitaPopup.rating5Title") || "Misaotra betsaka ! 🙏",
        t("vitaPopup.rating5Message") || "Votre soutien nous touche beaucoup. Ensemble, faisons grandir MiaraGo !",
        [{ text: t("vitaPopup.rating5Button") || "Merci !" }]
      );
    }
  };

  const handleSubmit = async () => {
    if (vitaRating === 0) {
      Alert.alert(
        t("vitaPopup.ratingError") || "Notez votre expérience",
        t("vitaPopup.ratingErrorDesc") || "Dites-nous ce que vous pensez de MiaraGo !"
      );
      return;
    }
    
    // Animation du bouton
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
    
    try {
      // Sauvegarder le rating localement
      await AsyncStorage.setItem("hasSeenVitaPopup", "true");
      await AsyncStorage.setItem("vitaRating", vitaRating.toString());
      if (vitaComment) {
        await AsyncStorage.setItem("vitaComment", vitaComment);
      }
      
      // Envoyer au backend si disponible
      try {
        await fetch("http://10.0.2.2:8080/vita-feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: vitaRating,
            comment: vitaComment,
            user_type: userType,
            user_id: userId,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.log("Feedback save error", e);
      }
      
      // Appeler le callback parent
      if (onRatingSubmit) {
        onRatingSubmit(vitaRating, vitaComment);
      }
      
      // Afficher un message de remerciement
      Alert.alert(
        t("vitaPopup.thanksTitle") || "Misaotra ! 🙏",
        t("vitaPopup.thanksMessage") || "Votre soutien à l'économie malagasy est précieux. MiaraGo continuera à vous servir avec cœur.",
        [{ text: t("vitaPopup.thanksButton") || "MiaraGo 💚" }]
      );
      
      animatePopupOut();
    } catch (error) {
      console.log("Error saving rating", error);
      animatePopupOut();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            {
              transform: [{ scale: popupScale }],
              opacity: popupOpacity,
            }
          ]}
        >
          {/* Bouton fermeture */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={animatePopupOut}
          >
            <X size={20} color="#6B7280" />
          </TouchableOpacity>

          {/* Icône animée */}
          <Animated.View style={{ transform: [{ scale: heartBeat }] }}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconEmoji}>{currentVitaMessage.icon}</Text>
              <Heart size={50} color="#EF4444" fill="#FEE2E2" />
            </View>
          </Animated.View>

          {/* Titre */}
          <Text style={styles.title}>{currentVitaMessage.title}</Text>
          
          {/* Message */}
          <Text style={styles.message}>{currentVitaMessage.message}</Text>

          {/* Section rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>
              {t("vitaPopup.ratingLabel") || "Comment soutenez-vous MiaraGo ?"}
            </Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRating(star)}
                  activeOpacity={0.7}
                >
                  <Animated.View style={{ transform: [{ scale: starScales[star - 1] }] }}>
                    <Star
                      size={36}
                      color={star <= vitaRating ? "#F59E0B" : "#D1D5DB"}
                      fill={star <= vitaRating ? "#F59E0B" : "none"}
                    />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Commentaire optionnel */}
          <TextInput
            style={styles.commentInput}
            placeholder={t("vitaPopup.ratingPlaceholder") || "Partagez votre expérience avec MiaraGo..."}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={vitaComment}
            onChangeText={setVitaComment}
          />

          {/* Bouton de soutien */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                vitaRating > 0 && styles.submitButtonActive
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Heart size={18} color="#fff" fill="#fff" />
              <Text style={styles.submitButtonText}>
                {vitaRating > 0 
                  ? (t("vitaPopup.supportEconomy") || "Soutenir l'économie malagasy")
                  : (t("vitaPopup.rateUs") || "Noter MiaraGo")}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Message bonus pour les notes élevées */}
          {vitaRating >= 4 && (
            <View style={styles.bonusMessage}>
              <Award size={14} color="#F59E0B" />
              <Text style={styles.bonusText}>
                {t("vitaPopup.bonusMessage") || "Merci ! +2 crédits offerts pour votre soutien à l'économie locale 🎉"}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    width: width - 48,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  iconEmoji: {
    fontSize: 40,
    position: "absolute",
    top: -10,
    zIndex: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#047857",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  ratingSection: {
    width: "100%",
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  commentInput: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    color: "#111827",
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#9CA3AF",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  submitButtonActive: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  bonusMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    marginTop: 16,
    gap: 8,
  },
  bonusText: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
  },
});
