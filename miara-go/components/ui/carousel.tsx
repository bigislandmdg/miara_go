import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from "react";
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewStyle,
  StyleProp,
} from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";

type CarouselContextProps = {
  scrollViewRef: React.RefObject<ScrollView | null>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  itemWidth: number;
  orientation: "horizontal" | "vertical";
};

const CarouselContext = createContext<CarouselContextProps | null>(null);

export function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a Carousel");
  return context;
}

interface CarouselProps {
  orientation?: "horizontal" | "vertical";
  children: ReactNode;
  itemWidth: number; // largeur (ou hauteur) d’un élément
  style?: StyleProp<ViewStyle>;
}

export function Carousel({ orientation = "horizontal", children, itemWidth, style }: CarouselProps) {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const scrollPrev = () => {
    scrollViewRef.current?.scrollTo({
      x: orientation === "horizontal" ? Math.max(0, scrollPosition - itemWidth) : 0,
      y: orientation === "vertical" ? Math.max(0, scrollPosition - itemWidth) : 0,
      animated: true,
    });
  };

  const scrollNext = () => {
    scrollViewRef.current?.scrollTo({
      x: orientation === "horizontal" ? scrollPosition + itemWidth : 0,
      y: orientation === "vertical" ? scrollPosition + itemWidth : 0,
      animated: true,
    });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = orientation === "horizontal" ? e.nativeEvent.contentOffset.x : e.nativeEvent.contentOffset.y;
    setScrollPosition(offset);
    setCanScrollPrev(offset > 0);
    const maxOffset =
      (React.Children.count(children) - 1) * itemWidth;
    setCanScrollNext(offset < maxOffset);
  };

  return (
    <CarouselContext.Provider
      value={{ scrollViewRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext, itemWidth, orientation }}
    >
      <View style={[styles.carouselContainer, style]}>
        <ScrollView
          ref={scrollViewRef}
          horizontal={orientation === "horizontal"}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </View>
    </CarouselContext.Provider>
  );
}

interface CarouselItemProps {
  children: ReactNode;
  width?: number;
}

export function CarouselItem({ children, width }: CarouselItemProps) {
  return <View style={{ width, flexShrink: 0 }}>{children}</View>;
}

interface CarouselButtonProps {
  style?: StyleProp<ViewStyle>;
}

export function CarouselPrevious({ style }: CarouselButtonProps) {
  const { scrollPrev, canScrollPrev, orientation } = useCarousel();
  return (
    <Pressable onPress={scrollPrev} disabled={!canScrollPrev} style={[styles.button, style]}>
      <ArrowLeft width={24} height={24} />
    </Pressable>
  );
}

export function CarouselNext({ style }: CarouselButtonProps) {
  const { scrollNext, canScrollNext } = useCarousel();
  return (
    <Pressable onPress={scrollNext} disabled={!canScrollNext} style={[styles.button, style]}>
      <ArrowRight width={24} height={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    position: "relative",
  },
  button: {
    position: "absolute",
    top: "50%",
    zIndex: 10,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 999,
  },
});
