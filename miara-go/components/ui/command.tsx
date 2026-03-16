import * as React from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Keyboard,
} from "react-native";

interface CommandContextProps {
  inputValue: string;
  setInputValue: (value: string) => void;
}

const CommandContext = React.createContext<CommandContextProps | null>(null);

export function useCommand() {
  const context = React.useContext(CommandContext);
  if (!context) throw new Error("useCommand must be used inside CommandProvider");
  return context;
}

interface CommandProps {
  children: React.ReactNode;
}

export function Command({ children }: CommandProps) {
  const [inputValue, setInputValue] = React.useState("");
  return (
    <CommandContext.Provider value={{ inputValue, setInputValue }}>
      <View style={{ flex: 1 }}>{children}</View>
    </CommandContext.Provider>
  );
}

interface CommandDialogProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function CommandDialog({ visible, onClose, children }: CommandDialogProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>{children}</View>
      </View>
    </Modal>
  );
}

interface CommandInputProps {
  placeholder?: string;
}

export function CommandInput({ placeholder }: CommandInputProps) {
  const { inputValue, setInputValue } = useCommand();
  return (
    <TextInput
      value={inputValue}
      onChangeText={setInputValue}
      placeholder={placeholder || "Type a command..."}
      style={styles.input}
      autoFocus
    />
  );
}

interface CommandListProps {
  data: { key: string; label: string; onPress?: () => void }[];
}

export function CommandList({ data }: CommandListProps) {
  const { inputValue } = useCommand();

  const filteredData = data.filter((item) =>
    item.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <FlatList
      data={filteredData}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <CommandItem label={item.label} onPress={item.onPress} />
      )}
      style={styles.list}
      keyboardShouldPersistTaps="handled"
    />
  );
}

interface CommandItemProps {
  label: string;
  onPress?: () => void;
}

export function CommandItem({ label, onPress }: CommandItemProps) {
  return (
    <TouchableOpacity
      onPress={() => {
        onPress?.();
        Keyboard.dismiss();
      }}
      style={styles.item}
    >
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 16,
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    maxHeight: "80%",
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  list: {
    maxHeight: 300,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
