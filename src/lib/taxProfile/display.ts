import {
  MANIFESTATION_LABELS,
  SECTION_REVIEW_LABELS,
  SECTION_REVIEW_PENDING,
  type ToneLabel,
} from '@/lib/labels/taxCompliance';
import { formatBogotaDateTime } from '@/lib/utils/dateDisplay';
import type { Manifestation } from '@/types/commercial/Declaration.types';
import type {
  SectionReview,
  TaxProfileSection,
  VersionSummary,
} from '@/types/commercial/TaxProfile.types';

export interface CommitmentDisplay {
  text: string;
  badge: ToneLabel | null;
  // true cuando la API espera una aclaración del empresario (la ficha lo muestra como enlace a las solicitudes).
  pendingClarification: boolean;
}

// Cómo se presenta el compromiso de formalización (RN-2): cinco casos, todos distintos.
export function commitmentDisplay(manifestation: Manifestation | null): CommitmentDisplay {
  if (!manifestation) {
    return {
      text: 'Aún no registrado. Se manifiesta al aprobar el contrato',
      badge: null,
      pendingClarification: false,
    };
  }
  const badge = MANIFESTATION_LABELS[manifestation.status];
  if (manifestation.status === 'MANIFESTED') {
    const who = manifestation.actorLegalRepName ? ` por ${manifestation.actorLegalRepName}` : '';
    return {
      text: `Manifestado el ${formatBogotaDateTime(manifestation.occurredAt)}${who} · versión ${manifestation.declarationVersion}`,
      badge,
      pendingClarification: false,
    };
  }
  return { text: 'Tienes una aclaración pendiente', badge, pendingClarification: true };
}

export interface SectionReviewDisplay {
  badge: ToneLabel;
  notes: string | null;
  // Resultado de la revisión; null si la sección aún no se revisa.
  result: SectionReview['result'] | null;
}

export function sectionReviewDisplay(
  reviews: readonly SectionReview[],
  section: TaxProfileSection,
): SectionReviewDisplay {
  const review = reviews.find((r) => r.section === section);
  if (!review) return { badge: SECTION_REVIEW_PENDING, notes: null, result: null };
  return { badge: SECTION_REVIEW_LABELS[review.result], notes: review.notes, result: review.result };
}

export function sortVersionsDesc(versions: readonly VersionSummary[]): VersionSummary[] {
  return [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
}

// RUT vigente = tipo RUT y estado VALIDATED (el reemplazado queda SUPERSEDED).
export function vigentRutDocuments<T extends { documentType: string; status: string }>(
  documents: readonly T[],
): T[] {
  return documents.filter((d) => d.documentType === 'RUT' && d.status === 'VALIDATED');
}

export function nextVersionMessage(currentVersion: number): string {
  return `Se creará la versión ${currentVersion + 1}. La anterior queda en el historial`;
}
