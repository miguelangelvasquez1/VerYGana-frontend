'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Loader2, PiggyBank, Search, X } from 'lucide-react';
import { getCommercials, getConsumers } from '@/services/admin/AdminUserService';
import type { RecognitionFund } from '@/types/recognitions/Recognition.types';
import { formatCopCents } from '@/utils/keys';
import { getComputableStatusMeta, getRecognitionStatusMeta } from '@/utils/recognitions';
import { inputClass } from '@/components/admin/prosperity/ProsperityModalShell';

// ─── Badges ──────────────────────────────────────────────────────────────────

export function Badge({ label, classes }: { label: string; classes: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

export function RecognitionStatusBadge({ status }: { status: string }) {
  return <Badge {...getRecognitionStatusMeta(status)} />;
}

export function ComputableStatusBadge({ status }: { status: string }) {
  return <Badge {...getComputableStatusMeta(status)} />;
}

export function PaidOutBadge() {
  return <Badge label="Pagado al comercio" classes="bg-admin-midnight/10 text-admin-midnight border-admin-midnight/20" />;
}

// ─── Fondo ───────────────────────────────────────────────────────────────────

export function RecognitionFundCards({ fund, loading }: { fund?: RecognitionFund; loading?: boolean }) {
  const counts: { label: string; value: number | undefined; dot: string }[] = [
    { label: 'Pendientes de entrega', value: fund?.purchasedCount, dot: 'bg-amber-400' },
    { label: 'Entregados', value: fund?.deliveredCount, dot: 'bg-green-500' },
    { label: 'Vencidos', value: fund?.expiredCount, dot: 'bg-gray-400' },
    { label: 'Anulados', value: fund?.cancelledCount, dot: 'bg-red-500' },
  ];

  const value = (node: React.ReactNode) =>
    loading ? <Loader2 className="mt-2 h-5 w-5 animate-spin text-gray-300" /> : node;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-2xl bg-admin-navy-gradient p-5 text-white shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          <PiggyBank className="h-4 w-4 text-admin-gold" />
          Saldo disponible del Fondo de Fortalecimiento
        </div>
        {value(
          <p className="mt-2 text-2xl font-bold tracking-tight">{formatCopCents(fund?.fortificationBalanceCents)}</p>,
        )}
        <p className="mt-1 text-[11px] text-white/50">Cada reconocimiento debe cubrirse al 100 % con este saldo.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <Award className="h-4 w-4 text-admin-blue" />
          Gastado en reconocimientos vigentes
        </div>
        {value(<p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{formatCopCents(fund?.activeSpentCents)}</p>)}
        <p className="mt-1 text-[11px] text-gray-400">Pendientes de entrega y entregados.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500">Reconocimientos por estado</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
          {counts.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {c.label}
              </dt>
              <dd className="text-sm font-bold text-gray-900">{loading ? '…' : (c.value ?? 0)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ─── Buscador de usuarios (consumidores / comercios) ─────────────────────────
// Reutiliza los listados del módulo de usuarios (búsqueda por email). Siempre
// entrega el publicId: nunca ids numéricos de usuario.

export interface UserOption {
  publicId: string;
  label: string;
  hint?: string;
}

export function UserSearchSelect({
  kind,
  value,
  onChange,
  placeholder,
}: {
  kind: 'consumer' | 'commercial';
  value: UserOption | null;
  onChange: (value: UserOption | null) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 350);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['admin', 'recognitions', 'user-picker', kind, search],
    queryFn: async (): Promise<UserOption[]> => {
      if (kind === 'consumer') {
        const res = await getConsumers(
          undefined, search, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 0, 8,
        );
        return res.data.map((u) => ({
          publicId: u.publicId,
          label: [u.name, u.lastName].filter(Boolean).join(' ') || u.userName || u.email,
          hint: u.email,
        }));
      }
      const res = await getCommercials(search, undefined, undefined, 0, 8);
      return res.data.map((c) => ({ publicId: c.publicId, label: c.companyName || c.email, hint: c.email }));
    },
    enabled: open && search.length >= 2,
    staleTime: 30_000,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-admin-blue/40 bg-admin-blue/5 px-3 py-2 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{value.label}</p>
          {value.hint && <p className="truncate text-xs text-gray-500">{value.hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Quitar filtro"
          className="shrink-0 cursor-pointer rounded p-0.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const options = data ?? [];

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'Buscar por email'}
        className={`${inputClass(false)} pl-9`}
      />
      {open && search.length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {isFetching && options.length === 0 ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
            </div>
          ) : isError ? (
            <p className="px-3 py-3 text-xs text-red-600">No se pudo buscar. Intenta de nuevo.</p>
          ) : options.length === 0 ? (
            <p className="px-3 py-3 text-xs text-gray-400">Sin resultados</p>
          ) : (
            options.map((opt) => (
              <button
                key={opt.publicId}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setInput('');
                  setOpen(false);
                }}
                className="block w-full cursor-pointer px-3 py-2 text-left transition-colors hover:bg-admin-blue/5"
              >
                <p className="truncate text-sm font-medium text-gray-900">{opt.label}</p>
                {opt.hint && <p className="truncate text-xs text-gray-500">{opt.hint}</p>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Bloques de información ──────────────────────────────────────────────────

export function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">{children}</dd>
    </div>
  );
}
