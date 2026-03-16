import { StyleProp, ViewStyle, TextStyle, ImageStyle } from "react-native";

type RNStyle = ViewStyle | TextStyle | ImageStyle;
type ClassValue = RNStyle | false | null | undefined;

/**
 * Fusionne plusieurs objets de style React Native en un seul.
 * Ignore les valeurs falsy (false, null, undefined)
 */
export function cn(...inputs: ClassValue[]): StyleProp<RNStyle> {
  return inputs.filter(Boolean);
}
