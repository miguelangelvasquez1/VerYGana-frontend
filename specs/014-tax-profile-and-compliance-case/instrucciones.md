# 014 · Caracterización tributaria, compromiso de formalización, expediente y requerimientos

- **Estado:** Instrucciones de trabajo (base para redactar `spec.md` con el coordinator)
- **Fecha:** 2026-10-27
- **Origen:** API (backend ya implementado) · numerales 1.7, 4.7 y 4.8 del contrato
- **Roles:** `ROLE_COMMERCIAL` (empresario) y `ROLE_COMPLIANCE_OFFICER` (oficial de cumplimiento)

Este documento traduce dos fuentes a pasos concretos para **este** repositorio:

1. **Contrato con el backend** (`instrucciones-frontend-caracterizacion.md`): endpoints, DTOs,
   textos de estados y pantallas. Guárdalo junto a este archivo como
   `specs/014-tax-profile-and-compliance-case/backend-contract.md`. Es la única fuente de
   endpoints y campos: no se inventa ninguno.
2. **Numerales del contrato** (`Auxiliar-2.pdf`): las reglas legales que explican el porqué.
   Están resumidas en la sección 2.

Donde el documento del backend propone una estructura de carpetas o rutas distinta a la del
repo, **manda este documento** (sección 3). Donde habla de endpoints, campos o textos, **manda
el del backend**.

---

## 1. Cómo llevarlo con el flujo de specs

Es mucho trabajo para una sola spec. Recomendación: cuatro entregas, cada una con su `spec.md`
y su Puerta 1 (`claude --agent coordinator`):

| Entrega | Carpeta sugerida | Contenido | Depende de |
|---|---|---|---|
| A | `014-tax-profile-and-compliance-case` | Tipos, servicios y utilidades compartidas (fase 1) + ficha tributaria y establecimientos del empresario (fases 2 y 3) | — |
| B | `015-formalization-commitment` | Compromiso en la aprobación del contrato (fase 4) | A (tipos) |
| C | `016-commercial-expediente-requests` | Expediente documental y solicitudes de información del empresario (fases 5 y 6) | A |
| D | `017-compliance-commercial-case` | Todas las pantallas de compliance (fases 7 a 11) | A, B, C |

Si prefieres una sola spec, usa las fases de la sección 4 como orden de `tasks.md`.

---

## 2. Reglas legales que el front no puede romper (de los numerales 1.7, 4.7 y 4.8)

Cada una debe aparecer como regla de negocio (RN) en la spec que la toque.

| # | Regla | Dónde aplica | Numeral |
|---|---|---|---|
| L-1 | La casilla del compromiso **siempre arranca desmarcada**. No se marca por navegar, pagar, enviar un formulario, marcar otra casilla ni pulsar "Aprobar". No se inicializa desde `localStorage`, estado guardado ni datos del servidor. | Aprobación del contrato | 4.7 E, "Casilla no premarcada" |
| L-2 | El compromiso se manifiesta **una sola vez** y **solo** en la aprobación del contrato (apartado 9 de la Hoja Final). En la ficha tributaria y el perfil se muestra en solo lectura, sin casilla. | Ficha, perfil, contrato | 1.7, 4.7 D |
| L-3 | El texto se muestra **literal y completo** (`fullText`), nunca resumido en la etiqueta de la casilla. | Contrato y modal de lectura | 4.7 "Texto íntegro" |
| L-4 | No marcar la casilla **nunca bloquea** la aprobación del contrato. La falta de manifestación lleva a aclaración, no a rechazo. | Contrato | 4.7 E |
| L-5 | "No manifestado", "falla técnica" y "negativa expresa" son tres estados distintos y se muestran distinto. Una falla técnica nunca se presenta como negativa. | Contrato, perfil, compliance | 4.7 "Aclaración y negativa" |
| L-6 | Aceptar el compromiso **no cambia** la condición frente al IVA, el régimen, la vocación, la comisión ni el plan. Ningún texto de la UI puede sugerirlo. | Todos los textos | 4.7 c, 4.7 D |
| L-7 | Las alertas son **informativas**: no son asesoría profesional ni sanción. El mensaje se muestra completo, sin recortar su alcance. | Alertas | 1.7 D, 4.7 "Alertas" |
| L-8 | Los ingresos incluyen operaciones fuera de VERYGANA y no se suman dos veces (un total que ya incluye VERYGANA no se combina con otro del mismo periodo). | Ficha, sección e) | 4.7 e |
| L-9 | Una URL, red social o correo no es un establecimiento. Las sedes no se editan ni se borran: se cierran con motivo. | Establecimientos | 4.7 f |
| L-10 | Los documentos no se borran: se reemplazan y el anterior queda en el historial. | Expediente | 4.7 a E, 4.8 |
| L-11 | Responder una solicitud **no la cierra**; la cierra compliance al revisar. Subir un archivo no es subsanar. | Solicitudes | 4.8 B |
| L-12 | Un requerimiento pide elementos concretos; no existe la opción "actualizar toda la información". | Crear requerimiento | 4.8 "Identificación de lo pendiente" |
| L-13 | Un error subsanable o una inconsistencia aislada no justifica restringir ni suspender. Las medidas que cambian la cuenta piden confirmación explícita. | Hallazgos | 4.8 "Medidas" |
| L-14 | Ningún umbral, tarifa ni condición tributaria va escrito en el código: salen del catálogo y de las reglas de alerta del backend. Las reglas de alerta no tienen valores por defecto. | Catálogo, reglas, ficha | 4.7 D, 4.8 D |
| L-15 | Mencionar un asesor contable no le da acceso a la plataforma (texto fijo en la sección h). | Ficha, sección h) | 4.7 h |

