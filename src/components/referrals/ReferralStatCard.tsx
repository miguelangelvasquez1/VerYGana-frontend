'use client';

import { LucideIcon } from 'lucide-react';

interface ReferralStatCardProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  /** Overrides iconBg/iconColor with raw CSS colors — used when the color is computed at runtime (e.g. per referral tier) and can't be a static Tailwind class. */
  iconStyle?: { background: string; color: string };
  value: string | number;
  label: string;
  badge?: string;
}

export default function ReferralStatCard({
  icon: Icon,
  iconBg,
  iconColor,
  iconStyle,
  value,
  label,
  badge,
}: ReferralStatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${iconBg ?? ''}`}
          style={iconStyle ? { background: iconStyle.background } : undefined}
        >
          <Icon
            className={`w-6 h-6 ${iconColor ?? ''}`}
            style={iconStyle ? { color: iconStyle.color } : undefined}
          />
        </div>
        {badge && (
          <span className="text-sm text-[#03548C] font-medium">{badge}</span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}