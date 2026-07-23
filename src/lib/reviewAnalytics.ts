// Semua logic perhitungan analytics untuk Overview dashboard, dihitung
// langsung dari data review hasil scraping (bukan dari backend/API terpisah).
// Dipakai oleh @/api/index.ts.

import type {
  Review,
  DashboardSummary,
  RatingTrendPoint,
  SentimentOverTimePoint,
  UserSegment,
  TopicBreakdown,
  Alert,
  ForecastPoint,
  PredictionMetric,
  KeyEvent,
} from '@/api/types';

const DAY_MS = 24 * 60 * 60 * 1000;

function toDayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function sentimentScoreOf(reviews: Review[]): number {
  if (!reviews.length) return 0;
  const weight = (r: Review) => (r.sentiment === 'positive' ? 1 : r.sentiment === 'neutral' ? 0.5 : 0);
  return average(reviews.map(weight));
}

// ============== Text Sentiment (independen dari rating bintang) ==============
// CATATAN: `review.sentiment` (dipakai sentimentScoreOf di atas) berasal dari
// RATING, bukan dari isi teksnya. Itu bagus buat DashboardSummary/Topic
// Breakdown/Alerts. Tapi khusus untuk User Segments, segmen itu SENDIRI
// didefinisikan dari rating (Promoter = rating>=4, Detractor = rating<=2),
// jadi kalau sentiment-nya dihitung dari rating juga, hasilnya PASTI selalu
// 0%/100% — nggak pernah kasih info baru (cuma echo nama segmennya sendiri).
//
// Fungsi di bawah ini menghitung sentiment dari KATA-KATA di teks review
// (bukan dari rating), pakai pencocokan kata kunci sederhana — sama gayanya
// dengan Topic Breakdown. Ini heuristik, bukan NLP beneran, jadi kadang bisa
// meleset (sarkasme, negasi, dll) — tapi setidaknya independen dari rating,
// jadi angkanya beneran bermakna.

const POSITIVE_WORDS = [
  'bagus', 'suka', 'mantap', 'keren', 'puas', 'memuaskan', 'membantu',
  'lancar', 'mudah', 'cepat', 'ramah', 'terbaik', 'rekomendasi', 'recommended',
  'sempurna', 'nyaman', 'oke', 'top', 'terima kasih', 'makasih', 'love',
  'good', 'great', 'excellent', 'amazing', 'awesome', 'perfect', 'best',
];

const NEGATIVE_WORDS = [
  'buruk', 'jelek', 'lemot', 'lambat', 'lag', 'error', 'bug', 'crash',
  'macet', 'force close', 'kecewa', 'mengecewakan', 'susah', 'sulit', 'ribet',
  'parah', 'sampah', 'busuk', 'nyesel', 'menyesal', 'gagal', 'penipuan',
  'bohong', 'bad', 'terrible', 'worst', 'hate', 'annoying', 'useless', 'scam',
];

// -1 = negatif, 0 = netral/campur/tidak terdeteksi, 1 = positif
function textSentimentOf(text: string): -1 | 0 | 1 {
  const lower = (text || '').toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) pos++;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) neg++;
  if (pos === neg) return 0;
  return pos > neg ? 1 : -1;
}

function textSentimentScoreOf(reviews: Review[]): number {
  if (!reviews.length) return 0.5; // netral kalau nggak ada data sama sekali
  const weight = (r: Review) => {
    const s = textSentimentOf(r.text);
    return s > 0 ? 1 : s < 0 ? 0 : 0.5;
  };
  return average(reviews.map(weight));
}

// Bagi review jadi 2 periode: "periode sekarang" (N hari terakhir) vs
// "periode sebelumnya" (N hari sebelum itu) — dipakai untuk menghitung delta/tren.
function splitPeriods(reviews: Review[], periodDays: number) {
  const currentStart = daysAgo(periodDays).getTime();
  const previousStart = daysAgo(periodDays * 2).getTime();
  const current: Review[] = [];
  const previous: Review[] = [];
  for (const r of reviews) {
    const t = new Date(r.timestamp).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= currentStart) current.push(r);
    else if (t >= previousStart) previous.push(r);
  }
  return { current, previous };
}

function percentDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function uniqueUsers(reviews: Review[]): number {
  return new Set(reviews.map(r => r.user.trim().toLowerCase())).size;
}

// ============== Dashboard Summary ==============
// CATATAN ASUMSI: avgRatingDelta & sentimentScoreDelta = selisih ANGKA (poin),
// totalReviewsDelta & activeReviewersDelta = persen (%) perubahan.
// Ini pola paling umum dipakai di dashboard analytics; kalau TopStats.tsx
// ternyata format-nya beda, tinggal sesuaikan di sini saja.

export function computeDashboardSummary(allReviews: Review[], periodDays = 30): DashboardSummary {
  const { current, previous } = splitPeriods(allReviews, periodDays);
  // Kalau belum cukup data untuk "periode sekarang", pakai semua data yang ada
  // biar angkanya tidak nol semua.
  const currentForAvg = current.length ? current : allReviews;

  const avgRating = average(currentForAvg.map(r => r.rating));
  const prevAvgRating = average(previous.map(r => r.rating));

  const sentimentScore = sentimentScoreOf(currentForAvg);
  const prevSentimentScore = sentimentScoreOf(previous);

  const activeReviewers = uniqueUsers(currentForAvg);
  const prevActiveReviewers = uniqueUsers(previous);

  return {
    avgRating: Number(avgRating.toFixed(2)),
    avgRatingDelta: Number((avgRating - (previous.length ? prevAvgRating : avgRating)).toFixed(2)),
    totalReviews: allReviews.length,
    totalReviewsDelta: Number(percentDelta(current.length, previous.length).toFixed(1)),
    sentimentScore: Number(sentimentScore.toFixed(2)),
    sentimentScoreDelta: Number((sentimentScore - (previous.length ? prevSentimentScore : sentimentScore)).toFixed(2)),
    activeReviewers,
    activeReviewersDelta: Number(percentDelta(activeReviewers, prevActiveReviewers).toFixed(1)),
  };
}

// ============== Rating Trend ==============

export function computeRatingTrend(allReviews: Review[], days = 30): RatingTrendPoint[] {
  const byDay = new Map<string, number[]>();
  for (const r of allReviews) {
    const t = new Date(r.timestamp);
    if (Number.isNaN(t.getTime())) continue;
    const key = toDayKey(t);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(r.rating);
  }

  const overallAvg = average(allReviews.map(r => r.rating));
  const points: RatingTrendPoint[] = [];
  let lastKnown = overallAvg;

  for (let i = days - 1; i >= 0; i--) {
    const key = toDayKey(daysAgo(i));
    const dayRatings = byDay.get(key);
    if (dayRatings && dayRatings.length) {
      lastKnown = average(dayRatings);
    }
    // Hari tanpa review: pakai rata-rata terakhir yang diketahui (carry-forward),
    // supaya garis chart tetap kontinu, tidak jatuh ke 0.
    points.push({ date: key, rating: Number(lastKnown.toFixed(2)) });
  }

  return points;
}

// ============== Sentiment Over Time ==============

interface DayCounts { positive: number; neutral: number; negative: number }

export function computeSentimentOverTime(allReviews: Review[], days = 30): SentimentOverTimePoint[] {
  const byDay = new Map<string, DayCounts>();
  for (const r of allReviews) {
    const t = new Date(r.timestamp);
    if (Number.isNaN(t.getTime())) continue;
    const key = toDayKey(t);
    if (!byDay.has(key)) byDay.set(key, { positive: 0, neutral: 0, negative: 0 });
    byDay.get(key)![r.sentiment] += 1;
  }

  // Pakai rolling window 7 hari (bukan cuma hari itu sendiri) supaya kurvanya
  // tetap informatif walau volume review harian sedikit/naik-turun tajam.
  const WINDOW = 7;
  const points: SentimentOverTimePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    let positive = 0, neutral = 0, negative = 0;
    for (let w = 0; w < WINDOW; w++) {
      const day = byDay.get(toDayKey(daysAgo(i + w)));
      if (day) {
        positive += day.positive;
        neutral += day.neutral;
        negative += day.negative;
      }
    }
    points.push({ date: toDayKey(daysAgo(i)), positive, neutral, negative });
  }
  return points;
}

