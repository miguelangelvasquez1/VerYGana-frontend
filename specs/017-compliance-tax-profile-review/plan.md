# 017 · Plan: cola y revisión de fichas, revisión de documentos y caso del empresario (entrega D, parte 1)

- **Spec:** `spec.md` de esta carpeta (Estado: Aprobada, 2026-11-02).
- **Contrato con la API:** `specs/014-tax-profile-and-compliance-case/backend-contract.md` (0.2, 2, 3, 5.1 a
  5.4 y 6), comprobado contra el checkout de la API (solo lectura, `../VerYGanaAPI`, `a0f4183`):
  `controllers/tax/ComplianceTaxProfileController.java`, `controllers/compliance/ComplianceExpedienteController.java`,
  `controllers/declarations/DeclarationController.java` (`history`),
  `controllers/inforequests/ComplianceInformationRequestController.java` (`search`, `findings`, `incidents`),
  `services/tax/TaxProfileServiceImpl.java` (`list` 182-190, `getForCompliance`, `getVersionForCompliance`,
  `reviewSection` 204-236, `toComplianceResponse` 400-409, `getProfileByPublicIdOrThrow` 411-414),
  `services/tax/TaxProfileViews.java` (`statusFrom` 69-75), `services/tax/TaxCatalogServiceImpl.java` (`listAll` 33-38),
  `models/tax/TaxCatalogEntry.java` (restricción `uk_tax_catalog_type_code`),
  `services/commercial/CommercialExpedienteDocumentServiceImpl.java` (`listForCompliance` 157-161, `review`
  165-218), `services/commercial/DocumentHolderMatcher.java`, `services/declarations/DeclarationServiceImpl.java`
  (`historyForCompliance` 150-154), `services/inforequests/ComplianceCaseServiceImpl.java` (`listFindings`,
  `listIncidents`), `services/inforequests/InformationRequestServiceImpl.java` (`search` 146-150),
  `services/UserIdResolver.java` (`toInternalId` 47-56), `dtos/tax/TaxProfileDTOs.java`,
  `dtos/tax/TaxRequestDTOs.java` (`SectionReviewRequest`), `dtos/user/commercial/expediente/DocumentReviewRequestDTO.java`,
  `dtos/inforequests/InformationRequestDTOs.java` (`FindingView`, `IncidentView`, `RequestView`),
  `dtos/PagedResponse.java` y `exceptions/GlobalExceptionHandler.java`.
- **Depende de:** las entregas A, B y C (specs 014, 015 y 016), en el árbol de trabajo sin commitear. Se reutilizan
  sus tipos, el diccionario, `Dialog` (con `dismissible`), `StatusBadge`, `groupExpediente`,
  `openExpedienteDocument` + `documentsFromRefetch`, `isUuid`, `readApiError`, `retryUnlessForbiddenOrMissing`,
  `formatCents`, `formatPlainDate`/`formatBogotaDateTime`, `groupCatalog` y `displayCode` (`src/lib/taxProfile/catalog.ts`),
  `CollapsibleSection` y `noPiiLeaks.test.ts`.
  No se duplican.
- **Fecha del plan:** 2026-11-02. Lecturas sobre `dev` en `a911175` más el árbol de la 014, 015 y 016. Línea base
  (ronda 3 de la 016, mismo día): `npm test` 42 archivos y 1151 pruebas en verde; `npx next lint` 348 avisos =
  `.lint-max-warnings`. Eslint sobre los cinco archivos que se modifican (`ComplianceLayout.tsx`,
  `compliance/ui/primitives.tsx`, `shared/Dialog.tsx`, `labels/taxCompliance.ts`, `noPiiLeaks.test.ts`): 0 avisos.
- **Tareas:** `tasks.md` de esta carpeta (23 tareas en 7 bloques).
- **Ajuste (2026-11-02):** el usuario resolvió las decisiones de la sección 15 y la spec ganó RN-12 a RN-14, CA-28 y
  CA-29. Cambian el contrato (catálogo de compliance), el modelo de campos ("código — etiqueta"), las claves, el aviso
  de cambio de versión y las tareas T1-T3, T5, T6, T11 y T14-T16. El número de tareas no cambia.

## 1. Resumen

Tres páginas de servidor nuevas bajo `/compliance` (cola de fichas, revisión de una ficha y caso del empresario)
que delegan en componentes de cliente; un ítem nuevo en el menú de compliance; dos diálogos de revisión
(sección de la ficha y documento del expediente) con react-hook-form + zod y guarda de doble envío; un comparador
de versiones de solo lectura, y cuatro pestañas de solo lectura en el caso (compromiso, requerimientos, hallazgos e
incidencias). Los códigos tributarios se ven como «código — etiqueta» con el catálogo de compliance y, si la ficha
cambia de versión mientras se revisa, se avisa (RN-12, RN-13). Toda la lógica decidible (parámetros de URL, modelo de campos de la ficha y su diff, resúmenes,
resolución del RUT, esquemas y cuerpos de las dos revisiones, errores por pestaña, navegación por teclado y foco
atrapado) va en funciones puras con prueba Vitest escrita primero. Sin cambios en el middleware ni en
`routeAccess.ts`, sin route handlers, sin variables de entorno y sin dependencias nuevas.

## 2. Lo que se encontró al leer el código

### 2.1 Front

- **Tipos (014).** `TaxProfileSummary`, `ComplianceTaxProfileResponse`, `TaxProfileVersionDetail`, `SectionReview`,
  `SectionReviewRequest`, `VersionSummary`, `Establishment` (`TaxProfile.types.ts`), `ExpedienteDocument` y
  `DocumentReviewRequest` (`Expediente.types.ts`), `Manifestation` (`Declaration.types.ts`), `InformationRequest`,
  `Finding`, `Incident`, `FindingSeverity`, `AccountStatus` (`InformationRequest.types.ts`) y `PagedResponse<T>`
  (`src/types/Generic.types.ts`) coinciden campo a campo con los DTO de la API (sección 2.2). No se tocan.
- **Diccionario.** `src/lib/labels/taxCompliance.ts` tiene `TAX_PROFILE_STATUS_LABELS`, `SECTION_REVIEW_LABELS`,
  `SECTION_REVIEW_PENDING`, `DOCUMENT_REVIEW_LABELS`, `DOCUMENT_EXPIRED_LABEL`, `MANIFESTATION_LABELS`,
  `REQUEST_STATUS_LABELS_COMPLIANCE`, `INCOME_*`, `ESTABLISHMENT_RELATION_LABELS`, `CONTRACTUAL_MEASURE_LABELS`,
  `FINDING_CLASSIFICATION_LABELS`, `TAX_PROFILE_SECTION_TITLES` (cuyo orden de claves es a → h), `TRIGGER_LABELS` y
  `COMMERCIAL_DOCUMENT_TYPE_LABELS`. **Faltan** la gravedad (`FindingSeverity`) y el estado de la cuenta
  (`AccountStatus`) que pide RN-11: se agregan (D-14). La vocación tiene sus textos en
  `COMMERCIAL_ACTIVITY_TYPE_LABELS` de `src/services/ComplianceService.ts` ("Productos" / "Servicios"); se
  reutilizan desde el componente (el archivo importa `apiClient`, así que no se importa desde la lógica pura).
- **Textos del estado (RN-14, D-2 resuelta).** El filtro de la cola usa "Enviada / Observada / Revisada / Todas" y las
  insignias, el diccionario de la 014 ("En revisión", "Con observaciones", "Revisada"), como la 014 y el contrato
  (sección 3). CA-8 ya dice "Con observaciones".
- **Lectura de la ficha (014).** `TaxProfileReadView.tsx` pinta las ocho secciones para el empresario con textos de
  empresario ("Esta información no le da acceso a tu asesor…") y sin lugar para la columna de revisión, el RUT ni el
  historial de sedes. No se reutiliza el componente: se crea un **modelo puro de campos por sección**
  (`sectionFields`) que sirve a la vez para pintar lo declarado y para el diff de versiones (sección 6.3).
  Los códigos se pintan con el catálogo (punto siguiente). `sectionReviewDisplay` (`display.ts`) da insignia y nota
  pero no la fecha; la lógica nueva busca la revisión completa.
- **Catálogo (014).** `src/lib/taxProfile/catalog.ts` ya tiene `displayCode(code, entries)` ("código — etiqueta"; el
  código solo si no está; "—" sin código) y `groupCatalog(entries)` (por tipo, los cinco siempre presentes), con prueba
  en `__tests__/taxProfile/catalog.test.ts`. Se reutilizan sin cambios (D-3). Ojo: `displayCode` busca solo por `code`,
  pero en la API el código es único **por tipo** (`uk_tax_catalog_type_code`), no global; con los retirados incluidos
  el riesgo de choque crece. Por eso a cada campo se le pasa la lista de su tipo (`groupCatalog(entries).REGIME`, …),
  nunca el catálogo entero. El catálogo del empresario (`TaxProfileService.getTaxCatalog`,
  `GET /commercials/tax-profile/catalog`, clave `taxProfileKeys.catalog`) es de otro rol y solo trae vigentes: compliance
  usa el suyo, con clave propia.
- **Expediente (016).** `groupExpediente` (vigentes arriba, historial por `supersededAt`, sin `PENDING`/`ORPHANED`)
  sirve tal cual. `ExpedienteDocumentGroup.tsx` tiene "Reemplazar" y no muestra titular ni expedición: compliance
  tiene su propio grupo. `openExpedienteDocument` + `documentsFromRefetch` (`openDocument.ts`) y el adaptador de
  `ExpedienteScreen.tsx:51-63` (`window.open(url, '_blank', 'noopener,noreferrer')`, pestaña vacía si hay que pedir
  de nuevo) son el patrón de "Ver"; aquí se encapsula en un hook (`useOpenCaseDocument`). `shouldShowLoadError`
  evita tapar una lista ya cargada con un refetch fallido.
- **Trampa de TanStack v5 (review 016, B1).** `query.refetch()` no rechaza: siempre pasar por
  `documentsFromRefetch`. Y **`setQueryData` cambia `dataUpdatedAt`**: si tras revisar un documento se parchea la
  lista en la caché, `isDownloadUrlFresh` creería frescas las URL de los demás documentos, que tienen la edad de la
  lectura anterior. Por eso la revisión de documento **invalida y espera la relectura**, nunca parchea (R-2).
