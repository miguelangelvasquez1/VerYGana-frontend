# 016 · Plan: expediente documental y solicitudes de información del empresario (entrega C)

- **Spec:** `spec.md` de esta carpeta (Estado: Aprobada, 2026-10-29).
- **Contrato con la API:** `specs/014-tax-profile-and-compliance-case/backend-contract.md` (0.2, 1.2, 1.4,
  2, 3, 4.5, 4.6 y 6), comprobado contra el checkout de la API (solo lectura, `../VerYGanaAPI`):
  `controllers/commercial/CommercialExpedienteController.java`,
  `controllers/inforequests/CommercialInformationRequestController.java`,
  `services/commercial/CommercialExpedienteDocumentServiceImpl.java`,
  `services/inforequests/InformationRequestServiceImpl.java` (`respond`, `notifyCommercial`, `communicate`),
  `services/inforequests/InformationRequestViews.java`, `dtos/inforequests/InformationRequestDTOs.java`,
  `dtos/user/commercial/expediente/ExpedienteDocumentDTO.java` y `ExpedienteDocumentUploadRequestDTO.java`,
  `dtos/FileUploadPermissionDTO.java`, `services/tax/TaxProfileServiceImpl.java`
  (`requireOwnedValidatedDocument`), `services/notifications/NotificationServiceImpl.java`
  (`createInternalNotification`) y `exceptions/GlobalExceptionHandler.java`.
- **Depende de:** las entregas A (014) y B (015), en el árbol de trabajo sin commitear. Se reutilizan sus
  tipos, diccionario, `Dialog`, `StatusBadge`, claves, política de reintento, `readApiError`, utilidades de
  fecha, el formulario de la ficha y `noPiiLeaks.test.ts`; no se duplican.
- **Fecha del plan:** 2026-10-29. Lecturas sobre `dev` en `a911175` más el árbol de trabajo de la 014 y la
  015. Línea base medida hoy: `npx vitest run` 32 archivos y 1012 pruebas en verde; `.lint-max-warnings`
  = 348.
- **Tareas:** `tasks.md` de esta carpeta (26 tareas en 8 bloques).

## 1. Resumen

Tres páginas de servidor nuevas bajo `/commercial/profile` (expediente, lista y detalle de solicitudes)
que delegan en componentes de cliente; un flujo de carga en tres pasos reutilizable (expediente y
respuesta a una solicitud); un aviso con un diálogo de solicitudes dentro del asistente de
`/commercial-onboarding` (sin ruta nueva); el ítem del Sidebar y el acceso de "Mi perfil" con insignia;
el enlace de dos notificaciones por su título; y el selector de soporte de cada periodo de ingresos de la
ficha. Toda la lógica (agrupación, frescura de la URL, carga, pestañas, línea de tiempo, cuerpo y errores
de la respuesta, títulos de notificación, validación del soporte) va en funciones puras con prueba Vitest
escrita primero. Sin cambios en el middleware, sin route handlers y sin dependencias nuevas.

## 2. Lo que se encontró al leer el código

### 2.1 Front

- **Tipos de la 014.** `src/types/commercial/Expediente.types.ts` y
  `src/types/compliance/InformationRequest.types.ts` ya tienen `ExpedienteDocument`,
  `ExpedienteDocumentUploadRequest`, `DocumentUploadPermission`, `InformationRequest`, `RequestItem`,
  `RequestResponse`, `RequestReview` y `RespondRequest`. Coinciden campo a campo con los DTO de la API
  (sección 2.2). No se tocan.
- **Diccionario.** `src/lib/labels/taxCompliance.ts` ya trae `DOCUMENT_REVIEW_LABELS`,
  `DOCUMENT_EXPIRED_LABEL`, `REQUEST_STATUS_LABELS_COMMERCIAL`, `TRIGGER_LABELS` y
  `COMMERCIAL_DOCUMENT_TYPE_LABELS` (cuyo orden de claves es el orden de los grupos del expediente).
  No se modifica.
- **Diálogo e insignia.** `src/components/shared/Dialog.tsx` (014) tiene pila de diálogos, Escape solo
  en el de arriba, foco que entra y vuelve y scroll bloqueado, pero **siempre** se cierra con Escape, el
  fondo y la X. La spec exige que el diálogo de carga no se cierre a mitad de la subida: hace falta una
  prop opcional (D-11). `StatusBadge` sirve tal cual.
- **Claves y consultas.** `taxProfileKeys` (`src/hooks/commercial/taxProfileKeys.ts`) tiene
  `onboardingDocuments` = `['commercial-onboarding', 'documents']`; `TAX_PROFILE_INVALIDATIONS` es el
  patrón de "listas de invalidación probables sin React". `retryUnlessForbiddenOrMissing`
  (`retryPolicy.ts`) no reintenta 403 ni 404. Valores por defecto (`ReactQueryProvider`): `staleTime`
  60 s, `retry: 1`, sin `refetchOnWindowFocus`; mutaciones sin reintento.