---

## 3. Adaptación al repositorio

### 3.1 Dónde va cada cosa

El documento del backend sugiere `types/`, `api/` y `features/`. En este repo es así:

| Backend sugiere | En este repo |
|---|---|
| `types/taxProfile.ts` | `src/types/commercial/TaxProfile.types.ts` |
| `types/expediente.ts` | `src/types/commercial/Expediente.types.ts` |
| `types/declarations.ts` | `src/types/commercial/Declaration.types.ts` |
| `types/informationRequests.ts` | `src/types/compliance/InformationRequest.types.ts` (carpeta nueva; los tipos los usan ambos roles) |
| `api/taxProfile.api.ts`, `expediente.api.ts`, `declarations.api.ts`, `informationRequests.api.ts` | `src/services/commercial/TaxProfileService.ts`, `ExpedienteService.ts`, `DeclarationService.ts`, `InformationRequestService.ts` |
| `api/compliance.*.api.ts` | `src/services/compliance/ComplianceTaxProfileService.ts` y `ComplianceInformationRequestService.ts` (carpeta nueva; **no** agrandar `src/services/ComplianceService.ts`) |
| hooks | `src/hooks/commercial/` y `src/hooks/compliance/` (carpeta nueva), con TanStack Query |
| `features/commercial/...` | componentes en `src/components/commercial/tax-profile/`, `establishments/`, `expediente/`, `information-requests/` |
| `features/compliance/...` | componentes en `src/components/compliance/tax-profiles/`, `commercial-case/`, `information-requests/`, `findings/`, `alerts/`, `tax-catalog/` |
| `shared/StatusBadge`, `ConfirmDialog` | revisar primero `src/components/compliance/ui/primitives.tsx` y `src/components/shared/`; crear solo si no existe |
| `labels.ts` | `src/lib/labels/taxCompliance.ts` (diccionario único de la sección 3 del backend) |
| `approveContract` nuevo | modificar `src/services/commercial/OnboardingService.ts` (no crear otro) |

Las llamadas pasan por `apiClient` de `src/lib/api/client.ts`, salvo el `PUT` a la URL
prefirmada de R2, que va con `fetch` y **sin** cabecera `Authorization` (igual que
`OnboardingService.uploadDocumentFile`). No reimplementes el manejo de 401/402/503 en los
servicios: ya lo hace el interceptor.

### 3.2 Rutas en inglés (P-18)

El documento del backend sugiere `/perfil/...` y `/compliance/empresarios/...`. El código va
en inglés, así que las rutas son:

| Backend sugiere | Ruta en este repo | Archivo |
|---|---|---|
| `/perfil/informacion-tributaria` | `/commercial/profile/tax-info` | `src/app/commercial/profile/tax-info/page.tsx` |
| `/perfil/establecimientos` | `/commercial/profile/establishments` | `src/app/commercial/profile/establishments/page.tsx` |
| `/perfil/expediente` | `/commercial/profile/documents` | `src/app/commercial/profile/documents/page.tsx` |
| `/perfil/solicitudes` | `/commercial/profile/information-requests` (+ `/[requestId]`) | `src/app/commercial/profile/information-requests/...` |
| `/compliance/fichas-tributarias` | `/compliance/tax-profiles` (+ `/[commercialPublicId]`) | `src/app/compliance/tax-profiles/...` |
| `/compliance/empresarios/:publicId` | `/compliance/commercials/[commercialPublicId]` | `src/app/compliance/commercials/[commercialPublicId]/page.tsx` |
| `/compliance/requerimientos` | `/compliance/information-requests` (+ `/[requestId]`) | `src/app/compliance/information-requests/...` |
| `/compliance/alertas` | `/compliance/alerts` | `src/app/compliance/alerts/page.tsx` |
| `/compliance/reglas-alerta` | `/compliance/alert-rules` | `src/app/compliance/alert-rules/page.tsx` |
| `/compliance/catalogo-tributario` | `/compliance/tax-catalog` | `src/app/compliance/tax-catalog/page.tsx` |

Los textos visibles siguen en español ("Información tributaria", "Mi expediente", etc.).

### 3.3 Protección de rutas (P-4, P-5)

- Todas las rutas nuevas caen bajo `/commercial` o `/compliance`, que ya están en el `matcher`
  y en la lógica del middleware. **No hay que tocar `src/middleware.ts`.**
- El paso de onboarding vive en `/commercial-onboarding` (público en `routeAccess.ts`): no se
  agrega ruta nueva, solo un paso del asistente.
- Aun así, corre `npx vitest run __tests__/middleware` después de crear las páginas: la prueba
  recorre `src/app` y falla si alguna queda sin clasificar.
- `ROLE_ADMIN` no entra a `/compliance/*` (el middleware ya lo impide y la API responde 403).
  Ocultar un botón no protege un dato: la API decide (P-5).

### 3.4 Principios que más se van a tocar

| Principio | Qué implica aquí |
|---|---|
| P-2 | Cada `page.tsx` nueva es de servidor y solo renderiza un componente de cliente. Nada de `'use client'` en la página. |
| P-6 | En las páginas con `[commercialPublicId]` o `[requestId]`, `params` es una promesa: `const { commercialPublicId } = await params`. |
| P-10 | Todos los datos del backend con hooks de TanStack Query. Una fábrica de claves por dominio (como `commercialDashboardKeys` en `src/hooks/commercial/useCommercialDashboard.ts`) y cada mutación invalida lo que deja viejo (tabla en 3.5). |
| P-11 | Todos los formularios con `react-hook-form` + `zodResolver` (ejemplo existente: `src/app/(consumer)/explore/profile/edit/page.tsx`). Botón deshabilitado mientras `isSubmitting` para evitar doble envío. Los errores `details` del 400 se pasan con `setError(campo, …)`; la clave ya viene con la ruta del campo (`activities[0].ciiuCode` → convertir a `activities.0.ciiuCode`). |
| P-9 | Sin `any`. Los errores de axios se leen con un tipo `ApiError` y un guardia, no con `as any`. |
| P-16 | Nunca en `console.*`, URLs ni `localStorage`: NIT, cédula del representante, `holderIdentification`, direcciones, montos de ingresos, `downloadUrl` ni `uploadUrl` (son URL firmadas). El `publicId` (UUID) sí puede ir en la ruta. No hacer `console.error(err)` con el error de axios completo. |
| P-17 / P-13 | La lógica pura va en funciones sueltas con prueba en `__tests__/` (lista en 4.12). |
| P-19 | El tope de avisos de lint solo baja: el código nuevo no puede sumar avisos (`<img>`, `any`, dependencias de hooks). |

### 3.5 Claves de consulta e invalidaciones (P-10)

