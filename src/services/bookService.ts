import { Book, OpenLibraryResponse } from "../types/book";

const API_URL =
  "https://openlibrary.org/search.json?q=programming&limit=10&fields=key,title,author_name,first_publish_year,subject";

// CUSTOM ASYNC FUNCTION + CUSTOM PROMISE
export async function fetchBooks(): Promise<Book[]> {
  return new Promise((resolve, reject) => {
    // PRE-BUILT ASYNC FUNCTION
    fetch(API_URL)
      .then((response) => {
        if (!response.ok) {
          reject(new Error("Gagal mengambil data buku."));
          return null;
        }

        return response.json();
      })
      .then((data: OpenLibraryResponse | null) => {
        if (data === null) return;

        const books: Book[] = data.docs.map((item) => ({
          id: item.key,
          title: item.title,
          author: item.author_name?.[0] ?? "Penulis tidak diketahui",
          category: item.subject?.[0] ?? "Umum",
          year: item.first_publish_year ?? 0,
        }));

        resolve(books);
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}