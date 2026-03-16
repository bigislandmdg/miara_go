import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native'
import { TouchableWithoutFeedback } from 'react-native'
import { useTranslation } from 'react-i18next'

import { Diamond } from 'lucide-react-native'

interface CreditPurchaseDialogProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  currentCredits: number
  userId: number
}

const API_URL = 'http://10.0.2.2:8080'

const CREDIT_PACKAGES = [
  { credits: 100, price: 5000 },
  { credits: 300, price: 14000, bonus: 20 },
  { credits: 500, price: 22000, bonus: 50 },
  { credits: 1000, price: 40000, bonus: 150 },
]

export default function CreditPurchaseDialog({
  visible,
  onClose,
  onSuccess,
  currentCredits,
  userId,
}: CreditPurchaseDialogProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(CREDIT_PACKAGES[0])
  const [loading, setLoading] = useState(false)

  // 🎫 Ticket modal
  const [showTicket, setShowTicket] = useState(false)
  const [ticketData, setTicketData] = useState<{
    reference: string
    amount: number
  } | null>(null)

  const screenHeight = Dimensions.get('window').height
  const slideAnim = useRef(new Animated.Value(screenHeight)).current

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start()
    } else {
      slideAnim.setValue(screenHeight)
    }
  }, [visible])

  /* =====================================================
     🔁 SIMULATION CONFIRMATION MOBILE MONEY
     ===================================================== */
  const confirmPayment = async (reference: string) => {
    try {
      await fetch(`${API_URL}/credits/confirm/${reference}`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      })
    } catch (e) {
      console.warn('⚠️ Confirmation Mobile Money échouée', e)
    }
  }

  /* =====================================================
     💳 ACHAT CRÉDITS (INIT → pending)
     ===================================================== */
  const handlePurchase = async () => {
    if (!userId || userId <= 0) {
      Alert.alert(t('error'), t('userNotIdentified'))
      return
    }

    setLoading(true)

    try {
      const payload = {
        user_id: userId,
        credits: selected.credits,
        bonus: selected.bonus || 0,
        price: selected.price,
      }

      console.log('📤 Payload achat crédits:', payload)

      const res = await fetch(`${API_URL}/credits/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await res.text()

      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error(t('invalidServerResponse'))
      }

      if (!res.ok) {
        throw new Error(data?.messages?.error || t('transactionCreationError'))
      }

      if (!data?.transaction?.reference) {
        throw new Error(t('missingTransactionReference'))
      }

      // 🎫 Affichage ticket (transaction pending)
      setTicketData({
        reference: data.transaction.reference,
        amount: selected.price,
      })
      setShowTicket(true)

    } catch (e: any) {
      console.error('❌ Achat crédits échoué', e)
      Alert.alert(t('error'), e.message || t('paymentFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ================= DIALOG ACHAT ================= */}
      <Modal transparent visible={visible} animationType="none">
        <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <Diamond size={18} color="#f59e0b" />
              <Text style={styles.title}>{t('buyCredits')}</Text>
            </View>

            <Text style={styles.subtitle}>
              {t('currentBalance')} :{' '}
              <Text style={{ color: '#047857' }}>{currentCredits}</Text>
            </Text>

            <ScrollView>
              <View style={styles.grid}>
                {CREDIT_PACKAGES.map((pkg) => {
                  const total = pkg.credits + (pkg.bonus || 0)
                  const active = pkg.credits === selected.credits

                  return (
                    <TouchableOpacity
                      key={pkg.credits}
                      style={[styles.package, active && styles.active]}
                      onPress={() => setSelected(pkg)}
                    >
                      <Text style={styles.pkgCredits}>{total}</Text>
                      <Text>{pkg.price.toLocaleString()} Ar</Text>
                      {pkg.bonus && (
                        <Text style={styles.bonus}>+{pkg.bonus} {t('bonus')}</Text>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel} onPress={onClose}>
                <Text>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pay}
                onPress={handlePurchase}
                disabled={loading}
              >
                <Text style={{ color: '#fff' }}>
                  {loading ? t('processing') : t('pay')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ================= TICKET MODAL ================= */}
      <Modal transparent visible={showTicket} animationType="fade">
        <View style={styles.ticketOverlay}>
          <View style={styles.ticketSheet}>
            <Text style={styles.ticketTitle}>{t('paymentInitiated')} ✅</Text>
            <Text style={styles.ticketText}>
              {t('reference')} : {ticketData?.reference}
            </Text>
            <Text style={styles.ticketText}>
              {t('amount')} : {ticketData?.amount.toLocaleString()} Ar
            </Text>
            <Text style={styles.ticketHint}>
              {t('pendingMobileMoneyConfirmation')}
            </Text>

            <TouchableOpacity
              style={styles.ticketClose}
              onPress={async () => {
                setShowTicket(false)

                // ✅ confirmation simulée Mobile Money
                if (ticketData?.reference) {
                  await confirmPayment(ticketData.reference)
                }

                onSuccess() // refresh wallet
                onClose()   // fermer dialog achat
              }}
            >
              <Text style={{ color: '#fff' }}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F9FAFB',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 13, marginVertical: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  package: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  active: { borderWidth: 2, borderColor: '#059669' },
  pkgCredits: { fontSize: 20, fontWeight: '600' },
  bonus: { fontSize: 11, color: '#059669' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancel: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  pay: {
    flex: 1,
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 999,
    alignItems: 'center',
  },

  // 🎫 Ticket
  ticketOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketSheet: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ticketTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  ticketText: { fontSize: 14, marginBottom: 6 },
  ticketHint: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  ticketClose: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
})

