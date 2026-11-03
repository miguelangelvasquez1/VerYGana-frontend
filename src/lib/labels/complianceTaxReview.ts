// Textos de la cola de fichas tributarias, la revisión de la ficha, la revisión de documentos y el
// caso del empresario (spec 017). Todo literal de estas pantallas sale de aquí.
// Sin 'use client' para poder importarse desde las pruebas de Vitest.
import type { TaxProfileStatus } from '@/types/commercial/TaxProfile.types';

export type QueueFilter = TaxProfileStatus | 'ALL';
export type CaseTabKey =
  | 'tax-profile'
  | 'documents'
  | 'commitment'
  | 'requests'
  | 'findings'
  | 'incidents';

export interface SectionsSummary {
  verified: number;
  observed: number;
  notApplicable: number;
  pending: number;
}

const QUEUE_EMPTY: Record<QueueFilter, string> = {
  SUBMITTED: 'No hay fichas enviadas.',
  OBSERVED: 'No hay fichas observadas.',
  REVIEWED: 'No hay fichas revisadas.',
  ALL: 'Todavía no hay fichas tributarias enviadas.',
};

const TAB_LOAD_ERROR: Record<CaseTabKey, string> = {
  'tax-profile': 'No pudimos cargar la ficha tributaria.',
  documents: 'No pudimos cargar los documentos.',
  commitment: 'No pudimos cargar el compromiso.',
  requests: 'No pudimos cargar los requerimientos.',
  findings: 'No pudimos cargar los hallazgos.',
  incidents: 'No pudimos cargar las incidencias.',
};

