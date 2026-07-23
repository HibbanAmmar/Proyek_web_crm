// API Types for ReviewPulse Dashboard
// All fields are optional (?) to support partial API responses

export interface RatingTrendPoint {
  date: string;
  rating: number;
  version?: string;
}

export interface SentimentOverTimePoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface UserSegment {
  id: string;
  name: string;
  emoji: string;
  color: string;
  percentage: number;
  userCount: number;
  avgRating: number;
  sentiment: number;
  trend: 'up' | 'down' | 'stable';
  // BARU: breakdown sentiment TEKS (dari kata kunci, lihat textSentimentOf di
  // reviewAnalytics.ts) di dalam segmen ini — dipakai buat stacked bar chart
  // di SegmentDonutChart (mode Bar), gayanya sama kayak Topic Sentiment
  // Breakdown. textPositive + textNeutral + textNegative = userCount.
  textPositive: number;
  textNeutral: number;
  textNegative: number;
}

export interface TopicBreakdown {
  topic: string;
  icon: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface ForecastPoint {
  date: string;
  rating?: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface PredictionMetric {
  timeframe: string;
  predictedRating: number;
  confidence: number;
  riskPercent: number;
}

export interface KeyEvent {
  date: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  dismissible: boolean;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  text: string;
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

export interface DashboardSummary {
  avgRating: number;
  avgRatingDelta: number;
  totalReviews: number;
  totalReviewsDelta: number;
  sentimentScore: number;
  sentimentScoreDelta: number;
  activeReviewers: number;
  activeReviewersDelta: number;
}