- **Diálogo.** `src/components/shared/Dialog.tsx`: pila, Escape solo en el de arriba, foco que entra y vuelve,
  `dismissible`. **No atrapa el foco con Tab**, que la spec pide ("diálogos con foco atrapado"): se agrega (D-10).
  Lo usan ocho componentes de la 014-016. El `Modal` de `compliance/ui/primitives.tsx` no tiene `dismissible` ni
  título con `aria-labelledby`; no se usa.
- **Compliance.** `ComplianceLayout.tsx` (`'use client'`): `NAV` estático que se pinta igual en el riel de escritorio
  y en el cajón móvil (un solo cambio cubre los dos, CA-1); la miga muestra `short` de la entrada activa.
  `primitives.tsx`: `PanelHeader`, `Ledger*`, `Th`, `Td`, `SkeletonRows`, `EmptyState`, `ErrorState` (con
  "Reintentar"), `Pager` ("Página N de M", anterior/siguiente), `Tabs` (botones con `aria-pressed`, sin roles de
  pestañas ni flechas; sirve para el filtro, no para el caso), `Btn` (`loading` con `Loader2`), `StatusTag`. Los
  paneles existentes piden datos con `useEffect` (deuda de P-10); lo nuevo usa TanStack Query. `LedgerRow` no
  acepta clic ni teclado: se le agrega `onActivate` opcional (sin él, el marcado no cambia).
- **Consultas.** `ReactQueryProvider`: `staleTime` 60 s, `retry: 1`, sin `refetchOnWindowFocus`; mutaciones sin
  reintento. `retryUnlessForbiddenOrMissing` (`src/hooks/commercial/retryPolicy.ts`) no reintenta 403/404; se
  importa tal cual.
- **Rutas.** `/compliance` y `/compliance/:path*` están en el `matcher`; el cuerpo exige `COMPLIANCE_OFFICER`
  (`src/middleware.ts:132-140`) y `routeAccess.ts` tiene `{ path: '/compliance', match: 'prefix', role:
  'ROLE_COMPLIANCE_OFFICER' }`. Las tres páginas quedan clasificadas por el prefijo. El parámetro `from` del login
  lleva solo la ruta, nunca la query. Ninguna prueba de `e2e/` ni de `__tests__/ui` cubre compliance. El árbol ya
  trae un cambio ajeno en `routeAccess.ts` (`/explore/recognitions`, anterior a la 016): no se toca.
- **Barrido de PII.** `noPiiLeaks.test.ts` marca `console.`, `localStorage`, `sessionStorage`, `URLSearchParams`,
  `window.location`, `router.push/replace(` con `?` antes del `)`, y `href=` con un literal que contiene `?`. Esta
  entrega necesita `?status=`, `?page=` y `?tab=`: las URL se arman en funciones de `src/lib/compliance/routes.ts`
  sin `URLSearchParams` (los valores son enums y enteros) y los componentes llaman `router.push(queuePath(…))` o
  `href={casePath(…)}`, que el barrido no marca. Los nombres de esas funciones no terminan en `href` en minúscula.
- **Formularios.** Patrón de la 016 (`RespondForm.tsx`): `useForm` + `zodResolver`, `submittingRef` comprobado en la
  primera línea del `onSubmit`, botón `disabled` con `Loader2`; prueba estática `guardsDoubleSubmit`
  (`__tests__/expediente/expedienteStatic.test.ts:38`). zod 4.

### 2.2 API (comprobado en el código, no supuesto)

- Los cuatro controllers llevan `@PreAuthorize("hasRole('COMPLIANCE_OFFICER')")` (en `DeclarationController`, en el
  método). Un admin recibe 403.
- `GET /compliance/tax-profiles`: `status` opcional (enum; uno desconocido da 400 genérico, el front nunca lo manda),
  `@PageableDefault(size = 20, sort = "updatedAt", DESC)`. `PagedResponse` con `data` y `meta` (`page`, `size`,
  `totalElements`, `totalPages`, `hasNext`, `hasPrevious`, `sorted`). Sin `status`, `findAll` (todas).
- `GET /compliance/tax-profiles/{id}`: `@PathVariable UUID`. Sin ficha → 404 "El empresario todavía no ha enviado la
  ficha tributaria." (`EntityNotFoundException` → 404, `GlobalExceptionHandler:801`). **UUID de un usuario que no
  existe → 404 "User with public id: {uuid} not found"** (`UserIdResolver.toInternalId`) (C-5). `versions` viene
  **ordenado por número descendente** e incluye la vigente. `establishmentHistory` = todas las sedes (activas y
  cerradas). `profile.sectionReviews` = la última revisión de cada sección **de la versión vigente** (una sección sin
  revisión no aparece).
- `GET …/versions/{n}`: 404 "Versión N de la ficha no encontrada.".
- `GET /compliance/tax-catalog` (mismo controller y rol): `List<CatalogEntry>` con **activos y retirados** (`listAll`,
  sin filtro de vigencia; `active` calculado al día en Bogotá), ordenado por tipo y código, sin parámetros ni paginación.
  Las mismas DTO que ya tipa `CatalogEntry` en `TaxProfile.types.ts`.
- `POST …/sections/{section}/review` (`@Valid`, `SectionReviewRequest`: `result` `@NotNull`, `notes`
  `@Size(max = 1000)`): `OBSERVED` con nota vacía o en blanco → 400 "Indique la observación para que el empresario
  pueda aclararla."; recorta la nota (`trimToNull`); **siempre revisa la versión vigente en ese momento**, sin
  comprobar cuál vio el revisor (C-4, R-8); recalcula el estado (`statusFrom`: alguna `OBSERVED` → `OBSERVED`; las
  ocho con revisión → `REVIEWED`; si no, `SUBMITTED`) y devuelve `ComplianceTaxProfileResponse`.
- `GET /compliance/commercials/{id}/documents`: `VALIDATED` y `SUPERSEDED` con `downloadUrl` (5 min). **Empresario
  inexistente → 404 "Commercial with public id: {uuid} not found"** (`EntityNotFoundException`), no 400 como dice la
  nota de la spec (C-1).
- `POST /compliance/commercial-documents/{documentId}/review` (`@Valid`, `holderIdentification` `@Size(max = 30)`,
  `notes` `@Size(max = 1000)`, fechas `LocalDate`). En el servicio, todos 400: documento inexistente "Documento no
  encontrado: N" (`ObjectNotFoundException` → 400); no `VALIDATED` → "Solo se revisan documentos vigentes del
  expediente."; `NOT_REVIEWED` → "El resultado debe ser ACCEPTED, OBSERVED o REJECTED."; sin nota al observar o
  rechazar → "Indique la observación o el motivo del rechazo."; vencimiento anterior a expedición → "La fecha de
  vencimiento no puede ser anterior a la de expedición."; aceptar RUT / Cámara / certificación bancaria (titular =
  NIT, con o sin dígito de verificación) o cédula del representante (titular = documento del representante) sin
  titular → "Para aceptar este documento indique el NIT o la cédula del titular."; titular que no corresponde → "El
  titular del documento no corresponde al empresario. Márquelo como OBSERVED o REJECTED.". **Guarda tal cual lo que
  llega: un campo ausente borra el valor anterior** (`setIssuedAt(dto.getIssuedAt())`, etc.) (C-8, D-6). Devuelve
  `ExpedienteDocumentDTO`.
- `GET /compliance/commercials/{id}/declarations/FORMALIZATION_COMMITMENT`: `Manifestation[]` por `occurredAt` desc
  e `id` desc. `GET …/findings` (`decidedAt` desc), `GET …/incidents` (`occurredAt` desc; `reportedBySystem =
  reportedByUserId == null`). `GET /compliance/information-requests?commercialPublicId=` (`issuedAt` desc, 20 por
  página). En los cuatro, un UUID inexistente → 404 "User with public id: … not found" (C-1).
- Un valor que no es UUID en el path no tiene manejador propio: 500 "Unexpected error" (como C-2 de la 016). El front
  no lo envía (`isUuid`).

## 3. Archivos

### 3.1 Crear

