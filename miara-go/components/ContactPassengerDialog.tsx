import React, { useState } from 'react'
import { View, Text, TextInput, Modal, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { MessageCircle, AlertCircle } from 'lucide-react-native'

interface ContactPassengerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  passengerRequest: {
    id: string
    passenger: string
    departure: string
    arrival: string
    date: string
    seats: number
  }
  currentCredits: number
  onContactSent: (creditsUsed: number) => void
}

const CONTACT_COST = 5

export function ContactPassengerDialog({
  open,
  onOpenChange,
  passengerRequest,
  currentCredits,
  onContactSent,
}: ContactPassengerDialogProps) {
  const [priceOffer, setPriceOffer] = useState('')
  const [message, setMessage] = useState('')
  const [seatsOffered, setSeatsOffered] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const hasEnoughCredits = currentCredits >= CONTACT_COST

  const handleSendOffer = () => {
    if (!priceOffer || !seatsOffered) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!hasEnoughCredits) {
      Alert.alert('Crédits insuffisants', `Vous avez besoin de ${CONTACT_COST} crédits.`)
      return
    }

    setIsProcessing(true)

    setTimeout(() => {
      onContactSent(CONTACT_COST)
      Alert.alert('Succès', `Offre envoyée ! • ${CONTACT_COST} crédits débités`)
      setIsProcessing(false)
      onOpenChange(false)

      // reset
      setPriceOffer('')
      setMessage('')
      setSeatsOffered('')
    }, 1000)
  }

  return (
    <Modal visible={open} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>
            <MessageCircle size={20} color="#047857" /> Envoyer une offre
          </Text>
          <Text style={styles.description}>
            Demande de {passengerRequest.passenger} • {passengerRequest.departure} → {passengerRequest.arrival}
          </Text>

          <ScrollView style={{ maxHeight: 400 }}>

            {/* Info trajet */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Date: {new Date(passengerRequest.date).toLocaleDateString('fr-FR')}</Text>
              <Text style={styles.infoText}>Places demandées: {passengerRequest.seats} place{passengerRequest.seats > 1 ? 's' : ''}</Text>
            </View>

            {/* Prix */}
            <View style={styles.field}>
              <Text style={styles.label}>Prix par place (Ar) *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Ex: 15000"
                value={priceOffer}
                onChangeText={setPriceOffer}
              />
            </View>

            {/* Places offertes */}
            <View style={styles.field}>
              <Text style={styles.label}>Nombre de places disponibles *</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="Ex: 3"
                value={seatsOffered}
                onChangeText={setSeatsOffered}
              />
            </View>

            {/* Message */}
            <View style={styles.field}>
              <Text style={styles.label}>Message (optionnel)</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Ex: Je pars à 8h précises, départ depuis Analakely..."
                value={message}
                onChangeText={setMessage}
                multiline
              />
            </View>

            {/* Coût */}
            <View style={[styles.infoBox, { backgroundColor: hasEnoughCredits ? '#d1fae5' : '#fee2e2' }]}>
              <Text>Coût de contact: {CONTACT_COST} crédits</Text>
              <Text style={{ color: hasEnoughCredits ? '#047857' : '#b91c1c' }}>
                Crédits disponibles: {currentCredits}
              </Text>
            </View>

            {!hasEnoughCredits && (
              <View style={[styles.alertBox]}>
                <AlertCircle size={20} color="#b91c1c" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={{ fontWeight: 'bold', color: '#b91c1c' }}>Crédits insuffisants</Text>
                  <Text style={{ color: '#b91c1c' }}>Vous avez besoin de {CONTACT_COST - currentCredits} crédits supplémentaires.</Text>
                </View>
              </View>
            )}

          </ScrollView>

          {/* Boutons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => onOpenChange(false)} disabled={isProcessing}>
              <Text>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.sendButton]} onPress={handleSendOffer} disabled={isProcessing || !hasEnoughCredits}>
              <Text style={{ color: 'white' }}>{isProcessing ? 'Envoi...' : 'Envoyer l\'offre'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', backgroundColor: 'white', borderRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 14, marginBottom: 12 },
  infoBox: { padding: 12, borderRadius: 12, backgroundColor: '#f3f4f6', marginBottom: 12 },
  infoText: { fontSize: 12, marginBottom: 4 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: 'white' },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', padding: 8, borderRadius: 12, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  cancelButton: { backgroundColor: '#f3f4f6' },
  sendButton: { backgroundColor: '#047857' },
})
