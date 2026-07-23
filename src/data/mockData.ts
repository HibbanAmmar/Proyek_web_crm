import type {
  DashboardSummary,
  RatingTrendPoint,
  SentimentOverTimePoint,
  UserSegment,
  TopicBreakdown,
  ForecastPoint,
  PredictionMetric,
  KeyEvent,
  Alert,
  Review,
} from '@/api/types';

export const mockDashboardSummary: DashboardSummary = {
  avgRating: 4.6,
  avgRatingDelta: 0.2,
  totalReviews: 12400,
  totalReviewsDelta: 8.5,
  sentimentScore: 0.72,
  sentimentScoreDelta: 0.05,
  activeReviewers: 3200,
  activeReviewersDelta: -2.1,
};

export const mockRatingTrend: RatingTrendPoint[] = [
  { date: '2026-06-01', rating: 4.2 },
  { date: '2026-06-03', rating: 4.1 },
  { date: '2026-06-05', rating: 4.3 },
  { date: '2026-06-07', rating: 4.4, version: 'v2.1.0' },
  { date: '2026-06-09', rating: 4.5 },
  { date: '2026-06-11', rating: 4.4 },
  { date: '2026-06-13', rating: 4.3 },
  { date: '2026-06-15', rating: 4.2 },
  { date: '2026-06-17', rating: 4.4, version: 'v2.1.1' },
  { date: '2026-06-19', rating: 4.5 },
  { date: '2026-06-21', rating: 4.6 },
  { date: '2026-06-23', rating: 4.5 },
  { date: '2026-06-25', rating: 4.7 },
  { date: '2026-06-27', rating: 4.6 },
  { date: '2026-06-29', rating: 4.8 },
  { date: '2026-07-01', rating: 4.7 },
  { date: '2026-07-03', rating: 4.6 },
  { date: '2026-07-05', rating: 4.7 },
  { date: '2026-07-07', rating: 4.8 },
  { date: '2026-07-09', rating: 4.9 },
  { date: '2026-07-11', rating: 4.7 },
  { date: '2026-07-13', rating: 4.6 },
];

export const mockSentimentOverTime: SentimentOverTimePoint[] = [
  { date: '2026-06-01', positive: 180, neutral: 80, negative: 40 },
  { date: '2026-06-05', positive: 190, neutral: 75, negative: 35 },
  { date: '2026-06-10', positive: 170, neutral: 90, negative: 50 },
  { date: '2026-06-15', positive: 160, neutral: 85, negative: 55 },
  { date: '2026-06-20', positive: 200, neutral: 70, negative: 30 },
  { date: '2026-06-25', positive: 220, neutral: 65, negative: 25 },
  { date: '2026-06-30', positive: 210, neutral: 75, negative: 35 },
  { date: '2026-07-05', positive: 230, neutral: 60, negative: 20 },
  { date: '2026-07-10', positive: 250, neutral: 55, negative: 15 },
  { date: '2026-07-13', positive: 240, neutral: 70, negative: 30 },
];

export const mockUserSegments: UserSegment[] = [
  { id: 'high-value', name: 'High-Value Vocal', emoji: '\uD83D\uDC0B', color: '#00897B', percentage: 28, userCount: 3472, avgRating: 4.8, sentiment: 0.85, trend: 'up' },
  { id: 'angry-whale', name: 'Angry Whale', emoji: '\uD83D\uDD25', color: '#E53935', percentage: 15, userCount: 1860, avgRating: 2.1, sentiment: 0.15, trend: 'down' },
  { id: 'silent-f2p', name: 'Silent F2P', emoji: '\uD83D\uDE34', color: '#9E9E9E', percentage: 22, userCount: 2728, avgRating: 3.5, sentiment: 0.45, trend: 'stable' },
  { id: 'influencer', name: 'Influencer Potential', emoji: '\uD83D\uDCE2', color: '#7E57C2', percentage: 18, userCount: 2232, avgRating: 4.2, sentiment: 0.72, trend: 'up' },
  { id: 'at-risk', name: 'At-Risk User', emoji: '\u26A0\uFE0F', color: '#FF6F00', percentage: 17, userCount: 2108, avgRating: 2.8, sentiment: 0.30, trend: 'down' },
];

export const mockTopicBreakdown: TopicBreakdown[] = [
  { topic: 'Gameplay', icon: 'gamepad-2', positive: 320, neutral: 120, negative: 60, total: 500 },
  { topic: 'UI/UX', icon: 'layout', positive: 280, neutral: 100, negative: 45, total: 425 },
  { topic: 'Bugs', icon: 'bug', positive: 80, neutral: 60, negative: 260, total: 400 },
  { topic: 'Performance', icon: 'zap', positive: 200, neutral: 90, negative: 110, total: 400 },
  { topic: 'Monetization', icon: 'credit-card', positive: 120, neutral: 80, negative: 150, total: 350 },
  { topic: 'Support', icon: 'headphones', positive: 180, neutral: 70, negative: 50, total: 300 },
];