// ============== User Segments ==============
// Diganti dari segmen berbasis data yang tidak ada (status bayar, follower, dll)
// jadi segmen berbasis RATING + PANJANG TEKS review — dua-duanya beneran ada
// di data scraping.

const VOCAL_THRESHOLD_CHARS = 80; // review >= ini dianggap "detail" / vocal

type SegmentKey = 'vocal_promoter' | 'quiet_promoter' | 'neutral' | 'vocal_detractor' | 'quiet_detractor';

function segmentOf(r: Review): SegmentKey {
  const isVocal = (r.text?.length || 0) >= VOCAL_THRESHOLD_CHARS;
  if (r.rating >= 4) return isVocal ? 'vocal_promoter' : 'quiet_promoter';
  if (r.rating <= 2) return isVocal ? 'vocal_detractor' : 'quiet_detractor';
  return 'neutral';
}

// Dipakai buat modal "lihat review di segmen ini" — ambil review ASLI (bukan
// cuma angka ringkasan) yang masuk ke satu segmen tertentu.
export function getReviewsInSegment(allReviews: Review[], segmentId: string): Review[] {
  return allReviews.filter(r => (segmentOf(r) as string) === segmentId);
}

const SEGMENT_META: Record<SegmentKey, { name: string; emoji: string; color: string }> = {
  vocal_promoter: { name: 'Vocal Promoters', emoji: '📣', color: '#2E7D32' },
  quiet_promoter: { name: 'Quiet Promoters', emoji: '🙂', color: '#66BB6A' },
  neutral: { name: 'Neutral Reviewers', emoji: '😐', color: '#FB8C00' },
  vocal_detractor: { name: 'Vocal Detractors', emoji: '📢', color: '#C62828' },
  quiet_detractor: { name: 'Quiet Detractors', emoji: '🤐', color: '#9E9E9E' },
};

// Split KHUSUS buat trend segmen — beda dari splitPeriods (yang bandingin 30
// hari terakhir vs 30 hari sebelum HARI INI). Kalau rentang data review belum
// nyampe 60 hari, splitPeriods bikin bucket "sebelumnya" kosong terus, jadi
// trend selalu "stable" (–). Di sini kita bagi berdasarkan rentang TANGGAL
// datanya sendiri: separuh review paling awal vs separuh paling akhir — jadi
// selalu ada perbandingan yang bermakna, seberapa pun panjang rentang datanya.
function splitByDataTimeline(reviews: Review[]): { early: Review[]; late: Review[] } {
  const withDates = reviews
    .map(r => ({ review: r, t: new Date(r.timestamp).getTime() }))
    .filter(x => !Number.isNaN(x.t))
    .sort((a, b) => a.t - b.t);

  if (withDates.length < 4) {
    // Terlalu sedikit data buat dibagi 2 secara bermakna -> anggap semuanya
    // "early", trend jadi stable (lebih jujur daripada maksain bandingin
    // 1-2 review doang).
    return { early: withDates.map(x => x.review), late: [] };
  }

  const mid = Math.floor(withDates.length / 2);
  return {
    early: withDates.slice(0, mid).map(x => x.review),
    late: withDates.slice(mid).map(x => x.review),
  };
}

