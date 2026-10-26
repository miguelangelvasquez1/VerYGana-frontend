import React from 'react';
import { STAT_CARDS_CONFIG, STAT_CARD_COLORS } from './utils/adConstants';

interface AdStatsProps {
  stats: Record<string, number>;
}

export const AdStats: React.FC<AdStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
      {STAT_CARDS_CONFIG.map(({ key, label, color, icon: Icon }) => {
        const colors = STAT_CARD_COLORS[color];
        return (
          <div
            key={key}
            className="flex items-center gap-3 min-w-0 bg-white p-3 rounded-lg shadow-sm border border-gray-100"
          >
            <div className={`shrink-0 p-2 rounded-lg ${colors.badge}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
              <p className={`text-xl font-bold leading-tight ${colors.value}`}>
                {stats[key] || 0}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};