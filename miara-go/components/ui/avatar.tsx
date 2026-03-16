import React from "react"
import { View, Image, Text, StyleSheet, ImageProps, ViewProps, TextProps } from "react-native"

interface AvatarProps extends ViewProps {}

interface AvatarImageProps extends ImageProps {}

interface AvatarFallbackProps extends TextProps {
  children?: React.ReactNode
}

/**
 * Avatar container
 */
export function Avatar({ style, ...props }: AvatarProps) {
  return <View style={[styles.avatar, style]} {...props} />
}

/**
 * Avatar image
 */
export function AvatarImage({ style, ...props }: AvatarImageProps) {
  return <Image style={[styles.avatarImage, style]} {...props} />
}

/**
 * Avatar fallback (ex: initiales)
 */
export function AvatarFallback({ style, children, ...props }: AvatarFallbackProps) {
  return (
    <View style={[styles.avatarFallback, style]} {...props}>
      <Text style={styles.avatarFallbackText}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    width: 40, // équivalent "size-10"
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6", // couleur neutre si pas d'image
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#d1d5db", // équivalent "bg-muted"
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    color: "#6b7280", // couleur texte fallback
    fontWeight: "bold",
  },
})
