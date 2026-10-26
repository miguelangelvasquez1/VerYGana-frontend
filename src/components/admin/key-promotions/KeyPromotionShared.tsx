import React from 'react';
import type { KeyPromotionResponseDTO } from '@/types/keys/KeyPromotion.types';
import { formatCopCents, getOfferStatusMeta, getPromotionStatusMeta } from '@/utils/keys';

function Badge({ label, classes }: { label: string; classes: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

export function PromotionStatusBadge({ status }: { status: string }) {
  return <Badge {...getPromotionStatusMeta(status)} />;
}

export function OfferStatusBadge({ status }: { status: string }) {
  return <Badge {...getOfferStatusMeta(status)} />;
}

// Presupuesto consumido / reservado / disponible. `compact` deja solo la barra
// y un renglón (para el listado).
export function PromotionBudgetBar({
  promotion,
  compact = false,
}: {
  promotion: Pick<KeyPromotionResponseDTO, 'budgetCents' | 'consumedCents' | 'reservedCents' | 'availableBudgetCents'>;
  compact?: boolean;
}) {
  const { budgetCents, consumedCents, reservedCents, availableBudgetCents } = promotion;
  const pct = (cents: number) => (budgetCents > 0 ? Math.min(100, Math.max(0, (cents / budgetCents) * 100)) : 0);

  return (
    <div>
      <div
        className={`flex w-full overflow-hidden rounded-full bg-gray-100 ${compact ? 'h-1.5' : 'h-3'}`}
        role="img"
        aria-label={`Consumido ${formatCopCents(consumedCents)}, reservado ${formatCopCents(reservedCents)}, disponible ${formatCopCents(availableBudgetCents)} de ${formatCopCents(budgetCents)}`}
      >
        <div className="h-full bg-admin-midnight transition-all duration-500" style={{ width: `${pct(consumedCents)}%` }} />
        <div className="h-full bg-admin-blue/50 transition-all duration-500" style={{ width: `${pct(reservedCents)}%` }} />
      </div>

      {compact ? (
        <p className="mt-1 text-xs text-gray-500">
          {formatCopCents(consumedCents)} de {formatCopCents(budgetCents)}
        </p>
      ) : (
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: 'Consumido', cents: consumedCents, dot: 'bg-admin-midnight' },
            { label: 'Reservado', cents: reservedCents, dot: 'bg-admin-blue/50' },
            { label: 'Disponible', cents: availableBudgetCents, dot: 'bg-gray-200' },
          ].map(({ label, cents, dot }) => (
            <div key={label}>
              <dt className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                {label}
              </dt>
              <dd className="mt-0.5 text-lg font-bold text-gray-900">{formatCopCents(cents)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
