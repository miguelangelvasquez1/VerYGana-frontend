// Textos de las acciones de cumplimiento (spec 018): requerimientos, hallazgos, incidencias, alertas,
// reglas y catálogo. Todo literal de esas pantallas sale de aquí.
// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export const COMPLIANCE_ACTION_TEXTS = {
  forbidden: 'No tienes permiso para ver esta sección.',
  saveError: 'No pudimos guardar. Intenta de nuevo.',
  retry: 'Reintentar',

  // Menú
  navRequests: 'Requerimientos',
  navAlerts: 'Alertas',
  navAlertRules: 'Reglas de alerta',
  navTaxCatalog: 'Catálogo tributario',

  // Requerimientos
  requestsEmpty: (filtered: boolean) =>
    filtered ? 'No hay requerimientos en este estado.' : 'Todavía no hay requerimientos.',
  requestsLoadError: 'No pudimos cargar los requerimientos.',
  requestDetailLoadError: 'No pudimos cargar el requerimiento.',
  requestNotFound: 'No encontramos este requerimiento.',
  requestSent: 'Requerimiento enviado',
  communicationFailedNotice:
    'El empresario podría no haber recibido la notificación; no lo trates como falta de respuesta',

  // Hallazgos
  findingSaved: 'Hallazgo registrado',
  accountStatusApplied: (status: string) => `Estado de la cuenta aplicado: ${status}`,
  measureLimitedNote:
    'Una inconsistencia aislada o un error subsanable no justifican restringir ni suspender',
  expressRefusalMissing: 'No hay una negativa expresa registrada',
  terminationNote: 'No cambia el estado de la cuenta; remite el caso al procedimiento de terminación',
  companyNameUnknown: 'No pudimos obtener el nombre de la empresa para confirmar esta medida',
  accountChangeConfirm: (company: string, measure: string) =>
    `Esta medida cambiará de inmediato el estado de la cuenta de ${company} a ${measure}. Quedará registrada con su fundamento. ¿Confirmas?`,

  // Alertas
  alertsEmpty: (pendingOnly: boolean) => (pendingOnly ? 'No hay alertas pendientes.' : 'No hay alertas.'),
  alertsLoadError: 'No pudimos cargar las alertas.',
  alertDataUnreadable: 'No pudimos leer los datos de la alerta',
  alerts: {
    pendingOnly: 'Solo pendientes',
    noRule: 'Evento del expediente',
    viewData: 'Ver datos',
    markReviewed: 'Marcar revisada',
    openRequest: 'Abrir requerimiento',
  },

  // Reglas
  rulesEmpty: 'Todavía no hay reglas de alerta.',
  rulesLoadError: 'No pudimos cargar las reglas.',
  ruleTypeLabel: 'Crecimiento de ventas en VERYGANA entre dos ventanas iguales',
  ruleScopeNote: 'La regla solo ve operaciones en VERYGANA; sus alertas son informativas',
  newRuleVersionNotice: (version: number) =>
    `Se creará la versión ${version} y la actual se desactivará`,

  // Catálogo
  catalogEmpty: 'No hay códigos en este catálogo.',
  catalogLoadError: 'No pudimos cargar el catálogo.',
  catalogImmutableNote: 'Un código no se edita: se retira y se crea uno nuevo',
};

