import React from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  StyleProp,
} from "react-native";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: (event: GestureResponderEvent) => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

/** Bouton avec variantes et tailles */
export function Button({
  variant = "default",
  size = "default",
  children,
  onPress,
  style,
  textStyle,
  disabled,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        pressed && pressedStyles[variant],
        style,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[textStyles.base, textVariantStyles[variant], textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});

// Variantes pour le container
const variantStyles: Record<ButtonVariant, ViewStyle> = {
  default: { backgroundColor: "#3B82F6" },
  destructive: { backgroundColor: "#EF4444" },
  outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#D1D5DB" },
  secondary: { backgroundColor: "#E5E7EB" },
  ghost: { backgroundColor: "transparent" },
  link: { backgroundColor: "transparent" },
};

// Styles lors du press
const pressedStyles: Record<ButtonVariant, ViewStyle> = {
  default: { opacity: 0.8 },
  destructive: { opacity: 0.8 },
  outline: { backgroundColor: "#F3F4F6" },
  secondary: { opacity: 0.8 },
  ghost: { backgroundColor: "#F3F4F6" },
  link: { opacity: 0.6 },
};

// Variantes pour le texte
const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  default: { color: "#fff" },
  destructive: { color: "#fff" },
  outline: { color: "#111827" },
  secondary: { color: "#111827" },
  ghost: { color: "#111827" },
  link: { color: "#3B82F6", textDecorationLine: "underline" },
};

// Tailles
const sizeStyles: Record<ButtonSize, ViewStyle> = {
  default: { height: 36, paddingHorizontal: 16 },
  sm: { height: 32, paddingHorizontal: 12 },
  lg: { height: 40, paddingHorizontal: 20 },
  icon: { width: 36, height: 36, paddingHorizontal: 0 },
};

// Texte de base
const textStyles = StyleSheet.create({
  base: { fontSize: 14, fontWeight: "500" },
});
