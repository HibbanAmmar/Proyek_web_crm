import { useState, useEffect, useCallback, useRef } from 'react';
import { useRefresh } from './useRefresh';
import { storageKeyForApp, parseScrapedReviews } from '@/lib/reviewData';

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  timestamp: string;
}

// Global state untuk app aktif
let activeAppId: string | null = null;

export function setActiveAppId(appId: string | null) {
  activeAppId = appId;
  window.dispatchEvent(new CustomEvent('reviewpulse:app-changed'));
}

export function getActiveAppId() {
  return activeAppId;
}

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentApp, setCurrentApp] = useState<string | null>(null);

  // Menyimpan app & raw string TERAKHIR yang benar-benar diproses (di ref,
  // bukan state, supaya tidak memicu render sendiri). Dipakai untuk:
  // 1. Tahu apakah ini pergantian app (perlu loading penuh) atau bukan.
  // 2. Skip setReviews() kalau isi localStorage persis sama seperti terakhir
  //    kali — supaya tidak bikin reference array baru untuk data yang
  //    sebenarnya tidak berubah (mencegah re-render/reset terus tiap
  //    auto-refresh walau datanya sama).
  const lastAppRef = useRef<string | null>(null);
  const lastRawRef = useRef<string | null>(null);

  const loadReviews = useCallback((opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    const appId = activeAppId;
    const isAppSwitch = appId !== lastAppRef.current;

    // Spinner penuh HANYA untuk load pertama / ganti app.
    // Refresh berkala (polling) selalu silent, tidak boleh "mengosongkan" UI.
    if (!silent && isAppSwitch) setLoading(true);

    setCurrentApp(appId);

    if (!appId) {
      lastAppRef.current = null;
      lastRawRef.current = null;
      setReviews([]);
      setLoading(false);
      return;
    }

    const raw = localStorage.getItem(storageKeyForApp(appId));

    // App sama & isi localStorage identik dengan sebelumnya -> tidak perlu
    // parse ulang atau setReviews (mencegah render/efek yang tidak perlu).
    if (!isAppSwitch && raw === lastRawRef.current) {
      setLoading(false);
      return;
    }

    lastAppRef.current = appId;
    lastRawRef.current = raw;
    setReviews(parseScrapedReviews(raw));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useRefresh(() => {
    loadReviews({ silent: true });
  });

  useEffect(() => {
    const handler = () => loadReviews();
    window.addEventListener('reviewpulse:app-changed', handler);
    return () => window.removeEventListener('reviewpulse:app-changed', handler);
  }, [loadReviews]);

  return { reviews, loading, currentApp, reload: loadReviews };
}