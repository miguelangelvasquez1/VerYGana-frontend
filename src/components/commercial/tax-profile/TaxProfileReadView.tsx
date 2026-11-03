import type { ReactNode } from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  INCOME_CONCEPT_LABELS,
  INCOME_SCOPE_LABELS,
  TAX_PROFILE_SECTION_TITLES,
} from '@/lib/labels/taxCompliance';
import { displayCode } from '@/lib/taxProfile/catalog';
import { sectionReviewDisplay } from '@/lib/taxProfile/display';
import { formatCents } from '@/lib/money/cents';
import { formatPlainDate } from '@/lib/utils/dateDisplay';
import type {
  CatalogEntry,
  SectionReview,
  TaxProfileSection,
  TaxProfileVersionDetail,
} from '@/types/commercial/TaxProfile.types';

const EMPTY = '—';

function yesNo(value: boolean): string {
  return value ? 'Sí' : 'No';
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-sm font-semibold text-gray-600 sm:w-56">{label}</dt>
      <dd className="min-w-0 break-words whitespace-pre-line text-sm text-gray-900">{children}</dd>
    </div>
  );
}

function ReadSection({
  section,
  reviews,
  children,
}: {
  section: TaxProfileSection;
  // Sin `reviews` (versiones del historial) no se muestran insignias de revisión.
  reviews?: readonly SectionReview[];
  children: ReactNode;
}) {
  const titleId = `read-${section}`;
  const review = reviews ? sectionReviewDisplay(reviews, section) : null;
  const observed = review !== null && review.result === 'OBSERVED' && review.notes;

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={titleId} className="text-sm font-bold text-gray-900">
          {TAX_PROFILE_SECTION_TITLES[section]}
        </h3>
        {review && <StatusBadge label={review.badge.label} tone={review.badge.tone} />}
      </div>
      {observed && (
        <p className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm font-medium text-orange-800">
          {review.notes}
        </p>
      )}
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  );
}

// Vista de lectura de una versión de la ficha. Los códigos se muestran como "código — etiqueta"
// (RN-4) y las fechas sin correrse de día (CA-21).
export function TaxProfileReadView({
  version,
  catalog,
  reviews,
}: {
  version: TaxProfileVersionDetail;
  catalog: readonly CatalogEntry[];
  reviews?: readonly SectionReview[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <ReadSection section="A_RUT" reviews={reviews}>
        <Row label="Documento RUT">
          {version.rutDocumentId !== null ? 'Documento RUT vinculado' : 'Sin documento RUT vinculado'}
        </Row>
        <Row label="Responsabilidades del RUT">
          {version.rutResponsibilityCodes.length === 0 ? (
            EMPTY
          ) : (
            <ul className="flex flex-col gap-0.5">
              {version.rutResponsibilityCodes.map((code) => (
                <li key={code}>{displayCode(code, catalog)}</li>
              ))}
            </ul>
          )}
        </Row>
      </ReadSection>

      <ReadSection section="B_REGIME_ACTIVITIES" reviews={reviews}>
        <Row label="Régimen">{displayCode(version.regimeCode, catalog)}</Row>
        <Row label="Actividades">
          <ul className="flex flex-col gap-1">
            {version.activities.map((activity) => (
              <li key={activity.ciiuCode}>
                CIIU {activity.ciiuCode}
                {activity.main ? ' (principal)' : ''}
                {activity.description ? ` · ${activity.description}` : ''}
              </li>
            ))}
          </ul>
        </Row>
      </ReadSection>

      <ReadSection section="C_VAT_INC" reviews={reviews}>
        <Row label="Condición frente al IVA">{displayCode(version.vatConditionCode, catalog)}</Row>
        <Row label="Condición frente al INC">{displayCode(version.incConditionCode, catalog)}</Row>
        <Row label="Productos o servicios a los que aplica">{version.taxConditionScope || EMPTY}</Row>
      </ReadSection>

      <ReadSection section="D_INVOICING_WITHHOLDING" reviews={reviews}>
        <Row label="Obligado a facturar">{yesNo(version.invoicingObligated)}</Row>
        <Row label="Método de facturación">{displayCode(version.invoicingMethodCode, catalog)}</Row>
        <Row label="Notas sobre la facturación">{version.invoicingNotes || EMPTY}</Row>
        <Row label="Agente de retención">{yesNo(version.withholdingAgent)}</Row>
        <Row label="Notas sobre la retención">{version.withholdingNotes || EMPTY}</Row>
      </ReadSection>

      <ReadSection section="E_INCOME" reviews={reviews}>
        <ul className="flex flex-col gap-3">
          {version.incomeReports.map((report, index) => (
            <li
              key={`${report.concept}-${report.periodStart}-${report.periodEnd}-${index}`}
              className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-900"
            >
              <p className="font-semibold">
                {INCOME_CONCEPT_LABELS[report.concept]} · {formatCents(report.amountCents)}
              </p>
              <p className="text-gray-700">
                Del {formatPlainDate(report.periodStart)} al {formatPlainDate(report.periodEnd)}
              </p>
              <p className="text-gray-700">{INCOME_SCOPE_LABELS[report.scope]}</p>
              {report.notes && <p className="break-words text-gray-600">{report.notes}</p>}
            </li>
          ))}
        </ul>
      </ReadSection>

      <ReadSection section="F_ESTABLISHMENTS" reviews={reviews}>
        <Row label="Establecimientos activos al enviar">{version.establishmentsCount}</Row>
      </ReadSection>

      <ReadSection section="G_GROWTH_CAPACITY" reviews={reviews}>
        <Row label="Capacidad actual">{version.currentCapacity}</Row>
        <Row label="Escenario de crecimiento">{version.growthScenario || EMPTY}</Row>
        <Row label="Medidas para crecer">{version.growthMeasures || EMPTY}</Row>
      </ReadSection>

      <ReadSection section="H_ADVISORY" reviews={reviews}>
        <Row label="Tiene asesor contable">{yesNo(version.hasAccountingAdvisor)}</Row>
        {version.hasAccountingAdvisor && (
          <Row label="Alcance de la asesoría">{version.advisorScope || EMPTY}</Row>
        )}
        <p className="text-sm text-gray-600">
          Esta información no le da acceso a tu asesor a la plataforma
        </p>
      </ReadSection>
    </div>
  );
}
