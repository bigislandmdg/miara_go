import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface LogoProps {
  fontSize?: number;
  text?: string;
  variant?: "light" | "dark";
}

export function Logo({
  fontSize = 54,
  text,
  variant = "light",
}: LogoProps) {
  const color = variant === "dark" ? "#FFFFFF" : "#059669";

  // ✅ SÉCURITÉ ABSOLUE : forcer une string
  const safeText =
    typeof text === "string" && text.length > 0 ? text : "MiaraGo";

  const letters = safeText.split("");

  return (
    <View style={styles.row}>
      {letters.map((char, index) => {
        const isR = char.toLowerCase() === "r";

        return (
          <View key={`logo-letter-${index}`} style={styles.letterWrapper}>
            <Text
              style={[
                styles.text,
                {
                  fontSize,
                  color,
                  textShadowColor:
                    variant === "dark"
                      ? "transparent"
                      : "rgba(0,0,0,0.15)",
                },
              ]}
            >
              {char}
            </Text>

            {isR && (
              <View
                style={[
                  styles.dot,
                  { backgroundColor: color },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  letterWrapper: {
    alignItems: "center",
    marginHorizontal: 1,
    position: "relative",
  },

  text: {
    fontWeight: "900",
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },

  dot: {
    position: "absolute",
    bottom: -10,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
