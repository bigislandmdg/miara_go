import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  Modal,
  View,
  Pressable,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";

const DropdownContext = createContext<any>(null);
const { width } = Dimensions.get("window");

export function DropdownMenu({ children }: any) {
  const [open, setOpen] = useState(false);
  const [triggerLayout, setTriggerLayout] = useState<any>(null);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerLayout, setTriggerLayout }}>
      {children}
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ children }: any) {
  const { setOpen, setTriggerLayout } = useContext(DropdownContext);

  return (
    <Pressable
      onPress={() => setOpen(true)}
      onLayout={(e) => setTriggerLayout(e.nativeEvent.layout)}
    >
      {children}
    </Pressable>
  );
}

export function DropdownMenuContent({ children }: any) {
  const { open, setOpen, triggerLayout } = useContext(DropdownContext);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }).start();
    }
  }, [open]);

  if (!open) return null;

  const top = triggerLayout?.y + triggerLayout?.height + 4;
  const left = Math.min(triggerLayout?.x, width - 200);

  return (
    <Modal transparent visible animationType="none">
      <Pressable style={styles.overlay} onPress={() => setOpen(false)} />

      <Animated.View
        style={[
          styles.menu,
          { top, left, opacity },
        ]}
      >
        {children}
      </Animated.View>
    </Modal>
  );
}

export function DropdownMenuItem({ children, onPress }: any) {
  const { setOpen } = useContext(DropdownContext);

  return (
    <Pressable
      onPress={() => {
        onPress?.();
        setOpen(false);
      }}
      style={styles.item}
    >
      <Text style={styles.itemText}>{children}</Text>
    </Pressable>
  );
}

export function DropdownMenuSeparator() {
  return <View style={styles.separator} />;
}

export function DropdownMenuLabel({ children }: any) {
  return (
    <Text style={styles.label}>
      {children}
    </Text>
  );
}

export function DropdownMenuCheckboxItem({ children, checked, onCheckedChange }: any) {
  return (
    <Pressable
      style={styles.item}
      onPress={() => onCheckedChange(!checked)}
    >
      <Text style={{ fontSize: 16 }}>
        {checked ? "✔️" : "◻️"}
      </Text>
      <Text style={[styles.itemText, { marginLeft: 8 }]}>{children}</Text>
    </Pressable>
  );
}

export function DropdownMenuRadioGroup({ value, onValueChange, children }: any) {
  return React.Children.map(children, (child) =>
    React.cloneElement(child, {
      selected: value === child.props.value,
      onSelect: () => onValueChange(child.props.value),
    })
  );
}

export function DropdownMenuRadioItem({ value, selected, onSelect, children }: any) {
  return (
    <Pressable style={styles.item} onPress={onSelect}>
      <Text>{selected ? "🔘" : "⚪"}</Text>
      <Text style={[styles.itemText, { marginLeft: 8 }]}>{children}</Text>
    </Pressable>
  );
}

export function DropdownMenuShortcut({ children }: any) {
  return <Text style={styles.shortcut}>{children}</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  menu: {
    position: "absolute",
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
    // shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    // elevation for Android
    elevation: 5,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    fontSize: 16,
    color: "#000",
  },
  separator: {
    height: 1,
    backgroundColor: "#e6e6e6",
    marginVertical: 6,
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#666",
  },
  shortcut: {
    marginLeft: "auto",
    color: "#666",
    fontSize: 12,
  },
});
