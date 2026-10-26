'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { createPromotion, updatePromotion } from '@/services/admin/AdminKeyPromotionService';
import type { KeyPromotionRequestDTO, KeyPromotionResponseDTO } from '@/types/keys/KeyPromotion.types';
import { CENTS_PER_KEY, ORDINARY_KEYS_PCT, colombiaInputToIso, isoToColombiaInput } from '@/utils/keys';
import { parseProsperityError } from '@/utils/prosperity';
import { FieldError, ProsperityModalShell, inputClass } from '@/components/admin/prosperity/ProsperityModalShell';

const NAME_MAX = 150;
const TERMS_MAX = 5000;
const COVERAGE_MIN = 51;
const COVERAGE_MAX = 70;
// Margen para "empieza ahora": el minuto elegido ya pasó cuando se envía el formulario.
const START_TOLERANCE_MS = 5 * 60_000;
const MIN_DURATION_MS = 60 * 60_000;
const PESOS_PER_KEY = CENTS_PER_KEY / 100;

const parsePesos = (raw: string) => parseInt(raw.replace(/\D/g, ''), 10) || 0;
const formatPesosInput = (raw: string) => {
  const n = parsePesos(raw);
  return n ? new Intl.NumberFormat('es-CO').format(n) : '';
};
const centsToPesosInput = (cents: number | null | undefined) =>
  cents ? new Intl.NumberFormat('es-CO').format(Math.round(cents / 100)) : '';

type FieldKey = keyof KeyPromotionRequestDTO;

// Campos que tienen un input donde mostrar su error.
const FIELD_KEYS: FieldKey[] = [
  'name',
  'coveragePct',
  'startsAt',
  'endsAt',
  'budgetCents',
  'maxExcessCentsPerUser',
  'termsText',
];

interface Props {
  /** Viene lleno al editar un borrador. */
  promotion?: KeyPromotionResponseDTO | null;
  onClose: () => void;
  onSaved: (promotion: KeyPromotionResponseDTO) => void;
}

