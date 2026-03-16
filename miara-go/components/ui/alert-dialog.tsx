import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewProps,
  TextProps,
  ModalProps,
} from "react-native";

interface AlertDialogProps extends ModalProps {}

interface AlertDialogContentProps extends ViewProps {}
interface AlertDialogHeaderProps extends ViewProps {}
interface AlertDialogFooterProps extends ViewProps {}
interface AlertDialogTitleProps extends TextProps {}
interface AlertDialogDescriptionProps extends TextProps {}
interface AlertDialogActionProps extends TouchableOpacityProps {}
interface AlertDialogCancelProps extends TouchableOpacityProps {}

/** Container principal du dialog */
export function AlertDialog({ children, ...props }: AlertDialogProps) {
  return (
    <Modal
      transparent
      animationType="fade"
      {...props}
    >
      <View style={styles.overlay}>{children}</View>
    </Modal>
  );
}

/** Contenu du dialog */
export function AlertDialogContent({ style, children, ...props }: AlertDialogContentProps) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

/** En-tête */
export function AlertDialogHeader({ style, ...props }: AlertDialogHeaderProps) {
  return <View style={[styles.header, style]} {...props} />;
}

/** Pied du dialog */
export function AlertDialogFooter({ style, ...props }: AlertDialogFooterProps) {
  return <View style={[styles.footer, style]} {...props} />;
}

/** Titre */
export function AlertDialogTitle({ style, ...props }: AlertDialogTitleProps) {
  return <Text style={[styles.title, style]} {...props} />;
}

/** Description */
export function AlertDialogDescription({ style, ...props }: AlertDialogDescriptionProps) {
  return <Text style={[styles.description, style]} {...props} />;
}

/** Action (bouton principal) */
export function AlertDialogAction({ style, children, ...props }: AlertDialogActionProps) {
  return (
    <TouchableOpacity style={[styles.action, style]} {...props}>
      <Text style={styles.actionText}>{children}</Text>
    </TouchableOpacity>
  );
}

/** Annuler */
export function AlertDialogCancel({ style, children, ...props }: AlertDialogCancelProps) {
  return (
    <TouchableOpacity style={[styles.cancel, style]} {...props}>
      <Text style={styles.cancelText}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
  },
  header: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  action: {
    backgroundColor: "#10b981", // vert
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancel: {
    borderWidth: 1,
    borderColor: "#d1d5db", // gris
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelText: {
    color: "#111827",
    fontWeight: "600",
  },
});
