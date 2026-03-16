import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

type SheetProps = {
  visible?: boolean;
  onClose?: () => void;
  side?: "top" | "right" | "bottom" | "left";
  children: React.ReactNode;
};

export function Sheet({ visible = false, onClose, side = "right", children }: SheetProps) {
  const [isVisible, setIsVisible] = useState(visible);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    }
  }, [visible]);

  const { width, height } = Dimensions.get("window");

  // Définir les transformations selon le côté
  const translate = {
    top: { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [-height, 0] }) },
    bottom: { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }) },
    left: { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) },
    right: { translateX: animation.interpolate({ inputRange: [0, 1], outputRange: [width, 0] }) },
  };

  if (!isVisible) return null;

  return (
    <Modal transparent visible={isVisible} animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            side === "top" || side === "bottom"
              ? { width: "100%", height: "50%" }
              : { width: "75%", height: "100%" },
            side === "top" && { top: 0 },
            side === "bottom" && { bottom: 0 },
            side === "left" && { left: 0 },
            side === "right" && { right: 0 },
            translate[side],
          ]}
        >
          {children}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="x" size={24} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Optional helper components
export function SheetHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

export function SheetFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export function SheetTitle({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function SheetDescription({ children }: { children: string }) {
  return <Text style={styles.description}>{children}</Text>;
}

// Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    padding: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  header: {
    marginBottom: 16,
  },
  footer: {
    marginTop: "auto",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#555",
  },
});
