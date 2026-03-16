import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { Car, MapPin, Calendar, Clock } from "lucide-react-native";

import type { Trip } from "./PassengerHome";
import { useTranslation } from "react-i18next";

type PassengerHistoryProps = {
  onBack: () => void;
  onBookingPress: (trip: Trip, bookingId: string) => void;
};

interface Booking {
  id: string;
  ride_id: string;
  offer_id: string | null;
  seats_reserved: string;
  total_price: string;
  status: string;
  created_at: string;
}

interface HistoryItem {
  id: string;
  status: "pending" | "completed";
  seats: number;
  totalPrice: number;
  meetingPoint?: string;
  vehicleModel?: string;
  trip: Trip;
}

const ITEMS_PER_PAGE = 4;

export default function PassengerHistoryScreen({
  onBack,
  onBookingPress,
}: PassengerHistoryProps) {

  const { t } = useTranslation();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] =
    useState<"pending" | "completed">("pending");

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  /* ================= FETCH ================= */

  const fetchData = async () => {
    try {

      setLoading(true);

      const [ridesRes, bookingsRes] = await Promise.all([
        fetch("http://10.0.2.2:8080/rides"),
        fetch("http://10.0.2.2:8080/bookings"),
      ]);

      const ridesJson = await ridesRes.json();
      const bookingsJson = await bookingsRes.json();

      const ridesArray = ridesJson?.rides ?? [];
      const bookingsArray = bookingsJson?.bookings ?? [];

      const mappedTrips: Trip[] = ridesArray.map((r: any) => ({

        id: String(r.id),

        departure: r.departure ?? "",
        arrival: r.arrival ?? "",

        date: r.date ?? "",
        time: r.time ?? "",

        price: Number(r.price ?? 0),

        meetingPoints: r.meetingPoint
          ? [r.meetingPoint.name]
          : [],

        driver: {
          name: "Driver",
          rating: 4.7,
          avatar: "https://via.placeholder.com/80",
        },

        vehicle: {
          model: `${r.vehicle?.marque ?? ""} ${r.vehicle?.model ?? ""}`,
          plate: r.vehicle?.plate ?? "",
          totalSeats: Number(r.vehicle?.totalSeats ?? 0),
          availableSeats: Number(r.availableSeats ?? 0),
        },

      }));

      setTrips(mappedTrips);
      setBookings(bookingsArray);

      setPage(1);
      setHasMore(true);

    } catch (e) {

      console.log("History fetch error:", e);

      setTrips([]);
      setBookings([]);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {

    setRefreshing(true);

    await fetchData();

    setRefreshing(false);

  };

  /* ================= MERGE BOOKINGS + RIDES ================= */

  const historyData: HistoryItem[] = useMemo(() => {

    return bookings
      .map((b) => {

        const trip = trips.find((t) => t.id === String(b.ride_id));

        if (!trip) return null;

        return {

          id: b.id,

          status: b.status === "pending"
            ? "pending"
            : "completed",

          seats: Number(b.seats_reserved),

          totalPrice: Number(b.total_price),

          meetingPoint: trip.meetingPoints?.[0] ?? "",

          vehicleModel: trip.vehicle?.model ?? "",

          trip,

        };

      })
      .filter(Boolean) as HistoryItem[];

  }, [bookings, trips]);

  /* ================= FILTER + PAGINATION ================= */

  const filteredData = historyData
    .filter((h) => h.status === activeTab);

  const paginatedData =
    filteredData.slice(0, page * ITEMS_PER_PAGE);

  const loadMore = () => {

    if (loadingMore || !hasMore) return;

    if (page * ITEMS_PER_PAGE >= filteredData.length) {

      setHasMore(false);
      return;

    }

    setLoadingMore(true);

    setTimeout(() => {

      setPage((p) => p + 1);

      setLoadingMore(false);

    }, 300);
  };

  /* ================= SKELETON ================= */

  const SkeletonCard = () => (
    <View style={styles.card}>
      <View style={styles.skeletonLarge}/>
      <View style={styles.skeletonSmall}/>
      <View style={styles.skeletonMedium}/>
    </View>
  );

  /* ================= RENDER ================= */

  const renderItem = ({ item }: { item: HistoryItem }) => (

    <View style={styles.card}>

      {/* ROUTE */}
      <Text style={styles.route}>
        {item.trip.departure} → {item.trip.arrival}
      </Text>

      {/* VEHICLE */}
      <View style={styles.row}>
        <Car size={16} color="#374151"/>
        <Text style={styles.meta}>
          {item.vehicleModel}
        </Text>
      </View>

      {/* MEETING POINT */}
      <View style={styles.row}>
        <MapPin size={16} color="#6B7280"/>
        <Text style={styles.meta}>
          {item.meetingPoint}
        </Text>
      </View>

      {/* DATE */}
      <View style={styles.row}>
        <Calendar size={16} color="#6B7280"/>
        <Text style={styles.meta}>
          {item.trip.date}
        </Text>
      </View>

      {/* TIME */}
      <View style={styles.row}>
        <Clock size={16} color="#6B7280"/>
        <Text style={styles.meta}>
          {item.trip.time}
        </Text>
      </View>

      {/* SEATS + PRICE */}
      <Text style={styles.price}>
        {item.seats} {t("seats")} •
        {item.totalPrice.toLocaleString()} Ar
      </Text>

      {/* FOOTER */}
      <View style={styles.footerRow}>

      {/* STATUS CHIP */}
      <View
         style={[
            styles.statusChip,
            item.status === "pending"
               ? styles.statusPending
               : styles.statusCompleted,
            ]}
          >
         <Text style={styles.statusText}>
           {item.status === "pending"
             ? t("pending")
             : t("completed")}
          </Text>
        </View>

  {/* DETAILS CHIP */}
  <TouchableOpacity
    style={styles.detailsChip}
    onPress={() =>
      onBookingPress(item.trip, item.id)
    }
  >
    <Text style={styles.detailsChipText}>
      {t("seeDetails")}
    </Text>
  </TouchableOpacity>

</View>

    </View>
  );

  /* ================= UI ================= */

  return (

    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={22} color="#fff"/>
        </TouchableOpacity>

        <Text style={styles.title}>
          {t("passengerHistoryTitle")}
        </Text>

        <View style={{ width: 22 }}/>

      </View>

      {/* TABS */}
      <View style={styles.tabs}>

        {["pending", "completed"].map((tab) => (

          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab as any)}
          >

            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "pending"
                ? t("pending")
                : t("completed")}
            </Text>

          </TouchableOpacity>

        ))}

      </View>

      {/* LIST */}
      {loading ? (

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          contentContainerStyle={{ padding: 16 }}
        >

          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i}/>
          ))}

        </ScrollView>

      ) : (

        <FlatList
          data={paginatedData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator color="#047857"/>
              : null
          }
        />

      )}

    </View>

  );
}

