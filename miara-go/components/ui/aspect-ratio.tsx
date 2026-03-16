import React from "react";
import { View, ViewProps, StyleProp, ViewStyle } from "react-native";

interface AspectRatioProps extends ViewProps {
  /** Ratio largeur/hauteur, par exemple 16/9 = 1.777... */
  ratio?: number;
  style?: StyleProp<ViewStyle>;
}

/** Container qui force le ratio largeur/hauteur */
export function AspectRatio({ ratio = 1, style, ...props }: AspectRatioProps) {
  return <View style={[{ aspectRatio: ratio }, style]} {...props} />;
}
