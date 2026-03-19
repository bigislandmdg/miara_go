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
  Alert,
} from "react-native"
import * as LocalAuthentication from "expo-local-authentication"
import { Fingerprint, ScanFace, ArrowLeft, Shield, CheckCircle, X } from "lucide-react-native"
import { ToastMessage } from "../components/ToastMessage"
import { useTranslation } from "react-i18next"
import { useLanguage } from "../providers/LanguageProvider"
import { Logo } from "./ui/logo"
import { LinearGradient } from "expo-linear-gradient"

// =========================================================
// 🔹 IMPORT DYNAMIQUE POUR EXPO-CAMERA
// =========================================================
let CameraModule: any = null
let Camera: any = null
let CameraType: any = null

try {
  // Tentative d'import de expo-camera
  CameraModule = require('expo-camera')
  Camera = CameraModule.Camera
  CameraType = CameraModule.CameraType || CameraModule.Constants?.Type
} catch (error) {
  console.log("expo-camera not installed, using fallback")
}

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

  // États pour la caméra
  const [cameraVisible, setCameraVisible] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)
  const [cameraType, setCameraType] = useState<any>(null)
  const cameraRef = useRef<any>(null)

  // Vérifier si expo-camera est installé
  const isCameraAvailable = Camera !== null

  // Initialiser le type de caméra
  useEffect(() => {
    if (isCameraAvailable && CameraType) {
      setCameraType(CameraType.front)
    }
  }, [])

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

  // 🔹 Demander la permission caméra
  const requestCameraPermission = async () => {
    if (!isCameraAvailable) {
      Alert.alert(
        t("error"),
        "expo-camera n'est pas installé. Veuillez l'installer avec: expo install expo-camera"
      )
      return false
    }

    try {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setCameraPermission(status === 'granted')
      return status === 'granted'
    } catch (error) {
      console.log("Camera permission error:", error)
      return false
    }
  }

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

  // 🔹 Authentification par empreinte digitale
  const authenticateFingerprint = async () => {
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

      if (!supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        ToastMessage.show(t("biometric.fingerprintUnavailable"))
        return
      }

      setModalType("fingerprint")
      setModalVisible(true)
      animateModal()
      setAuthenticating(true)

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t("scanFingerprint"),
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

      await handleBiometricSuccess()
    } catch (error) {
      console.log("FINGERPRINT ERROR", error)
      ToastMessage.show(t("error"))
      setAuthenticating(false)
      setModalVisible(false)
    }
  }

  // 🔹 Authentification par reconnaissance faciale
  const authenticateFace = async () => {
    if (authenticating) return
    animateButton()

    try {
      // Vérifier d'abord si la biométrie faciale est supportée
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()

      if (hasHardware && isEnrolled && 
          supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        // Utiliser l'authentification système pour Face ID / Reconnaissance faciale
        setModalType("face")
        setModalVisible(true)
        animateModal()
        setAuthenticating(true)

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: t("scanFace"),
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

        await handleBiometricSuccess()
      } else if (isCameraAvailable) {
        // Fallback à la caméra si Face ID n'est pas disponible
        const granted = await requestCameraPermission()
        if (!granted) {
          Alert.alert(
            t("permissionRequired"),
            t("cameraPermissionRequired")
          )
          return
        }

        // Ouvrir la caméra pour la capture
        setCameraVisible(true)
        setModalType("face")
      } else {
        // Aucune option disponible
        Alert.alert(
          t("error"),
          "La reconnaissance faciale n'est pas disponible sur cet appareil"
        )
      }
    } catch (error) {
      console.log("FACE AUTH ERROR", error)
      ToastMessage.show(t("error"))
    }
  }

  // 🔹 Capture de visage avec la caméra
  const takeFacePicture = async () => {
    if (!cameraRef.current || !isCameraAvailable) return

    try {
      setAuthenticating(true)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      })

      // Simulation de reconnaissance faciale
      await new Promise(resolve => setTimeout(resolve, 1500))

      setCameraVisible(false)
      setAuthenticating(false)

      // Simuler un succès de reconnaissance
      await handleBiometricSuccess()
    } catch (error) {
      console.log("CAMERA CAPTURE ERROR", error)
      ToastMessage.show(t("captureFailed"))
      setAuthenticating(false)
    }
  }

  // 🔹 Traitement après succès biométrique
  const handleBiometricSuccess = async () => {
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

        {/* Bouton Face ID / Reconnaissance faciale */}
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={styles.option}
            onPress={authenticateFace}
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

        {/* Bouton Empreinte digitale */}
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            style={styles.option}
            onPress={authenticateFingerprint}
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

        <TouchableOpacity onPress={onCancel} style={styles.otpButton}>
          <Text style={styles.cancel}>{t("useOtp")}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal d'authentification système */}
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
                {modalType === "face"
                  ? t("faceAuthPrompt")
                  : t("fingerprintAuthPrompt")}
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

      {/* Modal Caméra pour Face ID - uniquement si expo-camera est disponible */}
      {isCameraAvailable && cameraType && (
        <Modal visible={cameraVisible} animationType="slide">
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={cameraType}
              ratio="16:9"
            >
              <View style={styles.cameraOverlay}>
                <View style={styles.cameraHeader}>
                  <TouchableOpacity
                    style={styles.cameraCloseButton}
                    onPress={() => setCameraVisible(false)}
                  >
                    <X size={24} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.cameraTitle}>{t("faceScan")}</Text>
                  <View style={{ width: 40 }} />
                </View>

                <View style={styles.faceGuideContainer}>
                  <View style={styles.faceGuide}>
                    <ScanFace size={80} color="#fff" />
                  </View>
                  <Text style={styles.faceGuideText}>
                    {t("positionFace")}
                  </Text>
                </View>

                <View style={styles.cameraFooter}>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takeFacePicture}
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                </View>
              </View>
            </Camera>
          </View>
        </Modal>
      )}
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

  // Styles pour la caméra
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "space-between",
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  faceGuideContainer: {
    alignItems: "center",
  },
  faceGuide: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#fff",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  faceGuideText: {
    marginTop: 20,
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  cameraFooter: {
    alignItems: "center",
    paddingBottom: 50,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
})
