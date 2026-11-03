# 017 · Revisión

## Ronda 1: CAMBIOS

Pruebas ✅ · lint:ci ✅ (equivalente) · build ✅ · tsc ✅ · audit:ci ❌ (ya existía: `follow-redirects`, ajeno) · navegador ❌ (solo fallos ajenos ya conocidos)

Revisado el 2026-11-02 sobre `dev` (`a911175`) más el árbol sin commitear de la 014, la 015, la 016 y la 017. El
revisor corrió las puertas con las `NEXT_PUBLIC_*` ficticias de `CLAUDE.md`. Contrato comparado con la API en
`../VerYGanaAPI` (`a0f4183`, solo lectura).

| Puerta | Resultado | Detalle |
|---|---|---|
| `npm test` | ✅ | 53 archivos y 1303 pruebas en verde (línea base: 42 y 1151), incluidos `__tests__/middleware` (las tres páginas nuevas quedan clasificadas por el prefijo `/compliance`) y `noPiiLeaks.test.ts`. |
| `lint:ci` | ✅ equivalente | En Windows el script sale con 3 ("`next lint` no produjo reporte", ya conocido). `npx next lint --format json`: 0 errores y **348 avisos** = tope. `.lint-max-warnings` = 348 en el árbol y en `origin/main`: no sube (P-19). `npx eslint --max-warnings=0` sobre todo `src/components/compliance`, `src/hooks/compliance`, `src/lib/compliance`, `src/lib/a11y`, `src/services/compliance`, las páginas nuevas, `src/lib/labels`, `shared/Dialog.tsx` y las pruebas nuevas: limpio. |
| `npm run build` | ✅ | First Load JS: `/compliance/tax-profiles` 204 kB (4.41 kB), `/compliance/tax-profiles/[commercialPublicId]` 240 kB (4.36 kB), `/compliance/commercials/[commercialPublicId]` 241 kB (4.88 kB). Las tres son ƒ (dinámicas). |
| `npx tsc --noEmit` | ✅ | Tras el `build`, y de nuevo tras el segundo `build` posterior a `build:e2e`. |
| `audit:ci` | ❌ ya existía | En Windows el script sale con 3 (`spawnSync npm ENOENT`). Equivalente: `npm audit --omit=dev --json` + `evaluateAudit` con `security/audit-exceptions.json` y la fecha de hoy: código 1 **solo** por `follow-redirects` (GHSA-mrwp-f3q8-3g9p, alto), en la misma versión 1.16.1 que el `package-lock.json` de `origin/main`: es ajeno a la 017. Las 4 altas con excepción (2 `postcss`, 2 `xlsx`) siguen vigentes hasta el 2026-11-30. `package.json`, `package-lock.json`, `security/`, `next.config.ts` y `src/middleware.ts` sin cambios. |
| `build:e2e` + `test:e2e` | ❌ ajenos | 243 pasan, 102 omitidas, 34 fallan, todos ya conocidos: 58 `GET /key-promotions/active` y 1 `POST /purchases/quote` sin fixture (`layout`, `touch`, `smoke` sobre `/products`, `/products/[id]`, `/commercial/[id]` y `/explore/favorites`), `forms.spec.ts:105` y las 10 capturas `win32` de `desktop.spec.ts` (solo local). Ningún pedido sin fixture de compliance (no está en el alcance de `e2e/`). `ads.spec.ts:66` pasó esta vez. Borré las 10 `*-win32.png` que escribió la corrida (no estaban versionadas). |

### P-17 (muestra de pruebas nuevas)

Reintroduje 11 defectos uno por uno, corrí la prueba que lo cubre y restauré el archivo (verificado con `cmp`);
las 11 se ponen en rojo:

| Defecto reintroducido | Prueba que falla |
|---|---|
| `requiresHolder` sin `CEDULA_REPRESENTANTE` | `documentReview.test.ts` (2) |
| `expiresAt` viaja sin la casilla (CA-16) | `documentReview.test.ts` (1) |
| 400 de documento sin relectura (D-7) | `documentReview.test.ts` (1) |
| `versionChangedDuringReview` con `<` en vez de `!==` (CA-28) | `taxProfileReview.test.ts` (1) |
| "Todas" manda `status` (CA-2) | `routes.test.ts` (1) |
| Nota vacía viaja en el cuerpo (CA-9) | `sectionReview.test.ts` (1) |
| Un 400 deja de ser "No encontramos este empresario." (D-4) | `loadErrors.test.ts` (1) |
| Mayús+Tab en el primero no vuelve al último | `focusTrap.test.ts` (2) |
| Régimen pintado con la lista `VAT_CONDITION` (CA-29) | `taxProfileFields.test.ts` (2) |
| `versionChanged` invalida el detalle en vez del expediente | `complianceKeys.test.ts` (1) |
| RUT reemplazado conserva "Ver RUT" (D-5) | `taxProfileReview.test.ts` (1) |

Los hooks (`useReviewTaxProfileSection`, `useReviewCaseDocument`, `useOpenCaseDocument`) no tienen prueba propia
(lo admite el plan): su cableado lo fijan los barridos de `complianceStatic.test.ts` y las comprobaciones manuales.

### Contrato con la API

