import { useState } from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useReviews, type Review } from '@/hooks/useReviews';

type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';

const sentimentConfig = {
  positive: { bg: '#E8F5E9', text: '#43A047', label: 'Positive' },
  neutral: { bg: '#FFF3E0', text: '#FB8C00', label: 'Neutral' },
  negative: { bg: '#FDECEA', text: '#E53935', label: 'Negative' },
};

function StarRating({ value }: { value: number }) {
  const stars = Array.from({ length: 5 }).map((_, i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i < value ? 'text-yellow-400' : 'text-gray-300'}`} />
  ));
  return <div className="flex items-center gap-1">{stars}</div>;
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="p-3 rounded-lg bg-white/50 border border-[#F0E8E8]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-md bg-[#F8F8F8] flex items-center justify-center text-sm font-bold">{review.user?.charAt(0).toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium truncate">{review.user}</div>
            <div className="text-xs text-[#6B5B5B]">{formatDistanceToNow(new Date(review.timestamp), { addSuffix: true })}</div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <StarRating value={review.rating} />
            <a className="text-xs text-[#C62828] flex items-center gap-1" href="#" onClick={(e) => e.preventDefault()}>
              <ExternalLink className="w-3.5 h-3.5" />
              Source
            </a>
          </div>
          <p className="mt-2 text-sm text-[#2D1818] truncate">{review.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function RecentReviewsFeed() {
  const { reviews, loading } = useReviews();
  const [filter, setFilter] = useState<SentimentFilter>('all');

  const filtered = filter === 'all'
    ? reviews
    : reviews.filter((r) => r.sentiment === filter);

  const counts = {
    all: reviews.length,
    positive: reviews.filter((r) => r.sentiment === 'positive').length,
    neutral: reviews.filter((r) => r.sentiment === 'neutral').length,
    negative: reviews.filter((r) => r.sentiment === 'negative').length,
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold">Recent Reviews</div>
          <div className="text-xs text-[#6B5B5B]">Latest feedback from users</div>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'positive', 'neutral', 'negative'] as SentimentFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${filter === s ? 'bg-[#FCECEC] text-[#C62828]' : 'bg-white/10 text-[#6B5B5B]'}`}
            >
              {s === 'all' ? `All (${counts.all})` : `${sentimentConfig[s].label} (${counts[s] as number})`}
            </button>
          ))}
        </div>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#C62828] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
        <div className="space-y-2">
          {filtered.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </div>
  );
}
