import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp, TrendingDown, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UserSegment } from '@/api/types';

interface Props {
  data: UserSegment[];
  activeSegment: string | null;
  // Dipanggil pas tombol "View" di-klik. Belum di-wire ke navigasi beneran
  // (masih nunggu lihat setup routing project ini) — kalau prop ini nggak
  // dikasih, tombolnya tetap tampil tapi nggak ngapa-ngapain.
  onViewSegment?: (segmentId: string) => void;
}

export default function SegmentDetailTable({ data, activeSegment, onViewSegment }: Props) {
  const [sortField, setSortField] = useState<keyof UserSegment>('percentage');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filtered = activeSegment
    ? data.filter((s) => s.id === activeSegment)
    : data;

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (field: keyof UserSegment) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Naik = hijau, turun = merah, stabil = garis abu-abu — universal buat
  // semua segmen, nggak dibeda-bedain lagi berdasarkan jenis segmennya
  // (biar nggak bingungin, sesuai masukan).
  const trendIcon = (segment: UserSegment) => {
    const { trend } = segment;
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" style={{ color: '#43A047' }} />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" style={{ color: '#E53935' }} />;
    return <Minus className="w-3.5 h-3.5 text-[#9E9E9E]" />;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#2D1818]">Segment Details</h3>
          {activeSegment && (
            <span className="inline-flex items-center gap-1 text-xs text-[#C62828] font-medium mt-0.5 bg-[#FFCDD2]/50 px-2 py-0.5 rounded-full">
              Filtered: {data.find((s) => s.id === activeSegment)?.name}
              <button onClick={() => window.dispatchEvent(new CustomEvent('clearSegmentFilter'))} className="hover:text-[#8E0000]">
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E8E0E0]">
              {[
                { key: 'name' as const, label: 'Segment' },
                { key: 'userCount' as const, label: 'Users' },
                { key: 'avgRating' as const, label: 'Avg Rating' },
                { key: 'sentiment' as const, label: 'Sentiment' },
                { key: 'trend' as const, label: 'Trend' },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="text-left text-[10px] uppercase tracking-wider text-[#6B5B5B] font-semibold pb-2 pr-3 cursor-pointer hover:text-[#2D1818] select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.key && (
                      sortDir === 'asc' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              <th className="text-left text-[10px] uppercase tracking-wider text-[#6B5B5B] font-semibold pb-2">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((segment) => (
              <tr
                key={segment.id}
                className="border-b border-[#F0E8E8] last:border-0 hover:bg-[#FFF8F7] transition-colors cursor-pointer"
                style={{ borderLeft: `3px solid ${segment.color}` }}
              >
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{segment.emoji}</span>
                    <span className="text-sm font-medium text-[#2D1818]">{segment.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-sm text-[#2D1818]">
                  {segment.userCount >= 1000 ? (segment.userCount / 1000).toFixed(1) + 'K' : segment.userCount}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-[#FFC107]" />
                    <span className="text-sm font-medium text-[#2D1818]">{segment.avgRating}</span>
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#F0E8E8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${segment.sentiment * 100}%`,
                          backgroundColor: segment.sentiment > 0.6 ? '#43A047' : segment.sentiment > 0.3 ? '#FB8C00' : '#E53935',
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#6B5B5B]">{(segment.sentiment * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 pr-3">{trendIcon(segment)}</td>
                <td className="py-3">
                  <button
                    onClick={() => onViewSegment?.(segment.id)}
                    className="text-xs text-[#C62828] hover:text-[#8E0000] font-medium hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F0E8E8]">
          <span className="text-xs text-[#6B5B5B]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-md hover:bg-[#F0E8E8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-md hover:bg-[#F0E8E8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}