| Mutación | Invalida |
|---|---|
| `submitTaxProfile` | ficha propia, lista de versiones, estado del onboarding |
| `createEstablishment`, `closeEstablishment` | establecimientos, ficha propia |
| `confirmExpedienteUpload` | expediente propio |
| `approveContract` | estado del onboarding, contrato, ficha propia (trae `formalizationCommitment`) |
| `respondInformationRequest` | lista y detalle de solicitudes propias |
| `reviewTaxProfileSection` | ficha del empresario en compliance, cola de fichas (usar la respuesta con `setQueryData`) |
| `reviewDocument` | documentos del empresario en compliance |
| `create/review/cancelInformationRequest` | búsqueda de requerimientos, detalle, requerimientos del caso |
| `recordFinding` | hallazgos del caso, requerimiento relacionado, búsqueda de requerimientos |
| `recordIncident` | incidencias del caso |
| `reviewAlert` | lista de alertas |
| `createAlertRule`, `deactivateAlertRule` | reglas de alerta |
| `createCatalogEntry`, `retireCatalogEntry` | catálogo de compliance y catálogo del empresario |

### 3.6 Detalles técnicos que no dice el backend

- **204 sin cuerpo:** axios devuelve `data === ""` en `GET /commercials/tax-profile`. El servicio
  devuelve `null` si `response.status === 204`.
- **Fechas `YYYY-MM-DD`:** no usar `new Date('2026-10-27')` para mostrarlas (se interpreta en UTC
  y en Colombia sale el día anterior). Formatear la cadena directamente. Las fechas con hora se
  muestran con `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })`.
- **Dinero:** funciones `pesosToCents` (multiplica por 100 y redondea) y `formatCents` (COP) en
  `src/lib/money/cents.ts`, con prueba. No usar `parseFloat` sin redondear.
- **`PagedResponse`:** ya existe en `src/types/Generic.types.ts`. Comprobar que su `meta` coincide
  con la del backend (`hasNext`, `hasPrevious`, `sorted`) antes de reutilizarlo; si no, ampliarlo,
  no duplicarlo.
- **`OnboardingStep`** vive en `src/services/commercial/OnboardingService.ts` (no en `src/types`).
- **Toasts:** el repo usa `react-hot-toast`. No agregar otra librería (P-1).
- **Municipios:** reutilizar `useDepartments` y `useMunicipalities` de `src/hooks/useLocation.ts`.
- **`Idempotency-Key`:** `crypto.randomUUID()`, guardado en estado (`useRef`), nunca en
  `localStorage`.

---

## 4. Fases de trabajo

Cada fase termina con `npm run lint:ci`, `npm test`, `npm run build` y `npx tsc --noEmit` en
verde.

### Fase 1 · Base compartida (sin pantallas)

1. Crear los cuatro archivos de tipos de la sección 3.1, copiando los tipos de la sección 1 del
   backend **tal cual** (los nombres de campo coinciden con el JSON).
2. Agregar `'TAX_PROFILE_PENDING'` a `OnboardingStep`, entre `DOCUMENTS_PENDING` y
   `CONTRACT_PENDING`. El `Record<WizardStep, number>` de `OnboardingWizard.tsx` dejará de
   compilar: es lo esperado, se arregla en la fase 2.
3. Crear los servicios de la sección 3.1 con las firmas de la sección 2 del backend.
4. Crear los hooks de lectura y mutación con su fábrica de claves (sección 3.5).
5. Crear `useExpedienteUpload` en `src/hooks/commercial/useExpedienteUpload.ts`:
   `prepareExpedienteUpload` → `PUT` a `uploadUrl` (con `Content-Type` igual al declarado, sin
   `Authorization`) → `confirmExpedienteUpload`. Si falla el paso 3 el archivo no cuenta: el
   reintento empieza desde el paso 1. Devuelve el `ExpedienteDocument` confirmado (las solicitudes
   necesitan su `id`). Validar tipo (PDF, JPG, PNG) y tamaño con el mismo límite del paso de
   documentos del onboarding.
6. Crear el diccionario de textos y colores (`src/lib/labels/taxCompliance.ts`) con la tabla de
   la sección 3 del backend, y un `StatusBadge` que lo use.
