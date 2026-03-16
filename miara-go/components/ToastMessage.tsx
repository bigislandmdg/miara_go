import React, { createContext, useContext, useState, ReactNode } from "react";
import { Animated, Text, StyleSheet, Dimensions } from "react-native";

interface ToastContextType {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => useContext(ToastContext)!;

/* --------------------------------------------
   Global function usable everywhere:
   ToastMessage.show("Message ici")
----------------------------------------------- */
export const ToastMessage = {
  show: (msg: string) => {
    if (internalShow) internalShow(msg);
  },
};

// Internal reference updated by provider
let internalShow: ((message: string) => void) | null = null;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [message, setMessage] = useState("");
  const opacity = new Animated.Value(0);

  const show = (msg: string) => {
    setMessage(msg);

    // Fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Auto-hide after 2.5 sec
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }, 2500);
    });
  };

  // expose globally
  internalShow = show;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}

      <Animated.View style={[styles.toast, { opacity }]}>
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 14,
    alignSelf: "center",
    marginHorizontal: 30,
  },
  toastText: {
    color: "white",
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },
});
