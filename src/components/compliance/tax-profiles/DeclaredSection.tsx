import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { sectionFields } from '@/lib/compliance/taxProfileFields';
import { establishmentHistory } from '@/lib/compliance/taxProfileReview';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import {
  ESTABLISHMENT_RELATION_LABELS,
  INCOME_CONCEPT_LABELS,
  INCOME_SCOPE_LABELS,
  TAX_PROFILE_SECTION_TITLES,
} from '@/lib/labels/taxCompliance';
import { formatCents } from '@/lib/money/cents';
import type { GroupedCatalog } from '@/lib/taxProfile/catalog';
import { formatBogotaDateTime, formatPlainDate } from '@/lib/utils/dateDisplay';
import type {
  Establishment,
  TaxProfileSection,
  TaxProfileVersionDetail,
} from '@/types/commercial/TaxProfile.types';

interface DeclaredSectionProps {
  section: TaxProfileSection;
  version: TaxProfileVersionDetail;
  catalog: GroupedCatalog;
  establishments: readonly Establishment[];
  // El enlace "Ver RUT" lo arma quien tiene el expediente; solo se pinta en a).
  rutLink?: ReactNode;
}

// Lo declarado en una sección. Los códigos se ven como "código — etiqueta" si el catálogo cargó (RN-12).
export function DeclaredSection({ section, version, catalog, establishments, rutLink }: DeclaredSectionProps) {
  const rows = sectionFields(section, version, catalog).filter(
    // En e) la lista se reemplaza por la tabla de CA-7.
    (row) => !(section === 'E_INCOME' && row.key === 'income'),
  );

  return (
    <div className="min-w-0 space-y-3">
      <h3 className="text-base font-semibold text-cmp-ink">{TAX_PROFILE_SECTION_TITLES[section]}</h3>

      {rows.length > 0 && (
        <dl className="space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.key}>
              <dt className="cmp-label text-cmp-mute">{row.label}</dt>
              <dd className="break-words text-cmp-ink">
                {row.kind === 'value' ? (
                  row.value
                ) : row.items.length === 0 ? (
                  T.noValue
                ) : (
                  <ul className="list-disc space-y-0.5 pl-5">
                    {row.items.map((item) => (
                      <li key={item.key}>{item.text}</li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {section === 'A_RUT' && rutLink}

      {section === 'E_INCOME' && (
        <div className="overflow-x-auto rounded-lg border border-cmp-rule">
          <table className="w-full text-left text-sm">
            <thead className="bg-cmp-rule-soft/50">
              <tr>
                {[T.columnConcept, T.columnPeriod, T.columnAmount, T.columnScope, T.columnNotes].map((h) => (
                  <th key={h} className="cmp-label whitespace-nowrap px-3 py-2 text-cmp-mute">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-cmp-rule-soft">
              {version.incomeReports.map((r) => (
                <tr key={`${r.concept}|${r.periodStart}|${r.periodEnd}`}>
                  <td className="px-3 py-2">{INCOME_CONCEPT_LABELS[r.concept] ?? r.concept}</td>
                  <td className="px-3 py-2">
                    {formatPlainDate(r.periodStart)} – {formatPlainDate(r.periodEnd)}
                  </td>
                  <td className="cmp-mono whitespace-nowrap px-3 py-2">{formatCents(r.amountCents)}</td>
                  <td className="px-3 py-2">
                    {INCOME_SCOPE_LABELS[r.scope] ?? r.scope}
                    {r.supportDocumentId !== null && (
                      <span className="block text-xs text-cmp-slate">{T.incomeSupported}</span>
                    )}
                  </td>
                  <td className="break-words px-3 py-2">{r.notes?.trim() || T.noValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section === 'F_ESTABLISHMENTS' && establishments.length > 0 && (
        <div>
          <p className="cmp-label text-cmp-mute">{T.establishmentsHistory}</p>
          <ul className="mt-1 space-y-2">
            {establishmentHistory(establishments).map((e) => (
              <li key={e.id} className="rounded-lg border border-cmp-rule px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-words font-medium text-cmp-ink">{e.name}</span>
                  {e.status === 'CLOSED' && <StatusBadge label={T.closedLabel} tone="gray" />}
                </div>
                <p className="break-words text-cmp-slate">
                  {e.address} · {e.municipalityName} · {ESTABLISHMENT_RELATION_LABELS[e.relation]}
                </p>
                {e.status === 'CLOSED' && (
                  <p className="break-words text-xs text-cmp-slate">
                    {T.closedOn(formatBogotaDateTime(e.closedAt), e.closedReason ?? T.noValue)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
