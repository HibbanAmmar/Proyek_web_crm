import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Sparkles } from 'lucide-react';
import TopStats from '@/components/TopStats';
import RatingTrendChart from '@/components/charts/RatingTrendChart';
import SentimentAreaChart from '@/components/charts/SentimentAreaChart';
import SegmentDonutChart from '@/components/charts/SegmentDonutChart';
import SegmentDetailTable from '@/components/SegmentDetailTable';
import TopicBreakdownChart from '@/components/charts/TopicBreakdownChart';
import AlertPanel from '@/components/AlertPanel';
import RecentReviewsFeed from '@/components/RecentReviewsFeed';
import { buildAiSummary } from '@/lib/reviewAnalytics';
import { downloadTextFile, reviewsToCsv, dateStamp } from '@/lib/exportUtils';

import {
  getDashboardSummary,
  getRatingTrend,
  getSentimentOverTime,
  getUserSegments,
  getTopicBreakdown,
  getAlerts,
  getRecentReviews,
  getAllReviews,
} from '@/api';

import type {
  DashboardSummary,
  RatingTrendPoint,
  SentimentOverTimePoint,
  UserSegment,
  TopicBreakdown,
  Alert,
  Review,
} from '@/api/types';

export default function OverviewPage() {
  // ASUMSI: project ini pakai react-router-dom (belum dikonfirmasi, belum
  // lihat App.tsx). Kalau ternyata routing-nya beda, tinggal ganti baris
  // `navigate(...)` di bawah dengan cara navigasi yang project ini pakai.
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [ratingTrend, setRatingTrend] = useState<RatingTrendPoint[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentOverTimePoint[]>([]);
  const [segments, setSegments] = useState<UserSegment[]>([]);
  const [topics, setTopics] = useState<TopicBreakdown[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    const [
      summaryData,
      trendData,
      sentiment,
      segmentData,
      topicData,
      alertsData,
      reviewsData,
    ] = await Promise.all([
      getDashboardSummary(),
      getRatingTrend(),
      getSentimentOverTime(),
      getUserSegments(),
      getTopicBreakdown(),
      getAlerts(),
      getRecentReviews(),
    ]);
    setSummary(summaryData);
    setRatingTrend(trendData);
    setSentimentData(sentiment);
    setSegments(segmentData);
    setTopics(topicData);
    setAlerts(alertsData);
    setReviews(reviewsData);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Data sekarang dihitung dari review app yang lagi aktif, jadi begitu
  // user ganti app di sidebar ("SELECTED APP"), dashboard harus reload.
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('reviewpulse:app-changed', handler);
    return () => window.removeEventListener('reviewpulse:app-changed', handler);
  }, [loadData]);

  useEffect(() => {
    if (!summary) return;
    for (let i = 0; i < 10; i++) {
      setTimeout(() => setVisibleCards(prev => new Set([...prev, i])), i * 50);
    }
  }, [summary]);

  useEffect(() => {
    const handler = () => setActiveSegment(null);
    window.addEventListener('clearSegmentFilter', handler);
    return () => window.removeEventListener('clearSegmentFilter', handler);
  }, []);

  const handleDismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Ringkasan otomatis (template, bukan panggil AI beneran) — disusun dari
  // data yang udah dihitung di atas, jadi nggak perlu fetch/compute ulang.
  const aiSummaryLines = useMemo(
    () => (summary ? buildAiSummary({ summary, topics, segments, alerts }) : []),
    [summary, topics, segments, alerts]
  );

  const [exporting, setExporting] = useState<'csv' | 'json' | 'report' | null>(null);

  const handleExportCsv = useCallback(async () => {
    setExporting('csv');
    try {
      const allReviews = await getAllReviews();
      downloadTextFile(reviewsToCsv(allReviews), `reviewpulse-reviews-${dateStamp()}.csv`, 'text/csv;charset=utf-8;');
    } finally {
      setExporting(null);
    }
  }, []);

  const handleExportJson = useCallback(async () => {
    setExporting('json');
    try {
      const allReviews = await getAllReviews();
      downloadTextFile(JSON.stringify(allReviews, null, 2), `reviewpulse-reviews-${dateStamp()}.json`, 'application/json');
    } finally {
      setExporting(null);
    }
  }, []);

  const handleExportFullReport = useCallback(async () => {
    setExporting('report');
    try {
      const allReviews = await getAllReviews();
      const report = {
        generatedAt: new Date().toISOString(),
        aiSummary: aiSummaryLines,
        dashboardSummary: summary,
        ratingTrend,
        sentimentOverTime: sentimentData,
        userSegments: segments,
        topicBreakdown: topics,
        alerts,
        reviews: allReviews,
      };
      downloadTextFile(JSON.stringify(report, null, 2), `reviewpulse-full-report-${dateStamp()}.json`, 'application/json');
    } finally {
      setExporting(null);
    }
  }, [summary, ratingTrend, sentimentData, segments, topics, alerts, aiSummaryLines]);

  const gc = (i: number) => visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3';

  if (!summary) return <div className="flex items-center justify-center h-64 text-[#6B5B5B]">Loading...</div>;

  return (
    <div className="space-y-5 pb-6">
      {/* Top Stats */}
      <div className={`transition-all duration-400 ${gc(0)}`}>
        <TopStats
          avgRating={summary.avgRating}
          avgRatingDelta={summary.avgRatingDelta}
          totalReviews={summary.totalReviews}
          totalReviewsDelta={summary.totalReviewsDelta}
          sentimentScore={summary.sentimentScore}
          sentimentScoreDelta={summary.sentimentScoreDelta}
          activeReviewers={summary.activeReviewers}
          activeReviewersDelta={summary.activeReviewersDelta}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[55%_45%] gap-5">
        <div className={`transition-all duration-400 ${gc(1)}`}>
          <RatingTrendChart data={ratingTrend} />
        </div>
        <div className={`transition-all duration-400 ${gc(2)}`}>
          <SentimentAreaChart data={sentimentData} />
        </div>
      </div>

      {/* Segmentation Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[30%_40%_30%] gap-5">
        <div className={`transition-all duration-400 ${gc(3)}`}>
          <SegmentDonutChart data={segments} onSegmentClick={setActiveSegment} activeSegment={activeSegment} />
        </div>
        <div className={`transition-all duration-400 ${gc(4)}`}>
          <SegmentDetailTable
            data={segments}
            activeSegment={activeSegment}
            onViewSegment={(id) => navigate(`/segments?segment=${encodeURIComponent(id)}`)}
          />
        </div>
        <div className={`transition-all duration-400 ${gc(5)}`}>
          <TopicBreakdownChart data={topics} />
        </div>
      </div>

      {/* Alerts & Reviews Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[40%_60%] gap-5">
        <div className={`transition-all duration-400 ${gc(6)}`}>
          <AlertPanel alerts={alerts} onDismiss={handleDismissAlert} />
        </div>
        <div className={`transition-all duration-400 ${gc(7)}`}>
          <RecentReviewsFeed reviews={reviews} />
        </div>
      </div>

      {/* AI Summary (ringkasan otomatis dari template, bukan panggil LLM beneran) */}
      <div className={`bg-white rounded-2xl p-6 border border-[#E8E0E0] transition-all duration-400 ${gc(8)}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C62828] to-[#FF6F00] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#2D1818]">AI Summary</h3>
            <p className="text-[10px] text-[#9E8E8E]">Ringkasan otomatis dari data saat ini</p>
          </div>
        </div>
        <ul className="space-y-2">
          {aiSummaryLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#6B5B5B] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C62828] mt-1.5 flex-shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Export Section */}
      <div className={`bg-white rounded-2xl p-6 border border-[#E8E0E0] transition-all duration-400 ${gc(9)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#2D1818]">Export Data</h3>
            <p className="text-xs text-[#6B5B5B] mt-0.5">Download analytics data in various formats</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCsv}
              disabled={exporting !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8E0E0] text-sm text-[#6B5B5B] hover:bg-[#FAFAFA] hover:border-[#C62828]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting === 'csv' ? 'Exporting...' : 'Export as CSV'}
            </button>
            <button
              onClick={handleExportJson}
              disabled={exporting !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8E0E0] text-sm text-[#6B5B5B] hover:bg-[#FAFAFA] hover:border-[#C62828]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting === 'json' ? 'Exporting...' : 'Export as JSON'}
            </button>
            <button
              onClick={handleExportFullReport}
              disabled={exporting !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#C62828] text-white text-sm font-medium hover:bg-[#8E0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {exporting === 'report' ? 'Exporting...' : 'Export Full Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}