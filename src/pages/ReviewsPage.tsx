import { useState, useEffect, useRef } from 'react';
import { Star, MessageSquareText, Filter, X, Gamepad2, Layout, Bug, Zap, CreditCard, Headphones } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useReviews } from '@/hooks/useReviews';
import { classifyReviewTopics } from '@/lib/reviewAnalytics';

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';

const sentimentConfig = {
  positive: { bg: '#E8F5E9', text: '#43A047', label: 'Positive' },
  neutral: { bg: '#FFF3E0', text: '#FB8C00', label: 'Neutral' },
  negative: { bg: '#FDECEA', text: '#E53935', label: 'Negative' },
};

const ratingOptions = [
  { id: 'low', label: '1-2 Stars', min: 1, max: 2, color: '#E53935' },
  { id: 'mid', label: '3 Stars', min: 3, max: 3, color: '#FB8C00' },
  { id: 'high', label: '4-5 Stars', min: 4, max: 5, color: '#43A047' },
];

// Label di sini SENGAJA sama persis dengan `topic` di TOPIC_RULES
// (src/lib/reviewAnalytics.ts) — itu yang dipakai buat matching-nya.
const topicOptions = [
  { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
  { id: 'uiux', label: 'UI/UX', icon: Layout },
  { id: 'bugs', label: 'Bugs', icon: Bug },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'monetization', label: 'Monetization', icon: CreditCard },
  { id: 'support', label: 'Support', icon: Headphones },
];

