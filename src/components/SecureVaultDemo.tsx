import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

import { colors, styles as bookStyles } from "../constants/styles";

const KEY = "secure-vault-demo";

export function SecureVaultDemo() {
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isNativePlatform = Platform.OS === "android" || Platform.OS === "ios";

  async function save() {
    if (!value.trim()) {
      setMessage("Masukkan nilai sebelum menyimpan.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await SecureStore.setItemAsync(KEY, value);
      setMessage("Nilai berhasil disimpan aman.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menyimpan.");
    } finally {
      setLoading(false);
    }
  }

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      setSavedValue((await SecureStore.getItemAsync(KEY)) ?? "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal membaca.");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    setLoading(true);
    setMessage("");
    try {
      await SecureStore.deleteItemAsync(KEY);
      setSavedValue("");
      setMessage("Nilai berhasil dihapus.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Gagal menghapus.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{
        gap: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
        <Text style={[bookStyles.sectionTitle, { marginBottom: 0 }]}>Brankas Digital</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
        SecureStore tersedia di Android dan iOS. Browser tidak mendukung expo-secure-store.
      </Text>
      {isNativePlatform ? (
        <>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Masukkan kode akses pribadi"
            secureTextEntry
            style={{
              minHeight: 48,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: colors.dark,
              backgroundColor: colors.white,
            }}
          />
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={save}
                style={[
                  bookStyles.button,
                  { flex: 1, minWidth: 0, marginBottom: 0, paddingHorizontal: 4 },
                ]}
              >
                <Text style={bookStyles.buttonText}>Simpan</Text>
              </Pressable>
              <Pressable
                onPress={load}
                style={[
                  bookStyles.button,
                  {
                    flex: 1,
                    minWidth: 0,
                    marginBottom: 0,
                    paddingHorizontal: 4,
                    backgroundColor: colors.primaryDark,
                  },
                ]}
              >
                <Text style={bookStyles.buttonText}>Lihat</Text>
              </Pressable>
              <Pressable
                onPress={remove}
                style={[
                  bookStyles.button,
                  {
                    flex: 1,
                    minWidth: 0,
                    marginBottom: 0,
                    paddingHorizontal: 4,
                    backgroundColor: "#DC2626",
                  },
                ]}
              >
                <Text style={bookStyles.buttonText}>Hapus</Text>
              </Pressable>
            </View>
          )}
          {savedValue ? (
            <Text style={{ color: colors.text }}>Nilai tersimpan: {savedValue}</Text>
          ) : null}
          {message ? (
            <Text accessibilityLiveRegion="polite" style={{ color: colors.text }}>
              {message}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