export function computeUserSegments(allReviews: Review[]): UserSegment[] {
  if (!allReviews.length) return [];
  const { early, late } = splitByDataTimeline(allReviews);
  const base = allReviews; // persentase/avgRating/sentiment tetap dari SEMUA data, bukan cuma separuh
  const keys = Object.keys(SEGMENT_META) as SegmentKey[];

  return keys
    .map(key => {
      const members = base.filter(r => segmentOf(r) === key);
      const earlyMembers = early.filter(r => segmentOf(r) === key);
      const lateMembers = late.filter(r => segmentOf(r) === key);

      const userCount = members.length;
      const percentage = base.length ? (userCount / base.length) * 100 : 0;

      let trend: UserSegment['trend'] = 'stable';
      if (early.length && late.length) {
        const earlyShare = (earlyMembers.length / early.length) * 100;
        const lateShare = (lateMembers.length / late.length) * 100;
        if (lateShare - earlyShare > 2) trend = 'up';
        else if (earlyShare - lateShare > 2) trend = 'down';
      }

      return {
        id: key,
        name: SEGMENT_META[key].name,
        emoji: SEGMENT_META[key].emoji,
        color: SEGMENT_META[key].color,
        percentage: Number(percentage.toFixed(1)),
        userCount,
        avgRating: Number(average(members.map(r => r.rating)).toFixed(2)),
        // Sengaja pakai textSentimentScoreOf (dari KATA di teks review), BUKAN
        // sentimentScoreOf (dari rating) — lihat catatan di atas fungsi itu.
        // Dikirim sebagai pecahan 0-1 (bukan 0-100), komponen UI yang
        // mengalikan sendiri dengan 100 untuk tanda persen.
        sentiment: Number(textSentimentScoreOf(members).toFixed(2)),
        // Breakdown jumlah (bukan pecahan) per klasifikasi teks — dipakai buat
        // stacked bar chart, gaya yang sama kayak Topic Sentiment Breakdown.
        textPositive: members.filter(r => textSentimentOf(r.text) === 1).length,
        textNeutral: members.filter(r => textSentimentOf(r.text) === 0).length,
        textNegative: members.filter(r => textSentimentOf(r.text) === -1).length,
        trend,
      };
    })
    .filter(s => s.userCount > 0); // segmen yang memang kosong tidak usah ditampilkan
}

// ============== Topic Breakdown ==============
// CATATAN: data scraping tidak punya kategori topik asli (cuma judul review),
// jadi ini pakai pencocokan pola kata di teks sebagai perkiraan/heuristik.
// Kalau nanti ada kategorisasi topik yang sesungguhnya, cukup ganti fungsi ini.
//
// Sengaja BUKAN cuma cek satu kata generik (misal cuma "ui" doang, yang gampang
// salah tangkap kata lain) — beberapa pola di sini mensyaratkan KOMBINASI
// subjek + kata keluhan/pujian dalam jarak dekat, misal "ui ... sulit" atau
// "tombol ... susah", biar lebih presisi sesuai konteks reviewnya.

interface TopicRule {
  topic: string;
  icon: string;
  patterns: RegExp[];
}

