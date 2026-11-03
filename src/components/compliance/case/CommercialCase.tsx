'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserX } from 'lucide-react';

import { EmptyState } from '@/components/compliance/ui/primitives';
import { useComplianceTaxProfile } from '@/hooks/compliance/useComplianceTaxProfiles';
import { casePath } from '@/lib/compliance/routes';
import { isUuid } from '@/lib/informationRequests/requests';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T, type CaseTabKey } from '@/lib/labels/complianceTaxReview';
import { CaseCommitmentTab } from './CaseCommitmentTab';
import { CaseDocumentsTab } from './CaseDocumentsTab';
import { CaseFindingsTab } from './CaseFindingsTab';
import { CaseIncidentsTab } from './CaseIncidentsTab';
import { CaseRequestsTab } from './CaseRequestsTab';
import { CaseTabs, CASE_PANEL_ID, caseTabId } from './CaseTabs';
import { CaseTaxProfileTab } from './CaseTaxProfileTab';

function TabPanel({
  tab,
  commercialPublicId,
  companyName,
}: {
  tab: CaseTabKey;
  commercialPublicId: string;
  companyName: string | null;
}) {
  switch (tab) {
    case 'tax-profile':
      return <CaseTaxProfileTab commercialPublicId={commercialPublicId} />;
    case 'documents':
      return <CaseDocumentsTab commercialPublicId={commercialPublicId} />;
    case 'commitment':
      return <CaseCommitmentTab commercialPublicId={commercialPublicId} />;
    case 'requests':
      return <CaseRequestsTab commercialPublicId={commercialPublicId} />;
    case 'findings':
      return <CaseFindingsTab commercialPublicId={commercialPublicId} companyName={companyName} />;
    case 'incidents':
      return <CaseIncidentsTab commercialPublicId={commercialPublicId} />;
  }
}

// Caso del empresario para el oficial de cumplimiento (spec 017). La pestaña vive en la URL (`?tab=`).
export function CommercialCase({
  commercialPublicId,
  initialTab,
}: {
  commercialPublicId: string;
  initialTab: CaseTabKey;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [tab, setTab] = useState<CaseTabKey>(initialTab);
  // Comparte la caché con la pestaña Ficha: no es una petición extra.
  const profileQuery = useComplianceTaxProfile(commercialPublicId);

  if (!isUuid(commercialPublicId)) {
    return <EmptyState icon={UserX} title={T.commercialNotFound} />;
  }

  const handleChange = (next: CaseTabKey) => {
    setTab(next);
    startTransition(() => router.replace(casePath(commercialPublicId, next), { scroll: false }));
  };

  const profile = profileQuery.data;
  return (
    <div className="space-y-5">
      <header className="space-y-1 border-b border-cmp-rule pb-4">
        <h1 className="min-w-0 break-words text-[22px] font-semibold leading-tight text-cmp-ink">
          {profile?.companyName ?? T.commercialFallback}
        </h1>
        {profile && <p className="cmp-mono break-words text-sm text-cmp-slate">{T.nit(profile.nit)}</p>}
      </header>

      <CaseTabs active={tab} onChange={handleChange} />

      <div role="tabpanel" id={CASE_PANEL_ID} aria-labelledby={caseTabId(tab)} tabIndex={0}>
        <TabPanel tab={tab} commercialPublicId={commercialPublicId} companyName={profile?.companyName ?? null} />
      </div>
    </div>
  );
}