Comparado campo a campo: `ComplianceTaxProfileController` (`list` con `status` opcional y
`@PageableDefault(20, updatedAt DESC)`, `get`, `version`, `reviewSection`, `GET /tax-catalog`),
`ComplianceExpedienteController`, `DeclarationController` (`/compliance/commercials/{id}/declarations/{code}`) y
`ComplianceInformationRequestController` (`search` con `commercialPublicId`, `findings`, `incidents`). Los
servicios usan esas rutas y métodos exactos y mandan la query en `params`. `TaxProfileSummary`,
`ComplianceTaxProfileResponse`, `TaxProfileVersionDetail`, `SectionReview`, `Establishment`, `CatalogEntry`,
`SectionReviewRequest` (`notes` ≤ 1000), `ExpedienteDocument`, `DocumentReviewRequest` (`holderIdentification` ≤ 30,
`notes` ≤ 1000, fechas `LocalDate`), `Manifestation`, `InformationRequest` (`RequestView`), `Finding` (`FindingView`),
`Incident` (`IncidentView`) y los enums `FindingSeverity` y `AccountStatus` coinciden en nombres y nulabilidad. Todo
`@PreAuthorize("hasRole('COMPLIANCE_OFFICER')")`. Sin diferencias.

### Puntos sensibles que pidió el coordinator

- **`Dialog` con foco atrapado (D-10).** El cambio solo agrega la rama `Tab` dentro del `keydown` del diálogo de
  arriba. Escape (con `stopPropagation`), la pila `openDialogs`, `dismissible` (fondo, X deshabilitada, Escape) y el
  retorno del foco al que abrió quedan igual. Los diálogos anidados (`EstablishmentFormDialog` y
  `CloseEstablishmentDialog` dentro del de "Sedes") se montan en un portal propio y no entran en la búsqueda de
  enfocables del de abajo, que además ignora Tab porque no está arriba. En los diez usos actuales no hay enfocables
  ocultos que rompan el ciclo: el `<input type="file">` de `ExpedienteUploadDialog` es visible, y la lista de sedes
  cerradas (`hidden`) no tiene botones. La regresión manual de T10 sigue PENDIENTE.
- **"Ver".** `useOpenCaseDocument` es el mismo adaptador que `ExpedienteScreen.tsx:51-59`: `documentsFromRefetch`,
  `fetchedAt: query.dataUpdatedAt`, `window.open(url, '_blank', 'noopener,noreferrer')` o pestaña vacía con
  `opener = null`. `downloadUrl` no aparece en ninguna carpeta de la 017 (barrido y lectura).
- **Nunca `setQueryData` sobre la lista de documentos.** `useReviewCaseDocument` invalida y espera la relectura;
  `setQueryData` solo se usa sobre `detail(id)` en la revisión de sección (correcto, RN-8).
- **RN-13 / CA-28.** `shownVersion` sale de `data.profile.currentVersion` al abrir el diálogo; el hook invalida
  `versionChanged` y la pantalla muestra el aviso con el texto exacto y pasa a la versión de la respuesta. La
  comparación se descarta si la versión elegida pasa a ser la vigente (desviación reportada; correcta).
- **RN-12 / CA-29.** `groupCatalog(catalogQuery.data ?? [])`, sin esqueleto ni error propios: el catálogo no bloquea.
  Pero se pide también cuando el id no es UUID (bloqueante 1).
- **Desviaciones reportadas, confirmadas:** textos extra en `complianceTaxReview.ts` (en español, con prueba en
  verde); `CaseDocumentGroup` sin `'use client'` con el plegado controlado por la pestaña; `CaseDocumentsTab` sin
  `shouldShowLoadError` (equivale: con datos cargados, `documents !== undefined` y un refetch fallido no tapa la
  lista); barrido de `downloadUrl` limitado a las carpetas nuevas (correcto: `contracts/` y `planChanges/` ya la leen).
- **P-2, P-6, P-9, P-10, P-11, P-16.** Las tres `page.tsx` son de servidor, tipan `params`/`searchParams` como
  `Promise` y los leen con `await`. Sin `any`, `@ts-ignore`, `eslint-disable`, `console.*`, almacenamiento,
  `<img>` ni `<a>` en lo nuevo. Datos del backend con TanStack Query desde `src/hooks/compliance`, cada clave única.
  Los dos formularios con react-hook-form + `zodResolver`, guarda `useRef` en la primera línea del envío y
  `dismissible={!busy}`. NIT, titular, representante y `downloadUrl` solo en pantalla; las URL llevan solo el UUID,
  `?status=`, `?page=` y `?tab=`.
- **Rutas y roles.** Sin cambios en `src/middleware.ts` ni en roles. El diff de `routeAccess.ts` es solo el ajeno
  `/explore/recognitions`.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `routes.test.ts` (sin parámetros → `SUBMITTED`, página 1), `complianceStatic.test.ts` (entrada de `NAV`); un solo `NAV` para el riel y el cajón. Manual T12 y T13.1 pendientes. |
