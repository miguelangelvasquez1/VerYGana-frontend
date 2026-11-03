import { SECTION_ORDER } from '@/lib/compliance/taxProfileFields';
import type { SectionsSummary } from '@/lib/labels/complianceTaxReview';
import type { Manifestation } from '@/types/commercial/Declaration.types';
import type { ExpedienteDocument } from '@/types/commercial/Expediente.types';
import type {
  ComplianceTaxProfileResponse,
  Establishment,
  SectionReview,
  TaxProfileSection,
} from '@/types/commercial/TaxProfile.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.

// `null` = "Pendiente de revisión" (RN-3).
export function latestSectionReview(
  reviews: readonly SectionReview[],
  section: TaxProfileSection,
): SectionReview | null {
  return reviews.find((r) => r.section === section) ?? null;
}

// Cuenta solo las ocho secciones conocidas y una vez cada una; las pendientes son las que faltan.
export function summarizeSectionReviews(reviews: readonly SectionReview[]): SectionsSummary {
  const summary: SectionsSummary = { verified: 0, observed: 0, notApplicable: 0, pending: 0 };
  for (const section of SECTION_ORDER) {
    const found = latestSectionReview(reviews, section);
    if (!found) summary.pending += 1;
    else if (found.result === 'VERIFIED') summary.verified += 1;
    else if (found.result === 'OBSERVED') summary.observed += 1;
    else summary.notApplicable += 1;
  }
  return summary;
}

export type RutDocumentView =
  | { kind: 'none' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'available'; document: ExpedienteDocument }
  | { kind: 'stale' };

// "Ver RUT" solo con el documento vigente (D-5): si ya fue reemplazado o no está, no hay enlace.
export function resolveRutDocument(input: {
  rutDocumentId: number | null;
  status: 'pending' | 'error' | 'success';
  documents: readonly ExpedienteDocument[] | undefined;
}): RutDocumentView {
  if (input.rutDocumentId === null) return { kind: 'none' };
  if (input.status === 'pending') return { kind: 'loading' };
  if (input.status === 'error') return { kind: 'error' };
  const document = input.documents?.find((d) => d.id === input.rutDocumentId);
  if (document && document.status === 'VALIDATED') return { kind: 'available', document };
  return { kind: 'stale' };
}

// No se confía en el orden de la API (CA-21).
export function sortManifestationsDesc(list: readonly Manifestation[]): Manifestation[] {
  return [...list].sort((a, b) => {
    const byDate = Date.parse(b.occurredAt) - Date.parse(a.occurredAt);
    return byDate !== 0 ? byDate : b.id - a.id;
  });
}

// Activas primero y cerradas después; cada grupo por fecha de creación, la más reciente arriba (CA-7).
export function establishmentHistory(list: readonly Establishment[]): Establishment[] {
  const byCreatedDesc = (a: Establishment, b: Establishment) =>
    Date.parse(b.createdAt) - Date.parse(a.createdAt);
  const active = list.filter((e) => e.status !== 'CLOSED').sort(byCreatedDesc);
  const closed = list.filter((e) => e.status === 'CLOSED').sort(byCreatedDesc);
  return [...active, ...closed];
}

// La API revisa siempre la versión vigente en el momento del POST (RN-13, CA-28).
export function versionChangedDuringReview(
  shownVersion: number,
  response: ComplianceTaxProfileResponse,
): boolean {
  return response.profile.currentVersion !== shownVersion;
}
