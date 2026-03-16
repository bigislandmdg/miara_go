import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";

type MenubarProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

export function Menubar({ children, style }: MenubarProps) {
  return <View style={[styles.menubar, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  menubar: {
    flexDirection: "row",   // flex-row
    height: 40,             // h-10 ~ 40px
    alignItems: "center",   // items-center
    borderRadius: 6,        // rounded-md ~ 6px
    borderWidth: 1,         // border
    borderColor: "#d1d5db", // couleur gris clair par défaut
    padding: 4,             // p-1 ~ 4px
    backgroundColor: "#ffffff", // bg-white
  },
});
