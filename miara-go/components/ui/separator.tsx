import React from "react";
import { View, StyleSheet } from "react-native";

type SeparatorProps = {
  orientation?: "horizontal" | "vertical";
  color?: string;
  thickness?: number;
  style?: object;
};

export function Separator({
  orientation = "horizontal",
  color = "#ccc",
  thickness = 1,
  style,
}: SeparatorProps) {
  return (
    <View
      style={[
        orientation === "horizontal"
          ? { height: thickness, width: "100%" }
          : { width: thickness, height: "100%" },
        { backgroundColor: color },
        style,
      ]}
    />
  );
}