/* ================= STYLES ================= */

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#F3F4F6"
},

header:{
flexDirection:"row",
paddingTop:26,
paddingBottom:22,
paddingHorizontal:16,
backgroundColor:"#047857",
alignItems:"center"
},

title:{
flex:1,
textAlign:"center",
color:"#fff",
fontSize:18,
fontWeight:"600"
},

tabs:{
flexDirection:"row",
marginTop:12,
marginBottom:8,
paddingHorizontal:8
},

tab:{
flex:1,
paddingVertical:10,
borderRadius:22,
marginHorizontal:6,
backgroundColor:"#E5E7EB"
},

tabActive:{
backgroundColor:"#047857"
},

tabText:{
textAlign:"center",
fontWeight:"600",
color:"#6B7280"
},

tabTextActive:{
color:"#fff"
},

card:{
backgroundColor:"#fff",
padding:18,
borderRadius:20,
marginBottom:16,
width:width-32,
alignSelf:"center",
shadowColor:"#000",
shadowOpacity:0.05,
shadowRadius:8,
elevation:3
},

route:{
fontWeight:"700",
fontSize:16
},

row:{
flexDirection:"row",
alignItems:"center",
marginTop:6,
gap:6
},

meta:{
fontSize:13,
color:"#374151"
},

price:{
marginTop:8,
fontWeight:"600",
color:"#111827"
},

statusChip:{
alignSelf:"flex-start",
marginTop:10,
paddingHorizontal:10,
paddingVertical:4,
borderRadius:12
},

statusPending:{
backgroundColor:"#FEF3C7"
},

statusCompleted:{
backgroundColor:"#D1FAE5"
},

statusText:{
fontSize:12,
fontWeight:"600"
},

detailsButton:{
marginTop:14,
backgroundColor:"#047857",
paddingVertical:12,
borderRadius:14,
alignItems:"center"
},

detailsText:{
color:"#fff",
fontWeight:"700"
},

skeletonLarge:{
height:16,
width:"60%",
backgroundColor:"#D1D5DB",
borderRadius:6
},

skeletonSmall:{
height:12,
width:"40%",
backgroundColor:"#D1D5DB",
borderRadius:6,
marginTop:8
},

skeletonMedium:{
height:12,
width:"80%",
backgroundColor:"#D1D5DB",
borderRadius:6,
marginTop:8
},

footerRow:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
marginTop:14
},

detailsChip:{
backgroundColor:"#ECFDF5",
paddingHorizontal:14,
paddingVertical:6,
borderRadius:20,
borderWidth:1,
borderColor:"#047857"
},

detailsChipText:{
color:"#047857",
fontWeight:"600",
fontSize:12
},

});
