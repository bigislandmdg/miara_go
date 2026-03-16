import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type SwitchProps = {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  style?: object;
};

export const Switch: React.FC<SwitchProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  activeColor = "#4f46e5", // primary
  inactiveColor = "#ccc", // background
  thumbColor = "#fff", // thumb
  style,
}) => {
  const [isOn, setIsOn] = useState(value);
  const translateX = useRef(new Animated.Value(value ? 24 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOn ? 24 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOn, translateX]);

  const toggleSwitch = () => {
    if (disabled) return;
    const newValue = !isOn;
    setIsOn(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      <View
        style={[
          styles.track,
          { backgroundColor: isOn ? activeColor : inactiveColor },
          style,
          disabled && { opacity: 0.5 },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: thumbColor, transform: [{ translateX }] },
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    padding: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
});