// Berapa banyak review yang ditampilkan per "halaman"
const PAGE_SIZE = 10;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'text-[#FFC107]' : 'text-[#E0E0E0]'}`}
          fill={star <= rating ? '#FFC107' : 'none'}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { reviews, loading, hasScrapedData } = useReviews();

  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Dipakai supaya spinner besar cuma tampil sekali di load pertama,
  // bukan setiap kali useReviews() melakukan refresh di background.
  const hasLoadedOnceRef = useRef(false);
  if (!loading) hasLoadedOnceRef.current = true;

  const toggleRating = (id: string) => {
    setSelectedRatings(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const filtered = reviews.filter(r => {
    if (sentimentFilter !== 'all' && r.sentiment !== sentimentFilter) return false;
    if (selectedRatings.length > 0) {
      const match = ratingOptions.some(ro =>
        selectedRatings.includes(ro.id) && r.rating >= ro.min && r.rating <= ro.max
      );
      if (!match) return false;
    }
    if (selectedTopics.length > 0) {
      const topicLabels = selectedTopics.map(t => topicOptions.find(to => to.id === t)?.label).filter(Boolean);
      // Diklasifikasi dari kata kunci di teks review (sama seperti Topic
      // Sentiment Breakdown di Overview), BUKAN dari r.topics (yang isinya
      // cuma judul asli review hasil scraping, bukan kategori).
      const reviewTopics = classifyReviewTopics(r);
      const hasTopic = reviewTopics.some(t => topicLabels.includes(t));
      if (!hasTopic) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.user.toLowerCase().includes(q) && !r.text.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Reset pagination + animasi HANYA saat filter berubah, atau saat jumlah
  // review benar-benar berubah (mis. ganti app). Sengaja TIDAK dependency ke
  // `reviews` (referensi array), karena useReviews() kemungkinan bikin array
  // baru tiap beberapa detik untuk refresh "Last updated" walau isinya sama —
  // itu yang sebelumnya bikin daftar reset & flicker terus-terusan.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setVisibleCards(new Set());
  }, [reviews.length, sentimentFilter, JSON.stringify(selectedRatings), JSON.stringify(selectedTopics), searchQuery]);

  // Animasikan card yang sedang seharusnya tampil (termasuk saat "Tampilkan Selanjutnya" diklik).
  // Hanya MENAMBAH index yang belum animasi, tidak pernah menghapus yang sudah ada,
  // jadi card yang sudah muncul tidak akan hilang lagi walau ada re-render lain.
  useEffect(() => {
    if (!reviews.length) return;
    const count = Math.min(filtered.length, visibleCount);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        setVisibleCards(prev => (prev.has(i) ? prev : new Set([...prev, i])));
      }, i * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCount, reviews.length, filtered.length]);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length));
  };

  const sentimentCounts = {
    all: reviews.length,
    positive: reviews.filter(r => r.sentiment === 'positive').length,
    neutral: reviews.filter(r => r.sentiment === 'neutral').length,
    negative: reviews.filter(r => r.sentiment === 'negative').length,
  };

  const clearFilters = () => {
    setSelectedRatings([]);
    setSelectedTopics([]);
    setSearchQuery('');
    setSentimentFilter('all');
  };

  const hasFilters = selectedRatings.length > 0 || selectedTopics.length > 0 || searchQuery || sentimentFilter !== 'all';

  // Spinner penuh HANYA di load pertama. Kalau ini refresh berikutnya di
  // background (hasLoadedOnceRef sudah true), tetap tampilkan data lama
  // yang masih ada supaya tidak blank / tidak geser.
  if (loading && !hasLoadedOnceRef.current) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C62828]" />
      </div>
    );
  }

  const visibleReviews = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#2D1818]">Reviews</h1>
        <p className="text-sm text-[#6B5B5B]">
          {hasScrapedData ? 'Data dari scraping' : 'Data demo (belum ada scraping)'}
        </p>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E8E0E0]">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MessageSquareText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E8E8E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search reviews by user or content..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E0E0] text-sm text-[#2D1818] placeholder:text-[#9E8E8E] focus:outline-none focus:ring-2 focus:ring-[#C62828]/30 focus:border-[#C62828] transition-all"
            />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#C62828] hover:bg-[#FFF8F7] rounded-lg transition-colors font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Rating Filter */}
        <div className="mt-4 pt-4 border-t border-[#F0E8E8]">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-[#6B5B5B]" />
            <span className="text-xs uppercase tracking-wider text-[#6B5B5B] font-semibold">Rating</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map(ro => (
              <button
                key={ro.id}
                onClick={() => toggleRating(ro.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRatings.includes(ro.id)
                    ? 'text-white shadow-sm'
                    : 'bg-[#FAFAFA] text-[#6B5B5B] hover:bg-[#F0E8E8] border border-[#E8E0E0]'
                }`}
                style={selectedRatings.includes(ro.id) ? { backgroundColor: ro.color } : {}}
              >
                <Star className="w-3 h-3" fill={selectedRatings.includes(ro.id) ? 'white' : 'none'} />
                {ro.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Filter — sekarang aktif, diklasifikasi dari kata kunci di teks
            review (sama seperti Topic Sentiment Breakdown di Overview) */}
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-[#6B5B5B]" />
            <span className="text-xs uppercase tracking-wider text-[#6B5B5B] font-semibold">Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topicOptions.map(to => {
              const Icon = to.icon;
              const isSelected = selectedTopics.includes(to.id);
              return (
                <button
                  key={to.id}
                  onClick={() => toggleTopic(to.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-[#C62828] text-white shadow-sm'
                      : 'bg-[#FAFAFA] text-[#6B5B5B] hover:bg-[#F0E8E8] border border-[#E8E0E0]'
                  }`}>
                  <Icon className="w-3 h-3" />
                  {to.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sentiment Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E8E0E0] w-fit">
        {(['all', 'positive', 'neutral', 'negative'] as SentimentFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setSentimentFilter(f)}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs font-medium transition-all ${
              sentimentFilter === f
                ? 'bg-[#C62828] text-white shadow-sm'
                : 'text-[#6B5B5B] hover:text-[#2D1818] hover:bg-[#FAFAFA]'
            }`}
          >
            <span className="capitalize">{f}</span>
            <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center ${
              sentimentFilter === f ? 'bg-white/20 text-white' : 'bg-[#F0E8E8] text-[#6B5B5B]'
            }`}>
              {sentimentCounts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-sm text-[#6B5B5B]">
        Showing <span className="font-semibold text-[#2D1818]">{visibleReviews.length}</span> of {filtered.length} reviews
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {visibleReviews.map((review, index) => {
          const config = sentimentConfig[review.sentiment];
          const reviewTopics = classifyReviewTopics(review);
          return (
            <div
              key={review.id}
              className={`bg-white rounded-2xl p-5 border border-[#E8E0E0] hover:shadow-lg hover:border-[#C62828]/20 transition-all duration-300 ${
                visibleCards.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C62828] to-[#FF6F00] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {review.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#2D1818]">{review.user}</span>
                      <StarRating rating={review.rating} />
                      {review.source === 'scraped' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#E8F5E9] text-[#43A047] rounded-full font-medium">
                          Scraped
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#9E8E8E]">
                      {formatDistanceToNow(new Date(review.timestamp), { addSuffix: true })}
                    </span>
                  </div>

                  {review.app_name && (
                    <p className="text-[11px] text-[#C62828] font-medium mt-1">{review.app_name}</p>
                  )}

                  <p className="text-sm text-[#6B5B5B] mt-2 leading-relaxed">{review.text}</p>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {reviewTopics.map(topic => (
                      <span key={topic} className="text-[11px] px-2.5 py-1 rounded-full bg-[#F0E8E8] text-[#6B5B5B] font-medium">
                        {topic}
                      </span>
                    ))}
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                      style={{ backgroundColor: config.bg, color: config.text }}
                    >
                      {config.label}
                    </span>
                    {review.version && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                        v{review.version}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Tombol Tampilkan Selanjutnya (load more) */}
        {visibleCount < filtered.length && (
          <div className="flex justify-center pt-2">
            <button
              onClick={handleLoadMore}
              className="px-6 py-2.5 rounded-xl bg-white border border-[#E8E0E0] text-sm font-medium text-[#C62828] hover:bg-[#FFF8F7] hover:border-[#C62828]/40 hover:shadow-sm transition-all"
            >
              Tampilkan Selanjutnya ({Math.min(PAGE_SIZE, filtered.length - visibleCount)} lagi)
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MessageSquareText className="w-12 h-12 text-[#E8E0E0] mx-auto mb-3" />
            <p className="text-sm text-[#9E8E8E]">Tidak ada review yang cocok dengan filter</p>
          </div>
        )}
      </div>
    </div>
  );
}