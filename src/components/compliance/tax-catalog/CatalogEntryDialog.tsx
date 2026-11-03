'use client';

import { useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DialogFooter, dialogInputClass, FieldError, FieldLabel, FormError } from '@/components/compliance/ui/dialogParts';
import { Dialog } from '@/components/shared/Dialog';
import { useCreateCatalogEntry } from '@/hooks/compliance/useComplianceTaxProfiles';
import { actionErrorMessage } from '@/lib/compliance/loadErrors';
import {
  buildCatalogEntryBody,
  catalogEntrySchema,
  type CatalogEntryFormValues,
} from '@/lib/compliance/taxCatalog';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { TAX_CATALOG_TYPE_LABELS } from '@/lib/labels/taxCompliance';
import type { TaxCatalogType } from '@/types/commercial/TaxProfile.types';

// El tipo es el de la pestaña activa; un código no se edita (RN-10).
export function CatalogEntryDialog({ catalogType, onClose }: { catalogType: TaxCatalogType; onClose: () => void }) {
  const baseId = useId();
  const submittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const mutation = useCreateCatalogEntry();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CatalogEntryFormValues>({
    resolver: zodResolver(catalogEntrySchema),
    defaultValues: { code: '', label: '', legalBasis: '', validFrom: '' },
  });
  const busy = isSubmitting || mutation.isPending;

  const onSubmit = async (values: CatalogEntryFormValues) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitError(null);
    try {
      await mutation.mutateAsync(buildCatalogEntryBody(catalogType, values));
      onClose();
    } catch (error) {
      setSubmitError(actionErrorMessage(error));
    } finally {
      submittingRef.current = false;
    }
  };

  const field = (
    name: keyof CatalogEntryFormValues,
    label: string,
    kind: 'text' | 'date' | 'textarea',
    max?: number,
  ) => {
    const id = `${baseId}-${name}`;
    const error = errors[name]?.message;
    const common = {
      id,
      maxLength: max,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? `${id}-error` : undefined,
      className: dialogInputClass,
      ...register(name),
    };
    return (
      <div>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {kind === 'textarea' ? <textarea rows={3} {...common} /> : <input type={kind} {...common} />}
        <FieldError id={`${id}-error`} message={error} />
      </div>
    );
  };

  return (
    <Dialog open title={`${U.addCodeTitle} · ${TAX_CATALOG_TYPE_LABELS[catalogType]}`} onClose={onClose} dismissible={!busy}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <p className="text-xs text-cmp-slate">{A.catalogImmutableNote}</p>
        {field('code', U.catalogCode, 'text', 30)}
        {field('label', U.catalogLabel, 'text', 200)}
        {field('legalBasis', U.catalogBasis, 'textarea', 500)}
        {field('validFrom', U.catalogFrom, 'date')}
        <FormError message={submitError} />
        <DialogFooter busy={busy} onClose={onClose} submitLabel={U.catalogSubmit} />
      </form>
    </Dialog>
  );
}
