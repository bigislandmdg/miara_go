import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ColorValue,
} from "react-native";

type Toast = {
  id: string;
  message: string;
  duration?: number; // ms
};

type ToasterProps = {
  theme?: "light" | "dark";
};

export const Toaster: React.FC<ToasterProps> = ({ theme = "light" }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, duration = 3000) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, duration }]);
    setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          theme={theme}
          onPress={() => removeToast(toast.id)}
        />
      ))}
    </View>
  );
};

const ToastItem = ({
  message,
  theme,
  onPress,
}: {
  message: string;
  theme: "light" | "dark";
  onPress?: () => void;
}) => {
  const translateY = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
  }, []);

  const background: ColorValue = theme === "dark" ? "#333" : "#fff";
  const color: ColorValue = theme === "dark" ? "#fff" : "#000";

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: background, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.text, { color }]}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    fontSize: 14,
  },
});
