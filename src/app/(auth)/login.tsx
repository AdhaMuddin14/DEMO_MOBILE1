import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";
import { colors } from "../../constants/styles";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const { authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleAuth() {
    if (loading) return;

    const cleanEmail = email.trim();
    const cleanPassword = password;
    const cleanDisplayName = displayName.trim();

    if (!cleanEmail || !cleanPassword.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    if (isRegistering && !cleanDisplayName) {
      setError("Nama lengkap wajib diisi saat daftar.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const result = isRegistering
        ? await supabase.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: {
                display_name: cleanDisplayName,
                role: "member",
              },
            },
          })
        : await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          });

      if (result.error) {
        setError(result.error.message);
      } else if (isRegistering && !result.data.session) {
        setNotice("Pendaftaran berhasil. Periksa email untuk konfirmasi akun.");
      }
    } catch (authRequestError) {
      setError(
        authRequestError instanceof Error
          ? authRequestError.message
          : "Permintaan autentikasi gagal. Periksa koneksi internet.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: colors.header,
            borderRadius: 16,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 2 }}>
                BOOKLIST
              </Text>
              <Text style={{ color: colors.title, fontSize: 26, fontWeight: "800" }}>
                Library Access
              </Text>
            </View>
            <Ionicons name="library-outline" size={42} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text, marginTop: 8 }}>
            {isRegistering
              ? "Daftar akun untuk mengelola koleksi buku."
              : "Masuk untuk membuka dan mengelola koleksi buku."}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            borderRadius: 16,
            gap: 12,
          }}
        >
          {isRegistering ? (
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nama Lengkap"
              autoCapitalize="words"
              editable={!loading}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.dark }}
            />
          ) : null}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.dark }}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, color: colors.dark }}
          />

          {authError ? (
            <Text style={{ color: "#DC2626" }}>Gagal memulihkan sesi: {authError}</Text>
          ) : null}
          {error ? <Text style={{ color: "#DC2626" }}>{error}</Text> : null}
          {notice ? <Text style={{ color: "#15803D" }}>{notice}</Text> : null}

          <Pressable
            onPress={handleAuth}
            disabled={loading}
            style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 12, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
                {isRegistering ? "Daftar" : "Masuk"}
              </Text>
            )}
          </Pressable>

          <Pressable
            disabled={loading}
            onPress={() => {
              setIsRegistering((value) => !value);
              setError("");
              setNotice("");
            }}
          >
            <Text style={{ color: colors.primary, textAlign: "center", fontWeight: "700" }}>
              {isRegistering ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
