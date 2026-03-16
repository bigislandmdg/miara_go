import * as React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  GestureResponderEvent,
} from "react-native";

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ContextMenu({ visible, onClose, children }: ContextMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menu}>{children}</View>
      </View>
    </Modal>
  );
}

interface ContextMenuItemProps {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  destructive?: boolean;
  inset?: boolean;
}

export function ContextMenuItem({
  label,
  onPress,
  destructive,
  inset,
}: ContextMenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.item,
        inset && { paddingLeft: 24 },
      ]}
    >
      <Text style={[styles.itemText, destructive && { color: "red" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface ContextMenuCheckboxItemProps {
  label: string;
  checked: boolean;
  onPress?: () => void;
}

export function ContextMenuCheckboxItem({
  label,
  checked,
  onPress,
}: ContextMenuCheckboxItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.item}>
      <Text style={styles.itemText}>{checked ? "✅" : "⬜️"} {label}</Text>
    </TouchableOpacity>
  );
}

interface ContextMenuRadioItemProps {
  label: string;
  selected: boolean;
  onPress?: () => void;
}

export function ContextMenuRadioItem({
  label,
  selected,
  onPress,
}: ContextMenuRadioItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.item}>
      <Text style={styles.itemText}>{selected ? "🔘" : "⚪️"} {label}</Text>
    </TouchableOpacity>
  );
}

export function ContextMenuSeparator() {
  return <View style={styles.separator} />;
}

export function ContextMenuLabel({ label, inset }: { label: string; inset?: boolean }) {
  return (
    <Text style={[styles.label, inset && { paddingLeft: 24 }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});
