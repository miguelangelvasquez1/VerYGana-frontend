# 018 · Plan: requerimientos, hallazgos, incidencias, alertas, reglas y catálogo (entrega D, parte 2)

- **Spec:** `spec.md` de esta carpeta (Aprobada, 2026-11-02). Contrato: `specs/014-…/backend-contract.md`.
- **Comprobado en la API** (solo lectura, `../VerYGanaAPI`): `ComplianceInformationRequestController.java`
  (rutas, `pendingOnly` por defecto `true`, páginas de 20), `InformationRequestDTOs.java` (`dueDate`, `validFrom`,
  `validTo` son `LocalDate` → `YYYY-MM-DD`; `minGrowthPct` es `BigDecimal`), `ComplianceAlertServiceImpl.java`
  (`paramsJson` = `{windowDays, minGrowthPct, minCurrentSalesCents}`; "La alerta ya fue revisada."),
  `InformationRequestServiceImpl.java:175-196` (mensaje de duplicado con el UUID dentro; con `alertId` la API
  enlaza la alerta y la marca revisada), `ComplianceCaseServiceImpl.java:113-129` (el hallazgo cierra el
  requerimiento con `CLOSED_WITH_FINDING` y devuelve `accountStatusApplied`).
- **Sin cambios de middleware:** las cinco páginas cuelgan de `/compliance` (prefijo en `ROLE_RULES` de
  `__tests__/middleware/routeAccess.ts`); `routeProtection.test.ts` las cubre solas. Ningún route handler nuevo.

## Archivos

**Lógica pura (sin `'use client'`, con prueba):**

| Archivo | Cambio |
|---|---|
| `src/lib/labels/taxCompliance.ts` | + `TAX_CATALOG_TYPE_LABELS`, `REQUEST_ITEM_TYPE_LABELS`, `COMMUNICATION_CHANNEL_LABELS`, `DELIVERY_STATUS_LABELS` (ToneLabel). No existe aún un diccionario de tipos de catálogo (la 014 solo tiene `CATALOG_TYPES` en `src/lib/taxProfile/catalog.ts`, que se reutiliza para el orden de pestañas). |
| `src/lib/labels/complianceActions.ts` (nuevo) | `COMPLIANCE_ACTION_TEXTS`: todos los literales de la 018 (menú, estados de pantalla, diálogos, avisos RN-4/5/6/7, notas fijas, errores). |
| `src/lib/compliance/routes.ts` | + rutas y params: `INFORMATION_REQUESTS_PATH`, `parseRequestQueueParams` (por defecto `RESPONDED`, `ALL` = sin `status`), `requestQueuePath`, `requestQueueApiParams` (página base 0), `requestDetailPath`, `ALERTS_PATH` + `parseAlertsParams`/`alertsPath` (`?all=1`, `?page=`), `ALERT_RULES_PATH`, `TAX_CATALOG_PATH` + `parseCatalogTab`/`catalogPath` (`?tab=` = `TaxCatalogType`). Mismo estilo que la cola de fichas (sin `URLSearchParams`). |
| `src/lib/compliance/loadErrors.ts` | + `requestDetailLoadView(error)` (404/400 → `not-found`, 403 → `forbidden`, resto → `error`) y `actionErrorMessage(error)` (400 con `message` → tal cual; 403 → "No tienes permiso…"; resto → "No pudimos guardar. Intenta de nuevo."). |
| `src/lib/compliance/informationRequestForm.ts` (nuevo) | Esquema zod de crear (RN-1: ≥ 1 ítem, Documento exige `documentType`, Campo exige `fieldPath` ≤ 100, límites), `buildCreateRequestBody` (recorta, sin claves vacías, `alertId` solo si hay, `establishmentId` solo en Documento), `extractDuplicateRequestId(message)` (RN-2, regex UUID), esquemas y cuerpos de revisar (RN-3) y anular, `requestActions(status)` → `{ review, cancel, finding }`. |
| `src/lib/compliance/findingForm.ts` (nuevo) | `allowedMeasures(classification)` y `measureAfterClassificationChange` (RN-4), `expressRefusalAvailable(history \| undefined)` (RN-5), `changesAccount(measure)` (RN-6), `companyNameMatches(typed, name)` (recorta, sin mayúsculas), esquema zod del hallazgo (`remediable: boolean \| null` obligatorio), `buildFindingBody`; esquema y cuerpo de incidencia. |
| `src/lib/compliance/alerts.ts` (nuevo) | `parseDataUsed(json)` → filas `{key, value}` (claves `…Cents` con `formatCents`) o `null`; `alertOriginLabel(alert)` ("Regla X vN" / "Evento del expediente"); esquema y cuerpo de "Marcar revisada". |
| `src/lib/compliance/alertRules.ts` (nuevo) | `parseRuleParams(paramsJson)` (o `null`), `groupRulesByCode` (activa arriba, resto por versión desc.), `nextVersionFor(code, rules)` (aviso N+1), esquema zod de regla (código `/^[A-Z0-9_]{3,50}$/`, umbrales como texto vacío por defecto, días ≥ 7 entero, % ≥ 0,01 con coma o punto, pesos ≥ 0 con `parsePesosInput`), `buildRuleBody` (pesos → centavos con `pesosToCents`, `ruleType: 'PLATFORM_SALES_GROWTH'`). |
| `src/lib/compliance/taxCatalog.ts` (nuevo) | Esquemas de agregar (código ≤ 30, etiqueta ≤ 200, fundamento obligatorio ≤ 500, `validFrom` obligatorio) y de retirar (`validTo` ≥ `validFrom`, RN-10), cuerpos. |