| CA-2 | ✅ | `routes.test.ts` (`queuePath`, ida y vuelta, `queueApiParams` sin `status` con `ALL`; P-17 M5), `complianceServices.test.ts`; página de servidor con `await searchParams` y `router.push(queuePath(…))`. Manual T13.2 pendiente. |
| CA-3 | ✅ | `complianceTexts.test.ts` (vacíos por filtro y error); `TaxProfileQueue.tsx:73-82` con "Reintentar" → `refetch`. Manual T13.3 pendiente. |
| CA-4 | ✅ | `routes.test.ts` (`taxProfileReviewPath`); `LedgerRow` con `onActivate` (clic y Enter, `tabIndex={0}`, anillo de foco). Manual T13.4 pendiente. |
| CA-5 | ✅ | `taxProfileFields.test.ts` (ocho secciones), `taxProfileReview.test.ts` (`latestSectionReview`), `complianceTexts.test.ts` (nota de la vocación); `ReviewHeader.tsx`. Manual T15.1 pendiente. |
| CA-6 | ✅ | `taxProfileReview.test.ts` (`resolveRutDocument`; P-17 M11), `complianceStatic.test.ts` (`documentsFromRefetch`, `noopener,noreferrer`, sin `downloadUrl`). Manual T15.2 y T19.1 pendientes. |
| CA-7 | ✅ | `taxProfileFields.test.ts` (ingresos con `formatCents` y alcance), `taxProfileReview.test.ts` (`establishmentHistory`); tabla de ingresos e historial de sedes en `DeclaredSection.tsx`. Manual T15.3 pendiente. |
| CA-8 | ✅ | `sectionReview.test.ts` (vacío y espacios bloquean, cuerpo recortado); el estado sale de la respuesta (`setQueryData`). Manual T14.1 pendiente. |
| CA-9 | ✅ | `sectionReview.test.ts` (solo `{ result }`; P-17 M6), `complianceKeys.test.ts` (invalida `queueAll`). Manual T14.2 pendiente. |
| CA-10 | ✅ | `sectionReview.test.ts` (`reviewErrorMessage`), `complianceStatic.test.ts` (guarda y `dismissible`); el error no reinicia el formulario. Manual T14.3 pendiente. |
| CA-11 | ✅ | `taxProfileFields.test.ts` (`diffSection`, `comparableVersions`), `complianceStatic.test.ts` (sin botones de revisión). Ver sugerencia 1 (móvil). Manual T16 pendiente. |
| CA-12 | ❌ | `loadErrors.test.ts` (`reviewLoadView`) y la vista sin UUID ✅, pero con un id que no es UUID la pantalla sí llama a la API: `GET /compliance/tax-catalog` (bloqueante 1). |
| CA-13 | ✅ | `groupExpediente` (016), `complianceStatic.test.ts` ("Revisar" solo en `group.current`); `CaseDocumentGroup.tsx`. Manual T19.1 pendiente. |
| CA-14 | ✅ | `documentReview.test.ts` (titular en los cuatro tipos, opcional en `OTRO`; P-17 M1). Manual T17.1 pendiente. |
| CA-15 | ✅ | `documentReview.test.ts` (notas al observar y rechazar). Manual T17.1 pendiente. |
| CA-16 | ✅ | `documentReview.test.ts` (vencimiento anterior, casilla desmarcada sin `expiresAt`; P-17 M2); el campo solo se monta con la casilla. Manual T17.2 pendiente. |
| CA-17 | ✅ | `documentReview.test.ts` (400 tal cual y `refetch`; P-17 M3), `complianceKeys.test.ts`; `onError` relee la lista. Manual T17.3 pendiente. |
| CA-18 | ✅ | `complianceKeys.test.ts`, `focusTrap.test.ts` (P-17 M8), `complianceStatic.test.ts`; `onSuccess` espera la relectura antes de cerrar. Manual T10 y T17.4 pendientes. |
| CA-19 | ✅ | `routes.test.ts` (`parseCaseTab`, `casePath`, `nextTabIndex`); `CaseTabs.tsx` con roles, `aria-*`, tabindex itinerante y flechas; `router.replace`. Manual T18.1 pendiente. |
| CA-20 | ✅ | `taxProfileReview.test.ts` (`summarizeSectionReviews` suma 8), `loadErrors.test.ts` (404 de la ficha). Manual T18.2 y T20.3 pendientes. |
| CA-21 | ✅ | `taxProfileReview.test.ts` (`sortManifestationsDesc`), `complianceTexts.test.ts`. Manual T20.1 pendiente. |
| CA-22 | ✅ | `complianceTexts.test.ts` ("Estado de la cuenta aplicado: …", "Sistema"/"Compliance"), `complianceStatic.test.ts` (sin `useMutation`, "Registrar", "próximamente" ni `disabled`), `complianceServices.test.ts`. Manual T20.2 pendiente. |
| CA-23 | ✅ | `loadErrors.test.ts` (P-17 M7); cada pestaña monta su propio hook solo cuando está activa. Manual T20.3 pendiente. |
| CA-24 | ✅ | `routes.test.ts` (`casePath(id, 'tax-profile')`); `ReviewHeader.tsx:30-35`. Manual T15.5 y T18.3 pendientes. |
| CA-25 | ✅ | `routeProtection.test.ts` en verde con las tres páginas bajo el prefijo `/compliance`; sin cambios en el middleware. Manual T21 pendiente. |
| CA-26 | ✅ | `noPiiLeaks.test.ts` (10 rutas nuevas), `complianceStatic.test.ts`. Manual T22 (DevTools) pendiente. |
| CA-27 | ⚠️ | Pruebas, lint, build y tsc como antes o mejor; sin dependencias nuevas. `audit:ci` y "Pruebas en navegador" fallan, pero solo por causas ajenas que ya existían (`follow-redirects`; fixtures de `key-promotions`/`purchases/quote`, `forms.spec.ts:105`, capturas `win32`). |
| CA-28 | ✅ | `complianceTexts.test.ts` (texto exacto), `taxProfileReview.test.ts` (P-17 M4), `complianceKeys.test.ts` (`versionChanged`, P-17 M10). Manual T15.6 pendiente. |
| CA-29 | ✅ | `complianceServices.test.ts` (`getCatalog`), `complianceKeys.test.ts`, `taxProfileFields.test.ts` (etiqueta por tipo, retirado, desconocido, catálogo vacío; P-17 M9). Manual T15.7 y T16 pendientes. |

