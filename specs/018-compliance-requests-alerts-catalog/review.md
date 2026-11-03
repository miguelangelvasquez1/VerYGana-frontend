# 018 · Revisión

## Ronda 1: CAMBIOS

Pruebas ✅ · lint ✅ · build ✅ · tsc ✅ · audit ❌ (ya existía, ajeno)

- `npm test`: 64 archivos, 1539 pruebas en verde (incluye `routeProtection.test.ts` y `routeInventory.test.ts`).
- `npx next lint` (en Windows `lint:ci` sale con 3): 0 errores y 348 avisos, igual al tope. `.lint-max-warnings` = 348,
  igual que en `origin/main`. Ningún aviso nuevo en los archivos de la 018.
- `npm run build` con las `NEXT_PUBLIC_*` ficticias: sale con 0. Después, `npx tsc --noEmit`: sale con 0.
- `npm audit --omit=dev --json`: `follow-redirects` (alto) no tiene excepción y ya existía. `package.json`,
  `package-lock.json` y `security/` no cambian. No viene de este cambio.
- Sin dependencias nuevas. `src/middleware.ts` no cambia. El cambio en `__tests__/middleware/routeAccess.ts`
  (`/explore/recognitions`) es de otra spec, no de esta.

**P-17 (mutaciones, hechas por el revisor).** Metí 20 defectos, uno por vez. Cada uno puso en rojo su prueba. Después
restauré cada archivo y lo comprobé con `cmp`:
RN-4 (`ISOLATED_INCONSISTENCY` fuera de la lista limitada; no vaciar la medida), RN-5 (`?? true`), RN-6
(`companyNameMatches` acepta cualquier texto), RN-2 (`extractDuplicateRequestId` devuelve el mensaje entero), RN-9
(`windowDays: '30'` por defecto), claves vacías (`dueDate`, `acceptableResponse`, `evidence` siempre presentes), RN-3
(`review` en todos los estados abiertos), centavos (`Number(pesos)`), RN-10 (`validTo` sin comparar), RN-11
(se quita `detail(requestPublicId)` del hallazgo y `alertKeys.all` del requerimiento creado desde una alerta), el barrido
T12 (sin la guarda `submittingRef` en `AlertReviewDialog` y en `AccountMeasureConfirmDialog`, `dismissible` sin `!busy`,
un `console.log(dataUsedJson)`) y la prueba reescrita de la 017 (sin `U.newIncident`, y la fila sin `Link` a
`requestDetailPath`).

**Puntos que pidió confirmar el coordinator:**
- RN-6: el envío solo sale de `AccountMeasureConfirmDialog.onSubmit`, que exige `matches`, y el botón tiene
  `disabled={busy || !matches}`. En `FindingDialog.onSubmit` una medida que cambia la cuenta solo guarda `pendingBody` y
  no llama a la API. "Cancelar" limpia `pendingBody` sin enviar nada. Confirmado.
- `context` de la incidencia ≤ 100: la API lo fija en `InformationRequestDTOs.IncidentRequest` (`@NotBlank @Size(max = 100)`),
  y la descripción en ≤ 1000. Confirmado. La spec no decía el tope, así que conviene anotarlo en ella.
- P-16 / RN-13: en los archivos nuevos, en `case/*` y en `CommercialCase.tsx` no hay `console.`, `localStorage`,
  `sessionStorage` ni `URLSearchParams`. Toda navegación pasa por los constructores de `routes.ts`, que solo llevan
  UUID, `status`, `page`, `tab` y `all`. `dataUsedJson` solo se pinta. Confirmado.
- Contrato: las rutas de los servicios coinciden con `ComplianceInformationRequestController` y
  `ComplianceTaxProfileController`. Los tipos coinciden con `InformationRequestDTOs` en nombres, nulabilidad y límites.
  La API exige descripción en la regla (`@NotBlank`), igual que el esquema del front, aunque la spec la daba como
  opcional.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `complianceActionsStatic.test.ts` (4 `href` en `NAV`) · manual T13 pendiente |
