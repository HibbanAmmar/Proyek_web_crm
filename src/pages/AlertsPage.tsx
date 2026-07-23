import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getAlerts } from '@/api';
import type { Alert } from '@/api/types';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    const data = await getAlerts();
    setAlerts(data);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!alerts.length) return;
    for (let i = 0; i < 2; i++) {
      setTimeout(() => setVisibleCards(prev => new Set([...prev, i])), i * 80);
    }
  }, [alerts]);

  const handleDismiss = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.type === filter);

  const counts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length,
  };

  const gc = (i: number) => visibleCards.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3';

  if (!alerts.length) return <div className="flex items-center justify-center h-64 text-[#6B5B5B]">Loading...</div>;

  return (
    <div className="space-y-5 pb-6">
      {/* Alert Stats */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-400 ${gc(0)}`}>
        {([
          { key: 'all', label: 'All Alerts', icon: Bell, color: '#C62828', bg: '#FFCDD2' },
          { key: 'critical', label: 'Critical', icon: AlertTriangle, color: '#E53935', bg: '#FDECEA' },
          { key: 'warning', label: 'Warning', icon: AlertCircle, color: '#FB8C00', bg: '#FFF3E0' },
          { key: 'info', label: 'Info', icon: Info, color: '#1E88E5', bg: '#E3F2FD' },
        ] as const).map(item => {
          const Icon = item.icon;
          const isActive = filter === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left hover:-translate-y-0.5 hover:shadow-lg ${
                isActive ? 'border-[#C62828] ring-1 ring-[#C62828]/20' : 'border-[#E8E0E0]'
              }`}
              style={{ backgroundColor: isActive ? item.bg : 'white' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div>
                <div className="text-xl font-bold text-[#2D1818]">{counts[item.key as keyof typeof counts]}</div>
                <div className="text-xs text-[#6B5B5B]">{item.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alert List */}
      <div className={`space-y-3 transition-all duration-400 ${gc(1)}`}>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-[#E8E0E0] text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[#43A047]" />
            <h3 className="text-lg font-semibold text-[#2D1818] mb-1">All Clear!</h3>
            <p className="text-sm text-[#6B5B5B]">No alerts match your current filter.</p>
          </div>
        ) : (
          filtered.map(alert => {
            const config = {
              critical: { icon: AlertTriangle, bg: '#FDECEA', border: '#E53935', iconColor: '#E53935' },
              warning: { icon: AlertCircle, bg: '#FFF3E0', border: '#FB8C00', iconColor: '#FB8C00' },
              info: { icon: Info, bg: '#E3F2FD', border: '#1E88E5', iconColor: '#1E88E5' },
            }[alert.type];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className="bg-white rounded-2xl p-5 border border-[#E8E0E0] hover:shadow-lg transition-all"
                style={{ borderLeftWidth: 4, borderLeftColor: config.border }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.bg }}>
                    <Icon className="w-5 h-5" style={{ color: config.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.iconColor }}>
                          {alert.type}
                        </span>
                        <span className="text-xs text-[#9E8E8E]">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      {alert.dismissible && (
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="text-xs text-[#6B5B5B] hover:text-[#E53935] font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                    <h4 className="text-base font-semibold text-[#2D1818] mt-1">{alert.title}</h4>
                    <p className="text-sm text-[#6B5B5B] mt-1 leading-relaxed">{alert.description}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