const TOPIC_RULES: TopicRule[] = [
  {
    topic: 'Gameplay',
    icon: '🎮',
    patterns: [
      /\bgameplay/i,
      /\blevel/i,
      /\bstage/i,
      /\bkontrol.{0,15}(susah|sulit|ribet|jelek|aneh)/i,
      /\bkarakter/i,
      /\bmisi/i,
    ],
  },
  {
    topic: 'UI/UX',
    icon: '🎨',
    patterns: [
      /\bui\b.{0,20}(sulit|susah|ribet|membingungkan|jelek|aneh|bagus|rapi|keren)/i,
      /(sulit|susah|ribet|membingungkan|aneh).{0,20}\bui\b/i,
      /\btampilan.{0,20}(sulit|susah|ribet|membingungkan|jelek|aneh|bagus|rapi|keren|menarik)/i,
      /\btombol.{0,20}(sulit|susah|ribet|kecil|error|(ga|nggak|tidak)\s*(bisa|jalan))/i,
      /\bdesain.{0,20}(jelek|bagus|menarik|keren|aneh)/i,
      /\binterface/i,
      /\blayout/i,
    ],
  },
  {
    topic: 'Bugs',
    icon: '🐛',
    patterns: [
      /\bbug/i,
      /\berror/i,
      /\bcrash/i,
      /\bforce\s*close/i,
      /\bmacet/i,
      /\bfreeze/i,
      /\bglitch/i,
      /(ga|nggak|tidak)\s*bisa\s*(dibuka|jalan|masuk)/i,
    ],
  },
  {
    topic: 'Performance',
    icon: '⚡',
    patterns: [
      /\blag/i,
      /\blemot/i,
      /\blambat/i,
      /\bfps/i,
      /\bberat.{0,15}(banget|di\s*hp|sekali)/i,
      /\bloading.{0,15}(lama|lambat)/i,
      /\bdelay/i,
    ],
  },
  {
    topic: 'Monetization',
    icon: '💳',
    patterns: [
      /\biklan/i,
      /\bads\b/i,
      /\bbayar/i,
      /\bpremium/i,
      /\bsubscription/i,
      /\bberlangganan/i,
      /\bmahal/i,
      /\btop\s*up/i,
      /\bp2w\b/i,
      /\bpay\s*to\s*win/i,
    ],
  },
  {
    topic: 'Support',
    icon: '🎧',
    patterns: [
      /\bcustomer\s*service/i,
      /\bcs\b/i,
      /\bsupport/i,
      /\bbantuan/i,
      /\badmin/i,
      /\brespon.{0,15}(lama|lambat|nggak\s*ada|tidak\s*ada)/i,
      /\bkomplain/i,
    ],
  },
];

// Dipakai bareng oleh computeTopicBreakdown (di bawah) DAN oleh ReviewsPage
// (filter Topics) — supaya kategorisasi topiknya PERSIS SAMA di kedua tempat,
// nggak ada 2 logic beda yang bisa drift satu sama lain. Sengaja pakai tipe
// minimal (bukan import Review dari @/api/types) supaya gampang dipakai dari
// mana aja tanpa dependency tambahan.
export function classifyReviewTopics(review: { text: string; topics?: string[] }): string[] {
  const haystack = `${review.text ?? ''} ${(review.topics ?? []).join(' ')}`;
  return TOPIC_RULES
    .filter(rule => rule.patterns.some(p => p.test(haystack)))
    .map(rule => rule.topic);
}

export function computeTopicBreakdown(allReviews: Review[]): TopicBreakdown[] {
  // Map dulu: tiap review -> daftar topik yang cocok (pakai fungsi yang sama
  // dengan ReviewsPage, biar hasilnya konsisten di semua tempat).
  const reviewTopics = allReviews.map(r => ({ review: r, topics: classifyReviewTopics(r) }));

  const specific = TOPIC_RULES.map(({ topic, icon }) => {
    const matches = reviewTopics.filter(rt => rt.topics.includes(topic)).map(rt => rt.review);
    return { topic, icon, matches };
  });

  // Review yang nggak nyangkut di topik spesifik manapun -> masuk "Lainnya",
  // supaya SEMUA review ke-cover (nggak ada yang "hilang" begitu aja kayak
  // sebelumnya) — sama seperti Segment Details yang selalu 100% ke-assign.
  const unmatched = reviewTopics.filter(rt => rt.topics.length === 0).map(rt => rt.review);

  const all = [
    ...specific,
    { topic: 'Lainnya', icon: '💬', matches: unmatched },
  ];

  return all
    .map(({ topic, icon, matches }) => ({
      topic,
      icon,
      positive: matches.filter(r => r.sentiment === 'positive').length,
      neutral: matches.filter(r => r.sentiment === 'neutral').length,
      negative: matches.filter(r => r.sentiment === 'negative').length,
      total: matches.length,
    }))
    .filter(t => t.total > 0); // topik yang benar-benar nggak ada review-nya tidak usah ditampilkan
}

// ============== Alerts ==============
// Alert dihitung dari aturan sederhana atas perubahan data terbaru — bukan
// dari sistem alert eksternal.

