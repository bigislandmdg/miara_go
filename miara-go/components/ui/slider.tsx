import React, { useState, useRef, useEffect } from "react";
import {
  View,
  PanResponder,
  Animated,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";

interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
  style?: object;
  trackStyle?: object;
  thumbStyle?: object;
}

function Slider({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  style,
  trackStyle,
  thumbStyle,
}: SliderProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;

  const normalizedValue = value ?? defaultValue;

  // Met à jour la position du thumb si `value` change
  useEffect(() => {
    if (layoutWidth > 0) {
      const ratio = (normalizedValue - min) / (max - min);
      pan.setValue(ratio * layoutWidth);
    }
  }, [normalizedValue, layoutWidth]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        let newPos = gestureState.dx + (normalizedValue - min) / (max - min) * layoutWidth;
        if (newPos < 0) newPos = 0;
        if (newPos > layoutWidth) newPos = layoutWidth;
        pan.setValue(newPos);

        const newValue =
          Math.round((newPos / layoutWidth) * (max - min) / step) * step + min;
        onValueChange?.(newValue);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setLayoutWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <View style={[styles.track, trackStyle]} />
      <Animated.View
        style={[
          styles.thumb,
          thumbStyle,
          {
            transform: [
              {
                translateX: pan.interpolate({
                  inputRange: [0, layoutWidth],
                  outputRange: [0, layoutWidth],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: "center",
    width: "100%",
  },
  track: {
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    position: "absolute",
    left: 0,
    right: 0,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#007AFF",
    position: "absolute",
    top: 10,
  },
});

export { Slider };
