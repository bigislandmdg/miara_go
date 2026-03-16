import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  ViewProps,
} from "react-native";
import { ChevronDown } from "lucide-react-native"; // version react-native de lucide

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionProps extends ViewProps {}
interface AccordionItemProps extends ViewProps {}
interface AccordionTriggerProps extends TouchableOpacityProps {
  title: string;
}
interface AccordionContentProps extends ViewProps {
  children: React.ReactNode;
}

/** Container principal de l'accordéon */
export function Accordion({ style, ...props }: AccordionProps) {
  return <View style={[styles.accordion, style]} {...props} />;
}

/** Item de l'accordéon */
export function AccordionItem({ style, children, ...props }: AccordionItemProps) {
  return <View style={[styles.accordionItem, style]} {...props}>{children}</View>;
}

/** Trigger / header de l'item */
export function AccordionTrigger({ title, style, onPress, ...props }: AccordionTriggerProps) {
  return (
    <TouchableOpacity
      style={[styles.accordionTrigger, style]}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      <Text style={styles.accordionTitle}>{title}</Text>
      <ChevronDown size={20} color="#6b7280" />
    </TouchableOpacity>
  );
}

/** Contenu de l'item */
export function AccordionContent({ children, style, ...props }: AccordionContentProps) {
  return (
    <View style={[styles.accordionContent, style]} {...props}>
      {children}
    </View>
  );
}

/** Hook pour gérer l'état ouvert / fermé d'un item */
export function useAccordion(initialState: boolean = false) {
  const [open, setOpen] = useState(initialState);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  return { open, toggle };
}

const styles = StyleSheet.create({
  accordion: {
    flexDirection: "column",
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  accordionTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  accordionContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "#f9fafb",
  },
});
