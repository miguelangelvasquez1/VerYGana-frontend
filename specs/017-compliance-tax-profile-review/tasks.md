# 017 · Tareas (entrega D, parte 1)

Plan: `plan.md` de esta carpeta. Spec: `spec.md`. Contrato:
`specs/014-tax-profile-and-compliance-case/backend-contract.md` (0.2, 2, 3, 5.1 a 5.4 y 6).

Ajuste del 2026-11-02 (decisiones de la sección 15 del plan): catálogo tributario (D-3, CA-29) en T2, T3, T5, T11, T15
y T16; aviso de cambio de versión (D-9, CA-28) en T1, T3, T6, T11, T14 y T15 (la comprobación manual pasa de T14 a
T15). Siguen siendo 23 tareas.

## Reglas para todas las tareas

**Prueba primero.** La lógica sin interfaz lleva su prueba primero (P-13, P-17). Se escribe, se ve fallar (el
módulo o la función no existen, o la regla no está) y se anota en la tarea qué falló. Después se implementa. Las
pruebas viven en `__tests__/` y corren en entorno `node`.

**Tareas de interfaz.** Se verifican con `npx tsc --noEmit`, con eslint sobre los archivos tocados y con una
comprobación manual en el navegador. Esta entrega no tiene pruebas de componentes ni de Playwright (decisión del
2026-11-02). **Las comprobaciones manuales las hace el usuario.** Quien implementa las deja marcadas como
PENDIENTES en la nota de la tarea, sin darlas por hechas.

**Variables.** Antes de verificar, en la misma terminal:

```bash
export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
  NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
  NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
```

**Tipos de rutas.** `npx tsc --noEmit` usa los tipos de rutas de `.next/types`. Las páginas nuevas los cambian: si
`tsc` falla por tipos de rutas ausentes o viejos, corre antes `npm run build`.

**Línea base (2026-11-02, ronda 3 de la 016).** `npm test`: 42 archivos, 1151 pruebas en verde. `npx next lint`: 348
avisos = tope. Eslint sobre los cinco archivos que se modifican (`src/components/compliance/ComplianceLayout.tsx`,
`src/components/compliance/ui/primitives.tsx`, `src/components/shared/Dialog.tsx`, `src/lib/labels/taxCompliance.ts`,
`__tests__/taxProfile/noPiiLeaks.test.ts`): 0 avisos. Antes de T1, quien implementa vuelve a medir y anota la cifra,
y guarda la salida de `git diff -- __tests__/middleware/routeAccess.ts` (hoy trae un cambio ajeno,
`/explore/recognitions`) para compararla en T21. Control de lint por tarea:

- archivos **nuevos** y **modificados**: `npx eslint --max-warnings=0 <archivos>` (los modificados hoy tienen 0).

`.lint-max-warnings` no se sube nunca (P-19). Si una tarea deja menos de 348 avisos en `npx next lint`, se baja
`.lint-max-warnings` al número nuevo en esa misma tarea.

**Windows.** `npm run lint:ci` y `npm run audit:ci` salen con código 3 (el script no encuentra `npx`/`npm`). Se corren
igual y se anota la salida; los equivalentes son `npx next lint` (0 errores, ≤ 348 avisos) y `npm audit --omit=dev`
(solo los altos con excepción vigente, más `follow-redirects`, ajeno). La puerta real la confirma el CI en Linux.

**Dependencias.** No hay nuevas: `package.json` y `package-lock.json` no cambian.

**URL sin datos.** Ninguna URL se arma con `URLSearchParams` ni con un literal con `?` en un `href=` o en
`router.push/replace(`: se usan `queuePath`, `taxProfileReviewPath` y `casePath` de `src/lib/compliance/routes.ts`
(los marca `noPiiLeaks.test.ts`).

**Comprobaciones manuales.**

- Entorno: `npx next dev --turbopack` (o `-p 3001`) con `.env.local`, la API local en `NEXT_PUBLIC_API_URL`;
  `MIDDLEWARE=ACTIVE` para T21.
- Usuarios: un `ROLE_COMPLIANCE_OFFICER`; un empresario con ficha de dos o más versiones (la última con una actividad y
  un periodo de ingresos distintos de la anterior), documentos `RUT`, `CAMARA_COMERCIO` y `OTRO` (uno reemplazado, para
  tener historial), una sede cerrada, manifestaciones del compromiso (una `MANIFESTED` con representante y una
  `TECHNICAL_INCIDENT` sin él), más de 20 requerimientos (para paginar), un hallazgo con `accountStatusApplied` y otro
  sin él, e incidencias de sistema y de compliance; otro empresario `COMPLETED` **sin** ficha. Hallazgos e
  incidencias se crean con un cliente HTTP y el token del oficial (`POST /compliance/findings`,
  `POST /compliance/incidents`) hasta la 018 (R-1). Un admin y un empresario para T21. Para T15.6, poder enviar una
  versión nueva de la ficha como el empresario durante la prueba; para T16, si se puede, una versión anterior que use
  un código del catálogo ya retirado.
- DevTools abiertas: Console, Network y Application → Storage (Local y Session).

**Bloques para delegar.**

| Bloque | Tareas | Dependencias |
|---|---|---|
| **A** · base: textos, servicios, claves | T1-T3 | independientes entre sí. |
| **B** · lógica pura | T4-T10 | T5-T9 necesitan T1; T4 y T10, independientes. |
| **C** · hooks | T11 | A y B. |
| **D** · menú y cola | T12-T13 | C (T12 es independiente). |
| **E** · revisión de la ficha | T14-T16 | C. T14 antes de T15; T16 después de T15. |
| **F** · caso y documentos | T17-T20 | C. En orden: T17 (diálogo), T18 (caso y pestañas), T19 (Documentos), T20 (solo lectura). |
| **G** · acceso, barridos y cierre | T21-T23 | todo lo anterior. |

---

## Bloque A · Base

- [x] T1 · Textos de la entrega y dos diccionarios nuevos (CA-1, CA-3, CA-5, CA-8, CA-12, CA-14, CA-15, CA-16, CA-20, CA-21, CA-22, CA-28; RN-1, RN-11, RN-13, RN-14)
  - Archivos: src/lib/labels/complianceTaxReview.ts, src/lib/labels/taxCompliance.ts,
    __tests__/complianceTaxReview/complianceTexts.test.ts
  - Test primero: __tests__/complianceTaxReview/complianceTexts.test.ts. Casos:
    1. Literales de la spec, uno por uno: "Solo para contrastar: la ficha no modifica la vocación", "Todavía no hay
       fichas tributarias enviadas.", "No pudimos cargar las fichas tributarias.", "No tienes permiso para ver esta
       sección.", "El empresario todavía no ha enviado la ficha tributaria.", "No pudimos cargar la ficha
       tributaria.", "Revisión guardada", "No pudimos guardar la revisión. Intenta de nuevo.", "Ver RUT", "Documento
       ya no vigente", "Comparar con versión…", "Ver caso del empresario", "Abrir revisión de la ficha", "Escribe la
       observación para el empresario.", "Escribe el NIT o la cédula del titular.", "Escríbelo como figura en el
       documento; se compara con el empresario", "El documento tiene vigencia comprobable", "El vencimiento no puede
       ser anterior a la expedición.", "Escribe la observación o el motivo del rechazo.", "Guardar revisión", "No
       encontramos este empresario.", los vacíos del caso ("El empresario no tiene documentos en su expediente.", "No
       hay manifestaciones registradas.", "No hay requerimientos para este empresario.", "No hay hallazgos
       registrados.", "No hay incidencias registradas."), "Sistema" y "Compliance".
    2. Funciones: `queueEmpty('SUBMITTED')` = "No hay fichas enviadas.", `'OBSERVED'` → "No hay fichas observadas.",
       `'REVIEWED'` → "No hay fichas revisadas.", `'ALL'` → "Todavía no hay fichas tributarias enviadas.";
       `versionLoadError(1)` = "No pudimos cargar la versión 1."; `contractVersion(3)` = "Contrato v3";
       `accountStatusApplied('Suspendida')` = "Estado de la cuenta aplicado: Suspendida"; `sectionsSummary({ verified:
       5, observed: 1, notApplicable: 1, pending: 1 })` = "5 verificadas · 1 observadas · 1 no aplica · 1 pendientes";
       `tabLoadError('documents')` = "No pudimos cargar los documentos." (y los de `commitment`, `requests`,
       `findings`, `incidents` y `tax-profile`); `versionChanged(4)` = "La ficha cambió a la versión 4 mientras la
       revisabas. Revisa de nuevo las secciones." (texto exacto de RN-13, CA-28).
    3. `QUEUE_FILTER_LABELS` = Enviada, Observada, Revisada, Todas (en ese orden); `CASE_TAB_LABELS` tiene las seis
       pestañas con los nombres de la spec (Ficha tributaria, Documentos, Compromiso, Requerimientos, Hallazgos,
       Incidencias).
    4. `FINDING_SEVERITY_LABELS` cubre `LOW`, `MEDIUM`, `HIGH` y `ACCOUNT_STATUS_LABELS` los ocho `AccountStatus`, sin
       textos vacíos (D-14).
    5. Ningún texto del archivo nuevo contiene un dato personal de ejemplo (6 o más dígitos seguidos, `@`).

    Falla antes porque el módulo y las dos constantes no existen.
  - Cambios: `COMPLIANCE_TAX_REVIEW_TEXTS` `as const` con funciones, `QUEUE_FILTER_LABELS`, `CASE_TAB_LABELS` y los
    textos de D-13; en `taxCompliance.ts`, `FINDING_SEVERITY_LABELS` y `ACCOUNT_STATUS_LABELS` con los textos de D-14.
    Sin `'use client'`.
  - Verificar: npx vitest run __tests__/complianceTaxReview/complianceTexts.test.ts __tests__/taxProfile/labels.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/labels/complianceTaxReview.ts src/lib/labels/taxCompliance.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (Cannot find package @/lib/labels/complianceTaxReview). Pasa con 5 casos; taxCompliance.ts gana FINDING_SEVERITY_LABELS y ACCOUNT_STATUS_LABELS (D-14). Los tipos QueueFilter y CaseTabKey viven en el archivo de textos y routes.ts los importa.

