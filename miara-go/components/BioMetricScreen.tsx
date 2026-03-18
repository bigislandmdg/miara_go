import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
} from "react-native"
import * as LocalAuthentication from "expo-local-authentication"
import { Fingerprint, ScanFace, ArrowLeft, Shield, CheckCircle } from "lucide-react-native"
import { ToastMessage } from "../components/ToastMessage"
import { useTranslation } from "react-i18next"
import { useLanguage } from "../providers/LanguageProvider"
import { Logo } from "./ui/logo"
import { LinearGradient } from "expo-linear-gradient"

const { width, height } = Dimensions.get("window")

interface BioMetricScreenProps {
  phone?: string
  onSuccess: (token: string, user: any) => void
  onCancel: () => void
  deviceId: string
}

export function BioMetricScreen({
  phone,
  onSuccess,
  onCancel,
  deviceId,
}: BioMetricScreenProps) {
  const { t } = useTranslation()

  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState<"face" | "fingerprint" | null>(null)
  const [authenticating, setAuthenticating] = useState(false)
  const [supportedTypes, setSupportedTypes] = useState<
    LocalAuthentication.AuthenticationType[]
  >([])

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const buttonScaleAnim = useRef(new Animated.Value(1)).current

  // 🔹 Vérifier biométrie au mount
  useEffect(() => {
    const checkBiometrics = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()

      if (!compatible || !enrolled) return

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
      setSupportedTypes(types)
    }

    checkBiometrics()

    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const animateModal = () => {
    fadeAnim.setValue(0)
    scaleAnim.setValue(0.9)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const authenticate = async (type: "face" | "fingerprint") => {
    if (authenticating) return
    animateButton()

    try {
      const compatible = await LocalAuthentication.hasHardwareAsync()
      const enrolled = await LocalAuthentication.isEnrolledAsync()

      if (!compatible) {
        ToastMessage.show(t("biometric.notSupported"))
        return
      }

      if (!enrolled) {
        ToastMessage.show(t("biometric.notEnrolled"))
        return
      }

      // 🔹 Vérifie si le type est supporté
      if (
        type === "face" &&
        !supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ) {
        ToastMessage.show(t("biometric.faceUnavailable"))
        return
      }

      if (
        type === "fingerprint" &&
        !supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        ToastMessage.show(t("biometric.fingerprintUnavailable"))
        return
      }

      setModalType(type)
      setModalVisible(true)
      animateModal()
      setAuthenticating(true)

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          type === "face" ? t("scanFace") : t("scanFingerprint"),
        fallbackLabel: t("useOtp"),
        cancelLabel: t("cancel"),
        disableDeviceFallback: false,
      })

      setAuthenticating(false)
      setModalVisible(false)

      if (!result.success) {
        ToastMessage.show(t("failed"))
        return
      }

      // 🔹 Activation biométrie si phone fourni
      if (phone) {
        const res = await fetch(
          "http://10.0.2.2:8080/auth/biometric-enable",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone,
              device_id: deviceId,
            }),
          }
        )

        const data = await res.json()

        if (!data.status) {
          ToastMessage.show(t("enableError"))
          return
        }

        ToastMessage.show(t("enabled"))
      }

      // 🔹 Login biométrique
      const resLogin = await fetch(
        "http://10.0.2.2:8080/auth/biometric-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            device_id: deviceId,
          }),
        }
      )

      const dataLogin = await resLogin.json()

      if (!dataLogin.status) {
        ToastMessage.show(t("loginFailed"))
        return
      }

      ToastMessage.show(t("success"))
      
      // Animation de succès avant de retourner
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onSuccess(dataLogin.token, dataLogin.user)
      })
    } catch (error) {
      console.log("BIOMETRIC ERROR", error)
      ToastMessage.show(t("error"))
      setAuthenticating(false)
      setModalVisible(false)
    }
  }

  const isFaceSupported = supportedTypes.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
  )
  const isFingerprintSupported = supportedTypes.includes(
    LocalAuthentication.AuthenticationType.FINGERPRINT
  )

  return (
    <LinearGradient
      colors={["#f0fdf4", "#dcfce7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Header avec animation */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={22} color="#047857" />
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Content avec animations */}
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim, 
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ] 
          }
        ]}
      >
        <View style={styles.logoWrapper}>
          <Logo fontSize={72} variant="light" />
        </View>
        
        <Text style={styles.title}>{t("title")}</Text>
        <Text style={styles.subtitle}>{t("subtitle")}</Text>

        <View style={styles.biometricInfo}>
          <Shield size={16} color="#047857" />
          <Text style={styles.biometricInfoText}>{t("biometricSecure")}</Text>
        </View>

        {isFaceSupported && (
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => authenticate("face")}
              disabled={authenticating}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#ecfdf5", "#d1fae5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionIconContainer}>
                  <ScanFace size={28} color="#047857" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{t("faceId")}</Text>
                  <Text style={styles.optionDescription}>
                    {t("faceIdDescription")}
                  </Text>
                </View>
                <CheckCircle size={20} color="#10B981" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {isFingerprintSupported && (
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => authenticate("fingerprint")}
              disabled={authenticating}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#ecfdf5", "#d1fae5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionIconContainer}>
                  <Fingerprint size={28} color="#047857" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{t("fingerprint")}</Text>
                  <Text style={styles.optionDescription}>
                    {t("fingerprintDescription")}
                  </Text>
                </View>
                <CheckCircle size={20} color="#10B981" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        <TouchableOpacity onPress={onCancel} style={styles.otpButton}>
          <Text style={styles.cancel}>{t("useOtp")}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal animé amélioré */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={["#ffffff", "#f9fafb"]}
              style={styles.modalGradient}
            >
              <View style={styles.modalIconContainer}>
                {modalType === "face" ? (
                  <ScanFace size={64} color="#047857" />
                ) : (
                  <Fingerprint size={64} color="#047857" />
                )}
              </View>

              <Text style={styles.modalTitle}>
                {modalType === "face"
                  ? t("scanFace")
                  : t("scanFingerprint")}
              </Text>

              <Text style={styles.modalDescription}>
                {t("biometricPrompt")}
              </Text>

              {authenticating && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#047857" />
                  <Text style={styles.loadingText}>{t("authenticating")}</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: { 
    position: "absolute", 
    top: Platform.OS === "ios" ? 48 : 38, 
    left: 20, 
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 30,
    shadowColor: "#047857",
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  headerRight: {
    width: 44,
  },
  logoWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  content: { 
    flex: 1, 
    justifyContent: "center", 
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    color: "#111827",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 24,
    fontSize: 16,
    lineHeight: 22,
  },
  biometricInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 30,
    backgroundColor: "#ecfdf5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignSelf: "center",
  },
  biometricInfoText: {
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
  },
  option: {
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  optionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#047857",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#111827",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: "#6b7280",
  },
  otpButton: {
    marginTop: 16,
    paddingVertical: 14,
  },
  cancel: {
    textAlign: "center",
    color: "#047857",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },
  modalGradient: {
    padding: 32,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#047857",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    marginBottom: 10,
    color: "#111827",
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
  },
})
