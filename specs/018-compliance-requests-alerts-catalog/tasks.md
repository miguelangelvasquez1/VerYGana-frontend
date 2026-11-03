# 018 · Tareas

Dos bloques. En el A, cada prueba se escribe primero y se ve fallar (el módulo no existe o no exporta lo pedido)
antes de implementar (P-13, P-17). Archivos de lógica sin `'use client'` (se importan desde Vitest). Pruebas
nuevas en `__tests__/complianceActions/`. Detalle de qué va en cada archivo: `plan.md`.

## Bloque A · Lógica, textos, datos (Vitest)

- [x] T1 · Textos y diccionarios (CA-3, CA-24, RN-4/6/7/8, RN-10)
  - Archivos: src/lib/labels/taxCompliance.ts (+ `TAX_CATALOG_TYPE_LABELS`, `REQUEST_ITEM_TYPE_LABELS`,
    `COMMUNICATION_CHANNEL_LABELS`, `DELIVERY_STATUS_LABELS`), src/lib/labels/complianceActions.ts (nuevo,
    `COMPLIANCE_ACTION_TEXTS`)
  - Test primero: __tests__/complianceActions/complianceActionsTexts.test.ts — cada enum tiene rótulo (cinco tipos
    de catálogo, tres de ítem, dos canales, dos entregas); textos exactos de la spec: aviso de comunicación fallida,
    notas RN-4, RN-5, RN-7, RN-10, la de la regla ("solo ve operaciones en VERYGANA…"), confirmación RN-6 con
    empresa y medida, "Se creará la versión N+1…", vacíos y errores de la tabla de estados, "Requerimiento
    enviado", "Hallazgo registrado", "Estado de la cuenta aplicado: {estado}"; ningún texto de alerta contiene
    "sanción" ni "incumplimiento" (RN-8).
  - Verificar: npx vitest run __tests__/complianceActions/complianceActionsTexts.test.ts && npx tsc --noEmit

- [x] T2 · Rutas, parámetros de URL y errores (CA-2, CA-6, CA-18, CA-26, CA-27)
  - Archivos: src/lib/compliance/routes.ts, src/lib/compliance/loadErrors.ts
  - Test primero: __tests__/complianceActions/routes.test.ts — cola: sin params → `RESPONDED`, página 1; `status`
    inválido → defecto; `ALL` → `requestQueueApiParams` sin `status`; página base 0 hacia la API; `requestQueuePath`
    omite valores por defecto; `requestDetailPath(uuid)`; alertas: `all=1` → `pendingOnly: false`, sin él `true`;
    catálogo: `tab` inválido → `REGIME`; ningún constructor acepta más claves que `status`, `page`, `tab`, `all`.
    __tests__/complianceActions/actionErrors.test.ts — `requestDetailLoadView` (404/400 → `not-found`, 403,
    red → `error`); `actionErrorMessage` (400 con `message` tal cual, 400 sin `message`, 403, 500, error de red).
  - Verificar: npx vitest run __tests__/complianceActions/routes.test.ts __tests__/complianceActions/actionErrors.test.ts __tests__/complianceTaxReview/routes.test.ts

- [x] T3 · Formularios del requerimiento (CA-4, CA-5, CA-7, CA-8, CA-9, CA-10; RN-1, RN-2, RN-3)
  - Archivos: src/lib/compliance/informationRequestForm.ts (nuevo)
  - Test primero: __tests__/complianceActions/informationRequestForm.test.ts — crear: sin motivo, sin relación,
    sin ítems, Documento sin tipo, Campo sin ruta, límites (1000/1000/100/500/500) dan error en su `path`;
    `buildCreateRequestBody` recorta, omite `dueDate`/`acceptableResponse`/`fieldPath`/`establishmentId`/`alertId`
    vacíos o que no aplican al tipo, conserva `commercialPublicId` y `alertId` si viene; `extractDuplicateRequestId`
    con el mensaje real de la API (devuelve el UUID) y sin UUID (`null`); revisar: `INSUFFICIENT` con nota vacía o
    de espacios falla, `SUFFICIENT` sin nota → `{ result }`; anular sin motivo falla; `requestActions` por cada uno
    de los seis estados (review solo `RESPONDED`; cancel en `OPEN`/`RESPONDED`/`OBSERVED`; finding en los no
    cerrados; nada en `CLOSED_*`/`CANCELLED`).
  - Verificar: npx vitest run __tests__/complianceActions/informationRequestForm.test.ts

