'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

import { useCaseDocuments } from '@/hooks/compliance/useComplianceCase';
import { useOpenCaseDocument } from '@/hooks/compliance/useOpenCaseDocument';
import { groupExpediente } from '@/lib/expediente/expediente';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';
import type { CommercialDocumentType, ExpedienteDocument } from '@/types/commercial/Expediente.types';
import { CaseDocumentGroup } from './CaseDocumentGroup';
import { TabEmpty, TabError, TabLoading } from './TabState';

const DocumentReviewDialog = dynamic(
  () => import('./DocumentReviewDialog').then((m) => m.DocumentReviewDialog),
  { ssr: false },
);

// Pestaña Documentos del caso: expediente agrupado por tipo, con "Ver" y "Revisar" (CA-6, CA-13).
export function CaseDocumentsTab({ commercialPublicId }: { commercialPublicId: string }) {
  const query = useCaseDocuments(commercialPublicId);
  const { open, openingId } = useOpenCaseDocument(query);
  const [reviewing, setReviewing] = useState<ExpedienteDocument | null>(null);
  const [openHistory, setOpenHistory] = useState<ReadonlySet<CommercialDocumentType>>(new Set());

  const documents = query.data;
  const groups = useMemo(() => groupExpediente(documents ?? []), [documents]);

  if (documents === undefined) {
    if (query.isPending) return <TabLoading />;
    return <TabError error={query.error} tab="documents" onRetry={() => void query.refetch()} />;
  }
  if (groups.length === 0) return <TabEmpty message={T.emptyDocuments} />;

  const toggleHistory = (type: CommercialDocumentType) =>
    setOpenHistory((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <CaseDocumentGroup
          key={group.type}
          group={group}
          openingId={openingId}
          historyOpen={openHistory.has(group.type)}
          onToggleHistory={() => toggleHistory(group.type)}
          onView={(doc) => void open(doc.id)}
          onReview={setReviewing}
        />
      ))}

      {reviewing && (
        <DocumentReviewDialog
          commercialPublicId={commercialPublicId}
          document={reviewing}
          onSaved={() => toast.success(T.reviewSaved)}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}