7. Crear las utilidades puras de 4.12 con sus pruebas.

### Fase 2 · Onboarding: paso "Ficha tributaria"

Archivos: `src/components/commercial/onboarding/OnboardingWizard.tsx` y un paso nuevo
`src/components/commercial/onboarding/steps/5b-TaxProfileStep.tsx` (o renumerar los siguientes).

1. En `STEP_LABELS` agregar "Ficha tributaria" entre "Documentos" y "Contrato", y correr los
   índices de `STEP_INDEX` (contrato pasa a 6, pago a 7). Agregar `TAX_PROFILE_PENDING: 5`.
2. **Cambiar `handleDocumentsNext`:** después de `continueDocuments()`, volver a pedir
   `OnboardingService.getStatus()` y usar su `currentStep`. Hoy asume el contrato. Puede ser
   `TAX_PROFILE_PENDING` o `CONTRACT_PENDING` (si la ficha ya existía).
3. Crear el componente compartido `TaxProfileForm` en `src/components/commercial/tax-profile/`
   (se reutiliza en la fase 3). Secciones plegables a) a h) como en la sección 4.1 del backend.
   Esquema zod con:
   - al menos una actividad, exactamente una principal, CIIU `/^\d{4}$/` sin repetir;
   - `invoicingObligated`, `withholdingAgent` y `hasAccountingAdvisor` **sin valor por defecto**
     (en zod: `boolean` obligatorio; en el formulario, `undefined` al inicio y radios Sí/No, no un
     interruptor que arranque en "No");
   - `currentCapacity` no vacío y los límites de longitud del DTO;
   - al menos un ingreso, `periodEnd >= periodStart`, `periodEnd <= hoy`, monto `>= 0`;
   - aviso de solapamiento (L-8) con el texto del backend, marcando las filas en conflicto.
4. Selectores de catálogo agrupados por `catalogType`. Sin entradas: deshabilitado con "Aún no
   disponible" y se envía `null`. Mostrar `code — label`. Nada de opciones escritas en el código
   (L-14).
5. Sección a): el selector de RUT usa los documentos tipo `RUT` del onboarding
   (`OnboardingService.getDocuments()`).
6. Sección f): resumen "Tienes N establecimientos activos" y botón que abre la gestión de sedes
   (componente de la fase 3) en un modal.
7. Bloque informativo fijo arriba y enlace "Leer el compromiso de formalización": modal que
   llama `getDeclaration('FORMALIZATION_COMMITMENT', 'TAX_PROFILE')`, muestra `fullText` en solo
   lectura, **sin casilla**, con la nota "Este compromiso se manifiesta al aprobar el contrato"
   (L-2, L-3).
8. "Guardar y continuar": convierte pesos a centavos, envía, invalida el estado del onboarding y
   navega al `currentStep` que devuelva el estado. En 400, `message` en toast y `details` bajo
   cada campo.
9. Si `getTaxProfile()` devuelve datos, precargar el formulario (edición).

### Fase 3 · Perfil del empresario: ficha y establecimientos

1. **`/commercial/profile/tax-info`** (sección 4.2 del backend):
   - Sin ficha (204): invitación a completarla con el mismo `TaxProfileForm`.
   - Cabecera con estado, versión y fecha; banner naranja si `OBSERVED`.
   - Vista de lectura por sección con su `sectionReviews` (o "Pendiente de revisión") y la nota
     si está observada.
   - Bloque del compromiso **sin casilla**, según la tabla del backend (`null`, `MANIFESTED`, y los
     otros tres con enlace a solicitudes). Respetar L-5.
   - "Editar ficha" con confirmación "Se creará la versión {n+1}…".
   - Pestaña "Historial" con las versiones en solo lectura.
2. **`/commercial/profile/establishments`** (sección 4.3): activos y cerrados, "Agregar sede"
   (zod que rechaza `http`, `www.` y `@` en la dirección; selector departamento → municipio
   existente), "Cerrar sede" con motivo obligatorio. Sin editar ni borrar; texto "Cierra esta sede
   y registra la correcta" (L-9). El mismo componente se usa en el modal de la sección f).
