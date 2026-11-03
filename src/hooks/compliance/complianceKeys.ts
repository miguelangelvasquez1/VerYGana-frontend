import type { TaxProfileStatus } from '@/types/commercial/TaxProfile.types';
import type { InformationRequestStatus } from '@/types/compliance/InformationRequest.types';

// Sin 'use client' para poder importarse desde las pruebas de Vitest.
export const complianceTaxProfileKeys = {
  all: ['compliance-tax-profiles'] as const,
  queueAll: ['compliance-tax-profiles', 'queue'] as const,
  queue: (status: TaxProfileStatus | 'ALL', page: number) =>
    ['compliance-tax-profiles', 'queue', status, page] as const,
  detail: (commercialPublicId: string) =>
    ['compliance-tax-profiles', 'detail', commercialPublicId] as const,
  // Prefijo propio: invalidar el detalle no toca las versiones, que no cambian una vez enviadas.
  version: (commercialPublicId: string, versionNumber: number) =>
    ['compliance-tax-profiles', 'version', commercialPublicId, versionNumber] as const,
};

// Otro rol, otro endpoint y otra lista (con retirados) que `taxProfileKeys.catalog` del empresario.
// La spec 018 (crear y retirar códigos) invalida esta clave.
export const complianceTaxCatalogKeys = {
  all: ['compliance-tax-catalog'] as const,
};

export const complianceCaseKeys = {
  all: (commercialPublicId: string) => ['compliance-case', commercialPublicId] as const,
  documents: (commercialPublicId: string) =>
    ['compliance-case', commercialPublicId, 'documents'] as const,
  commitment: (commercialPublicId: string) =>
    ['compliance-case', commercialPublicId, 'commitment'] as const,
  requestsAll: (commercialPublicId: string) =>
    ['compliance-case', commercialPublicId, 'requests'] as const,
  requests: (commercialPublicId: string, page: number) =>
    ['compliance-case', commercialPublicId, 'requests', page] as const,
  findings: (commercialPublicId: string) =>
    ['compliance-case', commercialPublicId, 'findings'] as const,
  incidents: (commercialPublicId: string) =>
    ['compliance-case', commercialPublicId, 'incidents'] as const,
};

// Spec 018. `queue` cuelga de `queueAll`; el detalle no (revisar lo actualiza con `setQueryData`).
export const complianceRequestKeys = {
  all: ['compliance-requests'] as const,
  queueAll: ['compliance-requests', 'queue'] as const,
  queue: (status: InformationRequestStatus | 'ALL', page: number) =>
    ['compliance-requests', 'queue', status, page] as const,
  detail: (requestPublicId: string) => ['compliance-requests', 'detail', requestPublicId] as const,
};

export const complianceAlertKeys = {
  all: ['compliance-alerts'] as const,
  list: (pendingOnly: boolean, page: number) => ['compliance-alerts', 'list', pendingOnly, page] as const,
};

export const complianceAlertRuleKeys = {
  all: ['compliance-alert-rules'] as const,
};

// Qué claves deja desactualizadas cada mutación. Los hooks recorren estas listas.
export const COMPLIANCE_INVALIDATIONS = {
  // La respuesta ya trae la ficha (se guarda con setQueryData); la cola queda vieja (estado y fecha).
  reviewSection: [complianceTaxProfileKeys.queueAll],
  // No se parchea la lista con `setQueryData`: renovaría `dataUpdatedAt` y "Ver" creería frescas las
  // URL de los demás documentos (R-2). Se invalida y se relee.
  reviewDocument: (commercialPublicId: string) => [complianceCaseKeys.documents(commercialPublicId)],
  // Tras cualquier 400 la lista se relee: otro revisor o el empresario la cambió (RN-6, D-7).
  reviewDocumentRejected: (commercialPublicId: string) => [
    complianceCaseKeys.documents(commercialPublicId),
  ],
  // La versión nueva puede traer otro `rutDocumentId`: se relee el expediente (RN-13). El detalle
  // no se invalida: la respuesta de la revisión ya lo trae.
  versionChanged: (commercialPublicId: string) => [complianceCaseKeys.documents(commercialPublicId)],

  // Spec 018 (RN-11). Con `alertId` la API enlaza la alerta y la marca revisada.
  requestCreated: (commercialPublicId: string, fromAlert: boolean) => [
    complianceRequestKeys.queueAll,
    complianceCaseKeys.requestsAll(commercialPublicId),
    ...(fromAlert ? [complianceAlertKeys.all] : []),
  ],
  // El detalle se parchea con la respuesta (`setQueryData`); se invalidan la cola y la pestaña del caso.
  requestReviewed: (commercialPublicId: string) => [
    complianceRequestKeys.queueAll,
    complianceCaseKeys.requestsAll(commercialPublicId),
  ],
  // Con requerimiento, la API lo cierra con el hallazgo.
  findingCreated: (commercialPublicId: string, requestPublicId?: string | null) => [
    complianceCaseKeys.findings(commercialPublicId),
    ...(requestPublicId
      ? [
          complianceRequestKeys.detail(requestPublicId),
          complianceRequestKeys.queueAll,
          complianceCaseKeys.requestsAll(commercialPublicId),
        ]
      : []),
  ],
  incidentCreated: (commercialPublicId: string) => [complianceCaseKeys.incidents(commercialPublicId)],
  alertReviewed: [complianceAlertKeys.all],
  alertRuleChanged: [complianceAlertRuleKeys.all],
  // Es la misma clave que lee la ficha de compliance (017).
  catalogChanged: [complianceTaxCatalogKeys.all],
};