- [x] T2 · Servicios de compliance (CA-2, CA-9, CA-17, CA-22, CA-29)
  - Archivos: src/services/compliance/ComplianceTaxProfileService.ts, src/services/compliance/ComplianceCaseService.ts,
    __tests__/complianceTaxReview/complianceServices.test.ts
  - Test primero: __tests__/complianceTaxReview/complianceServices.test.ts, con `vi.mock('@/lib/api/client')` (patrón
    de `__tests__/expediente/expedienteServices.test.ts`). Casos:
    1. `list({ page: 0, size: 20 })` → `GET /compliance/tax-profiles` con `params: { page: 0, size: 20 }` (sin
       `status`); `list({ status: 'OBSERVED', page: 1, size: 20 })` → `params` con `status`. Devuelve `data`.
    2. `get(id)` → `GET /compliance/tax-profiles/{id}`; `getVersion(id, 2)` → `…/versions/2`. `getCatalog()` →
       `GET /compliance/tax-catalog` sin `params`; devuelve el arreglo tal cual, sin filtrar los retirados (CA-29).
    3. `reviewSection(id, 'A_RUT', { result: 'VERIFIED' })` → `POST /compliance/tax-profiles/{id}/sections/A_RUT/review`
       con ese cuerpo tal cual.
    4. `listDocuments(id)` → `GET /compliance/commercials/{id}/documents`; `reviewDocument(7, body)` →
       `POST /compliance/commercial-documents/7/review` con el cuerpo tal cual.
    5. `listCommitment(id)` → `GET /compliance/commercials/{id}/declarations/FORMALIZATION_COMMITMENT`;
       `listRequests(id, 1)` → `GET /compliance/information-requests` con `params: { commercialPublicId: id, page: 1,
       size: 20 }` y **sin** `status`; `listFindings(id)` y `listIncidents(id)` → sus rutas.
    6. Los servicios solo exponen esos métodos (`Object.keys`): nada de crear requerimientos, hallazgos, incidencias
       ni códigos del catálogo (es de la 018).

    Falla antes porque los módulos no existen.
  - Cambios: dos objetos de servicio vía `apiClient` con los tipos de `src/types` (sin `any`); los parámetros de
    consulta van en `params` de axios (no en la cadena). Sin manejo de 401/402/503.
  - Verificar: npx vitest run __tests__/complianceTaxReview/complianceServices.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/services/compliance
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/services/compliance/ComplianceCaseService); 9 pruebas en verde. Los servicios se escribieron junto con la prueba y la falla se comprobó moviendo la carpeta un momento.

- [x] T3 · Claves e invalidaciones (CA-9, CA-17, CA-18, CA-28, CA-29; RN-8, RN-12, RN-13, P-10)
  - Archivos: src/hooks/compliance/complianceKeys.ts, __tests__/complianceTaxReview/complianceKeys.test.ts
  - Test primero: __tests__/complianceTaxReview/complianceKeys.test.ts. Casos:
    1. Claves únicas: `queue('SUBMITTED', 1)` ≠ `queue('ALL', 1)` ≠ `queue('SUBMITTED', 2)`; `detail(a)` ≠ `detail(b)`;
       `version(a, 1)` ≠ `version(a, 2)`; las seis claves del caso distintas entre sí y entre empresarios.
    2. `queueAll` es prefijo de toda `queue(…)` (con `partialMatchKey` de `@tanstack/query-core` o comparando el
       prefijo) y **no** lo es de `detail` ni de `version`; `detail(id)` no es prefijo de `version(id, n)`.
    3. `COMPLIANCE_INVALIDATIONS.reviewSection` = `[queueAll]` (CA-9); `reviewDocument(id)` y
       `reviewDocumentRejected(id)` = `[documents(id)]` (CA-17, CA-18) y no tocan `detail(id)`.
    4. `requestsAll(id)` es prefijo de `requests(id, n)`.
    5. `complianceTaxCatalogKeys.all` es distinta de `taxProfileKeys.catalog` de la 014 (otro rol, otra lista) y no es
       prefijo de ninguna clave de fichas ni del caso, ni ellas de ella (CA-29).
    6. `COMPLIANCE_INVALIDATIONS.versionChanged(id)` = `[documents(id)]` y no toca `detail(id)`, que ya trae la
       respuesta (CA-28).

    Falla antes porque el módulo no existe.
  - Cambios: las claves (incluida `complianceTaxCatalogKeys`) y `COMPLIANCE_INVALIDATIONS` (incluida `versionChanged`)
    de la sección 6.1 del plan, `as const`. Sin `'use client'`.
    Comentario en `reviewDocument`: no se parchea con `setQueryData` (R-2).
  - Verificar: npx vitest run __tests__/complianceTaxReview/complianceKeys.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/hooks/compliance/complianceKeys.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/hooks/compliance/complianceKeys); 5 pruebas en verde (usa partialMatchKey de @tanstack/query-core, ya instalado como dependencia de react-query; package.json no cambia).

## Bloque B · Lógica pura

- [x] T4 · Rutas, parámetros de URL y teclado de pestañas (CA-1, CA-2, CA-4, CA-19, CA-24; RN-9)
  - Archivos: src/lib/compliance/routes.ts, __tests__/complianceTaxReview/routes.test.ts
  - Test primero: __tests__/complianceTaxReview/routes.test.ts. Casos:
    1. `parseQueueParams({})` = `{ status: 'SUBMITTED', page: 1 }` (CA-1); `{ status: 'OBSERVED', page: '2' }` →
       `OBSERVED`, 2; `{ status: 'ALL' }` → `ALL`; `status` `'observed'`, `'X'` o `''` → `SUBMITTED`; `page` `'0'`,
       `'-3'`, `'1.5'`, `'abc'`, `'2abc'` → 1; arreglos (`['REVIEWED', 'OBSERVED']`) → el primero.
    2. `queuePath({ status: 'SUBMITTED', page: 1 })` = `/compliance/tax-profiles`; `('OBSERVED', 1)` →
       `/compliance/tax-profiles?status=OBSERVED`; `('OBSERVED', 2)` → `…?status=OBSERVED&page=2`; `('SUBMITTED', 3)` →
       `…?page=3`; `('ALL', 1)` → `…?status=ALL`. Ida y vuelta: `parseQueueParams` de la query de `queuePath(x)` = `x`
       para los cuatro estados y las páginas 1 a 3 (CA-2).
    3. `queueApiParams({ status: 'ALL', page: 1 })` = `{ page: 0, size: 20 }` sin la clave `status` (CA-2);
       `('REVIEWED', 3)` = `{ status: 'REVIEWED', page: 2, size: 20 }`.
    4. `taxProfileReviewPath(uuid)` = `/compliance/tax-profiles/{uuid}` (CA-4); `casePath(uuid, 'tax-profile')` =
       `/compliance/commercials/{uuid}` (CA-24); `casePath(uuid, 'documents')` = `…?tab=documents`.
    5. `parseCaseTab` acepta las seis pestañas y devuelve `'tax-profile'` con `undefined`, `''`, `'Documents'`,
       `'otra'` o un arreglo vacío (CA-19).
    6. `nextTabIndex(0, 'ArrowRight', 6)` = 1; `(5, 'ArrowRight', 6)` = 0; `(0, 'ArrowLeft', 6)` = 5; `Home` → 0; `End`
       → 5; `'Enter'` → `null`.
    7. Ninguna salida de `queuePath`/`casePath` contiene otra clave que `status`, `page` o `tab` (RN-9).

    Falla antes porque el módulo no existe.
  - Cambios: lo de la sección 6.2 del plan. Sin `URLSearchParams` (la regla de `noPiiLeaks` lo marcaría). Sin
    `'use client'`.
  - Verificar: npx vitest run __tests__/complianceTaxReview/routes.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/compliance/routes.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/lib/compliance/routes); 17 pruebas en verde. parseQueueParams acepta page solo como entero positivo de hasta 9 dígitos.

- [x] T5 · Campos de la ficha por sección, códigos con catálogo y diff de versiones (CA-5, CA-7, CA-11, CA-29; RN-12)
  - Archivos: src/lib/compliance/taxProfileFields.ts, __tests__/complianceTaxReview/taxProfileFields.test.ts
  - Test primero: __tests__/complianceTaxReview/taxProfileFields.test.ts, con una versión ficticia completa y un
    catálogo ficticio pasado por `groupCatalog` (sin datos reales). Casos:
    1. `SECTION_ORDER` = las claves de `TAX_PROFILE_SECTION_TITLES` en orden a → h; `sectionFields` devuelve filas
       para las ocho (CA-5).
    2. a): "Vinculado" / "Sin documento RUT vinculado" según `rutDocumentId`; lista de responsabilidades por código.
       b): actividad principal marcada "(principal)". d): Sí/No. h): sin asesor, no hay fila de alcance.
    3. e): un ítem por periodo con concepto, "del 1 de enero de 2026 al 31 de marzo de 2026", `formatCents(123456789)`
       (separador de miles) y el texto de `INCOME_SCOPE_LABELS` (CA-7); "Con soporte" solo con `supportDocumentId`.
    4. f): "Sedes declaradas al enviar" con `establishmentsCount`.
    5. `diffSection` con versiones iguales: ninguna fila cambiada. Con `regimeCode` distinto: solo esa fila
       `changed`. `null` frente a `''` no es cambio.
    6. Listas (CA-11): actividad nueva → `added`; actividad quitada → `removed` (al final); misma `ciiuCode` con otra
       descripción o `main` → `changed` con `before`/`after`; periodo de ingresos con otro monto → `changed`; periodo
       nuevo → `added`; responsabilidad quitada → `removed`.
    7. h): asesor en la anterior y no en la vigente → la fila de alcance cuenta como cambiada.
    8. `comparableVersions([{3}, {2}, {1}], 3)` = versiones 2 y 1 en ese orden; `([{1}], 1)` = `[]` (el selector no
       aparece); entrada desordenada → sale descendente.
    9. Catálogo (CA-29, RN-12): régimen, responsabilidades, IVA, INC y método de facturación salen como "código —
       etiqueta"; un código retirado (`active: false`) también lleva su etiqueta; un código que no está → el código
       solo; con `groupCatalog([])` → los códigos solos y el mismo número y orden de filas; el mismo código en
       `REGIME` y en `VAT_CONDITION` con etiquetas distintas → cada campo usa la de su tipo. `diffSection` con el mismo
       catálogo: un código igual en las dos versiones no es cambio; códigos distintos sí, y una responsabilidad
       quitada se marca `removed` por su código.

    Falla antes porque el módulo no existe.
  - Cambios: lo de la sección 6.3 del plan, reutilizando `displayCode` (siempre con la lista del tipo, nunca el
    catálogo entero), `GroupedCatalog`, `formatCents`, `formatPlainDate` y los diccionarios. Sin `'use client'`.
    `src/lib/taxProfile/catalog.ts` no cambia.
  - Verificar: npx vitest run __tests__/complianceTaxReview/taxProfileFields.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/compliance/taxProfileFields.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/lib/compliance/taxProfileFields); 22 pruebas en verde. Claves de fila: rutDocument, rutResponsibilities, regime, activities, vatCondition, incCondition, taxConditionScope, invoicingObligated, invoicingMethod, invoicingNotes, withholdingAgent, withholdingNotes, income, establishmentsCount, currentCapacity, growthScenario, growthMeasures, hasAdvisor, advisorScope. Exporta también los tipos FieldRow, DiffRow, DiffItem y ListItem.

