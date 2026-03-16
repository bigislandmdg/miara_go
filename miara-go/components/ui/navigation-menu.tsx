import React from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

type NavigationMenuProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showChevron?: boolean; // optionnel : afficher ou non le chevron
};

export function NavigationMenu({ children, style, showChevron = true }: NavigationMenuProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
      {showChevron && <Ionicons name="chevron-down" size={20} color="#374151" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",      // flex-row
    alignItems: "center",      // items-center
    justifyContent: "center",  // justify-center
    gap: 8,                    // espace entre enfants (Android ne supporte pas gap, voir note)
  },
});
