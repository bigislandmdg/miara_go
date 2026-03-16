import React from "react";
import { View, Text, StyleSheet, ViewProps, TextProps } from "react-native";

type AlertVariant = "default" | "destructive";

interface AlertProps extends ViewProps {
  variant?: AlertVariant;
}

interface AlertTitleProps extends TextProps {}
interface AlertDescriptionProps extends TextProps {}

/** Container principal de l'alerte */
export function Alert({ variant = "default", style, ...props }: AlertProps) {
  return <View style={[styles.alert, variantStyles[variant], style]} {...props} />;
}

/** Titre de l'alerte */
export function AlertTitle({ style, ...props }: AlertTitleProps) {
  return <Text style={[styles.title, style]} {...props} />;
}

/** Description de l'alerte */
export function AlertDescription({ style, ...props }: AlertDescriptionProps) {
  return <Text style={[styles.description, style]} {...props} />;
}

const styles = StyleSheet.create({
  alert: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: "#6b7280", // muted text
    lineHeight: 20,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: "#f9fafb", // bg-card
    borderColor: "#e5e7eb", // border
    borderWidth: 1,
    color: "#111827", // text-card-foreground
  },
  destructive: {
    backgroundColor: "#fef2f2", // bg-red-50
    borderColor: "#f87171", // red border
    borderWidth: 1,
    color: "#b91c1c", // text-destructive
  },
});
