import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { colors } from "../constants/styles";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function Detail() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string | string[];
    author?: string | string[];
    category?: string | string[];
    year?: string | string[];
    availability?: string | string[];
  }>();

  const title = firstParam(params.title);
  const author = firstParam(params.author);
  const category = firstParam(params.category);
  const year = firstParam(params.year);
  const availability = firstParam(params.availability);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 700,
          alignSelf: "center",
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 20,
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            backgroundColor: colors.header,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginBottom: 16,
          }}
        >
          <Ionicons name="book-outline" size={40} color={colors.primary} />
        </View>

        <Text
          style={{
            color: colors.title,
            fontSize: 24,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {title || "Detail Buku"}
        </Text>

        {title ? (
          <View style={{ gap: 12 }}>
            <BookDetail label="Penulis" value={author || "Penulis tidak diketahui"} />
            <BookDetail label="Kategori" value={category || "Umum"} />
            <BookDetail label="Tahun terbit" value={year || "Tahun tidak diketahui"} />
            <BookDetail
              label="Ketersediaan"
              value={availability || "Ketersediaan belum diketahui"}
            />
          </View>
        ) : (
          <Text style={{ color: colors.text, textAlign: "center", marginBottom: 20 }}>
            Belum ada buku yang dipilih. Kembali ke daftar dan pilih sebuah buku untuk melihat
            detailnya.
          </Text>
        )}

        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
          style={{
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <Text style={{ color: colors.white, fontWeight: "700", fontSize: 16 }}>
            Kembali ke Daftar Buku
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function BookDetail({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.dark, fontSize: 16, fontWeight: "600", marginTop: 2 }}>
        {value}
      </Text>
    </View>
  );
}
