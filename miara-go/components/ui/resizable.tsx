import React, { useRef, useState } from "react";
import { View, Animated, PanResponder, StyleSheet, type ViewStyle, type StyleProp } from "react-native";

type Direction = "horizontal" | "vertical";

interface ResizablePanelGroupProps {
  direction?: Direction; // or "vertical"
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ResizablePanelGroup({
  direction = "horizontal",
  children,
  style,
}: ResizablePanelGroupProps) {
  const initialSize = 200;
  const size = useRef(new Animated.Value(initialSize)).current;

  const isHorizontal = direction === "horizontal";

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const newSize = isHorizontal
        ? initialSize + gesture.dx
        : initialSize + gesture.dy;

      size.setValue(Math.max(80, newSize)); // minimum panel size
    },
  });

  const [panelA, panelB] = React.Children.toArray(children);

  return (
    <View
      style={[
        isHorizontal ? styles.containerRow : styles.containerCol,
        style,
      ]}
    >
      <Animated.View
        style={
          isHorizontal
            ? { width: size }
            : { height: size }
        }
      >
        {panelA}
      </Animated.View>

      {/* Handle */}
      <View
        style={isHorizontal ? styles.handleVertical : styles.handleHorizontal}
        {...panResponder.panHandlers}
      />

      <View style={{ flex: 1 }}>{panelB}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerRow: {
    flexDirection: "row",
    flex: 1,
  },
  containerCol: {
    flexDirection: "column",
    flex: 1,
  },
  handleVertical: {
    width: 10,
    backgroundColor: "#eee",
    alignSelf: "stretch",
  },
  handleHorizontal: {
    height: 10,
    backgroundColor: "#eee",
    alignSelf: "stretch",
  },
});