| Archivo | Qué contiene |
|---|---|
| `src/lib/labels/complianceTaxReview.ts` | `COMPLIANCE_TAX_REVIEW_TEXTS` (`as const`, con funciones): todos los literales de la spec (estados de las tres pantallas, nota de la vocación, botones, mensajes de RN-4/RN-5, vacíos por pestaña, "Sistema", "Compliance", "Revisión guardada", "No pudimos guardar la revisión. Intenta de nuevo.", el aviso de RN-13 `versionChanged(n)`) y los de D-13; `QUEUE_FILTER_LABELS` (Enviada, Observada, Revisada, Todas) y `CASE_TAB_LABELS`. Sin `'use client'`. |
| `src/lib/compliance/routes.ts` | `TAX_PROFILES_PATH`, `QUEUE_PAGE_SIZE = 20`, `parseQueueParams(sp)`, `queuePath(state)`, `queueApiParams(state)`, `taxProfileReviewPath(id)`, `CASE_TABS`, `parseCaseTab(value)`, `casePath(id, tab)`, `nextTabIndex(current, key, count)` (sección 6.2). |
| `src/lib/compliance/taxProfileFields.ts` | Modelo de campos por sección y diff: `SECTION_ORDER`, `sectionFields(section, version, catalog)`, `diffSection(section, older, current, catalog)`, `comparableVersions(versions, current)` (sección 6.3). `catalog` es un `GroupedCatalog` (014). |
| `src/lib/compliance/taxProfileReview.ts` | `latestSectionReview(reviews, section)`, `summarizeSectionReviews(reviews)`, `resolveRutDocument(input)`, `sortManifestationsDesc(list)`, `establishmentHistory(list)`, `versionChangedDuringReview(before, after)` (sección 6.4). |
| `src/lib/compliance/sectionReview.ts` | `SECTION_NOTES_MAX = 1000`, `createSectionReviewSchema(result)`, `SectionReviewFormValues`, `buildSectionReviewBody(result, values)`, `reviewErrorMessage(err)` (sección 6.5). |
| `src/lib/compliance/documentReview.ts` | `HOLDER_MAX = 30`, `DOCUMENT_NOTES_MAX = 1000`, `requiresHolder(type)`, `createDocumentReviewSchema(type)`, `DocumentReviewFormValues`, `documentReviewDefaults(doc)`, `buildDocumentReviewBody(values)`, `documentReviewErrorOutcome(err)` (sección 6.6). |
| `src/lib/compliance/loadErrors.ts` | `tabErrorView(error, tab)` y `reviewLoadView(error)` (sección 6.7). |
| `src/lib/a11y/focusTrap.ts` | `trappedFocusIndex({ index, count, shiftKey })` (sección 7.6). |
| `src/services/compliance/ComplianceTaxProfileService.ts` | `list(params)`, `get(id)`, `getVersion(id, n)`, `reviewSection(id, section, body)` y `getCatalog()` vía `apiClient`. |
| `src/services/compliance/ComplianceCaseService.ts` | `listDocuments(id)`, `reviewDocument(documentId, body)`, `listCommitment(id)`, `listRequests(id, page)`, `listFindings(id)`, `listIncidents(id)` vía `apiClient`. |
| `src/hooks/compliance/complianceKeys.ts` | `complianceTaxProfileKeys`, `complianceTaxCatalogKeys`, `complianceCaseKeys` y `COMPLIANCE_INVALIDATIONS` (sección 6.1). Sin `'use client'`. |
| `src/hooks/compliance/useComplianceTaxProfiles.ts` | `'use client'`. `useTaxProfileQueue(state)`, `useComplianceTaxProfile(id)`, `useComplianceTaxProfileVersion(id, n)`, `useComplianceTaxCatalog()`, `useReviewTaxProfileSection(id)`. |
| `src/hooks/compliance/useComplianceCase.ts` | `'use client'`. `useCaseDocuments(id, enabled?)`, `useReviewCaseDocument(id)`, `useCaseCommitment(id)`, `useCaseRequests(id, page)`, `useCaseFindings(id)`, `useCaseIncidents(id)`. |
| `src/hooks/compliance/useOpenCaseDocument.ts` | `'use client'`. "Ver" sobre la consulta de documentos: `openExpedienteDocument` + `documentsFromRefetch` + `noopener,noreferrer` + toast de fallo; devuelve `{ open(doc), openingId }`. |
| `src/components/compliance/tax-profiles/TaxProfileQueue.tsx` | `'use client'`. Cola con filtro, tabla, paginación y estados. |
| `src/components/compliance/tax-profiles/TaxProfileReview.tsx` | `'use client'`. Pantalla de revisión: estados, cabecera, selector de comparación, secciones, diálogo. |
| `src/components/compliance/tax-profiles/ReviewHeader.tsx` | Cabecera: empresa, NIT, insignia, versión, vocación con su nota y "Ver caso del empresario". Sin estado. |
| `src/components/compliance/tax-profiles/DeclaredSection.tsx` | Lo declarado de una sección desde `sectionFields` (con el catálogo agrupado), más el RUT (a), la tabla de ingresos (e) y el historial de sedes (f). |
| `src/components/compliance/tax-profiles/RutDocumentLink.tsx` | `'use client'`. "Ver RUT" con `resolveRutDocument` y `useOpenCaseDocument`. |
| `src/components/compliance/tax-profiles/SectionReviewPanel.tsx` | Columna derecha: último resultado, nota, fecha y los tres botones. |
| `src/components/compliance/tax-profiles/SectionReviewDialog.tsx` | `'use client'`. Diálogo de revisión de sección (react-hook-form + zod). Cargado con `next/dynamic`. |
| `src/components/compliance/tax-profiles/VersionCompare.tsx` | `'use client'`. Comparación lado a lado (solo lectura). Cargado con `next/dynamic`. |
| `src/components/compliance/case/CommercialCase.tsx` | `'use client'`. Cabecera del caso, pestañas accesibles y panel activo. |
| `src/components/compliance/case/CaseTabs.tsx` | `'use client'`. `tablist`/`tab` con tabindex itinerante y flechas, Inicio y Fin (`nextTabIndex`). |
| `src/components/compliance/case/CaseTaxProfileTab.tsx` | `'use client'`. Resumen y "Abrir revisión de la ficha". |
| `src/components/compliance/case/CaseDocumentsTab.tsx` | `'use client'`. Expediente agrupado con "Ver" y "Revisar". |
| `src/components/compliance/case/CaseDocumentGroup.tsx` | Grupo por tipo: vigentes con insignias, titular, fechas, notas, "Ver" y "Revisar"; historial plegable con "Ver". |
| `src/components/compliance/case/DocumentReviewDialog.tsx` | `'use client'`. Diálogo "Revisar documento" (react-hook-form + zod). Cargado con `next/dynamic`. |
| `src/components/compliance/case/CaseCommitmentTab.tsx`, `CaseRequestsTab.tsx`, `CaseFindingsTab.tsx`, `CaseIncidentsTab.tsx` | `'use client'`. Las cuatro pestañas de solo lectura. |
| `src/components/compliance/case/TabState.tsx` | Esqueleto, vacío y error dentro de una pestaña (`tabErrorView`). |
| `src/app/compliance/tax-profiles/page.tsx` | **Servidor.** `metadata`, `await searchParams` (P-6), `parseQueueParams`, `<TaxProfileQueue status page />`. |
| `src/app/compliance/tax-profiles/[commercialPublicId]/page.tsx` | **Servidor.** `await params`, `<TaxProfileReview commercialPublicId />`. |
| `src/app/compliance/commercials/[commercialPublicId]/page.tsx` | **Servidor.** `await params` y `await searchParams`, `parseCaseTab`, `<CommercialCase commercialPublicId initialTab />`. |
| Pruebas | `__tests__/complianceTaxReview/`: `complianceTexts.test.ts`, `complianceServices.test.ts`, `complianceKeys.test.ts`, `routes.test.ts`, `taxProfileFields.test.ts`, `taxProfileReview.test.ts`, `sectionReview.test.ts`, `documentReview.test.ts`, `loadErrors.test.ts`, `complianceStatic.test.ts` y el auxiliar `staticScan.ts` (sin `.test`); `__tests__/a11y/focusTrap.test.ts`. |

### 3.2 Modificar

| Archivo | Cambio |
|---|---|
| `src/lib/labels/taxCompliance.ts` | `FINDING_SEVERITY_LABELS: Record<FindingSeverity, string>` y `ACCOUNT_STATUS_LABELS: Record<AccountStatus, string>` (D-14). Nada más. |
| `src/components/compliance/ComplianceLayout.tsx` | Entrada de `NAV` `{ title: 'Fichas tributarias', short: 'Fichas', href: '/compliance/tax-profiles', icon: FileSpreadsheet }` (lucide), después de "Contratos comerciales". Nada más. |
| `src/components/compliance/ui/primitives.tsx` | `LedgerRow` acepta `onActivate?: () => void` y `ariaLabel?: string`: con él, la fila es enfocable (`tabIndex={0}`), responde a clic y a Enter, y lleva `cursor-pointer` y anillo de foco. Sin él, idéntico a hoy. |
| `src/components/shared/Dialog.tsx` | Foco atrapado: en el diálogo de arriba, Tab y Mayús+Tab circulan dentro del panel con `trappedFocusIndex` (D-10). Nada más cambia. |
| `__tests__/taxProfile/noPiiLeaks.test.ts` | Añade a `TARGETS` los archivos y carpetas nuevos de la 017 y `ComplianceLayout.tsx` (lista en T22). |

No se tocan `src/middleware.ts`, `__tests__/middleware/routeAccess.ts`, `next.config.ts`, `package.json`,
`package-lock.json`, los tipos de la 014, `src/lib/taxProfile/catalog.ts`, `src/lib/expediente/*`, los componentes comerciales de la 014-016 ni
`retryPolicy.ts`.

## 4. Rutas y acceso

| Ruta | Archivo | Rol | Tipo |
|---|---|---|---|
| `/compliance/tax-profiles` | `src/app/compliance/tax-profiles/page.tsx` | `ROLE_COMPLIANCE_OFFICER` (prefijo `/compliance`: `matcher`, cuerpo y `ROLE_RULES` ya existentes) | servidor; `await searchParams`; lo interactivo en `TaxProfileQueue` |
| `/compliance/tax-profiles/[commercialPublicId]` | `…/[commercialPublicId]/page.tsx` | igual | servidor (`await params`); `TaxProfileReview` |
| `/compliance/commercials/[commercialPublicId]` | `src/app/compliance/commercials/[commercialPublicId]/page.tsx` | igual | servidor (`await params`, `await searchParams`); `CommercialCase` |

- **P-4:** las tres páginas cuelgan de un prefijo ya protegido: no cambian el `matcher`, el cuerpo del middleware ni
  `routeAccess.ts`. `routeProtection.test.ts` las clasifica solo y las prueba con las seis identidades (CA-25). No hay
  route handlers nuevos (`routeInventory.test.ts` no cambia).
- **P-5:** el middleware solo actúa con `MIDDLEWARE=ACTIVE`; la API autoriza cada dato (`hasRole('COMPLIANCE_OFFICER')`).
  Un 403 se muestra como "No tienes permiso para ver esta sección." sin reintento.
- **P-2:** las tres `page.tsx` sin `'use client'`; también sin la directiva `ReviewHeader`, `DeclaredSection`,
  `SectionReviewPanel`, `CaseDocumentGroup` y `TabState` (no tienen estado; los montan componentes de cliente).
- **P-6:** `params` y `searchParams` tipados como `Promise<…>` y leídos con `await`. La página pasa valores ya
  parseados (`parseQueueParams`, `parseCaseTab`) como props.
- **Navegación (D-12):** la cola es de **props**: el filtro y la paginación hacen `router.push(queuePath(next))`, la
  página de servidor vuelve a leer `searchParams` y pasa los props nuevos (el botón "atrás" y la recarga conservan la
  vista, CA-2). Las pestañas del caso son **estado local** inicializado con `initialTab`, y cada cambio hace
  `router.replace(casePath(id, tab), { scroll: false })` (la URL refleja la pestaña sin llenar el historial; la recarga
  abre la misma, CA-19). Se envuelve en `useTransition` para no bloquear la interacción.
