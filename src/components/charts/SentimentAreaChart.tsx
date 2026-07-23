import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { SentimentOverTimePoint } from '@/api/types';

interface Props {
  data: SentimentOverTimePoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="bg-white rounded-xl shadow-xl border border-[#E8E0E0] p-3 min-w-[180px]">
      <div className="text-xs text-[#6B5B5B] mb-2 font-medium">
        {format(parseISO(label || ''), 'MMM dd, yyyy')}
      </div>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-[#2D1818] capitalize">{item.dataKey}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#2D1818]">{item.value}</span>
            <span className="text-[10px] text-[#6B5B5B]">
              {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </div>
      ))}
      <div className="mt-1.5 pt-1.5 border-t border-[#E8E0E0] text-xs font-medium text-[#2D1818]">
        Total: {total}
      </div>
    </div>
  );
}

export default function SentimentAreaChart({ data }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const legendItems = [
    { key: 'positive', label: 'Positive', color: '#43A047' },
    { key: 'neutral', label: 'Neutral', color: '#FB8C00' },
    { key: 'negative', label: 'Negative', color: '#E53935' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2D1818]">Sentiment Distribution</h3>
        <p className="text-xs text-[#6B5B5B] mt-0.5">Positive, neutral, and negative over time</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#43A047" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#43A047" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="neutralGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB8C00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FB8C00" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E53935" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#E53935" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0E8E8" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
              tick={{ fontSize: 11, fill: '#6B5B5B' }}
              axisLine={{ stroke: '#E8E0E0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B5B5B' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="positive"
              stackId="sentiment"
              stroke="#43A047"
              strokeWidth={2}
              fill="url(#positiveGrad)"
              fillOpacity={hoveredKey && hoveredKey !== 'positive' ? 0.3 : 1}
              onMouseEnter={() => setHoveredKey('positive')}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ cursor: 'pointer', transition: 'fill-opacity 200ms' }}
            />
            <Area
              type="monotone"
              dataKey="neutral"
              stackId="sentiment"
              stroke="#FB8C00"
              strokeWidth={2}
              fill="url(#neutralGrad)"
              fillOpacity={hoveredKey && hoveredKey !== 'neutral' ? 0.3 : 1}
              onMouseEnter={() => setHoveredKey('neutral')}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ cursor: 'pointer', transition: 'fill-opacity 200ms' }}
            />
            <Area
              type="monotone"
              dataKey="negative"
              stackId="sentiment"
              stroke="#E53935"
              strokeWidth={2}
              fill="url(#negativeGrad)"
              fillOpacity={hoveredKey && hoveredKey !== 'negative' ? 0.3 : 1}
              onMouseEnter={() => setHoveredKey('negative')}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ cursor: 'pointer', transition: 'fill-opacity 200ms' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* Custom Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        {legendItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setHoveredKey(item.key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-[#6B5B5B] capitalize font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
