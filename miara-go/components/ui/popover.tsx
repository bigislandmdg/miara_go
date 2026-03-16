import React, { useState, useRef, useEffect } from "react";
import { View, Pressable, Modal, StyleSheet, LayoutRectangle, TouchableWithoutFeedback, StyleProp, ViewStyle } from "react-native";

// -------------------------------
// Popover Root
// -------------------------------
export function Popover({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// -------------------------------
// Popover Trigger
// -------------------------------
interface PopoverTriggerProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLayout?: (event: { nativeEvent: { layout: LayoutRectangle } }) => void;
}

export function PopoverTrigger({ children, onPress, onLayout }: PopoverTriggerProps) {
  return (
    <Pressable onPress={onPress} onLayout={onLayout}>
      {children}
    </Pressable>
  );
}

// -------------------------------
// Popover Content
// -------------------------------
interface PopoverContentProps {
  children: React.ReactNode;
  visible: boolean;
  onRequestClose: () => void;
  anchorLayout: LayoutRectangle | null; // position du trigger
  style?: StyleProp<ViewStyle>;
  placement?: "top" | "bottom" | "left" | "right";
}

export function PopoverContent({
  children,
  visible,
  onRequestClose,
  anchorLayout,
  placement = "top",
  style,
}: PopoverContentProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorLayout) {
      let top = anchorLayout.y + anchorLayout.height;
      let left = anchorLayout.x;

      if (placement === "top") {
        top = anchorLayout.y - 150; // hauteur du popover approximative
      } else if (placement === "bottom") {
        top = anchorLayout.y + anchorLayout.height;
      } else if (placement === "left") {
        left = anchorLayout.x - 288; // largeur popover
        top = anchorLayout.y;
      } else if (placement === "right") {
        left = anchorLayout.x + anchorLayout.width;
        top = anchorLayout.y;
      }

      setPosition({ top, left });
    }
  }, [anchorLayout, placement]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <TouchableWithoutFeedback onPress={onRequestClose}>
        <View style={styles.overlay}>
          <View style={[styles.popover, { top: position.top, left: position.left }, style]}>
            {children}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// -------------------------------
// Styles
// -------------------------------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  popover: {
    position: "absolute",
    width: 288, // w-72
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4, // Android
  },
});

// -------------------------------
// PopoverAnchor (pour API consistency, inutile en RN)
// -------------------------------
export function PopoverAnchor({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
