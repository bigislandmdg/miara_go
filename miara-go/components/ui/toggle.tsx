import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";

type ToggleProps = {
  onPress?: () => void;
  value?: boolean;
  variant?: ToggleVariant;
  size?: ToggleSize;
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const Toggle: React.FC<ToggleProps> = ({
  onPress,
  value = false,
  variant = "default",
  size = "default",
  children,
  style,
  textStyle,
}) => {
  const [isOn, setIsOn] = useState(value);

  const handlePress = () => {
    setIsOn((prev) => !prev);
    onPress?.();
  };

  // Déterminer les couleurs selon variant et état
  const backgroundColor = isOn
    ? variant === "outline"
      ? "#3b82f6" // accent bleu pour outline actif
      : "#3b82f6" // accent bleu pour default actif
    : variant === "outline"
    ? "#ffffff"
    : "transparent";

  const borderColor = variant === "outline" ? "#d1d5db" : "transparent";

  const color = isOn
    ? variant === "outline"
      ? "#ffffff"
      : "#ffffff"
    : "#111827";

  const paddingVertical = size === "sm" ? 4 : size === "lg" ? 12 : 8;
  const paddingHorizontal = size === "sm" ? 8 : size === "lg" ? 24 : 16;
  const minWidth = size === "sm" ? 32 : size === "lg" ? 40 : 36;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.toggle,
        {
          backgroundColor,
          borderColor,
          paddingVertical,
          paddingHorizontal,
          minWidth,
        },
        style,
      ]}
    >
      <Text style={[{ color, textAlign: "center" }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  toggle: {
    borderWidth: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
});
