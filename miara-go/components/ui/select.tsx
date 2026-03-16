
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";

interface SelectItemProps {
  label: string;
  value: string;
  selected?: boolean;
  onPress?: (v: string) => void;
}

export function Select({
  value,
  onValueChange,
  children,
  placeholder = "Sélectionner...",
  style,
}: {
  value?: string;
  placeholder?: string;
  style?: object;
  onValueChange?: (v: string) => void;
  children: React.ReactElement<SelectItemProps>[];
}) {
  const [open, setOpen] = useState(false);

  const childArray = React.Children.toArray(children) as React.ReactElement<
    SelectItemProps
  >[];

  const selectedLabel = childArray.find(
    (child) => child.props.value === value
  )?.props.label;

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, style]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.triggerText}>
          {selectedLabel || placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color="#777" />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.content}>
            <FlatList
              data={childArray}
              keyExtractor={(item) => item.props.value}
              renderItem={({ item }) =>
                React.cloneElement(item, {
                  onPress: (v: string) => {
                    onValueChange?.(v);
                    setOpen(false);
                  },
                  selected: value === item.props.value,
                })
              }
            />
          </View>

          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setOpen(false)}
          />
        </View>
      </Modal>
    </>
  );
}

export function SelectItem({
  label,
  value,
  selected,
  onPress,
}: SelectItemProps) {
  return (
    <TouchableOpacity
      style={[styles.item, selected && styles.itemSelected]}
      onPress={() => onPress?.(value)}
    >
      <Text style={styles.itemLabel}>{label}</Text>

      {selected && <Icon name="check" size={18} color="#000" />}
    </TouchableOpacity>
  );
}

export function SelectLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function SelectSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  triggerText: {
    fontSize: 16,
    color: "#222",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 8,
    minWidth: 250,
    maxHeight: 350,
    paddingVertical: 8,
    elevation: 4,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemSelected: {
    backgroundColor: "#e6f0ff",
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    color: "#222",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 4,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 4,
    marginHorizontal: 8,
  },
});
