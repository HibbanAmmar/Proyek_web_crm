import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import SegmentDonutChart from '@/components/charts/SegmentDonutChart';
import SegmentDetailTable from '@/components/SegmentDetailTable';
import { getUserSegments, getReviewsBySegment } from '@/api';
import type { UserSegment, Review } from '@/api/types';

function SegmentReviewsModal({
  segment,
  onClose,
}: {
  segment: UserSegment;
  onClose: () => void;
}) {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [visibleRows, setVisibleRows] = useState<Set<number>>(new Set());

  // Dipakai buat trigger transisi CSS masuk/keluar (bukan langsung nongol/ilang).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = () => {
    setMounted(false);
    // Tunggu animasi keluar selesai (200ms) baru beneran unmount komponennya.
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    let cancelled = false;
    setReviews(null);
    setVisibleRows(new Set());
    getReviewsBySegment(segment.id).then(data => {
      if (!cancelled) setReviews(data);
    });
    return () => { cancelled = true; };
  }, [segment.id]);

  // Reveal satu-satu berurutan buat tiap baris review — pola yang sama
  // persis dengan card-card lain di app ini (Overview, Segment Insights).
  useEffect(() => {
    if (!reviews || !reviews.length) return;
    reviews.forEach((_, i) => {
      setTimeout(() => {
        setVisibleRows(prev => (prev.has(i) ? prev : new Set([...prev, i])));
      }, i * 60);
    });
  }, [reviews]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl transition-all ${
          mounted ? 'opacity-100 scale-100 duration-300' : 'opacity-0 scale-90 duration-150'
        }`}
        style={{
          // Easing "back-out" biar ada efek mantul dikit pas muncul (ngepop),
          // bukan transisi datar biasa. Nggak dipakai pas nutup (pakai ease-in
          // biasa) biar nutupnya tetap cepat & rapi, nggak mantul juga.
          transitionTimingFunction: mounted ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'ease-in',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#E8E0E0] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{segment.emoji}</span>
            <div>
              <h3 className="text-base font-semibold text-[#2D1818]">{segment.name}</h3>
              <p className="text-xs text-[#6B5B5B]">
                {segment.userCount} reviewer{segment.userCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-[#F0E8E8] text-[#6B5B5B] transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-3">
          {reviews === null && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C62828]" />
            </div>
          )}

          {reviews !== null && reviews.length === 0 && (
            <p className="text-sm text-[#9E8E8E] text-center py-8">Tidak ada review di segmen ini.</p>
          )}

          {reviews?.map((r, i) => (
            <div
              key={r.id}
              className={`border border-[#E8E0E0] rounded-xl p-3 transition-all duration-300 ${
                visibleRows.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C62828] to-[#FF6F00] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {r.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#2D1818]">{r.user}</span>
                    <span className="text-[11px] text-[#9E8E8E]">
                      {formatDistanceToNow(new Date(r.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= r.rating ? 'text-[#FFC107]' : 'text-[#E0E0E0]'}`}
                        fill={star <= r.rating ? '#FFC107' : 'none'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-[#6B5B5B] mt-1.5 leading-relaxed">{r.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<UserSegment[]>([]);

  // ASUMSI: project ini pakai react-router-dom. Query param ?segment=<id>
  // dipakai supaya tombol "View" di Overview bisa langsung buka halaman ini
  // dengan segmen yang sudah ke-filter.
  const [searchParams] = useSearchParams();
  const [activeSegment, setActiveSegment] = useState<string | null>(
    () => searchParams.get('segment')
  );
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  // Segmen yang lagi dibuka pop-up review-nya (null = modal tertutup)
  const [modalSegmentId, setModalSegmentId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const data = await getUserSegments();
    setSegments(data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Kalau segmen dari URL ternyata nggak ada di data yang ke-load (mis. app
  // yang aktif diganti dan segmen itu jadi kosong), reset filter-nya supaya
  // nggak nyangkut nampilin tabel kosong terus.
  useEffect(() => {
    if (activeSegment && segments.length && !segments.some(s => s.id === activeSegment)) {
      setActiveSegment(null);
    }
  }, [segments, activeSegment]);

  useEffect(() => {
    if (!segments.length) return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => setVisibleCards(prev => new Set([...prev, i])), i * 80);
    }
  }, [segments]);

  useEffect(() => {
    const handler = () => setActiveSegment(null);
    window.addEventListener('clearSegmentFilter', handler);
    return () => window.removeEventListener('clearSegmentFilter', handler);
  }, []);

  const gc = (i: number) => visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3';

  if (!segments.length) return <div className="flex items-center justify-center h-64 text-[#6B5B5B]">Loading...</div>;

  const modalSegment = modalSegmentId ? segments.find(s => s.id === modalSegmentId) ?? null : null;

  return (
    <div className="space-y-5 pb-6">
      <div className={`transition-all duration-400 ${gc(0)}`}>
        <SegmentDonutChart
          data={segments}
          onSegmentClick={setActiveSegment}
          activeSegment={activeSegment}
        />
      </div>
      <div className={`transition-all duration-400 ${gc(1)}`}>
        <SegmentDetailTable
          data={segments}
          activeSegment={activeSegment}
          // "View" di halaman ini buka pop-up isinya review/commenter ASLI yang
          // masuk ke segmen itu — beda dari klik donut/legend (yang cuma filter
          // tabel ringkasan di atas).
          onViewSegment={setModalSegmentId}
        />
      </div>

      {/* Segment Insights */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-400 ${gc(2)}`}>
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="bg-white rounded-2xl p-5 border border-[#E8E0E0] hover:-translate-y-0.5 hover:shadow-lg transition-all"
            style={{ borderLeftWidth: 4, borderLeftColor: segment.color }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{segment.emoji}</span>
              <div>
                <h4 className="text-sm font-semibold text-[#2D1818]">{segment.name}</h4>
                <span className="text-xs text-[#6B5B5B]">{segment.percentage}% of users</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#FAFAFA] rounded-lg p-2">
                <div className="text-base font-bold text-[#2D1818]">
                  {segment.userCount >= 1000 ? (segment.userCount / 1000).toFixed(1) + 'K' : segment.userCount}
                </div>
                <div className="text-[10px] text-[#6B5B5B]">Users</div>
              </div>
              <div className="bg-[#FAFAFA] rounded-lg p-2">
                <div className="text-base font-bold text-[#2D1818]">{segment.avgRating}★</div>
                <div className="text-[10px] text-[#6B5B5B]">Avg Rating</div>
              </div>
              <div className="bg-[#FAFAFA] rounded-lg p-2">
                <div className="text-base font-bold text-[#2D1818]">{(segment.sentiment * 100).toFixed(0)}%</div>
                <div className="text-[10px] text-[#6B5B5B]">Sentiment</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalSegment && (
        <SegmentReviewsModal segment={modalSegment} onClose={() => setModalSegmentId(null)} />
      )}
    </div>
  );
}