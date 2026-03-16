import React, { createContext, useContext, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { X } from "lucide-react-native";

// Context interne pour gérer l’état
const DialogContext = createContext({
  open: false,
  setOpen: (value: boolean) => {},
});

/* -------------------------------------------------------------------------- */
/*                               ROOT (Dialog)                                */
/* -------------------------------------------------------------------------- */
export function Dialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*                             TRIGGER (ouvrir)                               */
/* -------------------------------------------------------------------------- */
export function DialogTrigger({ children }: { children: React.ReactNode }) {
  const { setOpen } = useContext(DialogContext);

  return (
    <Pressable onPress={() => setOpen(true)}>
      {children}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 OVERLAY                                    */
/* -------------------------------------------------------------------------- */
export function DialogOverlay() {
  return <View style={styles.overlay} />;
}

/* -------------------------------------------------------------------------- */
/*                                CLOSE BUTTON                                */
/* -------------------------------------------------------------------------- */
export function DialogClose() {
  const { setOpen } = useContext(DialogContext);
  return (
    <Pressable style={styles.closeButton} onPress={() => setOpen(false)}>
      <X size={22} color="#444" />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*                                CONTENT                                     */
/* -------------------------------------------------------------------------- */
export function DialogContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { open, setOpen } = useContext(DialogContext);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <DialogClose />
          {children}
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*                             TITLE / DESCRIPTION                            */
/* -------------------------------------------------------------------------- */
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <Text style={styles.description}>{children}</Text>;
}

/* -------------------------------------------------------------------------- */
/*                        HEADER / FOOTER Containers                          */
/* -------------------------------------------------------------------------- */
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

/* -------------------------------------------------------------------------- */
/*                                  STYLES                                    */
/* -------------------------------------------------------------------------- */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  content: {
    backgroundColor: "white",
    width: "100%",
    maxWidth: 380,
    borderRadius: 10,
    padding: 20,
    position: "relative",
  },

  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
  },

  header: {
    marginBottom: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  description: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },

  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
});
