import { Loader2 } from 'lucide-react';

import { COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';

// Piezas repetidas de los diálogos de acción de cumplimiento (spec 018).

export const dialogInputClass =
  'w-full rounded-lg border border-cmp-rule bg-white px-3 py-2 text-sm text-cmp-ink placeholder:text-cmp-mute focus:border-cmp-cian focus:outline-none';

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-cmp-flag">
      {message}
    </p>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-3 break-words rounded-lg bg-cmp-flag-bg px-3 py-2 text-sm text-cmp-flag">
      {message}
    </p>
  );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-semibold text-cmp-ink">
      {children}
    </label>
  );
}

export function DialogFooter({
  busy,
  onClose,
  submitLabel,
  danger,
  disabled,
}: {
  busy: boolean;
  onClose: () => void;
  submitLabel: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="rounded-lg border border-cmp-rule px-4 py-2 text-sm font-medium text-cmp-slate hover:bg-cmp-rule-soft disabled:opacity-50"
      >
        {U.cancel}
      </button>
      <button
        type="submit"
        disabled={busy || disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
          danger ? 'bg-cmp-flag hover:brightness-110' : 'bg-cmp-azul hover:bg-cmp-azul-hi'
        }`}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {submitLabel}
      </button>
    </div>
  );
}
