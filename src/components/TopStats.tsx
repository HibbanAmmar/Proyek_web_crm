import { useEffect, useState, useRef } from 'react';
import { Star, MessageSquare, Activity, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  waveColor: string;
  label: string;
  value: string;
  delta: number;
  delay: number;
}

function AnimatedNumber({ value, delay }: { value: string; delay: number }) {
  const [display, setDisplay] = useState('0');
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplay(value);
      return;
    }
    const timer = setTimeout(() => {
      hasAnimated.current = true;
      const numericMatch = value.replace(/[^0-9.]/g, '');
      const suffix = value.replace(/[0-9.]/g, '');
      const target = parseFloat(numericMatch);
      if (isNaN(target)) {
        setDisplay(value);
        return;
      }
      const duration = 800;
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        if (target >= 1000) {
          setDisplay((current / 1000).toFixed(1) + 'K');
        } else if (target >= 10) {
          setDisplay(Math.round(current).toString() + suffix);
        } else {
          setDisplay(current.toFixed(1) + suffix);
        }
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplay(value);
        }
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return <span>{display}</span>;
}

// ============== Sparkline / gelombang dekoratif ==============
// CATATAN: ini bukan data historis asli (Total Reviews & Active Reviewers
// belum ada perhitungan harian di analytics). Bentuknya di-generate pakai
// PRNG yang di-seed dari label+value, jadi POLANYA KONSISTEN tiap render
// (nggak berubah-ubah/acak tiap kali komponen re-render), dan kecenderungan
// arahnya (naik/turun) ngikutin tanda delta-nya. Kalau nanti mau pakai data
// historis asli (misal Average Rating dari `ratingTrend`), tinggal ganti
// `generateWavePoints` jadi terima array angka asli.

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateWavePoints(seedStr: string, trendUp: boolean, count = 14): number[] {
  const rand = mulberry32(hashSeed(seedStr));
  const bias = trendUp ? 0.16 : -0.16; // kemiringan umum ngikutin arah delta
  const values: number[] = [];
  let v = 0.5;
  for (let i = 0; i < count; i++) {
    const drift = bias * (i / (count - 1));
    v += (rand() - 0.5) * 0.22 + drift * 0.06;
    v = Math.max(0.1, Math.min(0.9, v));
    values.push(v);
  }
  return values;
}

function Sparkline({ color, seed, trendUp }: { color: string; seed: string; trendUp: boolean }) {
  const width = 200;
  const height = 48;
  const values = generateWavePoints(seed, trendUp);
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => [i * stepX, height - v * height] as [number, number]);

  // Smoothing lewat titik tengah antar node — trik standar biar garisnya
  // jadi kurva halus ("gelombang"), bukan garis patah-patah.
  let path = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    path += ` Q ${x0},${y0} ${mx},${my}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last[0]},${last[1]}`;

  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;
  const gradientId = `spark-grad-${seed.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function StatCard({ icon, iconBg, waveColor, label, value, delta, delay }: StatCardProps) {
  const isPositive = delta >= 0;
  return (
    <div
      className="relative bg-white rounded-2xl border border-[#E8E0E0] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative z-10 p-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wider text-[#6B5B5B] font-medium">
            {label}
          </div>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            {icon}
          </div>
        </div>
        <div className="text-3xl font-semibold text-[#2D1818] tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
          <AnimatedNumber value={value} delay={delay} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium mt-0.5 ${isPositive ? 'text-[#43A047]' : 'text-[#E53935]'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{isPositive ? '+' : ''}{delta}{typeof delta === 'number' && delta < 10 ? '' : '%'}</span>
        </div>
      </div>

      {/* Gelombang dekoratif di bagian bawah card */}
      <div className="h-12 -mt-1">
        <Sparkline color={waveColor} seed={`${label}-${value}`} trendUp={isPositive} />
      </div>
    </div>
  );
}

interface TopStatsProps {
  avgRating: number;
  avgRatingDelta: number;
  totalReviews: number;
  totalReviewsDelta: number;
  sentimentScore: number;
  sentimentScoreDelta: number;
  activeReviewers: number;
  activeReviewersDelta: number;
}

export default function TopStats({
  avgRating,
  avgRatingDelta,
  totalReviews,
  totalReviewsDelta,
  sentimentScore,
  sentimentScoreDelta,
  activeReviewers,
  activeReviewersDelta,
}: TopStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <StatCard
        icon={<Star className="w-5 h-5 text-[#FFC107]" />}
        iconBg="#FFF8E1"
        waveColor="#FFC107"
        label="Average Rating"
        value={`${avgRating}★`}
        delta={avgRatingDelta}
        delay={0}
      />
      <StatCard
        icon={<MessageSquare className="w-5 h-5 text-[#00897B]" />}
        iconBg="#E0F2F1"
        waveColor="#00897B"
        label="Total Reviews"
        value={`${totalReviews >= 1000 ? (totalReviews / 1000).toFixed(1) + 'K' : totalReviews.toString()}`}
        delta={totalReviewsDelta}
        delay={50}
      />
      <StatCard
        icon={<Activity className="w-5 h-5 text-[#7E57C2]" />}
        iconBg="#EDE7F6"
        waveColor="#7E57C2"
        label="Sentiment Score"
        value={sentimentScore.toFixed(2)}
        delta={sentimentScoreDelta}
        delay={100}
      />
      <StatCard
        icon={<Users className="w-5 h-5 text-[#FF6F00]" />}
        iconBg="#FFF3E0"
        waveColor="#FF6F00"
        label="Active Reviewers"
        value={`${activeReviewers >= 1000 ? (activeReviewers / 1000).toFixed(1) + 'K' : activeReviewers.toString()}`}
        delta={activeReviewersDelta}
        delay={150}
      />
    </div>
  );
}