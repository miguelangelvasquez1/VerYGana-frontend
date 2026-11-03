import type { CatalogEntry, TaxCatalogType } from '@/types/commercial/TaxProfile.types';

export const CATALOG_TYPES: readonly TaxCatalogType[] = [
  'REGIME',
  'RUT_RESPONSIBILITY',
  'VAT_CONDITION',
  'INC_CONDITION',
  'INVOICING_METHOD',
];

export type GroupedCatalog = Record<TaxCatalogType, CatalogEntry[]>;

// Agrupa por tipo conservando el orden de la API. Los cinco tipos siempre están presentes
// (vacíos si no hay entradas) para que el selector pueda deshabilitarse sin comprobar nada más.
export function groupCatalog(entries: readonly CatalogEntry[]): GroupedCatalog {
  const grouped: GroupedCatalog = {
    REGIME: [],
    RUT_RESPONSIBILITY: [],
    VAT_CONDITION: [],
    INC_CONDITION: [],
    INVOICING_METHOD: [],
  };
  for (const entry of entries) grouped[entry.catalogType].push(entry);
  return grouped;
}

export function catalogOptionLabel(entry: CatalogEntry): string {
  return `${entry.code} — ${entry.label}`;
}

// Para las vistas de lectura: "código — etiqueta" si el código está en el catálogo, si no el
// código solo. Sin código, una raya.
export function displayCode(
  code: string | null | undefined,
  entries: readonly CatalogEntry[] = [],
): string {
  if (!code) return '—';
  const entry = entries.find((e) => e.code === code);
  return entry ? catalogOptionLabel(entry) : code;
}
