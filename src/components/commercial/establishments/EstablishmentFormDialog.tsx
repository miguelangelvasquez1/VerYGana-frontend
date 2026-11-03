'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Dialog } from '@/components/shared/Dialog';
import { Field, describedBy, fieldInputClass } from '@/components/commercial/tax-profile/Field';
import { useCreateEstablishment } from '@/hooks/commercial/useTaxProfile';
import { useDepartments, useMunicipalities } from '@/hooks/useLocation';
import { readApiError } from '@/lib/api/apiError';
import { ESTABLISHMENT_RELATION_LABELS } from '@/lib/labels/taxCompliance';
import {
  establishmentSchema,
  type EstablishmentFormValues,
} from '@/lib/taxProfile/establishmentSchema';
import type { EstablishmentRelation } from '@/types/commercial/TaxProfile.types';

const RELATIONS = Object.keys(ESTABLISHMENT_RELATION_LABELS) as EstablishmentRelation[];

function EstablishmentForm({ onClose }: { onClose: () => void }) {
  const createEstablishment = useCreateEstablishment();
  const [departmentCode, setDepartmentCode] = useState('');
  const departments = useDepartments();
  const municipalities = useMunicipalities(departmentCode || null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EstablishmentFormValues>({
    resolver: zodResolver(establishmentSchema),
    defaultValues: { name: '', address: '', municipalityCode: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createEstablishment.mutateAsync({
        name: values.name.trim(),
        address: values.address.trim(),
        municipalityCode: values.municipalityCode,
        relation: values.relation,
      });
      toast.success('Sede registrada');
      onClose();
    } catch (error) {
      toast.error(readApiError(error).message ?? 'No pudimos guardar la sede. Intenta de nuevo');
    }
  });

  const busy = isSubmitting || createEstablishment.isPending;

  return (
    <form
      onSubmit={(e) => {
        // El portal propaga `submit` por el árbol de React: sin esto envía la ficha que lo contiene.
        e.stopPropagation();
        void onSubmit(e);
      }}
      noValidate className="flex flex-col gap-4">
      <Field id="est-name" label="Nombre de la sede" required error={errors.name?.message}>
        <input
          id="est-name"
          type="text"
          autoComplete="off"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy('est-name', Boolean(errors.name), false)}
          className={fieldInputClass(Boolean(errors.name))}
          {...register('name')}
        />
      </Field>

      <Field id="est-address" label="Dirección" required error={errors.address?.message}>
        <input
          id="est-address"
          type="text"
          autoComplete="off"
          aria-invalid={errors.address ? true : undefined}
          aria-describedby={describedBy('est-address', Boolean(errors.address), false)}
          className={fieldInputClass(Boolean(errors.address))}
          {...register('address')}
        />
      </Field>

      <Field id="est-department" label="Departamento" required>
        <select
          id="est-department"
          value={departmentCode}
          onChange={(event) => {
            // Al cambiar de departamento se limpia el municipio.
            setDepartmentCode(event.target.value);
            setValue('municipalityCode', '', { shouldValidate: false });
          }}
          className={fieldInputClass(false)}
        >
          <option value="">Selecciona un departamento</option>
          {departments.departments.map((department) => (
            <option key={department.code} value={department.code}>
              {department.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="est-municipality"
        label="Municipio"
        required
        error={errors.municipalityCode?.message}
      >
        <select
          id="est-municipality"
          disabled={!departmentCode || municipalities.isLoading}
          aria-invalid={errors.municipalityCode ? true : undefined}
          aria-describedby={describedBy('est-municipality', Boolean(errors.municipalityCode), false)}
          className={fieldInputClass(Boolean(errors.municipalityCode))}
          {...register('municipalityCode')}
        >
          <option value="">
            {departmentCode ? 'Selecciona un municipio' : 'Elige primero el departamento'}
          </option>
          {municipalities.municipalities.map((municipality) => (
            <option key={municipality.code} value={municipality.code}>
              {municipality.name}
            </option>
          ))}
        </select>
      </Field>

      <Field id="est-relation" label="Relación con la sede" required error={errors.relation?.message}>
        <select
          id="est-relation"
          defaultValue=""
          aria-invalid={errors.relation ? true : undefined}
          aria-describedby={describedBy('est-relation', Boolean(errors.relation), false)}
          className={fieldInputClass(Boolean(errors.relation))}
          {...register('relation')}
        >
          <option value="">Selecciona una opción</option>
          {RELATIONS.map((relation) => (
            <option key={relation} value={relation}>
              {ESTABLISHMENT_RELATION_LABELS[relation]}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[#03548C] px-5 py-2 text-sm font-semibold text-white hover:bg-[#023e69] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Guardando…' : 'Agregar sede'}
        </button>
      </div>
    </form>
  );
}

export function EstablishmentFormDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} title="Agregar sede" onClose={onClose}>
      <EstablishmentForm onClose={onClose} />
    </Dialog>
  );
}