- [x] T6 · Resumen, RUT, compromiso, sedes y cambio de versión (CA-5, CA-6, CA-7, CA-20, CA-21, CA-28; RN-13; D-5, D-8)
  - Archivos: src/lib/compliance/taxProfileReview.ts, __tests__/complianceTaxReview/taxProfileReview.test.ts
  - Test primero: __tests__/complianceTaxReview/taxProfileReview.test.ts. Casos:
    1. `latestSectionReview(reviews, 'C_VAT_INC')` → la de esa sección; sin ella → `null` ("Pendiente de revisión").
    2. `summarizeSectionReviews`: lista vacía → `{0, 0, 0, 8}`; 5 `VERIFIED`, 1 `OBSERVED`, 1 `NOT_APPLICABLE` → `{5,
       1, 1, 1}`; una sección repetida cuenta una vez; una sección desconocida no cuenta (CA-20).
    3. `resolveRutDocument`: sin `rutDocumentId` → `none`; consulta `pending` → `loading`; `error` → `error`; en la lista
       y `VALIDATED` → `available` con ese documento; en la lista y `SUPERSEDED` → `stale`; no está → `stale` (CA-6,
       D-5).
    4. `sortManifestationsDesc`: por `occurredAt` desc; empate por `id` desc; no muta la entrada (CA-21).
    5. `establishmentHistory`: activas primero, cerradas después, cada grupo por `createdAt` desc (CA-7).
    6. `versionChangedDuringReview(2, respuesta con profile.currentVersion 3)` = `true`; con 2 → `false` (CA-28).

    Falla antes porque el módulo no existe.
  - Cambios: lo de la sección 6.4 del plan. Sin `'use client'`.
  - Verificar: npx vitest run __tests__/complianceTaxReview/taxProfileReview.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/compliance/taxProfileReview.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/lib/compliance/taxProfileReview); 11 pruebas en verde. resolveRutDocument recibe status 'pending' | 'error' | 'success' (el status de TanStack Query).

- [x] T7 · Esquema, cuerpo y error de la revisión de sección (CA-8, CA-9, CA-10; RN-4)
  - Archivos: src/lib/compliance/sectionReview.ts, __tests__/complianceTaxReview/sectionReview.test.ts
  - Test primero: __tests__/complianceTaxReview/sectionReview.test.ts. Casos:
    1. `createSectionReviewSchema('OBSERVED')` con `notes: ''` y `'   '` → error en `notes` "Escribe la observación
       para el empresario." (CA-8); con `' Falta el RUT '` → válido.
    2. `VERIFIED` y `NOT_APPLICABLE` con nota vacía → válidos.
    3. 1000 caracteres (tras recortar) válido; 1001 → "Máximo 1000 caracteres"; 1000 más espacios a los lados →
       válido.
    4. `buildSectionReviewBody('VERIFIED', { notes: '  ' })` = `{ result: 'VERIFIED' }` exacto, sin la clave `notes`
       (CA-9); `('OBSERVED', { notes: ' x ' })` = `{ result: 'OBSERVED', notes: 'x' }` (CA-8).
    5. `reviewErrorMessage`: error de axios 400 con `message` → ese texto tal cual (CA-10); 400 sin `message`, 500,
       error de red (sin `response`) y un `Error` cualquiera → "No pudimos guardar la revisión. Intenta de nuevo.". El
       resultado nunca contiene la `config` ni la cabecera `Authorization` del error.

    Falla antes porque el módulo no existe.
  - Cambios: lo de la sección 6.5 del plan, con `readApiError`. Sin `'use client'`.
  - Verificar: npx vitest run __tests__/complianceTaxReview/sectionReview.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/compliance/sectionReview.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/lib/compliance/sectionReview); 8 pruebas en verde.

- [x] T8 · Esquema, valores iniciales, cuerpo y error de la revisión de documento (CA-14, CA-15, CA-16, CA-17; RN-5, RN-6; D-6, D-7)
  - Archivos: src/lib/compliance/documentReview.ts, __tests__/complianceTaxReview/documentReview.test.ts
  - Test primero: __tests__/complianceTaxReview/documentReview.test.ts. Casos:
    1. `requiresHolder` es `true` para `RUT`, `CAMARA_COMERCIO`, `CERTIFICACION_BANCARIA`, `CEDULA_REPRESENTANTE` y
       `false` para `PERMISO_SECTORIAL`, `MARCA_REGISTRADA`, `OTRO`.
    2. Resultado vacío → "Elige el resultado de la revisión." en `result`.
    3. CA-14: `ACCEPTED` en cada uno de los cuatro tipos sin titular (o solo espacios) → "Escribe el NIT o la cédula
       del titular." en `holderIdentification`; `ACCEPTED` en `OTRO` sin titular → válido; `OBSERVED` en `RUT` sin
       titular → no pide titular. Titular de 30 caracteres válido; de 31 (tras recortar) → "Máximo 30 caracteres".
    4. CA-15: `OBSERVED` y `REJECTED` sin notas (o solo espacios) → "Escribe la observación o el motivo del rechazo." en
       `notes`; `ACCEPTED` sin notas → válido; notas de 1001 → "Máximo 1000 caracteres".
    5. CA-16: `hasValidity` con `issuedAt: '2026-05-10'` y `expiresAt: '2026-05-09'` → "El vencimiento no puede ser
       anterior a la expedición." en `expiresAt`; misma fecha → válido; `hasValidity` sin `expiresAt` → "Escribe la
       fecha de vencimiento."; sin `hasValidity` y con un `expiresAt` anterior ya escrito → válido.
    6. `buildDocumentReviewBody`: sin `hasValidity` y con `expiresAt` escrito → sin la clave `expiresAt` (CA-16); con
       todo vacío salvo `ACCEPTED` → `{ result: 'ACCEPTED' }` exacto; titular y notas recortados; nunca una clave con
       `''` (RN-5).
    7. `documentReviewDefaults(doc)`: `result: ''`, `notes: ''`, titular, expedición y vencimiento del documento,
       `hasValidity` `true` solo si `expiresAt` no es `null`; con un documento sin revisar, todo vacío y `hasValidity`
       `false` (D-6).
    8. `documentReviewErrorOutcome`: 400 con "El titular del documento no corresponde al empresario. Márquelo como
       OBSERVED o REJECTED." → ese texto tal cual y `refetch: true` (CA-17); 400 "Solo se revisan documentos vigentes
       del expediente." → tal cual y `refetch: true` (RN-6, D-7); 500 y error de red → "No pudimos guardar la
       revisión. Intenta de nuevo." y `refetch: false`.

    Falla antes porque el módulo no existe.
  - Cambios: lo de la sección 6.6 del plan (zod 4, `superRefine`, rutas de error en el campo). Sin `'use client'`.
  - Verificar: npx vitest run __tests__/complianceTaxReview/documentReview.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/compliance/documentReview.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/lib/compliance/documentReview); 14 pruebas en verde. buildDocumentReviewBody lanza un Error si result es vacío (el esquema lo impide antes de enviar).

- [x] T9 · Errores de carga de la revisión y de cada pestaña (CA-12, CA-20, CA-23; D-4)
  - Archivos: src/lib/compliance/loadErrors.ts, __tests__/complianceTaxReview/loadErrors.test.ts
  - Test primero: __tests__/complianceTaxReview/loadErrors.test.ts, con errores de axios construidos a mano. Casos:
    1. `reviewLoadView`: 404 → `'not-sent'` (CA-12); 403 → `'forbidden'`; 500, red, `Error` → `'error'`.
    2. `tabErrorView(err, 'tax-profile')` con 404 → "El empresario todavía no ha enviado la ficha tributaria." sin
       reintento (CA-20).
    3. `tabErrorView(err, 'documents' | 'commitment' | 'requests' | 'findings' | 'incidents')`: 404 y 400 → "No
       encontramos este empresario." sin reintento, aunque la API mande "User with public id: … not found" (D-4); 403 →
       "No tienes permiso para ver esta sección." sin reintento; 500 y red → "No pudimos cargar {la pestaña}." con
       reintento (CA-23).
    4. El mensaje devuelto nunca es el `message` en inglés de la API ni contiene el UUID.

    Falla antes porque el módulo no existe.
  - Cambios: lo de la sección 6.7 del plan. Sin `'use client'`.
  - Verificar: npx vitest run __tests__/complianceTaxReview/loadErrors.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/compliance/loadErrors.ts
  - Comprobar: no aplica.
  - Nota: Falló antes por módulo inexistente (@/lib/compliance/loadErrors); 5 pruebas en verde. tabErrorView con tab tax-profile y 400 muestra "No encontramos este empresario.".

