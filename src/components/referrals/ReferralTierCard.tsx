'use client';

import { Medal, Star, Trophy, Crown, Lock, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const TIER_CONFIG: Record<string, {
  bg: string; text: string; bar: string; Icon: LucideIcon
}> = {
  Bronce:    { bg: '#FAEEDA', text: '#854F0B', bar: '#BA7517', Icon: Medal   },
  Plata:     { bg: '#F1EFE8', text: '#5F5E5A', bar: '#888780', Icon: Star    },
  Oro:       { bg: '#FEF9C3', text: '#713F12', bar: '#EF9F27', Icon: Trophy  },
  Rubí:      { bg: '#FBEAF0', text: '#72243E', bar: '#D4537E', Icon: Medal   },
  Esmeralda: { bg: '#E1F5EE', text: '#085041', bar: '#1D9E75', Icon: Star    },
  Diamante:  { bg: '#E6F1FB', text: '#0C447C', bar: '#378ADD', Icon: Crown   },
};

interface Props {
  level: string;
  minReferrals: number;
  ticketsPerReferral: number;
  color: string;
  isCurrent: boolean;
  isUnlocked: boolean;
}

export default function ReferralTierCard({ level, minReferrals, ticketsPerReferral, isCurrent, isUnlocked }: Props) {
  const cfg = TIER_CONFIG[level] ?? TIER_CONFIG.Bronze;
  const { Icon } = cfg;

  return (
    <div style={{
      position: 'relative',
      background: 'var(--color-background-primary)',
      border: `1.5px solid ${isCurrent ? cfg.bar : 'var(--color-border-tertiary)'}`,
      borderRadius: 'var(--border-radius-lg, 16px)',
      padding: '1.25rem 1rem',
      opacity: isUnlocked ? 1 : 0.5,
      transition: 'border-color 0.2s, opacity 0.2s',
      boxShadow: isCurrent ? `0 0 0 3px ${cfg.bar}22` : 'none',
    }}>
      {isCurrent && (
        <span style={{
          position: 'absolute',
          top: -11,
          left: '50%',
          transform: 'translateX(-50%)',
          background: cfg.bar,
          color: 'white',
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 10px',
          borderRadius: 99,
          whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
        }}>
          Nivel actual
        </span>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>

        {/* Ícono */}
        <div style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: isUnlocked ? cfg.bg : 'var(--color-background-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isUnlocked
            ? <Icon style={{ width: 24, height: 24, color: cfg.bar }} />
            : <Lock style={{ width: 18, height: 18, color: '#9CA3AF' }} />
          }
        </div>

        {/* Nombre y requisito */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 3px' }}>
            {level}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
            {minReferrals === 0 ? 'Sin mínimo' : `${minReferrals}+ referidos`}
          </p>
        </div>

        {/* Badge de tickets */}
        <div style={{
          background: isUnlocked ? cfg.bg : 'var(--color-background-secondary)',
          borderRadius: 10,
          padding: '8px 14px',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <Ticket style={{ width: 14, height: 14, color: isUnlocked ? cfg.bar : '#9CA3AF', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: isUnlocked ? cfg.text : '#9CA3AF' }}>
              {ticketsPerReferral}
            </span>
            <span style={{ fontSize: 11, color: isUnlocked ? cfg.text : '#9CA3AF', marginLeft: 3 }}>
              ticket{ticketsPerReferral > 1 ? 's' : ''} / referido
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
