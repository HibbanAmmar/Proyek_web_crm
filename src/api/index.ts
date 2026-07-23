// API Client
// Sebelumnya semua fungsi di bawah return data mock statis (@/data/mockData).
// Sekarang SEMUA dihitung LANGSUNG dari data review hasil scraping (app yang
// lagi aktif di sidebar), lewat @/lib/reviewAnalytics — termasuk
// getForecast/getPredictionMetrics/getKeyEvents (regresi linear sederhana
// atas rating historis, bukan model ML beneran, tapi udah nyambung ke data
// asli, bukan mock lagi).

import type {
  RatingTrendPoint,
  SentimentOverTimePoint,
  UserSegment,
  TopicBreakdown,
  ForecastPoint,
  PredictionMetric,
  KeyEvent,
  Alert,
  Review,
  DashboardSummary,
} from './types';

import { getActiveAppId } from '@/hooks/useReviews';
import { loadReviewsForApp } from '@/lib/reviewData';
import {
  computeDashboardSummary,
  computeRatingTrend,
  computeSentimentOverTime,
  computeUserSegments,
  computeTopicBreakdown,
  computeAlerts,
  getReviewsInSegment,
  computeForecast,
  computePredictionMetrics,
  computeKeyEvents,
} from '@/lib/reviewAnalytics';

function currentReviews(): Review[] {
  return loadReviewsForApp(getActiveAppId());
}

// ---- Dismissed alerts persistence (localStorage, per app, reset otomatis 24 jam) ----
// Alert dihitung ulang dari aturan setiap getAlerts() dipanggil (bukan disimpan
// di backend), jadi kalau tidak ada penyimpanan sendiri, alert yang sudah
// di-dismiss akan muncul lagi begitu halaman di-refresh.

function dismissedAlertsKey(appId: string) {
  return `reviewpulse_dismissed_alerts_${appId}`;
}

function getDismissedAlertIds(appId: string): Set<string> {
  try {
    const raw = localStorage.getItem(dismissedAlertsKey(appId));
    if (!raw) return new Set();
    const parsed: { id: string; dismissedAt: number }[] = JSON.parse(raw);
    const DAY_MS = 24 * 60 * 60 * 1000;
    const stillValid = parsed.filter(d => Date.now() - d.dismissedAt < DAY_MS);
    return new Set(stillValid.map(d => d.id));
  } catch {
    return new Set();
  }
}

// Dashboard API

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return Promise.resolve(computeDashboardSummary(currentReviews()));
}

export async function getRatingTrend(days = 30): Promise<RatingTrendPoint[]> {
  return Promise.resolve(computeRatingTrend(currentReviews(), days));
}

export async function getSentimentOverTime(days = 30): Promise<SentimentOverTimePoint[]> {
  return Promise.resolve(computeSentimentOverTime(currentReviews(), days));
}

export async function getUserSegments(): Promise<UserSegment[]> {
  return Promise.resolve(computeUserSegments(currentReviews()));
}

// Dipakai sama pop-up "lihat review" di SegmentsPage — beda dari
// getUserSegments (yang cuma angka ringkasan), ini balikin review ASLI.
export async function getReviewsBySegment(segmentId: string): Promise<Review[]> {
  return Promise.resolve(getReviewsInSegment(currentReviews(), segmentId));
}

export async function getTopicBreakdown(): Promise<TopicBreakdown[]> {
  return Promise.resolve(computeTopicBreakdown(currentReviews()));
}

export async function getForecast(): Promise<ForecastPoint[]> {
  return Promise.resolve(computeForecast(currentReviews()));
}

export async function getPredictionMetrics(): Promise<PredictionMetric[]> {
  return Promise.resolve(computePredictionMetrics(currentReviews()));
}

export async function getKeyEvents(): Promise<KeyEvent[]> {
  return Promise.resolve(computeKeyEvents(currentReviews()));
}

// Catatan sistem tetap (BUKAN dihitung dari data review, beda dari
// computeAlerts) — dipakai buat kasih tahu status dashboard ini masih
// tahap testing. Tetap lewat mekanisme dismiss yang sama (localStorage,
// per app, reset 24 jam) biar konsisten sama alert lainnya.
const SYSTEM_NOTICE: Alert = {
  id: 'beta-notice',
  type: 'info',
  title: 'Masih Tahap Testing',
  description:
    'Dashboard ini masih versi testing, belum sepenuhnya final — beberapa bagian masih dalam perbaikan. ' +
    'Salah satunya: pengambilan data app yang tadinya lewat API sekarang diganti pakai scraping (render halaman App Store), ' +
    'karena API/RSS resmi yang lama sudah tidak bisa diandalkan.',
  timestamp: new Date().toISOString(),
  dismissible: true,
};

export async function getAlerts(): Promise<Alert[]> {
  const appId = getActiveAppId();
  const alerts = [SYSTEM_NOTICE, ...computeAlerts(currentReviews())];
  if (!appId) return alerts;
  const dismissed = getDismissedAlertIds(appId);
  return alerts.filter(a => !dismissed.has(a.id));
}

export async function getRecentReviews(limit = 10): Promise<Review[]> {
  const sorted = [...currentReviews()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return Promise.resolve(sorted.slice(0, limit));
}

// Beda dari getRecentReviews (dibatasi 10) — dipakai buat export data,
// butuh SEMUA review, bukan cuma yang terbaru.
export async function getAllReviews(): Promise<Review[]> {
  return Promise.resolve(currentReviews());
}

export async function dismissAlert(alertId: string): Promise<void> {
  const appId = getActiveAppId();
  if (!appId) return;
  try {
    const raw = localStorage.getItem(dismissedAlertsKey(appId));
    const existing: { id: string; dismissedAt: number }[] = raw ? JSON.parse(raw) : [];
    existing.push({ id: alertId, dismissedAt: Date.now() });
    localStorage.setItem(dismissedAlertsKey(appId), JSON.stringify(existing));
  } catch {
    // localStorage penuh/tidak tersedia — abaikan, tidak fatal
  }
}