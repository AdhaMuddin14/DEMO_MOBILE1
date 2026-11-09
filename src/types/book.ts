export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  year: number;
}

export interface OpenLibraryResponse {
  docs: {
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    subject?: string[];
  }[];
}