export const mockForecast: ForecastPoint[] = [
  // Historical
  { date: '2026-06-15', rating: 4.2 },
  { date: '2026-06-20', rating: 4.5 },
  { date: '2026-06-25', rating: 4.7 },
  { date: '2026-06-30', rating: 4.6 },
  { date: '2026-07-05', rating: 4.8 },
  { date: '2026-07-10', rating: 4.7 },
  { date: '2026-07-13', rating: 4.6 },
  // Predicted
  { date: '2026-07-20', predicted: 4.7, lowerBound: 4.4, upperBound: 5.0 },
  { date: '2026-07-27', predicted: 4.8, lowerBound: 4.4, upperBound: 5.0 },
  { date: '2026-08-03', predicted: 4.9, lowerBound: 4.5, upperBound: 5.0 },
  { date: '2026-08-10', predicted: 4.8, lowerBound: 4.3, upperBound: 5.0 },
  { date: '2026-08-17', predicted: 4.7, lowerBound: 4.2, upperBound: 5.0 },
  { date: '2026-08-24', predicted: 4.9, lowerBound: 4.3, upperBound: 5.0 },
  { date: '2026-08-31', predicted: 5.0, lowerBound: 4.4, upperBound: 5.0 },
  { date: '2026-09-07', predicted: 4.9, lowerBound: 4.3, upperBound: 5.0 },
  { date: '2026-09-14', predicted: 4.8, lowerBound: 4.1, upperBound: 5.0 },
  { date: '2026-09-21', predicted: 4.9, lowerBound: 4.2, upperBound: 5.0 },
  { date: '2026-09-30', predicted: 5.0, lowerBound: 4.3, upperBound: 5.0 },
];

export const mockPredictionMetrics: PredictionMetric[] = [
  { timeframe: '30 Days', predictedRating: 4.8, confidence: 92, riskPercent: 8 },
  { timeframe: '60 Days', predictedRating: 4.9, confidence: 85, riskPercent: 15 },
  { timeframe: '90 Days', predictedRating: 5.0, confidence: 78, riskPercent: 22 },
];

export const mockKeyEvents: KeyEvent[] = [
  { date: '2026-07-28', title: 'v2.2.0 Release', description: 'Major feature update with new game mode', impact: 'positive' },
  { date: '2026-08-15', title: 'Summer Event', description: 'Limited-time summer event launch', impact: 'positive' },
  { date: '2026-09-01', title: 'Bug Fix Patch', description: 'Critical bug fixes for reported issues', impact: 'neutral' },
];

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Rating Drop Alert',
    description: 'Rating dropped 0.6★ in 24h. Investigate Bug reports spike.',
    timestamp: '2026-07-13T10:00:00Z',
    dismissible: true,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Sentiment Spike',
    description: 'Sentiment spike on "Monetization" topic detected.',
    timestamp: '2026-07-13T07:00:00Z',
    dismissible: true,
  },
  {
    id: '3',
    type: 'info',
    title: 'Segment Growth',
    description: 'At-Risk User segment grew 12% this week.',
    timestamp: '2026-07-12T14:00:00Z',
    dismissible: true,
  },
];

export const mockRecentReviews: Review[] = [
  {
    id: '1',
    user: 'Alex Chen',
    avatar: 'AC',
    rating: 5,
    text: 'Amazing update! The new features are incredible and performance is much better.',
    topics: ['Gameplay', 'Performance'],
    sentiment: 'positive',
    timestamp: '2026-07-13T11:30:00Z',
  },
  {
    id: '2',
    user: 'Sarah Kim',
    avatar: 'SK',
    rating: 2,
    text: 'Too many bugs after the latest update. Crashes constantly on my device.',
    topics: ['Bugs', 'UI/UX'],
    sentiment: 'negative',
    timestamp: '2026-07-13T10:15:00Z',
  },
  {
    id: '3',
    user: 'Mike Johnson',
    avatar: 'MJ',
    rating: 4,
    text: 'Good game overall but the monetization feels a bit aggressive.',
    topics: ['Monetization', 'Gameplay'],
    sentiment: 'neutral',
    timestamp: '2026-07-13T09:45:00Z',
  },
  {
    id: '4',
    user: 'Emma Wilson',
    avatar: 'EW',
    rating: 5,
    text: 'Best mobile game I have played this year! Highly recommended.',
    topics: ['Gameplay'],
    sentiment: 'positive',
    timestamp: '2026-07-13T08:20:00Z',
  },
  {
    id: '5',
    user: 'David Lee',
    avatar: 'DL',
    rating: 1,
    text: 'Cannot even login after the update. Terrible experience.',
    topics: ['Bugs', 'Support'],
    sentiment: 'negative',
    timestamp: '2026-07-13T07:00:00Z',
  },
];