- [x] T10 · Foco atrapado en el diálogo compartido (CA-18; requisito de accesibilidad; D-10)
  - Archivos: src/lib/a11y/focusTrap.ts, __tests__/a11y/focusTrap.test.ts, src/components/shared/Dialog.tsx
  - Test primero: __tests__/a11y/focusTrap.test.ts. Casos de `trappedFocusIndex({ index, count, shiftKey })`:
    1. `count: 0` → `'panel'` (el foco se queda en el panel).
    2. Tab en el último (`index: count - 1`) → 0; Mayús+Tab en el primero → `count - 1`; Mayús+Tab con el foco en el
       panel (`index: -1`) → `count - 1`; Tab con el foco en el panel → 0.
    3. Tab o Mayús+Tab en un elemento del medio → `null` (el navegador sigue solo).
    4. Un `index` fuera de rango (el foco salió del panel) → 0 con Tab y `count - 1` con Mayús+Tab.

    Falla antes porque el módulo no existe.
  - Cambios: la función pura; en `Dialog.tsx`, el `keydown` del diálogo de arriba atiende también `Tab`: busca los
    enfocables del panel (selector del plan, 7.6), calcula el índice de `document.activeElement` y, si
    `trappedFocusIndex` no es `null`, hace `preventDefault()` y enfoca el destino. Escape, la pila, `dismissible` y el
    retorno del foco no cambian.
  - Verificar: npx vitest run __tests__/a11y/focusTrap.test.ts && npx tsc --noEmit && npx eslint --max-warnings=0 src/lib/a11y/focusTrap.ts src/components/shared/Dialog.tsx
  - Comprobar (regresión, R-4): en `/commercial/profile/establishments` abre "Agregar sede" y en
    `/commercial/profile/documents` "Agregar documento": Tab desde el último control vuelve a la X; Mayús+Tab desde la
    X va al último; Escape, el fondo y la X cierran como antes y el foco vuelve al botón que abrió. Durante una subida
    del expediente el diálogo sigue sin cerrarse.
  - Nota: Falló antes por módulo inexistente (@/lib/a11y/focusTrap); 7 pruebas en verde. Dialog.tsx: el keydown del diálogo de arriba atiende Tab con FOCUSABLE_SELECTOR (exportado desde focusTrap.ts); Escape, pila, dismissible y retorno del foco sin cambios. Comprobación manual de regresión (R-4): PENDIENTE (la hace el usuario).

## Bloque C · Hooks

- [x] T11 · Hooks de TanStack Query y "Ver" (CA-6, CA-9, CA-12, CA-17, CA-18, CA-23, CA-28, CA-29; RN-8, RN-12, RN-13, P-10)
  - Archivos: src/hooks/compliance/useComplianceTaxProfiles.ts, src/hooks/compliance/useComplianceCase.ts,
    src/hooks/compliance/useOpenCaseDocument.ts
  - Test primero: no aplica (hooks de React; la lógica que usan está probada en T3 a T9, y T22 fija por barrido
    estático los puntos frágiles). Antes de escribirlos, `__tests__/complianceTaxReview` en verde.
  - Cambios: los hooks de la tabla 6.1 del plan:
    - todas las lecturas con `enabled: isUuid(id)` (`isUuid` de `src/lib/informationRequests/requests.ts`) y `retry:
      retryUnlessForbiddenOrMissing`; la versión con `staleTime: Infinity`; los requerimientos con `placeholderData:
      keepPreviousData`;
    - `useComplianceTaxCatalog()`: `complianceTaxCatalogKeys.all`, `getCatalog`, `staleTime: 10 * 60 * 1000`, `retry:
      retryUnlessForbiddenOrMissing`; no depende del id (CA-29);
    - `useReviewTaxProfileSection(id)`: variables `{ section, body, shownVersion }` (`shownVersion` no viaja a la API);
      `onSuccess(res, vars)` → `setQueryData(detail(id), res)`, recorre `COMPLIANCE_INVALIDATIONS.reviewSection` y, si
      `versionChangedDuringReview(vars.shownVersion, res)`, también `versionChanged(id)` (CA-28);
    - `useReviewCaseDocument(id)`: `onSuccess` devuelve la promesa de `Promise.all` de las invalidaciones de
      `reviewDocument(id)` (el diálogo cierra con la lista releída); `onError` → si
      `documentReviewErrorOutcome(err).refetch`, recorre `reviewDocumentRejected(id)`. **Nunca `setQueryData` sobre la
      lista** (R-2);
    - `useOpenCaseDocument(query)`: el adaptador de `ExpedienteScreen.tsx:51-63` (`openExpedienteDocument`,
      `fetchedAt: query.dataUpdatedAt`, `refetch: async () => documentsFromRefetch(await query.refetch())`,
      `window.open(url, '_blank', 'noopener,noreferrer')` o `window.open('', '_blank')`, `toast.error` con
      `EXPEDIENTE_TEXTS.openFailed`); devuelve `{ open, openingId }` y no lee `downloadUrl`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/hooks/compliance && npx vitest run __tests__/complianceTaxReview
  - Comprobar: se comprueba con T13 a T20.
  - Nota: Sin prueba (hooks; la lógica ya está probada en T3 a T9). Archivos: useComplianceTaxProfiles.ts (cola, detalle, versión, catálogo, revisión de sección), useComplianceCase.ts (documentos, compromiso, requerimientos, hallazgos, incidencias, revisión de documento) y useOpenCaseDocument.ts. `useOpenCaseDocument(query)` recibe la consulta de `useCaseDocuments`, pasa `refetch` por `documentsFromRefetch`, abre con `noopener,noreferrer` y no lee `downloadUrl`. `useReviewCaseDocument` no usa `setQueryData` (R-2). Comprobación manual: se comprueba con T13 a T20 (PENDIENTE, la hace el usuario).

## Bloque D · Menú y cola

- [x] T12 · Entrada "Fichas tributarias" y filas activables (CA-1, CA-4)
  - Archivos: src/components/compliance/ComplianceLayout.tsx, src/components/compliance/ui/primitives.tsx
  - Test primero: no aplica (interfaz). T22 comprueba por barrido que `NAV` tiene la entrada con
    `/compliance/tax-profiles`.
  - Cambios: entrada de `NAV` del plan (3.2) con `FileSpreadsheet`; `LedgerRow` con `onActivate?` y `ariaLabel?`
    (`tabIndex={0}`, `onClick`, `onKeyDown` con Enter, `cursor-pointer`, `focus-visible:outline`); sin ellos el marcado
    es idéntico.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/ComplianceLayout.tsx src/components/compliance/ui/primitives.tsx
  - Comprobar: como oficial, abre `/compliance`: "Fichas tributarias" aparece en el riel de escritorio, en el riel
    contraído (ícono con `title`) y en el cajón móvil (360 px). Las tablas de `/compliance/kyc`, `/compliance/contracts`
    y `/compliance/audit-logs` se ven y se comportan como antes (sus filas no son enfocables).
  - Nota: NAV con "Fichas tributarias" (FileSpreadsheet) tras Contratos; `LedgerRow` con `onActivate`/`ariaLabel` (Enter solo si el foco está en la fila; sin ellos el marcado es idéntico). Comprobación manual: PENDIENTE (la hace el usuario).

- [x] T13 · Cola de fichas y su página (CA-1, CA-2, CA-3, CA-4; P-2, P-6)
  - Archivos: src/components/compliance/tax-profiles/TaxProfileQueue.tsx, src/app/compliance/tax-profiles/page.tsx
  - Test primero: no aplica (interfaz; la lógica está en T4). T22 comprueba que la página no tiene `'use client'` y hace
    `await searchParams`.
  - Cambios: página de servidor con `metadata` ("Fichas tributarias"), `searchParams: Promise<Record<string, string |
    string[] | undefined>>`, `parseQueueParams` y `<TaxProfileQueue status page />`. Componente de la sección 7.2 del
    plan: filtro (`Tabs` del portal), `Ledger` con `LedgerRow onActivate`, `Pager`, estados con
    `COMPLIANCE_TAX_REVIEW_TEXTS`, `router.push(queuePath(…))` dentro de `startTransition`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/tax-profiles/TaxProfileQueue.tsx src/app/compliance/tax-profiles/page.tsx
  - Comprobar:
    1. Pulsa "Fichas tributarias": la URL es `/compliance/tax-profiles`, el filtro "Enviada" está activo y en Network
       el `GET /compliance/tax-profiles` lleva `status=SUBMITTED&page=0&size=20` (CA-1).
    2. Elige "Observada" y pasa a la página 2 (con datos suficientes): la URL dice `?status=OBSERVED&page=2` y el
       `GET` lleva `status=OBSERVED&page=1`; recarga y usa "atrás": la vista se conserva en cada paso. "Todas" pone
       `?status=ALL` y el `GET` va **sin** `status` (CA-2).
    3. Con un filtro sin resultados se lee su vacío ("No hay fichas revisadas.", o con "Todas" en una base vacía
       "Todavía no hay fichas tributarias enviadas."). Con la API apagada: "No pudimos cargar las fichas tributarias."
       y "Reintentar" vuelve a pedir (se ve el `GET` en Network) (CA-3).
    4. Clic en una fila abre `/compliance/tax-profiles/{uuid}`; con Tab hasta una fila (anillo visible) y Enter,
       también (CA-4). A 360 px la tabla se desplaza dentro de su marco y la página no tiene scroll horizontal. La cola
       no muestra el NIT.
  - Nota: Página de servidor con `await searchParams` y `TaxProfileQueue` de cliente (filtro `Tabs`, `Ledger`, `Pager` base 0 convertido a base 1, `router.push` en `startTransition`; filtro y paginador inertes mientras la transición está pendiente; 403 con su texto y sin reintento). Comprobaciones 1 a 4: PENDIENTES (las hace el usuario).

## Bloque E · Revisión de la ficha

