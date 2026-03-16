import React, { useState, createContext, useContext } from "react";
import { View, Modal, Pressable, Animated, StyleSheet } from "react-native";

//
// CONTEXT
//
const HoverCardContext = createContext<any>(null);

//
// ROOT
//
function HoverCard({ children }: any) {
  const [visible, setVisible] = useState(false);
  const opacity = new Animated.Value(0);

  const open = () => {
    setVisible(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const close = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <HoverCardContext.Provider value={{ visible, open, close, opacity }}>
      {children}
    </HoverCardContext.Provider>
  );
}

//
// TRIGGER
//
function HoverCardTrigger({ children }: any) {
  const { open, close } = useContext(HoverCardContext);

  return (
    <Pressable
      onPressIn={open}
      onPressOut={close}
      // Web hover support
      onHoverIn={open}
      onHoverOut={close}
    >
      {children}
    </Pressable>
  );
}

//
// CONTENT
//
function HoverCardContent({ children, style }: any) {
  const { visible, close, opacity } = useContext(HoverCardContext);

  return (
    <Modal transparent visible={visible} onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Animated.View
          style={[
            styles.card,
            { opacity },
            style,
          ]}
        >
          {children}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

//
// styles
//
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 260,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});

export { HoverCard, HoverCardTrigger, HoverCardContent };
