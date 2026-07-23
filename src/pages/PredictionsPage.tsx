import { useState, useEffect, useCallback } from 'react';
import ForecastChart from '@/components/charts/ForecastChart';
import PredictionMetrics from '@/components/PredictionMetrics';
import { getForecast, getPredictionMetrics, getKeyEvents } from '@/api';
import type { ForecastPoint, PredictionMetric, KeyEvent } from '@/api/types';

export default function PredictionsPage() {
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [predictions, setPredictions] = useState<PredictionMetric[]>([]);
  const [keyEvents, setKeyEvents] = useState<KeyEvent[]>([]);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    const [forecastData, predictionData, eventsData] = await Promise.all([
      getForecast(),
      getPredictionMetrics(),
      getKeyEvents(),
    ]);
    setForecast(forecastData);
    setPredictions(predictionData);
    setKeyEvents(eventsData);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Data sekarang dihitung dari review app yang lagi aktif, jadi begitu user
  // ganti app di sidebar, halaman ini harus reload juga (sama seperti Overview).
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('reviewpulse:app-changed', handler);
    return () => window.removeEventListener('reviewpulse:app-changed', handler);
  }, [loadData]);

  useEffect(() => {
    if (!forecast.length) return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => setVisibleCards(prev => new Set([...prev, i])), i * 80);
    }
  }, [forecast]);

  const gc = (i: number) => visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3';

  if (!forecast.length) return <div className="flex items-center justify-center h-64 text-[#6B5B5B]">Loading...</div>;

  return (
    <div className="space-y-5 pb-6">
      <div className={`transition-all duration-400 ${gc(0)}`}>
        <ForecastChart data={forecast} events={keyEvents} />
      </div>
      <div className={`transition-all duration-400 ${gc(1)}`}>
        <PredictionMetrics metrics={predictions} events={keyEvents} />
      </div>

      {/* Prediction Summary Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-400 ${gc(2)}`}>
        {predictions.map((p) => (
          <div key={p.timeframe} className="bg-white rounded-2xl p-5 border border-[#E8E0E0] hover:-translate-y-0.5 hover:shadow-lg transition-all">
            <div className="text-xs uppercase tracking-wider text-[#6B5B5B] font-semibold mb-3">{p.timeframe} Forecast</div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-[#2D1818]">{p.predictedRating}★</span>
              <span className="text-sm text-[#6B5B5B] mb-1">predicted</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-2 bg-[#F0E8E8] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#43A047]" style={{ width: `${p.confidence}%` }} />
              </div>
              <span className="text-xs text-[#6B5B5B] font-medium">{p.confidence}% confidence</span>
            </div>
            <div
              className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold"
              style={{
                backgroundColor: p.riskPercent <= 10 ? '#E8F5E9' : p.riskPercent <= 20 ? '#FFF3E0' : '#FDECEA',
                color: p.riskPercent <= 10 ? '#43A047' : p.riskPercent <= 20 ? '#FB8C00' : '#E53935',
              }}
            >
              {p.riskPercent}% risk
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}