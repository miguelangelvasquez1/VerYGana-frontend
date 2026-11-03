'use client';

import { useId, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { FormError, FieldLabel, dialogInputClass } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { companyNameMatches } from '@/lib/compliance/findingForm';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';

interface AccountMeasureConfirmDialogProps {
  companyName: string;
  measureLabel: string;
  busy: boolean;
  error: string | null;
  // Envía el hallazgo; el padre es quien llama a la API y cierra los diálogos.
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

// RN-6: una medida que cambia el estado de la cuenta se confirma escribiendo el nombre de la empresa.
export function AccountMeasureConfirmDialog({
  companyName,
  measureLabel,
  busy,
  error,
  onConfirm,
  onClose,
}: AccountMeasureConfirmDialogProps) {
  const fieldId = useId();
  const submittingRef = useRef(false);
  const [typed, setTyped] = useState('');
  const matches = companyNameMatches(typed, companyName);

  const onSubmit = async () => {
    if (submittingRef.current) return;
    if (!matches) return;
    submittingRef.current = true;
    try {
      await onConfirm();
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog open title={U.accountConfirmTitle} onClose={onClose} dismissible={!busy}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
        noValidate
      >
        <p className="rounded-lg border border-cmp-flag/30 bg-cmp-flag-bg px-3 py-2 text-sm text-cmp-flag">
          {A.accountChangeConfirm(companyName, measureLabel)}
        </p>
        <div className="mt-3">
          <FieldLabel htmlFor={fieldId}>{U.accountConfirmTypeLabel(companyName)}</FieldLabel>
          <input
            id={fieldId}
            type="text"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className={dialogInputClass}
          />
        </div>
        <FormError message={error} />
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
            disabled={busy || !matches}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cmp-flag px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {U.accountConfirmSubmit}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