**Datos:**

| Archivo | Cambio |
|---|---|
| `src/services/compliance/ComplianceRequestService.ts` (nuevo) | `search(params)`, `get(id)`, `create(body)`, `review(id, body)`, `cancel(id, body)`. |
| `src/services/compliance/ComplianceCaseService.ts` | + `createFinding(body)`, `createIncident(body)`. `listRequests` se queda. |
| `src/services/compliance/ComplianceAlertService.ts` (nuevo) | `listAlerts({pendingOnly, page, size})`, `reviewAlert(id, body)`, `listRules()`, `createRule(body)`, `deactivateRule(id)`. |
| `src/services/compliance/ComplianceTaxProfileService.ts` | + `createCatalogEntry(body)`, `retireCatalogEntry(id, body)` (la lectura `getCatalog` ya existe). |
| `src/hooks/compliance/complianceKeys.ts` | + `complianceRequestKeys` (`all`, `queueAll`, `queue(status,page)`, `detail(id)`), `complianceAlertKeys` (`all`, `list(pendingOnly,page)`), `complianceAlertRuleKeys.all`; + entradas en `COMPLIANCE_INVALIDATIONS` (tabla abajo). Se reutiliza `complianceTaxCatalogKeys.all` (es la misma clave que lee la ficha de la 017). |
| `src/hooks/compliance/useComplianceRequests.ts` (nuevo) | `useRequestQueue`, `useComplianceRequest(id)` (`enabled: isUuid(id)`, sin reintento en 404), `useCreateRequest`, `useReviewRequest`, `useCancelRequest`. |
| `src/hooks/compliance/useComplianceCase.ts` | + `useCreateFinding`, `useCreateIncident`. |
| `src/hooks/compliance/useComplianceAlerts.ts` (nuevo) | `useAlerts`, `useReviewAlert`, `useAlertRules`, `useCreateAlertRule`, `useDeactivateAlertRule`. |
| `src/hooks/compliance/useComplianceTaxProfiles.ts` | + `useCreateCatalogEntry`, `useRetireCatalogEntry` (lectura: `useComplianceTaxCatalog`, ya existe). |

**Invalidaciones (RN-11, P-10):**

| Mutación | Invalida |
|---|---|
| crear requerimiento | `requestKeys.queueAll`, `caseKeys.requestsAll(cp)`; con `alertId`, `alertKeys.all` |
| revisar / anular | `setQueryData(detail(id))` + `queueAll` + `caseKeys.requestsAll(cp)` |
| hallazgo | `caseKeys.findings(cp)`; con requerimiento: `detail(id)`, `queueAll`, `caseKeys.requestsAll(cp)` |
| incidencia | `caseKeys.incidents(cp)` |
| revisar alerta | `alertKeys.all` |
| crear / desactivar regla | `alertRuleKeys.all` |
| crear / retirar código | `complianceTaxCatalogKeys.all` (catálogo y ficha de la 017) |

**UI (`'use client'` solo en los componentes):**

- `src/components/compliance/requests/`: `RequestQueue.tsx` (filtro con los 6 estados + "Todos", tabla con filas
  `tabIndex=0` y Enter, `Pager`), `RequestDetail.tsx` (cabecera, ítems, línea de tiempo con `buildTimeline` de
  `src/lib/informationRequests/requests.ts`, adjuntos con `useOpenCaseDocument`), `RequestCommunications.tsx`,
  `RequestReviewDialog.tsx`, `RequestCancelDialog.tsx`, `CreateRequestDialog.tsx` (`useFieldArray`; sedes de
  `useComplianceTaxProfile(cp).profile.activeEstablishments`, si la ficha no existe la sede no se ofrece).
