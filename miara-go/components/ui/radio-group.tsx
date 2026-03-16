import React from "react";
import { View, ViewProps } from "react-native";

export interface RadioGroupProps extends ViewProps {
  value?: string | number;
  onValueChange?: (value?: string | number) => void;
  children?: React.ReactNode;
}

export function RadioGroup({
  value,
  onValueChange,
  children,
  style,
  ...props
}: RadioGroupProps) {
  // Clone children pour injecter value/onValueChange
  const clonedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    const childElement = child as React.ReactElement<any>;
    return React.cloneElement(childElement, {
      isChecked: childElement.props.value === value,
      onSelect: () => onValueChange?.(childElement.props.value),
    });
  });

  return (
    <View
      data-slot="radio-group"
      style={[{ gap: 12 }, style]}
      {...props}
    >
      {clonedChildren}
    </View>
  );
}
