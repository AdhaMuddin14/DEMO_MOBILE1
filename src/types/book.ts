export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  year: number;
  availability: string;
}

export interface OpenLibraryResponse {
  docs: {
    key: string;
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    subject?: string[];
    availability?: {
      available_to_borrow?: boolean;
      available_to_browse?: boolean;
      is_previewable?: boolean;
    };
  }[];
}