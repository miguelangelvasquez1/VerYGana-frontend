'use client';

/**
 * Piezas compartidas del portal de cumplimiento.
 *
 * Dos formatos de lectura, cada uno con un trabajo distinto:
 *   · Expedientes que se DECIDEN  → tarjetas (`CaseCard`), con espacio para
 *     el veredicto y salida animada cuando el caso deja la cola.
 *   · Registros que se COMPARAN   → tablas de ledger (`Ledger*`), densas,
 *     con identificadores en monoespaciada y cifras tabulares.
 *
 * El único acento de color de cada fila es la guía vertical de estado
 * (`spine`): el ojo recorre el borde izquierdo y sabe qué mirar antes de
 * leer una sola palabra.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, usePresence, useReducedMotion } from 'framer-motion';
import { Loader2, RefreshCw, ShieldAlert, X } from 'lucide-react';

/* ── Veredictos ──────────────────────────────────────────────────────── */

export type Tone = 'hold' | 'clear' | 'flag' | 'info' | 'neutral';

const TONE: Record<Tone, { text: string; bg: string; bar: string }> = {
  hold: { text: 'text-cmp-hold', bg: 'bg-cmp-hold-bg', bar: 'bg-cmp-hold' },
  clear: { text: 'text-cmp-clear', bg: 'bg-cmp-clear-bg', bar: 'bg-cmp-clear' },
  flag: { text: 'text-cmp-flag', bg: 'bg-cmp-flag-bg', bar: 'bg-cmp-flag' },
  info: { text: 'text-cmp-azul', bg: 'bg-[#E8F1FA]', bar: 'bg-cmp-azul' },
  neutral: { text: 'text-cmp-slate', bg: 'bg-cmp-rule-soft', bar: 'bg-cmp-mute' },
};

export function StatusTag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-1 ${t.bg} ${t.text}`}>
      <span className={`h-2.5 w-[3px] rounded-full ${t.bar}`} aria-hidden />
      <span className="cmp-label">{children}</span>
    </span>
  );
}

/** Guía de estado al borde izquierdo de una fila o tarjeta. */
export function Spine({ tone }: { tone: Tone }) {
  return (
    <span
      aria-hidden
      className={`absolute left-0 top-0 bottom-0 w-[3px] ${TONE[tone].bar}`}
    />
  );
}

/** Identificador: documentos, referencias, códigos. Siempre monoespaciado. */
export function Ref({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`cmp-mono inline-block rounded border border-cmp-rule-soft bg-cmp-rule-soft/60 px-1.5 py-0.5 text-[11px] ${
        muted ? 'text-cmp-slate' : 'text-cmp-ink'
      }`}
    >
      {children}
    </span>
  );
}

/* ── Botones ─────────────────────────────────────────────────────────── */

type BtnVariant = 'primary' | 'danger' | 'approve' | 'reject' | 'quiet' | 'ghost';

const BTN: Record<BtnVariant, string> = {
  primary: 'bg-cmp-azul text-white hover:bg-cmp-azul-hi disabled:bg-cmp-mute',
  danger: 'bg-cmp-flag text-white hover:brightness-110 disabled:bg-cmp-mute',
  approve: 'bg-cmp-clear text-white hover:brightness-110 disabled:bg-cmp-mute',
  // Rechazar es destructivo pero no es el camino principal: contorno, no
  // relleno, para que no compita visualmente con Aprobar.
  reject: 'border border-cmp-rule bg-white text-cmp-flag hover:border-cmp-flag/40 hover:bg-cmp-flag-bg',
  quiet:
    'border border-cmp-rule bg-white text-cmp-ink hover:border-cmp-mute hover:bg-cmp-rule-soft/60',
  ghost: 'text-cmp-slate hover:bg-cmp-rule-soft hover:text-cmp-ink',
};

export function Btn({
  variant = 'quiet',
  size = 'md',
  loading,
  icon: Icon,
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-70 ${
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
      } ${BTN[variant]} ${className}`}
    >
      {loading ? (
        <Loader2 className={size === 'sm' ? 'h-3.5 w-3.5 animate-spin' : 'h-4 w-4 animate-spin'} />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
      {children}
    </button>
  );
}

/* ── Cabecera de panel ───────────────────────────────────────────────── */

