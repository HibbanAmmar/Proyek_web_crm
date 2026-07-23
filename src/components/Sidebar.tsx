import { useState } from 'react';
import {
  BarChart2,
  Smile,
  PieChart,
  TrendingUp,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  Smartphone,
  Calendar,
  Gamepad2,
  Layout,
  Bug,
  Zap,
  CreditCard,
  Headphones,
  CheckSquare,
  Square,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'sentiment', label: 'Sentiment', icon: Smile },
  { id: 'segments', label: 'Segments', icon: PieChart },
  { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  { id: 'alerts', label: 'Alerts', icon: Bell },
];

const topics = [
  { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
  { id: 'uiux', label: 'UI/UX', icon: Layout },
  { id: 'bugs', label: 'Bugs', icon: Bug },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'monetization', label: 'Monetization', icon: CreditCard },
  { id: 'support', label: 'Support', icon: Headphones },
];

export default function Sidebar({ collapsed, onToggle, activeTab, onTabChange }: SidebarProps) {
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('30d');

  const toggleRating = (rating: string) => {
    setSelectedRatings((prev) =>
      prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  return (
    <aside
      className="h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
      style={{
        width: collapsed ? 64 : 260,
        backgroundColor: '#C62828',
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 min-h-[64px]">
        {!collapsed && (
          <div className="flex items-center gap-2 text-white">
            <Smartphone className="w-6 h-6" />
            <span className="font-semibold text-lg tracking-tight">ReviewPulse</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* App Selector */}
        {!collapsed && (
          <div className="px-4 mb-4">
            <label className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5 block font-medium">
              App
            </label>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-white cursor-pointer hover:bg-white/15 transition-colors">
              <Smartphone className="w-4 h-4 text-white/80" />
              <span className="text-sm font-medium flex-1">My Awesome App</span>
            </div>
          </div>
        )}

        {/* Date Range */}
        {!collapsed && (
          <div className="px-4 mb-4">
            <label className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5 block font-medium">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-1">
              {['7d', '30d', '90d', 'Custom'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`text-xs py-1.5 px-2 rounded-md transition-all font-medium ${
                    dateRange === range
                      ? 'bg-white text-[#C62828]'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {range === 'Custom' ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Custom
                    </span>
                  ) : (
                    `Last ${range}`
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="px-2 mb-4">
          {!collapsed && (
            <label className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5 px-2 block font-medium">
              Navigation
            </label>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-0.5 ${
                  isActive
                    ? 'bg-white text-[#C62828] shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Rating Filter */}
        {!collapsed && (
          <div className="px-4 mb-4">
            <label className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5 block font-medium">
              Rating Filter
            </label>
            <div className="flex flex-col gap-1">
              {[
                { id: 'low', label: '1-2★', color: '#E53935' },
                { id: 'mid', label: '3★', color: '#FB8C00' },
                { id: 'high', label: '4-5★', color: '#43A047' },
              ].map((rating) => (
                <button
                  key={rating.id}
                  onClick={() => toggleRating(rating.id)}
                  className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-md transition-all font-medium ${
                    selectedRatings.includes(rating.id)
                      ? 'bg-white text-[#C62828]'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <Star className="w-3 h-3" style={{ color: selectedRatings.includes(rating.id) ? '#C62828' : rating.color }} />
                  {rating.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Topic Filter */}
        {!collapsed && (
          <div className="px-4 mb-4">
            <label className="text-[10px] uppercase tracking-wider text-white/60 mb-1.5 block font-medium">
              Topics
            </label>
            <div className="flex flex-col gap-1">
              {topics.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-md transition-all ${
                      isSelected
                        ? 'bg-white text-[#C62828] font-medium'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                    <Icon className="w-3.5 h-3.5" />
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      )}
    </aside>
  );
}
