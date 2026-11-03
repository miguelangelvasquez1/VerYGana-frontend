'use client';

import { useId, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FileSpreadsheet } from 'lucide-react';

import { EmptyState, ErrorState } from '@/components/compliance/ui/primitives';
import {
  useComplianceTaxCatalog,
  useComplianceTaxProfile,
  useComplianceTaxProfileVersion,
} from '@/hooks/compliance/useComplianceTaxProfiles';
import { useCaseDocuments } from '@/hooks/compliance/useComplianceCase';
import { useOpenCaseDocument } from '@/hooks/compliance/useOpenCaseDocument';
import { TAX_PROFILES_PATH } from '@/lib/compliance/routes';
import { comparableVersions, SECTION_ORDER } from '@/lib/compliance/taxProfileFields';
import { reviewLoadView } from '@/lib/compliance/loadErrors';
import {
  latestSectionReview,
  resolveRutDocument,
  versionChangedDuringReview,
} from '@/lib/compliance/taxProfileReview';
import { isUuid } from '@/lib/informationRequests/requests';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import { groupCatalog } from '@/lib/taxProfile/catalog';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type {
  ComplianceTaxProfileResponse,
  SectionReviewResult,
  TaxProfileSection,
} from '@/types/commercial/TaxProfile.types';
import { DeclaredSection } from './DeclaredSection';
import { ReviewHeader } from './ReviewHeader';
import { RutDocumentLink } from './RutDocumentLink';
import { SectionReviewPanel } from './SectionReviewPanel';

const SectionReviewDialog = dynamic(
  () => import('./SectionReviewDialog').then((m) => m.SectionReviewDialog),
  { ssr: false },
);
const VersionCompare = dynamic(() => import('./VersionCompare').then((m) => m.VersionCompare), {
  ssr: false,
});

interface ActiveReview {
  section: TaxProfileSection;
  result: SectionReviewResult;
  shownVersion: number;
}

function BackLink() {
  return (
    <Link href={TAX_PROFILES_PATH} className="inline-block text-sm font-semibold text-cmp-azul underline">
      {T.backToQueue}
    </Link>
  );
}

function ReviewSkeleton() {
  return (
    <div role="status" className="space-y-5">
      <span className="sr-only">{T.reviewLoading}</span>
      <div className="cmp-skeleton h-24 rounded-xl" />
      {SECTION_ORDER.map((section) => (
        <div key={section} className="cmp-skeleton h-28 rounded-xl" />
      ))}
    </div>
  );
}

