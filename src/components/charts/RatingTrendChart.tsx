import { useState } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Line,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { RatingTrendPoint } from '@/api/types';

interface Props {
  data: RatingTrendPoint[];
}

interface TooltipPayloadItem {
  value: number;
  payload: RatingTrendPoint;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-[#E8E0E0] p-3 min-w-[160px]">
      <div className="text-xs text-[#6B5B5B] mb-1">
        {format(parseISO(data.date), 'MMM dd, yyyy')}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#C62828]" />
        <span className="text-sm font-medium text-[#2D1818]">Rating: {data.rating}★</span>
      </div>
      {data.version && (
        <div className="mt-1.5 pt-1.5 border-t border-[#E8E0E0] text-xs font-medium text-[#FF6F00]">
          Version: {data.version}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, index, hoveredIndex } = props;
  if (cx == null || cy == null) return null;
  const isHovered = hoveredIndex === index;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isHovered ? 7 : 4}
      fill="#C62828"
      stroke="white"
      strokeWidth={2}
      style={{ transition: 'r 150ms ease' }}
    />
  );
}

export default function RatingTrendChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const versions = data.filter((d) => d.version);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#2D1818]">Rating Trend</h3>
        <p className="text-xs text-[#6B5B5B] mt-0.5">Last 30 days with version updates</p>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            onMouseMove={(state) => {
              if (state?.activeTooltipIndex != null) {
                setHoveredIndex(state.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C62828" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#C62828" stopOpacity={0} />
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
              tick={{ fontSize: 11, fill: '#6B5B5B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}★`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#C62828', strokeWidth: 1, strokeDasharray: '4 4' }} />
            {versions.map((v, i) => (
              <ReferenceLine
                key={i}
                x={v.date}
                stroke="#FF6F00"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: v.version || '',
                  position: 'top',
                  fill: '#FF6F00',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            ))}
            <Area
              type="monotone"
              dataKey="rating"
              fill="url(#ratingGradient)"
              stroke="none"
            />
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#C62828"
              strokeWidth={3}
              dot={<CustomDot hoveredIndex={hoveredIndex} />}
              activeDot={{ r: 8, fill: '#C62828', stroke: 'white', strokeWidth: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