- [x] T4 · Hallazgo e incidencia (CA-11 a CA-14, CA-16, CA-17; RN-4 a RN-7)
  - Archivos: src/lib/compliance/findingForm.ts (nuevo)
  - Test primero: __tests__/complianceActions/findingForm.test.ts — `allowedMeasures` para las cinco
    clasificaciones (`SUBSANABLE_ERROR` e `ISOLATED_INCONSISTENCY` → solo `NONE`, `WARNING`);
    `measureAfterClassificationChange` vacía una medida ya no permitida y conserva una permitida;
    `expressRefusalAvailable` con historial sin negativa, con una, vacío y `undefined` (no cargó → `false`);
    `changesAccount` solo `PREVENTIVE_RESTRICTION`/`SUSPENSION` (no `TERMINATION_REFERRAL`); `companyNameMatches`
    (mayúsculas y espacios de los extremos sí, otra cadena no, nombre `null` → `false`); esquema: sin hecho,
    afectación, fundamento o `remediable: null` falla en cada campo; medida no permitida para la clasificación
    falla; `buildFindingBody` sin claves vacías y con `requestPublicId` solo si viene; incidencia sin contexto o
    sin descripción falla.
  - Verificar: npx vitest run __tests__/complianceActions/findingForm.test.ts

- [x] T5 · Alertas y reglas (CA-18 a CA-22; RN-8, RN-9)
  - Archivos: src/lib/compliance/alerts.ts, src/lib/compliance/alertRules.ts (nuevos)
  - Test primero: __tests__/complianceActions/alerts.test.ts — `parseDataUsed` con el JSON que arma
    `ComplianceAlertServiceImpl` (claves `…Cents` → pesos con `formatCents`), con JSON roto, con un arreglo o un
    escalar (→ `null`); `alertOriginLabel` con y sin regla; revisión sin nota o > 1000 falla.
    __tests__/complianceActions/alertRules.test.ts — `parseRuleParams` válido y roto; `groupRulesByCode` (activa
    primero, resto por versión desc., grupos sin activa); `nextVersionFor` (código nuevo → `null`, existente →
    máx + 1); esquema: valores por defecto con los tres umbrales vacíos (`''`) y vacíos fallan; código inválido,
    días < 7 o no entero, % < 0,01, pesos negativos fallan; % con coma; `buildRuleBody` envía centavos y
    `ruleType: 'PLATFORM_SALES_GROWTH'`.
  - Verificar: npx vitest run __tests__/complianceActions/alerts.test.ts __tests__/complianceActions/alertRules.test.ts

- [x] T6 · Catálogo (CA-24; RN-10)
  - Archivos: src/lib/compliance/taxCatalog.ts (nuevo)
  - Test primero: __tests__/complianceActions/taxCatalog.test.ts — agregar sin fundamento o sin "Vigente desde"
    falla; límites 30/200/500; cuerpo recortado con el `catalogType` de la pestaña; retirar con `validTo` anterior
    a `validFrom` falla, igual o posterior pasa.
  - Verificar: npx vitest run __tests__/complianceActions/taxCatalog.test.ts

- [x] T7 · Servicios, claves, invalidaciones y hooks (CA-8, CA-10, CA-15, CA-17, CA-20, CA-23; RN-11)
  - Archivos: src/services/compliance/ComplianceRequestService.ts y ComplianceAlertService.ts (nuevos),
    ComplianceCaseService.ts, ComplianceTaxProfileService.ts, src/hooks/compliance/complianceKeys.ts,
    useComplianceRequests.ts y useComplianceAlerts.ts (nuevos), useComplianceCase.ts, useComplianceTaxProfiles.ts
  - Test primero: __tests__/complianceActions/complianceActionServices.test.ts (mismo `vi.mock('@/lib/api/client')`
    que `__tests__/complianceTaxReview/complianceServices.test.ts`): método, ruta y cuerpo de cada endpoint de la
    tabla del contrato; `pendingOnly` y `size: 20`; cola sin `status` cuando es `ALL`.
    __tests__/complianceActions/complianceActionKeys.test.ts: claves únicas y prefijos (`queue` bajo `queueAll`,
    `list` bajo `alerts.all`); cada fila de la tabla de invalidaciones de `plan.md` (crear con y sin `alertId`,
    hallazgo con y sin requerimiento, catálogo → `complianceTaxCatalogKeys.all`). Las pruebas de la 017 de claves
    siguen en verde.
  - Verificar: npx vitest run __tests__/complianceActions __tests__/complianceTaxReview && npx tsc --noEmit
  - Nota: se actualizó la lista de métodos esperada en `__tests__/complianceTaxReview/complianceServices.test.ts`
    (ahora incluye las altas de la 018). `TAX_CATALOG_TYPE_LABELS`, `REQUEST_ITEM_TYPE_LABELS` y
    `COMMUNICATION_CHANNEL_LABELS` son `Record<…, string>`; solo `DELIVERY_STATUS_LABELS` es `ToneLabel`.
    El tope del `context` de la incidencia es 100 (lo fija la API), no lo da la spec. En T3, T4, T5 y T6 la
    implementación se escribió junto a la prueba: no se vio el rojo previo.