Todas las comprobaciones manuales (T10 a T23) las hace el usuario y siguen PENDIENTES.

### Bloqueantes

1. `src/components/compliance/tax-profiles/TaxProfileReview.tsx:78` (CA-12; spec, "Revisión de la ficha · Vacío / 404"):
   `useComplianceTaxCatalog()` se llama siempre, antes del retorno de `!validId` (línea 97), y el hook
   (`src/hooks/compliance/useComplianceTaxProfiles.ts:52-59`) no tiene `enabled`. Con
   `/compliance/tax-profiles/abc` la pantalla muestra el texto correcto pero hace `GET /compliance/tax-catalog`, y la
   spec dice "sin llamar a la API si no es UUID" (la comprobación T15.4 pide "ningún `GET` en Network"). → Que
   `useComplianceTaxCatalog` reciba `enabled` (por ejemplo `useComplianceTaxCatalog(validId)`, o
   `useComplianceTaxCatalog({ enabled: validId })`) y pasarle `isUuid(commercialPublicId)`. Si se quiere más
   estricto, también puede esperar a que la ficha exista (`enabled: data !== undefined`), porque con un 404 tampoco
   hace falta.

### Sugerencias (no bloquean)

1. `src/components/compliance/tax-profiles/VersionCompare.tsx:40-43`: en móvil las dos columnas de una fila de valor
   se apilan sin decir cuál es cuál (los títulos "Versión N · …" / "Vigente · versión M" solo están arriba). Un
   prefijo visible solo en móvil (o `sr-only` siempre) con "Versión N" / "Vigente" en cada valor resuelve la lectura
   a 360 px y para lector de pantalla.
2. `src/components/compliance/tax-profiles/TaxProfileReview.tsx:230` (`disabled={active !== null}`): el botón que
   abre el diálogo se deshabilita en el mismo render en que se monta el diálogo. Si el navegador le quita el foco al
   deshabilitarlo, `Dialog` guarda `document.body` como "quien abrió" y al cerrar el foco no vuelve al botón.
   Comprobarlo en T14 (Tab tras cerrar) y, si pasa, no deshabilitar los botones mientras el diálogo modal está
   abierto (el modal ya impide el segundo clic).
3. `src/components/compliance/tax-profiles/TaxProfileQueue.tsx:81-82`: con `?page=` mayor que `totalPages` se ve el
   vacío **sin** paginador, y el plan (6.2) pedía mostrarlo para volver con "Anterior". Además, un refetch fallido
   con datos ya cargados (`isError` con `data`) tapa la tabla con el error. Mostrar el `Pager` también en el vacío
   cuando `page > 1`, y el error solo si no hay `data`.
4. `src/lib/a11y/focusTrap.ts:4-11`: `FOCUSABLE_SELECTOR` no excluye enfocables ocultos (`hidden`, `display: none`,
   `input[type=hidden]`, `a[href][tabindex="-1"]`). Hoy ningún uso los tiene, pero un diálogo futuro con uno al
   final rompería el ciclo. Filtrar con `el.getClientRects().length > 0` y `!el.closest('[hidden]')`.
5. `src/components/compliance/case/CaseDocumentGroup.tsx:77-87`: varios "Ver" y "Revisar" iguales en la pestaña.
   Un `aria-label` con el tipo ("Revisar RUT") ayuda al lector de pantalla (sin el nombre del archivo).
6. `src/lib/compliance/taxProfileFields.ts:69-145`: las etiquetas de los campos ("Documento RUT", "Régimen", "Sí/No",
   "Con soporte"…) están en la lógica y no en `complianceTaxReview.ts`, como pedía el plan (7.6). Están en español
   (cumple P-18), pero conviene moverlas al diccionario.
7. `src/components/compliance/case/CaseFindingsTab.tsx:30-35`: la clasificación, la gravedad y la medida salen
   sueltas ("Media", "Advertencia"). Un rótulo ("Gravedad: Media") las hace legibles.
8. `src/components/compliance/tax-profiles/TaxProfileReview.tsx:164`: la opción vacía del selector no tiene texto.
   Algo como "Elige una versión" la hace legible.
