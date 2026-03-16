// components/DriverWallet.tsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  Alert,
  Animated,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  Plus,
  ArrowDownCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  QrCode,
} from "lucide-react-native"
import QRCode from "react-native-qrcode-svg"
import CreditPurchaseDialog from "./CreditPurchaseDialog"
import { WithdrawDialog } from "./WithDrawDialog"
import { Header } from "../components/Header"
import { SideMenu } from "./SideMenu"
import { useTranslation } from "react-i18next"

import { MainView } from "./Navigation";

/* ================= TYPES ================= */
interface ConnectedUser {
  id: number
}

type TransactionType = "earning" | "credit_purchase" | "withdraw"

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  status: "completed" | "pending"
  reference?: string
}

/* ================= CONFIG ================= */
const API_URL = "http://10.0.2.2:8080"
const FALLBACK_USER_ID = 1
const PAGE_SIZE = 3

interface DriverWalletProps {
  onViewChange?: (view: MainView) => void
}

export function DriverWallet({ onViewChange }: DriverWalletProps) {

  const { t } = useTranslation()

  /* ================= STATES ================= */
  const [user] = useState<ConnectedUser>({ id: FALLBACK_USER_ID })
  const [credits, setCredits] = useState(0)
  const [pendingCredits, setPendingCredits] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [visibleTransactions, setVisibleTransactions] = useState<Transaction[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreditDialog, setShowCreditDialog] = useState(false)
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [qrToken, setQrToken] = useState<string | null>(null)
  const [qrExpired, setQrExpired] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [filter, setFilter] = useState<"all" | "withdraw" | "credit_purchase">("all")
  const [menuVisible, setMenuVisible] = useState(false)
  const [showAmounts, setShowAmounts] = useState(false)

  /* ================= ANIMATIONS ================= */
  const fadeAnim = useRef(new Animated.Value(0)).current
  const fadeQR = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  /* ================= INIT ================= */
  useEffect(() => { fetchWallet() }, [])

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem("@wallet_visibility")
        if (stored !== null) {
          const visible = stored === "true"
          setShowAmounts(visible)
          fadeAnim.setValue(visible ? 1 : 0)
        }
      } catch {}
    }
    loadPreference()
  }, [])

  /* ================= FETCH WALLET ================= */
  const fetchWallet = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/credits/wallet/${user.id}`)
      const rawText = await res.text()
      const data = rawText.trim().length ? JSON.parse(rawText) : {}

      const rawTx = Array.isArray(data.transactions) ? data.transactions : []

      const mappedTx: Transaction[] = rawTx.map((t: any) => {
        let type: TransactionType = "earning"
        if (t.type === "withdraw") type = "withdraw"
        if (t.type === "achat_credit") type = "credit_purchase"
        return {
          id: String(t.id),
          type,
          amount: Math.abs(Number(t.amount || 0)),
          description:
            type === "withdraw"
              ? "Retrait"
              : type === "credit_purchase"
              ? "Achat de crédits"
              : "Gain de trajet",
          date: t.created_at || new Date().toISOString(),
          status: t.status === "pending" ? "pending" : "completed",
          reference: t.reference ?? undefined,
        }
      })

      setTransactions(mappedTx)
      setVisibleTransactions(mappedTx.slice(0, PAGE_SIZE))
      setCurrentPage(1)

      let available = 0
      let pending = 0
      mappedTx.forEach(tx => {
        if (tx.type === "earning" || tx.type === "credit_purchase") available += tx.amount
        if (tx.type === "withdraw") tx.status === "completed" ? (available -= tx.amount) : (pending += tx.amount)
      })

      setCredits(Math.max(available, 0))
      setPendingCredits(pending)
    } catch {
      setTransactions([])
      setVisibleTransactions([])
      setCredits(0)
      setPendingCredits(0)
    } finally { setLoading(false) }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchWallet()
    setRefreshing(false)
  }

  /* ================= QR STATLESS ================= */
  /* ================= QR STATLESS ================= */
const generateSecureQR = async () => {
  try {
    setQrExpired(false)
    // Appel backend pour générer un token QR unique
    const res = await fetch(`${API_URL}/credits/generate-qr/${user.id}`)
    const data = await res.json()

    if (data.status && data.token) {
      setQrToken(data.token)

      // On calcule le délai d'expiration
      const expiresInMs = (data.expires_at - Math.floor(Date.now() / 1000)) * 1000

      // Animation d'apparition du QR
      Animated.parallel([
        Animated.timing(fadeQR, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start()

      // Expiration automatique
      setTimeout(() => {
        setQrExpired(true)
        setQrToken(null)
      }, expiresInMs)
    } else {
      Alert.alert(t("error"), t("qrGenerationFailed"))
    }
  } catch (e) {
    console.log("QR generation error", e)
    Alert.alert(t("error"), t("qrGenerationFailed"))
  }
}

// Fonction de scan QR (ici juste pour afficher le total)
const scanQR = async (token: string) => {
  try {
    if (!token) return
    const res = await fetch(`${API_URL}/credits/scan-qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, user_id: user.id }),
    })
    const data = await res.json()

    if (data.status && typeof data.total_credits === "number") {
      Alert.alert(
        t("qrScanned"),
        `${t("availableBalance")}: ${data.total_credits} ${t("credits")}`
      )
      // Met à jour le total affiché dans le modal
      setCredits(data.total_credits)
    } else {
      Alert.alert(t("error"), data.message || t("qrInvalidOrExpired"))
    }
  } catch (e) {
    console.log("QR scan error", e)
    Alert.alert(t("error"), t("qrScanFailed"))
  }
}

  /* ================= FILTER + PAGINATION ================= */
  useEffect(() => {
    let filtered = transactions
    if (filter !== "all") filtered = transactions.filter(t => t.type === filter)
    setVisibleTransactions(filtered.slice(0, PAGE_SIZE))
    setCurrentPage(1)
  }, [filter, transactions])

  const loadMoreTransactions = () => {
    let filtered = transactions
    if (filter !== "all") filtered = transactions.filter(t => t.type === filter)
    const next = currentPage + 1
    setVisibleTransactions(filtered.slice(0, next * PAGE_SIZE))
    setCurrentPage(next)
  }

  /* ================= DELETE ================= */
  const deleteTransaction = async () => {
    if (!deleteTarget?.id) return
    try {
      await fetch(`${API_URL}/credits/transaction/${deleteTarget.id}`, { method: "DELETE" })
      await fetchWallet()
    } catch {
      Alert.alert(t("error"), t("deleteImpossible"))
    } finally {
      setDeleteTarget(null)
    }
  }

  /* ================= STATS ================= */
  const stats = useMemo(() => {
    let earned = 0, withdrawn = 0
    transactions.forEach(t => {
      if (t.type === "earning") earned += t.amount
      if (t.type === "withdraw") withdrawn += t.amount
    })
    return { earned, withdrawn }
  }, [transactions])

  const formatAmount = (amount: number) => showAmounts ? amount : "****"

  const iconByType = (type: TransactionType) => {
    if (type === "earning") return <ArrowUpRight size={18} color="#10B981" />
    if (type === "withdraw") return <ArrowDownLeft size={18} color="#DC2626" />
    return <Wallet size={18} color="#2563EB" />
  }

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Header
        title="MiaraGo"
        onNotifications={() => {}}
        onProfileClick={() => {}}
        onMenuPress={() => setMenuVisible(true)}
      />

       <SideMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          onNavigate={(route: MainView) => {
          setMenuVisible(false);
          onViewChange?.(route);
          }}
          onLogout={() => {
            setMenuVisible(false);
            onViewChange?.("home");
          }}
        />      

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* BALANCE */}
        <View style={styles.balanceCard}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View style={styles.balanceHeaderRow}>
                <TouchableOpacity onPress={() => { setShowQRModal(true); generateSecureQR() }}>
                  <QrCode size={20} color="#D1FAE5" />
                </TouchableOpacity>

                <Text style={styles.balanceLabel}>{t("availableBalance")}</Text>

                <TouchableOpacity
                  onPress={async () => {
                    const newValue = !showAmounts
                    Animated.timing(fadeAnim, { toValue: newValue ? 1 : 0, duration: 250, useNativeDriver: true }).start()
                    setShowAmounts(newValue)
                    await AsyncStorage.setItem("@wallet_visibility", String(newValue))
                  }}
                >
                  {showAmounts ? <Eye size={20} color="#D1FAE5" /> : <EyeOff size={20} color="#D1FAE5" />}
                </TouchableOpacity>
              </View>

              <Animated.Text style={[styles.balanceAmount, { opacity: fadeAnim }]}>
                {formatAmount(credits)} {showAmounts && t("credits")}
              </Animated.Text>

              {pendingCredits > 0 && (
                <Animated.Text style={[styles.pending, { opacity: fadeAnim }]}>
                  {t("pending")} · {formatAmount(pendingCredits)} {showAmounts && t("credits")}
                </Animated.Text>
              )}
            </>
          )}
        </View>

        {/* GRAPH */}
        <View style={styles.graphCard}>
          <Text style={styles.graphText}>
            {t("withdrawn")} : {formatAmount(stats.withdrawn)} {showAmounts && t("credits")} · {t("earned")} : {formatAmount(stats.earned)} {showAmounts && t("credits")}
          </Text>
        </View>

        {/* ACTIONS */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={[styles.withdrawButton, credits <= 0 && { opacity: 0.4 }]}
            disabled={credits <= 0}
            onPress={() => setShowWithdrawDialog(true)}
          >
            <ArrowDownCircle size={18} color="#fff" />
            <Text style={styles.actionText}>{t("withdraw")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreditDialog(true)}>
            <Plus size={18} color="#fff" />
            <Text style={styles.actionText}>{t("add")}</Text>
          </TouchableOpacity>
        </View>

        {/* HISTORY */}
        <Text style={styles.section}>{t("history")}</Text>
        {visibleTransactions.map(tx => (
          <TouchableOpacity key={tx.id} style={styles.historyCard} onLongPress={() => setDeleteTarget(tx)}>
            <View style={styles.historyLeft}>
              {iconByType(tx.type)}
              <View>
                <Text style={styles.historyTitle}>{tx.description}</Text>
                <Text style={styles.historyDate}>{new Date(tx.date).toLocaleString()}</Text>
              </View>
            </View>
            <Animated.Text style={[styles.amount, tx.type === "withdraw" && { color: "#DC2626" }, { opacity: fadeAnim }]}>
              {showAmounts ? `${tx.type === "withdraw" ? "-" : "+"}${tx.amount}` : "••••"}
            </Animated.Text>
          </TouchableOpacity>
        ))}

        {visibleTransactions.length < transactions.length && (
          <TouchableOpacity style={styles.loadMore} onPress={loadMoreTransactions}>
            <Text style={styles.loadMoreText}>{t("loadMore")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* DELETE MODAL */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteTitle}>{t("deleteTransaction")}</Text>
            <View style={styles.deleteActions}>
              <Pressable onPress={() => setDeleteTarget(null)}><Text style={styles.cancel}>{t("cancel")}</Text></Pressable>
              <Pressable onPress={deleteTransaction}><Text style={styles.confirmDelete}>{t("delete")}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <CreditPurchaseDialog
        visible={showCreditDialog}
        onClose={() => setShowCreditDialog(false)}
        onSuccess={fetchWallet}
        currentCredits={credits}
        userId={user.id}
      />

      <WithdrawDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        userId={user.id}
        maxAmount={credits}
        onSuccess={fetchWallet}
      />

      {/* QR CODE MODAL */}
      {/* QR CODE MODAL SIMPLIFIÉ */}
      <Modal visible={showQRModal} transparent animationType="fade">
       <View style={styles.modalBackdrop}>
           <View style={styles.qrModal}>
             <Text style={styles.qrTitle}>{t("walletQR")}</Text>

      {/* QR Code statique pour design, optionnel */}
      <QRCode
        value={JSON.stringify({ user_id: user.id, total: credits })}
        size={180}
      />

      <Text style={styles.qrAmount}>{t("availableBalance")} :</Text>
      <Text style={styles.qrAmountValue}>{credits} {t("credits")}</Text>

      <Pressable style={styles.qrClose} onPress={() => setShowQRModal(false)}>
        <Text style={{ color: "#fff", fontWeight: "700" }}>{t("close")}</Text>
      </Pressable>
    </View>
  </View>
  </Modal>
</View>
  )
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 16, paddingBottom: 40 },

  balanceCard: { backgroundColor: "#047857", borderRadius: 20, padding: 24, marginBottom: 20 },
  balanceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { color: "#D1FAE5", fontSize: 14 },
  balanceAmount: { color: "#fff", fontSize: 32, fontWeight: "800" },
  pending: { color: "#FEF3C7", marginTop: 6 },

  graphCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20 },
  graphText: { fontWeight: "700", color: "#111827" },

  actionsCard: { flexDirection: "row", gap: 10, marginBottom: 28 },
  withdrawButton: { flex: 1, backgroundColor: "#DC2626", borderRadius: 16, padding: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  addButton: { flex: 1, backgroundColor: "#047857", borderRadius: 16, padding: 14, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  actionText: { color: "#fff", marginLeft: 8, fontWeight: "700" },

  section: { fontSize: 18, fontWeight: "800", marginBottom: 12 },

  historyCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyLeft: { flexDirection: "row", gap: 10 },
  historyTitle: { fontWeight: "700" },
  historyDate: { fontSize: 12, color: "#6B7280" },
  amount: { fontWeight: "800", color: "#10B981" },

  loadMore: { alignSelf: "center", padding: 10 },
  loadMoreText: { color: "#2563EB", fontWeight: "700" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  deleteModal: { backgroundColor: "#fff", padding: 20, borderRadius: 16, width: "85%" },
  deleteTitle: { fontWeight: "800", fontSize: 16, marginBottom: 16 },
  deleteActions: { flexDirection: "row", justifyContent: "flex-end", gap: 20 },
  cancel: { color: "#6B7280", fontWeight: "700" },
  confirmDelete: { color: "#DC2626", fontWeight: "800" },

  qrModal: { backgroundColor: "#fff", padding: 24, borderRadius: 20, alignItems: "center", width: "85%" },
  qrTitle: { fontSize: 18, fontWeight: "800", marginBottom: 20 },
  qrAmount: { marginTop: 20, fontSize: 14, color: "#6B7280" },
  qrAmountValue: { fontSize: 22, fontWeight: "800", marginTop: 6 },
  qrClose: { marginTop: 20, backgroundColor: "#047857", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
})