- [x] T14 · Diálogo de revisión de sección (CA-8, CA-9, CA-10, CA-28; RN-4, RN-7, P-11)
  - Archivos: src/components/compliance/tax-profiles/SectionReviewDialog.tsx
  - Test primero: no aplica (interfaz; la lógica está en T7). T22 comprueba la guarda `useRef` y `dismissible`.
  - Cambios: `Dialog` con `dismissible={!busy}`; `useForm({ resolver: zodResolver(createSectionReviewSchema(result)),
    defaultValues: { notes: '' } })`; `submittingRef` comprobado en la primera línea del `onSubmit`; botón "Guardar
    revisión" `disabled` con `Loader2` mientras `busy`; error de envío con `reviewErrorMessage` en `role="alert"` (la
    nota no se borra); al guardar, `onSaved(res)` y cierre. El diálogo recibe `shownVersion` (la versión vigente al
    abrirlo) y lo pasa en las variables de la mutación; el aviso de RN-13 lo pinta T15. Textos de la sección 7.3 del
    plan.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/tax-profiles/SectionReviewDialog.tsx
  - Comprobar (desde la revisión, después de T15):
    1. "Observar" en e) y "Guardar revisión" vacío o con espacios: "Escribe la observación para el empresario." y
       ningún `POST` en Network. Con nota: el `POST …/sections/E_INCOME/review` lleva `{"result":"OBSERVED","notes":"…"}`
       recortada; la sección muestra "Observada" con la nota y la cabecera pasa a "Con observaciones" (CA-8, RN-14).
    2. "Verificar" y "No aplica" sin nota: el cuerpo es solo `{"result":"VERIFIED"}` / `{"result":"NOT_APPLICABLE"}`.
       Con las ocho revisadas y ninguna observada, la cabecera dice "Revisada"; vuelve a la cola: la ficha aparece con
       ese estado (filtro "Revisada" o "Todas") sin recargar (CA-9).
    3. Doble clic rápido en "Guardar revisión": un solo `POST`; mientras está en curso el botón muestra el indicador y
       Escape, el fondo y la X no cierran. Con la API respondiendo 400 (por ejemplo, reenviando desde Network un
       `OBSERVED` con `notes` en blanco) o apagada: el diálogo sigue abierto con la nota escrita y el mensaje de la API
       o "No pudimos guardar la revisión. Intenta de nuevo." (CA-10).
    4. El cambio de versión durante la revisión (CA-28) se comprueba en T15.6.
  - Nota: Sin prueba (interfaz). El diálogo usa `useReviewTaxProfileSection` por dentro (recibe `commercialPublicId`, `section`, `result`, `shownVersion`, `onSaved`, `onClose`) y se monta solo mientras está abierto, así que cada apertura empieza con la nota vacía; `submittingRef` en la primera línea del `onSubmit`, `dismissible={!busy}`, la nota no se borra ante un error. Comprobaciones 1 a 3: PENDIENTES (las hace el usuario, después de T15).

- [x] T15 · Pantalla de revisión de la ficha y su página (CA-5, CA-6, CA-7, CA-12, CA-24, CA-28, CA-29; RN-1, RN-3, RN-12, RN-13; P-2, P-6)
  - Archivos: TaxProfileReview.tsx, ReviewHeader.tsx, DeclaredSection.tsx, RutDocumentLink.tsx y
    SectionReviewPanel.tsx en src/components/compliance/tax-profiles/;
    src/app/compliance/tax-profiles/[commercialPublicId]/page.tsx
  - Test primero: no aplica (interfaz; la lógica está en T5, T6 y T9). T22 comprueba la página de servidor.
  - Cambios: página de servidor (`metadata` "Revisión de ficha tributaria", `params: Promise<{ commercialPublicId:
    string }>`, `await params`). Componentes de la sección 7.3 del plan; `SectionReviewDialog` y `VersionCompare` con
    `next/dynamic` (`ssr: false`); `useComplianceTaxProfile`, `useCaseDocuments(id, rutDocumentId !== null)` para el
    RUT, `useReviewTaxProfileSection`, `useComplianceTaxCatalog` (con `groupCatalog(data ?? [])` pasado a
    `DeclaredSection` y a `VersionCompare`; sin esqueleto ni error propios, nunca bloquea la pantalla, CA-29);
    `toast.success` con "Revisión guardada"; aviso persistente `role="status"` con `versionChanged(n)` cuando
    `versionChangedDuringReview(shownVersion, res)` (CA-28, sección 7.3 del plan). `ReviewHeader`, `DeclaredSection` y
    `SectionReviewPanel` sin `'use client'`. Vocación con `COMMERCIAL_ACTIVITY_TYPE_LABELS` de
    `src/services/ComplianceService.ts` (o "Sin definir"). Mientras T16 no exista, el selector puede montarse sin
    comparador; T16 lo conecta.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/tax-profiles "src/app/compliance/tax-profiles/[commercialPublicId]/page.tsx"
  - Comprobar:
    1. Abre una ficha desde la cola: empresa, "NIT …", insignia, "Versión vigente: vN", vocación con "Solo para
       contrastar: la ficha no modifica la vocación", y las ocho secciones con lo declarado a la izquierda y el último
       resultado (o "Pendiente de revisión") a la derecha (CA-5). A 360 px, una columna con la revisión debajo de cada
       sección.
    2. a) "Ver RUT" abre el documento en otra pestaña (Network: sin petición nueva si la lista tiene menos de 4
       minutos); pasados 4 minutos vuelve a pedir `…/documents` y abre la URL nueva. Con el RUT de la versión ya
       reemplazado: "Documento ya no vigente" y ningún enlace (CA-6, D-5).
    3. e) tabla con concepto, periodo, valor con separador de miles ("$ 1.234.567") y alcance del diccionario; f)
       "Sedes declaradas al enviar: N" y el historial con la sede cerrada marcada "Cerrada" con fecha y motivo (CA-7).
    4. `/compliance/tax-profiles/abc`: "El empresario todavía no ha enviado la ficha tributaria." con "Volver a fichas
       tributarias" y **ningún** `GET` en Network; con el UUID del empresario sin ficha, el mismo texto tras un 404
       (CA-12).
    5. "Ver caso del empresario" lleva a `/compliance/commercials/{uuid}` con la pestaña "Ficha tributaria" activa
       (CA-24; la página del caso llega en T18: hasta entonces se comprueba solo la URL).
    6. Con la revisión abierta en la versión N, envía la versión N+1 como el empresario (otra sesión o un cliente HTTP)
       y luego "Verificar" una sección: se ve "La ficha cambió a la versión N+1 mientras la revisabas. Revisa de nuevo
       las secciones.", la cabecera dice "Versión vigente: vN+1", las secciones muestran lo declarado en N+1 (las no
       revisadas en esa versión, "Pendiente de revisión"), el selector ofrece la versión N y en Network se vuelve a
       pedir `…/documents` (CA-28).
    7. Régimen, responsabilidades, condiciones de IVA e INC y método de facturación se ven como "código — etiqueta"
       (`GET /compliance/tax-catalog` en Network). Con DevTools bloqueando solo `…/tax-catalog` y recargando: los
       mismos campos muestran solo el código, sin mensaje de error, y "Verificar" una sección sigue funcionando
       (CA-29).
  - Nota: Sin prueba (interfaz). Archivos: TaxProfileReview, ReviewHeader, DeclaredSection, RutDocumentLink, SectionReviewPanel (sin `'use client'` los cuatro últimos) y la página de servidor con `await params`. `SectionReviewDialog` y `VersionCompare` con `next/dynamic` (`ssr: false`). Desviación menor: se añadieron a `complianceTaxReview.ts` textos para la tabla de ingresos, el historial de sedes, el estado de carga y "Antes/Ahora" (la prueba de textos de T1 sigue en verde). Si la versión elegida para comparar pasa a ser la vigente, la comparación se descarta sola. Comprobaciones 1 a 7: PENDIENTES (las hace el usuario).
- [x] T16 · Comparador de versiones (CA-11, CA-29; RN-2, RN-12)
  - Archivos: src/components/compliance/tax-profiles/VersionCompare.tsx,
    src/components/compliance/tax-profiles/TaxProfileReview.tsx (lo conecta)
  - Test primero: no aplica (interfaz; la lógica está en T5). T22 comprueba que el comparador no monta botones de
    revisión.
  - Cambios: sección 7.4 del plan con `diffSection` por sección y el mismo catálogo agrupado que la revisión; columnas "Versión N · {fecha}" y "Vigente · versión
    M"; marcas de texto "Cambió", "Agregado", "Quitado", "Sin cambios"; "Volver a la revisión". Error de la versión bajo
    el selector con "Reintentar".
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/tax-profiles
  - Comprobar: en una ficha con dos o más versiones elige "Versión 1" en "Comparar con versión…": se ven lado a lado
    la versión 1 y la vigente, sección por sección, con "Cambió" en las filas distintas y "Agregado"/"Quitado"/"Cambió"
    en actividades e ingresos; no hay "Verificar", "Observar" ni "No aplica" (CA-11). A 360 px las dos versiones se
    apilan. Con la API apagada al elegir otra versión: "No pudimos cargar la versión N." con "Reintentar" bajo el
    selector y la cabecera visible. En una ficha de una sola versión el selector no aparece. Si los datos lo permiten
    (R-1), una versión anterior con un código ya retirado lo muestra con su etiqueta (CA-29).
  - Nota: Sin prueba (interfaz; la lógica de diff está probada en T5). `VersionCompare` ('use client', sin botones de revisión) con las dos columnas, marcas de texto "Cambió"/"Agregado"/"Quitado", "Sin cambios" por sección y "Volver a la revisión"; el error de la versión está bajo el selector con "Reintentar" (en `TaxProfileReview`, que lo conecta). Comprobación manual: PENDIENTE (la hace el usuario).

## Bloque F · Caso del empresario y documentos

- [x] T17 · Diálogo "Revisar documento" (CA-14, CA-15, CA-16, CA-17, CA-18; RN-5, RN-6, RN-7, P-11; D-6)
  - Archivos: src/components/compliance/case/DocumentReviewDialog.tsx
  - Test primero: no aplica (interfaz; la lógica está en T8). T22 comprueba la guarda `useRef` y `dismissible`.
  - Cambios: sección 7.5 del plan; `useForm({ resolver: zodResolver(createDocumentReviewSchema(doc.documentType)),
    defaultValues: documentReviewDefaults(doc) })`; `useWatch` de `result` y `hasValidity` (el vencimiento solo se monta
    con la casilla marcada); `submittingRef` en la primera línea del `onSubmit`; `Dialog dismissible={!busy}`; error de
    envío con `documentReviewErrorOutcome(err).message` en `role="alert"` sin `reset`; al guardar, `onSaved()` y cierre.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/case/DocumentReviewDialog.tsx
  - Comprobar (desde la pestaña Documentos, después de T19):
    1. RUT vigente, "Aceptar" sin titular y "Guardar revisión": "Escribe el NIT o la cédula del titular." y ningún
       `POST`; en un documento "Otro documento", "Aceptar" sin titular sí envía (CA-14). "Observar" o "Rechazar" sin
       notas: "Escribe la observación o el motivo del rechazo." y ningún `POST` (CA-15).
    2. Marca "El documento tiene vigencia comprobable", pon un vencimiento anterior a la expedición: "El vencimiento no
       puede ser anterior a la expedición.". Escribe un vencimiento válido, desmarca la casilla y guarda: el cuerpo del
       `POST` no trae `expiresAt` (CA-16).
    3. RUT con un titular que no es el NIT del empresario y "Aceptar": el diálogo sigue abierto con lo escrito y muestra
       tal cual "El titular del documento no corresponde al empresario. Márquelo como OBSERVED o REJECTED."; en
       Network se vuelve a pedir `…/documents`. Cambia a "Observar", escribe una nota y guarda: se registra (CA-17).
    4. Al guardar: el diálogo se cierra, aparece "Revisión guardada" y el documento muestra el nuevo estado, titular,
       fechas y notas sin recargar. Mientras guarda (red lenta en DevTools), Escape, el fondo y la X no cierran y un
       doble clic hace un solo `POST`. Tab no sale del diálogo (CA-18). Al reabrir un documento ya revisado, el titular
       y las fechas aparecen precargados (D-6).
  - Nota: Sin prueba (interfaz; la lógica está en T8). `DocumentReviewDialog` usa `useReviewCaseDocument` por dentro (props `commercialPublicId`, `document`, `onSaved()`, `onClose`); `useForm` con `zodResolver(createDocumentReviewSchema(tipo))` y `documentReviewDefaults`, `useWatch` de `result`, `hasValidity` y `issuedAt`, el vencimiento solo se monta con la casilla marcada, `submittingRef` en la primera línea del `onSubmit`, `dismissible={!busy}`, error de envío con `documentReviewErrorOutcome(...).message` en `role="alert"` sin `reset`. Comprobaciones 1 a 4: PENDIENTES (las hace el usuario, después de T19).

