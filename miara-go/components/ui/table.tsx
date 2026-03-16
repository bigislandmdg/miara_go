import React from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";

type TableProps = {
  children: React.ReactNode;
  style?: object;
};

export const Table: React.FC<TableProps> = ({ children, style }) => {
  return (
    <ScrollView horizontal style={[styles.container, style]}>
      <View style={styles.table}>{children}</View>
    </ScrollView>
  );
};

export const TableHeader: React.FC<TableProps> = ({ children, style }) => {
  return <View style={[styles.header, style]}>{children}</View>;
};

export const TableBody: React.FC<TableProps> = ({ children, style }) => {
  return <View style={[styles.body, style]}>{children}</View>;
};

export const TableFooter: React.FC<TableProps> = ({ children, style }) => {
  return <View style={[styles.footer, style]}>{children}</View>;
};

export const TableRow: React.FC<TableProps> = ({ children, style }) => {
  return <View style={[styles.row, style]}>{children}</View>;
};

export const TableHead: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => {
  return (
    <Text style={[styles.head, style]}>
      {children}
    </Text>
  );
};

export const TableCell: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => {
  return (
    <Text style={[styles.cell, style]}>
      {children}
    </Text>
  );
};

export const TableCaption: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => {
  return (
    <Text style={[styles.caption, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  table: {
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  body: {
    flexDirection: "column",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  head: {
    fontWeight: "bold",
    paddingHorizontal: 8,
    flex: 1,
  },
  cell: {
    paddingHorizontal: 8,
    flex: 1,
  },
  caption: {
    marginTop: 8,
    fontSize: 12,
    color: "#777",
  },
});
