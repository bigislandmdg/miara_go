import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";

export interface LabelProps extends TextProps {
  style?: TextProps["style"];
}

export function Label({ style, ...props }: LabelProps) {
  return <Text {...props} style={[styles.label, style]} />;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,          // text-sm
    fontWeight: "500",     // font-medium
    lineHeight: 16,        // leading-none approximé
    opacity: 1,            // opacity-100
    // flex / row / gap sont gérés dans le parent si nécessaire
  },
});