- **P-7:** enlaces internos con `next/link`; sin imágenes nuevas. "Ver" abre la URL de R2 en otra pestaña (no es una
  página interna).

## 5. Contrato con la API

Todo vía `apiClient`. Los 401, 402, 503, el *timeout* (30 s) y el 400 de cambio de plan los resuelve el interceptor de
`src/lib/api/client.ts` y no se reimplementan. Los errores se leen con `readApiError` (nunca `config`).

| Método y ruta | Servicio | Entrada → salida (`src/types`) | Errores y lo que ve el usuario |
|---|---|---|---|
| `GET /compliance/tax-profiles?status=&page=&size=20` | `ComplianceTaxProfileService.list({ status?, page, size })` | → `PagedResponse<TaxProfileSummary>` | Red/5xx: "No pudimos cargar las fichas tributarias." + "Reintentar"; 403: "No tienes permiso para ver esta sección.". Con "Todas" no se manda `status` (CA-2). |
| `GET /compliance/tax-profiles/{id}` | `get(id)` | → `ComplianceTaxProfileResponse` | No se llama si `id` no es UUID. 404: "El empresario todavía no ha enviado la ficha tributaria." + enlace a la cola (CA-12); en el caso, el mismo texto en la pestaña y la cabecera sin NIT (CA-20). Red/5xx: "No pudimos cargar la ficha tributaria." + "Reintentar". |
| `GET /compliance/tax-profiles/{id}/versions/{n}` | `getVersion(id, n)` | → `TaxProfileVersionDetail` | Cualquier error: "No pudimos cargar la versión N." + "Reintentar" bajo el selector; la ficha vigente sigue visible. |
| `POST /compliance/tax-profiles/{id}/sections/{section}/review` | `reviewSection(id, section, body)` | `SectionReviewRequest` (sin `notes` vacía) → `ComplianceTaxProfileResponse` | 400 con `message`: ese texto en el diálogo, que sigue abierto con la nota (CA-10). Red/5xx/otro: "No pudimos guardar la revisión. Intenta de nuevo.". Éxito con una `profile.currentVersion` distinta de la que se veía: "La ficha cambió a la versión N mientras la revisabas. Revisa de nuevo las secciones." y la pantalla pasa a esa versión (RN-13, CA-28). |
| `GET /compliance/tax-catalog` | `getCatalog()` | → `CatalogEntry[]` (activos y retirados) | Cualquier error (403, red, 5xx) o lista vacía: ningún mensaje; los códigos se ven solos y la revisión sigue funcionando (RN-12, CA-29). |
| `GET /compliance/commercials/{id}/documents` | `ComplianceCaseService.listDocuments(id)` | → `ExpedienteDocument[]` | 404/400: "No encontramos este empresario." (D-4, C-1); 403; red/5xx: "No pudimos cargar los documentos." + "Reintentar". Vacío: "El empresario no tiene documentos en su expediente.". |
| `POST /compliance/commercial-documents/{documentId}/review` | `reviewDocument(documentId, body)` | `DocumentReviewRequest` (sin claves vacías) → `ExpedienteDocument` | 400 con `message`: tal cual en el diálogo, que sigue abierto con lo escrito, y la lista se vuelve a pedir (RN-6, D-7). Red/5xx/otro: "No pudimos guardar la revisión. Intenta de nuevo.". |
| `GET /compliance/commercials/{id}/declarations/FORMALIZATION_COMMITMENT` | `listCommitment(id)` | → `Manifestation[]` | Como documentos ("No pudimos cargar el compromiso."). Vacío: "No hay manifestaciones registradas.". |
| `GET /compliance/information-requests?commercialPublicId={id}&page=&size=20` | `listRequests(id, page)` | → `PagedResponse<InformationRequest>` | Como documentos ("No pudimos cargar los requerimientos."). Vacío: "No hay requerimientos para este empresario.". Nunca manda `status`. |
| `GET /compliance/commercials/{id}/findings` | `listFindings(id)` | → `Finding[]` | Como documentos ("No pudimos cargar los hallazgos."). Vacío: "No hay hallazgos registrados.". |
| `GET /compliance/commercials/{id}/incidents` | `listIncidents(id)` | → `Incident[]` | Como documentos ("No pudimos cargar las incidencias."). Vacío: "No hay incidencias registradas.". |

**Nada falta en la API para esta entrega.** Sugerencias no bloqueantes para la API: C-1, C-4, C-5 y C-6.

## 6. Datos y estado (P-10)

### 6.1 Claves, consultas e invalidaciones

```ts
// src/hooks/compliance/complianceKeys.ts
complianceTaxProfileKeys = {
  all:      ['compliance-tax-profiles'],
  queueAll: ['compliance-tax-profiles', 'queue'],
  queue:    (status: TaxProfileStatus | 'ALL', page: number) => ['compliance-tax-profiles', 'queue', status, page],
  detail:   (id) => ['compliance-tax-profiles', 'detail', id],
  // Prefijo propio: invalidar el detalle no toca las versiones, que no cambian.
  version:  (id, n) => ['compliance-tax-profiles', 'version', id, n],
}
// Prefijo propio, distinto del catálogo del empresario (taxProfileKeys.catalog): otro rol, otro endpoint y
// otra lista (aquí con retirados). La 018 (crear y retirar códigos) invalida esta clave.
complianceTaxCatalogKeys = {
  all: ['compliance-tax-catalog'],
}
complianceCaseKeys = {
  all:         (id) => ['compliance-case', id],
  documents:   (id) => ['compliance-case', id, 'documents'],
  commitment:  (id) => ['compliance-case', id, 'commitment'],
  requestsAll: (id) => ['compliance-case', id, 'requests'],
  requests:    (id, page) => ['compliance-case', id, 'requests', page],
  findings:    (id) => ['compliance-case', id, 'findings'],
  incidents:   (id) => ['compliance-case', id, 'incidents'],
}
COMPLIANCE_INVALIDATIONS = {
  // RN-8: la respuesta ya trae la ficha (se guarda con setQueryData); la cola queda vieja (estado y fecha).
  reviewSection:          [complianceTaxProfileKeys.queueAll],
  // RN-8: no se parchea la lista (cambiaría dataUpdatedAt y la frescura de las URL de "Ver"); se relee.
  reviewDocument:         (id) => [complianceCaseKeys.documents(id)],
  // RN-6 y D-7: tras cualquier 400 la lista se relee (otro revisor o el empresario la cambió).
  reviewDocumentRejected: (id) => [complianceCaseKeys.documents(id)],
  // RN-13: la versión nueva puede traer otro rutDocumentId; se relee el expediente para resolver "Ver RUT".
  versionChanged:         (id) => [complianceCaseKeys.documents(id)],
}
```

| Hook | Clave | Opciones |
|---|---|---|
| `useTaxProfileQueue({ status, page })` | `queue(status, page)` | `queryFn: list(queueApiParams(state))`; `retry: retryUnlessForbiddenOrMissing`. Sin `placeholderData`: al cambiar el filtro se ve el esqueleto, nunca filas de otro estado. |
| `useComplianceTaxProfile(id)` | `detail(id)` | `enabled: isUuid(id)`; `retry: retryUnlessForbiddenOrMissing` (404 sin reintento). La comparten la revisión, la cabecera del caso y la pestaña Ficha. |
| `useComplianceTaxProfileVersion(id, n)` | `version(id, n)` | `enabled: isUuid(id) && n !== null`; `staleTime: Infinity` (una versión enviada no cambia). |
| `useComplianceTaxCatalog()` | `complianceTaxCatalogKeys.all` | `staleTime: 10 * 60 * 1000` (como la 014); `retry: retryUnlessForbiddenOrMissing`. Nunca bloquea: la revisión y el comparador usan `groupCatalog(data ?? [])`; sin datos, códigos solos (RN-12, CA-29). |
| `useReviewTaxProfileSection(id)` | — | `mutationFn({ section, body, shownVersion })` (`shownVersion` = versión vigente que se veía al abrir el diálogo; no viaja a la API). `onSuccess(res, vars)`: `setQueryData(detail(id), res)` (la pantalla pasa a la versión de la respuesta), recorre `reviewSection` y, si `versionChangedDuringReview(vars.shownVersion, res)`, también `versionChanged(id)` (RN-13, CA-28). Sin relectura en `onError`. |
| `useCaseDocuments(id, enabled = true)` | `documents(id)` | `enabled: isUuid(id) && enabled`; `retry: retryUnlessForbiddenOrMissing`. La comparten la pestaña Documentos y "Ver RUT" (que la habilita solo si hay `rutDocumentId`). |
| `useReviewCaseDocument(id)` | — | `mutationFn({ documentId, body })`. `onSuccess`: `await` de la invalidación de `reviewDocument(id)` (el diálogo cierra con la lista al día, CA-18). `onError`: si `documentReviewErrorOutcome(err).refetch`, recorre `reviewDocumentRejected(id)`. |
| `useCaseCommitment(id)`, `useCaseFindings(id)`, `useCaseIncidents(id)` | `commitment(id)`, `findings(id)`, `incidents(id)` | `enabled: isUuid(id)`; `retry: retryUnlessForbiddenOrMissing`. |
| `useCaseRequests(id, page)` | `requests(id, page)` | `enabled: isUuid(id)`; `placeholderData: keepPreviousData` (al paginar no parpadea); mismo `retry`. |

- Cada pestaña llama a su hook dentro de su propio panel, que solo se monta cuando está activa: las lecturas son
  perezosas e independientes, y un error en una no afecta a las demás (CA-23). Volver a una pestaña usa la caché.
- La cabecera del caso usa `useComplianceTaxProfile` (empresa y NIT); con 404 muestra "Empresario" sin NIT.
- La revisión de una sección también actualiza la pestaña Ficha del caso y su resumen (misma clave).
- **Volumen:** la cola y los requerimientos paginan con la API (20). Documentos, compromiso, hallazgos e incidencias
  llegan completos.

### 6.2 Rutas y parámetros (`src/lib/compliance/routes.ts`)