## Bloque B · Interfaz, caso, barridos y puertas

Cada diálogo: `Dialog` con `dismissible={!isPending}`, guarda `useRef(false)` en la primera línea de `onSubmit`,
`zodResolver`, botón deshabilitado con indicador, `actionErrorMessage` en el diálogo sin perder lo escrito.

- [x] T8 · Requerimientos: cola, detalle, revisar, anular y crear (CA-2 a CA-9)
  - Archivos: src/components/compliance/requests/{RequestQueue,RequestDetail,RequestCommunications,
    RequestReviewDialog,RequestCancelDialog,CreateRequestDialog}.tsx, src/app/compliance/information-requests/page.tsx,
    src/app/compliance/information-requests/[requestPublicId]/page.tsx
  - Test: lo cubren T2–T3 y el barrido de T12.
  - Verificar: npx tsc --noEmit && npx vitest run __tests__/middleware

- [x] T9 · Hallazgo, incidencia y caso del empresario (CA-11 a CA-17; reemplaza RN-10 de la 017)
  - Nota: la prueba de la 017 se reescribió junto con la implementación (no se vio el rojo previo). Los textos de los botones viven en `COMPLIANCE_ACTION_UI`; la prueba comprueba el uso en la pestaña y el literal en el diccionario.
  - Archivos: src/components/compliance/findings/{FindingDialog,AccountMeasureConfirmDialog,IncidentDialog}.tsx,
    src/components/compliance/case/{CaseRequestsTab,CaseFindingsTab,CaseIncidentsTab,CommercialCase}.tsx; botón
    "Registrar hallazgo" en `RequestDetail.tsx`; __tests__/complianceTaxReview/complianceStatic.test.ts
  - Test primero: reescribir el bloque "pestañas de solo lectura (RN-10, CA-22)" para exigir ahora "Nuevo
    requerimiento", "Registrar hallazgo", "Registrar incidencia" y un `Link` al detalle en `CaseRequestsTab`
    (falla antes del cambio); se conservan la prueba de `CaseCommitmentTab` y S6. D-1 del plan: sin nombre de
    empresa, las dos medidas que cambian la cuenta quedan deshabilitadas con su motivo.
  - Verificar: npx vitest run __tests__/complianceTaxReview && npx tsc --noEmit

- [x] T10 · Alertas y reglas de alerta (CA-10, CA-18 a CA-23)
  - Archivos: src/components/compliance/alerts/{AlertsList,AlertCard,AlertDataTable,AlertReviewDialog}.tsx,
    src/components/compliance/alert-rules/{AlertRules,AlertRuleGroup,AlertRuleDialog}.tsx,
    src/app/compliance/alerts/page.tsx, src/app/compliance/alert-rules/page.tsx
  - Test: T5, T7 y el barrido de T12.
  - Verificar: npx tsc --noEmit

- [x] T11 · Catálogo tributario y menú (CA-1, CA-24)
  - Archivos: src/components/compliance/tax-catalog/{TaxCatalog,CatalogEntryDialog,RetireCatalogEntryDialog}.tsx,
    src/app/compliance/tax-catalog/page.tsx, src/components/compliance/ComplianceLayout.tsx (`NAV`)
  - Test: T6 y el barrido de T12.
  - Verificar: npx tsc --noEmit

- [x] T12 · Barrido estático y PII (CA-1, CA-6, CA-18, CA-24 a CA-27; P-2, P-6, P-16)
  - Archivos: __tests__/complianceActions/complianceActionsStatic.test.ts (usa `stripComments`, `mentions` y
    `guardsDoubleSubmit` de `__tests__/complianceTaxReview/staticScan.ts`)
  - Casos: las cinco `page.tsx` sin `'use client'` y con `await params`/`await searchParams`; los archivos nuevos
    sin `console.`, `localStorage`, `sessionStorage`, `<img`, `URLSearchParams` ni `any`; cada diálogo con
    `guardsDoubleSubmit` y `dismissible={!`; `router.push`/`href` de las pantallas nuevas solo con los
    constructores de `routes.ts`; `RequestDetail` comprueba `isUuid` antes de la consulta; `AlertCard` no recorta
    `message` (`slice`, `substring`, `line-clamp`, `truncate`); el catálogo con `role="tablist"` y sin "Editar" ni
    "Eliminar"; `NAV` con los cuatro `href` nuevos; `src/middleware.ts` y `routeAccess.ts` sin cambios (CA-25).
    Debe fallar antes de T8–T11 (archivos ausentes).
  - Verificar: npx vitest run __tests__/complianceActions/complianceActionsStatic.test.ts __tests__/middleware