- `src/components/compliance/findings/`: `FindingDialog.tsx`, `AccountMeasureConfirmDialog.tsx` (rojo, RN-6),
  `IncidentDialog.tsx` (selector con la primera página de `useCaseRequests(cp, 0)`).
- `src/components/compliance/alerts/`: `AlertsList.tsx`, `AlertCard.tsx`, `AlertDataTable.tsx`, `AlertReviewDialog.tsx`.
- `src/components/compliance/alert-rules/`: `AlertRules.tsx`, `AlertRuleGroup.tsx`, `AlertRuleDialog.tsx`.
- `src/components/compliance/tax-catalog/`: `TaxCatalog.tsx` (`tablist`/`tab` con `nextTabIndex` de `routes.ts`),
  `CatalogEntryDialog.tsx`, `RetireCatalogEntryDialog.tsx`.
- Páginas de servidor (P-2, P-6, `metadata` con título): `src/app/compliance/information-requests/page.tsx`,
  `…/information-requests/[requestPublicId]/page.tsx`, `src/app/compliance/alerts/page.tsx`,
  `src/app/compliance/alert-rules/page.tsx`, `src/app/compliance/tax-catalog/page.tsx`.
- Modificar: `src/components/compliance/ComplianceLayout.tsx` (`NAV` + 4 entradas: `ClipboardList`, `Bell`,
  `SlidersHorizontal`, `BookOpen`), `src/components/compliance/case/CaseRequestsTab.tsx` (botón "Nuevo
  requerimiento", filas → `Link` al detalle), `CaseFindingsTab.tsx` ("Registrar hallazgo"), `CaseIncidentsTab.tsx`
  ("Registrar incidencia"), `CommercialCase.tsx` (pasa `companyName` del perfil a las pestañas).
- Prueba existente que cambia: `__tests__/complianceTaxReview/complianceStatic.test.ts`, bloque "pestañas de solo
  lectura (RN-10, CA-22)": se reemplaza (la 018 sustituye la RN-10 de la 017), conservando el de `CaseCommitmentTab`.

Todos los diálogos usan `src/components/shared/Dialog.tsx` con `dismissible={!isPending}`, guarda `useRef(false)`
en la primera línea de `onSubmit` (el patrón que comprueba `guardsDoubleSubmit` de
`__tests__/complianceTaxReview/staticScan.ts`), `zodResolver`, y el error con `actionErrorMessage` sin `reset()`.

## Decisiones

- **D-1 · Nombre de la empresa para RN-6.** Sale de la ficha (`useComplianceTaxProfile`) o, desde el detalle, de
  `request.companyName`. Si no se conoce (empresario sin ficha enviada, la 017 muestra el texto de respaldo),
  "Restricción preventiva" y "Suspensión" quedan deshabilitadas con el motivo "No pudimos obtener el nombre de la
  empresa para confirmar esta medida". Ver "Para el usuario".
- **D-2 · Servicios.** No se crea un servicio por recurso: requerimientos y alertas/reglas en dos archivos nuevos;
  hallazgos e incidencias van al servicio del caso; el catálogo, al de fichas (ya lee `/compliance/tax-catalog`).
- **D-3 · Detalle con id inválido:** el componente comprueba `isUuid` (de `src/lib/informationRequests/requests.ts`)
  y no monta la consulta (CA-6).
- **D-4 · Duplicado (RN-2):** se muestra el `message` tal cual; el botón aparece solo si la regex encuentra un UUID.
- **D-5 · Incidencia:** el selector de requerimiento relacionado ofrece solo la primera página (20 más recientes) de
  la pestaña del caso; no se agrega un endpoint ni una consulta paginada nueva.
- **D-6 · % mínimo:** se escribe con coma o punto y se envía como `number` (la API lo guarda en `BigDecimal`).
- **D-7 · Fechas:** `dueDate`, `validFrom`, `validTo` con `<input type="date">` (`YYYY-MM-DD`); se muestran con
  `formatPlainDate` / `formatBogotaDateTime` de `src/lib/utils/dateDisplay.ts`.

## Seguridad y PII (RN-13, P-16)

En la URL solo UUID, `status`, `page`, `tab`, `all` (los constructores de `routes.ts` son la única vía, con prueba).
Ningún `console.*`, `localStorage` ni `sessionStorage` en los archivos nuevos (barrido estático, T12). Los errores
se leen con `readApiError`, que no arrastra la configuración de axios. `dataUsedJson` solo se pinta.

## Efectos colaterales

- La API notifica al empresario (IN_APP/EMAIL) al crear, revisar o anular; la 016 lo ve al recargar. Sin tiempo real.
- Un hallazgo con restricción o suspensión cambia la cuenta del empresario en la API; el front no tiene ese estado en caché.
- Si la validación falla antes de llamar a la API, no se crea nada ni se notifica.
- El catálogo nuevo llena los selectores de la ficha del empresario (014) en su próxima carga (otra sesión).

## Trazabilidad

| CA | Tareas | Verificación |
|---|---|---|
| CA-1 | T11, T12, T13 | barrido de `NAV` (4 href) + manual en escritorio |
| CA-2 | T2, T8, T13 | `routes` (defecto `RESPONDED`, `ALL` sin `status`) + manual |
| CA-3 | T1, T8, T13 | textos + manual |
| CA-4 | T3, T8, T13 | esquema/cuerpo de revisión y `requestActions` + manual |
| CA-5 | T3, T8, T13 | esquema de anular y `requestActions` + manual |
| CA-6 | T2, T8, T12, T13 | `requestDetailLoadView` + barrido (`isUuid` antes de la consulta) + manual |
| CA-7 | T3, T8, T13 | esquema de crear (RN-1) + manual |
| CA-8 | T3, T7, T13 | `buildCreateRequestBody` sin claves vacías + servicio + manual |
| CA-9 | T3, T13 | `extractDuplicateRequestId` + manual |
| CA-10 | T3, T7, T10, T13 | cuerpo con `alertId` + invalidación de alertas + manual |
| CA-11 | T4, T13 | `allowedMeasures` / `measureAfterClassificationChange` + manual |
| CA-12 | T4, T13 | `expressRefusalAvailable` + manual |
| CA-13 | T4, T9, T13 | `changesAccount` / `companyNameMatches` + manual |
| CA-14 | T4, T13 | `changesAccount('TERMINATION_REFERRAL') === false` + texto RN-7 + manual |
| CA-15 | T7, T9, T13 | invalidaciones del hallazgo + manual |
| CA-16 | T4, T13 | esquema del hallazgo + manual |
| CA-17 | T4, T7, T9, T13 | esquema de incidencia + invalidación + manual |
| CA-18 | T2, T5, T10, T13 | `parseAlertsParams` (`all=1`) + `alertOriginLabel` + barrido (sin recorte del `message`) + manual |
| CA-19 | T5, T13 | `parseDataUsed` (válido, `Cents`, ilegible) + manual |
| CA-20 | T5, T7, T13 | esquema de revisión + invalidación + manual |
| CA-21 | T5, T13 | `groupRulesByCode` / `parseRuleParams` + manual |
| CA-22 | T5, T13 | esquema de regla, umbrales vacíos, `nextVersionFor`, centavos + manual |
| CA-23 | T7, T10, T13 | servicio + invalidación + manual |
| CA-24 | T1, T6, T11, T12, T13 | esquemas, barrido (sin editar/borrar, `role="tablist"`) + manual |
| CA-25 | T12, T14 | `routeProtection.test.ts` en verde sin tocar el middleware + manual con `MIDDLEWARE=ACTIVE` |
| CA-26 | T2, T12, T13 | `actionErrorMessage` + barrido (`guardsDoubleSubmit`, `dismissible={!…}`) + manual |
| CA-27 | T2, T12, T13 | constructores de URL + barrido (`console`, storage) + manual (consola y URL) |
| CA-28 | T14 | puertas finales |

## Riesgos

- **R-1:** el UUID del duplicado depende del texto del `message`; si la API lo cambia, el botón desaparece (el
  mensaje sigue). Lo ideal es un campo propio en el error (pendiente de la API, no bloqueante).
- **R-2:** `paramsJson`/`dataUsedJson` no tienen esquema en la API; el parseo es defensivo y cae al texto de error.
- **R-3:** el selector de incidencias (D-5) no ofrece requerimientos más antiguos que los 20 últimos.
- **R-4:** `CreateRequestDialog` y `FindingDialog` son largos; el scroll interno se comprueba a mano en escritorio.
- **R-5:** la 017 tiene una prueba estática que exige pestañas de solo lectura; se reescribe en T9 (no se borra sin reemplazo).

## Para el usuario

- **D-1:** confirmar que, sin nombre de empresa conocido, se bloquean las dos medidas que cambian la cuenta (alternativa:
  pedir el NIT u otra cadena, que la spec no prevé).
- **D-5:** aceptar que el selector de incidencias muestre solo los 20 requerimientos más recientes.

## Bloqueos

Ninguno. Sin dependencias nuevas, sin variables de entorno, sin hosts de imágenes, sin rutas de `src/app/api`.

**Aprobado por el usuario (2026-11-02):** plan, D-1 (sin nombre de empresa conocido, las dos medidas que cambian la cuenta quedan deshabilitadas con su motivo visible) y D-5 (selector con los 20 requerimientos más recientes). Compliance es solo escritorio: no se diseña ni se comprueba en móvil.