- `parseQueueParams(sp: Record<string, string | string[] | undefined>)` → `{ status: TaxProfileStatus | 'ALL'; page:
  number }`. `status`: `SUBMITTED`, `OBSERVED`, `REVIEWED` o `ALL`; ausente, desconocido o en minúsculas →
  `SUBMITTED` (por defecto, CA-1). `page`: entero ≥ 1 **en la URL (base 1, D-1)**; ausente, no entero, `0`, negativo
  o con decimales → 1. Con arreglos (`?status=A&status=B`) toma el primero.
- `queuePath({ status, page })`: `/compliance/tax-profiles` sin query para los valores por defecto; si no,
  `?status=OBSERVED`, `?status=ALL`, `&page=2`… en ese orden. Sin `URLSearchParams` (los valores son enums y enteros).
- `queueApiParams({ status, page })` → `{ page: page - 1, size: 20 }` más `status` salvo con `ALL` (CA-2).
- Cambiar el filtro vuelve a la página 1. Una `page` mayor que `totalPages` muestra el vacío del filtro con la
  paginación (el revisor vuelve con "Anterior").
- `taxProfileReviewPath(id)` = `/compliance/tax-profiles/{id}`.
- `CASE_TABS = ['tax-profile', 'documents', 'commitment', 'requests', 'findings', 'incidents']`;
  `parseCaseTab(value)`: uno de ellos o `'tax-profile'` (CA-19). `casePath(id, tab)`: sin query con `tax-profile`, si
  no `?tab={tab}`.
- `nextTabIndex(current, key, count)`: `ArrowRight` / `ArrowLeft` con vuelta, `Home` → 0, `End` → último; otra tecla →
  `null`.
- Los `id` que llegan aquí son el `commercialPublicId` tal como vino en la ruta; los componentes no llaman a la API si
  no es UUID.

### 6.3 Campos de la ficha y comparación (`src/lib/compliance/taxProfileFields.ts`)

Un solo modelo para pintar lo declarado y para comparar versiones:

```ts
type FieldRow =
  | { kind: 'value'; key: string; label: string; value: string }
  | { kind: 'list'; key: string; label: string; items: { key: string; text: string }[] };
sectionFields(section, version, catalog: GroupedCatalog): FieldRow[]   // catalog = groupCatalog(entries ?? [])
```

| Sección | Filas (`label` → valor) |
|---|---|
| a) | "Documento RUT" → "Vinculado" / "Sin documento RUT vinculado" (el enlace lo añade el componente); "Responsabilidades del RUT" → lista con `key` = código y texto `displayCode(code, catalog.RUT_RESPONSIBILITY)`. |
| b) | "Régimen" → `displayCode(regimeCode, catalog.REGIME)` ("—" sin código); "Actividades" → lista por `ciiuCode`: "CIIU 4711 (principal) · descripción". |
| c) | "Condición frente al IVA" (`catalog.VAT_CONDITION`), "Condición frente al INC" (`catalog.INC_CONDITION`), "Productos o servicios a los que aplica". |
| d) | "Obligado a facturar" (Sí/No), "Método de facturación" (`catalog.INVOICING_METHOD`), "Notas sobre la facturación", "Agente de retención", "Notas sobre la retención". |
| e) | "Ingresos o ventas" → lista por `concept|periodStart|periodEnd`: "{concepto} · del {inicio} al {fin} · {formatCents} · {alcance}{ · Con soporte}{ · notas}". La pantalla de revisión pinta además una tabla con las columnas de CA-7. |
| f) | "Sedes declaradas al enviar" → `establishmentsCount`. El historial de sedes no es parte de la versión: lo añade el componente desde `establishmentHistory`. |
| g) | "Capacidad actual", "Escenario de crecimiento", "Medidas para crecer". |
| h) | "Tiene asesor contable" (Sí/No) y, si lo tiene, "Alcance de la asesoría". |

- `diffSection(section, older, current, catalog)` → filas con `changed: boolean`; en las listas, cada ítem con `status:
  'added' | 'removed' | 'changed' | 'same'` y `before`/`after` (mismo `key`, distinto `text` → `changed`). El orden de
  los ítems: los de la versión vigente en su orden y, al final, los quitados. Una fila que solo existe en una de las
  dos versiones (alcance de asesoría) cuenta como cambiada.
- `comparableVersions(versions, currentVersion)`: las versiones distintas de la vigente, de la más reciente a la más
  antigua; vacío → el selector no aparece (CA-11).
- Valores vacíos o `null` se muestran como "—" y dos "—" no son cambio. Fechas con `formatPlainDate`, montos con
  `formatCents` (separador de miles, CA-7).
- **Catálogo (RN-12, CA-29).** Cada código se pinta con `displayCode(code, catalog[tipo])`: "código — etiqueta" si está
  (activo o retirado: una versión anterior puede usar un código ya retirado), el código solo si no está o si el catálogo
  no cargó (`groupCatalog([])`). El modelo da las mismas filas con o sin catálogo. Las listas se identifican por el
  código (`key`) y el comparador usa el mismo catálogo para las dos versiones, así que la etiqueta no altera el diff.

### 6.4 Revisión y caso (`src/lib/compliance/taxProfileReview.ts`)

- `latestSectionReview(reviews, section)` → `SectionReview | null` (`null` = "Pendiente de revisión", RN-3).
- `summarizeSectionReviews(reviews)` → `{ verified, observed, notApplicable, pending }`, contando solo las ocho
  secciones conocidas y una vez cada una; `pending = 8 − revisadas` (CA-20, D-8).
- `resolveRutDocument({ rutDocumentId, status, documents })` → `{ kind: 'none' }` (sin `rutDocumentId`) ·
  `{ kind: 'loading' }` · `{ kind: 'error' }` · `{ kind: 'available', document }` (en la lista y `VALIDATED`) ·
  `{ kind: 'stale' }` (no está en la lista o ya no es `VALIDATED`: "Documento ya no vigente", sin enlace) (CA-6, D-5).
- `sortManifestationsDesc(list)`: `occurredAt` desc, empate por `id` desc (no se confía en el orden de la API) (CA-21).
- `establishmentHistory(list)`: activas primero y después cerradas, cada grupo por `createdAt` desc (CA-7).
- `versionChangedDuringReview(shownVersion, response)`: `true` si `response.profile.currentVersion` es distinta de la
  que se veía (RN-13, CA-28, R-8).

### 6.5 Revisión de sección (RN-4, RN-7, P-11)

- `SectionReviewFormValues = { notes: string }`. El resultado lo fija el botón que abrió el diálogo.
- `createSectionReviewSchema(result)` (zod 4): con `OBSERVED`, `notes.trim()` vacía → "Escribe la observación para el
  empresario." (CA-8); siempre, `notes.trim().length ≤ 1000` → "Máximo 1000 caracteres" (C-3).
- `buildSectionReviewBody(result, values)` → `{ result }` más `{ notes: trim }` solo si no queda vacía (CA-9).
- `reviewErrorMessage(err)`: 400 con `message` → ese `message`; todo lo demás → "No pudimos guardar la revisión.
  Intenta de nuevo." (CA-10).
- Doble envío: `submittingRef` (`useRef(false)`) comprobado en la primera línea del `onSubmit` + botón `disabled`
  con indicador mientras `isSubmitting || mutation.isPending`; `Dialog dismissible={!busy}`. Los tres botones de la
  sección quedan deshabilitados mientras la mutación de esa sección está en curso (`mutation.variables.section`).

### 6.6 Revisión de documento (RN-5, RN-6, RN-7, P-11)

- `DocumentReviewFormValues = { result: '' | 'ACCEPTED' | 'OBSERVED' | 'REJECTED'; holderIdentification: string;
  issuedAt: string; hasValidity: boolean; expiresAt: string; notes: string }`.
- `requiresHolder(type)`: `RUT`, `CAMARA_COMERCIO`, `CERTIFICACION_BANCARIA` y `CEDULA_REPRESENTANTE` (igual que
  `DocumentHolderMatcher`).
- `createDocumentReviewSchema(documentType)` (zod 4, `superRefine`; mensajes en el campo):
  - `result` vacío → "Elige el resultado de la revisión." (D-13);
  - `ACCEPTED` y `requiresHolder` y titular vacío tras recortar → "Escribe el NIT o la cédula del titular." (CA-14);
    titular recortado de más de 30 → "Máximo 30 caracteres";
  - `hasValidity` y sin `expiresAt` → "Escribe la fecha de vencimiento." (D-13); `hasValidity`, ambas fechas y
    `expiresAt < issuedAt` (comparación de cadenas `AAAA-MM-DD`) → "El vencimiento no puede ser anterior a la
    expedición." en `expiresAt` (CA-16); sin `hasValidity`, `expiresAt` no se valida;
  - `OBSERVED` o `REJECTED` con notas vacías tras recortar → "Escribe la observación o el motivo del rechazo."
    (CA-15); notas recortadas de más de 1000 → "Máximo 1000 caracteres".
- `documentReviewDefaults(doc)`: `result: ''`, `notes: ''`, y **precargados** el titular, la expedición y el
  vencimiento actuales (`hasValidity = expiresAt !== null`), porque la API borra lo que no se manda (C-8, D-6).
- `buildDocumentReviewBody(values)`: `result`; `holderIdentification` recortado si no queda vacío; `issuedAt` si no
  está vacío; `expiresAt` solo si `hasValidity` y no está vacío (CA-16); `notes` recortadas si no quedan vacías.
  Nunca una clave vacía.
- `documentReviewErrorOutcome(err)` → `{ message, refetch }`: 400 con `message` → ese `message` tal cual y `refetch:
  true` (CA-17, RN-6, D-7); todo lo demás → "No pudimos guardar la revisión. Intenta de nuevo." y `refetch: false`.
- Doble envío y cierre: como en 6.5; `Dialog dismissible={!busy}` (CA-18).

### 6.7 Errores de carga (`src/lib/compliance/loadErrors.ts`)

