import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewProps } from "react-native";

interface ProgressProps extends ViewProps {
  value?: number; // 0 à 100
}

export function Progress({ value = 0, style, ...props }: ProgressProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: value,
      duration: 300,
      useNativeDriver: false, // width ne peut pas être animé avec native driver
    }).start();
  }, [value]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.root, style]} {...props}>
      <Animated.View
        style={[
          styles.indicator,
          { width: widthInterpolated },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: 8, // équivalent à h-2
    width: "100%",
    borderRadius: 4, // arrondi du fond
    backgroundColor: "rgba(59, 130, 246, 0.2)", // bg-primary/20
    overflow: "hidden",
  },
  indicator: {
    height: "100%",
    backgroundColor: "#3B82F6", // bleu Tailwind "primary"
    borderRadius: 9999,
  },
});
