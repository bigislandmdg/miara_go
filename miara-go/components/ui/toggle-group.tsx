import React, { createContext, useContext } from "react";
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";

type ToggleVariant = "default" | "outline";
type ToggleSize = "default" | "sm" | "lg";

type ToggleGroupContextProps = {
  variant?: ToggleVariant;
  size?: ToggleSize;
};

const ToggleGroupContext = createContext<ToggleGroupContextProps>({
  size: "default",
  variant: "default",
});

type ToggleGroupProps = {
  children: React.ReactNode;
  variant?: ToggleVariant;
  size?: ToggleSize;
  style?: ViewStyle;
};

export const ToggleGroup: React.FC<ToggleGroupProps> = ({ children, variant = "default", size = "default", style }) => {
  return (
    <ToggleGroupContext.Provider value={{ variant, size }}>
      <View style={[styles.group, style]}>{children}</View>
    </ToggleGroupContext.Provider>
  );
};

type ToggleGroupItemProps = {
  children: React.ReactNode;
  onPress?: () => void;
  active?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const ToggleGroupItem: React.FC<ToggleGroupItemProps> = ({ children, onPress, active = false, style, textStyle }) => {
  const context = useContext(ToggleGroupContext);
  const { variant, size } = context;

  const backgroundColor = active
    ? variant === "outline"
      ? "#e5e7eb" // gris clair pour "outline" actif
      : "#3b82f6" // bleu pour "default"
    : variant === "outline"
    ? "#f9fafb" // gris très clair pour "outline" inactif
    : "#ffffff"; // blanc pour "default" inactif

  const textColor = active
    ? variant === "outline"
      ? "#111827"
      : "#ffffff"
    : "#111827";

  const paddingVertical = size === "sm" ? 4 : size === "lg" ? 12 : 8;
  const paddingHorizontal = size === "sm" ? 8 : size === "lg" ? 24 : 16;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.item,
        {
          backgroundColor,
          paddingVertical,
          paddingHorizontal,
          borderRadius: 4,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: "#d1d5db",
        },
        style,
      ]}
    >
      <Text style={[{ color: textColor, textAlign: "center" }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
  },
  item: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
