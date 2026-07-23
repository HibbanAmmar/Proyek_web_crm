// src/types/review.ts

// === DARI SCRAPING (Real Data) ===
export interface ScrapedReview {
  source: 'app_store';
  app_id: string;
  app_name: string;
  author: string;
  title: string;
  text: string;
  rating: number;
  version: string;
  helpful_votes: number;
  total_votes: number;
  date: string;
}

// === UNTUK UI (Unified — bisa dari mock atau real) ===
export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  timestamp: string;
  source?: 'mock' | 'scraped';
  app_name?: string;
  version?: string;
  helpful_votes?: number;
}

// === APP ITEM (dari Sidebar) ===
export interface AppItem {
  id: string;
  name: string;
  platform: string;
  icon: string;
  iosAppId?: string;
  androidPackageName?: string;
  country: string;
}