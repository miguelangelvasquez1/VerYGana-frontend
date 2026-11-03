'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';

import { CatalogEntryDialog } from '@/components/compliance/tax-catalog/CatalogEntryDialog';
import { RetireCatalogEntryDialog } from '@/components/compliance/tax-catalog/RetireCatalogEntryDialog';
import {
  Btn,
  EmptyState,
  ErrorState,
  Ledger,
  LedgerBody,
  LedgerHead,
  LedgerRow,
  LedgerTable,
  PanelHeader,
  SkeletonRows,
  Td,
  Th,
} from '@/components/compliance/ui/primitives';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useComplianceTaxCatalog } from '@/hooks/compliance/useComplianceTaxProfiles';
import { readApiError } from '@/lib/api/apiError';
import { catalogPath, nextTabIndex } from '@/lib/compliance/routes';
import { COMPLIANCE_ACTION_TEXTS as A, COMPLIANCE_ACTION_UI as U } from '@/lib/labels/complianceActions';
import { TAX_CATALOG_TYPE_LABELS } from '@/lib/labels/taxCompliance';
import { CATALOG_TYPES, groupCatalog } from '@/lib/taxProfile/catalog';
import { formatPlainDate } from '@/lib/utils/dateDisplay';
import type { CatalogEntry, TaxCatalogType } from '@/types/commercial/TaxProfile.types';

const PANEL_ID = 'tax-catalog-panel';
const tabId = (type: TaxCatalogType) => `tax-catalog-tab-${type}`;

// Catálogo tributario por tipo. Solo se agrega y se retira: no hay editar ni borrar (RN-10).
export function TaxCatalog({ tab }: { tab: TaxCatalogType }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [adding, setAdding] = useState(false);
  const [retiring, setRetiring] = useState<CatalogEntry | null>(null);
  const query = useComplianceTaxCatalog();

  const select = (type: TaxCatalogType) => {
    startTransition(() => router.replace(catalogPath(type), { scroll: false }));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextTabIndex(index, event.key, CATALOG_TYPES.length);
    if (next === null) return;
    event.preventDefault();
    select(CATALOG_TYPES[next]);
    refs.current[next]?.focus();
  };

  const forbidden = query.isError && readApiError(query.error).status === 403;
  const entries = query.data ? groupCatalog(query.data)[tab] : [];

  return (
    <div className="space-y-5">
      <PanelHeader
        eyebrow={U.catalogEyebrow}
        title={U.catalogTitle}
        actions={
          <Btn variant="primary" onClick={() => setAdding(true)}>
            {U.addCode}
          </Btn>
        }
      />
      <p className="text-sm text-cmp-slate">{A.catalogImmutableNote}</p>

      <div className="overflow-x-auto border-b border-cmp-rule">
        <div role="tablist" aria-label={U.catalogTabsLabel} className="flex min-w-max gap-1">
          {CATALOG_TYPES.map((type, index) => {
            const selected = type === tab;
            return (
              <button
                key={type}
                ref={(el) => {
                  refs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={tabId(type)}
                aria-selected={selected}
                aria-controls={PANEL_ID}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(type)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`cursor-pointer whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-cmp-cian ${
                  selected
                    ? 'border-cmp-cian text-cmp-ink'
                    : 'border-transparent text-cmp-slate hover:text-cmp-ink'
                }`}
              >
                {TAX_CATALOG_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(tab)} tabIndex={0}>
        {query.isPending ? (
          <SkeletonRows rows={4} cols={5} />
        ) : query.isError && query.data === undefined ? (
          forbidden ? (
            <EmptyState icon={BookOpen} title={A.forbidden} />
          ) : (
            <ErrorState message={A.catalogLoadError} onRetry={() => void query.refetch()} />
          )
        ) : entries.length === 0 ? (
          <div className="space-y-3">
            <EmptyState icon={BookOpen} title={A.catalogEmpty} />
            <div className="flex justify-center">
              <Btn variant="primary" onClick={() => setAdding(true)}>
                {U.addCode}
              </Btn>
            </div>
          </div>
        ) : (
          <Ledger>
            <LedgerTable>
              <LedgerHead>
                <Th>{U.catalogCode}</Th>
                <Th>{U.catalogLabel}</Th>
                <Th>{U.catalogBasis}</Th>
                <Th>{U.catalogFrom}</Th>
                <Th>{U.catalogTo}</Th>
                <Th>{U.catalogColumnState}</Th>
                <Th>
                  <span className="sr-only">{U.retire}</span>
                </Th>
              </LedgerHead>
              <LedgerBody>
                {entries.map((entry, index) => (
                  <LedgerRow key={entry.id} index={index}>
                    <Td className="cmp-mono font-medium text-cmp-ink">{entry.code}</Td>
                    <Td>{entry.label}</Td>
                    <Td className="max-w-xs break-words text-cmp-slate">{entry.legalBasis}</Td>
                    <Td className="whitespace-nowrap text-cmp-slate">{formatPlainDate(entry.validFrom)}</Td>
                    <Td className="whitespace-nowrap text-cmp-slate">
                      {entry.validTo ? formatPlainDate(entry.validTo) : U.dash}
                    </Td>
                    <Td>
                      <StatusBadge
                        label={entry.active ? U.catalogActive : U.catalogRetired}
                        tone={entry.active ? 'green' : 'gray'}
                      />
                    </Td>
                    <Td align="right">
                      {entry.active && (
                        <Btn size="sm" variant="reject" onClick={() => setRetiring(entry)}>
                          {U.retire}
                        </Btn>
                      )}
                    </Td>
                  </LedgerRow>
                ))}
              </LedgerBody>
            </LedgerTable>
          </Ledger>
        )}
      </div>

      {adding && <CatalogEntryDialog catalogType={tab} onClose={() => setAdding(false)} />}
      {retiring && <RetireCatalogEntryDialog entry={retiring} onClose={() => setRetiring(null)} />}
    </div>
  );
}
