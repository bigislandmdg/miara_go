import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

function Skeleton({ style, ...props }: { style?: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      {...props}
      style={[
        styles.skeleton,
        style,
        { opacity }, // animation
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#e0e0e0", // couleur "accent" par défaut
    borderRadius: 4,
  },
});

export { Skeleton };
