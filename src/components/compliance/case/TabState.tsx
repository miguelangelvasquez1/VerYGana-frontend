import { AlertCircle, Inbox } from 'lucide-react';

import { EmptyState, ErrorState } from '@/components/compliance/ui/primitives';
import { tabErrorView } from '@/lib/compliance/loadErrors';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T, type CaseTabKey } from '@/lib/labels/complianceTaxReview';

// Estados comunes de las pestañas del caso: cargando, vacío y error (CA-23).

export function TabLoading() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">{T.tabLoading}</span>
      <div className="cmp-skeleton h-20 rounded-xl" />
      <div className="cmp-skeleton h-20 rounded-xl" />
    </div>
  );
}

export function TabEmpty({ message }: { message: string }) {
  return <EmptyState icon={Inbox} title={message} />;
}

// Con 403, 404 o 400 no hay nada que reintentar; con 500 o red, sí.
export function TabError({
  error,
  tab,
  onRetry,
}: {
  error: unknown;
  tab: CaseTabKey;
  onRetry: () => void;
}) {
  const view = tabErrorView(error, tab);
  if (!view.retry) return <EmptyState icon={AlertCircle} title={view.message} />;
  return <ErrorState message={view.message} onRetry={onRetry} />;
}