3. Agregar los accesos en el perfil del comercial
   (`CommercialProfileSeller.tsx` y `CommercialProfilePremium.tsx`) o en el `Sidebar.tsx`
   (decidir en la spec).

### Fase 4 · Compromiso en la aprobación del contrato

Archivos: `ContractReviewStep` en `src/components/commercial/onboarding/steps/6-ContractStep.tsx`,
`handleApproveContract` en `OnboardingWizard.tsx` y `OnboardingService.approveContract`.

1. Cambiar `OnboardingService.approveContract()` a
   `approveContract(body: ContractApproveRequest, idempotencyKey: string)`, que manda el cuerpo y la
   cabecera `Idempotency-Key`. Verificar que la respuesta (`ContractSummary` en el backend) es el
   `OnboardingContract` actual; si no, ajustar el tipo.
2. Al montar el paso, `getDeclaration('FORMALIZATION_COMMITMENT', 'CONTRACT_SHEET')`.
3. Bloque "Hoja Final de Aceptación Electrónica · Apartado 9" con el diseño de la sección 4.4 del
   backend, entre el contrato y el botón Aprobar:
   - casilla con `decision` que arranca en `null` **siempre** (L-1);
   - enlace "No acepto este compromiso" con modal de confirmación, motivo opcional y chip
     "No aceptado — Deshacer";
   - si `manifestation?.status === 'MANIFESTED'`: sin casilla ni enlace, solo la evidencia, y se
     envía `decision: null`;
   - nota fija de que la casilla no es obligatoria y no cambia la situación tributaria (L-4, L-6).
4. "Aprobar contrato" siempre habilitado por la casilla (solo se deshabilita mientras envía).
   La clave de idempotencia se genera **una vez por intento** y se reutiliza si el usuario
   reintenta tras un error de red; se descarta tras un 200.
5. Si falla el GET de la declaración: mostrar el error y dejar aprobar sin `decision` (L-4).
6. Prohibido: premarcar, marcar al aprobar, resumir el texto en la etiqueta, poner la casilla en
   otra pantalla. Esto debe quedar como criterio de aceptación verificable.

### Fase 5 · Expediente documental del empresario

**`/commercial/profile/documents`** (sección 4.5 del backend):

1. Si el onboarding no está `COMPLETED`: "Disponible al terminar tu registro".
2. Agrupar por `documentType`: vigente (`VALIDATED`) arriba con insignia de revisión, "Vencido" si
   `expired`, "Vence el …", `reviewNotes`, "Ver" y "Reemplazar"; historial (`SUPERSEDED`) plegado.
3. "Reemplazar" con el aviso "El documento anterior quedará en tu historial" y
   `replacesDocumentId = vigente.id` (L-10). "Agregar documento" para tipos sin vigente.
4. Sin eliminar.
5. `downloadUrl` dura 5 minutos: volver a pedir la lista antes de abrir si pasó ese tiempo
   (`staleTime` menor a 5 minutos o refetch al hacer clic). No guardar la URL en ningún lado.

### Fase 6 · Solicitudes de información del empresario

**`/commercial/profile/information-requests`** y su detalle (sección 4.6 del backend):

1. Insignia en el menú con las solicitudes `OPEN` u `OBSERVED`, calculada desde la lista.
2. Pestañas "Pendientes" (`OPEN`, `OBSERVED`, `RESPONDED`) e "Historial".
3. Detalle: qué se pide (con "Cargar documento" en ítems `DOCUMENT` usando `useExpedienteUpload`
   y el aviso de `linkedDocumentId`), por qué, la línea de tiempo y el formulario de respuesta
   solo en `OPEN` u `OBSERVED` (zod: texto o al menos un documento).
4. Mensaje tras responder: "Recibimos tu respuesta… la solicitud se cierra cuando termine la
   revisión" (L-11).
5. Banner "No es una sanción" para `MISSING_MANIFESTATION`, `EXPRESS_REFUSAL` e `INCIDENT`.
6. Revisar `src/components/notifications/` y hacer que las notificaciones "Solicitud de
   información de VERYGANA" y "Tu respuesta tiene observaciones" naveguen aquí (confirmar con el
   backend cómo se identifican).

