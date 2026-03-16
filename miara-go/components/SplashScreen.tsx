import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Easing, Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { Logo } from "./ui/logo";

// Empêche Expo de cacher le splash trop tôt
SplashScreen.preventAutoHideAsync();

interface AppSplashScreenProps {
  onFinish: () => void;
}

export function AppSplashScreen({ onFinish }: AppSplashScreenProps) {
  const scale = useRef(new Animated.Value(1.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  // Version de l'app (Expo / EAS)
  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest?.version ||
    "1.0.0";

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),

      // ⏳ Pause légère pour branding
      Animated.delay(1200),
    ]).start(async () => {
      await SplashScreen.hideAsync();
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo animé */}
      <Animated.View
        style={{
          opacity,
          transform: [{ scale }, { translateY }],
        }}
      >
        <Logo fontSize={60} variant="dark" />
      </Animated.View>

      {/* Chip version en bas */}
      <View style={styles.versionChip}>
        <Text style={styles.versionText}>Version {appVersion}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#059669", // Vert MiaraGo
    justifyContent: "center",
    alignItems: "center",
  },

  versionChip: {
    position: "absolute",
    bottom: 32,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  versionText: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.8,
  },
});
