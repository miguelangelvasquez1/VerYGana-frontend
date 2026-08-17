'use client';

import { motion, useReducedMotion } from 'framer-motion';
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
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
      }}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white rounded-xl p-6 shadow-sm border"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl ${iconBg ?? ''}`}
          style={iconStyle ? { background: iconStyle.background } : undefined}
        >
          <Icon
            className={`w-6 h-6 ${iconColor ?? ''}`}
            style={iconStyle ? { color: iconStyle.color } : undefined}
          />
        </div>
        {badge && (
          <span className="text-xs font-semibold text-[#03548C] bg-[#03548C]/10 px-2.5 py-1 rounded-full" style={{ fontVariantNumeric: 'tabular-nums' }}>{badge}</span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</h3>
      <p className="text-gray-500 text-sm">{label}</p>
    </motion.div>
  );
}