- `tabErrorView(error, tab)` → `{ message, retry }`: 403 → "No tienes permiso para ver esta sección." sin reintento;
  404 o 400 → "No encontramos este empresario." sin reintento (D-4; con `tab = 'tax-profile'` y 404 → "El empresario
  todavía no ha enviado la ficha tributaria.", CA-20); lo demás → "No pudimos cargar {la pestaña}." con reintento
  (CA-23).
- `reviewLoadView(error)` para la revisión: 404 → `'not-sent'`; 403 → `'forbidden'`; lo demás → `'error'`.

## 7. UI

### 7.1 Menú

`NAV` gana "Fichas tributarias" (`FileSpreadsheet`), visible en el riel de escritorio, en el riel contraído (con
`title`) y en el cajón móvil, con la miga "Fichas" en `/compliance/tax-profiles/...`. El caso
(`/compliance/commercials/...`) no tiene entrada (no hay listado de comerciales): la miga solo dice "Portal de
cumplimiento".

### 7.2 Cola (`TaxProfileQueue`, props `status`, `page`)

- `PanelHeader` (eyebrow "Cumplimiento tributario", título "Fichas tributarias"); filtro con `Tabs` del portal
  (`aria-pressed`): Enviada · Observada · Revisada · Todas.
- `Ledger`: Empresa · Estado (`StatusBadge` con `TAX_PROFILE_STATUS_LABELS`) · Versión ("v{n}") · Última
  actualización (`formatBogotaDateTime`). Cada fila `LedgerRow onActivate` → `router.push(taxProfileReviewPath(id))`,
  con `ariaLabel` "Abrir la ficha de {empresa}" (CA-4). En móvil la tabla se desplaza en horizontal (el `Ledger` ya
  tiene `overflow-x-auto`).
- `Pager` con `meta.page`/`meta.totalPages` ("Página N de M"); cambiar de página hace `router.push(queuePath(…))`.
- Estados: cargando → `SkeletonRows` con el filtro visible; vacío → `EmptyState` con "No hay fichas enviadas." /
  "…observadas." / "…revisadas." o, con "Todas", "Todavía no hay fichas tributarias enviadas." (D-13); 403 →
  "No tienes permiso para ver esta sección."; error → `ErrorState` "No pudimos cargar las fichas tributarias." con
  "Reintentar" (`refetch`) (CA-3). Mientras la transición de la ruta está pendiente, el filtro y el paginador se
  deshabilitan.
- La cola **no** muestra el NIT.

### 7.3 Revisión de la ficha (`TaxProfileReview`, prop `commercialPublicId`)

Orden de arriba abajo:

1. "Volver a fichas tributarias" (`next/link` a `TAX_PROFILES_PATH`).
2. `ReviewHeader`: empresa (`h1`), "NIT {nit}", `StatusBadge` del estado, "Versión vigente: v{n}", "Vocación
   empresarial: {Productos|Servicios|Sin definir}" con la nota fija "Solo para contrastar: la ficha no modifica la
   vocación" (RN-1, CA-5), y `next/link` "Ver caso del empresario" → `casePath(id, 'tax-profile')` (CA-24).
3. Selector "Comparar con versión…" (`<select>` con `<label>`), solo si `comparableVersions` no está vacío;
   opciones "Versión N · {fecha de envío}". Con una elegida se monta `VersionCompare` (dinámico) en lugar de la
   lista de secciones, con "Volver a la revisión" (D-11). Error de la versión → bajo el selector, `role="alert"`,
   "No pudimos cargar la versión N." + "Reintentar"; la cabecera sigue visible.
4. Las ocho secciones (`SECTION_ORDER`), cada una en `grid lg:grid-cols-[minmax(0,1fr)_320px]` (una columna en
   móvil, la revisión debajo): a la izquierda `DeclaredSection`; a la derecha `SectionReviewPanel`.
   - `DeclaredSection` (prop `catalog`): título del diccionario, `dl` con las filas de `sectionFields` (códigos como
     "código — etiqueta", RN-12); en a) `RutDocumentLink`
     ("Ver RUT" / "Documento ya no vigente" / "Cargando documento…" / "No pudimos cargar el expediente." +
     "Reintentar"); en e) una tabla (`overflow-x-auto`) Concepto · Periodo · Valor · Alcance · Notas; en f) "Sedes
     declaradas al enviar: N" y la lista `establishmentHistory` (nombre, dirección, municipio, relación, y en las
     cerradas `StatusBadge` "Cerrada" + "Cerrada el {fecha} · {motivo}").
   - `SectionReviewPanel`: `StatusBadge` del último resultado o "Pendiente de revisión"; la nota
     (`whitespace-pre-line break-words`) y "Revisada el {fecha}"; botones "Verificar", "Observar" y "No aplica"
     (`Btn`), deshabilitados con indicador en el pulsado mientras se envía esa sección.
5. `SectionReviewDialog` (dinámico): título según el resultado ("Verificar «a) RUT»", "Observar «a) RUT»", "Marcar
   «a) RUT» como «No aplica»"), `<label>` "Observación para el empresario" (Observar) u "Nota (opcional)", `textarea
   maxLength={1000}` con `aria-describedby`/`aria-invalid`, error del campo, error de envío `role="alert"` sobre los
   botones, "Cancelar" y "Guardar revisión". Al guardar: se cierra, `toast.success('Revisión guardada')`, la sección
   y la cabecera se pintan con la respuesta (CA-8, CA-9). Si `versionChangedDuringReview`, además un aviso
   persistente (`role="status"`, sobre las secciones, hasta salir de la pantalla o hasta otro cambio de versión) con
   el texto exacto de RN-13: "La ficha cambió a la versión N mientras la revisabas. Revisa de nuevo las secciones.".
   La pantalla ya muestra la versión N: cabecera, secciones, revisiones y selector salen de la respuesta guardada en
   la caché, y el expediente se relee para resolver el RUT de esa versión (CA-28).
- El catálogo se pide con `useComplianceTaxCatalog()` en paralelo con la ficha; mientras carga o si falla, los códigos
  se ven solos, sin esqueleto ni mensaje propios (CA-29).
- Estados: no UUID o 404 → "El empresario todavía no ha enviado la ficha tributaria." + "Volver a fichas
  tributarias" (sin llamar a la API si no es UUID, CA-12); 403; error → "No pudimos cargar la ficha tributaria." +
  "Reintentar"; cargando → esqueleto de cabecera y de ocho secciones (`cmp-skeleton`). Un refetch fallido con datos
  cargados no tapa la ficha.

### 7.4 Comparador (`VersionCompare`, props `older`, `current`, `catalog`)

- Por sección, dos columnas ("Versión N · {fecha}" y "Vigente · versión M") en escritorio, apiladas en móvil.
- Fila cambiada: fondo `cmp-hold-bg` **y** marca de texto "Cambió" (no solo color). Ítems de lista: "Agregado",
  "Quitado" o "Cambió" con el texto antes y después. Una sección sin cambios dice "Sin cambios".
- Sin botones de revisión (RN-2, CA-11). En f) solo se compara el número de sedes.
- Códigos con el mismo catálogo agrupado que la revisión, que incluye los retirados (RN-12, CA-29).

### 7.5 Caso (`CommercialCase`, props `commercialPublicId`, `initialTab`)

- No UUID → "No encontramos este empresario." y ninguna llamada (todos los hooks con `enabled: isUuid`).
- Cabecera: empresa y "NIT {nit}" de la ficha; con 404, cargando o error de la ficha, "Empresario" sin NIT.
- `CaseTabs`: `role="tablist"` con `aria-label="Caso del empresario"`; cada `role="tab"` con `id`, `aria-selected`,
  `aria-controls` y `tabIndex` itinerante (0 en la activa, −1 en las demás); flechas, Inicio y Fin con
  `nextTabIndex`, que mueven el foco y activan la pestaña. Un solo `role="tabpanel"` con `aria-labelledby`. En móvil la
  lista se desplaza en horizontal.
- **Ficha tributaria:** `StatusBadge`, "Versión vigente: v{n}", "Actualizada el {fecha}", conteo "{n} verificadas ·
  {n} observadas · {n} no aplica · {n} pendientes" (D-8) y `next/link` "Abrir revisión de la ficha" (CA-20).
- **Documentos:** `groupExpediente`; por grupo, `CaseDocumentGroup`: en cada vigente nombre de archivo, "Cargado el
  …", `StatusBadge` de revisión (`null` → "Sin revisar"), "Vencido" si `expired`, "Titular: …" si lo hay, "Expedido el
  …" y "Vence el …" si los hay, "Revisado el …" y las notas; botones "Ver" y "Revisar". Historial plegable
  (`CollapsibleSection`, cerrado) con nombre, "Reemplazado el …", la misma información de revisión y solo "Ver"
  (CA-13).
- **`DocumentReviewDialog`** (dinámico, título "Revisar {tipo}" y el nombre del archivo debajo): grupo de radios
  "Resultado" (Aceptar · Observar · Rechazar, `fieldset`/`legend`); "NIT o cédula del titular" con "(obligatorio)"
  cuando `requiresHolder` y Aceptar, ayuda "Escríbelo como figura en el documento; se compara con el empresario",
  `maxLength={30}`; "Fecha de expedición" (`type="date"`); casilla "El documento tiene vigencia comprobable" que
  muestra "Fecha de vencimiento" (`type="date"`, `min` = expedición); "Notas" (`maxLength={1000}`, "(obligatorias)" al
  observar o rechazar). Errores bajo cada campo; el error de envío en `role="alert"`; "Cancelar" y "Guardar revisión"
  con indicador. Éxito → cierra, "Revisión guardada", la lista ya releída (CA-18).
- **Compromiso:** lista ordenada (`ol`) de `sortManifestationsDesc`: `StatusBadge` (`MANIFESTATION_LABELS`),
  "Contrato v{contractVersion}", fecha, "Representante legal: {nombre}" o "Sistema", y `detail` si lo hay (CA-21).
- **Requerimientos:** `Ledger` Tipo · Estado (`REQUEST_STATUS_LABELS_COMPLIANCE`) · Emitido por ("Sistema" /
  "Compliance") · Emitido (`formatBogotaDateTime`) · Vence (`formatPlainDate` o "—"); `Pager`; página en estado local
  (D-15). Filas sin enlace ni botones (RN-10).
- **Hallazgos:** tarjetas: fecha (`decidedAt`), hecho observado, clasificación, gravedad, "Subsanable: Sí/No", medida
  y, si `accountStatusApplied`, "Estado de la cuenta aplicado: {estado}" (RN-11, CA-22). Sin botones.
- **Incidencias:** fecha (`occurredAt`), contexto, descripción y "Reportada por el sistema" o "Registrada por
  compliance". Sin botones.
- Cada pestaña: esqueleto propio (`role="status"`, texto solo para lector), vacío de la spec, error con
  `tabErrorView` (CA-23).

### 7.6 Accesibilidad, responsive y textos

- **Foco atrapado (D-10):** `Dialog` escucha Tab en el diálogo de arriba; con los elementos enfocables del panel
  (`a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]),
  [tabindex]:not([tabindex="-1"])`) aplica `trappedFocusIndex`: Mayús+Tab en el primero (o en el panel) → el último; Tab
  en el último → el primero; sin enfocables, el foco se queda en el panel. Afecta a los ocho usos del `Dialog`
  (014-016), siempre a mejor.
- Filas de la cola con foco visible y Enter; pestañas con flechas; cada campo con `label`; errores con
  `aria-describedby`/`aria-invalid`; insignias y cambios con texto, no solo color.
- Desde 360 px sin scroll horizontal de página: cabeceras con `flex-wrap`, columnas apiladas, tablas con desplazamiento
  propio, textos libres con `break-words`.
- Todos los textos en `src/lib/labels/complianceTaxReview.ts` y en el diccionario, en español (P-18).

## 8. Configuración

Ninguna variable de entorno nueva, ningún host en `images.remotePatterns` (los documentos se abren en otra pestaña),
ningún cambio en `next.config.ts`.

## 9. Dependencias

Ninguna nueva (P-1). Se usan las instaladas: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`,
`axios`, `react-hot-toast`, `lucide-react` y `framer-motion` (ya en `primitives.tsx`).

