import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Gamepad2,
  Layout,
  Bug,
  Zap,
  CreditCard,
  Headphones,
} from 'lucide-react';
import type { TopicBreakdown } from '@/api/types';

interface Props {
  data: TopicBreakdown[];
}

const topicIcons: Record<string, React.ReactNode> = {
  Gameplay: <Gamepad2 className="w-4 h-4" />,
  'UI/UX': <Layout className="w-4 h-4" />,
  Bugs: <Bug className="w-4 h-4" />,
  Performance: <Zap className="w-4 h-4" />,
  Monetization: <CreditCard className="w-4 h-4" />,
  Support: <Headphones className="w-4 h-4" />,
};

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
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#6B5B5B]">{topicIcons[label || '']}</span>
        <span className="text-xs font-semibold text-[#2D1818]">{label}</span>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomYAxisTick(props: any) {
  const { x, y, payload } = props;
  if (x == null || y == null || !payload) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={-8} y={0} dy={4} textAnchor="end" fill="#6B5B5B" style={{ fontSize: 11, fontWeight: 500 }}>
        {payload.value}
      </text>
    </g>
  );
}

export default function TopicBreakdownChart({ data }: Props) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const legendItems = [
    { key: 'positive', label: 'Positive', color: '#43A047' },
    { key: 'neutral', label: 'Neutral', color: '#FB8C00' },
    { key: 'negative', label: 'Negative', color: '#E53935' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2D1818]">Topic Sentiment Breakdown</h3>
        <p className="text-xs text-[#6B5B5B] mt-0.5">Sentiment distribution by topic</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            onMouseLeave={() => setHoveredBar(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0E8E8" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#6B5B5B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="topic"
              tick={<CustomYAxisTick />}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="positive"
              stackId="topic"
              fill="#43A047"
              radius={[0, 0, 0, 0]}
              onMouseEnter={() => setHoveredBar('positive')}
              opacity={hoveredBar && hoveredBar !== 'positive' ? 0.6 : 1}
              style={{ transition: 'opacity 200ms', cursor: 'pointer' }}
            />
            <Bar
              dataKey="neutral"
              stackId="topic"
              fill="#FB8C00"
              radius={[0, 0, 0, 0]}
              onMouseEnter={() => setHoveredBar('neutral')}
              opacity={hoveredBar && hoveredBar !== 'neutral' ? 0.6 : 1}
              style={{ transition: 'opacity 200ms', cursor: 'pointer' }}
            />
            <Bar
              dataKey="negative"
              stackId="topic"
              fill="#E53935"
              radius={[0, 4, 4, 0]}
              onMouseEnter={() => setHoveredBar('negative')}
              opacity={hoveredBar && hoveredBar !== 'negative' ? 0.6 : 1}
              style={{ transition: 'opacity 200ms', cursor: 'pointer' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Custom Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        {legendItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setHoveredBar(item.key)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-[#6B5B5B] capitalize font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