- **Carga a R2.** `OnboardingService.uploadDocumentFile(uploadUrl, file)` hace `fetch` `PUT` con
  `Content-Type: file.type` y sin `Authorization`; lanza `Error("Error al subir el archivo (status)")`
  sin la URL. `MAX_DOCUMENT_SIZE_BYTES` (10 MiB) y `ACCEPTED_DOCUMENT_MIME_TYPES` están en el mismo
  archivo, y `5-DocumentsStep.tsx` valida con los textos exactos de RN-3 ("El archivo supera el tamaño
  máximo de 10MB", "Formato no permitido. Usa PDF, JPG o PNG"). Se reutilizan los tres.
- **Errores.** `readApiError` (`src/lib/api/apiError.ts`) devuelve solo `status`, `message` y
  `details`, nunca `config`.
- **Fechas.** `formatPlainDate` (`AAAA-MM-DD` desde la cadena) y `formatBogotaDateTime` (ISO en hora de
  Colombia) en `src/lib/utils/dateDisplay.ts`.
- **Asistente.** `/commercial-onboarding` (`src/app/commercial-onboarding/page.tsx`, `'use client'`)
  monta su propio encabezado (logo y "Cerrar sesión") y `OnboardingWizard`. El asistente guarda el estado
  de cada paso en `useState` del propio asistente o del paso (la ficha usa react-hook-form dentro de
  `TaxProfileStep`): **navegar a otra ruta lo perdería**, y desmontar el paso también. Hay dos pantallas
  de retorno temprano (`underReview` y `ADVISOR_CONTACT_PENDING`) además del render normal (stepper +
  tarjeta del paso). El asistente usa `sessionStorage` y `window.location` en el pago (código previo), por
  eso no está en `noPiiLeaks.test.ts`; los archivos nuevos que monta sí lo estarán.
- **Pregunta abierta de la spec (resuelta): el panel de notificaciones NO existe en
  `/commercial-onboarding`.** `NotificationPanel` solo se monta en `src/components/commercial/layout/Header.tsx`
  (panel comercial, dentro de `DashboardLayout`), `src/components/admin/shared/Header.tsx`,
  `src/components/bars/NavBar.tsx` (consumidor) y `GameDesignerPanel.tsx`. La página del onboarding no lo
  usa. Por tanto RN-14 solo aplica en el panel comercial y en el onboarding basta el aviso de RN-12.
- **Notificaciones.** `NotificationPanel` (`src/components/notifications/NotificationsPanel.tsx`,
  `'use client'`) es compartido por cuatro encabezados; sus ítems no son clicables y solo tienen "Ver
  más". `NotificationResponseDTO` trae `type`, pero la API lo llena siempre con `IN_APP_NOTIFICATION`
  (no distingue): DEP-1 sigue siendo necesaria. El panel está en el alcance del consumidor
  (`__tests__/ui/consumerScope.ts`, vía `NavBar`), así que cualquier cambio debe dejar idéntico lo que ve
  el consumidor.
- **Sidebar.** `src/components/commercial/layout/Sidebar.tsx`: `menuItems` estático; un ítem sin
  `requiredPlans` ni `lockIfUnavailable` siempre se ve y se puede abrir. `isActive` marca los hijos por
  prefijo, así que el detalle resalta el ítem. Tiene 1 aviso de lint ajeno (`<img>`, línea 154).
- **"Mi perfil".** `TaxAndEstablishmentsLinks.tsx` (014, sin `'use client'`) es la tarjeta de accesos que
  montan `CommercialProfileSeller.tsx` y `CommercialProfilePremium.tsx`.
- **Ficha.** `IncomeSection.tsx` no tiene selector de soporte; `supportDocumentId` viaja oculto
  (`taxProfileSchema.ts`: `z.number().nullable()`, `null` en filas nuevas, el de la versión al precargar,
  copiado tal cual en `toSubmitRequest`). `TaxProfileForm.tsx` arma el esquema en cada validación con
  `createTaxProfileSchema({ today: todayInBogota() })`. `CommitmentBlock.tsx` muestra "Tienes una
  aclaración pendiente" sin enlace (`commitmentDisplay(...).pendingClarification`).
- **Barrido de PII.** `__tests__/taxProfile/noPiiLeaks.test.ts` falla con `console.`, `localStorage`,
  `sessionStorage`, `URLSearchParams`, `window.location`, `router.push/replace` con `?` y `href` con `?`
  en su lista `TARGETS`. Un `?tab=` en un `href` lo marcaría (D-2).
- **Rutas.** `routeAccess.ts` tiene `{ path: '/commercial', match: 'prefix', role: 'ROLE_COMMERCIAL' }` y
  `/commercial-onboarding` en `PUBLIC`. Las tres páginas nuevas quedan clasificadas por el prefijo. No se
  crea ningún route handler.
- **Lint.** Línea base de eslint sobre los archivos que se modifican (2026-10-29): un único aviso ajeno,
  el `<img>` de `Sidebar.tsx`. Ningún otro.

### 2.2 API (comprobado en el código, no supuesto)

- `GET /commercials/documents` (`@PreAuthorize("hasRole('COMMERCIAL')")`): documentos `VALIDATED` y
  `SUPERSEDED` del comercial, ordenados por `uploadedAt` descendente. **No exige `COMPLETED`**: sirve en el
  onboarding (documentos del paso de documentos, que guardan el comercial). `downloadUrl` firmada a 300 s
  en todos los listados (solo `null` en `PENDING`, que no se listan).
- `ExpedienteDocumentDTO` coincide con `ExpedienteDocument`: `issuedAt` y `expiresAt` son `LocalDate`
  (`AAAA-MM-DD`); `uploadedAt`, `supersededAt` y `reviewedAt` son `ZonedDateTime`; `expired` solo es
  `true` si hay `expiresAt` anterior a hoy en Bogotá.
- `POST /commercials/documents/prepare-upload` (`@Valid`): `documentType` y `contentType` obligatorios,
  `sizeBytes` positivo. Errores, todos **400** con `message`:
  - onboarding no `COMPLETED`: "El expediente se actualiza después de terminar el registro. Mientras
    tanto, cargue los documentos desde el paso de documentos del registro." (`InvalidRequestException`);
  - más de 10 MB: "Archivo muy grande. Máximo permitido: 10 MB" (`ValidationException`);
  - tipo no permitido: "Tipo de archivo no soportado. Use PDF, JPEG o PNG.";
  - reemplazo no vigente: "Solo se puede reemplazar un documento vigente."; de otro tipo: "El reemplazo
    debe ser del mismo tipo de documento (RUT)."; ajeno: "Documento no encontrado: N"
    (`ObjectNotFoundException`, que el manejador global responde con 400).
  - **Sin `replacesDocumentId` no comprueba si ya hay un vigente del mismo tipo** (C-5).
- `POST /commercials/documents/{documentId}/confirm`: "Este documento ya fue confirmado o descartado."
  (400); valida en R2 el tamaño y el tipo real del objeto; "El documento que intenta reemplazar ya no está
  vigente. Recargue el expediente." (400). Al confirmar el reemplazo, el anterior pasa a `SUPERSEDED` con
  `supersededAt`. Devuelve `ExpedienteDocumentDTO`.
- `GET /commercials/information-requests`: lista ordenada por `issuedAt` descendente, `communications`
  vacío. **No exige `COMPLETED`.** `GET /{requestPublicId}`: `@PathVariable UUID`; de otro empresario o
  inexistente → 404 (`EntityNotFoundException`, "Requerimiento no encontrado: …"). **Un valor que no es UUID
  no tiene manejador propio y cae en el genérico: 500 "Unexpected error"** (C-2).
- `RequestView` coincide con `InformationRequest`. Ojo: aquí `issuedAt` es `ZonedDateTime` (ISO con hora),
  no `AAAA-MM-DD` (C-1). `responses[].documentIds` trae **solo ids**, sin nombre de archivo (C-4).
- `POST /{requestPublicId}/responses` (`RespondRequest`: `message` `@Size(max = 2000)`, `documentIds`
  lista). En el servicio, todos 400 (`InvalidRequestException`): estado distinto de `OPEN`/`OBSERVED` →
  "Este requerimiento no está esperando una respuesta suya."; mensaje recortado vacío y sin documentos →
  "Escriba una aclaración o adjunte al menos un documento."; documento ajeno → "El documento N no está en
  su expediente."; no `VALIDATED` → "El documento N no está vigente en su expediente.". Recorta el mensaje,
  quita ids repetidos, pasa el estado a `RESPONDED` y devuelve el `RequestView`. No usa `Idempotency-Key`.
- Notificaciones: `communicate` crea "Solicitud de información de VERYGANA" (mensaje "Necesitamos que
  actualices o aclares información de tu expediente. Motivo: {reason}") y la revisión `INSUFFICIENT` crea
  "Tu respuesta tiene observaciones". `createInternalNotification` guarda `type = IN_APP_NOTIFICATION` para
  todas: ni tipo propio ni `requestPublicId` (DEP-1).
- `PUT /commercials/tax-profile`: cada `supportDocumentId` no nulo pasa por
  `requireOwnedValidatedDocument(id, commercialId, null)`: cualquier tipo, propio y `VALIDATED`; si no,
  400 "El documento N no está vigente en su expediente." (o "no está en su expediente").
- Todos los mensajes de la API terminan en punto; el front los muestra tal cual (C-3).

## 3. Archivos

### 3.1 Crear

| Archivo | Qué contiene |
|---|---|
| `src/lib/labels/expedienteRequests.ts` | `EXPEDIENTE_TEXTS` e `INFORMATION_REQUEST_TEXTS`: todos los textos literales de la spec (estados de pantalla, avisos, botones, RN-3, RN-6, RN-7, RN-9, RN-10, RN-15) y los de D-8; funciones `uploadedOn(fecha)`, `expiresOn(fecha)`, `supersededOn(fecha)`, `sentOn(fecha)`, `dueBefore(fecha)`, `closedOn(fecha)`, `expectedResponse(texto)`, `requestsNotice(n)`, `messageCounter(n)`, `supportOptionLabel(tipo, nombre)`. Sin `'use client'`. |
| `src/services/commercial/ExpedienteService.ts` | `list()`, `prepareUpload(body)`, `confirmUpload(documentId)` vía `apiClient`; `uploadFile(uploadUrl, file)` delega en `OnboardingService.uploadDocumentFile` (no duplica el `fetch`). |
| `src/services/commercial/InformationRequestService.ts` | `listMine()`, `getMine(publicId)`, `respond(publicId, body)` vía `apiClient`. |
| `src/hooks/commercial/expedienteKeys.ts` | `expedienteKeys` y `EXPEDIENTE_INVALIDATIONS` (sección 6). Sin `'use client'`. |
| `src/hooks/commercial/informationRequestKeys.ts` | `informationRequestKeys` e `informationRequestInvalidations` (sección 6). Sin `'use client'`. |
| `src/lib/expediente/expediente.ts` | `groupExpediente(docs)`, `addableDocumentTypes(docs)`, `currentDocumentOfType(docs, type)`, `documentNameById(docs)`, `supportSelectorState(input)` y `vigentSupportIds(docs)` (sección 6.3). |
| `src/lib/expediente/uploadFlow.ts` | `validateExpedienteFile(file)`, `createExpedienteUploadSchema(allowedTypes)`, `ExpedienteUploadError` (con `stage`), `runExpedienteUpload(input, deps)`, `uploadErrorMessage(err)` y `shouldRefetchExpedienteAfterError(err)` (sección 6.2). |
| `src/lib/expediente/openDocument.ts` | `DOWNLOAD_URL_MAX_AGE_MS`, `isDownloadUrlFresh(fetchedAt, now)` y `openExpedienteDocument(args)` con el abridor de ventanas inyectado (sección 6.4). Único sitio del código que lee `downloadUrl`. |
| `src/lib/informationRequests/requests.ts` | `AWAITING_RESPONSE_STATUSES`, `PENDING_TAB_STATUSES`, `HISTORY_TAB_STATUSES`, `splitRequestsByTab(list)`, `countAwaitingResponse(list)`, `canRespond(status)`, `needsToneBanner(trigger)`, `buildTimeline(request)`, `latestInsufficientReview(request)` e `isUuid(value)`. |
| `src/lib/informationRequests/respond.ts` | `RESPONSE_MESSAGE_MAX = 2000`, `respondSchema` (zod 4), `RespondFormValues`, `emptyRespondValues()`, `buildRespondBody(values)` y `respondErrorOutcome(err)`. |
| `src/lib/notifications/informationRequestNotifications.ts` | `INFORMATION_REQUEST_NOTIFICATION_TITLES` (constante única de RN-14), `INFORMATION_REQUESTS_PATH` y `commercialNotificationHref(notification)`. |
| `src/hooks/commercial/useExpediente.ts` | `'use client'`. `useExpediente()` y `useExpedienteUpload()`. |
| `src/hooks/commercial/useInformationRequests.ts` | `'use client'`. `useInformationRequests()`, `usePendingInformationRequestsCount()`, `useInformationRequest(publicId)` y `useRespondInformationRequest(publicId)`. |
| `src/components/commercial/expediente/ExpedienteUploadDialog.tsx` | `'use client'`. Diálogo de carga (react-hook-form + zod) en tres modos: `replace`, `add` e `item`. |
| `src/components/commercial/expediente/ExpedienteDocumentGroup.tsx` | `'use client'`. Grupo por tipo: vigente(s) e historial plegable. |
| `src/components/commercial/expediente/ExpedienteScreen.tsx` | `'use client'`. Pantalla de `/commercial/profile/documents` con todos sus estados. |
| `src/components/commercial/information-requests/InformationRequestsList.tsx` | `'use client'`. Pestañas y tarjetas; modo `profile` (enlaces) u `onboarding` (callback). |
| `src/components/commercial/information-requests/RequestTimeline.tsx` | Conversación (sin estado, sin `'use client'`). |
| `src/components/commercial/information-requests/RespondForm.tsx` | `'use client'`. Formulario de respuesta. |
| `src/components/commercial/information-requests/InformationRequestDetail.tsx` | `'use client'`. Detalle con todos sus estados; prop `canUploadDocuments`. |
| `src/components/commercial/information-requests/PendingRequestsBadge.tsx` | `'use client'`. Insignia de RN-11 (variantes `sidebar` y `card`). |
| `src/components/commercial/information-requests/OnboardingRequestsNotice.tsx` | `'use client'`. Aviso de RN-12 + `Dialog` con la lista y el detalle del onboarding. |
| `src/components/commercial/information-requests/OnboardingRequestsBrowser.tsx` | `'use client'`. Contenido del diálogo (lista ↔ detalle con estado local), cargado con `next/dynamic`. |
| `src/app/commercial/profile/documents/page.tsx` | Página de **servidor**: `metadata`, "Volver a Mi perfil", título "Mi expediente" y `<ExpedienteScreen />`. |
| `src/app/commercial/profile/information-requests/page.tsx` | Página de **servidor**: `metadata`, "Volver a Mi perfil", título "Solicitudes de información" y `<InformationRequestsList mode="profile" />`. |
| `src/app/commercial/profile/information-requests/[requestPublicId]/page.tsx` | Página de **servidor**: `params: Promise<{ requestPublicId: string }>` con `await` (P-6), "Volver a mis solicitudes" y `<InformationRequestDetail requestPublicId={…} canUploadDocuments />`. |
| Pruebas | `__tests__/expediente/expedienteTexts.test.ts`, `expedienteServices.test.ts`, `expedienteKeys.test.ts`, `expediente.test.ts`, `uploadFlow.test.ts`, `openDocument.test.ts`, `expedienteStatic.test.ts`; `__tests__/informationRequests/requests.test.ts`, `respond.test.ts`; `__tests__/notifications/informationRequestNotifications.test.ts`. |

### 3.2 Modificar

| Archivo | Cambio |
|---|---|
| `src/components/shared/Dialog.tsx` | Prop opcional `dismissible?: boolean` (por defecto `true`, así nada de lo existente cambia). Con `false`: Escape, el fondo y la X no cierran (la X queda `disabled`). |
| `src/lib/taxProfile/taxProfileSchema.ts` | `createTaxProfileSchema({ today, vigentSupportIds })`: el segundo parámetro, opcional (`ReadonlySet<number> \| null`, por defecto `null` = sin comprobar), añade un error en `incomeReports.{i}.supportDocumentId` si el soporte elegido no está en el conjunto. |
| `src/components/commercial/tax-profile/TaxProfileForm.tsx` | Llama a `useExpediente()`; guarda en un `useRef` el conjunto de vigentes (solo con la consulta en éxito) y el resolver lo lee; pasa a `IncomeSection` el estado de la consulta. Nada más. |
| `src/components/commercial/tax-profile/sections/IncomeSection.tsx` | Selector "Documento de soporte" por periodo, con `Controller` y `supportSelectorState` (RN-15). |
| `src/components/commercial/tax-profile/CommitmentBlock.tsx` | Con `pendingClarification`, el texto es un `next/link` a `/commercial/profile/information-requests` (RN-13). |
| `src/lib/taxProfile/display.ts` | Solo el comentario de `pendingClarification` (ya no "sin enlace"). |
| `src/components/commercial/profile/TaxAndEstablishmentsLinks.tsx` | Añade "Mi expediente" y "Solicitudes de información" (con `<PendingRequestsBadge variant="card" />`); título y descripción de D-8. |
| `src/components/commercial/layout/Sidebar.tsx` | Ítem "Solicitudes de información" (`/commercial/profile/information-requests`) antes de "Soporte", con `<PendingRequestsBadge variant="sidebar" />`. El `<img>` (aviso ajeno) no se toca. |
| `src/components/notifications/NotificationsPanel.tsx` | Prop opcional `getNotificationHref?: (n) => string \| null`. Solo si devuelve una ruta, el título y el mensaje del ítem van dentro de un `next/link` que cierra el panel; "Ver más" queda fuera del enlace. Sin la prop, el marcado es idéntico al de hoy. |
| `src/components/commercial/layout/Header.tsx` | Pasa `getNotificationHref={commercialNotificationHref}` al panel. |
| `src/components/commercial/onboarding/OnboardingWizard.tsx` | Monta `<OnboardingRequestsNotice />` entre el stepper y la tarjeta del paso, y arriba de las pantallas `underReview` y `ADVISOR_CONTACT_PENDING` (D-9). Nada más. |
| `__tests__/taxProfile/taxProfileSchema.test.ts` | Casos del soporte vigente / no vigente / sin comprobar. |
| `__tests__/taxProfile/noPiiLeaks.test.ts` | Añade a `TARGETS` los archivos nuevos y los modificados de esta entrega que no tienen deuda previa (lista en T25). |

No se tocan `src/middleware.ts`, `__tests__/middleware/routeAccess.ts`, `next.config.ts`, `package.json`,
`package-lock.json`, los tipos de la 014, `taxCompliance.ts`, `OnboardingService.ts` ni
`src/app/commercial-onboarding/page.tsx`.

## 4. Rutas y acceso

| Ruta | Archivo | Rol | Tipo |
|---|---|---|---|
| `/commercial/profile/documents` | `src/app/commercial/profile/documents/page.tsx` | `ROLE_COMMERCIAL` (prefijo `/commercial`: `matcher`, cuerpo del middleware y `ROLE_RULES`) | servidor; lo interactivo en `ExpedienteScreen` |
| `/commercial/profile/information-requests` | `…/information-requests/page.tsx` | igual | servidor; `InformationRequestsList` |
| `/commercial/profile/information-requests/[requestPublicId]` | `…/[requestPublicId]/page.tsx` | igual | servidor (`await params`, P-6); `InformationRequestDetail` |
| solicitudes en el onboarding | sin ruta (diálogo dentro de `/commercial-onboarding`, `PUBLIC`) | — | cliente, dentro del asistente |

- **P-4:** las tres páginas cuelgan de un prefijo ya protegido: no cambian el `matcher`, el cuerpo del
  middleware ni `routeAccess.ts`. `routeProtection.test.ts` las clasifica solo y las prueba con las seis
  identidades. No hay route handlers nuevos (`routeInventory.test.ts` no cambia).
- **Sin subruta del onboarding** (preferencia de la spec): las solicitudes del onboarding van en un
  `Dialog` sobre el asistente, que sigue montado debajo y no pierde nada (D-1). No hay nada que
  clasificar en `routeAccess.ts`.
- **P-5:** el middleware solo actúa con `MIDDLEWARE=ACTIVE`; la API protege los datos
  (`hasRole('COMMERCIAL')` y la propiedad del documento o la solicitud). Las pantallas muestran el 403
  como "sin permiso" y el 404 de otro empresario como "No encontramos esta solicitud".
- **P-2:** las tres `page.tsx` sin `'use client'`. `RequestTimeline` no lo lleva; `TaxAndEstablishmentsLinks`
  sigue sin él (la insignia es el único componente de cliente que monta).
- **P-6:** el detalle lee `const { requestPublicId } = await params`. Las otras dos no usan `params` ni
  `searchParams` (D-2).
- **P-7:** enlaces internos con `next/link`; sin imágenes nuevas. "Ver" abre la URL de R2 en otra pestaña
  (no es una página interna).
- **`DashboardLayout`** sigue redirigiendo al onboarding si no está `COMPLETED` (fuera de alcance
  cambiarlo). Por eso las páginas nuevas asumen onboarding completo y el detalle del perfil se monta con
  `canUploadDocuments`.

## 5. Contrato con la API

Todo vía `apiClient` salvo el `PUT` a R2. Los 401, 402, 503, el *timeout* y el 400 de cambio de plan los
resuelve el interceptor de `src/lib/api/client.ts` y no se reimplementan.

| Método y ruta | Servicio | Entrada → salida (`src/types`) | Errores y lo que ve el usuario |
|---|---|---|---|
| `GET /commercials/documents` | `ExpedienteService.list()` | — → `ExpedienteDocument[]` | Pantalla: red/5xx "No pudimos cargar tu expediente." + "Reintentar"; 403 "No tienes permiso para ver este expediente." sin reintento. Selector de soporte: "No pudimos cargar tus documentos", no bloquea. Detalle de solicitud: sin nombres de archivo ("Documento adjunto") y "Cargar documento" deshabilitado (D-7). |
| `POST /commercials/documents/prepare-upload` | `ExpedienteService.prepareUpload(body)` | `ExpedienteDocumentUploadRequest` → `DocumentUploadPermission` | 400 con `message` (tamaño, tipo, reemplazo no vigente o de otro tipo, documento ajeno, onboarding no completo): ese `message` en el diálogo, y la lista se vuelve a pedir. Otro: "No pudimos subir el documento. Intenta de nuevo". |
| `PUT {uploadUrl}` (R2) | `ExpedienteService.uploadFile(url, file)` → `OnboardingService.uploadDocumentFile` | el archivo, `Content-Type` = `file.type` (el declarado), sin `Authorization` | "No pudimos subir el documento. Intenta de nuevo". |
| `POST /commercials/documents/{documentId}/confirm` | `ExpedienteService.confirmUpload(id)` | — → `ExpedienteDocument` | 400 con `message` ("ya fue confirmado o descartado", "ya no está vigente. Recargue el expediente."): ese `message` y la lista se vuelve a pedir. Otro: el genérico. |
| `GET /commercials/information-requests` | `InformationRequestService.listMine()` | — → `InformationRequest[]` | Red/5xx "No pudimos cargar tus solicitudes." + "Reintentar"; 403 "No tienes permiso para ver estas solicitudes.". En el aviso del onboarding y en las insignias, un error no muestra nada (D-10). |
| `GET /commercials/information-requests/{id}` | `InformationRequestService.getMine(id)` | — → `InformationRequest` | No se llama si `id` no es UUID (C-2). 404 → "No encontramos esta solicitud." + "Volver a mis solicitudes"; 403 → "No tienes permiso para ver esta solicitud."; red/5xx → "No pudimos cargar la solicitud." + "Reintentar". |
| `POST /commercials/information-requests/{id}/responses` | `InformationRequestService.respond(id, body)` | `RespondRequest` (sin claves vacías) → `InformationRequest` | 400 con `message`: ese `message`, se conservan texto y documentos, y se vuelven a pedir detalle y lista (D-3). Red/5xx/otro: "No pudimos enviar tu respuesta. Intenta de nuevo". |
| `PUT /commercials/tax-profile` (existe, 014) | `TaxProfileService.submitTaxProfile` | cada periodo con `supportDocumentId` vigente o `null` | 400 "El documento N no está vigente…": el toast de la 014 con el `message`. |

**Nada falta en la API para esta entrega.** DEP-1 (tipo y `requestPublicId` en la notificación) queda
anotada para la API y no bloquea. Sugerencias no bloqueantes: C-2, C-4, C-5 y C-6.

## 6. Datos y estado (P-10)

### 6.1 Claves, consultas e invalidaciones

```ts
// src/hooks/commercial/expedienteKeys.ts
expedienteKeys = {
  all:  ['commercial-expediente'],
  list: ['commercial-expediente', 'list'],
}
EXPEDIENTE_INVALIDATIONS = {
  // RN-17: confirmar deja viejos el expediente (y con él el selector de soporte y los nombres del
  // detalle) y los documentos del onboarding.
  confirmUpload: [expedienteKeys.list, taxProfileKeys.onboardingDocuments],
  // Un 400 al preparar o confirmar suele ser "ya no está vigente": la lista está vieja.
  uploadRejected: [expedienteKeys.list],
}

// src/hooks/commercial/informationRequestKeys.ts
informationRequestKeys = {
  all:    ['commercial-information-requests'],
  list:   ['commercial-information-requests', 'list'],
  detail: (publicId) => ['commercial-information-requests', 'detail', publicId],
}
informationRequestInvalidations = {
  respond:         (publicId) => [list, detail(publicId)],   // RN-17 (y con la lista, las insignias)
  respondRejected: (publicId) => [detail(publicId), list],   // D-3
}
```

| Hook | Clave | Opciones |
|---|---|---|
| `useExpediente()` | `expedienteKeys.list` | `retry: retryUnlessForbiddenOrMissing`; `staleTime` por defecto (60 s). Lo usan la pantalla, el diálogo del ítem, el detalle (nombres) y la ficha (selector): una sola consulta compartida. |
| `useExpedienteUpload()` | — | `mutationFn: runExpedienteUpload(input, deps reales)`. `onSuccess`: recorre `EXPEDIENTE_INVALIDATIONS.confirmUpload`. `onError`: si `shouldRefetchExpedienteAfterError(err)`, `uploadRejected`. Devuelve el `ExpedienteDocument` confirmado (RN-8 necesita `id` y nombre). |
| `useInformationRequests()` | `informationRequestKeys.list` | `retry: retryUnlessForbiddenOrMissing`. |
| `usePendingInformationRequestsCount()` | `informationRequestKeys.list` | la misma consulta con `select: countAwaitingResponse` (las insignias solo se vuelven a pintar si cambia el número). |
| `useInformationRequest(publicId)` | `informationRequestKeys.detail(publicId)` | `enabled: isUuid(publicId)`; `retry: retryUnlessForbiddenOrMissing` (404 y 403 sin reintento). |
| `useRespondInformationRequest(publicId)` | — | `onSuccess(view)`: `setQueryData(detail, view)` y recorre `respond(publicId)`. `onError(err)`: si `respondErrorOutcome(err).refetch`, recorre `respondRejected(publicId)`. |

- Las invalidaciones van en listas declaradas sin `'use client'` para probarlas sin montar React
  (patrón de `TAX_PROFILE_INVALIDATIONS`).
- **Insignias (RN-11, CA-19):** Sidebar, tarjeta de "Mi perfil" y aviso del onboarding leen la misma clave
  `list`; responder la invalida, así que las tres bajan solas.
- **Volumen:** listas completas, sin paginar (la API no pagina). Pocas filas por empresario.

### 6.2 Carga en tres pasos (RN-3, RN-4, RN-8)

```text
runExpedienteUpload({ file, documentType, replacesDocumentId }, { prepare, put, confirm }):
  error = validateExpedienteFile(file)          // tamaño > 10 MiB o tipo fuera de PDF/JPEG/PNG
  si error → throw ExpedienteUploadError('validate', error)   // CA-4: nunca llama a prepare
  permiso = prepare({ documentType, originalFileName: file.name, contentType: file.type,
                      sizeBytes: file.size, ...(replacesDocumentId != null && { replacesDocumentId }) })
            (fallo → ExpedienteUploadError('prepare', causa))
  put(permiso.permission.uploadUrl, file)       (fallo → 'upload')
  return confirm(permiso.documentId)            (fallo → 'confirm')
```

- Cada intento empieza en `prepare` (el reintento nunca reanuda un `documentId` anterior): RN-4 y CA-5.
  Un `PENDING` que quede huérfano lo descarta la API (no se lista).
- `validateExpedienteFile` usa `MAX_DOCUMENT_SIZE_BYTES` y `ACCEPTED_DOCUMENT_MIME_TYPES` de
  `OnboardingService` y devuelve los textos de RN-3 (el tamaño se comprueba primero, como el onboarding).
- `uploadErrorMessage(err)`: `validate` → su texto; `prepare` o `confirm` con 400 y `message` → ese
  `message`; todo lo demás (incluido `upload`) → "No pudimos subir el documento. Intenta de nuevo".
- `shouldRefetchExpedienteAfterError(err)`: `true` con un 400 en `prepare` o `confirm`.
- `ExpedienteUploadError` guarda la causa para leer `status`/`message` con `readApiError`, pero su
  `message` es siempre el genérico: nunca la URL firmada ni la configuración de axios.
- `createExpedienteUploadSchema(allowedTypes)` (zod 4): `documentType` ∈ `allowedTypes` ("Selecciona un
  tipo de documento"), `file` un `File` ("Selecciona un archivo") que además pasa
  `validateExpedienteFile`. El diálogo valida al elegir el archivo (`mode: 'onChange'`), así el mensaje
  de RN-3 aparece en ese momento (CA-4).

### 6.3 Expediente y soporte

- `groupExpediente(docs)` → `{ type, current: ExpedienteDocument[], history: ExpedienteDocument[] }[]`:
  - grupos en el orden de las claves de `COMMERCIAL_DOCUMENT_TYPE_LABELS`; un tipo sin documentos no
    aparece;
  - `current`: los `VALIDATED` del tipo, del más reciente al más antiguo (normalmente uno; ver D-6 y C-5);
  - `history`: los `SUPERSEDED`, por `supersededAt` descendente;
  - `PENDING` y `ORPHANED` se descartan aunque llegaran (CA-1).
- `addableDocumentTypes(docs)`: tipos del diccionario sin ningún `VALIDATED` (CA-3); vacío → el botón
  "Agregar documento" no se pinta.
- `currentDocumentOfType(docs, type)`: el `VALIDATED` más reciente del tipo o `null` (lo usa "Cargar
  documento" para `replacesDocumentId`, RN-8).
- `documentNameById(docs)`: `Map<id, originalFileName>` para la conversación (C-4).
- `supportSelectorState({ status, documents, currentId })` → `{ disabled, note, options }`, con
  `options: { value: number | null; label: string; stale?: true }[]`:
  - siempre primero `{ value: null, label: 'Sin soporte' }`;
  - `pending`: `disabled`, nota "Cargando documentos…"; si `currentId`, también la opción "Documento
    guardado" para que el `<select>` no muestre otro valor (D-5);
  - `error`: habilitado, nota "No pudimos cargar tus documentos"; si `currentId`, "Documento guardado"
    (D-5);
  - `success`: los `VALIDATED` como "{tipo} — {nombre}" (`COMMERCIAL_DOCUMENT_TYPE_LABELS`); si
    `currentId` no está entre ellos, `{ value: currentId, label: 'Documento ya no vigente', stale: true }`.
- `vigentSupportIds(docs)` → `Set` de ids `VALIDATED`. `TaxProfileForm` lo pasa al esquema solo con la
  consulta en éxito; en carga o error pasa `null` y no comprueba (CA-23: el error no bloquea). Con un
  soporte no vigente, el esquema da "Este documento ya no está vigente. Elige otro o «Sin soporte»" en
  `incomeReports.{i}.supportDocumentId` (sección e, que se abre sola por `sectionForField`).
- El resolver de `TaxProfileForm` lee el conjunto de un `useRef` que se actualiza en cada render: así no
  depende de que react-hook-form tome un resolver nuevo.

### 6.4 "Ver" (RN-5)

```text
openExpedienteDocument({ documentId, documents, fetchedAt, now, refetch, openWindow }):
  doc = documents.find(id); url = doc?.downloadUrl
  si url y isDownloadUrlFresh(fetchedAt, now)   // menos de DOWNLOAD_URL_MAX_AGE_MS = 4 min (D-4)
     → openWindow(url)  y 'opened'
  si no:
     placeholder = openWindow()     // en el mismo clic, para que el navegador no la bloquee
     placeholder.opener = null
     docs = await refetch()          // la lista se vuelve a pedir (CA-6)
     url = docs.find(id)?.downloadUrl
     url ? placeholder.location.replace(url) : placeholder.close()  → 'opened' | 'failed'
```

- En el componente, `openWindow = (url) => url ? window.open(url, '_blank', 'noopener,noreferrer') :
  window.open('', '_blank')`, y `fetchedAt = query.dataUpdatedAt`. `'failed'` → toast "No pudimos abrir el
  documento. Intenta de nuevo".
- La URL nunca se guarda en estado, en almacenamiento, en un `href` ni en la URL de una ruta del front; solo
  vive en la caché en memoria de Query (P-16, CA-6, CA-24). Un barrido estático exige que `downloadUrl`
  solo aparezca en `openDocument.ts` y en los tipos (T25).

### 6.5 Solicitudes

- `splitRequestsByTab(list)` → `{ pending, history }`: `OPEN`, `OBSERVED`, `RESPONDED` / `CLOSED_SATISFIED`,
  `CLOSED_WITH_FINDING`, `CANCELLED`, cada una por `issuedAt` descendente (`Date.parse`; no se confía en el
  orden de la API).
- `countAwaitingResponse(list)`: cuántas en `OPEN` u `OBSERVED` (RN-11, RN-12).
- `canRespond(status)`: `OPEN` u `OBSERVED` (RN-6).
- `needsToneBanner(trigger)`: `MISSING_MANIFESTATION`, `EXPRESS_REFUSAL` o `INCIDENT` (RN-10).
- `buildTimeline(request)`: respuestas y revisiones en una lista por fecha ascendente (empate: la
  respuesta antes que la revisión). El cierre ("Cerrada el …" y `closingNotes`) lo añade el componente al
  final si `closedAt`.
- `latestInsufficientReview(request)`: la última revisión `INSUFFICIENT` (se resalta arriba del formulario
  en `OBSERVED`).
- `isUuid(value)`: UUID canónico (8-4-4-4-12 hexadecimal, sin distinguir mayúsculas). Si no lo es, el
  detalle muestra "No encontramos esta solicitud" sin llamar a la API (CA-17, C-2).

### 6.6 Respuesta (RN-6, RN-7, P-11)

- `RespondFormValues = { message: string; documents: { id: number; name: string }[] }`.
- `respondSchema` (zod 4): `message` ≤ 2000 sobre el texto tal cual ("Máximo 2000 caracteres"); si
  `message.trim()` está vacío y no hay documentos → "Escribe una aclaración o adjunta al menos un
  documento" en `message`.
- `buildRespondBody(values)`: `{ message: trim }` solo si no está vacío; `{ documentIds }` (sin repetir)
  solo si hay documentos. Nunca una clave vacía (CA-10).
- `respondErrorOutcome(err)` → `{ message, refetch }`: 400 con `message` → ese `message` y `refetch: true`;
  todo lo demás → "No pudimos enviar tu respuesta. Intenta de nuevo" y `refetch: false`.
- Doble envío (CA-16): guarda síncrona con `useRef` en el `onSubmit` (como `approvingRef` de la 015) +
  botón `disabled` con `isSubmitting || mutation.isPending`. El área de texto, "Cargar documento" y
  "Quitar" también se deshabilitan mientras envía.
- Tras un 200: el detalle guarda en estado local `justResponded` y muestra el mensaje de RN-7 aunque la
  consulta se vuelva a pedir; el formulario desaparece porque el estado ya es `RESPONDED`.
- Tras un 400: el formulario sigue montado (no se le cambia la `key`), así que conserva texto y documentos;
  si el detalle releído ya no espera respuesta, el formulario desaparece porque ya no hay qué responder.

## 7. UI

### 7.1 `ExpedienteScreen` (`/commercial/profile/documents`)

| Estado | Qué se ve |
|---|---|
| Cargando | Esqueleto `animate-pulse` de tres grupos, `role="status"` con "Cargando tu expediente…" solo para lector de pantalla. |
| Error / 403 | "No pudimos cargar tu expediente." + "Reintentar" (`refetch`) / "No tienes permiso para ver este expediente." sin reintento. |
| Vacío | "Aún no tienes documentos en tu expediente." y "Agregar documento". |
| Con documentos | Cabecera con "Agregar documento" (si `addableDocumentTypes` no está vacío). Un `ExpedienteDocumentGroup` por grupo. |
| Éxito al subir | El diálogo se cierra, toast "Documento cargado"; la lista se vuelve a pedir por la invalidación. |

`ExpedienteDocumentGroup`: título del tipo (`h2`); por cada vigente, una tarjeta con nombre del archivo
(`break-words`), "Cargado el {formatBogotaDateTime(uploadedAt)}", `StatusBadge` de revisión (`null` →
"Sin revisar"), `StatusBadge` "Vencido" si `expired`, "Vence el {formatPlainDate(expiresAt)}" si lo hay, y
`reviewNotes` si las hay; botones "Ver" y "Reemplazar". Debajo, si hay historial, `CollapsibleSection`
(014, `aria-expanded`/`aria-controls`) "Historial" cerrado por defecto, con nombre, "Reemplazado el
{fecha}" y "Ver". Sin eliminar ni editar (CA-7). Las insignias llevan texto (no solo color).

`ExpedienteUploadDialog` (props `open`, `onClose`, `target`, `onUploaded(doc)`):

| `target` | Título | Contenido |
|---|---|---|
| `{ kind: 'replace', document }` | "Reemplazar {tipo}" | Aviso "El documento anterior quedará en tu historial", archivo. Envía `replacesDocumentId = document.id` y su `documentType` (CA-2). |
| `{ kind: 'add', types }` | "Agregar documento" | `<select>` "Tipo de documento" con placeholder y solo `types`, archivo. Sin `replacesDocumentId` (CA-3). |
| `{ kind: 'item', documentType, replaces }` | "Cargar {tipo}" | Si `replaces`, el aviso de RN-1; archivo. Envía `replacesDocumentId` si `replaces` (RN-8). |

- react-hook-form + `zodResolver(createExpedienteUploadSchema(allowed))`, `mode: 'onChange'`. Archivo con
  `<input type="file" accept=".pdf,.jpg,.jpeg,.png">` y `<label>`; ayuda "PDF, JPG o PNG, máximo 10 MB";
  error con `aria-describedby`.
- "Subir" (`type="submit"`) deshabilitado con indicador mientras `isPending`; `Dialog
  dismissible={!isPending}` (no se cierra con Escape, fondo ni X a mitad de la subida).
- Error: texto de `uploadErrorMessage` en el diálogo (`role="alert"`); el archivo sigue elegido; "Subir"
  vuelve a empezar desde preparar (CA-5).
- Se carga con `next/dynamic` solo al abrirse (como `RefusalReasonDialog` en la 015).

### 7.2 `InformationRequestsList`

- Pestañas "Pendientes" / "Historial" (`role="tablist"`, botones `role="tab"` con `aria-selected` y
  `aria-controls`, panel `role="tabpanel"`; flechas izquierda/derecha cambian de pestaña). Estado local
  (D-2).
- Tarjeta: `StatusBadge` (`REQUEST_STATUS_LABELS_COMMERCIAL`), tipo (`TRIGGER_LABELS`), `reason`
  (`line-clamp-3`, `break-words`), "Enviada el {formatBogotaDateTime(issuedAt)}" (C-1) y "Responder antes del
  {formatPlainDate(dueDate)}" si lo hay. En `mode="profile"` la tarjeta es un `next/link` al detalle; en
  `mode="onboarding"`, un `button` que llama a `onSelect(publicId)`.
- Estados: esqueleto de tres tarjetas; vacíos por pestaña ("No tienes solicitudes pendientes." / "Aún no
  tienes solicitudes cerradas."); error con "Reintentar"; 403.

### 7.3 `InformationRequestDetail`

Props: `requestPublicId`, `canUploadDocuments`, `back` (`{ href }` en el perfil u `{ onBack }` en el
onboarding). Orden de la spec:

1. Cabecera: `StatusBadge`, tipo, "Enviada el …", "Responder antes del …".
2. Banner informativo (azul, `role="note"`, no rojo) "Esta solicitud es una aclaración sobre el compromiso de
   formalización. No es una sanción." si `needsToneBanner` (CA-14).
3. "Qué te pedimos": por ítem, `description`, "Respuesta esperada: {acceptableResponse}" si la hay; en
   `DOCUMENT`, el tipo y:
   - con `canUploadDocuments`: botón "Cargar documento" (abre `ExpedienteUploadDialog` en modo `item` con
     `currentDocumentOfType`), deshabilitado mientras el expediente carga o si falló (D-7, con "No pudimos
     cargar tu expediente" + "Reintentar") y mientras se envía la respuesta;
   - sin `canUploadDocuments`: la nota de RN-9.
   - si `linkedDocumentId`: "Ya tenemos un documento de este tipo en tu expediente; VERYGANA revisará si es
     suficiente".
4. "Por qué": `reason` y `relationToOperation`.
5. "Conversación": `RequestTimeline` (lista ordenada `ol`; respuestas con texto `whitespace-pre-line`,
   documentos por nombre con `documentNameById` o "Documento adjunto", "Recibida el {fecha}"; revisiones con
   "Suficiente" / "Insuficiente" (texto, no solo color), nota y fecha; al final "Cerrada el {fecha}" y
   `closingNotes` si está cerrada). Sin conversación: "Aún no hay respuestas." (D-8).
6. En `OBSERVED`, la última revisión "Insuficiente" resaltada arriba del formulario.
7. `RespondForm` solo si `canRespond(status)`; `RESPONDED`: "Tu respuesta está en revisión por VERYGANA.";
   cerradas: sin formulario (CA-13).
8. Tras enviar: "Recibimos tu respuesta. VERYGANA la revisará; la solicitud se cierra cuando termine la
   revisión" (`role="status"`) (CA-10).

Estados: esqueleto; no UUID o 404 → "No encontramos esta solicitud." + "Volver a mis solicitudes"
(enlace en el perfil, botón "Volver a la lista" en el onboarding); 403; error con "Reintentar".

`RespondForm`: `useForm<RespondFormValues>({ resolver: zodResolver(respondSchema), defaultValues:
emptyRespondValues() })`; `<label>` "Aclaración", `<textarea maxLength={2000}>`, contador "{n}/2000" con
`useWatch`, `aria-describedby` al contador y al error; lista de documentos de esta respuesta con "Quitar"
(cada uno con `aria-label="Quitar {nombre}"`); "Enviar respuesta". El documento cargado desde un ítem se
añade con `setValue('documents', […])` sin repetir id. El error de envío va en `role="alert"` sobre el
botón.

### 7.4 Onboarding (RN-12)

`OnboardingRequestsNotice` (en el asistente, sección 3.2):

- `usePendingInformationRequestsCount()`; con 0, cargando o error no pinta nada (D-10), **salvo que el
  diálogo esté abierto**: así responder la última pendiente no desmonta el diálogo ni el mensaje de RN-7.
- Aviso informativo (`role="status"`): `requestsNotice(n)` ("VERYGANA te envió 1 solicitud de información"
  / "… {n} solicitudes de información") y el botón "Ver solicitudes".
- `Dialog size="lg" title="Solicitudes de información"` con `OnboardingRequestsBrowser` (cargado con
  `next/dynamic`, `ssr: false`): estado local `selectedId`; lista (`mode="onboarding"`) o detalle
  (`canUploadDocuments={false}`, `back={{ onBack }}`). Cerrar el diálogo (X, Escape, fondo) vuelve al paso:
  el asistente nunca se desmonta, así que el paso conserva lo que tenía (CA-18).

### 7.5 Menú, "Mi perfil" y notificaciones

- `PendingRequestsBadge`: con 0 o sin datos no pinta nada; con N, una píldora con el número y
  `<span className="sr-only">solicitudes pendientes</span>`. `variant="sidebar"` (colores del menú oscuro) o
  `"card"`.
- Sidebar: `menuItems` con `{ href: '/commercial/profile/information-requests', icon: Inbox (lucide),
  label: 'Solicitudes de información', badge: 'pendingInformationRequests' }` antes de "Soporte"; el `Link`
  pinta la insignia al final.
- `TaxAndEstablishmentsLinks`: título "Información tributaria, expediente y solicitudes", descripción y
  cuatro enlaces ("Información tributaria", "Establecimientos", "Mi expediente", "Solicitudes de
  información" + insignia) (D-8). `flex-wrap` para 360 px.
- Notificaciones: `commercialNotificationHref(n)` devuelve `INFORMATION_REQUESTS_PATH` si
  `n.title` es **exactamente** uno de los dos títulos (sin recortar ni comparar sin mayúsculas); si no,
  `null` y el ítem queda como hoy (CA-20). Al hacer clic se navega y el panel se cierra (`onToggle`). Si el
  onboarding no está completo, `DashboardLayout` lleva al onboarding, donde está el aviso.

### 7.6 Ficha (RN-13, RN-15)

- `CommitmentBlock`: "Tienes una aclaración pendiente" como `Link` subrayado a la lista (CA-21).
- `IncomeSection`: en cada periodo, `<select>` "Documento de soporte" con `Controller` (valor `""` ↔
  `null`, número ↔ id), opciones y nota de `supportSelectorState`, `disabled` en carga, error del esquema
  bajo el campo. Periodo nuevo: "Sin soporte" (ya es `null` en `emptyTaxProfileValues`). Desde el selector
  no se carga nada. Aplica igual en el perfil y en el paso del onboarding (es el mismo formulario).

### 7.7 Responsive, accesibilidad y textos

- Desde 360 px sin scroll horizontal: tarjetas, cabeceras y botones apilados (`flex-col sm:flex-row`,
  `flex-wrap`), nombres de archivo y textos libres con `break-words`, la conversación como lista vertical, y
  los diálogos con el `max-h-[90vh]` y scroll del `Dialog` existente.
- Teclado: diálogos con foco que entra y vuelve; Escape salvo mientras sube; pestañas con flechas; plegables
  con `aria-expanded`; cada campo con `label`; errores con `aria-describedby`/`aria-invalid`.
- Todos los textos en `src/lib/labels/expedienteRequests.ts`, en español y literales de la spec; los que la
  spec no fija están en D-8. Ningún texto presenta una solicitud como sanción ni dice que responder la
  resuelve o la cierra (RN-7, RN-10; los prueba `expedienteTexts.test.ts`).

## 8. Configuración

Ninguna variable de entorno nueva, ningún host en `images.remotePatterns` (los documentos se abren en otra
pestaña, no se pintan con `next/image`), ningún cambio en `next.config.ts`.

## 9. Dependencias

Ninguna nueva (P-1). Se usan las instaladas: `@tanstack/react-query`, `react-hook-form`,
`@hookform/resolvers`, `zod`, `axios`, `react-hot-toast` y `lucide-react`.

## 10. Seguridad y PII (P-16, P-12)

- Datos sensibles de la entrega: `downloadUrl` y `uploadUrl` (URL firmadas), `holderIdentification`
  (identificación del titular), nombres de archivo, `reason`, `relationToOperation`, `closingNotes`, notas de
  revisión y el texto de las respuestas.
- `holderIdentification` no se muestra en esta entrega; solo existe en el tipo. Barrido estático: no
  aparece en `src/components/commercial/expediente`, `information-requests` ni `src/lib/expediente`.
- `downloadUrl`: solo en `openDocument.ts` (y tipos); `uploadUrl`: solo en `uploadFlow.ts` (y tipos). Nunca
  en estado de React, `href`, `router`, almacenamiento ni consola. "Ver" abre R2 directo, sin ruta propia.
- Rutas del front: solo el `requestPublicId` (UUID, no es dato personal) en la ruta del detalle; nada en
  query (las pestañas son estado local, D-2).
- Errores: `readApiError` (sin `config`, que lleva la cabecera de autorización y el cuerpo con el texto de
  la respuesta); `ExpedienteUploadError` con mensaje genérico. Ningún `console.*`.
- Verificación automática: `noPiiLeaks.test.ts` con los archivos nuevos en `TARGETS` y
  `expedienteStatic.test.ts` (T25). Manual: DevTools (Console, Application → Storage, barra de direcciones).
- El token sigue el flujo de `apiClient` + `tokenStore`; el `PUT` a R2 va sin `Authorization`.

## 11. Llamadas salientes del servidor

No aplica: no se agrega ninguna ruta de `src/app/api` ni ningún `fetch` de servidor (P-15). Las páginas de
servidor nuevas no piden datos; todo va desde el navegador (`apiClient`, 30 s; el `PUT` a R2 con `fetch`
del navegador, como hoy en el onboarding).

## 12. Efectos colaterales

- Confirmar una carga: la API pasa el anterior a `SUPERSEDED` y registra una auditoría `CRITICAL`; en el
  front se refrescan el expediente, el selector de soporte de la ficha, los nombres del detalle y los
  documentos del onboarding (que usa la sección a de la ficha para el RUT).
- Responder: la solicitud pasa a `RESPONDED`; bajan el Sidebar, "Mi perfil" y el aviso del onboarding.
  Compliance la verá en la entrega D.
- Notificaciones: no hay tiempo real nuevo. Una notificación que llega por SSE no invalida la lista de
  solicitudes; la insignia se pone al día en la próxima lectura (≤ 60 s de `staleTime`, o al navegar) (R-4).
- `NotificationPanel` cambia solo para el panel comercial (prop opcional); consumidor, admin y diseñador
  de juegos no cambian.
- Si una validación falla antes de llamar a la API: un archivo inválido no pide permiso de carga (no se crea
  ningún `PENDING`); una respuesta vacía o de más de 2000 no llama al `POST`; un `requestPublicId` que no es
  UUID no llama al `GET`; un soporte no vigente no envía la ficha (no se crea versión).

## 13. Trazabilidad

| CA | Tareas | Cómo se verifica |
|---|---|---|
| CA-1 | T4, T14 | `expediente.test.ts` (grupos en orden, vigente arriba, historial, sin `PENDING`/`ORPHANED`); manual T14. |
| CA-2 | T2, T5, T13, T14 | `uploadFlow.test.ts` (`replacesDocumentId` = id y mismo tipo), `expedienteServices.test.ts`; `expedienteTexts.test.ts` (aviso literal); manual T13/T14 (el anterior pasa al historial). |
| CA-3 | T4, T5, T13, T14 | `expediente.test.ts` (`addableDocumentTypes`, vacío sin botón), `uploadFlow.test.ts` (sin la clave); manual T14. |
| CA-4 | T5, T13 | `uploadFlow.test.ts` (validación antes de `prepare`: `prepare` no se llama; textos de RN-3); manual T13 (Network sin `prepare-upload`). |
| CA-5 | T5, T11, T13 | `uploadFlow.test.ts` (fallo en `put` y en `confirm` → sin `confirm` / reintento empieza en `prepare`; `uploadErrorMessage`; `shouldRefetchExpedienteAfterError`), `expedienteKeys.test.ts`; manual T13. |
| CA-6 | T6, T14, T25 | `openDocument.test.ts` (fresca → abre sin pedir; vieja → `refetch` y abre la nueva; falla → cierra); `expedienteStatic.test.ts` (`downloadUrl` confinada); manual T14. |
| CA-7 | T2, T14, T25 | `expedienteServices.test.ts` (el servicio solo tiene `list`, `prepareUpload`, `confirmUpload`, `uploadFile`); `expedienteStatic.test.ts` (sin "Eliminar"/"Editar"/`delete` en los componentes del expediente); manual T14. |
| CA-8 | T7, T15 | `requests.test.ts` (pestañas y orden); manual T15. |
| CA-9 | T1, T7, T17 | `requests.test.ts` (`buildTimeline` cronológico), `expedienteTexts.test.ts` ("Respuesta esperada", aviso de `linkedDocumentId`); manual T17. |
| CA-10 | T1, T2, T8, T11, T16, T17 | `respond.test.ts` (`buildRespondBody` sin claves vacías, tres casos), `expedienteServices.test.ts` (POST y ruta), `informationRequestKeys` en `expedienteKeys.test.ts`, `expedienteTexts.test.ts` (RN-7); manual T17. |
| CA-11 | T8, T16 | `respond.test.ts` (vacío, solo espacios, 2000 sí, 2001 no); manual T16. |
| CA-12 | T4, T13, T16, T17 | `expediente.test.ts` (`currentDocumentOfType`); manual T17 (sube al expediente, aparece con "Quitar", estado sin cambio hasta enviar). |
| CA-13 | T1, T7, T17 | `requests.test.ts` (`canRespond`), `expedienteTexts.test.ts`; manual T17. |
| CA-14 | T1, T7, T17, T25 | `requests.test.ts` (`needsToneBanner` en los diez triggers), `expedienteTexts.test.ts` ("sanción" solo como "No es una sanción"); manual T17. |
| CA-15 | T8, T11, T16 | `respond.test.ts` (`respondErrorOutcome` 400 / 500 / red), `expedienteKeys.test.ts` (`respondRejected`); manual T16. |
| CA-16 | T16, T25 | `expedienteStatic.test.ts` (guarda `useRef` en `RespondForm`); manual T16 (doble clic: un `POST`). |
| CA-17 | T7, T11, T17, T19 | `requests.test.ts` (`isUuid`); manual T19 (UUID ajeno, inexistente y `abc`: sin `GET` en Network para `abc`). |
| CA-18 | T1, T7, T22 | `expedienteTexts.test.ts` (`requestsNotice(1)` y `(2)`), `requests.test.ts` (`countAwaitingResponse`); manual T22. |
| CA-19 | T3, T7, T18, T20 | `expedienteKeys.test.ts` (responder invalida la lista), `requests.test.ts`; manual T20. |
| CA-20 | T9, T21, T25 | `informationRequestNotifications.test.ts` (títulos exactos, variaciones → `null`), `expedienteStatic.test.ts` (los títulos solo en la constante); manual T21. |
| CA-21 | T24, T25 | `expedienteStatic.test.ts` (`CommitmentBlock` enlaza a la ruta); manual T24. |
| CA-22 | T4, T10, T23 | `expediente.test.ts` (`supportSelectorState`), `taxProfileSchema.test.ts`, `taxProfileMapping.test.ts` (sin cambios: fila nueva `null`); manual T23. |
| CA-23 | T4, T10, T23 | `expediente.test.ts` ("Documento ya no vigente", error → solo "Sin soporte"), `taxProfileSchema.test.ts` (no vigente bloquea; `null` no comprueba); manual T23. |
| CA-24 | T6, T25 | `noPiiLeaks.test.ts`, `expedienteStatic.test.ts`; manual T25 (DevTools). |
| CA-25 | T19, T26 | `npx vitest run __tests__/middleware`; las cinco puertas; `git diff` vacío de `package*.json`, `src/middleware.ts`, `routeAccess.ts` y `next.config.ts`. |

## 14. Riesgos

- **R-1 · Datos para probar a mano.** Las solicitudes solo se crean como compliance
  (`POST /compliance/information-requests`, sin pantalla hasta la 017), y las revisiones también. Hace falta
  crearlas con un cliente HTTP y el token de un `ROLE_COMPLIANCE_OFFICER`, y tener un empresario
  `COMPLETED` y otro en el onboarding. La lógica queda cubierta por Vitest; lo que no se pueda producir se
  anota en el PR (excepción de P-17).
- **R-2 · Ventana emergente.** El navegador puede bloquear la pestaña de "Ver" si no sale del mismo clic;
  por eso se abre la pestaña vacía antes del `refetch`. Si el bloqueador la impide igual, se ve el toast de
  fallo. Se comprueba a mano en Chrome y Safari.
- **R-3 · `NotificationPanel` está en el alcance del consumidor** (spec 012: `consumerInteractive.test.ts` y
  `e2e/`). El cambio es opcional por prop y sin ella el marcado no cambia; aun así T26 corre
  `npx vitest run __tests__/ui` y las pruebas de navegador.
- **R-4 · Insignia con retraso.** Sin invalidación por SSE, una solicitud nueva aparece en la insignia en la
  próxima lectura de la lista. Aceptable para esta entrega.
- **R-5 · Bundle del asistente.** El aviso es pequeño; la lista, el detalle y el formulario entran con
  `next/dynamic` solo al abrir el diálogo. Se compara el First Load JS de `/commercial-onboarding` en
  `npm run build` (hoy 239 kB, según la 015).
- **R-6 · Duplicados de vigentes.** La API acepta una carga sin `replacesDocumentId` aunque ya haya un
  vigente del tipo (C-5). El front nunca lo provoca (el ítem deshabilita "Cargar documento" sin lista, D-7) y
  muestra todos los vigentes si existieran (D-6).
- **R-7 · Diálogos anidados.** En el detalle del perfil, `ExpedienteUploadDialog` se abre sobre la página (no
  sobre otro diálogo). En el onboarding no hay carga, así que no hay anidación.

## 15. Decisiones para el usuario

- **D-1 · Solicitudes del onboarding en un diálogo, sin ruta nueva.** El asistente sigue montado debajo y
  conserva el paso (RN-12). Alternativa: subruta `/commercial-onboarding/information-requests` (habría que
  clasificarla en `PUBLIC` de `routeAccess.ts`) — se descarta porque navegar desmontaría el asistente y
  perdería lo escrito en el paso.
- **D-2 · Pestaña activa en estado local, no en `?tab=`** (la spec dice "puede"). Evita `searchParams` y que
  `noPiiLeaks` marque `href` con `?`. Consecuencia: "Volver a mis solicitudes" vuelve a "Pendientes".
  Alternativa: leer `searchParams` en la página de servidor y enlazar con `href={{ pathname, query }}`.
- **D-3 · Ante cualquier 400 al responder se vuelven a pedir el detalle y la lista** (no solo el de estado),
  para no depender del texto del mensaje de la API. Texto y documentos se conservan si la solicitud sigue
  esperando respuesta.
- **D-4 · "Ver": margen de 4 minutos** (`DOWNLOAD_URL_MAX_AGE_MS`) sobre los 5 de la URL, y la pestaña se
  abre vacía en el clic y se redirige tras el `refetch`. Alternativa: pedir la lista y pedir al usuario que
  pulse "Ver" de nuevo.
- **D-5 · Selector de soporte con la lista en carga o con error y un soporte ya guardado:** se conserva el
  valor con la opción "Documento guardado" (la API decide al enviar), en vez de perderlo en silencio.
  CA-23 dice "solo «Sin soporte»"; la diferencia aparece solo cuando la versión ya traía soporte.
  Alternativa literal: dejarlo en "Sin soporte" (`null`) y perder el soporte en la nueva versión.
- **D-6 · Si hubiera varios vigentes de un tipo**, se muestran todos arriba (el más reciente primero), cada
  uno con "Ver" y "Reemplazar". Informativa (C-5).
- **D-7 · "Cargar documento" deshabilitado si el expediente no cargó**, con "No pudimos cargar tu
  expediente" + "Reintentar", porque sin la lista no se sabe qué vigente reemplazar.
- **D-8 · Textos que la spec no fija:** "Cargando tu expediente…" (lector), "Reemplazar {tipo}", "Agregar
  documento" (título), "Cargar {tipo}", "Tipo de documento", "Selecciona un tipo de documento", "Archivo",
  "Selecciona un archivo", "PDF, JPG o PNG, máximo 10 MB", "No pudimos abrir el documento. Intenta de nuevo",
  "Documento adjunto", "Recibida el {fecha}", "Aún no hay respuestas.", "Volver a la lista", "{n}/2000",
  "Máximo 2000 caracteres", "Quitar {nombre}" (lector), "solicitudes pendientes" (lector), "VERYGANA te envió 1
  solicitud de información" (singular), "No pudimos cargar tu expediente" (en el detalle), "Documento
  guardado", "Este documento ya no está vigente. Elige otro o «Sin soporte»", "Documento de soporte" (etiqueta)
  y el título de la tarjeta de "Mi perfil" "Información tributaria, expediente y solicitudes". Se aceptan
  salvo que digas otra cosa.
- **D-9 · El aviso de RN-12 también en las pantallas "Cuenta en revisión" y "Un asesor te contactará"**, que
  no tienen paso pero pueden recibir solicitudes. Alternativa: solo encima del paso.
- **D-10 · El aviso del onboarding y las insignias no muestran nada si la lista falla** (no hay sitio para un
  error sin estorbar el paso). La página de solicitudes sí muestra el error.
- **D-11 · `Dialog` compartido (014) gana la prop `dismissible`** (por defecto `true`: ningún uso actual
  cambia). Informativa.
- **D-12 · `issuedAt` de las solicitudes con fecha y hora de Colombia** (C-1).

## 16. Contradicciones con la spec o la API

- **C-1 · `issuedAt` no es `AAAA-MM-DD` en las solicitudes.** RN-16 lo agrupa con `dueDate` y `expiresAt`,
  pero en `RequestView` es `ZonedDateTime`; solo el `issuedAt` del documento es `LocalDate` (y no se muestra).
  El plan lo formatea con `formatBogotaDateTime`. Conviene corregir RN-16.
- **C-2 · Un `requestPublicId` que no es UUID da 500 en la API** (`MethodArgumentTypeMismatchException` sin
  manejador propio cae en "Unexpected error"), no 404. El front no lo envía (`isUuid`). Sugerencia para la
  API: responder 400/404.
- **C-3 · Mensajes con punto final.** La spec cita los `message` de la API sin punto; la API los manda con
  punto y en "usted" ("Escriba…"). Se muestran tal cual; los textos de validación del front van como dice la
  spec ("Escribe…").
- **C-4 · Las respuestas no traen nombres de documento.** `ResponseView.documentIds` son solo ids; el
  detalle los resuelve con la lista del expediente (una consulta más, compartida). Sugerencia para la API:
  devolver `{ id, originalFileName }`.
- **C-5 · `prepare-upload` sin `replacesDocumentId` no rechaza un tipo que ya tiene vigente**, así que
  podrían quedar dos `VALIDATED` del mismo tipo. Sugerencia para la API: exigir `replacesDocumentId` en ese
  caso.
- **C-6 · Sin onboarding, `prepare-upload` responde 400 con el id interno** ("…para userId: N"), que el
  front mostraría como `message`. No ocurre desde estas pantallas (el empresario siempre tiene onboarding).
  Sugerencia para la API: mensaje sin id.
- **C-7 · `instrucciones.md` (fase 5) pide "Disponible al terminar tu registro"** en el expediente; la spec
  manda (redirección de `DashboardLayout` y el 400 de la API). Informativa.
- **C-8 · `type` de la notificación siempre `IN_APP_NOTIFICATION`.** Confirma que hoy solo se puede
  reconocer por título (DEP-1).

## 17. Bloqueos

Ninguno. La spec está aprobada, no choca con `CLAUDE.md` ni con `docs/constitution.md`, y todos los
endpoints y campos que usa existen en la API. DEP-1 no bloquea.