export const COMPLIANCE_TAX_REVIEW_TEXTS = {
  // Cola
  eyebrow: 'Cumplimiento tributario',
  queueTitle: 'Fichas tributarias',
  breadcrumb: 'Fichas',
  queueEmptyAll: QUEUE_EMPTY.ALL,
  queueLoadError: 'No pudimos cargar las fichas tributarias.',
  forbidden: 'No tienes permiso para ver esta sección.',
  retry: 'Reintentar',
  columnCompany: 'Empresa',
  columnStatus: 'Estado',
  columnVersion: 'Versión',
  columnUpdated: 'Última actualización',
  queueEmpty: (filter: QueueFilter) => QUEUE_EMPTY[filter],
  openProfileOf: (company: string) => `Abrir la ficha de ${company}`,
  backToQueue: 'Volver a fichas tributarias',

  // Revisión de la ficha
  reviewNotSent: 'El empresario todavía no ha enviado la ficha tributaria.',
  reviewLoadError: 'No pudimos cargar la ficha tributaria.',
  reviewSaved: 'Revisión guardada',
  reviewSaveError: 'No pudimos guardar la revisión. Intenta de nuevo.',
  nit: (nit: string) => `NIT ${nit}`,
  currentVersion: (n: number) => `Versión vigente: v${n}`,
  vocationLabel: 'Vocación empresarial',
  vocationUndefined: 'Sin definir',
  vocationNote: 'Solo para contrastar: la ficha no modifica la vocación',
  viewCase: 'Ver caso del empresario',
  openReview: 'Abrir revisión de la ficha',
  viewRut: 'Ver RUT',
  documentNotCurrent: 'Documento ya no vigente',
  rutLoading: 'Cargando documento…',
  rutLoadError: 'No pudimos cargar el expediente.',
  establishmentsDeclared: 'Sedes declaradas al enviar',
  closedLabel: 'Cerrada',
  closedOn: (date: string, reason: string) => `Cerrada el ${date} · ${reason}`,
  reviewedOn: (date: string) => `Revisada el ${date}`,
  versionChanged: (n: number) =>
    `La ficha cambió a la versión ${n} mientras la revisabas. Revisa de nuevo las secciones.`,

  // Revisión de sección
  verify: 'Verificar',
  observe: 'Observar',
  notApplicable: 'No aplica',
  verifyTitle: (section: string) => `Verificar «${section}»`,
  observeTitle: (section: string) => `Observar «${section}»`,
  notApplicableTitle: (section: string) => `Marcar «${section}» como «No aplica»`,
  notesForCommercial: 'Observación para el empresario',
  notesOptional: 'Nota (opcional)',
  sectionNotesRequired: 'Escribe la observación para el empresario.',
  notesTooLong: 'Máximo 1000 caracteres',
  cancel: 'Cancelar',
  saveReview: 'Guardar revisión',

  // Comparador
  compareWith: 'Comparar con versión…',
  chooseVersion: 'Elige una versión',
  backToReview: 'Volver a la revisión',
  versionOption: (n: number, date: string) => `Versión ${n} · ${date}`,
  olderColumn: (n: number, date: string) => `Versión ${n} · ${date}`,
  currentColumn: (n: number) => `Vigente · versión ${n}`,
  olderValueLabel: (n: number) => `Versión ${n}`,
  currentValueLabel: () => 'Vigente',
  changed: 'Cambió',
  added: 'Agregado',
  removed: 'Quitado',
  unchanged: 'Sin cambios',
  versionLoadError: (n: number) => `No pudimos cargar la versión ${n}.`,
  versionLoading: 'Cargando versión…',
  noValue: '—',
  before: 'Antes',
  after: 'Ahora',

  // Lo declarado en la ficha
  columnConcept: 'Concepto',
  columnPeriod: 'Periodo',
  columnAmount: 'Valor',
  columnScope: 'Alcance',
  columnNotes: 'Notas',
  incomeSupported: 'Con soporte',
  establishmentsHistory: 'Historial de sedes',
  reviewLoading: 'Cargando la ficha tributaria…',

  // Revisión de documento
  reviewDocumentTitle: (type: string) => `Revisar ${type}`,
  reviewDocument: 'Revisar',
  resultLegend: 'Resultado',
  accept: 'Aceptar',
  reject: 'Rechazar',
  resultRequired: 'Elige el resultado de la revisión.',
  holderLabel: 'NIT o cédula del titular',
  holderRequired: 'Escribe el NIT o la cédula del titular.',
  holderHelp: 'Escríbelo como figura en el documento; se compara con el empresario',
  holderTooLong: 'Máximo 30 caracteres',
  issuedAtLabel: 'Fecha de expedición',
  hasValidity: 'El documento tiene vigencia comprobable',
  expiresAtLabel: 'Fecha de vencimiento',
  expiresAtRequired: 'Escribe la fecha de vencimiento.',
  expiryBeforeIssue: 'El vencimiento no puede ser anterior a la expedición.',
  documentNotesLabel: 'Notas',
  documentNotesRequired: 'Escribe la observación o el motivo del rechazo.',
  required: '(obligatorio)',
  requiredPlural: '(obligatorias)',
  holder: (value: string) => `Titular: ${value}`,
  issuedOn: (date: string) => `Expedido el ${date}`,
  reviewedAtDocument: (date: string) => `Revisado el ${date}`,

  // Caso del empresario
  caseTitle: 'Caso del empresario',
  caseAriaLabel: 'Caso del empresario',
  commercialFallback: 'Empresario',
  commercialNotFound: 'No encontramos este empresario.',
  sectionsSummary: (s: SectionsSummary) =>
    `${s.verified} verificadas · ${s.observed} observadas · ${s.notApplicable} no aplica · ${s.pending} pendientes`,
  tabLoadError: (tab: CaseTabKey) => TAB_LOAD_ERROR[tab],
  tabLoading: 'Cargando…',
  updatedOn: (date: string) => `Actualizada el ${date}`,
  uploadedOn: (date: string) => `Cargado el ${date}`,
  expiresOn: (date: string) => `Vence el ${date}`,
  supersededOn: (date: string) => `Reemplazado el ${date}`,
  view: 'Ver',
  viewOf: (type: string) => `Ver ${type}`,
  reviewDocumentOf: (type: string) => `Revisar ${type}`,
  history: 'Historial',
  dash: '—',

  // Vacíos del caso
  emptyDocuments: 'El empresario no tiene documentos en su expediente.',
  emptyCommitment: 'No hay manifestaciones registradas.',
  emptyRequests: 'No hay requerimientos para este empresario.',
  emptyFindings: 'No hay hallazgos registrados.',
  emptyIncidents: 'No hay incidencias registradas.',

  // Compromiso, requerimientos, hallazgos e incidencias
  contractVersion: (n: number) => `Contrato v${n}`,
  legalRep: (name: string) => `Representante legal: ${name}`,
  system: 'Sistema',
  complianceActor: 'Compliance',
  columnType: 'Tipo',
  columnIssuedBy: 'Emitido por',
  columnIssued: 'Emitido',
  columnDue: 'Vence',
  classificationLabel: (value: string) => `Clasificación: ${value}`,
  severityLabel: (value: string) => `Gravedad: ${value}`,
  measureLabel: (value: string) => `Medida: ${value}`,
  remediable: (yes: boolean) => `Subsanable: ${yes ? 'Sí' : 'No'}`,
  accountStatusApplied: (status: string) => `Estado de la cuenta aplicado: ${status}`,
  reportedBySystem: 'Reportada por el sistema',
  registeredByCompliance: 'Registrada por compliance',
} as const;

export const QUEUE_FILTER_LABELS: Record<QueueFilter, string> = {
  SUBMITTED: 'Enviada',
  OBSERVED: 'Observada',
  REVIEWED: 'Revisada',
  ALL: 'Todas',
};

export const CASE_TAB_LABELS: Record<CaseTabKey, string> = {
  'tax-profile': 'Ficha tributaria',
  documents: 'Documentos',
  commitment: 'Compromiso',
  requests: 'Requerimientos',
  findings: 'Hallazgos',
  incidents: 'Incidencias',
};