/**
 * El contador de cola es la firma del portal: un número grande en
 * monoespaciada que cambia con un desplazamiento corto cada vez que el
 * oficial toma una decisión. Es la confirmación de que la cola se movió.
 */
export function QueueCount({ value, label }: { value: number; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="text-right">
      <div className="relative h-9 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p
            key={value}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="cmp-mono text-3xl font-medium leading-9 text-cmp-ink"
          >
            {value >= 1000 ? value.toLocaleString('es-CO') : String(value).padStart(2, '0')}
          </motion.p>
        </AnimatePresence>
      </div>
      <p className="cmp-label mt-1 text-cmp-mute">{label}</p>
    </div>
  );
}

export function PanelHeader({
  eyebrow,
  title,
  description,
  count,
  countLabel,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-cmp-rule pb-5">
      <div className="min-w-0">
        <p className="cmp-label text-cmp-cian">{eyebrow}</p>
        <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.01em] text-cmp-ink">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-cmp-slate">{description}</p>}
      </div>
      <div className="flex items-end gap-6">
        {actions}
        {count !== undefined && countLabel && <QueueCount value={count} label={countLabel} />}
      </div>
    </header>
  );
}

export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cmp-rule bg-white px-3 py-2 text-xs font-medium text-cmp-slate hover:border-cmp-mute hover:text-cmp-ink disabled:opacity-60"
    >
      <RefreshCw
        className={`h-3.5 w-3.5 transition-transform duration-300 ${
          loading ? 'animate-spin' : 'group-hover:rotate-90'
        }`}
      />
      Actualizar
    </button>
  );
}

/* ── Ledger (tablas) ─────────────────────────────────────────────────── */

