import React from "react";
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle, TextStyle } from "react-native";
import { ChevronRight, MoreHorizontal } from "lucide-react-native"; // Installer lucide-react-native

interface BreadcrumbProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

interface BreadcrumbListProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

interface BreadcrumbItemProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

interface BreadcrumbLinkProps {
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

interface BreadcrumbPageProps {
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

interface BreadcrumbSeparatorProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

interface BreadcrumbEllipsisProps {
  style?: StyleProp<ViewStyle>;
}

/** Container principal */
export function Breadcrumb({ style, children }: BreadcrumbProps) {
  return <View style={[styles.breadcrumb, style]}>{children}</View>;
}

/** Liste des éléments */
export function BreadcrumbList({ style, children }: BreadcrumbListProps) {
  return <View style={[styles.list, style]}>{children}</View>;
}

/** Élément individuel */
export function BreadcrumbItem({ style, children }: BreadcrumbItemProps) {
  return <View style={[styles.item, style]}>{children}</View>;
}

/** Lien cliquable */
export function BreadcrumbLink({ style, children, onPress }: BreadcrumbLinkProps) {
  return (
    <Pressable onPress={onPress}>
      <Text style={[styles.link, style]}>{children}</Text>
    </Pressable>
  );
}

/** Page courante */
export function BreadcrumbPage({ style, children }: BreadcrumbPageProps) {
  return <Text style={[styles.page, style]}>{children}</Text>;
}

/** Séparateur */
export function BreadcrumbSeparator({ style, children }: BreadcrumbSeparatorProps) {
  return (
    <View style={[styles.separator, style]}>
      {children ?? <ChevronRight width={16} height={16} />}
    </View>
  );
}

/** Ellipsis (… ou icône) */
export function BreadcrumbEllipsis({ style }: BreadcrumbEllipsisProps) {
  return (
    <View style={[styles.ellipsis, style]}>
      <MoreHorizontal width={16} height={16} />
      <Text style={styles.srOnly}>More</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  breadcrumb: {
    flexDirection: "row",
    alignItems: "center",
  },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  link: {
    color: "#2563EB", // bleu pour lien
    fontSize: 14,
  },
  page: {
    color: "#111827", // texte normal
    fontSize: 14,
  },
  separator: {
    marginHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  ellipsis: {
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    overflow: "hidden",
    opacity: 0,
  },
});
