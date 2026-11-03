import { Loader2 } from 'lucide-react';

import type { RutDocumentView } from '@/lib/compliance/taxProfileReview';
import { COMPLIANCE_TAX_REVIEW_TEXTS as T } from '@/lib/labels/complianceTaxReview';

interface RutDocumentLinkProps {
  view: RutDocumentView;
  opening: boolean;
  onOpen: (documentId: number) => void;
  onRetry: () => void;
}

// "Ver RUT": solo con el documento vigente (D-5). La URL firmada nunca pasa por aquí: la abre el hook.
export function RutDocumentLink({ view, opening, onOpen, onRetry }: RutDocumentLinkProps) {
  if (view.kind === 'none') return null;
  if (view.kind === 'loading') {
    return (
      <p role="status" className="text-sm text-cmp-slate">
        {T.rutLoading}
      </p>
    );
  }
  if (view.kind === 'error') {
    return (
      <p role="alert" className="text-sm text-cmp-flag">
        {T.rutLoadError}{' '}
        <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline">
          {T.retry}
        </button>
      </p>
    );
  }
  if (view.kind === 'stale') {
    return <p className="text-sm text-cmp-slate">{T.documentNotCurrent}</p>;
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(view.document.id)}
      disabled={opening}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-cmp-azul underline disabled:cursor-not-allowed disabled:opacity-60"
    >
      {opening && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {T.viewRut}
    </button>
  );
}
