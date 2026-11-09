
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { colors, styles } from "../constants/styles";
import { Book } from "../types/book";
import { fetchBooks } from "../services/bookService";

// CUSTOM FUNCTION
function getBookStatus(year: number): string {
  if (year >= 2025) {
    return "Terbaru";
  }

  return "Tersedia";
}

// KOMPONEN CARD BUKU
function BookCard({ book }: { book: Book }) {
  return (
    <View style={styles.bookCard}>
      <View style={styles.iconBox}>
        <Ionicons
          name="book-outline"
          size={32}
          color={colors.primary}
        />
      </View>

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>
          {book.title}
        </Text>

        <Text style={styles.author}>
          Penulis: {book.author}
        </Text>

        <Text style={styles.category}>
          {book.category} • {book.year || "Tahun tidak diketahui"}
        </Text>

        <Text style={styles.status}>
          {getBookStatus(book.year)}
        </Text>
      </View>
    </View>
  );
}

// HALAMAN UTAMA
export default function Index() {
  const router = useRouter();

  // USESTATE
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // CUSTOM FUNCTION UNTUK MENGAMBIL DATA API
  function loadBooks() {
    setLoading(true);
    setError("");

    fetchBooks()
      .then((data) => {
        // Jika API berhasil
        setBooks(data);
        console.log("Data buku berhasil:", data);
      })
      .catch((err: Error) => {
        // Jika API gagal
        setError(err.message);
        console.log("Terjadi error:", err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // USEEFFECT: MENGAMBIL DATA SAAT HALAMAN DIBUKA
  useEffect(() => {
    loadBooks();
  }, []);

  // USEEFFECT: MEMANTAU PERUBAHAN JUMLAH PILIHAN
  useEffect(() => {
    console.log("Jumlah pilihan berubah:", selectedCount);
  }, [selectedCount]);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.smallText}>
              BOOKLIST
            </Text>

            <Text style={styles.title}>
              Daftar Buku
            </Text>
          </View>

          <Ionicons
            name="library-outline"
            size={42}
            color={colors.primary}
          />
        </View>

        <Text style={styles.subtitle}>
          Temukan dan lihat koleksi buku pilihanmu.
        </Text>
      </View>

      {/* DAFTAR BUKU DARI API */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          Koleksi Buku
        </Text>

        {/* LOADING */}
        {loading && (
          <View style={{ alignItems: "center", padding: 20 }}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.totalText}>
              Sedang mengambil data buku...
            </Text>
          </View>
        )}

        {/* ERROR */}
        {!loading && error !== "" && (
          <View style={{ alignItems: "center", padding: 16 }}>
            <Text style={{ color: "red", marginBottom: 12 }}>
              {error}
            </Text>

            <Pressable
              style={styles.button}
              onPress={loadBooks}
            >
              <Text style={styles.buttonText}>
                Coba Lagi
              </Text>
            </Pressable>
          </View>
        )}

        {/* DATA BERHASIL DITAMPILKAN */}
        {!loading &&
          error === "" &&
          books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
            />
          ))}

        {/* JIKA DATA KOSONG */}
        {!loading &&
          error === "" &&
          books.length === 0 && (
            <Text style={styles.totalText}>
              Belum ada data buku.
            </Text>
          )}
      </View>

      {/* TOMBOL AMBIL DATA ULANG */}
      <Pressable
        style={styles.button}
        onPress={loadBooks}
        disabled={loading}
      >
        <Ionicons
          name="refresh-outline"
          size={20}
          color={colors.white}
        />

        <Text style={styles.buttonText}>
          Ambil Data Buku
        </Text>
      </Pressable>

      {/* USESTATE */}
      <Pressable
        style={styles.button}
        onPress={() =>
          setSelectedCount((previous) => previous + 1)
        }
      >
        <Text style={styles.buttonText}>
          Pilih Buku (+1)
        </Text>
      </Pressable>

      <Text style={styles.totalText}>
        Jumlah pilihan: {selectedCount}
      </Text>

      {/* ROUTER.PUSH */}
      <Pressable
        style={styles.button}
        onPress={() => router.push("/detail")}
      >
        <Text style={styles.buttonText}>
          Buka Detail Buku
        </Text>
      </Pressable>

      {/* ROUTER.CAN GO BACK */}
      <Pressable
        style={styles.button}
        onPress={() => {
          const canGoBack = router.canGoBack();

          Alert.alert(
            "Cek Navigasi",
            canGoBack
              ? "Halaman sebelumnya tersedia."
              : "Tidak ada halaman sebelumnya."
          );

          console.log("router.canGoBack():", canGoBack);
        }}
      >
        <Text style={styles.buttonText}>
          Cek Navigasi Kembali
        </Text>
      </Pressable>

      {/* TOTAL BUKU */}
      <Text style={styles.totalText}>
        Total buku: {books.length}
      </Text>
    </ScrollView>
  );
}