| CA-2 | ✅ | `complianceActions/routes.test.ts` · manual T13 pendiente |
| CA-3 | ❌ | `RequestCommunications.tsx` no muestra `errorDetail` (ver bloqueante) |
| CA-4 | ✅ | `informationRequestForm.test.ts` (esquema y cuerpo de revisión, `requestActions`) · T13 |
| CA-5 | ✅ | `informationRequestForm.test.ts` (anular, `requestActions`) · T13 |
| CA-6 | ✅ | `actionErrors.test.ts` + barrido (`isUuid` antes de `<RequestLoader`) · T13 |
| CA-7 | ✅ | `informationRequestForm.test.ts` (RN-1) · T13 |
| CA-8 | ✅ | `informationRequestForm.test.ts` (sin claves vacías, comprobado con mutación) + `complianceActionServices.test.ts` · T13 |
| CA-9 | ✅ | `extractDuplicateRequestId` con el mensaje real de la API (`InformationRequestServiceImpl.java:175`) · T13 |
| CA-10 | ✅ | cuerpo con `alertId` + `requestCreated(cp, true)` invalida las alertas (comprobado con mutación) · T13 |
| CA-11 | ✅ | `findingForm.test.ts` (RN-4, comprobado con mutación) · T13 |
| CA-12 | ✅ | `findingForm.test.ts` (RN-5, comprobado con mutación); `<option disabled>` con el motivo · T13 |
| CA-13 | ✅ | `findingForm.test.ts` (`changesAccount`, `companyNameMatches`) + lectura del flujo · T13 |
| CA-14 | ✅ | `changesAccount('TERMINATION_REFERRAL') === false` + texto de RN-7 · T13 |
| CA-15 | ✅ | `complianceActionKeys.test.ts` (hallazgo con requerimiento) + aviso `accountStatusApplied` · T13 |
| CA-16 | ✅ | `findingForm.test.ts` (esquema) · T13 |
| CA-17 | ✅ | `findingForm.test.ts` (incidencia) + invalidación · T13 |
| CA-18 | ✅ | `routes.test.ts` (`all=1`) + `alertOriginLabel` + barrido (sin recortar `message`) · T13 |
| CA-19 | ✅ | `alerts.test.ts` (`parseDataUsed`) · T13 |
| CA-20 | ✅ | `alerts.test.ts` + `alertReviewed` · T13 |
| CA-21 | ✅ | `alertRules.test.ts` (`groupRulesByCode`, `parseRuleParams`) · T13 |
| CA-22 | ✅ | `alertRules.test.ts` (umbrales vacíos, centavos y N+1, comprobados con mutación) · T13 |
| CA-23 | ✅ | `complianceActionServices.test.ts` + `alertRuleChanged` · T13 |
| CA-24 | ✅ | `taxCatalog.test.ts` + barrido (`tablist`, sin editar ni eliminar) · T13 |
| CA-25 | ✅ | `routeProtection.test.ts` en verde, middleware sin cambios · manual con `MIDDLEWARE=ACTIVE` pendiente |
| CA-26 | ✅ | `actionErrors.test.ts` + barrido (`guardsDoubleSubmit`, `dismissible={!`; comprobado con mutación) · T13 |
| CA-27 | ✅ | barrido (`console`, storage, `URLSearchParams`) + constructores de URL · T13 |
| CA-28 | ✅ | puertas de arriba; la auditoría falla por un aviso que ya existía |

T13 (comprobación manual) sigue sin marcar. La hace el usuario, y ningún CA de interfaz se da por comprobado a mano
hasta que la haga.

### Bloqueantes

- `src/components/compliance/requests/RequestCommunications.tsx:23-36` (CA-3): ante una comunicación `FAILED` se ve
  el aviso general y la insignia "Falló", pero no su `errorDetail`. Ningún componente de compliance lo lee (`grep
  errorDetail src/components` no da nada). El CA-3 pide "si una comunicación falló, ve su detalle". → Hay que pintar
  `c.errorDetail` en la fila cuando `deliveryStatus === 'FAILED'` y no es `null`.

### Sugerencias (no bloquean)

- `RequestQueue.tsx`: falta la columna "Emitido por" ("Sistema" / "Compliance") que pide la pantalla 2 de la spec.
  Además, el detalle dice "Cumplimiento" (`U.compliance`), no "Compliance".
- `RequestDetail.tsx`: la spec pide "Cerrada el …" (`closedAt`) en los requerimientos cerrados o anulados y solo se
  muestran las notas de cierre. El estado 404 no tiene el enlace de vuelta a la cola que pide la tabla de estados.
  Los adjuntos se rotulan "Ver 1", "Ver 2" en lugar de por su tipo de documento, y ese literal está escrito en el
  componente, no en el diccionario.
- `CreateRequestDialog.tsx`: faltan las tres ayudas de la spec ("Explica el hecho concreto…", "¿Qué requisito se
  evalúa…?", "Solo si una regla aplicable fija un plazo").
- `AlertRuleGroup.tsx`: no hay botón "Nueva versión" con el código fijo. El aviso N+1 solo aparece si se escribe a
  mano un código existente en "Nueva regla". El CA-22 se cumple igual.
- `TaxCatalog.tsx`: la insignia dice "Vigente" y la spec pide "Activo". El estado vacío no repite "Agregar código"
  (está en la cabecera).
- `CaseFindingsTab.tsx:20`: el comentario aún dice "de solo lectura (RN-10…)". Ya tiene acción.
- RN-11: las pruebas comprueban la tabla `COMPLIANCE_INVALIDATIONS`, no que cada hook la use con los argumentos
  correctos. Si `useCreateFinding` dejara de pasar `body.requestPublicId`, ninguna prueba fallaría. Basta un barrido
  estático simple o una prueba del `onSuccess` con un `QueryClient` real.
- `FindingDialog.tsx:303`: si se llegara a `pendingBody` con `companyName` nulo (hoy no se puede: las opciones están
  deshabilitadas), el diálogo quedaría sin confirmación y sin poder cerrarse. Una guarda en `onSubmit` lo dejaría
  explícito.
- La spec debería anotar el tope de 100 caracteres de `context` y que la descripción de la regla es obligatoria
  (así lo exige la API).

## Ronda 2: verificación del coordinator (modo rápido, sin nueva revisión completa)

B1 corregido (`RequestCommunications.tsx:32-33` muestra `errorDetail` en las entregas `FAILED`; barrido en `complianceActionsStatic.test.ts`, rojo visto por el implementer). S1–S7 aplicadas (ver "Correcciones de la ronda 1" en `tasks.md`), sin prueba automática salvo B1. Puertas corridas por el coordinator el 2026-11-02: `npm test` 64 archivos y 1540 pruebas en verde; `npx tsc --noEmit` sin errores; `npx next lint` 0 errores y 348 avisos (= tope); build corrido por el implementer tras las correcciones. Auditoría: solo `follow-redirects`, ajeno y previo. Quedan sin aplicar las sugerencias de pruebas de RN-11 por hook. Comprobación manual T13 pendiente del usuario.
