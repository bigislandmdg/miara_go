"use client";

import React, { createContext, useContext } from "react";
import { View, Text, TextInput } from "react-native";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

//
// CONTEXT
//
const FormFieldContext = createContext<any>(null);
const FormItemContext = createContext<any>(null);

//
// MAIN FORM PROVIDER
//
const Form = FormProvider;

//
// FORM FIELD
//
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  props: ControllerProps<TFieldValues, TName>
) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

//
// HOOK USE FIELD
//
const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

//
// FORM ITEM WRAPPER
//
function FormItem({ style, ...props }: any) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View style={[{ gap: 8 }, style]} {...props} />
    </FormItemContext.Provider>
  );
}

//
// LABEL
//
function FormLabel({ style, ...props }: any) {
  const { error } = useFormField();

  return (
    <Text
      style={[
        { fontWeight: "600", color: error ? "red" : "#444" },
        style,
      ]}
      {...props}
    />
  );
}

//
// FORM CONTROL
//
function FormControl({ children, ...props }: any) {
  const { error } = useFormField();

  return React.cloneElement(children, {
    ...props,
    style: [
      children.props.style,
      {
        borderWidth: 1,
        borderColor: error ? "red" : "#ccc",
        padding: 10,
        borderRadius: 8,
      },
    ],
  });
}

//
// DESCRIPTION
//
function FormDescription({ style, ...props }: any) {
  const { formDescriptionId } = useFormField();

  return (
    <Text
      nativeID={formDescriptionId}
      style={[{ color: "#666", fontSize: 13 }, style]}
      {...props}
    />
  );
}

//
// MESSAGE (erreur)
function FormMessage({ style, ...props }: any) {
  const { error } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) return null;

  return (
    <Text style={[{ color: "red", fontSize: 13 }, style]} {...props}>
      {body}
    </Text>
  );
}

export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
};
