import React from 'react';
import { STAT_CARDS_CONFIG } from './utils/adConstants';

interface AdStatsProps {
  stats: Record<string, number>;
}

export const AdStats: React.FC<AdStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {STAT_CARDS_CONFIG.map(({ key, label, color, icon: Icon }) => (
        <div 
          key={key} 
          className={`bg-white p-4 rounded-lg shadow-md border-l-4 border-${color}-500`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className={`text-2xl font-bold text-${color}-600`}>
                {stats[key] || 0}
              </p>
            </div>
            <Icon className={`w-8 h-8 text-${color}-500`} />
          </div>
        </div>
      ))}
    </div>
  );
};