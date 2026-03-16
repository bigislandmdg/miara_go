import React, { createContext, useContext, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

type SidebarContextType = {
  open: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used inside SidebarProvider");
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const toggleSidebar = () => setOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ open, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar({
  width = 250,
  children,
}: {
  width?: number;
  children: React.ReactNode;
}) {
  const { open } = useSidebar();
  const animatedValue = React.useRef(new Animated.Value(open ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: open ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [open]);

  const sidebarWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  return (
    <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
      {children}
    </Animated.View>
  );
}

export function SidebarTrigger({ children }: { children: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();
  return <TouchableOpacity onPress={toggleSidebar}>{children}</TouchableOpacity>;
}

export function SidebarItem({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.item}>
      <Text style={styles.itemText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: "#f5f5f5",
    height: "100%",
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 10,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 16,
  },
});
