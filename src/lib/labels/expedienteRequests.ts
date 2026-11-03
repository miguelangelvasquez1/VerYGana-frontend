// Textos del expediente documental y de las solicitudes de información del empresario.
// Todo literal de estas pantallas sale de aquí (RN-3, RN-6, RN-7, RN-9, RN-10, RN-15).
// Sin 'use client' para poder importarse desde las pruebas de Vitest.

export const EXPEDIENTE_TEXTS = {
  // Estados de la pantalla
  loadingSr: 'Cargando tu expediente…',
  empty: 'Aún no tienes documentos en tu expediente.',
  loadError: 'No pudimos cargar tu expediente.',
  loadErrorShort: 'No pudimos cargar tu expediente',
  forbidden: 'No tienes permiso para ver este expediente.',
  retry: 'Reintentar',

  // Acciones
  view: 'Ver',
  replace: 'Reemplazar',
  addDocument: 'Agregar documento',
  history: 'Historial',
  upload: 'Subir',
  uploading: 'Subiendo…',
  cancel: 'Cancelar',
  loadDocument: 'Cargar documento',

  // Carga
  uploaded: 'Documento cargado',
  uploadFailed: 'No pudimos subir el documento. Intenta de nuevo',
  openFailed: 'No pudimos abrir el documento. Intenta de nuevo',
  refreshFailed: 'No pudimos actualizar la lista. Mostramos la última que cargó.',
  replaceNotice: 'El documento anterior quedará en tu historial',
  addTitle: 'Agregar documento',
  documentTypeLabel: 'Tipo de documento',
  selectDocumentType: 'Selecciona un tipo de documento',
  fileLabel: 'Archivo',
  selectFile: 'Selecciona un archivo',
  fileHelp: 'PDF, JPG o PNG, máximo 10 MB',
  // RN-3
  formatNotAllowed: 'Formato no permitido. Usa PDF, JPG o PNG',
  fileTooLarge: 'El archivo supera el tamaño máximo de 10MB',

  // Soporte de ingresos (RN-15)
  supportLabel: 'Documento de soporte',
  supportNone: 'Sin soporte',
  supportStale: 'Documento ya no vigente',
  supportLoading: 'Cargando documentos…',
  supportLoadError: 'No pudimos cargar tus documentos',
  supportSaved: 'Documento guardado',
  supportNotVigent: 'Este documento ya no está vigente. Elige otro o «Sin soporte»',

  replaceTitle: (typeLabel: string) => `Reemplazar ${typeLabel}`,
  itemTitle: (typeLabel: string) => `Cargar ${typeLabel}`,
  uploadedOn: (date: string) => `Cargado el ${date}`,
  expiresOn: (date: string) => `Vence el ${date}`,
  supersededOn: (date: string) => `Reemplazado el ${date}`,
  supportOptionLabel: (typeLabel: string, fileName: string) => `${typeLabel} — ${fileName}`,
} as const;

export const INFORMATION_REQUEST_TEXTS = {
  // Lista
  tabPending: 'Pendientes',
  tabHistory: 'Historial',
  emptyPending: 'No tienes solicitudes pendientes.',
  emptyHistory: 'Aún no tienes solicitudes cerradas.',
  listError: 'No pudimos cargar tus solicitudes.',
  listForbidden: 'No tienes permiso para ver estas solicitudes.',
  retry: 'Reintentar',

  // Detalle
  notFound: 'No encontramos esta solicitud.',
  backToList: 'Volver a mis solicitudes',
  backToListShort: 'Volver a la lista',
  detailError: 'No pudimos cargar la solicitud.',
  detailForbidden: 'No tienes permiso para ver esta solicitud.',
  whatWeAsk: 'Qué te pedimos',
  why: 'Por qué',
  conversation: 'Conversación',
  noResponses: 'Aún no hay respuestas.',
  attachedDocument: 'Documento adjunto',
  reviewSufficient: 'Suficiente',
  reviewInsufficient: 'Insuficiente',
  inReview: 'Tu respuesta está en revisión por VERYGANA.',
  linkedDocument:
    'Ya tenemos un documento de este tipo en tu expediente; VERYGANA revisará si es suficiente',
  // RN-9
  uploadAfterRegistration:
    'Podrás cargar este documento cuando termines tu registro. Mientras tanto, puedes responder con una aclaración.',
  // RN-10
  toneBanner:
    'Esta solicitud es una aclaración sobre el compromiso de formalización. No es una sanción.',

  // Respuesta
  messageLabel: 'Aclaración',
  messageMax: 'Máximo 2000 caracteres',
  // RN-6
  emptyResponse: 'Escribe una aclaración o adjunta al menos un documento',
  submit: 'Enviar respuesta',
  remove: 'Quitar',
  loadDocument: 'Cargar documento',
  // RN-7
  responseReceived:
    'Recibimos tu respuesta. VERYGANA la revisará; la solicitud se cierra cuando termine la revisión',
  respondFailed: 'No pudimos enviar tu respuesta. Intenta de nuevo',

  // Onboarding y menú
  viewRequests: 'Ver solicitudes',
  dialogTitle: 'Solicitudes de información',
  pendingSr: 'solicitudes pendientes',

  expectedResponse: (text: string) => `Respuesta esperada: ${text}`,
  dueBefore: (date: string) => `Responder antes del ${date}`,
  sentOn: (date: string) => `Enviada el ${date}`,
  receivedOn: (date: string) => `Recibida el ${date}`,
  closedOn: (date: string) => `Cerrada el ${date}`,
  messageCounter: (n: number) => `${n}/2000`,
  removeLabel: (name: string) => `Quitar ${name}`,
  // CA-18
  requestsNotice: (n: number) =>
    n === 1
      ? 'VERYGANA te envió 1 solicitud de información'
      : `VERYGANA te envió ${n} solicitudes de información`,
} as const;