### Fase 7 · Compliance: menú y cola de fichas

1. Agregar a `NAV` de `src/components/compliance/ComplianceLayout.tsx`: "Fichas tributarias",
   "Requerimientos", "Alertas", "Catálogo tributario" y "Reglas de alerta", con íconos de
   `lucide-react`.
2. **`/compliance/tax-profiles`** (sección 5.1): tabla paginada, filtro por estado (`SUBMITTED`
   por defecto). La página y el tamaño pueden ir en la URL; ningún dato personal.

### Fase 8 · Compliance: revisión de ficha y documentos

1. **`/compliance/tax-profiles/[commercialPublicId]`** (sección 5.2): cabecera con empresa, NIT,
   estado y vocación con la nota "Solo para contrastar…"; secciones a la izquierda; revisión por
   sección a la derecha ("Observar" con nota obligatoria); comparador de versiones lado a lado
   resaltando cambios; accesos al caso y al expediente.
2. **Revisión de documentos** (sección 5.3), dentro del caso: modal con resultado, titular
   obligatorio al aceptar RUT, Cámara de Comercio, certificación bancaria o cédula; fechas con el
   check "tiene vigencia comprobable"; notas obligatorias al observar o rechazar. El 400 "titular
   no corresponde" se muestra tal cual. El titular nunca va a logs (P-16).

### Fase 9 · Compliance: caso del empresario

**`/compliance/commercials/[commercialPublicId]`** (sección 5.4), con pestañas Ficha,
Documentos, Compromiso, Requerimientos, Hallazgos e Incidencias. La pestaña activa puede ir en
`?tab=`. Enlazarla desde la cola de fichas, la de requerimientos y las alertas. (El backend
menciona "el listado de comerciales que ya existe": en compliance no hay uno; ver preguntas
abiertas.)

### Fase 10 · Compliance: requerimientos y hallazgos

1. **Cola y detalle** (sección 5.5): filtro por estado (`RESPONDED` por defecto), comunicaciones
   con aviso si `FAILED` (L-5), "Suficiente"/"Insuficiente", "Anular" con motivo, "Registrar
   hallazgo".
2. **`CreateInformationRequestForm`** (sección 5.6): ítems dinámicos con `useFieldArray`, campos
   condicionales por tipo (en zod con `discriminatedUnion` o `superRefine`), sin opción de
   "actualizar todo" (L-12). Si el 400 trae el `publicId` de uno idéntico abierto, ofrecer abrirlo.
3. **`FindingForm`** (sección 5.7), lo más sensible:
   - con `SUBSANABLE_ERROR` o `ISOLATED_INCONSISTENCY` solo se permiten `NONE` y `WARNING` (L-13);
   - `EXPRESS_REFUSAL` solo si el historial del compromiso tiene una negativa expresa;
   - `PREVENTIVE_RESTRICTION` y `SUSPENSION` piden un `ConfirmDialog` rojo con el nombre de la
     empresa escrito o un check;
   - `TERMINATION_REFERRAL` muestra que no cambia el estado de la cuenta;
   - tras guardar, mostrar `accountStatusApplied` si cambió.
   Las reglas de medidas permitidas van en una función pura con prueba (4.12), no solo en el JSX.

### Fase 11 · Compliance: alertas, reglas y catálogo

1. **`/compliance/alerts`** (sección 5.8): "Solo pendientes" activado, `message` completo (L-7),
   "Ver datos" con `dataUsedJson` como tabla (centavos en pesos; `JSON.parse` dentro de
   `try/catch`), "Marcar revisada" con nota, "Abrir requerimiento" con `alertId` y `trigger`
   sugerido.
2. **`/compliance/alert-rules`** (sección 5.9): agrupar por `code`, formulario **sin valores por
   defecto** en los umbrales (L-14), aviso de nueva versión si el código existe, nota fija de
   alcance, "Desactivar" con confirmación.
3. **`/compliance/tax-catalog`** (sección 5.10): pestañas por tipo, "Agregar código" con fundamento
   obligatorio, "Retirar" con fecha. Sin editar ni borrar.

