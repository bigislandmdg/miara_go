import React, { useState, useRef } from "react";
import { View, TextInput, Text, StyleSheet, Animated } from "react-native";

//
// MAIN OTP COMPONENT
//
function InputOTP({
  length = 6,
  value,
  onChange,
  containerStyle,
  ...props
}: {
  length: number;
  value: string;
  onChange: (text: string) => void;
  containerStyle?: any;
}) {
  const inputs = useRef<TextInput[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleChange = (text: string, index: number) => {
    let newValue = value.split("");

    // update char
    newValue[index] = text;

    const final = newValue.join("");
    onChange(final);

    if (text && index < length - 1) {
      inputs.current[index + 1].focus();
      setActiveIndex(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputs.current[index - 1].focus();
      setActiveIndex(index - 1);
    }
  };

  return (
    <View style={[styles.otpContainer, containerStyle]}>
      {Array.from({ length }).map((_, index) => (
        <InputOTPSlot
          key={index}
          ref={(el: any) => (inputs.current[index] = el)}
          index={index}
          isActive={activeIndex === index}
          value={value[index] ?? ""}
          onChangeText={(t: string) => handleChange(t, index)}
          onKeyPress={(e: any) => handleKeyPress(e, index)}
          {...props}
        />
      ))}
    </View>
  );
}

//
// SLOT (Equivalent to your InputOTPSlot)
//
const InputOTPSlot = React.forwardRef(
  (
    {
      index,
      isActive,
      value,
      onChangeText,
      onKeyPress,
    }: any,
    ref: React.Ref<TextInput>
  ) => {
    const caretOpacity = useRef(new Animated.Value(1)).current;

    // Blink caret when active
    React.useEffect(() => {
      if (isActive) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(caretOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(caretOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }, [isActive]);

    return (
      <View style={[styles.slot, isActive && styles.activeSlot]}>
        <TextInput
          ref={ref}
          style={styles.input}
          keyboardType="number-pad"
          maxLength={1}
          value={value}
          onChangeText={onChangeText}
          onKeyPress={onKeyPress}
          autoFocus={index === 0}
        />
        {isActive && !value && (
          <Animated.View
            style={[
              styles.caret,
              {
                opacity: caretOpacity,
              },
            ]}
          />
        )}
      </View>
    );
  }
);

//
// GROUP — Equivalent to InputOTPGroup
//
function InputOTPGroup({ children, style }: any) {
  return <View style={[styles.group, style]}>{children}</View>;
}

//
// SEPARATOR — Equivalent to InputOTPSeparator
//
function InputOTPSeparator() {
  return <Text style={styles.separator}>-</Text>;
}

//
// STYLES
//
const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  group: {
    flexDirection: "row",
    gap: 10,
  },
  separator: {
    fontSize: 20,
    opacity: 0.5,
  },
  slot: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#F7F7F7",
  },
  activeSlot: {
    borderColor: "#4A90E2",
    borderWidth: 2,
  },
  input: {
    fontSize: 22,
    textAlign: "center",
    width: "100%",
  },
  caret: {
    width: 2,
    height: 28,
    backgroundColor: "black",
    position: "absolute",
  },
});

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
