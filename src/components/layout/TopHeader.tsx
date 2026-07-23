import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RefreshCw, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { triggerRefresh } from '@/hooks/useRefresh';



const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard Overview', subtitle: 'Real-time app review analytics and insights' },
  '/segments': { title: 'User Segments', subtitle: 'Analyze user behavior and segment performance' },
  '/predictions': { title: 'Predictions & Forecast', subtitle: 'AI-powered rating and trend predictions' },
  '/alerts': { title: 'Alerts & Notifications', subtitle: 'Monitor critical events and warnings' },
  '/reviews': { title: 'Review Management', subtitle: 'Browse, filter, and analyze user reviews' },
};

export default function TopHeader() {
  const location = useLocation();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageInfo = pageTitles[location.pathname] || { title: 'Dashboard', subtitle: '' };

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh(); // ← BROADCAST ke semua halaman
    
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E8E0E0] flex-shrink-0 transition-all duration-300">
      <div>
        <h1 className="text-xl font-semibold text-[#2D1818]">{pageInfo.title}</h1>
        <p className="text-xs text-[#6B5B5B] mt-0.5">{pageInfo.subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-[#9E8E8E]">
          <Clock className="w-3.5 h-3.5" />
          <span>Last updated: {format(lastUpdated, 'HH:mm:ss')}</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C62828] text-white text-xs font-medium hover:bg-[#8E0000] transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </header>
  );
}