// Shared logic untuk load & parsing data review hasil scraping dari localStorage.
// Dipakai bareng oleh useReviews() (halaman Reviews) dan @/api (halaman Overview),
// supaya kedua tempat itu selalu baca & parsing data dengan cara yang sama persis —
// jangan duplikasi logic parsing di dua tempat berbeda.

import type { Review } from '@/api/types';

export function storageKeyForApp(appId: string): string {
  return `reviewpulse_app_${appId}`;
}

interface RawScrapedReview {
  app_id: string;
  author: string;
  rating: number;
  text: string;
  title?: string;
  date: string;
}

export function parseScrapedReviews(raw: string | null): Review[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    const scraped: RawScrapedReview[] = data.reviews || [];

    return scraped.map((r, idx) => ({
      // Id campur konten + index: kalau urutan hasil scraping berubah tapi
      // kontennya sama, id tetap konsisten untuk review yang sama.
      id: `${r.app_id}_${r.author}_${r.date}_${idx}`,
      user: r.author,
      avatar: r.author.charAt(0).toUpperCase(),
      rating: r.rating,
      text: r.text,
      sentiment: (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative') as Review['sentiment'],
      topics: r.title ? [r.title] : [],
      timestamp: r.date,
    }));
  } catch {
    return [];
  }
}

// Ambil semua review untuk sebuah app langsung dari localStorage.
// Dipakai oleh @/api karena fungsi-fungsi di sana bukan React hook (tidak bisa
// pakai useState/useEffect), jadi butuh cara baca data yang "stateless".
export function loadReviewsForApp(appId: string | null): Review[] {
  if (!appId) return [];
  const raw = localStorage.getItem(storageKeyForApp(appId));
  return parseScrapedReviews(raw);
}