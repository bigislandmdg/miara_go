import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapViewRN, { Marker, Polyline, Region } from 'react-native-maps';
// @ts-ignore: expo-location may not be available in all environments or its types may be missing
import * as Location from 'expo-location';

export const MADAGASCAR_CITIES = {
  Antananarivo: { lat: -18.8792, lng: 47.5079 },
  Antsirabe: { lat: -19.8667, lng: 47.0333 },
  Fianarantsoa: { lat: -21.4514, lng: 47.0857 },
  Toamasina: { lat: -18.1443, lng: 49.4122 },
  Mahajanga: { lat: -15.7167, lng: 46.3167 },
  Toliara: { lat: -23.35, lng: 43.6667 },
  Antsiranana: { lat: -12.2787, lng: 49.2917 },
  Morondava: { lat: -20.2833, lng: 44.2833 },
  'Nosy Be': { lat: -13.3214, lng: 48.2608 },
  Ambositra: { lat: -20.5333, lng: 47.25 },
};

interface LocationType {
  lat: number;
  lng: number;
  label?: string;
}

interface MapViewProps {
  startLocation?: LocationType;
  endLocation?: LocationType;
  driverLocation?: LocationType;
  passengerLocation?: LocationType;
  showRoute?: boolean;
  enableGeolocation?: boolean;
  centerOnDriver?: boolean;
}

export function MapView({
  startLocation,
  endLocation,
  driverLocation,
  passengerLocation,
  showRoute = false,
  enableGeolocation = false,
  centerOnDriver = false,
}: MapViewProps) {
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: MADAGASCAR_CITIES.Antananarivo.lat,
    longitude: MADAGASCAR_CITIES.Antananarivo.lng,
    latitudeDelta: 5,
    longitudeDelta: 5,
  });

  // Géolocalisation
  useEffect(() => {
    (async () => {
      if (!enableGeolocation) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
    })();
  }, [enableGeolocation]);

  // Calcul du centre
  useEffect(() => {
    const locations = [
      startLocation,
      endLocation,
      driverLocation,
      passengerLocation,
      userLocation,
    ].filter((l): l is LocationType => l !== undefined && l !== null);

    if (locations.length === 0) return;

    const lats = locations.map((l) => l.lat);
    const lngs = locations.map((l) => l.lng);

    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;

    const deltaLat = Math.max(...lats) - Math.min(...lats) + 0.1;
    const deltaLng = Math.max(...lngs) - Math.min(...lngs) + 0.1;

    const targetRegion = {
      latitude: centerOnDriver && driverLocation ? driverLocation.lat : centerLat,
      longitude: centerOnDriver && driverLocation ? driverLocation.lng : centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };

    setRegion(targetRegion);
  }, [startLocation, endLocation, driverLocation, passengerLocation, userLocation, centerOnDriver]);

  return (
    <View style={styles.container}>
      <MapViewRN style={styles.map} region={region}>
        {startLocation && (
          <Marker
            coordinate={{ latitude: startLocation.lat, longitude: startLocation.lng }}
            title={startLocation.label || 'Départ'}
            pinColor="green"
          />
        )}
        {endLocation && (
          <Marker
            coordinate={{ latitude: endLocation.lat, longitude: endLocation.lng }}
            title={endLocation.label || 'Arrivée'}
            pinColor="red"
          />
        )}
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Conducteur"
            pinColor="blue"
          />
        )}
        {passengerLocation && (
          <Marker
            coordinate={{ latitude: passengerLocation.lat, longitude: passengerLocation.lng }}
            title="Passager"
            pinColor="orange"
          />
        )}
        {userLocation && enableGeolocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="Vous"
            pinColor="purple"
          />
        )}

        {showRoute && startLocation && endLocation && (
          <Polyline
            coordinates={[
              { latitude: startLocation.lat, longitude: startLocation.lng },
              { latitude: endLocation.lat, longitude: endLocation.lng },
            ]}
            strokeColor="#4f46e5"
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapViewRN>

      {/* Légende */}
      <View style={styles.legend}>
        {startLocation && <LegendItem color="green" label="Départ" />}
        {endLocation && <LegendItem color="red" label="Arrivée" />}
        {driverLocation && <LegendItem color="blue" label="Conducteur" />}
        {passengerLocation && <LegendItem color="orange" label="Passager" />}
        {userLocation && enableGeolocation && <LegendItem color="purple" label="Vous" />}
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <View style={{ width: 12, height: 12, backgroundColor: color, borderRadius: 6, marginRight: 4 }} />
      <Text style={{ fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: 400 },
  legend: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 8,
  },
});
