import React from "react";
import { TextInput, StyleSheet, TextInputProps } from "react-native";

type TextareaProps = TextInputProps & {
  className?: string; // facultatif si tu veux gérer des styles supplémentaires
};

export const Textarea: React.FC<TextareaProps> = ({ style, ...props }) => {
  return (
    <TextInput
      multiline
      style={[styles.textarea, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  textarea: {
    minHeight: 80, // équivalent à min-h-16
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8, // équivalent rounded-md
    borderWidth: 1,
    borderColor: "#d1d5db", // couleur par défaut border-input
    backgroundColor: "#f9fafb", // équivalent bg-input-background
    fontSize: 16, // équivalent text-base
    color: "#111827", // couleur du texte
  },
});
