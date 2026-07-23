// Utility kecil buat export data jadi file (CSV/JSON) dan trigger download
// langsung di browser (bikin <a> sementara + klik programatik), tanpa
// dependency tambahan.

import type { Review } from '@/api/types';

export function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function reviewsToCsv(reviews: Review[]): string {
  const headers = ['id', 'user', 'rating', 'sentiment', 'date', 'topics', 'text'];
  const rows = reviews.map(r => [
    r.id,
    csvEscape(r.user),
    String(r.rating),
    r.sentiment,
    r.timestamp,
    csvEscape(r.topics.join('; ')),
    csvEscape(r.text),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}