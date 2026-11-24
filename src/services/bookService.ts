import { Book, OpenLibraryResponse } from "../types/book";

const API_URL =
  "https://openlibrary.org/search.json?q=programming&limit=10&fields=key,title,author_name,first_publish_year,subject,ia,availability";

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Gagal mengambil data Open Library (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as OpenLibraryResponse;
  return data.docs.map((item) => ({
    id: item.key,
    title: item.title,
    author: item.author_name?.[0] ?? "Penulis tidak diketahui",
    category: item.subject?.[0] ?? "Umum",
    year: item.first_publish_year ?? 0,
    availability: getAvailability(item.availability),
  }));
}

function getAvailability(availability: OpenLibraryResponse["docs"][number]["availability"]) {
  if (!availability) return "Ketersediaan belum diketahui";
  if (availability.available_to_borrow) return "Dapat dipinjam";
  if (availability.available_to_browse) return "Dapat dibaca";
  if (availability.is_previewable) return "Pratinjau tersedia";
  return "Tidak tersedia secara digital";
}