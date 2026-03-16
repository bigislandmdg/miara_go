import React from "react";
import { Text, View, ViewProps, TextProps, StyleSheet, StyleProp, TextStyle } from "react-native";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  textStyle?: StyleProp<TextStyle>;
}

/** Badge simple avec variantes */
export function Badge({ variant = "default", children, style, textStyle, ...props }: BadgeProps) {
  return (
    <View style={[styles.badge, variantStyles[variant], style]} {...props}>
      <Text style={[styles.text, variantTextStyles[variant], textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});

const variantStyles: Record<BadgeVariant, ViewProps["style"]> = {
  default: { backgroundColor: "#E0F2FE", borderColor: "transparent" },
  secondary: { backgroundColor: "#EDE9FE", borderColor: "transparent" },
  destructive: { backgroundColor: "#FECACA", borderColor: "transparent" },
  outline: { backgroundColor: "transparent", borderColor: "#D1D5DB" },
};

const variantTextStyles: Record<BadgeVariant, TextStyle> = {
  default: { color: "#0284C7" },
  secondary: { color: "#7C3AED" },
  destructive: { color: "#B91C1C" },
  outline: { color: "#111827" },
};
