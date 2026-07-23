import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { ForecastPoint, KeyEvent } from '@/api/types';

interface Props {
  data: ForecastPoint[];
  events?: KeyEvent[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: ForecastPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  const isPredicted = data.predicted != null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-[#E8E0E0] p-3 min-w-[180px]">
      <div className="text-xs text-[#6B5B5B] mb-1.5 font-medium">
        {format(parseISO(data.date), 'MMM dd, yyyy')}
      </div>
      {data.rating != null && (
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#C62828]" />
          <span className="text-xs text-[#2D1818]">Actual: <span className="font-semibold">{data.rating}★</span></span>
        </div>
      )}
      {isPredicted && (
        <>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#FF6F00]" />
            <span className="text-xs text-[#2D1818]">Predicted: <span className="font-semibold">{data.predicted}★</span></span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-[#E8E0E0] text-[10px] text-[#6B5B5B]">
            Confidence: {data.lowerBound}★ - {data.upperBound}★
          </div>
        </>
      )}
    </div>
  );
}

// Warna dot per impact — dipakai konsisten sama impactConfig di PredictionMetrics.tsx
const IMPACT_COLOR: Record<KeyEvent['impact'], string> = {
  positive: '#43A047',
  negative: '#E53935',
  neutral: '#1E88E5',
};

export default function ForecastChart({ data, events = [] }: Props) {
  const upperData = data
    .filter((d) => d.upperBound != null)
    .map((d) => ({ date: d.date, value: d.upperBound }));

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2D1818]">30-90 Day Rating Forecast</h3>
        <p className="text-xs text-[#6B5B5B] mt-0.5">Predicted rating with confidence interval</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6F00" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#FF6F00" stopOpacity={0.02} />
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
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: '#6B5B5B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}★`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C62828', strokeWidth: 1, strokeDasharray: '4 4' }} />

            {/* Confidence Interval */}
            <Area
              data={upperData}
              dataKey="value"
              stroke="none"
              fill="url(#confidenceGrad)"
              connectNulls
            />

            {/* Historical Line */}
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#C62828"
              strokeWidth={3}
              dot={{ r: 4, fill: '#C62828', stroke: 'white', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#C62828', stroke: 'white', strokeWidth: 3 }}
              connectNulls
            />

            {/* Predicted Line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#FF6F00"
              strokeWidth={3}
              strokeDasharray="8 4"
              dot={{ r: 4, fill: '#FF6F00', stroke: 'white', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#FF6F00', stroke: 'white', strokeWidth: 3 }}
              connectNulls
            />

            {/* Key Events — dideteksi otomatis dari lonjakan rating harian
                (lihat computeKeyEvents di reviewAnalytics.ts), bukan hardcoded
                lagi. Posisi Y diambil dari titik data (rating/predicted) yang
                tanggalnya cocok sama event-nya. */}
            {events.map((event, i) => {
              const point = data.find((d) => d.date === event.date);
              const y = point?.rating ?? point?.predicted;
              if (y == null) return null;
              const color = IMPACT_COLOR[event.impact];
              return (
                <ReferenceDot
                  key={`${event.date}-${i}`}
                  x={event.date}
                  y={y}
                  r={6}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  label={{ value: event.title, position: 'top', fill: color, fontSize: 10, fontWeight: 600 }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[#C62828] rounded" />
          <span className="text-xs text-[#6B5B5B] font-medium">Historical</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-[#FF6F00] rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FF6F00 0, #FF6F00 4px, transparent 4px, transparent 8px)' }} />
          <span className="text-xs text-[#6B5B5B] font-medium">Predicted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 bg-[#FF6F00] rounded opacity-20" />
          <span className="text-xs text-[#6B5B5B] font-medium">Confidence</span>
        </div>
      </div>
    </div>
  );
}