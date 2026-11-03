'use client';

import { useRef } from 'react';

import { CASE_TABS, nextTabIndex } from '@/lib/compliance/routes';
import {
  CASE_TAB_LABELS,
  COMPLIANCE_TAX_REVIEW_TEXTS as T,
  type CaseTabKey,
} from '@/lib/labels/complianceTaxReview';

export const caseTabId = (tab: CaseTabKey) => `case-tab-${tab}`;
export const CASE_PANEL_ID = 'case-tabpanel';

// Pestañas con el patrón WAI-ARIA: tabindex itinerante y flechas, Inicio y Fin.
export function CaseTabs({ active, onChange }: { active: CaseTabKey; onChange: (tab: CaseTabKey) => void }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = nextTabIndex(index, event.key, CASE_TABS.length);
    if (next === null) return;
    event.preventDefault();
    onChange(CASE_TABS[next]);
    refs.current[next]?.focus();
  };

  return (
    <div className="overflow-x-auto border-b border-cmp-rule">
      <div role="tablist" aria-label={T.caseAriaLabel} className="flex min-w-max gap-1">
        {CASE_TABS.map((tab, index) => {
          const selected = tab === active;
          return (
            <button
              key={tab}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={caseTabId(tab)}
              aria-selected={selected}
              aria-controls={CASE_PANEL_ID}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`cursor-pointer whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-cmp-cian ${
                selected
                  ? 'border-cmp-cian text-cmp-ink'
                  : 'border-transparent text-cmp-slate hover:text-cmp-ink'
              }`}
            >
              {CASE_TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