## 10. Seguridad y PII (P-16, P-12)

- Datos sensibles: NIT (cabecera), titular del documento (`holderIdentification`, lista y diálogo), nombre del
  representante legal (compromiso), direcciones de las sedes, notas de revisión, textos de hallazgos e incidencias y la
  `downloadUrl`.
- Se ven en pantalla y en ningún otro sitio: ni `console.*`, ni `localStorage`/`sessionStorage`, ni la URL, ni
  mensajes de error propios. Los errores se leen con `readApiError`; los mensajes que se pintan son los de la API o
  textos fijos.
- URL del front: solo `/compliance/tax-profiles?status=&page=`, `/compliance/tax-profiles/{UUID}` y
  `/compliance/commercials/{UUID}?tab=` (RN-9). El selector de versión, la página de requerimientos y el estado de los
  diálogos viven en memoria.
- `downloadUrl` solo se lee en `src/lib/expediente/openDocument.ts`; la abre `useOpenCaseDocument` con
  `noopener,noreferrer`; nunca en estado de React, `href`, `router` ni almacenamiento.
- Verificación automática: `noPiiLeaks.test.ts` con los archivos nuevos en `TARGETS` y `complianceStatic.test.ts`
  (`downloadUrl` fuera de las carpetas de compliance, guardas y textos de solo lectura). Manual: DevTools (Console,
  Application → Storage, barra de direcciones) (CA-26).
- El token sigue el flujo de `apiClient` + `tokenStore`.

## 11. Llamadas salientes del servidor

No aplica: ninguna ruta de `src/app/api` ni `fetch` de servidor (P-15). Las páginas de servidor solo leen `params` y
`searchParams`; los datos se piden desde el navegador con `apiClient` (30 s).

## 12. Efectos colaterales

- Revisar una sección: la API guarda una revisión nueva, recalcula el estado de la ficha y registra una auditoría
  `CRITICAL`. El empresario ve el resultado en la 014 (`/commercial/profile/tax-info`) en su próxima lectura. En el
  front de compliance se actualizan la revisión, la cabecera del caso y la pestaña Ficha (misma clave) y se marca vieja
  la cola.
- Revisar un documento: la API guarda la última revisión en la fila (borra lo que no se manda, D-6) y audita. El
  empresario lo ve en `/commercial/profile/documents` (016). En compliance se relee la lista (y con ella el enlace del
  RUT).
- Sin tiempo real nuevo (STOMP/SSE): dos oficiales a la vez ven los cambios del otro en la próxima lectura; un
  documento reemplazado mientras tanto da el 400 "Solo se revisan documentos vigentes…", que relee la lista.
- Si una validación falla antes de llamar a la API: un "Observar" sin nota, una revisión de documento incompleta o
  con fechas al revés no envían nada (CA-8, CA-14 a CA-16); un `commercialPublicId` que no es UUID no hace ninguna
  lectura (CA-12, CA-19).
- Cambio de versión durante la revisión (RN-13): además del aviso, se relee el expediente (`versionChanged`), porque la
  versión nueva puede apuntar a otro RUT.
- Catálogo: la 018 crea y retira códigos y debe invalidar `complianceTaxCatalogKeys.all` (queda anotado para esa
  spec). Hasta entonces, un código creado por otra vía puede verse sin etiqueta hasta 10 minutos (`staleTime`).

## 13. Trazabilidad

La misma tabla está al final de `tasks.md`, con la referencia a cada comprobación manual.

| CA | Tareas | Cómo se verifica |
|---|---|---|
| CA-1 | T1, T4, T12, T13, T22 | `routes.test.ts` (sin parámetros → `SUBMITTED`, página 1), `complianceStatic.test.ts` (entrada de `NAV`); manual T12 y T13.1. |
| CA-2 | T2, T4, T13 | `routes.test.ts` (`queuePath`, `parseQueueParams`, `queueApiParams` sin `status` con `ALL`), `complianceServices.test.ts`; manual T13.2. |
| CA-3 | T1, T13 | `complianceTexts.test.ts` (vacíos y error); manual T13.3. |
| CA-4 | T4, T12, T13 | `routes.test.ts` (`taxProfileReviewPath`); manual T13.4 (clic y Enter). |
| CA-5 | T1, T5, T6, T15 | `taxProfileFields.test.ts` (ocho secciones), `taxProfileReview.test.ts` (`latestSectionReview`), `complianceTexts.test.ts` (nota de la vocación); manual T15.1. |
| CA-6 | T6, T11, T15, T19, T22 | `taxProfileReview.test.ts` (`resolveRutDocument`), `complianceStatic.test.ts` (opener con `documentsFromRefetch` y `noopener,noreferrer`); manual T15.2 y T19.1. |
| CA-7 | T5, T6, T15 | `taxProfileFields.test.ts` (ingresos con `formatCents` y alcance), `taxProfileReview.test.ts` (`establishmentHistory`); manual T15.3. |
| CA-8 | T1, T7, T14 | `sectionReview.test.ts` (sin nota y solo espacios bloquean; cuerpo con nota recortada); manual T14.1. |
| CA-9 | T2, T3, T7, T11, T14 | `sectionReview.test.ts` (solo `{ result }`), `complianceKeys.test.ts` (invalida la cola), `complianceServices.test.ts`; manual T14.2. |
| CA-10 | T7, T14, T22 | `sectionReview.test.ts` (`reviewErrorMessage`), `complianceStatic.test.ts` (`guardsDoubleSubmit`, `dismissible`); manual T14.3. |
| CA-11 | T5, T16, T22 | `taxProfileFields.test.ts` (`diffSection` y `comparableVersions`), `complianceStatic.test.ts` (sin botones de revisión); manual T16. |
| CA-12 | T1, T9, T11, T15 | `loadErrors.test.ts` (`reviewLoadView`), `isUuid` (016); manual T15.4 (sin petición con `abc`). |
| CA-13 | T19, T22 | `groupExpediente` (016) + `complianceStatic.test.ts` ("Revisar" solo en vigentes); manual T19.1. |
| CA-14 | T1, T8, T17 | `documentReview.test.ts` (titular obligatorio en los cuatro tipos, opcional en `OTRO`); manual T17.1. |
| CA-15 | T1, T8, T17 | `documentReview.test.ts` (notas al observar y rechazar); manual T17.1. |
| CA-16 | T1, T8, T17 | `documentReview.test.ts` (vencimiento anterior; casilla desmarcada sin `expiresAt`); manual T17.2. |
| CA-17 | T2, T3, T8, T11, T17 | `documentReview.test.ts` (400 tal cual y `refetch`), `complianceKeys.test.ts`; manual T17.3. |
| CA-18 | T3, T10, T11, T17, T19, T22 | `complianceKeys.test.ts`, `focusTrap.test.ts`, `complianceStatic.test.ts` (guarda y `dismissible`); manual T10 y T17.4. |
| CA-19 | T4, T18 | `routes.test.ts` (`parseCaseTab`, `casePath`, `nextTabIndex`); manual T18.1. |
| CA-20 | T1, T6, T9, T18, T20 | `taxProfileReview.test.ts` (`summarizeSectionReviews`), `loadErrors.test.ts`; manual T18.2 y T20.3. |
| CA-21 | T1, T6, T20 | `taxProfileReview.test.ts` (`sortManifestationsDesc`); manual T20.1. |
| CA-22 | T1, T2, T20, T22 | `complianceTexts.test.ts` ("Estado de la cuenta aplicado: …", "Sistema"/"Compliance"), `complianceStatic.test.ts` (sin acciones de creación); manual T20.2. |
| CA-23 | T9, T18, T20 | `loadErrors.test.ts`; manual T20.3. |
| CA-24 | T4, T15, T18 | `routes.test.ts` (`casePath(id, 'tax-profile')`); manual T15.5 y T18.3. |
| CA-25 | T21 | `npx vitest run __tests__/middleware`; manual T21 con `MIDDLEWARE=ACTIVE`. |
| CA-26 | T22 | `noPiiLeaks.test.ts`, `complianceStatic.test.ts`; manual T22 (DevTools). |
| CA-28 | T1, T3, T6, T11, T14, T15 | `complianceTexts.test.ts` (texto exacto de RN-13), `taxProfileReview.test.ts` (`versionChangedDuringReview`), `complianceKeys.test.ts` (`versionChanged` relee el expediente); manual T15.6. |
| CA-29 | T2, T3, T5, T11, T15, T16 | `complianceServices.test.ts` (`getCatalog`), `complianceKeys.test.ts` (clave propia), `taxProfileFields.test.ts` ("código — etiqueta", retirado, desconocido, catálogo vacío, mismo código en dos tipos); manual T15.7 y T16. |
| CA-27 | T23 | Las cinco puertas, `git diff` vacío de `package*.json`, `src/middleware.ts` y `next.config.ts`, y `routeAccess.ts` sin cambios propios (T21). |

