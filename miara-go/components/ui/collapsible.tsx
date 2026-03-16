import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

// Permet l'animation automatique sur Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  style?: any;
}

/** Root du collapsible */
export function Collapsible({ children, open = false, onOpenChange }: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(open);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <CollapsibleContext.Provider value={{ isOpen, toggle }}>
      <View>{children}</View>
    </CollapsibleContext.Provider>
  );
}

const CollapsibleContext = React.createContext<{
  isOpen: boolean;
  toggle: () => void;
}>({ isOpen: false, toggle: () => {} });

/** Trigger */
export function CollapsibleTrigger({ children, style, onPress }: CollapsibleTriggerProps) {
  const { toggle } = React.useContext(CollapsibleContext);
  return (
    <TouchableOpacity
      onPress={() => {
        toggle();
        onPress?.();
      }}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
}

/** Contenu */
export function CollapsibleContent({ children, style }: CollapsibleContentProps) {
  const { isOpen } = React.useContext(CollapsibleContext);
  return isOpen ? <View style={[styles.content, style]}>{children}</View> : null;
}

const styles = StyleSheet.create({
  content: {
    overflow: "hidden",
  },
});
