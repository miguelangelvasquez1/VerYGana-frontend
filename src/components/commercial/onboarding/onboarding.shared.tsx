import React from "react";

export type FieldErrors = Record<string, string>;

export const formatCOP = (cents: number | null | undefined): string => {
  if (cents == null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

// Recuerda el último rechazo de VerYGana que el usuario ya vio (modal
// bloqueante), para no repetirlo en cada visita mientras siga siendo el
// mismo rechazo — solo se re-muestra si `rejectedAt` cambia.
const LAST_SEEN_REJECTION_KEY = "onboarding_last_seen_rejection";

export function getLastSeenRejection(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SEEN_REJECTION_KEY);
}

export function markRejectionSeen(rejectedAt: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SEEN_REJECTION_KEY, rejectedAt);
}

export function extractApiError(err: unknown): { message: string; details: FieldErrors } {
  const data = (err as { response?: { data?: { message?: string; details?: unknown } } })?.response?.data;
  return {
    message: data?.message || "Ocurrió un error. Intenta de nuevo.",
    details: (data?.details && typeof data.details === "object" ? data.details : {}) as FieldErrors,
  };
}

// Botón "?" con un pequeño tooltip flotante — click para togglear (funciona
// en touch) además de hover, y se cierra al mover el mouse fuera o volver a
// hacer click.
export function HelpTooltip({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="w-4 h-4 ml-1.5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center hover:bg-gray-300 transition cursor-help shrink-0"
        aria-label="Ayuda"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 max-w-[80vw] p-3 bg-gray-900 text-white text-xs font-normal not-italic leading-relaxed rounded-lg shadow-lg pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </span>
  );
}

export function FieldWrapper({
  label,
  required,
  error,
  hint,
  tooltip,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center">
        <label className="text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {tooltip && <HelpTooltip text={tooltip} />}
      </div>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-9a1 1 0 0 0-1 1v4a1 1 0 1 0 2 0V6a1 1 0 0 0-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition ${
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-gray-200 focus:ring-[#03548C]/40 focus:border-[#03548C]"
  }`;

export function BoolToggle({
  value,
  onChange,
  error,
}: {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  error?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[{ v: true, label: "Sí" }, { v: false, label: "No" }].map((opt) => (
        <button
          key={String(opt.v)}
          type="button"
          onClick={() => onChange(opt.v)}
          className={`py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition
            ${
              value === opt.v
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : error
                ? "border-red-300 bg-red-50/40 text-gray-500"
                : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function StepButton({
  submitting,
  onClick,
  disabled,
  label = "Continuar",
}: {
  submitting: boolean;
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting || disabled}
      className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer
        ${
          submitting || disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-linear-to-r from-[#b8860b] via-[#FFD700] to-[#c9a227] hover:brightness-110 active:scale-[0.98] text-gray-900 shadow-yellow-200"
        }`}
    >
      {submitting ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Procesando...
        </span>
      ) : (
        label
      )}
    </button>
  );
}