9. `tasks.md:478`: la línea de T16 perdió el prefijo `- [x] T16` (dice solo " · Comparador de versiones…"), así que
   T16 no aparece marcada.

## Ronda 2: CAMBIOS

Pruebas ✅ · lint:ci ✅ (equivalente) · build ✅ · tsc ✅ · audit:ci ❌ (ya existía: `follow-redirects`, ajeno) · navegador: no se repitió (sin cambios en su alcance)

Revisado el 2026-11-02 sobre el mismo árbol, con las correcciones B1 y S1-S8 de `tasks.md`. Puertas corridas por el
revisor con las `NEXT_PUBLIC_*` ficticias de `CLAUDE.md`.

| Puerta | Resultado | Detalle |
|---|---|---|
| `npm test` | ✅ | 53 archivos y 1314 pruebas en verde (ronda 1: 1303). |
| `lint:ci` | ✅ equivalente | `npx next lint --format json`: 0 errores y 348 avisos = tope; `.lint-max-warnings` = 348 aquí y en `origin/main` (P-19). `npx eslint --max-warnings=0` sobre `src/components/compliance`, `src/hooks/compliance`, `src/lib/compliance`, `src/lib/a11y`, `shared/Dialog.tsx`, `complianceTaxReview.ts`, `src/app/compliance` y las pruebas de `a11y` y `complianceTaxReview`: limpio. |
| `npm run build` | ✅ | `/compliance/tax-profiles` 204 kB, `/compliance/tax-profiles/[commercialPublicId]` 240 kB, `/compliance/commercials/[commercialPublicId]` 241 kB (las tres ƒ). |
| `npx tsc --noEmit` | ✅ | Tras el `build`. |
| `audit:ci` | ❌ ya existía | Equivalente (`npm audit --omit=dev --json` + `evaluateAudit` con la fecha de hoy): falla solo por `follow-redirects` 1.16.1 (GHSA-mrwp-f3q8-3g9p), la misma versión que en `origin/main`. Las cuatro excepciones siguen vigentes hasta el 2026-11-30. `package.json`, `package-lock.json`, `security/`, `next.config.ts` y `src/middleware.ts` sin cambios. |
| `test:e2e` | no se repitió | El único cambio compartido es el `Dialog`, y ninguna prueba de `e2e/` abre un diálogo suyo (sus usos son onboarding, perfil comercial y compliance; `forms.spec.ts` abre `CreatePqrsModal`, que no lo usa). No se generaron `*-win32.png`. |

### P-17 de B1 y S4

Reintroduje cada defecto, corrí la prueba y restauré el archivo (verificado con `cmp`):

| Defecto reintroducido | Resultado |
|---|---|
| `TaxProfileReview` llama a `useComplianceTaxCatalog()` sin `validId` | ❌ rojo: `complianceStatic.test.ts` "B1" |
| `useComplianceTaxCatalog` recibe `enabled` pero no lo pasa a `useQuery` (se borra `enabled,`) | ⚠️ **sigue verde** (31/31): `\benabled\b` casa con el parámetro de la firma (bloqueante 1) |
| `isTabbable` sin `!el.closest('[hidden]')` | ❌ rojo: `focusTrap.test.ts` |
| El selector vuelve a `input:not([disabled])` | ❌ rojo: `focusTrap.test.ts` |
| `Dialog` sin `.filter(isTabbable)` | ⚠️ sigue verde (1314/1314) (sugerencia 1) |

### Correcciones comprobadas

- **B1.** `useComplianceTaxCatalog(enabled = true)` pasa `enabled` a `useQuery` y `TaxProfileReview.tsx:78` le da
  `validId`: con `/compliance/tax-profiles/abc` ya no se pide nada. Pedirlo en paralelo con la ficha, también con un
  404, es la desviación reportada; la spec solo exige no llamar a la API si el id no es UUID, así que se acepta.
- **S1.** `VersionCompare.tsx`: "Versión N:" / "Vigente:" visibles en móvil y `md:sr-only` en escritorio.
- **S2.** Sin `disabled={active…}`; `SectionReviewPanel.disabled` queda opcional. El modal ya impide el segundo clic
  y el foco vuelve al botón (la comprobación manual de T14 sigue pendiente).
- **S3.** El error solo tapa la tabla si `query.data === undefined`; el `Pager` se ve en el vacío con `page > 1`.
  Con `?page=50` y 2 páginas dice "Página 50 de 2" y "Anterior" baja de a una (desviación reportada; sugerencia 2).
- **S4.** `Dialog` filtra con `isTabbable`. No rompe los diez usos de 014-017: ninguno tiene enfocables ocultos,
  `input type="hidden"` ni enlaces con `tabindex="-1"` (barrido de `hidden`/`sr-only`: solo aparecen `aria-hidden` y
  `overflow-hidden`), así que en ellos el ciclo de Tab es el mismo que en la ronda 1. Escape, pila, `dismissible`
  y retorno del foco sin cambios. Probado solo con objetos simulados (sin jsdom, P-13); la comprobación
  manual T10 sigue pendiente.
