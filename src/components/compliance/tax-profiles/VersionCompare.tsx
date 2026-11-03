'use client';

import { Btn } from '@/components/compliance/ui/primitives';
import { diffSection, SECTION_ORDER, type DiffItem, type DiffRow } from '@/lib/compliance/taxProfileFields';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { TAX_PROFILE_SECTION_TITLES } from '@/lib/labels/taxCompliance';
import type { GroupedCatalog } from '@/lib/taxProfile/catalog';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { TaxProfileVersionDetail } from '@/types/commercial/TaxProfile.types';

interface VersionCompareProps {
  older: TaxProfileVersionDetail;
  current: TaxProfileVersionDetail;
  catalog: GroupedCatalog;
  onBack: () => void;
}

const ITEM_MARK: Record<Exclude<DiffItem['status'], 'same'>, string> = {
  added: T.added,
  removed: T.removed,
  changed: T.changed,
};

function Mark({ children }: { children: string }) {
  return (
    <span className="mr-2 inline-block rounded border border-cmp-hold/40 bg-cmp-hold-bg px-1.5 py-0.5 text-[11px] font-semibold text-cmp-hold">
      {children}
    </span>
  );
}

function RowView({ row, older }: { row: DiffRow; older: TaxProfileVersionDetail }) {
  return (
    <div className={`rounded-lg px-3 py-2 text-sm ${row.changed ? 'bg-cmp-hold-bg' : ''}`}>
      <p className="cmp-label text-cmp-mute">
        {row.changed && <Mark>{T.changed}</Mark>}
        {row.label}
      </p>
      {row.kind === 'value' ? (
        <div className="mt-1 grid gap-2 md:grid-cols-2">
          <p className="break-words text-cmp-ink">
            <span className="mr-1 text-xs font-semibold text-cmp-slate md:sr-only">
              {T.olderValueLabel(older.versionNumber)}:
            </span>
            {row.before}
          </p>
          <p className="break-words text-cmp-ink">
            <span className="mr-1 text-xs font-semibold text-cmp-slate md:sr-only">
              {T.currentValueLabel()}:
            </span>
            {row.after}
          </p>
        </div>
      ) : row.items.length === 0 ? (
        <p className="mt-1 text-cmp-ink">{T.noValue}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {row.items.map((item) => (
            <li key={item.key} className="break-words text-cmp-ink">
              {item.status !== 'same' && <Mark>{ITEM_MARK[item.status]}</Mark>}
              {item.status === 'changed' ? (
                <>
                  <span className="text-cmp-slate">{T.before}: </span>
                  {item.before}
                  <span className="text-cmp-slate"> · {T.after}: </span>
                  {item.after}
                </>
              ) : (
                item.text
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Compara dos versiones de la ficha lado a lado. Solo lectura: sin botones de revisión (RN-2, CA-11).
export function VersionCompare({ older, current, catalog, onBack }: VersionCompareProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-2 text-sm font-semibold text-cmp-ink md:grid-cols-2">
          <p>{T.olderColumn(older.versionNumber, formatBogotaDateTime(older.submittedAt))}</p>
          <p>{T.currentColumn(current.versionNumber)}</p>
        </div>
        <Btn size="sm" onClick={onBack}>
          {T.backToReview}
        </Btn>
      </div>

      {SECTION_ORDER.map((section) => {
        const rows = diffSection(section, older, current, catalog);
        const anyChange = rows.some((r) => r.changed);
        return (
          <section
            key={section}
            aria-label={TAX_PROFILE_SECTION_TITLES[section]}
            className="space-y-2 rounded-xl border border-cmp-rule bg-white p-4"
          >
            <h3 className="text-base font-semibold text-cmp-ink">
              {TAX_PROFILE_SECTION_TITLES[section]}
              {!anyChange && <span className="ml-2 text-xs font-normal text-cmp-slate">{T.unchanged}</span>}
            </h3>
            {rows.map((row) => (
              <RowView key={row.key} row={row} older={older} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
