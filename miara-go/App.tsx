// App.tsx (FINAL – Booking + Chat stable)
import React, { useEffect, useState } from "react";
import { View, SafeAreaView } from "react-native";
import Toast from "react-native-toast-message";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { GetStartedScreen } from "./components/GetStartedScreen";
import { SignupScreen, SignupData } from "./components/SignupScreen";
import OTPVerificationScreen from "./components/OTPVerificationScreen";
import { LoginScreen } from "./components/LoginScreen";
import ProfileScreen from "./components/ProfileScreen";
import PassengerHome, { Trip as PassengerTrip, Offer } from "./components/PassengerHome";
import BookingScreen from "./components/BookingScreen";

import { GestureHandlerRootView } from "react-native-gesture-handler";


type MeetingPoint = {
  name: string;
  location: string;
};

type BookingTrip = {
  ride_id: number;
  offer_id: number | null;
  departure: string;
  arrival: string;
  date: string;
  time: string;
  price: number;
  vehicle: {
    model: string;
    plate: string;
    totalSeats: number;
    availableSeats: number;
  };
  id: string;
};
import PassengerHistoryScreen from "./components/PassengerHistoryScreen";
import { DriverHome } from "./components/DriverHome";
import { PublishScreen } from "./components/PublishScreen";
import { SearchResultsScreen } from "./components/SearchResultsScreen";
import NotificationsScreen from "./components/NotificationsScreen";
import { ChatScreen, Trip as ChatTrip } from "./components/ChatScreen";
import { Navigation } from "./components/Navigation";
import { DriverWallet } from "./components/DriverWallet";
import RatingScreen from "./components/RatingScreen";
import { TripScreen } from "./components/TripScreen";
import { AppSplashScreen } from "./components/SplashScreen";
import { LanguageProvider } from "./providers/LanguageProvider";
import AboutScreen from "./components/AboutScreen";
import SettingsScreen from "./components/SettingsScreen";
import HelpScreen from "./components/HelpScreen";

type UserType = "passenger" | "driver" | null;
type MainView =
  | "home"
  | "trip"
  | "publish"
  | "profile"
  | "notifications"
  | "booking"
  | "search-results"
  | "chat"
  | "wallet"
  | "rating"
  | "about"
  | "settings"
  | "help"
  | "history";

type SelectedTrip = {
  trip: BookingTrip;
  offer: Offer | null;
  seats: number;
};