- **S5-S8.** `aria-label` "Ver {tipo}" / "Revisar {tipo}" (contienen el texto visible), rótulos "Clasificación:",
  "Gravedad:", "Medida:", opción "Elige una versión" y `- [x] T16` restaurado. Textos en español en
  `complianceTaxReview.ts` (P-18). La sugerencia 6 queda sin aplicar por decisión del coordinator.
- Lo corregido no agrega `any`, `@ts-ignore`, `eslint-disable`, `console.*` ni dependencias. Sin cambios en
  rutas, roles ni middleware.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `routes.test.ts`, `complianceStatic.test.ts`. Manual T12 y T13.1 pendientes. |
| CA-2 | ✅ | `routes.test.ts`, `complianceServices.test.ts`. Manual T13.2 pendiente. |
| CA-3 | ✅ | `complianceTexts.test.ts`, `complianceStatic.test.ts` (S3: el error solo tapa sin datos). Manual T13.3 pendiente. |
| CA-4 | ✅ | `routes.test.ts`; `LedgerRow` con `onActivate`. Manual T13.4 pendiente. |
| CA-5 | ✅ | `taxProfileFields.test.ts`, `taxProfileReview.test.ts`, `complianceTexts.test.ts`. Manual T15.1 pendiente. |
| CA-6 | ✅ | `taxProfileReview.test.ts`, `complianceStatic.test.ts` (S5: `aria-label`). Manual T15.2 y T19.1 pendientes. |
| CA-7 | ✅ | `taxProfileFields.test.ts`, `taxProfileReview.test.ts`. Manual T15.3 pendiente. |
| CA-8 | ✅ | `sectionReview.test.ts`. Manual T14.1 pendiente. |
| CA-9 | ✅ | `sectionReview.test.ts`, `complianceKeys.test.ts`. Manual T14.2 pendiente. |
| CA-10 | ✅ | `sectionReview.test.ts`, `complianceStatic.test.ts` (guarda, `dismissible`, S2). Manual T14.3 pendiente. |
| CA-11 | ✅ | `taxProfileFields.test.ts`, `complianceStatic.test.ts` (S1). Manual T16 pendiente. |
| CA-12 | ⚠️ | Código cumplido (`TaxProfileReview.tsx:78` y `enabled` en el hook), pero la prueba de B1 no detecta que el hook deje de pasar `enabled` a `useQuery` (bloqueante 1). Manual T15.4 pendiente. |
| CA-13 | ✅ | `groupExpediente` (016), `complianceStatic.test.ts`. Manual T19.1 pendiente. |
| CA-14 | ✅ | `documentReview.test.ts`. Manual T17.1 pendiente. |
| CA-15 | ✅ | `documentReview.test.ts`. Manual T17.1 pendiente. |
| CA-16 | ✅ | `documentReview.test.ts`. Manual T17.2 pendiente. |
| CA-17 | ✅ | `documentReview.test.ts`, `complianceKeys.test.ts`. Manual T17.3 pendiente. |
| CA-18 | ✅ | `complianceKeys.test.ts`, `focusTrap.test.ts` (S4), `complianceStatic.test.ts`. Manual T10 y T17.4 pendientes. |
| CA-19 | ✅ | `routes.test.ts`; `CaseTabs.tsx`. Manual T18.1 pendiente. |
| CA-20 | ✅ | `taxProfileReview.test.ts`, `loadErrors.test.ts`. Manual T18.2 y T20.3 pendientes. |
| CA-21 | ✅ | `taxProfileReview.test.ts`, `complianceTexts.test.ts`. Manual T20.1 pendiente. |
| CA-22 | ✅ | `complianceTexts.test.ts` (S6: rótulos), `complianceStatic.test.ts`, `complianceServices.test.ts`. Manual T20.2 pendiente. |
| CA-23 | ✅ | `loadErrors.test.ts`. Manual T20.3 pendiente. |
| CA-24 | ✅ | `routes.test.ts`; `ReviewHeader.tsx`. Manual T15.5 y T18.3 pendientes. |
| CA-25 | ✅ | `routeProtection.test.ts` en verde; sin cambios en el middleware. Manual T21 pendiente. |
| CA-26 | ✅ | `noPiiLeaks.test.ts`, `complianceStatic.test.ts`. Manual T22 pendiente. |
| CA-27 | ⚠️ | Pruebas, lint, build y tsc en verde, sin dependencias nuevas; `audit:ci` y "Pruebas en navegador" fallan solo por causas ajenas que ya existían (ronda 1). |
| CA-28 | ✅ | `complianceTexts.test.ts`, `taxProfileReview.test.ts`, `complianceKeys.test.ts`. Manual T15.6 pendiente. |
| CA-29 | ✅ | `complianceServices.test.ts`, `complianceKeys.test.ts`, `taxProfileFields.test.ts`. Manual T15.7 y T16 pendientes. |

Todas las comprobaciones manuales (T10 a T23) las hace el usuario y siguen PENDIENTES.

### Bloqueantes

