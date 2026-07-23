import { useState, useCallback } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Sector,
  BarChart, Bar, XAxis, YAxis, LabelList, CartesianGrid,
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import type { UserSegment } from '@/api/types';

interface Props {
  data: UserSegment[];
  onSegmentClick?: (segmentId: string | null) => void;
  activeSegment: string | null;
}

type ViewMode = 'donut' | 'bar';

interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: UserSegment;
  percent: number;
}

const renderActiveShape = (props: ActiveShapeProps) => {
  const RADIAN = Math.PI / 180;
  const {
    cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent,
  } = props;

  // Titik tengah PITA warna yang lagi di-highlight (bukan di luar cincin),
  // supaya label muncul PENUH di atas warnanya, bukan nongol setengah-setengah.
  const labelRadius = (innerRadius + outerRadius + 8) / 2;
  const lx = cx + labelRadius * Math.cos(-RADIAN * midAngle);
  const ly = cy + labelRadius * Math.sin(-RADIAN * midAngle);

  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#2D1818" style={{ fontSize: 22, fontWeight: 700 }}>
        {payload.userCount >= 1000 ? (payload.userCount / 1000).toFixed(1) + 'K' : payload.userCount}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6B5B5B" style={{ fontSize: 11 }}>
        Total Users
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'all 200ms' }}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
      <text
        x={lx}
        y={ly - 6}
        textAnchor="middle"
        fill="#fff"
        style={{ fontSize: 11, fontWeight: 700, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
      >
        {`${payload.emoji} ${payload.name}`}
      </text>
      <text
        x={lx}
        y={ly + 10}
        textAnchor="middle"
        fill="#fff"
        style={{ fontSize: 11, fontWeight: 600, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.35))' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

function DonutView({ data, onSegmentClick, activeSegment }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    if (!activeSegment) {
      setActiveIndex(undefined);
    }
  }, [activeSegment]);

  const onPieClick = useCallback((_: unknown, index: number) => {
    const segment = data[index];
    onSegmentClick?.(activeSegment === segment.id ? null : segment.id);
  }, [data, onSegmentClick, activeSegment]);

  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex !== undefined ? activeIndex : activeSegment ? data.findIndex(s => s.id === activeSegment) : undefined}
            activeShape={(props: unknown) => renderActiveShape(props as ActiveShapeProps)}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={3}
            dataKey="percentage"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            onClick={onPieClick}
            style={{ cursor: 'pointer' }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                style={{
                  opacity: activeSegment && activeSegment !== entry.id ? 0.4 : 1,
                  transition: 'opacity 200ms',
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarView({ data, onSegmentClick, activeSegment }: Props) {
  // Diurutkan dari terbanyak ke tersedikit (jumlah user), sama gayanya kayak
  // Topic Sentiment Breakdown.
  const sorted = [...data].sort((a, b) => b.userCount - a.userCount);
  const maxCount = Math.max(...sorted.map(s => s.userCount), 1);

  const barOpacity = (entry: UserSegment) => (
    activeSegment && activeSegment !== entry.id ? 0.35 : 1
  );

  const handleBarClick = (index: number) => {
    const seg = sorted[index];
    if (seg) onSegmentClick?.(activeSegment === seg.id ? null : seg.id);
  };

  return (
    <div className="h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#F0E8E8" />
          <XAxis
            type="number"
            domain={[0, maxCount]}
            tick={{ fontSize: 10, fill: '#9E8E8E' }}
            axisLine={{ stroke: '#E8E0E0' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={124}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#6B5B5B' }}
            tickFormatter={(name: string, index: number) => `${sorted[index]?.emoji ?? ''} ${name}`}
          />
          {/* 3 Bar bertumpuk (stackId sama) — persis gaya Topic Sentiment
              Breakdown: hijau=positif, oranye=netral, merah=negatif, berdasarkan
              KATA di teks review masing-masing anggota segmen. */}
          <Bar dataKey="textPositive" stackId="sentiment" fill="#43A047" barSize={16} onClick={(_, i) => handleBarClick(i)} style={{ cursor: 'pointer' }}>
            {sorted.map((entry, index) => (
              <Cell key={`pos-${index}`} style={{ opacity: barOpacity(entry), transition: 'opacity 200ms' }} />
            ))}
          </Bar>
          <Bar dataKey="textNeutral" stackId="sentiment" fill="#FB8C00" barSize={16} onClick={(_, i) => handleBarClick(i)} style={{ cursor: 'pointer' }}>
            {sorted.map((entry, index) => (
              <Cell key={`neu-${index}`} style={{ opacity: barOpacity(entry), transition: 'opacity 200ms' }} />
            ))}
          </Bar>
          <Bar dataKey="textNegative" stackId="sentiment" fill="#E53935" radius={[0, 4, 4, 0]} barSize={16} onClick={(_, i) => handleBarClick(i)} style={{ cursor: 'pointer' }}>
            {sorted.map((entry, index) => (
              <Cell key={`neg-${index}`} style={{ opacity: barOpacity(entry), transition: 'opacity 200ms' }} />
            ))}
            {/* Angka total (userCount) ditempel di ujung kanan bar yang udah
                ke-stack penuh, bukan cuma nilai potongan merah-nya doang. */}
            <LabelList
              position="right"
              content={(props: unknown) => {
                const { x, y, width, height, index } = props as { x: number; y: number; width: number; height: number; index: number };
                const seg = sorted[index];
                if (!seg) return null;
                return (
                  <text x={x + width + 6} y={y + height / 2} dy={4} fontSize={11} fontWeight={600} fill="#2D1818">
                    {seg.userCount}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SegmentDonutChart({ data, onSegmentClick, activeSegment }: Props) {
  const [view, setView] = useState<ViewMode>('donut');

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#2D1818]">User Segments</h3>
          <p className="text-xs text-[#6B5B5B] mt-0.5">Click a segment to filter details</p>
        </div>
        <div className="flex gap-1 p-1 bg-[#FAFAFA] rounded-lg border border-[#E8E0E0] flex-shrink-0">
          <button
            onClick={() => setView('donut')}
            title="Donut view"
            aria-label="Tampilkan sebagai donut chart"
            className={`p-1.5 rounded-md transition-all ${
              view === 'donut' ? 'bg-[#C62828] text-white shadow-sm' : 'text-[#6B5B5B] hover:bg-white'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setView('bar')}
            title="Bar view"
            aria-label="Tampilkan sebagai bar chart"
            className={`p-1.5 rounded-md transition-all ${
              view === 'bar' ? 'bg-[#C62828] text-white shadow-sm' : 'text-[#6B5B5B] hover:bg-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {view === 'donut' ? (
        <DonutView data={data} onSegmentClick={onSegmentClick} activeSegment={activeSegment} />
      ) : (
        <BarView data={data} onSegmentClick={onSegmentClick} activeSegment={activeSegment} />
      )}

      {/* Legend donut: nama + persen tiap segmen */}
      {view === 'donut' && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
          {data.map((segment) => (
            <button
              key={segment.id}
              onClick={() => onSegmentClick?.(activeSegment === segment.id ? null : segment.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                activeSegment === segment.id ? 'bg-[#FFF8F7] ring-1 ring-[#C62828]/20' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-[11px] text-[#6B5B5B] font-medium">
                {segment.emoji} {segment.percentage}%
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Legend bar: warna hijau/oranye/merah = breakdown sentiment teks */}
      {view === 'bar' && (
        <div className="flex items-center gap-4 mt-2 justify-center">
          {[
            { label: 'Positive', color: '#43A047' },
            { label: 'Neutral', color: '#FB8C00' },
            { label: 'Negative', color: '#E53935' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[11px] text-[#6B5B5B] font-medium">{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}