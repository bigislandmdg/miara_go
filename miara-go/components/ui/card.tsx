import React from "react";
import { View, Text, StyleSheet, ViewProps, TextProps } from "react-native";

interface CardProps extends ViewProps {}
interface CardHeaderProps extends ViewProps {}
interface CardTitleProps extends TextProps {}
interface CardDescriptionProps extends TextProps {}
interface CardActionProps extends ViewProps {}
interface CardContentProps extends ViewProps {}
interface CardFooterProps extends ViewProps {}

/** Container principal de la carte */
export function Card({ style, ...props }: CardProps) {
  return <View style={[styles.card, style]} {...props} />;
}

/** En-tête de la carte */
export function CardHeader({ style, ...props }: CardHeaderProps) {
  return <View style={[styles.cardHeader, style]} {...props} />;
}

/** Titre de la carte */
export function CardTitle({ style, ...props }: CardTitleProps) {
  return <Text style={[styles.cardTitle, style]} {...props} />;
}

/** Description de la carte */
export function CardDescription({ style, ...props }: CardDescriptionProps) {
  return <Text style={[styles.cardDescription, style]} {...props} />;
}

/** Action de la carte (bouton, icône, etc.) */
export function CardAction({ style, ...props }: CardActionProps) {
  return <View style={[styles.cardAction, style]} {...props} />;
}

/** Contenu principal de la carte */
export function CardContent({ style, ...props }: CardContentProps) {
  return <View style={[styles.cardContent, style]} {...props} />;
}

/** Pied de carte */
export function CardFooter({ style, ...props }: CardFooterProps) {
  return <View style={[styles.cardFooter, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: "column",
    overflow: "hidden",
  },
  cardHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    flexDirection: "column",
    marginBottom: 6, // remplace gap
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  cardDescription: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 18,
  },
  cardAction: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
});
