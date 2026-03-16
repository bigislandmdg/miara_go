import React from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";

export function Input({ style, ...props }: TextInputProps) {
  return <TextInput {...props} style={[styles.input, style]} />;
}

const styles = StyleSheet.create({
  input: {
    height: 40,                  // h-10
    width: "100%",               // w-full
    borderRadius: 8,             // rounded-md
    borderWidth: 1,              // border
    borderColor: "#d1d5db",      // border-gray-300
    paddingHorizontal: 12,       // px-3
    paddingVertical: 8,          // py-2
    fontSize: 16,                // text-base
    color: "#000",               // text-black
    backgroundColor: "#f9fafb",  // bg-white/light gray
  },
});