export function computeAlerts(allReviews: Review[], periodDays = 7): Alert[] {
  const alerts: Alert[] = [];
  const { current, previous } = splitPeriods(allReviews, periodDays);
  const now = new Date().toISOString();

  if (current.length >= 3 && previous.length >= 3) {
    const currentAvg = average(current.map(r => r.rating));
    const prevAvg = average(previous.map(r => r.rating));
    const ratingDrop = prevAvg - currentAvg;

    if (ratingDrop >= 0.3) {
      alerts.push({
        id: 'rating-drop',
        type: 'critical',
        title: 'Rating turun signifikan',
        description: `Rata-rata rating turun dari ${prevAvg.toFixed(1)} ke ${currentAvg.toFixed(1)} dalam ${periodDays} hari terakhir.`,
        timestamp: now,
        dismissible: true,
      });
    }

    const currentNegPct = (current.filter(r => r.sentiment === 'negative').length / current.length) * 100;
    const prevNegPct = (previous.filter(r => r.sentiment === 'negative').length / previous.length) * 100;

    if (currentNegPct - prevNegPct >= 10) {
      alerts.push({
        id: 'negative-spike',
        type: 'warning',
        title: 'Lonjakan review negatif',
        description: `Porsi review negatif naik dari ${prevNegPct.toFixed(0)}% ke ${currentNegPct.toFixed(0)}% dalam ${periodDays} hari terakhir.`,
        timestamp: now,
        dismissible: true,
      });
    }
  }

  const recentNegative = current.filter(r => r.sentiment === 'negative');
  const bugMentions = recentNegative.filter(r => /bug|crash|force close|macet|freeze/i.test(r.text));
  if (recentNegative.length >= 3 && bugMentions.length / recentNegative.length >= 0.4) {
    alerts.push({
      id: 'bug-mentions',
      type: 'warning',
      title: 'Banyak keluhan soal bug/crash',
      description: `${bugMentions.length} dari ${recentNegative.length} review negatif terbaru menyebut bug atau crash.`,
      timestamp: now,
      dismissible: true,
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: 'all-clear',
      type: 'info',
      title: 'Semua metrik stabil',
      description: `Tidak ada perubahan signifikan pada rating atau sentimen dalam ${periodDays} hari terakhir.`,
      timestamp: now,
      dismissible: true,
    });
  }

  return alerts;
}

// ============== Forecast / Prediction Metrics / Key Events ==============
// CATATAN: ini regresi LINEAR SEDERHANA (least squares) atas rating harian
// 30 hari terakhir, bukan model machine learning beneran. Cukup buat kasih
// gambaran arah tren + confidence yang masuk akal, tapi jangan dianggap
// prediksi presisi tinggi — datanya juga masih sedikit (hobby-scale).

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

interface RatingRegression {
  slope: number;
  intercept: number;
  residualStd: number;
  historyTrend: RatingTrendPoint[];
}

