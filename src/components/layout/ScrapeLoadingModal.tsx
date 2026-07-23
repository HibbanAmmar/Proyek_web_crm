import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { scrapeReviews, type ScrapeRequest, type ReviewItem } from '../../api/scrapeApi';

interface ScrapeLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  scrapeConfig: ScrapeRequest | null;
  onScrapeComplete: (reviews: ReviewItem[]) => void;
}

type ScrapeStatus = 'idle' | 'scraping' | 'success' | 'error';

export default function ScrapeLoadingModal({
  isOpen,
  onClose,
  scrapeConfig,
  onScrapeComplete,
}: ScrapeLoadingModalProps) {
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && scrapeConfig) {
      startScraping();
    }
  }, [isOpen, scrapeConfig]);

  const startScraping = async () => {
    if (!scrapeConfig) return;
    
    setStatus('scraping');
    setProgress(10);
    setMessage('Menghubungkan ke Apple App Store...');

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 85));
      }, 1500);

      const result = await scrapeReviews(scrapeConfig);
      clearInterval(progressInterval);

      setProgress(100);
      setReviews(result.reviews);
      setMessage(`Berhasil! ${result.total_reviews} review ditemukan`);
      setStatus('success');
      onScrapeComplete(result.reviews);
    } catch (error) {
      setStatus('error');
      setErrorMsg(error instanceof Error ? error.message : 'Terjadi kesalahan');
    }
  };

  const handleDownload = () => {
    const csv = convertToCSV(reviews);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reviews_${scrapeConfig?.app_name || 'app'}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={status !== 'scraping' ? onClose : undefined} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#2D1818]">
            {status === 'scraping' && 'Scraping Review...'}
            {status === 'success' && 'Scraping Selesai!'}
            {status === 'error' && 'Scraping Gagal'}
          </h2>
          {status !== 'scraping' && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-[#6B5B5B]" />
            </button>
          )}
        </div>

        <div className="text-center py-4">
          {status === 'scraping' && (
            <>
              <div className="relative w-20 h-20 mx-auto mb-4">
                <Loader2 className="w-20 h-20 text-[#C62828] animate-spin" />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#C62828]">
                  {progress}%
                </span>
              </div>
              <p className="text-sm text-[#6B5B5B]">{message}</p>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#C62828] transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-[#9E8E8E] mt-3">
                App: <b>{scrapeConfig?.app_name}</b> | Halaman: {scrapeConfig?.pages}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-[#2D1818]">{message}</p>
              <p className="text-sm text-[#6B5B5B] mt-1">
                {reviews.length} review siap dianalisis
              </p>
              <div className="flex gap-2 justify-center mt-6">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C62828] text-white rounded-lg text-sm font-medium hover:bg-[#8E0000] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-[#E8E0E0] text-[#6B5B5B] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-[#C62828] mx-auto mb-4" />
              <p className="text-sm text-[#6B5B5B]">{errorMsg}</p>
              <button
                onClick={startScraping}
                className="mt-4 px-4 py-2 bg-[#C62828] text-white rounded-lg text-sm font-medium hover:bg-[#8E0000] transition-colors"
              >
                Coba Lagi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function convertToCSV(reviews: ReviewItem[]): string {
  if (reviews.length === 0) return '';
  
  const headers = ['Author', 'Rating', 'Title', 'Text', 'Date', 'Version', 'Helpful Votes'];
  const rows = reviews.map((r) => [
    `"${r.author.replace(/"/g, '""')}"`,
    r.rating,
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.text.replace(/"/g, '""')}"`,
    r.date,
    r.version,
    r.helpful_votes,
  ]);
  
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}