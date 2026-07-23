import { TrendingUp, Shield, AlertTriangle, Calendar, Rocket, Wrench } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { PredictionMetric, KeyEvent } from '@/api/types';

interface Props {
  metrics: PredictionMetric[];
  events: KeyEvent[];
}

const riskConfig = {
  low: { color: '#43A047', bg: '#E8F5E9', icon: Shield },
  medium: { color: '#FB8C00', bg: '#FFF3E0', icon: AlertTriangle },
  high: { color: '#E53935', bg: '#FDECEA', icon: AlertTriangle },
};

function getRiskLevel(percent: number) {
  if (percent <= 10) return 'low';
  if (percent <= 20) return 'medium';
  return 'high';
}

const impactConfig = {
  positive: { color: '#43A047', icon: Rocket },
  negative: { color: '#E53935', icon: AlertTriangle },
  neutral: { color: '#1E88E5', icon: Wrench },
};

export default function PredictionMetrics({ metrics, events }: Props) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2D1818]">Prediction Metrics</h3>
        <p className="text-xs text-[#6B5B5B] mt-0.5">Forecast confidence and risk analysis</p>
      </div>

      {/* Metrics Table */}
      <div className="overflow-x-auto mb-5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E0E0]">
              <th className="text-left text-[10px] uppercase tracking-wider text-[#6B5B5B] font-semibold pb-2">Timeframe</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-[#6B5B5B] font-semibold pb-2">Predicted</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-[#6B5B5B] font-semibold pb-2">Confidence</th>
              <th className="text-left text-[10px] uppercase tracking-wider text-[#6B5B5B] font-semibold pb-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const risk = getRiskLevel(m.riskPercent);
              const riskCfg = riskConfig[risk];
              const RiskIcon = riskCfg.icon;
              return (
                <tr key={m.timeframe} className="border-b border-[#F0E8E8] last:border-0 hover:bg-[#FFF8F7] transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#6B5B5B]" />
                      <span className="text-sm font-medium text-[#2D1818]">{m.timeframe}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#FF6F00]" />
                      <span className="text-sm font-semibold text-[#2D1818]">{m.predictedRating}★</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#F0E8E8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#43A047] transition-all duration-500"
                          style={{ width: `${m.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#6B5B5B] font-medium">{m.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: riskCfg.bg, color: riskCfg.color }}
                    >
                      <RiskIcon className="w-3 h-3" />
                      {m.riskPercent}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Key Events Timeline */}
      <div>
        <h4 className="text-xs uppercase tracking-wider text-[#6B5B5B] font-semibold mb-3">Key Events</h4>
        {events.length === 0 ? (
          <p className="text-xs text-[#9E8E8E] py-2">
            Belum ada lonjakan rating signifikan terdeteksi dari data yang ada.
          </p>
        ) : (
          <div className="relative pl-4">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-[#E8E0E0]" />

            {events.map((event, index) => {
              const impact = impactConfig[event.impact];
              const ImpactIcon = impact.icon;
              return (
                <div key={index} className="relative flex items-start gap-3 mb-4 last:mb-0">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-0 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10"
                    style={{ backgroundColor: impact.color }}
                  >
                    <ImpactIcon className="w-2 h-2 text-white" />
                  </div>
                  <div className="ml-6">
                    {/* event.date dari computeKeyEvents = ISO 'YYYY-MM-DD' mentah,
                        diformat di sini (bukan di data) biar konsisten sama gaya
                        format tanggal di ForecastChart. */}
                    <div className="text-[10px] text-[#9E8E8E] font-medium">
                      {format(parseISO(event.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm font-semibold text-[#2D1818]">{event.title}</div>
                    <div className="text-xs text-[#6B5B5B] mt-0.5">{event.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}