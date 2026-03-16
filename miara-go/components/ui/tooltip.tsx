import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet, ViewStyle, TextStyle } from "react-native";

type TooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  sideOffset?: number;
  tooltipStyle?: ViewStyle;
  textStyle?: TextStyle;
};

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  sideOffset = 0,
  tooltipStyle,
  textStyle,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onPressIn={() => setVisible(true)}
        onPressOut={() => setVisible(false)}
      >
        {children}
      </Pressable>
      {visible && (
        <View style={[styles.tooltipContainer, { marginTop: sideOffset }, tooltipStyle]}>
          <Text style={[styles.tooltipText, textStyle]}>{content}</Text>
          <View style={styles.arrow} />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  tooltipContainer: {
    position: "absolute",
    backgroundColor: "#333",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 50,
    alignSelf: "center",
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
  },
  arrow: {
    position: "absolute",
    bottom: -4,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    backgroundColor: "#333",
    transform: [{ rotate: "45deg" }],
  },
});