- [x] T18 · Caso: cabecera, pestañas accesibles, pestaña Ficha y su página (CA-19, CA-20, CA-23, CA-24; P-2, P-6)
  - Archivos: CommercialCase.tsx, CaseTabs.tsx, CaseTaxProfileTab.tsx y TabState.tsx en src/components/compliance/case/;
    src/app/compliance/commercials/[commercialPublicId]/page.tsx
  - Test primero: no aplica (interfaz; la lógica está en T4, T6 y T9). T22 comprueba la página de servidor.
  - Cambios: página de servidor (`metadata` "Caso del empresario", `await params`, `await searchParams`,
    `parseCaseTab`). `CommercialCase` con estado local de la pestaña iniciado en `initialTab` y `router.replace(
    casePath(id, tab), { scroll: false })` en `startTransition` (D-12); no UUID → "No encontramos este empresario." sin
    montar pestañas. `CaseTabs` con roles, `aria-*`, tabindex itinerante y `nextTabIndex`. Monta solo el panel activo;
    las pestañas de T19 y T20 se conectan en esas tareas (mientras tanto, su panel queda vacío). `CaseTaxProfileTab`
    con `summarizeSectionReviews` y "Abrir revisión de la ficha". `TabState` sin `'use client'`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/case "src/app/compliance/commercials/[commercialPublicId]/page.tsx"
  - Comprobar:
    1. Abre `/compliance/commercials/{uuid}`: empresa, NIT y las seis pestañas. Cambia a "Compromiso": la URL dice
       `?tab=commitment`; recarga: abre "Compromiso". `?tab=otra`: abre "Ficha tributaria". Con el foco en una pestaña,
       las flechas, Inicio y Fin cambian de pestaña y mueven el foco; el lector anuncia "pestaña, seleccionada" (CA-19).
       `/compliance/commercials/abc`: "No encontramos este empresario." y ningún `GET` en Network.
    2. Pestaña Ficha: estado, versión, fecha y "N verificadas · N observadas · N no aplica · N pendientes" (suman 8) y
       "Abrir revisión de la ficha", que lleva a la revisión. Con el empresario sin ficha: "El empresario todavía no ha
       enviado la ficha tributaria." y la cabecera dice "Empresario" sin NIT (CA-20; que las demás pestañas carguen se
       comprueba en T20.3).
    3. Desde la revisión de una ficha, "Ver caso del empresario" abre este caso en "Ficha tributaria" (CA-24).
  - Nota: Sin prueba (interfaz). Página de servidor con `await params` y `await searchParams` + `parseCaseTab`; `CommercialCase` (estado local de la pestaña, `router.replace(casePath(…), { scroll: false })` en `startTransition`; no UUID → "No encontramos este empresario." sin pestañas; cabecera con empresa y NIT desde `useComplianceTaxProfile`, "Empresario" sin NIT si no hay ficha), `CaseTabs` (roles, `aria-*`, tabindex itinerante, `nextTabIndex`), `CaseTaxProfileTab` y `TabState` (sin `'use client'`; con 403/404/400 sin reintento). Desviación menor: se añadieron a `complianceTaxReview.ts` textos (`tabLoading`, `updatedOn`, `uploadedOn`, `expiresOn`, `supersededOn`, `view`, `history`, `dash`). Comprobaciones 1 a 3: PENDIENTES (las hace el usuario).

- [x] T19 · Pestaña Documentos (CA-6, CA-13, CA-18)
  - Archivos: src/components/compliance/case/CaseDocumentsTab.tsx, src/components/compliance/case/CaseDocumentGroup.tsx,
    src/components/compliance/case/CommercialCase.tsx (la conecta)
  - Test primero: no aplica (interfaz; la agrupación es `groupExpediente`, ya probada en la 016). T22 comprueba que
    "Revisar" solo aparece en los vigentes.
  - Cambios: sección 7.5 del plan; `useCaseDocuments`, `groupExpediente`, `shouldShowLoadError`, `useOpenCaseDocument`;
    `DocumentReviewDialog` con `next/dynamic`; estados con `TabState` y `tabErrorView`. `CaseDocumentGroup` sin
    `'use client'`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/case
  - Comprobar:
    1. En el caso, pestaña Documentos: grupos por tipo en el orden del diccionario, vigente arriba con insignia de
       revisión ("Sin revisar" si no tiene), "Vencido" si aplica, titular, "Expedido el …", "Vence el …", notas y los
       botones "Ver" y "Revisar"; "Historial" plegado con el reemplazado y solo "Ver" (CA-13). "Ver" abre el documento
       como en la 016 (CA-6).
    2. Un empresario sin documentos: "El empresario no tiene documentos en su expediente.".
    3. Se hacen aquí las comprobaciones de T17.
  - Nota: Sin prueba (interfaz; la agrupación es `groupExpediente`). `CaseDocumentsTab` (`useCaseDocuments`, `groupExpediente`, `useOpenCaseDocument`, `DocumentReviewDialog` con `next/dynamic`, `toast.success` al guardar) y `CaseDocumentGroup` (sin `'use client'`: el plegado del historial lo controla la pestaña con `historyOpen`/`onToggleHistory`; "Revisar" solo en `group.current`; el historial solo "Ver" y muestra la información de revisión). Sin `shouldShowLoadError`: `documents === undefined` equivale (con datos cargados un refetch fallido no tapa la lista). Conectada en `CommercialCase`. Comprobaciones 1 a 3: PENDIENTES (las hace el usuario).

- [x] T20 · Pestañas de solo lectura: Compromiso, Requerimientos, Hallazgos e Incidencias (CA-21, CA-22, CA-23; RN-10, RN-11)
  - Archivos: CaseCommitmentTab.tsx, CaseRequestsTab.tsx, CaseFindingsTab.tsx y CaseIncidentsTab.tsx en
    src/components/compliance/case/; src/components/compliance/case/CommercialCase.tsx (las conecta)
  - Test primero: no aplica (interfaz; la lógica está en T1, T6 y T9). T22 comprueba que no tienen acciones.
  - Cambios: sección 7.5 del plan; `sortManifestationsDesc`, `MANIFESTATION_LABELS`, `REQUEST_STATUS_LABELS_COMPLIANCE`,
    `TRIGGER_LABELS`, `FINDING_CLASSIFICATION_LABELS`, `FINDING_SEVERITY_LABELS`, `CONTRACTUAL_MEASURE_LABELS`,
    `ACCOUNT_STATUS_LABELS`; requerimientos con `Pager` y página en estado local (D-15). Sin botones de crear, sin
    deshabilitados, sin "próximamente" (RN-10).
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/compliance/case
  - Comprobar:
    1. Compromiso: de la más reciente a la más antigua, con el estado del diccionario, "Contrato vN", fecha, el
       representante legal o "Sistema" y el detalle (CA-21).
    2. Requerimientos: tipo, estado, "Sistema"/"Compliance", emisión y vencimiento, de la más reciente a la más antigua;
       "Siguiente" pide la página 2 (`page=1` en Network). Hallazgos: fecha, hecho, clasificación, gravedad,
       "Subsanable: Sí/No", medida y, en el que cambió la cuenta, "Estado de la cuenta aplicado: …". Incidencias: fecha,
       contexto, descripción y quién la reportó. Ninguna de las tres tiene botones de crear (CA-22).
    3. Con DevTools bloqueando solo `…/findings` (Network → Block request URL): la pestaña Hallazgos muestra "No pudimos
       cargar los hallazgos." con "Reintentar" y las demás pestañas cargan normal. Con el empresario sin ficha, las
       cinco pestañas que no son Ficha cargan (CA-20, CA-23).
  - Nota: Sin prueba (interfaz). `CaseCommitmentTab`, `CaseRequestsTab` (`Pager`, página base 0 en estado local; sin columna de spine porque las filas no llevan tono), `CaseFindingsTab` y `CaseIncidentsTab`, conectadas en `CommercialCase`. Sin `useMutation`, sin botones de crear ni `disabled` fuera del `Pager`. Comprobaciones 1 a 3: PENDIENTES (las hace el usuario).

## Bloque G · Acceso, barridos y cierre

