import {
  INCOME_CONCEPT_LABELS,
  INCOME_SCOPE_LABELS,
  TAX_PROFILE_SECTION_TITLES,
} from '@/lib/labels/taxCompliance';
import { formatCents } from '@/lib/money/cents';
import { displayCode, type GroupedCatalog } from '@/lib/taxProfile/catalog';
import { sortVersionsDesc } from '@/lib/taxProfile/display';
import { formatPlainDate } from '@/lib/utils/dateDisplay';
import type {
  TaxProfileSection,
  TaxProfileVersionDetail,
  VersionSummary,
} from '@/types/commercial/TaxProfile.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
// Un solo modelo de campos por sección: sirve para pintar lo declarado y para comparar versiones.

export const SECTION_ORDER = Object.keys(TAX_PROFILE_SECTION_TITLES) as TaxProfileSection[];

export interface ListItem {
  key: string;
  text: string;
}
export type FieldRow =
  | { kind: 'value'; key: string; label: string; value: string }
  | { kind: 'list'; key: string; label: string; items: ListItem[] };

export type ItemStatus = 'added' | 'removed' | 'changed' | 'same';
export interface DiffItem {
  key: string;
  status: ItemStatus;
  text: string;      // el texto de la versión vigente (o de la anterior si se quitó)
  before?: string;   // solo en `changed`
  after?: string;    // solo en `changed`
}
export type DiffRow =
  | { kind: 'value'; key: string; label: string; before: string; after: string; changed: boolean }
  | { kind: 'list'; key: string; label: string; items: DiffItem[]; changed: boolean };

const EMPTY_VALUE = '—';

function text(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : EMPTY_VALUE;
}

function yesNo(value: boolean): string {
  return value ? 'Sí' : 'No';
}

function value(key: string, label: string, v: string): FieldRow {
  return { kind: 'value', key, label, value: v };
}

function list(key: string, label: string, items: ListItem[]): FieldRow {
  return { kind: 'list', key, label, items };
}

// `catalog` es `groupCatalog(entries ?? [])`: a cada campo se le pasa la lista de su tipo, porque en la
// API el código es único por tipo, no global.
export function sectionFields(
  section: TaxProfileSection,
  version: TaxProfileVersionDetail,
  catalog: GroupedCatalog,
): FieldRow[] {
  switch (section) {
    case 'A_RUT':
      return [
        value(
          'rutDocument',
          'Documento RUT',
          version.rutDocumentId !== null ? 'Vinculado' : 'Sin documento RUT vinculado',
        ),
        list(
          'rutResponsibilities',
          'Responsabilidades del RUT',
          version.rutResponsibilityCodes.map((code) => ({
            key: code,
            text: displayCode(code, catalog.RUT_RESPONSIBILITY),
          })),
        ),
      ];
    case 'B_REGIME_ACTIVITIES':
      return [
        value('regime', 'Régimen', displayCode(version.regimeCode, catalog.REGIME)),
        list(
          'activities',
          'Actividades',
          version.activities.map((a) => ({
            key: a.ciiuCode,
            text: `CIIU ${a.ciiuCode}${a.main ? ' (principal)' : ''}${a.description?.trim() ? ` · ${a.description.trim()}` : ''}`,
          })),
        ),
      ];
    case 'C_VAT_INC':
      return [
        value('vatCondition', 'Condición frente al IVA', displayCode(version.vatConditionCode, catalog.VAT_CONDITION)),
        value('incCondition', 'Condición frente al INC', displayCode(version.incConditionCode, catalog.INC_CONDITION)),
        value('taxConditionScope', 'Productos o servicios a los que aplica', text(version.taxConditionScope)),
      ];
    case 'D_INVOICING_WITHHOLDING':
      return [
        value('invoicingObligated', 'Obligado a facturar', yesNo(version.invoicingObligated)),
        value(
          'invoicingMethod',
          'Método de facturación',
          displayCode(version.invoicingMethodCode, catalog.INVOICING_METHOD),
        ),
        value('invoicingNotes', 'Notas sobre la facturación', text(version.invoicingNotes)),
        value('withholdingAgent', 'Agente de retención', yesNo(version.withholdingAgent)),
        value('withholdingNotes', 'Notas sobre la retención', text(version.withholdingNotes)),
      ];
    case 'E_INCOME':
      return [
        list(
          'income',
          'Ingresos o ventas',
          version.incomeReports.map((r) => ({
            key: `${r.concept}|${r.periodStart}|${r.periodEnd}`,
            text: [
              INCOME_CONCEPT_LABELS[r.concept] ?? r.concept,
              `del ${formatPlainDate(r.periodStart)} al ${formatPlainDate(r.periodEnd)}`,
              formatCents(r.amountCents),
              INCOME_SCOPE_LABELS[r.scope] ?? r.scope,
              ...(r.supportDocumentId !== null ? ['Con soporte'] : []),
              ...(r.notes?.trim() ? [r.notes.trim()] : []),
            ].join(' · '),
          })),
        ),
      ];
    case 'F_ESTABLISHMENTS':
      return [value('establishmentsCount', 'Sedes declaradas al enviar', String(version.establishmentsCount))];
    case 'G_GROWTH_CAPACITY':
      return [
        value('currentCapacity', 'Capacidad actual', text(version.currentCapacity)),
        value('growthScenario', 'Escenario de crecimiento', text(version.growthScenario)),
        value('growthMeasures', 'Medidas para crecer', text(version.growthMeasures)),
      ];
    case 'H_ADVISORY':
      return [
        value('hasAdvisor', 'Tiene asesor contable', yesNo(version.hasAccountingAdvisor)),
        ...(version.hasAccountingAdvisor
          ? [value('advisorScope', 'Alcance de la asesoría', text(version.advisorScope))]
          : []),
      ];
  }
}