// Revisión de la ficha tributaria de un empresario (spec 017).
export function TaxProfileReview({ commercialPublicId }: { commercialPublicId: string }) {
  const selectId = useId();
  const validId = isUuid(commercialPublicId);
  const profileQuery = useComplianceTaxProfile(commercialPublicId);
  const catalogQuery = useComplianceTaxCatalog(validId);
  const data = profileQuery.data;
  const currentVersion = data?.profile.currentVersion ?? null;
  const rutDocumentId = data?.profile.version.rutDocumentId ?? null;

  const documentsQuery = useCaseDocuments(commercialPublicId, rutDocumentId !== null);
  const { open: openDocument, openingId } = useOpenCaseDocument(documentsQuery);

  const [compareWith, setCompareWith] = useState<number | null>(null);
  const [active, setActive] = useState<ActiveReview | null>(null);
  const [versionNotice, setVersionNotice] = useState<number | null>(null);

  // Si la versión vigente pasó a ser la elegida, la comparación ya no tiene sentido.
  const activeCompare = compareWith !== null && compareWith !== currentVersion ? compareWith : null;
  const versionQuery = useComplianceTaxProfileVersion(commercialPublicId, activeCompare);

  // Sin catálogo (cargando o con error) los códigos se ven solos; nunca bloquea (CA-29).
  const catalog = useMemo(() => groupCatalog(catalogQuery.data ?? []), [catalogQuery.data]);

  if (!validId) {
    return (
      <div className="space-y-4">
        <EmptyState icon={FileSpreadsheet} title={T.reviewNotSent} />
        <BackLink />
      </div>
    );
  }
  if (!data) {
    if (profileQuery.isPending) return <ReviewSkeleton />;
    const view = reviewLoadView(profileQuery.error);
    if (view === 'not-sent') {
      return (
        <div className="space-y-4">
          <EmptyState icon={FileSpreadsheet} title={T.reviewNotSent} />
          <BackLink />
        </div>
      );
    }
    if (view === 'forbidden') {
      return (
        <div className="space-y-4">
          <EmptyState icon={FileSpreadsheet} title={T.forbidden} />
          <BackLink />
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <ErrorState message={T.reviewLoadError} onRetry={() => void profileQuery.refetch()} />
        <BackLink />
      </div>
    );
  }

  const rutView = resolveRutDocument({
    rutDocumentId,
    status: documentsQuery.status,
    documents: documentsQuery.data,
  });
  const options = comparableVersions(data.versions, data.profile.currentVersion);

  const handleSaved = (response: ComplianceTaxProfileResponse) => {
    toast.success(T.reviewSaved);
    if (active && versionChangedDuringReview(active.shownVersion, response)) {
      setVersionNotice(response.profile.currentVersion);
    }
  };

  const comparing = activeCompare !== null && versionQuery.data !== undefined;

  return (
    <div className="space-y-5">
      <BackLink />
      <ReviewHeader data={data} />

      {options.length > 0 && (
        <div className="space-y-2">
          <label htmlFor={selectId} className="cmp-label block text-cmp-mute">
            {T.compareWith}
          </label>
          <select
            id={selectId}
            value={activeCompare ?? ''}
            onChange={(e) => setCompareWith(e.target.value === '' ? null : Number(e.target.value))}
            className="w-full max-w-sm rounded-lg border border-cmp-rule bg-white px-3 py-2 text-sm text-cmp-ink focus:border-cmp-cian focus:outline-none"
          >
            <option value="">{T.chooseVersion}</option>
            {options.map((v) => (
              <option key={v.versionNumber} value={v.versionNumber}>
                {T.versionOption(v.versionNumber, formatBogotaDateTime(v.submittedAt))}
              </option>
            ))}
          </select>
          {activeCompare !== null && versionQuery.isPending && (
            <p role="status" className="text-sm text-cmp-slate">
              {T.versionLoading}
            </p>
          )}
          {activeCompare !== null && versionQuery.isError && (
            <p role="alert" className="text-sm text-cmp-flag">
              {T.versionLoadError(activeCompare)}{' '}
              <button
                type="button"
                onClick={() => void versionQuery.refetch()}
                className="cursor-pointer font-semibold underline"
              >
                {T.retry}
              </button>
            </p>
          )}
        </div>
      )}

      {versionNotice !== null && (
        <p
          role="status"
          className="rounded-lg border border-cmp-hold/40 bg-cmp-hold-bg px-4 py-3 text-sm font-medium text-cmp-ink"
        >
          {T.versionChanged(versionNotice)}
        </p>
      )}

      {comparing && versionQuery.data ? (
        <VersionCompare
          older={versionQuery.data}
          current={data.profile.version}
          catalog={catalog}
          onBack={() => setCompareWith(null)}
        />
      ) : (
        <div className="space-y-5">
          {SECTION_ORDER.map((section) => (
            <section
              key={section}
              className="grid gap-4 rounded-xl border border-cmp-rule bg-white p-4 lg:grid-cols-[minmax(0,1fr)_320px]"
            >
              <DeclaredSection
                section={section}
                version={data.profile.version}
                catalog={catalog}
                establishments={data.establishmentHistory}
                rutLink={
                  <RutDocumentLink
                    view={rutView}
                    opening={openingId !== null}
                    onOpen={(id) => void openDocument(id)}
                    onRetry={() => void documentsQuery.refetch()}
                  />
                }
              />
              <SectionReviewPanel
                review={latestSectionReview(data.profile.sectionReviews, section)}
                onReview={(result) =>
                  setActive({ section, result, shownVersion: data.profile.currentVersion })
                }
              />
            </section>
          ))}
        </div>
      )}

      {active && (
        <SectionReviewDialog
          commercialPublicId={commercialPublicId}
          section={active.section}
          result={active.result}
          shownVersion={active.shownVersion}
          onSaved={handleSaved}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}
