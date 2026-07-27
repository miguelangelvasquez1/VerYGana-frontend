'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Medal, Star, Trophy, Crown, Zap, Diamond, Lock, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  levelSheen, tierTheme, LEVEL_BY_LABEL, MEDALLION_BEVEL,
} from '@/components/levels/levelTheme';

const TIER_ICON: Record<string, LucideIcon> = {
  Bronce: Medal, Plata: Star, Oro: Trophy, 'Rubí': Zap, Esmeralda: Diamond, Diamante: Crown,
};

// Config derivada del tema de niveles (mismos colores que el módulo de XP),
// expuesta con la forma que ya consumía ReferralPageShell.
export const TIER_CONFIG: Record<string, {
  bg: string; text: string; bar: string; Icon: LucideIcon;
}> = Object.fromEntries(
  Object.keys(LEVEL_BY_LABEL).map(label => {
    const t = tierTheme(label);
    return [label, { bg: t.soft, text: t.on, bar: t.accent, Icon: TIER_ICON[label] ?? Medal }];
  })
);

interface Props {
  level: string;
  minReferrals: number;
  ticketsPerReferral: number;
  color: string;
  isCurrent: boolean;
  isUnlocked: boolean;
}

export default function ReferralTierCard({ level, minReferrals, ticketsPerReferral, isCurrent, isUnlocked }: Props) {
  const reduce = useReducedMotion();
  const t = tierTheme(level);
  const levelKey = LEVEL_BY_LABEL[level];
  const Icon = TIER_ICON[level] ?? Medal;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
      }}
      whileHover={reduce || !isUnlocked ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: 'relative',
        background: '#ffffff',
        border: `1.5px solid ${isCurrent ? t.accent : '#e9ebef'}`,
        borderRadius: 16,
        padding: '1.35rem 1rem 1.15rem',
        opacity: isUnlocked ? 1 : 0.55,
        boxShadow: isCurrent ? `0 10px 30px ${t.accent}22` : '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {isCurrent && (
        <span style={{
          position: 'absolute',
          top: -11,
          left: '50%',
          transform: 'translateX(-50%)',
          background: levelSheen(levelKey),
          color: t.onGrad,
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 12px',
          borderRadius: 99,
          whiteSpace: 'nowrap',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          boxShadow: MEDALLION_BEVEL,
        }}>
          Nivel actual
        </span>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>

        {/* Medallón acuñado */}
        <div style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: isUnlocked ? levelSheen(levelKey) : '#f1f3f5',
          boxShadow: isUnlocked ? `${MEDALLION_BEVEL}, 0 6px 14px ${t.accent}2E` : 'inset 0 1px 1px rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isUnlocked
            ? <Icon style={{ width: 24, height: 24, color: t.onGrad, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))' }} />
            : <Lock style={{ width: 18, height: 18, color: '#9CA3AF' }} />
          }
        </div>

        {/* Nombre y requisito */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 3px' }}>
            {level}
          </p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {minReferrals === 0 ? 'Sin mínimo' : `${minReferrals}+ referidos`}
          </p>
        </div>

        {/* Badge de tickets */}
        <div style={{
          background: isUnlocked ? t.soft : '#f1f3f5',
          borderRadius: 10,
          padding: '8px 14px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <Ticket style={{ width: 14, height: 14, color: isUnlocked ? t.accent : '#9CA3AF', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: isUnlocked ? t.on : '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
              {ticketsPerReferral}
            </span>
            <span style={{ fontSize: 11, color: isUnlocked ? t.on : '#9CA3AF', marginLeft: 3 }}>
              ticket{ticketsPerReferral > 1 ? 's' : ''} / referido
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
