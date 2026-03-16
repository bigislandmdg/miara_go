import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
  PanResponder,
} from 'react-native'

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (value: number) => void
  userId: number
  maxAmount: number
}

export function WithdrawDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  maxAmount,
}: WithdrawDialogProps) {

  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTicket, setShowTicket] = useState(false)

  const screenHeight = Dimensions.get('window').height
  const translateY = useRef(new Animated.Value(screenHeight)).current
  const shakeAnim = useRef(new Animated.Value(0)).current

  const numericValue = parseInt(amount.replace(/\D/g, '')) || 0
  const isValid = numericValue > 0 && numericValue <= maxAmount

  /* ================= ANIMATION ================= */

  useEffect(() => {
    if (open) {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }).start()
    } else {
      translateY.setValue(screenHeight)
    }
  }, [open])

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onOpenChange(false))
  }

  /* ================= SWIPE DOWN ================= */

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 10,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) {
          closeSheet()
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  /* ================= SHAKE ================= */

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start()
  }

  /* ================= FORMAT ================= */

  const formatAmount = (value: string) => {
    const digits = value.replace(/\D/g, '')
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  /* ================= WITHDRAW ================= */

  const handleWithdraw = async () => {
    if (!isValid) {
      triggerShake()
      return
    }

    try {
      setLoading(true)

      const res = await fetch(`http://10.0.2.2:8080/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          type: 'withdraw',
          amount: numericValue,
          status: 'completed',
        }),
      })

      if (!res.ok) throw new Error()

      onSuccess(numericValue)
      setShowTicket(true)
      setAmount('')

    } catch {
      Alert.alert('Erreur', 'Impossible de retirer.')
    } finally {
      setLoading(false)
    }
  }

  /* ================= UI ================= */

  return (
    <>
      <Modal transparent visible={open} animationType="none">
  <TouchableWithoutFeedback onPress={closeSheet}>
    <View style={styles.overlay}>

      <TouchableWithoutFeedback>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.sheet,
            {
              transform: [
                { translateY },
                { translateX: shakeAnim }
              ],
            },
          ]}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Retirer des crédits</Text>

          <Text style={styles.subtitle}>
            Disponible : {maxAmount.toLocaleString()}
          </Text>

          <TextInput
            placeholder="0"
            keyboardType="numeric"
            value={amount}
            onChangeText={(t) => setAmount(formatAmount(t))}
            style={styles.input}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.confirm,
              { backgroundColor: isValid ? '#DC2626' : '#E5E7EB' }
            ]}
            onPress={handleWithdraw}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{
                color: isValid ? '#fff' : '#9CA3AF',
                fontWeight: '600'
              }}>
                Confirmer le retrait
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={closeSheet}
            style={{ marginTop: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#6B7280' }}>Annuler</Text>
          </TouchableOpacity>

        </Animated.View>
      </TouchableWithoutFeedback>

    </View>
    </TouchableWithoutFeedback>
  </Modal>

      {/* ================= TICKET ================= */}

      <Modal transparent visible={showTicket} animationType="fade">
        <View style={styles.ticketOverlay}>
          <View style={styles.ticketSheet}>
            <Text style={styles.ticketTitle}>Retrait effectué ✅</Text>
            <Text style={styles.ticketText}>
              Montant : {numericValue.toLocaleString()}
            </Text>

            <TouchableOpacity
              style={styles.ticketBtn}
              onPress={() => {
                setShowTicket(false)
                closeSheet()
              }}
            >
              <Text style={{ color: '#fff' }}>OK</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 42,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#6B7280',
  },
  input: {
    marginTop: 20,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
  },
  confirm: {
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },

  /* Ticket */
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
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  ticketText: {
    fontSize: 14,
    marginBottom: 10,
  },
  ticketBtn: {
    marginTop: 16,
    backgroundColor: '#059669',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 999,
  },
})