1. `__tests__/complianceTaxReview/complianceStatic.test.ts:187` (P-17, CA-12): `/\benabled\b/.test(body)` casa con
   el parámetro `enabled = true` de la firma de `useComplianceTaxCatalog`. Si se borra `enabled,` del objeto de
   `useQuery` (`src/hooks/compliance/useComplianceTaxProfiles.ts:56`), el catálogo vuelve a pedirse con un id que no
   es UUID y la prueba sigue verde (comprobado). → Que la aserción mire el objeto de `useQuery`, por ejemplo
   `expect(/useQuery\(\{[\s\S]*?\benabled\s*[,}]/.test(body)).toBe(true)` (o `enabled: enabled`), y verla en rojo
   borrando esa línea.

### Sugerencias (no bloquean)

1. `src/components/shared/Dialog.tsx:48`: ninguna prueba falla si se quita `.filter(isTabbable)`. Un barrido
   estático que exija `.filter(isTabbable)` en el `Dialog` cierra ese hueco, como ya se hace con
   `documentsFromRefetch`.
2. `src/components/compliance/tax-profiles/TaxProfileQueue.tsx:85-92`: en el vacío de una página alta, "Anterior"
   baja de a una ("Página 50 de 2" → 49). Acotar el destino a la última página con datos, por ejemplo
   `onChange={(p) => go({ status, page: Math.min(p, Math.max(meta.totalPages - 1, 0)) + 1 })}`.

## Ronda 3: APROBADO

Pruebas ✅ · lint:ci ✅ (equivalente) · build ✅ · tsc ✅ · audit:ci ❌ (ya existía: `follow-redirects`, ajeno) · navegador: no se repitió (sin cambios en su alcance)

Revisado el 2026-11-02 con las correcciones B2, S9 y S10 de `tasks.md`. Puertas corridas por el revisor con las
`NEXT_PUBLIC_*` ficticias de `CLAUDE.md`.

| Puerta | Resultado | Detalle |
|---|---|---|
| `npm test` | ✅ | 53 archivos y 1318 pruebas en verde (ronda 2: 1314; +1 de S9 y +3 de S10). |
| `lint:ci` | ✅ equivalente | `lint:ci` sale con 3 en Windows (`spawnSync('npx')` sin shell en `scripts/lint-ratchet.mjs`, causa conocida y ajena). `npx next lint --format json`: 0 errores y 348 avisos = tope; `.lint-max-warnings` = 348 aquí y en `origin/main` (P-19). |
| `npm run build` | ✅ | `/compliance/tax-profiles` 204 kB y `/compliance/tax-profiles/[commercialPublicId]` 240 kB, como en la ronda 2. |
| `npx tsc --noEmit` | ✅ | Tras el `build`. |
| `audit:ci` | ❌ ya existía | En Windows el script sale con "spawnSync npm ENOENT" (la misma causa que `lint:ci`). `package.json`, `package-lock.json`, `security/`, `next.config.ts`, `src/middleware.ts` y `.lint-max-warnings` siguen sin diff, así que vale el resultado equivalente de la ronda 2: solo falla `follow-redirects` 1.16.1 (GHSA-mrwp-f3q8-3g9p), la misma versión que en `origin/main`. |
| `test:e2e` | no se repitió | Esta ronda solo toca pruebas, `routes.ts` y el vacío de la cola. |

### P-17 de B2, S9 y S10

Reintroduje cada defecto, corrí la prueba y restauré el archivo (verificado con `cmp`):

| Defecto reintroducido | Resultado |
|---|---|
| Se borra `enabled,` del `useQuery` de `useComplianceTaxCatalog` (`useComplianceTaxProfiles.ts:56`) | ❌ rojo: `complianceStatic.test.ts` "B1" (1 failed, 31 passed) |
| `Dialog.tsx:48` sin `.filter(isTabbable)` | ❌ rojo: `complianceStatic.test.ts` "S9" |
| `previousQueuePage` devuelve siempre `page - 1` | ❌ rojo: `routes.test.ts`, 2 pruebas |
| `previousQueuePage` devuelve `totalPages` sin `Math.max(1, …)` | ❌ rojo: `routes.test.ts` "sin páginas (total 0) va a la 1" |

### Correcciones comprobadas

- **B2.** La aserción corta el archivo desde `export function useComplianceTaxCatalog` hasta el siguiente
  `export interface` y, dentro de eso, desde `useQuery({`. Los `enabled:` de `useComplianceTaxProfile` y
  `useComplianceTaxProfileVersion` quedan antes del corte, así que no la satisfacen: con los demás intactos y
  `enabled,` borrado del catálogo, la prueba se pone en rojo (comprobado). El parámetro de la firma tampoco casa
  porque queda antes de `useQuery({`. Fragilidad residual en la sugerencia 1.
- **S9.** Barrido estático de `.filter(isTabbable)` en `Dialog.tsx`; rojo comprobado.
- **S10.** `previousQueuePage(page, totalPages)` (`src/lib/compliance/routes.ts:44`) y su uso en
  `TaxProfileQueue.tsx:90`: con `?page=50` y 2 páginas "Anterior" va a la 2; sin páginas, a la 1. En ese vacío
  "Siguiente" queda deshabilitado (`page >= totalPages`), así que ignorar el argumento de `onChange` no cambia nada.
- Sin `any`, `@ts-ignore`, `eslint-disable`, `console.*` ni dependencias nuevas. Sin cambios en rutas, roles ni
  middleware.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `routes.test.ts`, `complianceStatic.test.ts`. Manual T12 y T13.1 pendientes. |
