import React, { useRef, useState } from "react";
import { ScrollView, View, StyleSheet, LayoutChangeEvent } from "react-native";

interface ScrollAreaProps {
  children: React.ReactNode;
  style?: object;
}

interface ScrollBarProps {
  containerHeight: number;
  contentHeight: number;
  scrollY: number;
}

export function ScrollArea({ children, style }: ScrollAreaProps) {
  const scrollRef = useRef<ScrollView>(null);

  const [containerHeight, setContainerHeight] = useState(1);
  const [contentHeight, setContentHeight] = useState(1);
  const [scrollY, setScrollY] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <View onLayout={handleLayout} style={[styles.container, style]}>
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        onScroll={e => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>

      {/* Custom Scrollbar */}
      <ScrollBar
        containerHeight={containerHeight}
        contentHeight={contentHeight}
        scrollY={scrollY}
      />
    </View>
  );
}

function ScrollBar({ containerHeight, contentHeight, scrollY }: ScrollBarProps) {
  const visible = contentHeight > containerHeight;
  const maxScroll = Math.max(contentHeight - containerHeight, 1);
  const thumbHeight = Math.max((containerHeight / contentHeight) * containerHeight, 20);
  const thumbTop = Math.max(
    0,
    Math.min((scrollY / maxScroll) * (containerHeight - thumbHeight), containerHeight - thumbHeight)
  );

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[styles.scrollbarContainer, { height: containerHeight }]}>
      <View style={[styles.thumb, { height: thumbHeight, top: thumbTop }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollbarContainer: {
    position: "absolute",
    right: 4,
    top: 0,
    width: 8,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  thumb: {
    position: "absolute",
    width: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
