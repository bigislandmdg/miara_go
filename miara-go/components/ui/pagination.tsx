import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle, PressableProps } from "react-native";

// Props
type PaginationProps = {
  children?: React.ReactNode;
  style?: ViewStyle;
};

type PaginationLinkProps = PressableProps & {
  isActive?: boolean;
  children?: React.ReactNode;
};

// Conteneur principal
export function Pagination({ children, style }: PaginationProps) {
  return (
    <View
      accessibilityRole="none" // <-- corrigé ici
      accessibilityLabel="pagination"
      style={[styles.paginationContainer, style]}
    >
      {children}
    </View>
  );
}

// Item de pagination (wrapper simple)
export function PaginationItem({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  return <View style={style}>{children}</View>;
}

// Lien de pagination (bouton)
export function PaginationLink({ isActive = false, children, style, ...props }: PaginationLinkProps) {
  const textStyle = isActive ? styles.linkTextActive : styles.linkText;

  return (
    <Pressable
      style={(state) => [
        styles.linkContainer,
        isActive ? styles.linkActive : styles.linkInactive,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

// Bouton Previous
export function PaginationPrevious(props: PaginationLinkProps) {
  return <PaginationLink {...props}>← Previous</PaginationLink>;
}

// Bouton Next
export function PaginationNext(props: PaginationLinkProps) {
  return <PaginationLink {...props}>Next →</PaginationLink>;
}

// Ellipsis "…"
export function PaginationEllipsis({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.ellipsisContainer, style]}>
      <Text style={styles.ellipsisText}>…</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  linkContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
  },
  linkActive: {
    backgroundColor: "#fff",
    borderColor: "#999",
  },
  linkInactive: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  linkText: {
    color: "#555",
  },
  linkTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  ellipsisContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  ellipsisText: {
    fontSize: 18,
    color: "#555",
  },
});