- [x] T21 · Clasificación y protección de las tres rutas (CA-25; P-4, P-5)
  - Archivos: ninguno (solo verificación). Si `routeProtection.test.ts` falla, **no** se toca `routeAccess.ts` ni el
    middleware: se anota y se consulta al usuario.
  - Test primero: ya existe: `__tests__/middleware/routeProtection.test.ts` recorre `src/app` y prueba cada página con
    las seis identidades. Las tres páginas nuevas deben quedar clasificadas por el prefijo `/compliance` sin tocar la
    tabla.
  - Verificar: npx vitest run __tests__/middleware && git diff --exit-code -- src/middleware.ts && git diff -- __tests__/middleware/routeAccess.ts
    (la salida del último comando debe ser idéntica a la guardada antes de T1: solo el cambio ajeno
    `/explore/recognitions`)
  - Comprobar: con `MIDDLEWARE=ACTIVE`, sin sesión, abrir `/compliance/tax-profiles`,
    `/compliance/tax-profiles/{uuid}` y `/compliance/commercials/{uuid}?tab=documents` lleva a `/login?from=…` (solo la
    ruta, sin la query); con un admin y con un empresario, a `/unauthorized`; con el oficial, las tres cargan (CA-25).
  - Nota: `npx vitest run __tests__/middleware __tests__/ui`: 5 archivos, 657 pruebas en verde (las tres páginas quedan clasificadas por el prefijo `/compliance` sin tocar la tabla). `git diff --exit-code -- src/middleware.ts` limpio; `git diff -- __tests__/middleware/routeAccess.ts` idéntico (cmp) al guardado antes de T1: solo el cambio ajeno `/explore/recognitions`. Comprobación manual con `MIDDLEWARE=ACTIVE`: PENDIENTE (la hace el usuario).

- [x] T22 · PII y barridos estáticos (CA-1, CA-6, CA-10, CA-11, CA-13, CA-18, CA-22, CA-26; P-2, P-6, P-16)
  - Archivos: __tests__/taxProfile/noPiiLeaks.test.ts, __tests__/complianceTaxReview/staticScan.ts,
    __tests__/complianceTaxReview/complianceStatic.test.ts
  - Test primero: __tests__/complianceTaxReview/complianceStatic.test.ts, con `stripComments`, `mentions` y
    `guardsDoubleSubmit` en `staticScan.ts` (copiados de `__tests__/expediente/expedienteStatic.test.ts`; no se importa
    desde un archivo de prueba). Primero, casos con fragmentos que los ayudantes marcan y no marcan. Después, sobre los
    archivos reales:
    1. `downloadUrl` no aparece en `src/components/compliance`, `src/hooks/compliance`, `src/lib/compliance` ni en las
       páginas nuevas (CA-6, CA-26).
    2. `useOpenCaseDocument.ts` usa `documentsFromRefetch(` y `'noopener,noreferrer'` y no contiene `.refetch()).data`
       (CA-6, review de la 016, B1).
    3. `useComplianceCase.ts` no llama `setQueryData` con `complianceCaseKeys.documents` (R-2).
    4. `SectionReviewDialog.tsx` y `DocumentReviewDialog.tsx` cumplen `guardsDoubleSubmit` y pasan `dismissible={!` al
       `Dialog` (CA-10, CA-18).
    5. `CaseRequestsTab.tsx`, `CaseFindingsTab.tsx` y `CaseIncidentsTab.tsx` no contienen `useMutation`, "Nuevo
       requerimiento", "Registrar", "próximamente" (sin distinguir mayúsculas) ni `disabled` fuera del `Pager` (RN-10,
       CA-22); `VersionCompare.tsx` no contiene "Verificar", "Observar" ni "No aplica" (RN-2, CA-11).
    6. `CaseDocumentGroup.tsx` menciona "Revisar" (o `onReview`) solo dentro del recorrido de `group.current`, no en el
       del historial (CA-13).
    7. Las tres `page.tsx` nuevas no empiezan por `'use client'` y contienen `await params` (y `await searchParams` la
       cola y el caso) (P-2, P-6).
    8. `ComplianceLayout.tsx` tiene en `NAV` "Fichas tributarias" con `/compliance/tax-profiles` (CA-1).

    La prueba falla primero por la importación de `staticScan.ts`, que aún no existe. Como los archivos reales ya
    cumplen cuando se escribe, cada caso real se ve fallar reintroduciendo a mano su defecto (quitar la guarda de un
    diálogo, cambiar el adaptador a `(await query.refetch()).data`, añadir "Revisar" al historial, poner `'use client'`
    en una página), anotando el fallo y restaurando el archivo (comprobado con `git diff`).
  - Cambios: en `noPiiLeaks.test.ts`, bloque "Revisión de fichas y caso del empresario (spec 017)" en `TARGETS` con
    `src/components/compliance/tax-profiles`, `src/components/compliance/case`,
    `src/components/compliance/ComplianceLayout.tsx`, `src/lib/compliance`, `src/lib/a11y`,
    `src/lib/labels/complianceTaxReview.ts`, `src/services/compliance`, `src/hooks/compliance`,
    `src/app/compliance/tax-profiles` y `src/app/compliance/commercials`.
  - Verificar: npx vitest run __tests__/taxProfile/noPiiLeaks.test.ts __tests__/complianceTaxReview/complianceStatic.test.ts && npx eslint --max-warnings=0 __tests__/taxProfile/noPiiLeaks.test.ts __tests__/complianceTaxReview
  - Comprobar (CA-26): recorre cola → revisión (revisa una sección, compara versiones, "Ver RUT") → caso (las seis
    pestañas, revisa un documento con titular): en Console no aparece nada con el NIT, el titular, el nombre del
    representante ni una URL de R2; Application → Local y Session Storage sin claves nuevas con esos datos; la barra de
    direcciones solo muestra `?status=`, `?page=`, el UUID y `?tab=`.
  - Nota: Falló primero por la importación de `staticScan.ts` (no existía). 24 pruebas nuevas en `complianceStatic.test.ts`; `noPiiLeaks.test.ts` gana las 10 rutas del bloque de la 017 (14 pruebas en verde). Rojo comprobado por mutación temporal (cada archivo restaurado y comparado con `cmp`): `documentsFromRefetch` cambiado por `(await query.refetch()).data`; `'noopener,noreferrer'` por `'noopener'`; `downloadUrl` leído en `useOpenCaseDocument.ts`; `setQueryData` en `useComplianceCase.ts`; guarda `useRef` quitada de `DocumentReviewDialog`; `dismissible={!busy}` cambiado en `SectionReviewDialog`; `disabled` y "próximamente" en las pestañas; "Verificar" en `VersionCompare`; `onReview` en el historial de `CaseDocumentGroup` y quitado de los vigentes; `'use client'` en la cola; `await params`/`await searchParams` quitados; título del `NAV` cambiado; `console.log` y `URLSearchParams` en archivos nuevos (`noPiiLeaks`). Desviación: el barrido de `downloadUrl` no cubre todo `src/components/compliance` sino las carpetas nuevas (`tax-profiles`, `case`) más hooks, lib y páginas de la 017, porque `contracts/` y `planChanges/` ya leen su propia `downloadUrl` (deuda ajena). La excepción de `disabled` fuera del `Pager`: las tres pestañas no lo contienen en absoluto (el `Pager` es otro componente). Comprobación manual de CA-26 (DevTools): PENDIENTE (la hace el usuario).

- [x] T23 · Puertas finales (CA-27)
  - Archivos: `.lint-max-warnings` solo si el conteo baja (P-19).
  - Test primero: no aplica.
  - Verificar: npm test && npm run lint:ci && npm run build && npx tsc --noEmit && npm run audit:ci
    (en Windows, `lint:ci` y `audit:ci` salen con 3: anotar la salida y correr los equivalentes `npx next lint` —0
    errores, ≤ 348 avisos— y `npm audit --omit=dev --json`; ver "Reglas"). Además:
    `git diff --exit-code -- package.json package-lock.json next.config.ts src/middleware.ts` y
    `npx vitest run __tests__/middleware __tests__/ui`.
  - Comprobar: `npm test` con más archivos y pruebas que la línea base y todo en verde; el First Load JS de
    `/compliance/tax-profiles`, `/compliance/tax-profiles/[commercialPublicId]` y
    `/compliance/commercials/[commercialPublicId]` anotado en la nota (R-10); `npm run build:e2e && npm run test:e2e`
    sin fallos nuevos respecto de la ronda 3 de la 016 (los ajenos conocidos: `/key-promotions/active`,
    `/purchases/quote`, `forms.spec.ts:105` y capturas `win32`); después de `build:e2e`, `npm run build` otra vez antes
    de `npx tsc --noEmit` (CA-27).
  - Nota (2026-11-02, con las `NEXT_PUBLIC_*` ficticias): `npm test`: 53 archivos, 1303 pruebas en verde (línea base: 42 y 1151). `npm run lint:ci`: salida 3 ("`next lint` no produjo reporte", Windows); equivalente `npx next lint --format json`: 0 errores, 348 avisos = tope; `.lint-max-warnings` sigue en 348. `npm run build`: verde. `npx tsc --noEmit` tras el build: verde. `npm run audit:ci`: salida 3 (`spawnSync npm ENOENT`, Windows); equivalente `npm audit --omit=dev --json`: altos = `xlsx` (2) y `postcss` (2) con excepción vigente, más `follow-redirects` (GHSA-mrwp-f3q8-3g9p, ajeno); los dos avisos moderados de `postcss` no bloquean. `git diff --stat -- package.json package-lock.json src/middleware.ts next.config.ts`: vacío. `npx vitest run __tests__/middleware __tests__/ui`: 657 en verde. First Load JS (R-10): `/compliance/tax-profiles` 204 kB (4.41 kB de página), `/compliance/tax-profiles/[commercialPublicId]` 240 kB (4.36 kB), `/compliance/commercials/[commercialPublicId]` 241 kB (4.88 kB); compartido 103 kB. NO se corrió `npm run build:e2e` ni `npm run test:e2e`: PENDIENTE (si se corre, repetir `npm run build` antes de `npx tsc --noEmit`).
  - Comprobaciones manuales PENDIENTES de T10 a T22 (las hace el usuario; entorno y usuarios en "Comprobaciones manuales"):
    - T10 (R-4): "Agregar sede" y "Agregar documento": Tab y Mayús+Tab ciclan entre X y último control; Escape, fondo y X cierran; el foco vuelve al botón; durante una subida no cierra.
    - T12: "Fichas tributarias" en riel de escritorio, riel contraído (con `title`) y cajón móvil a 360 px; tablas de kyc, contracts y audit-logs sin cambios.
    - T13.1 a T13.4: cola con `SUBMITTED` por defecto y su `GET`; filtros y página en la URL, "Todas" sin `status`, recarga y atrás; vacíos y error con "Reintentar"; clic y Enter en la fila; 360 px sin scroll horizontal; sin NIT.
    - T14.1 a T14.3 (tras T15): observar sin nota no envía; cuerpos de `POST` de cada resultado; cabecera "Con observaciones"/"Revisada" y cola actualizada; doble clic = un `POST`, sin cierre mientras guarda; error 400 o API apagada con la nota conservada.
    - T15.1 a T15.7: cabecera, vocación y ocho secciones (360 px en una columna); "Ver RUT" (sin petición antes de 4 min, con petición después) y "Documento ya no vigente"; ingresos con "$ 1.234.567" y sedes con la cerrada; `/compliance/tax-profiles/abc` y empresario sin ficha; enlace a "Ver caso del empresario"; cambio de versión durante la revisión con su aviso; códigos "código — etiqueta" y catálogo bloqueado sin error.
    - T16: comparar con "Versión 1": columnas, "Cambió/Agregado/Quitado", sin botones de revisión, apilado a 360 px, error de versión con "Reintentar", sin selector en ficha de una versión, código retirado con etiqueta si hay datos.
    - T17.1 a T17.4 (tras T19): titular obligatorio en RUT y no en "Otro documento"; notas obligatorias al observar o rechazar; vigencia y vencimiento (el cuerpo sin `expiresAt` al desmarcar); 400 de titular con el diálogo abierto y relectura de `…/documents`; cierre, toast y estado nuevo sin recargar, sin cierre mientras guarda, Tab atrapado, valores precargados al reabrir.
    - T18.1 a T18.3: seis pestañas, `?tab=` y recarga, `?tab=otra`, teclado de pestañas, `/compliance/commercials/abc` sin `GET`; pestaña Ficha con el resumen que suma 8 y empresario sin ficha; "Ver caso del empresario" abre "Ficha tributaria".
    - T19.1 a T19.3: grupos por tipo, vigente con "Ver" y "Revisar", historial plegado solo con "Ver"; empresario sin documentos.
    - T20.1 a T20.3: compromiso (orden, "Contrato vN", representante o "Sistema"), requerimientos con paginación (`page=1`), hallazgos con "Estado de la cuenta aplicado", incidencias, sin botones de crear; `…/findings` bloqueado solo rompe esa pestaña; empresario sin ficha con las otras cinco cargando.
    - T21: con `MIDDLEWARE=ACTIVE`, sin sesión las tres rutas llevan a `/login?from=…` sin query; admin y empresario a `/unauthorized`; el oficial las abre.
    - T22 (CA-26): recorrido completo con DevTools: Console sin NIT, titular, representante ni URL de R2; Storage sin claves nuevas; la barra solo con `?status=`, `?page=`, UUID y `?tab=`.
    - T23: `npm run build:e2e` y `npm run test:e2e` (sin fallos nuevos frente a la ronda 3 de la 016; ajenos conocidos: `/key-promotions/active`, `/purchases/quote`, `forms.spec.ts:105`, capturas `win32`), y después `npm run build` antes de `npx tsc --noEmit`; en Linux/CI, `lint:ci` y `audit:ci` reales.

