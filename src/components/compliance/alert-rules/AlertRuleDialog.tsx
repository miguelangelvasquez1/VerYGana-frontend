'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useCreateAlertRule } from '@/hooks/compliance/useComplianceAlerts';
import {
  ALERT_RULE_DEFAULTS,
  alertRuleSchema,
  buildRuleBody,
  nextVersionFor,
  type AlertRuleFormValues,
} from '@/lib/compliance/alertRules';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import type { AlertRule } from '@/types/compliance/InformationRequest.types';

// Los tres umbrales arrancan vacíos: el oficial los define, no la pantalla (RN-9).
// Con `fixedCode` (botón "Nueva versión" de un grupo) el código queda fijo y solo se define la versión nueva.
export function AlertRuleDialog({
  rules,
  fixedCode,
  onClose,
}: {
  rules: readonly AlertRule[];
  fixedCode?: string;
  onClose: () => void;
}) {
  const baseId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateAlertRule();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AlertRuleFormValues>({
    resolver: zodResolver(alertRuleSchema),
    defaultValues: { ...ALERT_RULE_DEFAULTS, code: fixedCode ?? ALERT_RULE_DEFAULTS.code },
  });
  const busy = isSubmitting || mutation.isPending;
  const nextVersion = nextVersionFor(watch('code').trim(), rules);

  const onSubmit = async (values: AlertRuleFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync(buildRuleBody(values));
      onClose();
    } catch (error) {
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  const field = (name: keyof AlertRuleFormValues, label: string, kind: 'input' | 'textarea', max?: number) => {
    const id = `${baseId}-${name}`;
    const error = errors[name]?.message;
    const common = {
      id,
      maxLength: max,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-error` : undefined,
      className: dialogInputClass,
      readOnly: name === 'code' && fixedCode !== undefined ? true : undefined,
      ...register(name),
    };
    return (
      <div>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {kind === 'textarea' ? (
          <textarea rows={3} {...common} />
        ) : (
          <input type="text" inputMode={name === 'code' || name === 'description' ? 'text' : 'decimal'} {...common} />
        )}
        <FieldError id={`${id}-error`} message={error} />
      </div>
    );
  };

  return (
    <Dialog open title={U.ruleDialogTitle} onClose={onClose} dismissible={!busy}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <p className="text-xs text-cmp-slate">{A.ruleTypeLabel}</p>
        <p className="text-xs text-cmp-slate">{A.ruleScopeNote}</p>
        {field('code', U.ruleCode, 'input', 50)}
        {nextVersion !== null && (
          <p role="status" className="rounded-lg bg-cmp-hold-bg px-3 py-2 text-sm text-cmp-hold">
            {A.newRuleVersionNotice(nextVersion)}
          </p>
        )}
        {field('description', U.ruleDescription, 'textarea', 500)}
        {field('legalBasis', U.ruleBasis, 'textarea', 500)}
        {field('windowDays', U.ruleWindowDays, 'input')}
        {field('minGrowthPct', U.ruleGrowthPct, 'input')}
        {field('minCurrentSales', U.ruleMinSales, 'input')}
        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.ruleSubmit} />
      </form>
    </Dialog>
  );
}