type AuthView = "get-started" | "signup" | "login" | "otp-verification";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<UserType>(null);
  const [authView, setAuthView] = useState<AuthView>("get-started");
  const [currentView, setCurrentView] = useState<MainView>("home");

  const [showResults, setShowResults] = useState(false);
  const [phoneForOTP, setPhoneForOTP] = useState("");
  const [otpContext, setOtpContext] = useState<"signup" | "login">("signup");
  const [signupData, setSignupData] = useState<SignupData | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  const [selectedTrip, setSelectedTrip] = useState<SelectedTrip | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

    // DATA centralisée
  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchQuery, setSearchQuery] = useState<{ departure: string; arrival: string } | null>(null);

   // Ajout de showSplash
    // 🔹 Cacher SplashScreen après 2 secondes
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 30000);
    return () => clearTimeout(timer);
  }, []);

  
  // Normaliser pour Booking
  const normalizeTrip = (t: any): BookingTrip => ({
    ride_id: Number(t.id),
    offer_id: t.offer_id ?? null,
    departure: t.departure ?? "",
    arrival: t.arrival ?? "",
    date: t.date ?? "",
    time: t.time ?? "",
    price: Number(t.price ?? 0),
    vehicle: {
      model: t.vehicle?.model ?? "Voiture",
      plate: t.vehicle?.plate ?? "",
      totalSeats: Number(t.vehicle?.totalSeats ?? 4),
      availableSeats: Number(t.vehicle?.availableSeats ?? 1),
    },
    id: String(t.id),
  });

  const normalizeTripForChat = (t: BookingTrip & { meetingPoints?: MeetingPoint[]; driver?: any }): ChatTrip => ({
    id: String(t.ride_id),
    departure: t.departure,
    arrival: t.arrival,
    date: t.date,
    time: t.time,
    price: t.price,
    meetingPoints: t.meetingPoints ? t.meetingPoints.map(mp => mp.name) : ["Point de rencontre non spécifié"],
    driver: t.driver ?? { name: "Conducteur", rating: 4.7, avatar: "", contact: "" },
    //vehicle: t.vehicle,
  });

  // MAIN VIEW
  const renderMainView = () => {
    if (!userType) return null;

    switch (currentView) {
      case "home":
      return userType === "passenger" ? (
    <>
      <PassengerHome
          userId={userId ?? 0} // <-- ici userId doit être défini
           onBookTrip={(trip, offer, seats) => {
           setSelectedTrip({ trip: normalizeTrip(trip), offer, seats: seats ?? 1 });
           setCurrentView("booking");
        }}
  onSearch={(t, o) => {
    setTrips(t);
    setOffers(o);
    setSearchQuery({ departure: "", arrival: "" });
    setShowResults(true);
  }}
  onNotifications={() => setCurrentView("notifications")}
  onProfileClick={() => setCurrentView("profile")}
/>


      <SearchResultsScreen
        visible={showResults}
        trips={trips}
        offers={offers}
        searchQuery={searchQuery ?? undefined}
        onClose={() => setShowResults(false)}
        onSelectTrip={(trip) => {
          setSelectedTrip({ trip: normalizeTrip(trip), offer: null, seats: 1 });
          setShowResults(false);
          setCurrentView("booking");
        }}
      />
    </>
  ) : (
    <DriverHome
      onPublish={() => setCurrentView("publish")}
      onNotifications={() => setCurrentView("notifications")}
      onProfileClick={() => setCurrentView("profile")}
      onViewChange={setCurrentView}
    />
     );
 
      case "publish":
        return <PublishScreen userId={userId} userType={userType} onBack={() => setCurrentView("home")} />;

      case "trip":
        return <TripScreen userId={userId ?? 0} onBack={() => setCurrentView("home")} />;
     
      
      case "booking":
  if (!selectedTrip) return null;

  return (
    <BookingScreen
      trip={selectedTrip.trip as unknown as PassengerTrip}
      offer={selectedTrip.offer ?? undefined}
      onClose={() => {
        setSelectedTrip(null);
        setCurrentView("home");
      } }
      onBookingSuccess={(trip) => {
        setSelectedTrip({
          trip: normalizeTrip(trip),
          offer: null,
          seats: 1,
        });
        setCurrentView("chat");
      } } userId={0}    />
  );


      case "chat":
        return selectedTrip?.trip ? (
          <ChatScreen
            trip={normalizeTripForChat(selectedTrip.trip)}
            currentUserType={userType}
            onBack={() => setCurrentView("home")}
          />
        ) : null;

      case "notifications":
        return <NotificationsScreen onBack={() => setCurrentView("home")} />;

      case "wallet":
        return <DriverWallet
          onViewChange={setCurrentView}
        />;

      case "rating":
  return (
    <RatingScreen
      onBack={() => setCurrentView("home")}
      tripUser={{
        nom: "",
        prenom: "",
        id: "",
        role: userType === "passenger" ? "passenger" : "driver",
      }}
      tripDetails={{ departure: "", arrival: "", date: "" }}
      rideId={0}          // ✅ nombre par défaut
      reviewerId={0}      // ✅ nombre par défaut
      reviewedId={0}      // ✅ nombre par défaut
      token={""}          // ok, string
    />
  );

      case "history":
      return (
      <PassengerHistoryScreen
          onBack={() => setCurrentView("home")}
          onBookingPress={(trip, bookingId) => {
          // 🔹 Convert Trip (PassengerTrip) -> BookingTrip pour BookingScreen
          const bookingTrip: BookingTrip = {
            ride_id: Number(trip.id),
            offer_id: null, // Historique n'a pas d'offre
            departure: trip.departure,
            arrival: trip.arrival,
            date: trip.date,
            time: trip.time,
            price: trip.price,
            vehicle: {
               model: trip.vehicle.model,
               plate: trip.vehicle.plate,
               totalSeats: trip.vehicle.totalSeats,
               availableSeats: trip.vehicle.availableSeats,
            },
            id: trip.id,
         };

        setSelectedTrip({
          trip: bookingTrip,
          offer: null,
          seats: 1,
        });

        // 🔹 Normalisation pour ChatScreen
        setCurrentView("chat");
        }}
      />
      );

      case "profile":
      return (
        <ProfileScreen
             userType={userType!}
             onLogout={handleLogout}
             onBack={() => setCurrentView("home")}
        />
      );

      case "about":
        return <AboutScreen onBack={() => setCurrentView("home")} />;

      case "settings":
        return <SettingsScreen onBack={() => setCurrentView("home")}/>;
        
      case "help":
        return <HelpScreen onBack={() => setCurrentView("home")} />;
        
        
      default:
        return null;
    }
  };

  // AUTH
  const handleSignup = (data: SignupData) => {
    setSignupData(data);
    setPhoneForOTP(data.phone);
    setOtpContext("signup");
    setAuthView("otp-verification");
  };

  const handleLoginRequest = (phone: string) => {
    setPhoneForOTP(phone);
    setOtpContext("login");
    setAuthView("otp-verification");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserType(null);
    setUserId(null);
    setSelectedTrip(null);
    setAuthView("get-started");
    setCurrentView("home");
    Toast.show({ type: "success", text1: "Déconnecté", text2: "Vous avez été déconnecté" });
  };

  return (
    
     <LanguageProvider>
  <NavigationContainer>
    {showSplash ? (
      <AppSplashScreen onFinish={function (): void {
          throw new Error("Function not implemented.");
        } } />
    ) : !isAuthenticated ? (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authView === "get-started" && (
          <Stack.Screen name="GetStarted">
            {() => (
              <GetStartedScreen
                onSignup={() => setAuthView("signup")}
                onLogin={() => setAuthView("login")}
              />
            )}
          </Stack.Screen>
        )}

        {authView === "signup" && (
          <Stack.Screen name="Signup">
            {() => (
              <SignupScreen
                onSignup={handleSignup}
                onBackToLogin={() => setAuthView("login")}
              />
            )}
          </Stack.Screen>
        )}

        {authView === "login" && (
          <Stack.Screen name="Login">
            {() => (
              <LoginScreen
                onLoginRequest={handleLoginRequest}
                onBackToSignup={() => setAuthView("signup")}
                onGoToRegister={() => setAuthView("signup")}
              />
            )}
          </Stack.Screen>
        )}

        {authView === "otp-verification" && (
          <Stack.Screen name="OTPVerification">
            {() => (
              <OTPVerificationScreen
                phoneNumber={phoneForOTP}
                role="passenger"
                onBack={() =>
                  setAuthView(otpContext === "signup" ? "signup" : "login")
                }
                onVerified={(role, id) => {
                  setIsAuthenticated(true);
                  setUserType(role === "driver" ? "driver" : "passenger");
                  setUserId(id);
                  setCurrentView("home");
                }}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    ) : (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{renderMainView()}</View>
        <Navigation
          userType={userType}
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />
      </SafeAreaView>
    )}

    <Toast />
  </NavigationContainer>
</LanguageProvider>
);
}