## Trazabilidad CA → tareas

| CA | Tareas | Verificación |
|---|---|---|
| CA-1 | T1, T4, T12, T13, T22 | `routes.test.ts`, `complianceStatic.test.ts`; manual T12 y T13.1 |
| CA-2 | T2, T4, T13 | `routes.test.ts`, `complianceServices.test.ts`; manual T13.2 |
| CA-3 | T1, T13 | `complianceTexts.test.ts`; manual T13.3 |
| CA-4 | T4, T12, T13 | `routes.test.ts`; manual T13.4 |
| CA-5 | T1, T5, T6, T15 | `taxProfileFields.test.ts`, `taxProfileReview.test.ts`, `complianceTexts.test.ts`; manual T15.1 |
| CA-6 | T6, T11, T15, T19, T22 | `taxProfileReview.test.ts`, `complianceStatic.test.ts`; manual T15.2 y T19.1 |
| CA-7 | T5, T6, T15 | `taxProfileFields.test.ts`, `taxProfileReview.test.ts`; manual T15.3 |
| CA-8 | T1, T7, T14 | `sectionReview.test.ts`, `complianceTexts.test.ts`; manual T14.1 |
| CA-9 | T2, T3, T7, T11, T14 | `sectionReview.test.ts`, `complianceKeys.test.ts`, `complianceServices.test.ts`; manual T14.2 |
| CA-10 | T7, T14, T22 | `sectionReview.test.ts`, `complianceStatic.test.ts`; manual T14.3 |
| CA-11 | T5, T16, T22 | `taxProfileFields.test.ts`, `complianceStatic.test.ts`; manual T16 |
| CA-12 | T1, T9, T11, T15 | `loadErrors.test.ts`, `complianceTexts.test.ts`, `requests.test.ts` (`isUuid`, 016); manual T15.4 |
| CA-13 | T19, T22 | `complianceStatic.test.ts`, `expediente.test.ts` (`groupExpediente`, 016); manual T19.1 |
| CA-14 | T1, T8, T17 | `documentReview.test.ts`, `complianceTexts.test.ts`; manual T17.1 |
| CA-15 | T1, T8, T17 | `documentReview.test.ts`, `complianceTexts.test.ts`; manual T17.1 |
| CA-16 | T1, T8, T17 | `documentReview.test.ts`, `complianceTexts.test.ts`; manual T17.2 |
| CA-17 | T2, T3, T8, T11, T17 | `documentReview.test.ts`, `complianceKeys.test.ts`, `complianceServices.test.ts`; manual T17.3 |
| CA-18 | T3, T10, T11, T17, T19, T22 | `complianceKeys.test.ts`, `focusTrap.test.ts`, `complianceStatic.test.ts`; manual T10 y T17.4 |
| CA-19 | T4, T18 | `routes.test.ts`; manual T18.1 |
| CA-20 | T1, T6, T9, T18, T20 | `taxProfileReview.test.ts`, `loadErrors.test.ts`, `complianceTexts.test.ts`; manual T18.2 y T20.3 |
| CA-21 | T1, T6, T20 | `taxProfileReview.test.ts`, `complianceTexts.test.ts`; manual T20.1 |
| CA-22 | T1, T2, T20, T22 | `complianceTexts.test.ts`, `complianceServices.test.ts`, `complianceStatic.test.ts`; manual T20.2 |
| CA-23 | T9, T18, T20 | `loadErrors.test.ts`; manual T20.3 |
| CA-24 | T4, T15, T18 | `routes.test.ts`; manual T15.5 y T18.3 |
| CA-25 | T21 | `__tests__/middleware` (`routeProtection.test.ts`); manual T21 con `MIDDLEWARE=ACTIVE` |
| CA-26 | T22 | `noPiiLeaks.test.ts`, `complianceStatic.test.ts`; manual T22 (DevTools) |
| CA-28 | T1, T3, T6, T11, T14, T15 | `complianceTexts.test.ts`, `taxProfileReview.test.ts`, `complianceKeys.test.ts`; manual T15.6 |
| CA-29 | T2, T3, T5, T11, T15, T16 | `complianceServices.test.ts`, `complianceKeys.test.ts`, `taxProfileFields.test.ts`; manual T15.7 y T16 |
| CA-27 | T23 | las cinco puertas, `__tests__/middleware` y `__tests__/ui`, `git diff` vacío de `package*.json`, `next.config.ts` y `src/middleware.ts`; e2e sin fallos nuevos |

## Correcciones de la ronda 1

- [x] B1 · `useComplianceTaxCatalog(enabled = true)` y `TaxProfileReview` le pasa `isUuid(commercialPublicId)` (CA-12)
  - Nota: prueba en `complianceStatic.test.ts` ("ronda 1 > B1"), vista en rojo antes del arreglo. No espera a la ficha: el catálogo no bloquea y pedirlo en paralelo es más rápido.
- [x] S1 · `VersionCompare.tsx`: cada valor lleva "Versión N:" / "Vigente:" visible en móvil (`md:sr-only` en escritorio, donde los títulos de columna lo dicen)
- [x] S2 · `TaxProfileReview.tsx`: los botones de revisión ya no se deshabilitan al abrir el diálogo (`SectionReviewPanel.disabled` pasa a opcional); el foco vuelve a quien abrió
- [x] S3 · `TaxProfileQueue.tsx`: el paginador se ve en el vacío con `page > 1`; el error solo tapa la tabla si no hay datos (`query.data === undefined`)
- [x] S4 · `focusTrap.ts`: selector sin `input[type=hidden]` ni `a[href][tabindex=-1]`, y `isTabbable` (con caja y fuera de `[hidden]`) usado por `Dialog`; prueba en `focusTrap.test.ts`
- [x] S5 · `CaseDocumentGroup.tsx`: `aria-label` "Ver {tipo}" / "Revisar {tipo}"
- [x] S6 · `CaseFindingsTab.tsx`: "Clasificación:", "Gravedad:" y "Medida:"
- [x] S7 · opción vacía del selector: "Elige una versión"
- [x] S8 · restaurado el prefijo `- [x] T16`
  - Nota: la sugerencia 6 (mover las etiquetas de `taxProfileFields.ts` al diccionario) queda aceptada como está y no se aplica, por indicación del coordinator.

## Correcciones de la ronda 2

- [x] B2 · `complianceStatic.test.ts` ("ronda 1 > B1"): la aserción ahora mira dentro de `useQuery({` y exige `enabled` como propiedad (`/^\s*enabled\s*[,:]/m`), no el parámetro de la firma (CA-12)
  - Nota: rojo comprobado borrando `enabled,` del `useQuery` de `useComplianceTaxCatalog` en `useComplianceTaxProfiles.ts` (1 failed | 31 passed); archivo restaurado y verificado con `cmp`.
- [x] S9 · `complianceStatic.test.ts` ("ronda 1 > S9"): `Dialog.tsx` debe conservar `.filter(isTabbable)`
  - Nota: rojo comprobado quitando `.filter(isTabbable)` de `Dialog.tsx` (1 failed | 31 passed); restaurado y verificado con `cmp`.
- [x] S10 · `previousQueuePage(page, totalPages)` en `src/lib/compliance/routes.ts`; `TaxProfileQueue.tsx` la usa en "Anterior" del vacío: con `?page=` mayor que el total va a la última página con datos (la 1 si no hay)
  - Nota: prueba en `routes.test.ts` ("previousQueuePage (S10)"), vista en rojo antes (`previousQueuePage is not a function`, 3 fallos).
