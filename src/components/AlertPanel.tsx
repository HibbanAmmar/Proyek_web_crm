import { useState, useCallback } from 'react';
import { X, AlertTriangle, AlertCircle, Info, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Alert } from '@/api/types';

interface Props {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

const alertConfig = {
  critical: {
    icon: AlertTriangle,
    bgColor: '#FDECEA',
    borderColor: '#E53935',
    iconColor: '#E53935',
    label: 'Critical',
  },
  warning: {
    icon: AlertCircle,
    bgColor: '#FFF3E0',
    borderColor: '#FB8C00',
    iconColor: '#FB8C00',
    label: 'Warning',
  },
  info: {
    icon: Info,
    bgColor: '#E3F2FD',
    borderColor: '#1E88E5',
    iconColor: '#1E88E5',
    label: 'Info',
  },
};

interface AlertCardProps {
  alert: Alert;
  onDismiss: (id: string) => void;
  index: number;
}

function AlertCard({ alert, onDismiss, index }: AlertCardProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = alertConfig[alert.type];
  const Icon = config.icon;

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(alert.id), 200);
  }, [alert.id, onDismiss]);

  return (
    <div
      className={`rounded-xl border-l-4 p-4 transition-all duration-300 ${isExiting ? 'opacity-0 -translate-y-5' : 'opacity-100 translate-y-0'}`}
      style={{
        backgroundColor: config.bgColor,
        borderLeftColor: config.borderColor,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.iconColor}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: config.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] uppercase tracking-wider font-bold"
                style={{ color: config.iconColor }}
              >
                {config.label}
              </span>
              <span className="text-[10px] text-[#9E8E8E]">
                {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
              </span>
            </div>
            {alert.dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 rounded-md hover:bg-black/5 transition-colors text-[#9E8E8E] hover:text-[#2D1818]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <h4 className="text-sm font-semibold text-[#2D1818] mt-1">{alert.title}</h4>
          <p className="text-xs text-[#6B5B5B] mt-0.5 leading-relaxed">{alert.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function AlertPanel({ alerts, onDismiss }: Props) {
  const [showDismissed, setShowDismissed] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E8E0E0] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-[#2D1818]">Alerts</h3>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#C62828] text-white text-[10px] font-bold">
            {alerts.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#6B5B5B]">
          <Bell className="w-4 h-4" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-[#9E8E8E]">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No active alerts</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} index={index} />
          ))
        )}
      </div>

      {alerts.length > 0 && (
        <button
          onClick={() => setShowDismissed(!showDismissed)}
          className="w-full mt-3 text-xs text-[#6B5B5B] hover:text-[#C62828] font-medium py-2 text-center transition-colors"
        >
          {showDismissed ? 'Hide dismissed' : 'Show dismissed'}
        </button>
      )}
    </div>
  );
}
