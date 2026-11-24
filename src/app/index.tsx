import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Redirect, type Href, useRouter } from "expo-router";

import { colors, styles } from "../constants/styles";
import { useAuth } from "../contexts/AuthContext";
import { fetchBooks } from "../services/bookService";
import type { Book } from "../types/book";

function BookCard({
  book,
  selected,
  onPress,
}: {
  book: Book;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${selected ? "dipilih" : "belum dipilih"}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.bookCard,
        selected && { borderColor: colors.primary, borderWidth: 2 },
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons
          name={selected ? "checkmark-circle-outline" : "book-outline"}
          size={32}
          color={colors.primary}
        />
      </View>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.author}>Penulis: {book.author}</Text>
        <Text style={styles.category}>
          {book.category} • {book.year || "Tahun tidak diketahui"}
        </Text>
        <Text style={styles.status}>{book.availability}</Text>
      </View>
    </Pressable>
  );
}

export default function Index() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const metadataDisplayName = user?.user_metadata?.display_name;
  const displayName =
    typeof metadataDisplayName === "string" && metadataDisplayName.trim()
      ? metadataDisplayName
      : "Anggota Perpustakaan";
  const metadataRole = user?.user_metadata?.role;
  const memberRole =
    typeof metadataRole === "string" && metadataRole.trim()
      ? metadataRole
      : "Belum ditentukan";
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectionMessage, setSelectionMessage] = useState("");
  const [navigationMessage, setNavigationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadBooks() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Terjadi kesalahan saat mengambil data buku.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !session) return;

    const timer = setTimeout(() => {
      void loadBooks();
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoading, session]);

  const selectedBooks = selectedBookIds.flatMap((id) => {
    const selectedBook = books.find((book) => book.id === id);
    return selectedBook ? [selectedBook] : [];
  });

  function toggleBookSelection(book: Book) {
    const isSelected = selectedBookIds.includes(book.id);
    setSelectedBookIds((current) =>
      isSelected ? current.filter((id) => id !== book.id) : [...current, book.id],
    );
    setSelectionMessage(
      isSelected
        ? `"${book.title}" dihapus dari pilihan.`
        : `"${book.title}" ditambahkan ke pilihan.`,
    );
  }

  function selectNextBook() {
    const nextBook = books.find((book) => !selectedBookIds.includes(book.id));
    if (!nextBook) {
      setSelectionMessage(
        books.length
          ? "Semua buku sudah dipilih. Ketuk kartu untuk membatalkan pilihan."
          : "Belum ada buku yang dapat dipilih.",
      );
      return;
    }
    toggleBookSelection(nextBook);
  }

  function openSelectedBook() {
    const book = selectedBooks[selectedBooks.length - 1];
    if (!book) {
      setSelectionMessage("Pilih buku terlebih dahulu untuk melihat detailnya.");
      return;
    }

    router.push({
      pathname: "/detail",
      params: {
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        year: String(book.year),
        availability: book.availability,
      },
    });
  }

  if (authLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href={"/(auth)/login" as Href} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { alignItems: "center" }]}
      showsVerticalScrollIndicator
    >
      <View style={[styles.header, { width: "100%", maxWidth: 900 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.smallText}>BOOKLIST</Text>
            <Text style={styles.title}>Daftar Buku</Text>
          </View>
          <Ionicons name="library-outline" size={42} color={colors.primary} />
        </View>
        <Text style={styles.subtitle}>Temukan dan lihat koleksi buku pilihanmu.</Text>
      </View>

      <View
        style={{
          width: "100%",
          maxWidth: 900,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 14,
          marginBottom: 20,
        }}
      >
        <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: colors.dark, fontSize: 16, fontWeight: "700" }}>
            {displayName}
          </Text>
          <Text style={{ color: colors.text }}>{user?.email ?? "Email tidak tersedia"}</Text>
          <Text style={{ color: colors.primary }}>Peran Anggota: {memberRole}</Text>
        </View>
      </View>

      <View style={[styles.listContainer, { width: "100%", maxWidth: 900 }]}>
        <Text style={styles.sectionTitle}>Koleksi Buku</Text>

        {loading && (
          <View style={{ alignItems: "center", padding: 20 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.totalText}>Sedang mengambil data buku...</Text>
          </View>
        )}

        {!loading && error !== "" && (
          <View style={{ alignItems: "center", padding: 16 }}>
            <Text style={{ color: "#DC2626", marginBottom: 12, textAlign: "center" }}>
              {error}
            </Text>
            <Pressable style={styles.button} onPress={() => void loadBooks()}>
              <Text style={styles.buttonText}>Coba Lagi</Text>
            </Pressable>
          </View>
        )}

        {!loading &&
          error === "" &&
          books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              selected={selectedBookIds.includes(book.id)}
              onPress={() => toggleBookSelection(book)}
            />
          ))}

        {!loading && error === "" && books.length === 0 && (
          <Text style={styles.totalText}>Belum ada data buku.</Text>
        )}
      </View>

      <View
        style={{
          width: "100%",
          maxWidth: 900,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          padding: 12,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            style={[styles.button, { flex: 1, marginBottom: 0 }]}
            onPress={() => void loadBooks()}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Ambil Data Buku</Text>
          </Pressable>

          <Pressable
            style={[styles.button, { flex: 1, marginBottom: 0 }]}
            onPress={selectNextBook}
            disabled={loading || books.length === 0}
          >
            <Text style={styles.buttonText}>Pilih Buku (+1)</Text>
          </Pressable>
        </View>

        <Text style={styles.totalText}>
          Jumlah pilihan: {selectedBooks.length}
        </Text>
        {selectionMessage ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.text, textAlign: "center" }}>
            {selectionMessage}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            style={[styles.button, { flex: 1, marginBottom: 0 }]}
            onPress={openSelectedBook}
          >
            <Text style={styles.buttonText}>Buka Detail Buku</Text>
          </Pressable>

          <Pressable
            style={[styles.button, { flex: 1, marginBottom: 0 }]}
            onPress={() => {
              const canGoBack = router.canGoBack();
              const message = canGoBack
                ? "Halaman sebelumnya tersedia."
                : "Tidak ada halaman sebelumnya.";
              setNavigationMessage(message);
              if (Platform.OS !== "web") {
                Alert.alert("Cek Navigasi", message);
              }
            }}
          >
            <Text style={styles.buttonText}>Cek Kembali</Text>
          </Pressable>
        </View>

        {navigationMessage ? (
          <Text accessibilityLiveRegion="polite" style={styles.totalText}>
            {navigationMessage}
          </Text>
        ) : null}

        <Text style={styles.totalText}>Total buku: {books.length}</Text>

        <Pressable
          style={[styles.button, { marginTop: 8, marginBottom: 0 }]}
          onPress={() => router.push("/(app)")}
        >
          <Ionicons name="library-outline" size={20} color={colors.white} />
          <Text style={styles.buttonText}>Ruang Koleksi</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
