'use client';

import { catalogOptionLabel } from '@/lib/taxProfile/catalog';
import type { CatalogEntry } from '@/types/commercial/TaxProfile.types';
import { Field, describedBy, fieldInputClass } from './Field';

const UNAVAILABLE = 'Aún no disponible';

// Las opciones salen del catálogo de la API (RN-4): aquí no hay ningún código escrito.
const onlyActive = (entries: readonly CatalogEntry[]) => entries.filter((e) => e.active);

export function CatalogSelect({
  id,
  label,
  entries,
  value,
  onChange,
  error,
  hint,
}: {
  id: string;
  label: string;
  entries: readonly CatalogEntry[];
  value: string;
  onChange: (code: string) => void;
  error?: string;
  hint?: string;
}) {
  const options = onlyActive(entries);
  const unavailable = options.length === 0;
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <select
        id={id}
        value={value}
        disabled={unavailable}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(error), Boolean(hint))}
        className={fieldInputClass(Boolean(error))}
      >
        <option value="">{unavailable ? UNAVAILABLE : 'Selecciona una opción'}</option>
        {options.map((entry) => (
          <option key={entry.id} value={entry.code}>
            {catalogOptionLabel(entry)}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CatalogMultiSelect({
  id,
  legend,
  entries,
  value,
  onChange,
  error,
}: {
  id: string;
  legend: string;
  entries: readonly CatalogEntry[];
  value: readonly string[];
  onChange: (codes: string[]) => void;
  error?: string;
}) {
  const options = onlyActive(entries);

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  };

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-2 text-sm font-semibold text-gray-700">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-gray-500">{UNAVAILABLE}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {options.map((entry) => (
            <label key={entry.id} className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={value.includes(entry.code)}
                onChange={() => toggle(entry.code)}
                className="mt-0.5 h-4 w-4"
              />
              <span>{catalogOptionLabel(entry)}</span>
            </label>
          ))}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