// Regresi dihitung SEKALI dan dipakai bareng oleh computeForecast &
// computePredictionMetrics, supaya angka di chart & di tabel metrics selalu
// konsisten satu sama lain (bukan dihitung terpisah dengan hasil beda tipis).
function computeRatingRegression(allReviews: Review[], historyDays: number): RatingRegression {
  const historyTrend = computeRatingTrend(allReviews, historyDays);
  const n = historyTrend.length;
  const xs = historyTrend.map((_, i) => i);
  const ys = historyTrend.map(t => t.rating);

  const meanX = average(xs);
  const meanY = average(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const residualStd = Math.sqrt(average(residuals.map(r => r * r)));

  return { slope, intercept, residualStd, historyTrend };
}

export function computeForecast(allReviews: Review[], historyDays = 30, forecastDays = 90): ForecastPoint[] {
  if (!allReviews.length) return [];

  const { slope, intercept, residualStd, historyTrend } = computeRatingRegression(allReviews, historyDays);
  const n = historyTrend.length;
  if (!n) return [];

  const points: ForecastPoint[] = historyTrend.map(t => ({ date: t.date, rating: t.rating }));

  // Sambungkan garis prediksi (dashed) dari titik historis (solid) TERAKHIR,
  // biar dua garisnya nyambung mulus di chart, bukan putus/nge-jump.
  const lastPoint = points[points.length - 1];
  lastPoint.predicted = lastPoint.rating;
  lastPoint.lowerBound = lastPoint.rating;
  lastPoint.upperBound = lastPoint.rating;

  const lastDate = new Date(historyTrend[n - 1].date);

  for (let d = 1; d <= forecastDays; d++) {
    const x = (n - 1) + d;
    const predicted = clamp(slope * x + intercept, 1, 5);

    // Interval makin lebar makin jauh ke depan (makin nggak pasti).
    const spread = clamp(residualStd, 0.05, 1) * (0.6 + (d / forecastDays) * 1.4);
    const lower = clamp(predicted - spread, 1, 5);
    const upper = clamp(predicted + spread, 1, 5);

    const date = new Date(lastDate);
    date.setDate(date.getDate() + d);

    points.push({
      date: toDayKey(date),
      predicted: Number(predicted.toFixed(2)),
      lowerBound: Number(lower.toFixed(2)),
      upperBound: Number(upper.toFixed(2)),
    });
  }

  return points;
}

const PREDICTION_TIMEFRAMES: { label: string; days: number }[] = [
  { label: '7 Day', days: 7 },
  { label: '30 Day', days: 30 },
  { label: '90 Day', days: 90 },
];

export function computePredictionMetrics(allReviews: Review[], historyDays = 30): PredictionMetric[] {
  if (!allReviews.length) return [];

  const { slope, intercept, residualStd, historyTrend } = computeRatingRegression(allReviews, historyDays);
  const n = historyTrend.length;
  if (!n) return [];

  // Berapa hari yang BENERAN punya review asli (bukan carry-forward) — makin
  // banyak data asli, makin pede prediksinya.
  const daysWithRealData = new Set(
    allReviews
      .map(r => new Date(r.timestamp))
      .filter(d => !Number.isNaN(d.getTime()))
      .map(d => toDayKey(d))
  ).size;
  const dataConfidence = clamp(daysWithRealData / 20, 0.15, 1);

  return PREDICTION_TIMEFRAMES.map(({ label, days }) => {
    const x = (n - 1) + days;
    const predictedRating = clamp(slope * x + intercept, 1, 5);

    const horizonPenalty = (days / 90) * 35; // makin jauh prediksinya, makin turun confidence-nya
    const noisePenalty = clamp(residualStd * 50, 0, 35); // makin naik-turun historinya, makin turun confidence-nya
    const confidence = clamp(Math.round(92 * dataConfidence - horizonPenalty - noisePenalty), 15, 95);

    const declineBoost = slope < 0 ? clamp(Math.abs(slope) * 300, 0, 25) : 0; // tren nurun -> risk ekstra
    const riskPercent = clamp(Math.round((100 - confidence) * 0.55 + declineBoost), 3, 70);

    return {
      timeframe: label,
      predictedRating: Number(predictedRating.toFixed(2)),
      confidence,
      riskPercent,
    };
  });
}

export function computeKeyEvents(allReviews: Review[], historyDays = 30, maxEvents = 5): KeyEvent[] {
  if (!allReviews.length) return [];

  const trend = computeRatingTrend(allReviews, historyDays);
  const SPIKE_THRESHOLD = 0.35; // perubahan rata-rata harian >= ini dianggap "lonjakan"

  const candidates: { date: string; delta: number; from: number; to: number }[] = [];
  for (let i = 1; i < trend.length; i++) {
    const delta = trend[i].rating - trend[i - 1].rating;
    if (Math.abs(delta) >= SPIKE_THRESHOLD) {
      candidates.push({ date: trend[i].date, delta, from: trend[i - 1].rating, to: trend[i].rating });
    }
  }

  // Ambil yang paling signifikan dulu (biar nggak kebanyakan noise kalau
  // lonjakannya sering), baru diurutkan lagi berdasarkan tanggal buat timeline.
  candidates.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const top = candidates.slice(0, maxEvents);
  top.sort((a, b) => a.date.localeCompare(b.date));

  return top.map(c => ({
    date: c.date, // ISO 'YYYY-MM-DD' — diformat cantik di komponen yang nampilin (pakai date-fns)
    title: c.delta > 0 ? 'Lonjakan rating' : 'Penurunan rating',
    description: `Rata-rata rating harian ${c.delta > 0 ? 'naik' : 'turun'} dari ${c.from.toFixed(1)}★ ke ${c.to.toFixed(1)}★.`,
    impact: c.delta > 0 ? 'positive' : 'negative',
  }));
}

// ============== AI Summary (template otomatis, BUKAN panggil LLM beneran) ==============
// Nyusun beberapa kalimat ringkasan dari data yang SUDAH dihitung di tempat
// lain (DashboardSummary, TopicBreakdown, UserSegment, Alert) — sengaja
// terima data yang udah jadi, bukan raw Review[], supaya nggak recompute
// ulang hal yang di halaman pemanggil (OverviewPage) udah pernah dihitung.

export interface AiSummaryInput {
  summary: DashboardSummary;
  topics: TopicBreakdown[];
  segments: UserSegment[];
  alerts: Alert[];
}

export function buildAiSummary({ summary, topics, segments, alerts }: AiSummaryInput): string[] {
  const lines: string[] = [];

  if (summary.totalReviews === 0) {
    return ['Belum ada data review untuk app ini — ringkasan akan muncul setelah scraping berhasil.'];
  }

  // 1. Rating & arah tren
  const trendWord =
    summary.avgRatingDelta > 0.05 ? 'naik' : summary.avgRatingDelta < -0.05 ? 'turun' : 'stabil';
  const trendPart =
    trendWord === 'stabil'
      ? 'cenderung stabil dibanding periode sebelumnya'
      : `${trendWord} ${Math.abs(summary.avgRatingDelta).toFixed(2)} poin dibanding periode sebelumnya`;
  lines.push(
    `Rating rata-rata saat ini ${summary.avgRating}★ dari total ${summary.totalReviews} review, ${trendPart}.`
  );

  // 2. Interpretasi sentiment score
  const sentimentLabel =
    summary.sentimentScore >= 0.7 ? 'sangat positif' :
    summary.sentimentScore >= 0.5 ? 'cenderung positif' :
    summary.sentimentScore >= 0.3 ? 'campur aduk' : 'cenderung negatif';
  lines.push(`Sentimen keseluruhan ${sentimentLabel} (skor ${summary.sentimentScore.toFixed(2)} dari skala 0-1).`);

  // 3. Topik keluhan terbanyak (exclude "Lainnya" biar lebih spesifik & actionable)
  const topNegativeTopic = [...topics]
    .filter(t => t.topic !== 'Lainnya' && t.negative > 0)
    .sort((a, b) => b.negative - a.negative)[0];
  if (topNegativeTopic) {
    lines.push(
      `Keluhan paling banyak seputar "${topNegativeTopic.topic}" (${topNegativeTopic.negative} review negatif menyinggung topik ini).`
    );
  }

  // 4. Segmen terbesar + arah pergerakannya
  const biggestSegment = [...segments].sort((a, b) => b.userCount - a.userCount)[0];
  if (biggestSegment) {
    const trendNote =
      biggestSegment.trend === 'up' ? ', dan porsinya sedang bertambah' :
      biggestSegment.trend === 'down' ? ', dan porsinya sedang berkurang' : '';
    lines.push(
      `Segmen terbesar adalah "${biggestSegment.name}" (${biggestSegment.percentage}% dari reviewer)${trendNote}.`
    );
  }

  // 5. Alert kritis yang masih aktif (info/beta-notice sengaja diabaikan di sini)
  const critical = alerts.filter(a => a.type === 'critical');
  if (critical.length > 0) {
    lines.push(
      `Perlu perhatian: ${critical.length} alert kritis aktif — ${critical.map(a => a.title).join(', ')}.`
    );
  }

  return lines;
}