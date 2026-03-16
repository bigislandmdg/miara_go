import React, { useEffect, useState } from "react"
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native"

let debounceTimer: NodeJS.Timeout

interface Props {
  placeholder: string
  onSelect: (value: {
    label: string
    lat: number
    lon: number
  }) => void
}

export default function LocationSearchInput({ placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    if (query.length < 3) {
      setResults([])
      return
    }

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(search, 500)
  }, [query])

  const search = async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5`

      const res = await fetch(url, {
        headers: { "User-Agent": "miarago-app" },
      })
      const data = await res.json()
      setResults(data)
    } catch (e) {
      console.log("OSM error", e)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        style={styles.input}
      />

      {results.length > 0 && (
        <FlatList
  data={results}
  keyExtractor={(item) => item.place_id.toString()}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        setQuery(item.display_name)
        setResults([])
        onSelect({
          label: item.display_name,
          lat: Number(item.lat),
          lon: Number(item.lon),
        })
      }}
    >
      <Text>{item.display_name}</Text>
    </TouchableOpacity>
  )}
  scrollEnabled={false}   // ✅ IMPORTANT
  keyboardShouldPersistTaps="handled"
/>

      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  input: {
    backgroundColor: "#F1F5F9",
    padding: 12,
    borderRadius: 12,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
})