## 14. Riesgos

- **R-1 · Datos para probar a mano.** Hace falta un empresario con ficha de al menos dos versiones (una con ingresos y
  actividades distintas), documentos de varios tipos con un reemplazo, manifestaciones del compromiso, requerimientos,
  hallazgos (con y sin `accountStatusApplied`) e incidencias. Hallazgos e incidencias solo se crean por API
  (`POST /compliance/findings`, `/compliance/incidents`) hasta la 018: con un cliente HTTP y el token de un
  `ROLE_COMPLIANCE_OFFICER`. Lo que no se pueda producir se anota en el PR (excepción de P-17).
- **R-2 · Frescura de "Ver".** Si alguien cambia la revisión de documento a `setQueryData`, `dataUpdatedAt` se renueva
  y "Ver" abriría URL vencidas de otros documentos. Lo fija una prueba estática (T22) y un comentario en el hook.
- **R-3 · Recarga de la ruta en la cola.** Cada filtro o página es una navegación con lectura del servidor (pequeña).
  Si se siente lenta, la alternativa es leer `useSearchParams` en el cliente (exige `Suspense`).
- **R-4 · Foco atrapado en el `Dialog` compartido.** Cambia el comportamiento con Tab en los ocho usos de la 014-016.
  Se comprueba a mano uno de la 014 y otro de la 016 (T10).
- **R-5 · Mensajes de la API en inglés.** Para un UUID inexistente la API responde 404 en inglés y con el UUID (C-1,
  C-5); el plan muestra textos propios (D-4).
- **R-6 · La revisión de documento borra lo que no se manda.** Se mitiga precargando el diálogo (D-6, aceptada).
- **R-7 · Concurrencia.** Dos oficiales revisando la misma sección: gana la última; la API recalcula el estado con la
  última revisión de cada sección. No se bloquea en el front.
- **R-8 · Versión que cambia durante la revisión.** La API revisa siempre la versión vigente en el momento del POST.
  Si el empresario envía otra versión mientras el oficial lee, "Verificar" se aplica a una versión que no vio. El
  front lo detecta después y lo avisa (RN-13, CA-28): la revisión ya quedó aplicada a la versión nueva y el oficial
  debe revisarla de nuevo. Evitarlo exige a la API un parámetro de versión esperada (C-4).
- **R-9 · Puertas en Windows.** `npm run lint:ci` y `npm run audit:ci` salen con 3 en Windows (review de la 016); se
  usan los equivalentes y el CI en Linux confirma. La auditoría falla hoy por `follow-redirects` (ajeno a la 017).
- **R-10 · Bundle.** Los dos diálogos y el comparador entran con `next/dynamic`. Se anota el First Load JS de las tres
  rutas en T23.
- **R-11 · Catálogo silencioso.** Si el catálogo falla, el oficial ve códigos sin etiqueta y ningún aviso (así lo pide
  RN-12). Si un código sin etiqueta despierta dudas, en Network se ve si `…/tax-catalog` falló.

## 15. Decisiones (resueltas por el usuario el 2026-11-02)

Todas resueltas; no queda ninguna abierta.

- **D-1 · `?page=` en base 1 y `?status=ALL` para "Todas".** Aceptada. Los valores por defecto (`SUBMITTED`, página 1)
  no se escriben en la URL.
- **D-2 · Insignias con el diccionario de la 014** ("En revisión", "Con observaciones", "Revisada") y botones del
  filtro con "Enviada", "Observada", "Revisada", "Todas". Aceptada; la spec lo recoge en RN-14 y CA-8.
- **D-3 · Códigos tributarios: código y etiqueta.** Decidido: "código — etiqueta" con `GET /compliance/tax-catalog`
  (activos y retirados, para versiones anteriores); el código suelto si no está en el catálogo o si el catálogo falla,
  sin romper la revisión (RN-12, CA-29). Se reutilizan `displayCode` y `groupCatalog` de la 014 pasando la lista de
  cada tipo; servicio `getCatalog()`, hook `useComplianceTaxCatalog()` y clave `complianceTaxCatalogKeys.all`
  (secciones 5, 6.1 y 6.3). Tareas: T2, T3, T5, T11, T15 y T16.
- **D-4 · Empresario inexistente en las pestañas:** "No encontramos este empresario." para 404 o 400 y para un id que no
  es UUID. Aceptada; la spec ya lo recoge en sus estados y en el contrato.
- **D-5 · "Ver RUT" solo con el documento vigente** ("Documento ya no vigente" sin enlace si no). Aceptada.
- **D-6 · Diálogo de documento precargado** con titular, expedición y vencimiento actuales; resultado y notas vacíos.
  Aceptada.
- **D-7 · Cualquier 400 al revisar un documento relee la lista.** Aceptada.
- **D-8 · Resumen con cuatro cifras** (verificadas, observadas, no aplica, pendientes). Aceptada; CA-20 ya las pide.
- **D-9 · Aviso si la ficha cambió de versión durante la revisión.** Decidido: sí, con el texto exacto de RN-13 ("La
  ficha cambió a la versión N mientras la revisabas. Revisa de nuevo las secciones.") y la pantalla en la versión
  nueva (CA-28). Tareas: T1, T3, T6, T11, T14 (pasa `shownVersion`) y T15 (pinta el aviso).
- **D-10 · Foco atrapado en el `Dialog` compartido para todos sus usos.** Aceptada, con la comprobación manual de
  regresión de T10 (R-4).
- **D-11 · La comparación reemplaza la lista de secciones** mientras está activa, con "Volver a la revisión". Aceptada.
- **D-12 · Pestañas con `router.replace`** y **cola con `router.push`**. Aceptada.
- **D-13 · Textos que la spec no fija:** "Cumplimiento tributario" (eyebrow), "Fichas" (miga), "No hay fichas
  enviadas." / "…observadas." / "…revisadas.", "Abrir la ficha de {empresa}" (lector), "Volver a fichas tributarias",
  "NIT {nit}", "Versión vigente: v{n}", "Vocación empresarial", "Sin definir", "Revisada el {fecha}", "Verificar
  «…»", "Observar «…»", "Marcar «…» como «No aplica»", "Observación para el empresario", "Nota (opcional)",
  "Cancelar", "Máximo 1000 caracteres", "Máximo 30 caracteres", "Elige el resultado de la revisión.", "Escribe la
  fecha de vencimiento.", "Versión N · {fecha}", "Vigente · versión N", "Cambió", "Agregado", "Quitado", "Sin
  cambios", "Volver a la revisión", "Cargando documento…", "No pudimos cargar el expediente.", "Sedes declaradas al
  enviar", "Cerrada", "Cerrada el {fecha} · {motivo}", "Revisar {tipo}", "Titular: …", "Expedido el …", "Revisado el
  …", "Representante legal: {nombre}", "Subsanable: Sí/No", "Reportada por el sistema", "Registrada por compliance",
  "{n} verificadas · {n} observadas · {n} no aplica · {n} pendientes", "No pudimos cargar {los documentos | el
  compromiso | los requerimientos | los hallazgos | las incidencias}." y "Caso del empresario" (`aria-label`).
  Aceptada. El aviso de cambio de versión ya no es un texto propio: sale de RN-13.
- **D-14 · Textos nuevos del diccionario:** gravedad Baja / Media / Alta; estado de la cuenta Registro iniciado /
  Pendiente de aceptar términos / Pendiente de verificación / Pendiente de activación / Activa / Restringida
  preventivamente / Suspendida / Terminada (alineados con `userStateLabel` del admin). Aceptada.
- **D-15 · La página de requerimientos del caso vive en estado local** (la URL solo lleva `?tab=`). Aceptada.
## 16. Contradicciones con la spec o la API

- **C-1 · Empresario inexistente da 404, no 400.** `listForCompliance` lanza `EntityNotFoundException` ("Commercial
  with public id: … not found") y las otras lecturas, la de `UserIdResolver` ("User with public id: … not found"):
  404 en inglés, con el UUID. La spec ya lo recoge (404 o 400, con texto propio). El front trata 400 y 404 igual
  (D-4). Sugerencia para la API: mensaje en español y sin el id.
- **C-2 · Textos del estado de la ficha:** resuelta en la spec (RN-14, CA-8).
- **C-3 · Nota de la sección: máximo 1000.** `SectionReviewRequest.notes` tiene `@Size(max = 1000)`; la spec no lo
  dice. El front lo aplica.
- **C-4 · La revisión de sección no fija la versión** (R-8). Sugerencia para la API: aceptar `versionNumber` y responder
  409 si no es la vigente.
- **C-5 · Ficha de un UUID que no es de nadie:** 404 "User with public id…", no "todavía no ha enviado". El front
  muestra su texto fijo para cualquier 404 de la ficha, así que el usuario ve lo mismo.
- **C-6 · Un id que no es UUID da 500 en la API** (sin manejador de `MethodArgumentTypeMismatchException`). El front no
  lo envía.
- **C-7 · El contrato (5.2) pide también un acceso "Ver expediente documental"** en la revisión; la spec solo pide "Ver
  caso del empresario" (desde ahí se llega a Documentos). Manda la spec.
- **C-8 · La revisión de documento sobrescribe titular y fechas con lo que llega** (incluido `null`). Ver D-6.
- **C-9 · Forma de la spec (no cambia el alcance).** La fila de `/compliance/tax-catalog` quedó fuera de la tabla del
  contrato (debajo de las notas) y CA-28 y CA-29 aparecen antes de CA-27. El plan los trata como parte del contrato y
  de los criterios; conviene ordenarlos en la spec.

## 17. Bloqueos

Ninguno. La spec está aprobada, no choca con `CLAUDE.md` ni con `docs/constitution.md`, y todos los endpoints y campos
que usa existen en la API con la forma que tienen los tipos del front.
