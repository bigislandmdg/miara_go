// components/DriverWallet.tsx - Version avec calculs automatiques synchronisés
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
  Dimensions,
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
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Trash,
} from "lucide-react-native"
import QRCode from "react-native-qrcode-svg"
import { LinearGradient } from "expo-linear-gradient"
import CreditPurchaseDialog from "./CreditPurchaseDialog"
import { WithdrawDialog } from "./WithDrawDialog"
import { Header } from "../components/Header"
import { SideMenu } from "./SideMenu"
import { useTranslation } from "react-i18next"
import { MainView } from "./Navigation";

const { width } = Dimensions.get("window")

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
const PAGE_SIZE = 5

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
  const [menuVisible, setMenuVisible] = useState(false)
  const [showAmounts, setShowAmounts] = useState(false)
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("month")
  const [showStatsModal, setShowStatsModal] = useState(false)

  /* ================= ANIMATIONS ================= */
  const fadeAnim = useRef(new Animated.Value(0)).current
  const fadeQR = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  /* ================= ANIMATION DE POULS ================= */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

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
          description: getTransactionDescription(type),
          date: t.created_at || new Date().toISOString(),
          status: t.status === "pending" ? "pending" : "completed",
          reference: t.reference ?? undefined,
        }
      })

      setTransactions(mappedTx)
      
      if (showAllTransactions) {
        setVisibleTransactions(mappedTx)
      } else {
        setVisibleTransactions(mappedTx.slice(0, PAGE_SIZE))
      }
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

  const getTransactionDescription = (type: TransactionType): string => {
    switch (type) {
      case "withdraw":
        return t("withdrawDescription") || "Retrait"
      case "credit_purchase":
        return t("creditPurchaseDescription") || "Achat de crédits"
      case "earning":
        return t("earningDescription") || "Gain de trajet"
      default:
        return "Transaction"
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchWallet()
    setRefreshing(false)
  }

  /* ================= STATS MÉTRIQUES AVEC CALCULS AUTOMATIQUES ================= */
  // 🔹 Ces calculs se mettent à jour automatiquement quand transactions change
  const statsMetrics = useMemo(() => {
    const now = new Date()
    
    // Début de la semaine (lundi)
    const startOfWeek = new Date(now)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Début du mois
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    let weekEarnings = 0
    let monthEarnings = 0
    let totalWithdrawn = 0
    let pendingWithdrawals = 0
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date)
      
      if (tx.type === "earning") {
        if (txDate >= startOfWeek) weekEarnings += tx.amount
        if (txDate >= startOfMonth) monthEarnings += tx.amount
      }
      
      if (tx.type === "withdraw") {
        if (tx.status === "completed") {
          totalWithdrawn += tx.amount
        } else if (tx.status === "pending") {
          pendingWithdrawals += tx.amount
        }
      }
    })
    
    // Calcul du pourcentage de changement (semaine vs moyenne mensuelle)
    const weeklyAverage = monthEarnings / 4
    const weekChange = weekEarnings > 0 && weeklyAverage > 0
      ? ((weekEarnings - weeklyAverage) / weeklyAverage * 100).toFixed(0)
      : "0"
    
    return { 
      weekEarnings, 
      monthEarnings, 
      totalWithdrawn,
      pendingWithdrawals,
      weekChange: weekChange === "0" ? "0" : (parseFloat(weekChange) > 0 ? `+${weekChange}` : weekChange)
    }
  }, [transactions]) // 🔹 Se recalcule à chaque modification de transactions

  /* ================= STATS GLOBAUX AVEC CALCULS AUTOMATIQUES ================= */
  // 🔹 Ces calculs se mettent à jour automatiquement quand transactions change
  const walletStats = useMemo(() => {
    let earned = 0
    let withdrawn = 0
    let creditPurchases = 0
    let pendingWithdrawals = 0
    
    transactions.forEach(transaction => {
      switch (transaction.type) {
        case "earning":
          earned += transaction.amount
          break
        case "withdraw":
          if (transaction.status === "completed") {
            withdrawn += transaction.amount
          } else if (transaction.status === "pending") {
            pendingWithdrawals += transaction.amount
          }
          break
        case "credit_purchase":
          if (transaction.status === "completed") {
            creditPurchases += transaction.amount
          }
          break
      }
    })
    
    const net = earned - withdrawn
    const totalAdded = earned + creditPurchases
    
    return { 
      earned,           // Total gagné des trajets
      withdrawn,        // Total retiré confirmé
      pendingWithdrawals, // Retraits en attente
      creditPurchases,  // Total achats de crédits
      net,              // Solde net (gagné - retiré)
      totalAdded        // Total ajouté (gagné + achats)
    }
  }, [transactions]) // 🔹 Se recalcule à chaque modification de transactions

  /* ================= STATS SIMPLES POUR AFFICHAGE RAPIDE ================= */
  // 🔹 Conservé pour compatibilité avec le code existant
  const stats = useMemo(() => {
    let earned = 0, withdrawn = 0
    transactions.forEach(t => {
      if (t.type === "earning") earned += t.amount
      if (t.type === "withdraw") withdrawn += t.amount
    })
    return { earned, withdrawn }
  }, [transactions])

  /* ================= QR ================= */
  const generateSecureQR = async () => {
    try {
      setQrExpired(false)
      const res = await fetch(`${API_URL}/credits/generate-qr/${user.id}`)
      const data = await res.json()

      if (data.status && data.token) {
        setQrToken(data.token)
        const expiresInMs = (data.expires_at - Math.floor(Date.now() / 1000)) * 1000

        Animated.parallel([
          Animated.timing(fadeQR, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start()

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

  /* ================= PAGINATION ================= */
  useEffect(() => {
    if (showAllTransactions) {
      setVisibleTransactions(transactions)
    } else {
      setVisibleTransactions(transactions.slice(0, PAGE_SIZE))
    }
    setCurrentPage(1)
  }, [transactions, showAllTransactions])

  const loadMoreTransactions = () => {
    const next = currentPage + 1
    setVisibleTransactions(transactions.slice(0, next * PAGE_SIZE))
    setCurrentPage(next)
  }

  const toggleShowAllTransactions = () => {
    if (showAllTransactions) {
      setShowAllTransactions(false)
      setVisibleTransactions(transactions.slice(0, PAGE_SIZE))
      setCurrentPage(1)
    } else {
      setShowAllTransactions(true)
      setVisibleTransactions(transactions)
    }
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

  const formatAmount = (amount: number) => showAmounts ? amount.toLocaleString() : "••••"

  const iconByType = (type: TransactionType) => {
    if (type === "earning") return <ArrowUpRight size={18} color="#10B981" />
    if (type === "withdraw") return <ArrowDownLeft size={18} color="#bcb7a3" />
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
        showsVerticalScrollIndicator={false}
      >
        {/* BALANCE CARD - STYLE FIN TECH */}
        <LinearGradient
          colors={["#047857", "#065f46", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View style={styles.balanceHeaderRow}>
                <View style={styles.balanceLeft}>
                  <Text style={styles.balanceLabel}>{t("availableBalance")}</Text>
                  <Animated.Text style={[styles.balanceAmount, { opacity: fadeAnim }]}>
                    {formatAmount(credits)} {showAmounts && t("credits")}
                  </Animated.Text>
                  {pendingCredits > 0 && (
                    <Animated.Text style={[styles.pending, { opacity: fadeAnim }]}>
                      {t("pending")} · {formatAmount(pendingCredits)} {showAmounts && t("credits")}
                    </Animated.Text>
                  )}
                </View>
                
                <View style={styles.balanceRight}>
                  <TouchableOpacity onPress={() => { setShowQRModal(true); generateSecureQR() }} style={styles.qrButton}>
                    <QrCode size={22} color="#D1FAE5" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      const newValue = !showAmounts
                      Animated.timing(fadeAnim, { toValue: newValue ? 1 : 0, duration: 250, useNativeDriver: true }).start()
                      setShowAmounts(newValue)
                      await AsyncStorage.setItem("@wallet_visibility", String(newValue))
                    }}
                    style={styles.eyeButton}
                  >
                    {showAmounts ? <Eye size={22} color="#D1FAE5" /> : <EyeOff size={22} color="#D1FAE5" />}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </LinearGradient>

        {/* STATS CARTES - AVEC DONNÉES SYNCHRONISÉES AUTOMATIQUEMENT */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{formatAmount(statsMetrics.weekEarnings)}</Text>
            <Text style={styles.statLabel}>{t("thisWeek")}</Text>
            {statsMetrics.weekChange !== "0" && (
              <Text style={[
                styles.statChange, 
                { color: parseFloat(statsMetrics.weekChange) > 0 ? "#10B981" : "#bcb7a3" }
              ]}>
                {parseFloat(statsMetrics.weekChange) > 0 ? "↑" : "↓"} {Math.abs(parseFloat(statsMetrics.weekChange))}%
              </Text>
            )}
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#EFF6FF" }]}>
              <Calendar size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{formatAmount(statsMetrics.monthEarnings)}</Text>
            <Text style={styles.statLabel}>{t("thisMonth")}</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#FEF3C7" }]}>
              <TrendingDown size={20} color="#bcb7a3" />
            </View>
            <Text style={styles.statValue}>{formatAmount(statsMetrics.totalWithdrawn)}</Text>
            <Text style={styles.statLabel}>{t("withdrawn")}</Text>
          </View>
        </View>

        {/* ACTIONS RAPIDES */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={[styles.withdrawButton, credits <= 0 && { opacity: 0.5 }]}
            disabled={credits <= 0}
            onPress={() => setShowWithdrawDialog(true)}
          >
            <ArrowDownCircle size={20} color="#fff" />
            <Text style={styles.actionText}>{t("withdraw")}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addButton} onPress={() => setShowCreditDialog(true)}>
            <Plus size={20} color="#fff" />
            <Text style={styles.actionText}>{t("add")}</Text>
          </TouchableOpacity>
        </View>

        {/* RÉSUMÉ DES GAINS - AVEC DONNÉES SYNCHRONISÉES AUTOMATIQUEMENT */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>{t("earningsSummary")}</Text>
            <TouchableOpacity onPress={() => setShowStatsModal(true)}>
              <Filter size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>{t("totalEarned")}</Text>
              <Text style={styles.summaryValue}>{formatAmount(walletStats.earned)}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>{t("totalWithdrawn")}</Text>
              <Text style={styles.summaryValue}>{formatAmount(walletStats.withdrawn)}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>{t("net")}</Text>
              <Text style={[
                styles.summaryValue, 
                { color: walletStats.net >= 0 ? "#059669" : "#bcb7a3" }
              ]}>
                {formatAmount(walletStats.net)}
              </Text>
            </View>
          </View>
          
          {/* Affichage des achats de crédits */}
          {walletStats.creditPurchases > 0 && (
            <View style={styles.extraStats}>
              <Text style={styles.extraLabel}>{t("creditPurchases")}</Text>
              <Text style={styles.extraValue}>{formatAmount(walletStats.creditPurchases)}</Text>
            </View>
          )}
          
          {/* Affichage des retraits en attente */}
          {walletStats.pendingWithdrawals > 0 && (
            <View style={styles.pendingStats}>
              <Text style={styles.pendingStatsLabel}>{t("pendingWithdrawals")}</Text>
              <Text style={styles.pendingStatsValue}>{formatAmount(walletStats.pendingWithdrawals)}</Text>
            </View>
          )}
        </View>

        {/* HISTORY SECTION */}
        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>{t("history")}</Text>
          {transactions.length > PAGE_SIZE && (
            <TouchableOpacity 
              style={styles.seeAllButton} 
              onPress={toggleShowAllTransactions}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>
                {showAllTransactions ? t("showLess") : t("seeAll")}
              </Text>
              <ChevronRight size={16} color="#059669" />
            </TouchableOpacity>
          )}
        </View>

        {/* TRANSACTIONS LIST */}
        {visibleTransactions.length === 0 && !loading ? (
          <View style={styles.emptyHistory}>
            <Wallet size={48} color="#9CA3AF" />
            <Text style={styles.emptyHistoryText}>{t("noTransactions")}</Text>
          </View>
        ) : (
          visibleTransactions.map((tx, index) => (
            <TouchableOpacity 
              key={tx.id} 
              style={[styles.historyCard, index === 0 && styles.firstCard]} 
              onLongPress={() => setDeleteTarget(tx)} 
              activeOpacity={0.7}
            >
              <View style={styles.historyLeft}>
                <View style={[styles.historyIcon, 
                  tx.type === "earning" && { backgroundColor: "#D1FAE5" },
                  tx.type === "withdraw" && { backgroundColor: "#FEF3C7" },
                  tx.type === "credit_purchase" && { backgroundColor: "#DBEAFE" }
                ]}>
                  {iconByType(tx.type)}
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{tx.description}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(tx.date).toLocaleDateString()} {t("at")} {new Date(tx.date).toLocaleTimeString()}
                  </Text>
                  {tx.status === "pending" && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>{t("pending")}</Text>
                    </View>
                  )}
                  {tx.reference && (
                    <Text style={styles.referenceText}>{t("ref")}: {tx.reference}</Text>
                  )}
                </View>
              </View>
              <Animated.Text style={[
                styles.amount, 
                tx.type === "withdraw" ? styles.amountNegative : styles.amountPositive,
                { opacity: fadeAnim }
              ]}>
                {showAmounts ? `${tx.type === "withdraw" ? "-" : "+"}${tx.amount.toLocaleString()}` : "••••"}
              </Animated.Text>
            </TouchableOpacity>
          ))
        )}

        {/* LOAD MORE BUTTON */}
        {!showAllTransactions && visibleTransactions.length < transactions.length && (
          <TouchableOpacity style={styles.loadMore} onPress={loadMoreTransactions}>
            <Text style={styles.loadMoreText}>{t("loadMore")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* DELETE MODAL */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteIconContainer}>
              <Trash size={40} color="#bcb7a3" />
            </View>
            <Text style={styles.deleteTitle}>{t("deleteTransaction")}</Text>
            <Text style={styles.deleteMessage}>{t("deleteTransactionMessage")}</Text>
            <View style={styles.deleteActions}>
              <Pressable onPress={() => setDeleteTarget(null)} style={styles.cancelButton}>
                <Text style={styles.cancel}>{t("cancel")}</Text>
              </Pressable>
              <Pressable onPress={deleteTransaction} style={styles.confirmDeleteButton}>
                <Text style={styles.confirmDelete}>{t("delete")}</Text>
              </Pressable>
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
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <LinearGradient
            colors={["#fff", "#f9fafb"]}
            style={styles.qrModal}
          >
            <Text style={styles.qrTitle}>{t("myQRCode")}</Text>
            <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: fadeQR }}>
              <QRCode 
                value={JSON.stringify({ user_id: user.id, total: credits, token: qrToken })} 
                size={200} 
              />
            </Animated.View>
            {qrExpired && (
              <View style={styles.qrExpiredBadge}>
                <Text style={styles.qrExpiredText}>{t("expired")}</Text>
              </View>
            )}
            <Text style={styles.qrAmount}>{t("availableBalance")}</Text>
            <Text style={styles.qrAmountValue}>{credits.toLocaleString()} {t("credits")}</Text>
            <TouchableOpacity style={styles.qrClose} onPress={() => setShowQRModal(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>{t("close")}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  )
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { padding: 16, paddingBottom: 40 },

  balanceCard: { 
    borderRadius: 24, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: "#047857",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  balanceHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  balanceLeft: { flex: 1 },
  balanceLabel: { color: "#D1FAE5", fontSize: 14, fontWeight: "500", marginBottom: 4 },
  balanceAmount: { color: "#fff", fontSize: 36, fontWeight: "800", letterSpacing: 0.5 },
  pending: { color: "#FEF3C7", marginTop: 8, fontSize: 13 },
  balanceRight: { flexDirection: "row", gap: 12 },
  qrButton: { padding: 8 },
  eyeButton: { padding: 8 },

  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  statCard: { 
    flex: 1, 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  statIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "#D1FAE5", 
    justifyContent: "center", 
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "#6B7280", marginBottom: 2 },
  statChange: { fontSize: 10, fontWeight: "600" },

  actionsCard: { flexDirection: "row", gap: 12, marginBottom: 20 },
  withdrawButton: { 
    flex: 1, 
    backgroundColor: "#bcb7a3", 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#3b342f",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addButton: { 
    flex: 1, 
    backgroundColor: "#059669", 
    borderRadius: 16, 
    padding: 16, 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center",
    shadowColor: "#059669",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  actionText: { color: "#fff", marginLeft: 8, fontWeight: "700", fontSize: 15 },

  summaryCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 20 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  summaryTitle: { fontSize: 14, fontWeight: "600", color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700", color: "#111827" },
  
  extraStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  extraLabel: { fontSize: 12, color: "#6B7280" },
  extraValue: { fontSize: 14, fontWeight: "600", color: "#2563EB" },
  
  pendingStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
  },
  pendingStatsLabel: { fontSize: 12, fontWeight: "500", color: "#B45309" },
  pendingStatsValue: { fontSize: 14, fontWeight: "700", color: "#B45309" },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  seeAllButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  seeAllText: { fontSize: 13, fontWeight: "600", color: "#059669" },

  historyCard: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  firstCard: { marginTop: 0 },
  historyLeft: { flexDirection: "row", gap: 12, flex: 1 },
  historyIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  historyInfo: { flex: 1 },
  historyTitle: { fontWeight: "700", fontSize: 14, marginBottom: 2 },
  historyDate: { fontSize: 11, color: "#6B7280" },
  referenceText: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  amount: { fontWeight: "800", fontSize: 16 },
  amountPositive: { color: "#10B981" },
  amountNegative: { color: "#bcb7a3" },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  pendingBadgeText: { fontSize: 9, fontWeight: "600", color: "#705b4a" },

  loadMore: { alignSelf: "center", padding: 12, marginTop: 8 },
  loadMoreText: { color: "#059669", fontWeight: "600" },

  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginTop: 8,
    gap: 12,
  },
  emptyHistoryText: { fontSize: 14, color: "#9CA3AF" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  deleteModal: { backgroundColor: "#fff", padding: 24, borderRadius: 24, width: "85%", alignItems: "center" },
  deleteIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FEF3C7", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  deleteTitle: { fontWeight: "800", fontSize: 18, marginBottom: 8 },
  deleteMessage: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 },
  deleteActions: { flexDirection: "row", justifyContent: "center", gap: 12, width: "100%" },
  cancelButton: { flex: 1, backgroundColor: "#F3F4F6", paddingVertical: 12, borderRadius: 12 },
  cancel: { color: "#6B7280", fontWeight: "600", textAlign: "center" },
  confirmDeleteButton: { flex: 1, backgroundColor: "#3b342f", paddingVertical: 12, borderRadius: 12 },
  confirmDelete: { color: "#fff", fontWeight: "800", textAlign: "center" },

  qrModal: { 
    backgroundColor: "#fff", 
    padding: 28, 
    borderRadius: 28, 
    alignItems: "center", 
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  qrTitle: { fontSize: 20, fontWeight: "800", marginBottom: 24, color: "#111827" },
  qrExpiredBadge: { position: "absolute", top: "40%", backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  qrExpiredText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  qrAmount: { marginTop: 20, fontSize: 13, color: "#6B7280" },
  qrAmountValue: { fontSize: 24, fontWeight: "800", marginTop: 6, color: "#059669" },
  qrClose: { marginTop: 24, backgroundColor: "#059669", paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30 },
})