| CA-2 | ✅ | `routes.test.ts`, `complianceServices.test.ts`. Manual T13.2 pendiente. |
| CA-3 | ✅ | `complianceTexts.test.ts`, `complianceStatic.test.ts`, `routes.test.ts` (S10). Manual T13.3 pendiente. |
| CA-4 | ✅ | `routes.test.ts`; `LedgerRow` con `onActivate`. Manual T13.4 pendiente. |
| CA-5 | ✅ | `taxProfileFields.test.ts`, `taxProfileReview.test.ts`, `complianceTexts.test.ts`. Manual T15.1 pendiente. |
| CA-6 | ✅ | `taxProfileReview.test.ts`, `complianceStatic.test.ts`. Manual T15.2 y T19.1 pendientes. |
| CA-7 | ✅ | `taxProfileFields.test.ts`, `taxProfileReview.test.ts`. Manual T15.3 pendiente. |
| CA-8 | ✅ | `sectionReview.test.ts`. Manual T14.1 pendiente. |
| CA-9 | ✅ | `sectionReview.test.ts`, `complianceKeys.test.ts`. Manual T14.2 pendiente. |
| CA-10 | ✅ | `sectionReview.test.ts`, `complianceStatic.test.ts`. Manual T14.3 pendiente. |
| CA-11 | ✅ | `taxProfileFields.test.ts`, `complianceStatic.test.ts`. Manual T16 pendiente. |
| CA-12 | ✅ | `complianceStatic.test.ts` "B1": ahora exige `enabled` dentro del `useQuery` del catálogo y `useComplianceTaxCatalog(validId)` (rojo comprobado). Manual T15.4 pendiente. |
| CA-13 | ✅ | `groupExpediente` (016), `complianceStatic.test.ts`. Manual T19.1 pendiente. |
| CA-14 | ✅ | `documentReview.test.ts`. Manual T17.1 pendiente. |
| CA-15 | ✅ | `documentReview.test.ts`. Manual T17.1 pendiente. |
| CA-16 | ✅ | `documentReview.test.ts`. Manual T17.2 pendiente. |
| CA-17 | ✅ | `documentReview.test.ts`, `complianceKeys.test.ts`. Manual T17.3 pendiente. |
| CA-18 | ✅ | `complianceKeys.test.ts`, `focusTrap.test.ts`, `complianceStatic.test.ts` (S9). Manual T10 y T17.4 pendientes. |
| CA-19 | ✅ | `routes.test.ts`; `CaseTabs.tsx`. Manual T18.1 pendiente. |
| CA-20 | ✅ | `taxProfileReview.test.ts`, `loadErrors.test.ts`. Manual T18.2 y T20.3 pendientes. |
| CA-21 | ✅ | `taxProfileReview.test.ts`, `complianceTexts.test.ts`. Manual T20.1 pendiente. |
| CA-22 | ✅ | `complianceTexts.test.ts`, `complianceStatic.test.ts`, `complianceServices.test.ts`. Manual T20.2 pendiente. |
| CA-23 | ✅ | `loadErrors.test.ts`. Manual T20.3 pendiente. |
| CA-24 | ✅ | `routes.test.ts`; `ReviewHeader.tsx`. Manual T15.5 y T18.3 pendientes. |
| CA-25 | ✅ | `routeProtection.test.ts` en verde; sin cambios en el middleware. Manual T21 pendiente. |
| CA-26 | ✅ | `noPiiLeaks.test.ts`, `complianceStatic.test.ts`. Manual T22 pendiente. |
| CA-27 | ✅ con fallos ajenos | Pruebas, lint, build y tsc en verde, sin dependencias nuevas ni tope de lint mayor; `audit:ci` (`follow-redirects`) y "Pruebas en navegador" fallan solo por causas que ya existían (ronda 1). |
| CA-28 | ✅ | `complianceTexts.test.ts`, `taxProfileReview.test.ts`, `complianceKeys.test.ts`. Manual T15.6 pendiente. |
| CA-29 | ✅ | `complianceServices.test.ts`, `complianceKeys.test.ts`, `taxProfileFields.test.ts`. Manual T15.7 y T16 pendientes. |

Todas las comprobaciones manuales (T10 a T23) las hace el usuario y siguen PENDIENTES. El aprobado cubre el
código y las pruebas automáticas; no las reemplaza.

### Bloqueantes

Ninguno.

### Sugerencias (no bloquean)

1. `__tests__/complianceTaxReview/complianceStatic.test.ts:186`: el corte del hook termina en el siguiente
   `export interface`. Si mañana se agrega otro hook con `enabled:` entre `useComplianceTaxCatalog` y
   `ReviewSectionVariables`, la prueba pasaría aunque el catálogo perdiera `enabled`. Cortar también en el siguiente
   `export function` (el menor de los dos índices) lo cierra. Tampoco distingue `enabled: true` de `enabled`;
   aceptable.
2. `TaxProfileQueue.tsx:90`: ninguna prueba falla si el vacío vuelve a `page - 1` en vez de llamar a
   `previousQueuePage`. Un barrido de `previousQueuePage(` en ese archivo lo cubriría.