export function KeyPromotionFormModal({ promotion, onClose, onSaved }: Props) {
  const editing = !!promotion;
  const [name, setName] = useState(promotion?.name ?? '');
  const [coveragePct, setCoveragePct] = useState(promotion ? String(promotion.coveragePct) : '');
  const [startsAt, setStartsAt] = useState(isoToColombiaInput(promotion?.startsAt));
  const [endsAt, setEndsAt] = useState(isoToColombiaInput(promotion?.endsAt));
  const [budgetInput, setBudgetInput] = useState(centsToPesosInput(promotion?.budgetCents));
  const [maxExcessInput, setMaxExcessInput] = useState(centsToPesosInput(promotion?.maxExcessCentsPerUser));
  const [termsText, setTermsText] = useState(promotion?.termsText ?? '');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const mutation = useMutation({
    mutationFn: (request: KeyPromotionRequestDTO) =>
      promotion ? updatePromotion(promotion.id, request) : createPromotion(request),
    onSuccess: onSaved,
    onError: (err) => {
      const { status, message, details } = parseProsperityError(err);
      if (status === 400 && Object.keys(details).length > 0) {
        // Los errores de un campo van junto a su input; los que no corresponden
        // a ninguno se muestran en el pie para que nunca queden invisibles.
        const known: Partial<Record<FieldKey, string>> = {};
        const others: string[] = [];
        Object.entries(details).forEach(([key, detail]) => {
          if ((FIELD_KEYS as string[]).includes(key)) known[key as FieldKey] = detail;
          else others.push(detail);
        });
        setFieldErrors(known);
        setFormError(others.length > 0 ? others.join(' ') : null);
      } else {
        setFormError(message);
      }
    },
  });

  // "Ahora" en hora de Colombia, fijado al abrir el modal: límite inferior de los selectores de fecha.
  const [minDateTime] = useState(() => isoToColombiaInput(new Date().toISOString()));

  const busy = mutation.isPending;
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);
  const clearField = (key: FieldKey) => setFieldErrors((f) => ({ ...f, [key]: undefined }));

  // Mismas validaciones del backend (que responde 400 si fallan).
  const validate = (): KeyPromotionRequestDTO | null => {
    const errors: Partial<Record<FieldKey, string>> = {};
    const trimmedName = name.trim();
    const pct = coveragePct ? Number(coveragePct) : NaN;
    const startsIso = colombiaInputToIso(startsAt);
    const endsIso = colombiaInputToIso(endsAt);
    const budgetPesos = parsePesos(budgetInput);
    const maxExcessPesos = parsePesos(maxExcessInput);

    if (!trimmedName) errors.name = 'El nombre es obligatorio.';
    else if (trimmedName.length > NAME_MAX) errors.name = `Máximo ${NAME_MAX} caracteres.`;

    if (!Number.isInteger(pct) || pct < COVERAGE_MIN || pct > COVERAGE_MAX) {
      errors.coveragePct = `Debe ser un número entero entre ${COVERAGE_MIN} y ${COVERAGE_MAX}.`;
    }

    const now = Date.now();
    const startsMs = startsIso ? new Date(startsIso).getTime() : null;
    const endsMs = endsIso ? new Date(endsIso).getTime() : null;

    if (startsMs == null) errors.startsAt = 'La fecha de inicio es obligatoria.';
    else if (startsMs < now - START_TOLERANCE_MS) {
      errors.startsAt = 'La fecha de inicio no puede estar en el pasado.';
    }

    if (endsMs == null) errors.endsAt = 'La fecha de fin es obligatoria.';
    else if (endsMs <= now) errors.endsAt = 'La fecha de fin ya pasó: la promoción nacería vencida.';
    else if (startsMs != null && endsMs <= startsMs) {
      errors.endsAt = 'La fecha de fin debe ser posterior a la de inicio.';
    } else if (startsMs != null && endsMs - startsMs < MIN_DURATION_MS) {
      // Los comerciales necesitan tiempo para aceptar antes de que termine.
      errors.endsAt = 'La promoción debe durar al menos 1 hora.';
    }

    if (budgetPesos <= 0) errors.budgetCents = 'El presupuesto debe ser mayor que 0.';
    else if (budgetPesos % PESOS_PER_KEY !== 0) {
      errors.budgetCents = `Debe ser múltiplo de $${PESOS_PER_KEY}: la cobertura se mide en llaves enteras.`;
    }

    if (maxExcessInput.trim() && maxExcessPesos <= 0) {
      errors.maxExcessCentsPerUser = 'Si lo defines, debe ser mayor que 0.';
    } else if (maxExcessPesos > 0 && maxExcessPesos % PESOS_PER_KEY !== 0) {
      errors.maxExcessCentsPerUser = `Debe ser múltiplo de $${PESOS_PER_KEY}: la cobertura se mide en llaves enteras.`;
    } else if (maxExcessPesos > 0 && budgetPesos > 0 && maxExcessPesos > budgetPesos) {
      errors.maxExcessCentsPerUser = 'No puede ser mayor que el presupuesto de la promoción.';
    }
    if (termsText.length > TERMS_MAX) errors.termsText = `Máximo ${TERMS_MAX} caracteres.`;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return null;

    return {
      name: trimmedName,
      coveragePct: pct,
      startsAt: startsIso!,
      endsAt: endsIso!,
      budgetCents: budgetPesos * 100,
      maxExcessCentsPerUser: maxExcessPesos > 0 ? maxExcessPesos * 100 : null,
      termsText: termsText.trim() || null,
    };
  };

  const handleSubmit = () => {
    if (busy) return;
    setFormError(null);
    const request = validate();
    if (request) mutation.mutate(request);
  };

  return (
    <ProsperityModalShell
      title={editing ? 'Editar promoción' : 'Nueva promoción de llaves'}
      subtitle={editing ? undefined : 'Se crea como borrador: no tiene efecto hasta que la autorices.'}
      onClose={onClose}
      busy={busy}
      footer={
        <>
        {/* En el pie para que se vea aunque el campo con error haya quedado fuera del scroll. */}
        {(formError || hasFieldErrors) && (
          <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {formError ?? 'Revisa los campos marcados en rojo.'}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-admin-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear borrador'}
          </button>
        </div>
        </>
      }
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value.slice(0, NAME_MAX));
            clearField('name');
          }}
          maxLength={NAME_MAX}
          disabled={busy}
          placeholder="Semana del 70"
          className={inputClass(!!fieldErrors.name)}
        />
        <FieldError message={fieldErrors.name} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Cobertura con llaves <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={coveragePct}
            onChange={(e) => {
              // Solo dígitos: con type="number" el navegador podía retener texto
              // inválido (p. ej. "70%") que React veía como vacío y no se podía corregir.
              setCoveragePct(e.target.value.replace(/\D/g, '').slice(0, 3));
              clearField('coveragePct');
            }}
            disabled={busy}
            placeholder="70"
            className={`${inputClass(!!fieldErrors.coveragePct)} pr-8`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Tope del precio que el usuario puede cubrir con llaves. Entre {COVERAGE_MIN} y {COVERAGE_MAX}; el
          ordinario es {ORDINARY_KEYS_PCT} %.
        </p>
        <FieldError message={fieldErrors.coveragePct} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Inicio <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            min={minDateTime}
            value={startsAt}
            onChange={(e) => {
              setStartsAt(e.target.value);
              clearField('startsAt');
            }}
            disabled={busy}
            className={inputClass(!!fieldErrors.startsAt)}
          />
          <FieldError message={fieldErrors.startsAt} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Fin <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            min={startsAt && startsAt > minDateTime ? startsAt : minDateTime}
            value={endsAt}
            onChange={(e) => {
              setEndsAt(e.target.value);
              clearField('endsAt');
            }}
            disabled={busy}
            className={inputClass(!!fieldErrors.endsAt)}
          />
          <FieldError message={fieldErrors.endsAt} />
        </div>
        <p className="-mt-2 text-xs text-gray-500 sm:col-span-2">Las fechas van en hora de Colombia.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Presupuesto <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={budgetInput}
            onChange={(e) => {
              setBudgetInput(formatPesosInput(e.target.value));
              clearField('budgetCents');
            }}
            disabled={busy}
            placeholder="0"
            className={`${inputClass(!!fieldErrors.budgetCents)} pl-7 pr-14`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">COP</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Tope de lo que los usuarios pueden cubrir con llaves <strong>por encima</strong> del {ORDINARY_KEYS_PCT} %
          ordinario. Al autorizar, este valor se aparta del Fondo de Fortalecimiento como garantía.
        </p>
        <FieldError message={fieldErrors.budgetCents} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Límite por usuario</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            type="text"
            inputMode="numeric"
            value={maxExcessInput}
            onChange={(e) => {
              setMaxExcessInput(formatPesosInput(e.target.value));
              clearField('maxExcessCentsPerUser');
            }}
            disabled={busy}
            placeholder="Sin límite"
            className={`${inputClass(!!fieldErrors.maxExcessCentsPerUser)} pl-7 pr-14`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">COP</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Opcional. Tope de lo que cada usuario puede cubrir con llaves <strong>por encima</strong> del{' '}
          {ORDINARY_KEYS_PCT} % ordinario durante toda la promoción.
        </p>
        <FieldError message={fieldErrors.maxExcessCentsPerUser} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Términos</label>
        <textarea
          value={termsText}
          onChange={(e) => {
            setTermsText(e.target.value.slice(0, TERMS_MAX));
            clearField('termsText');
          }}
          maxLength={TERMS_MAX}
          rows={4}
          disabled={busy}
          placeholder="Aplica solo a las ofertas incorporadas"
          className={inputClass(!!fieldErrors.termsText)}
        />
        <div className="flex justify-between">
          <FieldError message={fieldErrors.termsText} />
          <span className="ml-auto mt-1 text-xs text-gray-400">
            {termsText.length}/{TERMS_MAX}
          </span>
        </div>
      </div>
    </ProsperityModalShell>
  );
}
