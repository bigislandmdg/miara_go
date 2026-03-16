import * as React from "react";
import { TouchableOpacity, View, StyleSheet, GestureResponderEvent } from "react-native";
import { Check } from "react-native-feather"; // ou react-native-vector-icons si tu préfères

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: any;
}

export const Checkbox = React.forwardRef<React.ElementRef<typeof TouchableOpacity>, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled = false, style, ...props }, ref) => {
    const handlePress = (event: GestureResponderEvent) => {
      if (disabled) return;
      onCheckedChange?.(!checked);
    };

    return (
      <TouchableOpacity
        ref={ref}
        onPress={handlePress}
        activeOpacity={0.7}
        style={[styles.checkbox, checked && styles.checked, disabled && styles.disabled, style]}
        {...props}
      >
        {checked && (
          <Check width={16} height={16} stroke="#fff" strokeWidth={2} />
        )}
      </TouchableOpacity>
    );
  }
);

Checkbox.displayName = "Checkbox";

const styles = StyleSheet.create({
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#d1d5db", // gris clair
    borderRadius: 4,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  checked: {
    backgroundColor: "#4f46e5", // indigo
    borderColor: "#4f46e5",
  },
  disabled: {
    opacity: 0.5,
  },
});