### 4.12 Pruebas de lógica (Vitest, `__tests__/`)

Cada una se ve fallar antes de pasar (P-17):

| Archivo de prueba | Qué cubre |
|---|---|
| `__tests__/money/cents.test.ts` | pesos ↔ centavos, redondeo, formato COP |
| `__tests__/taxProfile/incomeOverlap.test.ts` | solapamiento por concepto y periodo; `CONSOLIDATED_INCLUDES_PLATFORM` con otro alcance; dos del mismo alcance; periodos que no se cruzan pasan |
| `__tests__/taxProfile/taxProfileSchema.test.ts` | una sola actividad principal, CIIU de 4 dígitos sin repetir, booleanos sin elegir rechazados, `periodEnd` futuro rechazado |
| `__tests__/taxProfile/establishmentSchema.test.ts` | rechaza `http`, `www.` y `@` |
| `__tests__/declarations/commitmentState.test.ts` | estado inicial de la casilla siempre `null`; con `MANIFESTED` se envía `decision: null`; la clave de idempotencia se reutiliza en reintento y cambia en un intento nuevo |
| `__tests__/compliance/allowedMeasures.test.ts` | medidas permitidas por clasificación; `EXPRESS_REFUSAL` solo con negativa previa |
| `__tests__/api/apiErrorDetails.test.ts` | `activities[0].ciiuCode` → `activities.0.ciiuCode` |
| `__tests__/taxProfile/taxProfileService.test.ts` | 204 → `null` (simulando `apiClient`) |
| `__tests__/middleware/*` | ya existen: deben seguir en verde con las páginas nuevas |

Lo que no se pueda probar en `node` (por ejemplo, que la casilla aparezca desmarcada en pantalla)
se documenta en el PR con cómo se comprobó a mano (excepción de P-17). Si se quiere cubrir con
Playwright, hacen falta fixtures en `e2e/fixtures/api` para cada endpoint nuevo.

---

## 5. Checklist de aceptación

Usar el de la sección 7 del backend, más:

- [ ] Ninguna página nueva empieza con `'use client'` (P-2).
- [ ] Rutas en inglés y textos en español (P-18).
- [ ] Datos del backend solo por hooks de `src/hooks/**`; cada mutación invalida sus claves (P-10).
- [ ] Todos los formularios con `react-hook-form` + zod y sin doble envío (P-11).
- [ ] Ningún NIT, cédula, titular, dirección, monto ni URL firmada en `console.*`, URLs o
  `localStorage` (P-16).
- [ ] La casilla del compromiso no se inicializa desde ningún dato y no bloquea la aprobación
  (L-1, L-4).
- [ ] Ningún texto dice o sugiere que aceptar el compromiso cambia la situación tributaria (L-6).
- [ ] `routeProtection.test.ts` y `routeInventory.test.ts` en verde.
- [ ] `.lint-max-warnings` no sube; si baja, se actualiza (P-19).
- [ ] Al terminar: documentar en Notion los flujos nuevos (onboarding con ficha, aprobación con
  compromiso, ciclo de un requerimiento) con casos de uso y diagramas de secuencia.

---

## 6. Preguntas abiertas (resolver en la Puerta 1)

- [ ] ¿Una spec o cuatro (sección 1)?
- [ ] ¿Las pantallas del perfil van como enlaces dentro de "Mi perfil" o como entradas del
  `Sidebar` del comercial? ¿La insignia de solicitudes pendientes va en el `Sidebar` o en el
  `Header`?
- [ ] El backend pide enlazar el caso "desde el listado de comerciales que ya existe", pero en
  `/compliance` no hay un listado de comerciales. ¿Se crea uno, se enlaza desde KYC o contratos,
  o se omite?
- [ ] ¿`ContractSummary` (respuesta de `approveContract`) es igual a `OnboardingContract`?
- [ ] ¿Cómo identifica el backend las notificaciones de solicitudes (tipo o código) para navegar
  al detalle?
- [ ] ¿Límite de tamaño de archivo del expediente? (asumido: el mismo del onboarding).
- [ ] ¿Se cubren las pantallas nuevas con Playwright en esta entrega o en otra?
