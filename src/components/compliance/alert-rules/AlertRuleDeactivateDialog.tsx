'use client';

import { useRef, useState } from 'react';

import { DialogFooter, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useDeactivateAlertRule } from '@/hooks/compliance/useComplianceAlerts';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import type { AlertRule } from '@/types/compliance/InformationRequest.types';

export function AlertRuleDeactivateDialog({ rule, onClose }: { rule: AlertRule; onClose: () => void }) {
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useDeactivateAlertRule();
  const busy = mutation.isPending;

  const onSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync(rule.id);
      onClose();
    } catch (error) {
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <Dialog open title={U.deactivateTitle} onClose={onClose} dismissible={!busy}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
        noValidate
      >
        <p className="text-sm text-cmp-ink">{U.deactivateConfirm(rule.code, rule.version)}</p>
        <p className="mt-2 text-xs text-cmp-slate">{A.ruleScopeNote}</p>
        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.deactivate} danger />
      </form>
    </Dialog>
  );
}