- [ ] T13 · Comprobación manual (todas las CA de interfaz)
  - Preparar: API local con un oficial y un empresario con ficha enviada; `npx next dev`, `MIDDLEWARE=ACTIVE`;
    DevTools abiertas (consola, red, almacenamiento).
  - Lista:
    - CA-1: menú con las 4 entradas en escritorio; cada una abre su ruta.
    - CA-2: `/compliance/information-requests` arranca en "Por revisar"; cambiar filtro/página cambia la URL y
      sobrevive a recargar; "Todos" sin `status` en la red; fila con clic y con Tab+Enter.
    - CA-3: detalle con cabecera, ítems, línea de tiempo, comunicaciones; forzar una `FAILED` (o fixture) y ver el aviso.
    - CA-4/CA-5: "Insuficiente" sin nota no sale petición; con nota, cuerpo `{result, notes}`; "Suficiente" `{result}`;
      anular con motivo deja el detalle sin acciones.
    - CA-6: `/compliance/information-requests/abc` sin petición en la red; un UUID inexistente → mensaje 404.
    - CA-7 a CA-9: crear desde el caso con cada error; envío válido abre el detalle y el cuerpo no trae claves
      vacías; repetirlo → mensaje de duplicado y "Abrir el requerimiento existente".
    - CA-10/CA-20: desde una alerta, "Abrir requerimiento" con tipo preseleccionado y `alertId`; la alerta queda
      revisada con enlace; "Marcar revisada" sin nota no envía; con nota sale de "Solo pendientes".
    - CA-11 a CA-16: clasificaciones y medidas deshabilitadas con su motivo; "Negativa expresa" según el
      compromiso; diálogo rojo, "Confirmar" solo con el nombre; "Cancelar" sin petición; remisión sin diálogo;
      tras guardar, aviso de estado aplicado y requerimiento cerrado.
    - CA-17: incidencia aparece en la pestaña; sin contexto no envía.
    - CA-18/CA-19: `?all=1` al apagar "Solo pendientes"; `message` completo; "Ver datos" en pesos; JSON roto (fixture) → texto de error.
    - CA-21 a CA-23: regla nueva con umbrales vacíos; validaciones; aviso N+1 con código existente; centavos en
      la red; "Desactivar" pide confirmación.
    - CA-24: pestañas por tipo con flechas; agregar y retirar con fecha anterior bloqueado; nota de RN-10.
    - CA-25: con un consumidor y sin sesión, las cinco rutas redirigen.
    - CA-26: doble clic en cada "Guardar" → una sola petición; Escape no cierra mientras envía; un 400 deja lo escrito.
    - CA-27: tras usar todos los diálogos, la consola, la URL y Local/Session Storage no tienen motivos, hechos,
      evidencias, notas ni `dataUsedJson`.
    - Escritorio (1280 px): diálogos largos con scroll interno. Sin comprobaciones en móvil (decisión del usuario).
  - Verificar: anotar en el PR qué se comprobó y cómo (P-17).

- [x] T14 · Puertas finales (CA-25, CA-28)
  - Nota: corrido `npm test`, `npx next lint` (348 avisos = tope, sin cambio), `npm run build` y `npx tsc --noEmit`; `lint:ci` y `audit:ci` no se corrieron (lint:ci falla en Windows; audit:ci no se pidió).
  - Verificar (con las variables públicas ficticias de `CLAUDE.md`): `npm test`, `npm run lint:ci` (sin subir
    `.lint-max-warnings`; si baja, dejar el número que indique), `npm run build`, `npx tsc --noEmit` (después del
    build), `npm run audit:ci`. `package.json` y `package-lock.json` sin cambios.

## Correcciones de la ronda 1

- [x] B1 · `RequestCommunications.tsx` muestra `errorDetail` en la fila de una entrega fallida (CA-3); prueba estática en `complianceActionsStatic.test.ts`, vista en rojo antes del arreglo.
- [x] S1 · Cola con columna "Emitido por" ("Sistema" / "Compliance"); el detalle dice "Compliance".
- [x] S2 · Detalle con "Cerrada el …" y notas de cierre; 404 con "Volver a la cola"; adjuntos rotulados por tipo de documento (textos en el diccionario).
- [x] S3 · `CreateRequestDialog` con las tres ayudas de la spec (motivo, relación, plazo).
- [x] S4 · Reglas de alerta: botón "Nueva versión" por grupo, con el código fijo y el aviso N+1.
- [x] S5 · Catálogo: insignia "Activo" y vacío con botón "Agregar código".
- [x] S6 · Comentario de `CaseFindingsTab.tsx` sin "de solo lectura".
- [x] S7 · `FindingDialog.tsx`: guarda explícita en `onSubmit` si la medida cambia la cuenta y no hay nombre de empresa.