export function Ledger({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-cmp-rule bg-white shadow-[0_1px_2px_rgba(11,31,51,0.04)]">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function LedgerTable({ children }: { children: React.ReactNode }) {
  return <table className="w-full text-sm">{children}</table>;
}

export function Th({
  children,
  align = 'left',
  className = '',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      className={`cmp-label whitespace-nowrap bg-cmp-rule-soft/50 px-4 py-3 text-cmp-mute ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}

/** Celda de encabezado sobre la guía de estado: 3 px, sin relleno. */
export function ThSpine() {
  return <th className="w-[3px] bg-cmp-rule-soft/50 p-0" />;
}

export function LedgerHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-cmp-rule">
      <tr>{children}</tr>
    </thead>
  );
}

export function LedgerBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-cmp-rule-soft">{children}</tbody>;
}

/** Fila con guía de estado y entrada escalonada (máx. 12 pasos de 22 ms). */
export function LedgerRow({
  tone,
  index = 0,
  children,
}: {
  tone?: Tone;
  index?: number;
  children: React.ReactNode;
}) {
  return (
    <tr
      className="cmp-row-in group relative transition-colors duration-150 hover:bg-cmp-rule-soft/40"
      style={{ animationDelay: `${Math.min(index, 12) * 22}ms` }}
    >
      {tone && (
        <td className="relative w-[3px] p-0">
          <Spine tone={tone} />
        </td>
      )}
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td
      className={`px-4 py-3 align-middle ${align === 'right' ? 'text-right' : ''} ${className}`}
    >
      {children}
    </td>
  );
}

/* ── Estados de carga, vacío y error ─────────────────────────────────── */

/**
 * Esqueleto en vez de spinner centrado: la página conserva su forma
 * mientras carga, así que el contenido no salta al llegar y la espera se
 * percibe más corta.
 */
export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-cmp-rule bg-white">
      <div className="h-10 border-b border-cmp-rule bg-cmp-rule-soft/50" />
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-cmp-rule-soft px-4 py-[17px] last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="cmp-skeleton h-3 rounded"
              style={{
                flex: c === 0 ? '0 0 22%' : '1 1 0%',
                animationDelay: `${(r * cols + c) * 45}ms`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  // Verde solo cuando el vacío es una buena noticia (cola despejada); si es
  // "no encontré nada", el icono no celebra.
  tone = 'neutral',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  tone?: 'clear' | 'neutral';
}) {
  return (
    <div className="rounded-xl border border-dashed border-cmp-rule bg-white/60 px-6 py-16 text-center">
      <Icon className={`mx-auto h-7 w-7 ${tone === 'clear' ? 'text-cmp-clear' : 'text-cmp-mute'}`} />
      <p className="mt-3 text-sm font-semibold text-cmp-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-cmp-slate">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-cmp-flag/25 bg-cmp-flag-bg/50 px-6 py-14 text-center">
      <ShieldAlert className="mx-auto h-7 w-7 text-cmp-flag" />
      <p className="mt-3 text-sm font-semibold text-cmp-ink">{message}</p>
      <button
        onClick={onRetry}
        className="cmp-label mt-4 cursor-pointer rounded-lg border border-cmp-flag/30 px-3 py-2 text-cmp-flag hover:bg-white"
      >
        Reintentar
      </button>
    </div>
  );
}

/* ── Paginación ──────────────────────────────────────────────────────── */

export function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number;
  totalPages: number;
  total?: number;
  onChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <p className="cmp-label text-cmp-mute">
        {total !== undefined && `${total} registro${total !== 1 ? 's' : ''} · `}
        Página {page + 1} de {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-1.5">
        <Btn size="sm" onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0}>
          Anterior
        </Btn>
        <Btn
          size="sm"
          onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
        >
          Siguiente
        </Btn>
      </div>
    </div>
  );
}

/* ── Pestañas con indicador deslizante ───────────────────────────────── */

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  layoutId,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex gap-1 border-b border-cmp-rule">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`relative cursor-pointer px-3 pb-2.5 pt-1 text-sm font-medium ${
              active ? 'text-cmp-ink' : 'text-cmp-slate hover:text-cmp-ink'
            }`}
          >
            {opt.label}
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }
                }
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-cmp-cian"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────── */

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Diálogo del portal.
 *
 * La salida se lee a través de `usePresence`: el sitio que lo invoca solo
 * tiene que envolverlo en `<AnimatePresence>` y montarlo condicionalmente
 * como siempre. Entra en 200 ms y sale en 130 ms — cuando el usuario ya
 * decidió, el sistema no lo hace esperar.
 */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  size = 'md',
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'md' | 'lg';
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isPresent, safeToRemove] = usePresence();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Escape cierra, el scroll de fondo se congela mientras el diálogo vive y
  // el foco entra al panel (y vuelve a su origen al salir).
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      opener?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  // Red de seguridad: si la animación de salida no reporta su final, el
  // diálogo se retira igual en vez de quedarse colgado sobre la página.
  useEffect(() => {
    if (isPresent) return;
    const t = setTimeout(() => safeToRemove?.(), 320);
    return () => clearTimeout(t);
  }, [isPresent, safeToRemove]);

  if (!mounted) return null;

  return createPortal(
    <div className="compliance-root fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isPresent ? 1 : 0 }}
        transition={{ duration: isPresent ? 0.15 : 0.12 }}
        onClick={onClose}
        className="absolute inset-0 bg-cmp-ink/45 backdrop-blur-[2px]"
      />
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
        animate={
          isPresent
            ? reduce
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, y: 0 }
            : reduce
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.97, y: 4 }
        }
        transition={
          isPresent
            ? { duration: 0.2, ease: EASE_OUT }
            : { duration: 0.13, ease: 'easeIn' }
        }
        onAnimationComplete={() => {
          if (!isPresent) safeToRemove?.();
        }}
        className={`relative flex max-h-[86vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-12px_rgba(11,31,51,0.35)] focus:outline-none ${
          size === 'lg' ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-cmp-rule px-5 py-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-cmp-ink">{title}</h3>
            {subtitle && <div className="mt-0.5 text-xs text-cmp-slate">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-1 cursor-pointer rounded-lg p-1.5 text-cmp-mute hover:bg-cmp-rule-soft hover:text-cmp-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </div>,
    document.body
  );
}

/** Campo de texto del portal (motivo de rechazo, notas de revisión). */
export function TextField({
  label,
  hint,
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="cmp-label mb-1.5 block text-cmp-mute">{label}</span>}
      <textarea
        {...props}
        className={`w-full resize-none rounded-lg border border-cmp-rule bg-white px-3 py-2.5 text-sm text-cmp-ink placeholder:text-cmp-mute focus:border-cmp-cian focus:outline-none ${className}`}
      />
      {hint && <span className="mt-1 block text-xs text-cmp-slate">{hint}</span>}
    </label>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="cmp-label mb-1.5 block text-cmp-mute">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-cmp-rule bg-white px-3 py-2 text-sm text-cmp-ink placeholder:text-cmp-mute focus:border-cmp-cian focus:outline-none';