function diffList(current: ListItem[], older: ListItem[]): DiffItem[] {
  const olderByKey = new Map(older.map((item) => [item.key, item]));
  const currentKeys = new Set(current.map((item) => item.key));
  const items: DiffItem[] = current.map((item) => {
    const before = olderByKey.get(item.key);
    if (!before) return { key: item.key, status: 'added', text: item.text };
    if (before.text === item.text) return { key: item.key, status: 'same', text: item.text };
    return { key: item.key, status: 'changed', text: item.text, before: before.text, after: item.text };
  });
  // Los quitados van al final.
  for (const item of older) {
    if (!currentKeys.has(item.key)) items.push({ key: item.key, status: 'removed', text: item.text });
  }
  return items;
}

// Compara dos versiones de una sección con el mismo catálogo, para que una etiqueta no altere el diff.
// Una fila que solo existe en una de las dos (alcance de la asesoría) cuenta como cambiada.
export function diffSection(
  section: TaxProfileSection,
  older: TaxProfileVersionDetail,
  current: TaxProfileVersionDetail,
  catalog: GroupedCatalog,
): DiffRow[] {
  const currentRows = sectionFields(section, current, catalog);
  const olderRows = sectionFields(section, older, catalog);
  const olderByKey = new Map(olderRows.map((r) => [r.key, r]));
  const currentKeys = new Set(currentRows.map((r) => r.key));

  const diffOne = (now: FieldRow | undefined, before: FieldRow | undefined): DiffRow => {
    const base = (now ?? before) as FieldRow;
    if (base.kind === 'list') {
      const nowItems = now && now.kind === 'list' ? now.items : [];
      const beforeItems = before && before.kind === 'list' ? before.items : [];
      const items = diffList(nowItems, beforeItems);
      const missingSide = !now || !before;
      return {
        kind: 'list',
        key: base.key,
        label: base.label,
        items,
        changed: missingSide || items.some((i) => i.status !== 'same'),
      };
    }
    const nowValue = now && now.kind === 'value' ? now.value : EMPTY_VALUE;
    const beforeValue = before && before.kind === 'value' ? before.value : EMPTY_VALUE;
    return {
      kind: 'value',
      key: base.key,
      label: base.label,
      before: beforeValue,
      after: nowValue,
      changed: !now || !before || nowValue !== beforeValue,
    };
  };

  const rows = currentRows.map((r) => diffOne(r, olderByKey.get(r.key)));
  for (const r of olderRows) {
    if (!currentKeys.has(r.key)) rows.push(diffOne(undefined, r));
  }
  return rows;
}

// Las versiones distintas de la vigente, de la más reciente a la más antigua. Vacío: el selector no aparece.
export function comparableVersions(
  versions: readonly VersionSummary[],
  currentVersion: number,
): VersionSummary[] {
  return sortVersionsDesc(versions).filter((v) => v.versionNumber !== currentVersion);
}