// Textos de interfaz de la 018 (columnas, botones, rótulos de formulario). Aparte de los textos fijos de la
// spec, que tienen su prueba exacta arriba.
export const COMPLIANCE_ACTION_UI = {
  cancel: 'Cancelar',
  dash: '—',
  backToRequests: 'Volver a requerimientos',
  backToCase: 'Ver caso del empresario',

  // Cola de requerimientos
  requestsEyebrow: 'Cumplimiento tributario',
  requestsTitle: 'Requerimientos de información',
  filterAll: 'Todos',
  columnCompany: 'Empresa',
  columnType: 'Tipo',
  columnStatus: 'Estado',
  columnIssued: 'Emitido',
  columnDue: 'Vence',
  columnIssuedBy: 'Emitido por',
  openRequestOf: (company: string) => `Abrir el requerimiento de ${company}`,

  // Detalle
  requestLoading: 'Cargando el requerimiento…',
  reasonLabel: 'Motivo',
  relationLabel: 'Relación con la operación',
  dueLabel: 'Fecha límite',
  issuedByLabel: 'Emitido por',
  system: 'Sistema',
  compliance: 'Compliance',
  ruleLabel: (code: string, version: number | null) => `Regla ${code} v${version ?? 1}`,
  itemsTitle: 'Ítems solicitados',
  itemDocument: (type: string) => `Documento: ${type}`,
  itemField: (path: string) => `Campo: ${path}`,
  itemAcceptable: (text: string) => `Respuesta aceptable: ${text}`,
  itemLinked: 'Ya hay un documento del expediente vinculado',
  timelineTitle: 'Respuestas y revisiones',
  timelineEmpty: 'Todavía no hay respuestas.',
  responseOn: (date: string) => `Respuesta del empresario · ${date}`,
  reviewOn: (result: string, date: string) => `Revisión: ${result} · ${date}`,
  resultSufficient: 'Suficiente',
  resultInsufficient: 'Insuficiente',
  attachments: (n: number) => `${n} adjunto${n === 1 ? '' : 's'} en el expediente`,
  closingNotes: (notes: string) => `Notas de cierre: ${notes}`,
  closedOn: (date: string) => `Cerrada el ${date}`,
  backToQueue: 'Volver a la cola',
  attachmentOf: (documentType: string) => `Ver ${documentType}`,
  attachmentUnknown: 'Ver adjunto',
  deliveryErrorDetail: (detail: string) => `Detalle del fallo: ${detail}`,
  reasonHelp: 'Explica el hecho concreto que origina la solicitud',
  relationHelp: '¿Qué requisito se evalúa con esta información?',
  dueHelp: 'Solo si una regla aplicable fija un plazo',
  communicationsTitle: 'Comunicaciones',
  communicationsEmpty: 'No hay comunicaciones registradas.',
  sentOn: (date: string) => `Enviada el ${date}`,
  actions: {
    review: 'Revisar respuesta',
    cancel: 'Anular requerimiento',
    finding: 'Registrar hallazgo',
  },

  // Revisar y anular
  reviewTitle: 'Revisar la respuesta',
  resultLegend: 'Resultado',
  reviewNotesLabel: 'Nota',
  reviewNotesRequiredHint: 'Obligatoria si la respuesta es insuficiente',
  reviewSubmit: 'Guardar revisión',
  cancelRequestTitle: 'Anular el requerimiento',
  cancelReasonLabel: 'Motivo de la anulación',
  cancelRequestSubmit: 'Anular requerimiento',

  // Crear
  newRequest: 'Nuevo requerimiento',
  newRequestTitle: 'Nuevo requerimiento de información',
  triggerLabel: 'Motivo del requerimiento',
  chooseOption: 'Elige una opción',
  reasonField: 'Motivo',
  relationField: 'Relación con la operación',
  dueField: 'Fecha límite (opcional)',
  itemsLegend: 'Ítems',
  addItem: 'Agregar ítem',
  removeItem: (n: number) => `Quitar el ítem ${n}`,
  itemN: (n: number) => `Ítem ${n}`,
  itemTypeLabel: 'Tipo de ítem',
  documentTypeLabel: 'Tipo de documento',
  establishmentLabel: 'Sede (opcional)',
  noEstablishment: 'Sin sede',
  fieldPathLabel: 'Campo a actualizar',
  descriptionLabel: 'Descripción',
  acceptableLabel: 'Respuesta aceptable (opcional)',
  fromAlertNotice: 'Se enlazará con la alerta de origen',
  sendRequest: 'Enviar requerimiento',
  openExisting: 'Abrir el requerimiento existente',
  createRequestFromAlert: 'Abrir requerimiento',

  // Hallazgo
  findingTitle: 'Registrar hallazgo',
  factLabel: 'Hecho observado',
  evidenceLabel: 'Evidencia (opcional)',
  classificationLabel: 'Clasificación',
  severityLabel: 'Gravedad',
  impactLabel: 'Afectación',
  remediableLegend: '¿Es subsanable?',
  yes: 'Sí',
  no: 'No',
  basisLabel: 'Fundamento contractual',
  measureLabel: 'Medida',
  measureScopeLabel: 'Alcance de la medida (opcional)',
  findingSubmit: 'Registrar hallazgo',
  accountConfirmTitle: 'Confirmar cambio de estado de la cuenta',
  accountConfirmTypeLabel: (company: string) => `Escribe «${company}» para confirmar`,
  accountConfirmSubmit: 'Confirmar y registrar',

  // Incidencia
  newIncident: 'Registrar incidencia',
  incidentTitle: 'Registrar incidencia',
  contextLabel: 'Contexto',
  incidentDescriptionLabel: 'Descripción',
  relatedRequestLabel: 'Requerimiento relacionado (opcional)',
  noRelatedRequest: 'Ninguno',
  incidentSubmit: 'Registrar incidencia',
  incidentSaved: 'Incidencia registrada',

  // Alertas
  alertsEyebrow: 'Cumplimiento tributario',
  alertsTitle: 'Alertas',
  detectedOn: (date: string) => `Detectada el ${date}`,
  reviewedOn: (date: string) => `Revisada el ${date}`,
  reviewNoteOf: (notes: string) => `Nota: ${notes}`,
  viewRequest: 'Ver requerimiento',
  alertReviewTitle: 'Marcar la alerta como revisada',
  alertReviewNotes: 'Nota de la revisión',
  hideData: 'Ocultar datos',
  dataKey: 'Dato',
  dataValue: 'Valor',

  // Reglas
  rulesEyebrow: 'Cumplimiento tributario',
  rulesTitle: 'Reglas de alerta',
  newRule: 'Nueva regla',
  newVersion: 'Nueva versión',
  ruleDialogTitle: 'Nueva regla de alerta',
  ruleCode: 'Código',
  ruleDescription: 'Descripción',
  ruleBasis: 'Fundamento legal',
  ruleWindowDays: 'Ventana en días (mínimo 7)',
  ruleGrowthPct: 'Crecimiento mínimo (%)',
  ruleMinSales: 'Ventas mínimas del periodo actual (pesos)',
  ruleSubmit: 'Crear regla',
  active: 'Activa',
  noActiveVersion: 'Sin versión activa',
  versionOf: (v: number) => `Versión ${v}`,
  deactivate: 'Desactivar',
  deactivateTitle: 'Desactivar la regla',
  deactivateConfirm: (code: string, version: number) =>
    `La regla ${code} v${version} dejará de generar alertas nuevas. ¿Confirmas?`,
  history: (n: number) => `Versiones anteriores (${n})`,
  ruleParams: (days: number, pct: number, sales: string) =>
    `Ventana de ${days} días · crecimiento mínimo ${pct}% · ventas mínimas ${sales}`,
  ruleParamsUnreadable: 'No pudimos leer los parámetros de esta regla',

  // Catálogo
  catalogEyebrow: 'Cumplimiento tributario',
  catalogTitle: 'Catálogo tributario',
  addCode: 'Agregar código',
  addCodeTitle: 'Agregar código al catálogo',
  retire: 'Retirar',
  retireTitle: 'Retirar el código',
  catalogCode: 'Código',
  catalogLabel: 'Etiqueta',
  catalogBasis: 'Fundamento legal',
  catalogFrom: 'Vigente desde',
  catalogTo: 'Vigente hasta',
  catalogRetireDate: 'Fecha de retiro',
  catalogColumnState: 'Estado',
  catalogActive: 'Activo',
  catalogRetired: 'Retirado',
  catalogSubmit: 'Agregar',
  retireSubmit: 'Retirar código',
  catalogTabsLabel: 'Tipos de catálogo',
};
