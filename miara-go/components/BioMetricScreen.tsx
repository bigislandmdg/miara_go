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
} from "react-native"
import * as LocalAuthentication from "expo-local-authentication"
import { Fingerprint, ScanFace, ArrowLeft } from "lucide-react-native"
import { ToastMessage } from "../components/ToastMessage"
import { useTranslation } from "react-i18next"
import { useLanguage } from "../providers/LanguageProvider"
import { Logo } from "./ui/logo"

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

  const fadeAnim = useRef(new Animated.Value(0)).current

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
  }, [])

  const animateModal = () => {
    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }

  const authenticate = async (type: "face" | "fingerprint") => {
    if (authenticating) return

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
      onSuccess(dataLogin.token, dataLogin.user)
    } catch (error) {
      console.log("BIOMETRIC ERROR", error)
      ToastMessage.show(t("error"))
      setAuthenticating(false)
      setModalVisible(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <ArrowLeft size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      
      <View style={styles.content}>
        <View style={styles.logoWrapper}>
          <Logo fontSize={64} variant="light" />
      </View>
        <Text style={styles.title}>{t("title")}</Text>
        <Text style={styles.subtitle}>{t("subtitle")}</Text>

        <TouchableOpacity
          style={styles.option}
          onPress={() => authenticate("face")}
          disabled={authenticating}
        >
          <ScanFace size={26} color="#047857" />
          <Text style={styles.text}>{t("faceId")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => authenticate("fingerprint")}
          disabled={authenticating}
        >
          <Fingerprint size={26} color="#047857" />
          <Text style={styles.text}>{t("fingerprint")}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancel}>{t("useOtp")}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal animé */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {modalType === "face" ? (
              <ScanFace size={64} color="#047857" />
            ) : (
              <Fingerprint size={64} color="#047857" />
            )}

            <Text style={styles.modalTitle}>
              {modalType === "face"
                ? t("scanFace")
                : t("scanFingerprint")}
            </Text>

            {authenticating && (
              <ActivityIndicator
                size="large"
                color="#047857"
                style={{ marginTop: 20 }}
              />
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },
  header: { position: "absolute", top: 48, left: 20, zIndex: 10 },
  backButton: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  logoWrapper: {
  width: "100%",
  alignItems: "center",
  marginBottom: 50,
},
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 40 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: "#111827",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 30,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ecfdf5",
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 22,
    marginBottom: 16,
  },
  text: { fontSize: 16, fontWeight: "600", color: "#047857" },
  cancel: {
    textAlign: "center",
    marginTop: 24,
    color: "#6b7280",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 16,
    alignItems: "center",
    width: "80%",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginTop: 12 },
})
