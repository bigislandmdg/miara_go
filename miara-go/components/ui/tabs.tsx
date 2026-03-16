import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";

type TabsProps = {
  children: React.ReactNode;
  style?: object;
  defaultIndex?: number;
};

export const Tabs: React.FC<TabsProps> = ({ children, style, defaultIndex = 0 }) => {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);

  return (
    <View style={[styles.tabsContainer, style]}>
      {React.Children.map(children, (child: any) => {
        if (child.type.displayName === "TabsList") {
          return React.cloneElement(child, { activeIndex, setActiveIndex });
        }
        if (child.type.displayName === "TabsContent") {
          return React.cloneElement(child, { activeIndex });
        }
        return child;
      })}
    </View>
  );
};

type TabsListProps = {
  children: React.ReactNode;
  activeIndex?: number;
  setActiveIndex?: (index: number) => void;
  style?: object;
};

export const TabsList: React.FC<TabsListProps> = ({ children, activeIndex, setActiveIndex, style }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsList, style]}>
      {React.Children.map(children, (child: any, index) => {
        return React.cloneElement(child, {
          isActive: activeIndex === index,
          onPress: () => setActiveIndex?.(index),
        });
      })}
    </ScrollView>
  );
};

type TabsTriggerProps = {
  children: React.ReactNode;
  isActive?: boolean;
  onPress?: () => void;
  style?: object;
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, isActive, onPress, style }) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabTrigger, isActive && styles.tabTriggerActive, style]}
    >
      <Text style={[styles.tabTriggerText, isActive && styles.tabTriggerTextActive]}>{children}</Text>
    </Pressable>
  );
};

type TabsContentProps = {
  children: React.ReactNode;
  activeIndex?: number;
  index?: number;
  style?: object;
};

export const TabsContent: React.FC<TabsContentProps> = ({ children, activeIndex, index, style }) => {
  if (index !== activeIndex) return null;
  return <View style={[styles.tabsContent, style]}>{children}</View>;
};

// Assign display names for easier cloning
TabsList.displayName = "TabsList";
TabsTrigger.displayName = "TabsTrigger";
TabsContent.displayName = "TabsContent";

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "column",
    gap: 8,
  },
  tabsList: {
    flexDirection: "row",
  },
  tabTrigger: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: "#f0f0f0",
  },
  tabTriggerActive: {
    backgroundColor: "#ddd",
  },
  tabTriggerText: {
    color: "#333",
  },
  tabTriggerTextActive: {
    fontWeight: "bold",
    color: "#000",
  },
  tabsContent: {
    marginTop: 8,
  },
});
