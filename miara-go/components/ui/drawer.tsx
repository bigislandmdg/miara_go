import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Pressable,
  PanResponder,
} from "react-native";

const DrawerContext = createContext<any>(null);

export function Drawer({ open, onOpenChange, children }: any) {
  return (
    <DrawerContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function DrawerTrigger({ children }: any) {
  const { onOpenChange } = useContext(DrawerContext);
  return (
    <Pressable onPress={() => onOpenChange(true)}>
      {children}
    </Pressable>
  );
}

export function DrawerOverlay() {
  const { onOpenChange } = useContext(DrawerContext);
  return (
    <Pressable
      onPress={() => onOpenChange(false)}
      style={styles.overlay}
    />
  );
}

export function DrawerContent({ children }: any) {
  const { open, onOpenChange } = useContext(DrawerContext);
  const translateY = useRef(new Animated.Value(500)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dy > 0) translateY.setValue(gesture.dy);
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 120) {
        onOpenChange(false);
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  useEffect(() => {
    if (open) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 500,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [open]);

  return (
    <Modal transparent visible={open} animationType="fade">
      <DrawerOverlay />
      <Animated.View
        style={[styles.drawer, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

export function DrawerHeader({ children }: any) {
  return <View style={styles.header}>{children}</View>;
}

export function DrawerFooter({ children }: any) {
  return <View style={styles.footer}>{children}</View>;
}

export function DrawerTitle({ children }: any) {
  return <Text style={styles.title}>{children}</Text>;
}

export function DrawerDescription({ children }: any) {
  return <Text style={styles.description}>{children}</Text>;
}

export function DrawerClose({ children }: any) {
  const { onOpenChange } = useContext(DrawerContext);
  return (
    <Pressable onPress={() => onOpenChange(false)}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  drawer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    paddingBottom: 30,
    paddingTop: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 80,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },
});
