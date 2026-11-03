# 015 · Plan: compromiso de formalización en la aprobación del contrato (entrega B)

- **Spec:** `spec.md` de esta carpeta (Estado: Aprobada, 2026-10-28).
- **Plan:** aprobado por el usuario el 2026-10-28 (Puerta 2), con las opciones por defecto de D-1 a D-5
  de la sección 15.
- **Contrato con la API:** `specs/014-tax-profile-and-compliance-case/backend-contract.md` (1.3, 2 y 4.4),
  comprobado contra el checkout de la API (solo lectura):
  `controllers/commercial/CommercialContractController.java`,
  `dtos/user/commercial/onboarding/ContractApproveRequestDTO.java` y `ContractSummaryResponseDTO.java`,
  `services/commercial/CommercialContractServiceImpl.java` (`businessApprove`, `generate`),
  `services/declarations/DeclarationServiceImpl.java` (`viewForCommercial`,
  `recordContractManifestation`, `classify`, `currentManifestation`),
  `exceptions/GlobalExceptionHandler.java` y `exceptions/commercial/OnboardingStepException.java`.
- **Depende de:** la entrega A (spec 014), implementada en el árbol de trabajo sin commitear. Este plan
  reutiliza sus tipos, servicio, claves, hook, diccionario, utilidades y `Dialog`; no los duplica.
- **Fecha del plan:** 2026-10-28. Lecturas sobre `dev` en `a911175` más el árbol de trabajo de la 014.
- **Tareas:** `tasks.md` de esta carpeta (13 tareas en 3 bloques).

## 1. Resumen

El paso "Revisa tu contrato" del onboarding pide el texto vigente del compromiso
(`context=CONTRACT_SHEET`) cada vez que se muestra. Además, muestra el bloque "Hoja Final de
Aceptación Electrónica" con la casilla, la negativa con motivo y la evidencia previa. La aprobación
se envía con el cuerpo `ContractApproveRequest` y la cabecera `Idempotency-Key`. Si falla, el
asistente relee el estado del onboarding (RN-9). La lógica (decisión, cuerpo, evidencia, clave,
desenlace del error, esquema del motivo y política de caché) va en funciones puras con prueba Vitest
escrita primero. No hay rutas nuevas, ni cambios de middleware, ni dependencias nuevas.

## 2. Lo que se encontró al leer el código

### 2.1 Front

- `ContractReviewStep` (`steps/6-ContractStep.tsx`, archivo sin `'use client'` que solo importa el
  asistente, que es de cliente) recibe `contract`, `submitting`, `onOpenContract` y
  `onApprove: () => void`. El aviso "Si tienes alguna objeción…" es el último bloque antes de
  `<StepButton … label="Aprobar contrato" />`, y ahí va el bloque nuevo. `StepButton` ya se deshabilita
  con `submitting`.
- `OnboardingWizard.tsx` (`'use client'`): `handleApproveContract` hace `if (submitting) return`,
  `approveContract()` sin cuerpo, `setContract(result)` y `setStep("VERYGANA_REVIEW_PENDING")`. Si
  falla, llama a `handleApiError`, que muestra un toast y hace `setErrors(details)`. La guarda
  `if (submitting)` lee el estado del render anterior, así que no frena un doble clic dentro del
  mismo tick: hace falta una guarda con `useRef`, como `submittingRef` en
  `src/components/admin/recognitions/NewRecognitionWizard.tsx`. El asistente relee el estado con
  `OnboardingService.getStatus()` + `syncRejectionState` + `setStep(status.currentStep)` /
  `onCompleted()` (`handleRefreshStatus`, `handleTaxProfileSaved` de la 014). El estado del onboarding
  **no** tiene consulta de TanStack Query: es deuda P-10 de ese archivo, y la 014 siguió el mismo patrón.
- `OnboardingService.approveContract()`: `apiClient.post(`${BASE}/contract/approve`)` sin cuerpo ni
  cabecera, y devuelve `OnboardingContract` (`contractId`, `version`, `status`, …). La cabecera ya se
  manda así en `src/services/admin/AdminRecognitionService.ts`
  (`headers: { "Idempotency-Key": idempotencyKey }`).
- Utilidades de idempotencia existentes:
  - `generateIdempotencyKey()` de `src/utils/prosperity.ts`, que usa `AdjustmentModal.tsx` y tiene
    un *fallback* con `Math.random`;
  - `newIdempotencyKey()` de `src/utils/recognitions.ts`, que usa `NewRecognitionWizard.tsx` y tiene
    un *fallback* con `crypto.getRandomValues`.

  Se reutiliza **`newIdempotencyKey`** (aleatoriedad criptográfica también en el *fallback*). No se
  crea una tercera. `recognitions.ts` solo importa tipos y `@/utils/keys`, así que se puede importar
  sin arrastrar componentes. El patrón de reutilizar o rotar la clave está en `NewRecognitionWizard`
  (`attemptRef` con `fingerprint`). Aquí la regla cambia (RN-8: se rota si cambia el cuerpo, sin mirar
  si el rechazo fue definitivo), así que se aísla en una función pura propia.
- Reutilizable de la 014:
  - `Declaration.types.ts`: `DeclarationView`, `Manifestation` (con `contractId` y
    `declarationVersion`), `ManifestationDecision` y `ContractApproveRequest`.
  - `DeclarationService.getDeclaration(code, context)`.
  - `taxProfileKeys.declaration(code, context)`. El contexto forma parte de la clave, así que
    `CONTRACT_SHEET` y `TAX_PROFILE` no comparten caché.
  - `useDeclaration(code, context, { enabled })`, con `staleTime` de 30 min.
  - `readApiError` (sin `any` y sin `config`).
  - `formatBogotaDateTime`.
  - `Dialog`: Escape, foco que entra y vuelve, y clic en el fondo o en la X llama a `onClose`.
  - `noPiiLeaks.test.ts`, con su lista `TARGETS`.
- **Choque con RN-10.** `useDeclaration` usa 30 min de `staleTime` y el `gcTime` por defecto
  (5 min). En `CONTRACT_SHEET`, si el empresario sale del paso y vuelve en menos de 5 minutos sin
  recargar, el componente se monta con el texto guardado en caché y "Aprobar" podría enviar esa
  versión antes de que llegue la nueva. La 014 usa el hook para `TAX_PROFILE` en
  `CommitmentTextDialog` y ahí los 30 min son deliberados (D-7 de la 014). Ver la sección 6.
- Valores por defecto de las consultas (`src/app/providers/ReactQueryProvider.tsx`): `staleTime` 60 s,
  `retry: 1`, `refetchOnWindowFocus: false`. Las mutaciones van sin reintento.
- El interceptor (`src/lib/api/client.ts`) ya muestra un toast ante un *timeout*
  ("El servidor tardó demasiado en responder…") y ante un 503. Un 401 lo renueva y reintenta una vez
  con la misma configuración, cabecera `Idempotency-Key` incluida. Si no puede renovarlo, cierra la
  sesión y redirige a `/login`. Nada de eso se reimplementa aquí.
- `.lint-max-warnings` = 348. Línea base de eslint sobre los archivos que se modifican (2026-10-28):
  un aviso ajeno (`'rejectionNotes' is defined but never used` en `ContractGenerateStep`,
  `6-ContractStep.tsx:101`). No se toca.
- `/commercial-onboarding` está en `PUBLIC` en `routeAccess.ts`, y la API protege con
  `@PreAuthorize("hasRole('COMMERCIAL')")`. No hay ruta nueva.

### 2.2 API (comprobado en el código, no supuesto)

- `POST /commercials/onboarding/contract/approve`: `@RequestBody(required = false)
  ContractApproveRequestDTO` con `@Valid` (`declarationVersion` `@Size(max = 20)`, `decision`
  `ACCEPT | REFUSE`, `refusalReason` `@Size(max = 1000)`) y `@RequestHeader("Idempotency-Key",
  required = false)`. Devuelve `ContractSummaryResponseDTO`. Sus campos `contractId`, `version`,
  `status`, `generatedAt`, `businessApprovedAt`, `veryganaReviewedAt`, `veryganaDecisionNotes` y
  `downloadUrl` coinciden con `OnboardingContract`. Además trae `esignatureSentAt`,
  `esignatureSignedAt`, `documents`, `businessProfile` y `diagnosticAnswers`.
- `businessApprove`, todo en una transacción (`@Transactional` de clase):
  1. si el contrato no está en `PENDING_BUSINESS_REVIEW`, lanza `OnboardingStepException("El contrato
     no está pendiente de revisión del empresario.")`;
  2. llama a `recordContractManifestation`;
  3. pasa el contrato a `PENDING_VERYGANA_REVIEW` y el onboarding a `VERYGANA_REVIEW_PENDING`.
- **`OnboardingStepException` extiende `BusinessException`, que el `GlobalExceptionHandler` responde
  con 422 (`UNPROCESSABLE_ENTITY`), no con 400** (ver "Contradicciones", C-1). Una validación de Bean
  Validation responde 400 con `details`.
- `recordContractManifestation`:
  - si la clave ya existe (`findByIdempotencyKey`, búsqueda global), devuelve esa manifestación sin
    registrar otra;
  - si ya hay `MANIFESTED` para **este `contract.id` y este texto**, la devuelve;
  - si no, `classify`: sin `decision` → `NOT_MANIFESTED`; `decision` con `declarationVersion` nula o
    distinta de la vigente → `TECHNICAL_INCIDENT`; `REFUSE` → `EXPRESS_REFUSAL` con el motivo
    recortado (vacío → `null`); `ACCEPT` → `MANIFESTED`.
- `activeText()` lanza `IllegalStateException` si no hay texto activo. No tiene manejador propio y cae
  en el genérico (500 "Unexpected error"). Como `recordContractManifestation` lo llama siempre, **sin
  texto activo también falla la aprobación** (C-2). El texto se siembra en
  `db/migration/V202610271300__formalization_commitment_declaration.sql`.
- `generate()` **reutiliza el mismo `CommercialContract`** del onboarding y sube `version`. El
  `contractId` no cambia al regenerar tras un rechazo. Por tanto, la regla de RN-5 (mismo
  `contractId`) muestra la evidencia también en una versión regenerada del mismo contrato, igual que
  la API, que no registra otra `MANIFESTED` para el mismo contrato y texto (C-3, informativa).
- `GET /commercials/declarations/{code}?context=…`: cada llamada guarda un `DeclarationDisclosure`. Si
  el comercial no existe, responde 404 (`EntityNotFoundException`).

## 3. Archivos

### 3.1 Crear

| Archivo | Qué contiene |
|---|---|
| `src/lib/labels/formalizationCommitment.ts` | `FORMALIZATION_TEXTS`: los textos literales de RN-2, de los estados (error, 403, evidencia como función `(fecha, versión)`), del diálogo, del chip, del toast genérico y de la ayuda del scroll. Sin `'use client'`. |
| `src/lib/formalization/commitmentDecision.ts` | `CommitmentDecisionState`, `INITIAL_DECISION_STATE` (congelado, vacío), `decisionReducer` (`toggleAccept`, `confirmRefusal`, `undoRefusal`), `shouldShowManifestationEvidence(manifestation, version, contractId)` (RN-5) y `buildApproveRequest({ view, showEvidence, state })` (RN-6, RN-7). |
| `src/lib/formalization/refusalReasonSchema.ts` | `REFUSAL_REASON_MAX = 1000`, `refusalReasonSchema` (zod 4: `reason` texto ≤ 1000 → "Máximo 1000 caracteres") y `RefusalReasonFormValues`. |
| `src/lib/formalization/contractApproval.ts` | `ApprovalAttempt`, `approvalFingerprint(body)`, `nextApprovalAttempt(previous, body, newKey)` (RN-8), `resolveApproveFailure(status)` (RN-9) y `approveErrorMessage(error)`. |
| `src/hooks/commercial/useFormalizationCommitment.ts` | `'use client'`. `useFormalizationCommitment(contractId)`: `useDeclaration('FORMALIZATION_COMMITMENT', 'CONTRACT_SHEET', { enabled: true })` + `useReducer(decisionReducer, INITIAL_DECISION_STATE)` **sin parámetros de inicialización** (RN-1); expone `query`, `state`, `dispatch`, `showEvidence` y `buildRequest()`. |
| `src/hooks/commercial/useApproveContract.ts` | `'use client'`. `useApproveContract()`: `useMutation` sobre `OnboardingService.approveContract(body, key)`, `attemptRef` con `nextApprovalAttempt` + `newIdempotencyKey`. La clave se descarta tras un 200 y se conserva si hay error. `onSuccess` recorre `TAX_PROFILE_INVALIDATIONS.approveContract`. Expone `approve(body)` (promesa) e `isPending`. |
| `src/components/commercial/onboarding/contract/FormalizationCommitmentBlock.tsx` | `'use client'`. El bloque del apartado 9 con todos sus estados (sección 7). |
| `src/components/commercial/onboarding/contract/RefusalReasonDialog.tsx` | `'use client'`. `Dialog` "¿Confirmas que no aceptas este compromiso?" con react-hook-form + `zodResolver(refusalReasonSchema)`, textarea "Motivo" con `maxLength={1000}` y contador, y los botones "Confirmar" (submit) y "Cancelar". |
| `__tests__/formalization/formalizationTexts.test.ts` | Textos literales de RN-2 y la regla de RN-11. |
| `__tests__/formalization/commitmentDecision.test.ts` | Reductor, evidencia y cuerpo. |
| `__tests__/formalization/refusalReasonSchema.test.ts` | Esquema del motivo. |
| `__tests__/formalization/contractApproval.test.ts` | Clave y desenlace del error. |
| `__tests__/formalization/approveContractService.test.ts` | Ruta, cuerpo y cabecera del servicio. |
| `__tests__/formalization/commitmentStatic.test.ts` | Barrido estático de RN-1, RN-12 y CA-16 sobre el código fuente. |

### 3.2 Modificar

| Archivo | Cambio |
|---|---|
| `src/services/commercial/OnboardingService.ts` | `approveContract(body: ContractApproveRequest, idempotencyKey: string): Promise<OnboardingContract>` → `apiClient.post(url, body, { headers: { 'Idempotency-Key': idempotencyKey } })`. Importa el tipo de `Declaration.types.ts`. Nada más. |
| `src/hooks/commercial/taxProfileKeys.ts` | `taxProfileKeys.declarationsAll = ['commercial-declarations']`; `declarationCachePolicy(context)` (sección 6); `TAX_PROFILE_INVALIDATIONS.approveContract = [profile, declarationsAll, onboardingAll]`. |
| `src/hooks/commercial/useTaxProfile.ts` | `useDeclaration` aplica `...declarationCachePolicy(context)` en lugar del `staleTime` fijo. La firma no cambia, así que `CommitmentTextDialog` sigue igual. |
| `src/components/commercial/onboarding/steps/6-ContractStep.tsx` | `ContractReviewStep`: `onApprove: (body: ContractApproveRequest) => void`; usa `useFormalizationCommitment(contract.contractId)`; inserta `<FormalizationCommitmentBlock …>` entre el aviso de objeciones y el botón; el botón llama a `onApprove(commitment.buildRequest())`. No toca los otros pasos del archivo (el aviso ajeno de la línea 101 se queda). |
| `src/components/commercial/onboarding/OnboardingWizard.tsx` | `handleApproveContract(body)` con guarda `approvingRef`, `useApproveContract`, y la relectura y el desenlace de RN-9 (sección 6.3). |
| `__tests__/taxProfile/taxProfileKeys.test.ts` | Casos de `declarationCachePolicy`, `declarationsAll` y la invalidación `approveContract`. |
| `__tests__/taxProfile/noPiiLeaks.test.ts` | Añade a `TARGETS` los archivos nuevos de esta entrega y `6-ContractStep.tsx`. El asistente no entra: usa `sessionStorage` y `window.location` en el pago, que es código previo y ajeno. |

No se tocan `src/middleware.ts`, `__tests__/middleware/routeAccess.ts`, `next.config.ts`, `package.json`,
`package-lock.json`, `Declaration.types.ts`, `DeclarationService.ts`, `CommitmentTextDialog.tsx` ni
`src/utils/recognitions.ts`.

## 4. Rutas y acceso

- Sin rutas nuevas. El paso vive dentro de `/commercial-onboarding` (`PUBLIC` en `routeAccess.ts`, página
  `'use client'` existente). No se crea ningún route handler, así que `routeInventory.test.ts` no cambia.
- P-4: no hay cambios en el `matcher`, en el cuerpo del middleware ni en `routeAccess.ts`.
- P-5: la API autoriza (`hasRole('COMMERCIAL')`, 403 si no). El bloque muestra el 403 dentro de sí y
  deja aprobar: decide la API.
- P-2: los dos componentes nuevos son de cliente porque tienen estado, efectos y eventos. Las páginas
  no cambian. P-6 no aplica (sin `params`).

## 5. Contrato con la API

Todo vía `apiClient`. Los 401, 402, 503, el *timeout* y el 400 de cambio de plan los resuelve el
interceptor.

| Método y ruta | Servicio | Entrada → salida | Errores y lo que ve el usuario |
|---|---|---|---|
| `GET /commercials/declarations/FORMALIZATION_COMMITMENT?context=CONTRACT_SHEET` | `DeclarationService.getDeclaration` (existe) | — → `DeclarationView` | 403: "No tienes permiso para ver esta información" dentro del bloque. Cualquier otro (red, 5xx, 404): "No pudimos cargar el compromiso de formalización." + "Reintentar" + la nota de RN-6. En ambos casos "Aprobar contrato" sigue habilitado. |
| `POST /commercials/onboarding/contract/approve` + `Idempotency-Key` | `OnboardingService.approveContract(body, key)` (cambia) | `ContractApproveRequest` → `OnboardingContract` (se tipa con el subconjunto; ver D-5) | Siempre se relee el estado (RN-9). Si sigue en `BUSINESS_REVIEW_PENDING`: un 4xx con `message` (400 de validación, **422** "El contrato no está pendiente…") muestra un toast con ese `message`; si no, "No pudimos aprobar tu contrato. Intenta de nuevo". En ambos casos se conserva la decisión. 401: lo maneja el interceptor y no se relee. |
| `GET /commercials/onboarding/status` (existe) | `OnboardingService.getStatus()` | — → `OnboardingStatus` | Solo tras un error del `POST`. Si falla, se muestra el error original del `POST`. |

Cuerpo según la decisión (RN-7; siempre se manda un objeto, `{}` cuando no hay nada que enviar, que la
API trata igual que sin cuerpo):

| Situación | Cuerpo |
|---|---|
| Texto cargado, sin decisión | `{ declarationVersion }` |
| Casilla marcada | `{ declarationVersion, decision: 'ACCEPT' }` |
| Negativa con motivo / sin motivo | `{ declarationVersion, decision: 'REFUSE', refusalReason }` / sin `refusalReason` |
| Evidencia vigente (RN-5) | `{ declarationVersion }` |
| Texto cargando, con error o con 403 | `{}` |

**Nada falta en la API.** Las dos "dependencias" de la spec son sugerencias que no bloquean. Se suma
C-2 como sugerencia.

## 6. Datos y estado (P-10)

### 6.1 Claves y caché

`taxProfileKeys.ts` (sin `'use client'`, se importa desde Vitest):

```ts
declarationsAll: ['commercial-declarations'] as const,   // prefijo de declaration(code, context)

// RN-10: en la Hoja Final el texto se pide cada vez que se muestra el paso y nunca se reutiliza
// uno guardado; en la ficha (TAX_PROFILE) se conservan los 30 min de la 014 (D-7 de la 014).
export function declarationCachePolicy(context: DisclosureContext) {
  return context === 'CONTRACT_SHEET'
    ? { staleTime: 0, gcTime: 0, refetchOnMount: 'always' as const }
    : { staleTime: 30 * 60 * 1000 };
}

TAX_PROFILE_INVALIDATIONS.approveContract = [profile, declarationsAll, onboardingAll]
```

- Con `gcTime: 0` la entrada se borra cuando el paso se desmonta. Al volver, la consulta arranca en
  `pending` sin datos, así que no se puede aprobar con una versión vieja. `refetchOnMount: 'always'`
  cubre el caso en que otro observador mantenga viva la entrada.
- Se resuelve dentro de `useDeclaration` según el contexto, sin cambiar su firma. El uso de la 014
  (`CommitmentTextDialog`, contexto `TAX_PROFILE`, `enabled` al abrir) queda idéntico, y la prueba
  lo fija (RN-10 sin regresión).
- Efecto conocido: en desarrollo, React Strict Mode monta, desmonta y vuelve a montar, así que hace
  dos `GET` y la API registra dos puestas a disposición. En producción, uno por cada vez que se
  muestra el paso.
- Invalidaciones tras aprobar:
  - `profile`: la ficha trae `formalizationCommitment`;
  - `declarationsAll`: la vista `TAX_PROFILE` trae `manifestation` y estaba guardada 30 min;
  - `onboardingAll`.

  Son las pantallas de la 014 que muestran el mismo dato (`CommitmentBlock` en `/commercial/profile/tax-info`).

### 6.2 Decisión (RN-1, RN-3)

- `INITIAL_DECISION_STATE = Object.freeze({ decision: null, refusalReason: '' })`.
  `useFormalizationCommitment` llama a `useReducer(decisionReducer, INITIAL_DECISION_STATE)` sin
  tercer argumento y sin leer `query.data`. Ningún dato de la API, del almacenamiento ni de otra
  casilla entra al estado.
- Acciones:
  - `toggleAccept(checked)`: `ACCEPT` o `null`; se ignora si el estado es `REFUSE`.
  - `confirmRefusal(reason)`: `REFUSE` con el motivo recortado.
  - `undoRefusal`: vuelve al estado inicial.
- El estado vive en el componente del paso: al desmontarse (recarga, salir, cambio de paso) se pierde
  y vuelve vacío. Ante un error al aprobar el paso sigue montado, así que la decisión se conserva
  (RN-9, CA-14).

### 6.3 Aprobación (RN-8, RN-9, P-11)

En `useApproveContract`:

```text
approve(body):
  attemptRef.current = nextApprovalAttempt(attemptRef.current, body, newIdempotencyKey)
  result = await mutation.mutateAsync({ body, key: attemptRef.current.key })
  attemptRef.current = null            // tras 200 la clave se descarta
  return result                        // si falla, attemptRef se conserva para el reintento
```

En `OnboardingWizard.handleApproveContract(body)`:

```text
if (approvingRef.current || submitting) return      // guarda síncrona contra doble clic (CA-11)
approvingRef.current = true; setSubmitting(true)
try   { setContract(await approval.approve(body)); setStep('VERYGANA_REVIEW_PENDING') }
catch (err) {
  if (readApiError(err).status === 401) return       // el interceptor ya cerró sesión
  status = await getStatus() o null si falla; si llegó, syncRejectionState(status)
  switch resolveApproveFailure(status):
    'completed'  → onCompleted()
    'advance'    → setStep(status.currentStep)        // sin toast (CA-13)
    'show-error' → toast.error(approveErrorMessage(err))  // la decisión sigue en el paso (CA-14)
}
finally { approvingRef.current = false; setSubmitting(false) }
```

- `resolveApproveFailure(status)`:
  - `null` → `'show-error'`;
  - `completed` o `currentStep === 'COMPLETED'` → `'completed'`;
  - `BUSINESS_REVIEW_PENDING` → `'show-error'`;
  - `VERYGANA_REVIEW_PENDING`, `SIGNATURE_PENDING` o `PAYMENT_PENDING` → `'advance'`;
  - cualquier otro paso (por ejemplo `CONTRACT_PENDING` o `DOCUMENTS_PENDING` tras un rechazo
    rapidísimo) → `'advance'` sin toast. Ver D-1.
- `approveErrorMessage(err)`: con `readApiError`, si el estado está entre 400 y 499 y hay `message`,
  devuelve ese `message`; si no, "No pudimos aprobar tu contrato. Intenta de nuevo". Así cubre el 422
  real (C-1).
- `submitting` sigue en `true` durante la relectura: el botón, la casilla, el enlace y "Deshacer"
  siguen deshabilitados hasta que termina.
- No se usa `handleApiError` en esta rama: el `POST` no trae `details` de campos del asistente.

## 7. UI

### 7.1 `FormalizationCommitmentBlock`

Props: `commitment` (lo que devuelve el hook), `submitting`. Contenedor `section` con
`aria-labelledby` al título.

| Estado | Qué se ve |
|---|---|
| Cargando (`query.isPending`) | Título "Hoja Final de Aceptación Electrónica" + esqueleto `animate-pulse` del subtítulo y de la caja, con `role="status"` y "Cargando el compromiso…" solo para lectores de pantalla. |
| Error (`isError && !data`, estado ≠ 403) | Con `role="alert"`: "No pudimos cargar el compromiso de formalización.", el botón "Reintentar" (`refetch`) y la nota "Puedes aprobar tu contrato igual; VERYGANA te pedirá una aclaración después.". Sin casilla ni enlace. |
| 403 | "No tienes permiso para ver esta información" dentro del bloque. |
| Éxito sin evidencia | Subtítulo "Apartado 9. Compromiso de crecimiento y formalización" y "(versión {version})". Caja con scroll: `div` con `role="region"`, `aria-label="Texto del compromiso de formalización"`, `tabIndex={0}`, `max-h-[50vh] overflow-y-auto`, `whitespace-pre-line break-words` y anillo de foco visible, con `fullText` sin tocar. Debajo, "Desplázate para leer el texto completo" solo si `scrollHeight > clientHeight` (medido con `ResizeObserver` en un efecto). Casilla nativa `<input type="checkbox" id=… checked={state.decision === 'ACCEPT'} disabled={submitting \|\| state.decision === 'REFUSE'}>` con `<label htmlFor>` "Manifiesto expresamente este compromiso". Enlace secundario `button` "No acepto este compromiso", que abre `RefusalReasonDialog`. Con `REFUSE`, en lugar del enlace, el chip "No aceptado" + `button` "Deshacer". Nota fija de RN-2. |
| Éxito con evidencia (RN-5) | Texto y caja igual que arriba, y en lugar de la casilla y el enlace: "✓ Ya manifestaste este compromiso el {formatBogotaDateTime(occurredAt)} (versión {declarationVersion})". La nota fija sigue visible. |
| Enviando | Casilla, enlace y "Deshacer" con `disabled={submitting}`. El botón "Aprobar contrato" muestra el indicador de `StepButton`. |

- La casilla solo cambia con `onChange` del propio `input`: un clic o la barra espaciadora, porque es
  nativa. Nada más la marca. No hay `defaultChecked`.
- Responsive: el bloque y la caja usan todo el ancho y `break-words`; la caja tiene un alto máximo
  relativo a la pantalla (`50vh`). A 360 px no hay scroll horizontal (CA-15).

### 7.2 `RefusalReasonDialog`

- `useForm<RefusalReasonFormValues>({ resolver: zodResolver(refusalReasonSchema), defaultValues:
  { reason: '' } })`. Al abrir se hace `reset({ reason: '' })`. Textarea con `<label>` "Motivo",
  la indicación "(opcional)", `maxLength={1000}`, contador "{n}/1000" con `useWatch` y
  `aria-describedby` al contador y al error.
- "Confirmar" (`type="submit"`, `disabled={isSubmitting}`) → `onConfirm(values.reason)`, que hace
  `dispatch(confirmRefusal)` y cierra. "Cancelar", Escape, la X o el fondo → `onClose`, sin tocar la
  decisión (CA-7).

### 7.3 `ContractReviewStep`

El orden queda así: título, aviso de plantilla, "Ver contrato", aviso de objeciones,
**`FormalizationCommitmentBlock`**, `StepButton` "Aprobar contrato". `StepButton` sigue con
`submitting={submitting}` y sin `disabled`, de modo que nunca depende del bloque (RN-4, CA-11).

### 7.4 Textos

Todos en `FORMALIZATION_TEXTS`, en español y literales de la spec. Los que la spec no fija están en D-4.
Ningún texto nuevo nombra IVA, régimen, vocación, comisión ni plan. La única frase sobre la situación
tributaria es la negación de RN-2 (RN-11).

## 8. Configuración

Ninguna variable de entorno nueva, ningún host de imágenes, ningún cambio en `next.config.ts`.

## 9. Dependencias

Ninguna nueva (P-1). Se usan las ya instaladas: `@tanstack/react-query`, `react-hook-form`,
`@hookform/resolvers`, `zod`, `axios`, `react-hot-toast` y `lucide-react`.

## 10. Seguridad y PII (P-16, P-12)

- Datos sensibles:
  - el motivo de la negativa (texto libre, puede llevar datos personales);
  - la decisión;
  - la `Idempotency-Key`;
  - la respuesta del `POST`, que trae `businessProfile` con datos del representante legal.

  Ninguno va a `console.*`, a la URL ni a `localStorage` / `sessionStorage`. La clave vive en un
  `useRef`, la decisión y el motivo en el estado del componente, y la respuesta en el estado del
  asistente, todo en memoria.
- Los errores no se imprimen: `readApiError` extrae solo `status`, `message` y `details` (sin `config`,
  que lleva la cabecera de autorización y el cuerpo con el motivo).
- La evidencia muestra la fecha y la versión, no `actorLegalRepName`.
- Verificación automática: `noPiiLeaks.test.ts` con los archivos nuevos en `TARGETS`, y
  `commitmentStatic.test.ts` (CA-17). Verificación manual con DevTools.
- El token sigue el flujo existente. La cabecera nueva no es una credencial de sesión.

## 11. Llamadas salientes del servidor

No aplica: no se agrega ninguna ruta de `src/app/api` ni ningún `fetch` de servidor (P-15). Todo va
desde el navegador vía `apiClient` (30 s).

## 12. Efectos colaterales

- Cada vez que se muestra el paso hay un `GET` que la API registra como puesta a disposición (RN-10).
  "Reintentar" también registra una.
- La aprobación registra una manifestación (y su evento y auditoría `CRITICAL` en la API). Las
  pantallas de la 014 que la muestran (`/commercial/profile/tax-info`) se refrescan por las
  invalidaciones. Compliance la verá en la entrega D.
- No hay STOMP / SSE ni notificaciones nuevas.
- Si la validación del motivo falla (más de 1000, imposible por `maxLength` salvo que se pegue un
  texto saltándose el límite), el diálogo no cierra y la decisión no cambia. Nada se envía hasta pulsar
  "Aprobar contrato".
- Ante un error, la relectura del estado puede abrir el modal de rechazo existente
  (`syncRejectionState`), igual que en los demás refrescos del asistente.

## 13. Trazabilidad

| CA | Tareas | Cómo se verifica |
|---|---|---|
| CA-1 | T1, T2, T9, T10 | `formalizationTexts.test.ts` (textos literales), `commitmentDecision.test.ts` (estado inicial vacío); manual T10.1. |
| CA-2 | T2, T6, T7, T12 | `commitmentDecision.test.ts` (inicial congelado y vacío), `taxProfileKeys.test.ts` (`CONTRACT_SHEET` sin caché), `commitmentStatic.test.ts` (sin `defaultChecked`, sin almacenamiento, `useReducer` sin inicializador); manual T10.2. |
| CA-3 | T2, T5, T10, T11 | `commitmentDecision.test.ts` (`{ declarationVersion }` sin `decision`), `approveContractService.test.ts`; manual T11.1. |
| CA-4 | T2, T5, T10 | `commitmentDecision.test.ts`, `approveContractService.test.ts`; manual T11.2. |
| CA-5 | T2, T3, T8 | `commitmentDecision.test.ts` (con y sin motivo, recortado), `refusalReasonSchema.test.ts`; manual T11.3. |
| CA-6 | T2, T9 | `commitmentDecision.test.ts` (`undoRefusal` → inicial y cuerpo sin `decision` ni `refusalReason`); manual T10.4. |
| CA-7 | T3, T8 | `refusalReasonSchema.test.ts` (1000 sí, 1001 no); manual T10.3. |
| CA-8 | T2, T9 | `commitmentDecision.test.ts` (`view` nulo → `{}` aunque haya decisión); manual T10.5. |
| CA-9 | T2, T9 | `commitmentDecision.test.ts` (evidencia y cuerpo sin `decision`); manual T10.6. |
| CA-10 | T2, T9 | `commitmentDecision.test.ts` (otra versión, otro contrato y otro estado → sin evidencia); manual T10.7. |
| CA-11 | T10, T11 | `commitmentStatic.test.ts` (el `StepButton` de "Aprobar contrato" sin `disabled`); manual T10.8 y T11.4 (doble clic: una sola petición en Network). |
| CA-12 | T4, T7, T11 | `contractApproval.test.ts` (misma huella → misma clave; cambia decisión, motivo o versión → otra); manual T11.5. |
| CA-13 | T4, T11 | `contractApproval.test.ts` (`VERYGANA_REVIEW_PENDING` → `advance`); manual T11.6. |
| CA-14 | T4, T11 | `contractApproval.test.ts` (`BUSINESS_REVIEW_PENDING` → `show-error`; `approveErrorMessage` con 400 y 422); manual T11.7. |
| CA-15 | T9 | Manual T10.9 (360 px, teclado). |
| CA-16 | T1, T12 | `formalizationTexts.test.ts` (sin IVA, régimen, vocación, comisión ni plan), `commitmentStatic.test.ts` (la casilla y su etiqueta solo en el bloque); manual T12. |
| CA-17 | T12 | `noPiiLeaks.test.ts` con los archivos nuevos; manual T12 (DevTools). |
| CA-18 | T13 | Puertas (sección "Verificar" de T13), `git diff` de `package.json` y del lockfile vacío, eslint de los archivos tocados sin avisos nuevos. |

## 14. Riesgos

- **R-1 · Casos que la interfaz no puede producir.** CA-14 con un 400 que traiga `message` y la
  rama "la relectura también falla" no se pueden provocar desde el navegador sin herramientas extra.
  Las cubren `contractApproval.test.ts` y la lectura del código. A mano se comprueba el caso de red
  (modo sin conexión) y CA-13 (aprobar en otra pestaña). Excepción de P-17 hasta que haya pruebas de
  componentes.
- **R-2 · Doble toast ante un *timeout* o un 503.** El interceptor ya avisa; si la relectura dice
  `BUSINESS_REVIEW_PENDING`, se suma el toast genérico de la spec. Ver D-2.
- **R-3 · Sin texto activo en la API, la aprobación falla con 500** (C-2). RN-6 solo se cumple cuando
  falla la lectura y no la falta de texto. La migración lo siembra; el front no puede hacer nada más
  que mostrar el error y conservar la decisión.
- **R-4 · `gcTime: 0` y Strict Mode** duplican el `GET` en desarrollo (dos registros en la API). En
  producción no pasa.
- **R-5 · El texto cambia mientras el paso está abierto.** Si la API publica una versión nueva entre el
  `GET` y el `POST`, la API registra `TECHNICAL_INCIDENT` (nunca aceptación ni negativa). Es el
  comportamiento esperado por el contrato. El front no vuelve a pedir el texto antes de aprobar.
- **R-6 · La clave reutilizada rara vez sirve.** La aprobación es una sola transacción: si falló, la
  manifestación se deshizo; si se aplicó, el reintento da 422. La reutilización de RN-8 protege el
  hueco de "respuesta perdida tras confirmar", y RN-9 resuelve el resto.

## 15. Decisiones para el usuario

- **D-1 · Relectura con un paso que no es `BUSINESS_REVIEW_PENDING` ni posterior.** Ejemplos:
  `CONTRACT_PENDING` o `DOCUMENTS_PENDING`, si VERYGANA rechazó entre la aprobación y la relectura.
  La spec solo habla de "`VERYGANA_REVIEW_PENDING` o más adelante". Por defecto el plan **avanza al
  paso que dice la API sin el toast de error**, porque la aprobación ya no está pendiente y el modal
  de rechazo de `syncRejectionState` informa. Alternativa: avanzar y mostrar también el error original.
- **D-2 · Doble toast ante un *timeout* o un 503** (R-2). Por defecto se sigue la spec al pie de la
  letra (también el toast genérico). Alternativa: omitir el genérico cuando el error es un *timeout*
  (`ECONNABORTED`) o un 503, que el interceptor ya avisó.
- **D-3 · Utilidad de idempotencia.** Se reutiliza `newIdempotencyKey` de `src/utils/recognitions.ts`
  (*fallback* con `crypto.getRandomValues`) y no `generateIdempotencyKey` de `prosperity.ts`
  (*fallback* con `Math.random`). No se mueve a un módulo común para no tocar archivos de admin.
  Informativa.
- **D-4 · Textos que la spec no fija:** "Cargando el compromiso…" (solo lector de pantalla), el
  contador "{n}/1000", "(opcional)" junto a "Motivo" y "Máximo 1000 caracteres". Se aceptan salvo
  que digas otra cosa.
- **D-5 · Tipo de la respuesta del `POST`.** Se sigue tipando con `OnboardingContract` (el subconjunto
  que usa el asistente). No se agrega un tipo `ContractSummary` con `businessProfile` y
  `diagnosticAnswers`, que no se usan y traen datos del representante legal. Informativa.

## 16. Contradicciones con la spec o la API

- **C-1 · 422, no 400.** La spec dice que un reintento de una aprobación ya aplicada responde 400 y que
  se muestra el `message` "de un 400". En la API, `OnboardingStepException` extiende
  `BusinessException`, que se responde con **422**; solo la validación de Bean Validation da 400.
  Como RN-9 relee el estado ante **cualquier** error, el flujo no cambia: el plan muestra el `message`
  de cualquier 4xx (400 o 422) y el genérico en lo demás. Conviene corregir en la spec la tabla del
  contrato y la viñeta de la `Idempotency-Key` ("responde 422").
- **C-2 · RN-6 frente a la API sin texto activo.** Si la lectura falla porque no hay texto activo
  (500), la aprobación también falla con 500, porque `recordContractManifestation` llama siempre a
  `activeText()`. Sugerencia para la API, sin bloquear: registrar `TECHNICAL_INCIDENT` o
  `NOT_MANIFESTED` sin texto en lugar de fallar.
- **C-3 · Mismo `contractId` al regenerar** (informativa). RN-5 compara `contractId`; la API mantiene el
  mismo id y sube `version` al regenerar. La evidencia se muestra también en la versión regenerada del
  mismo contrato, y es coherente con la API, que no registra otra `MANIFESTED` para ese contrato y
  ese texto. Si se quisiera por versión del contrato, habría que comparar `contractVersion` y cambiar la
  API.

## 17. Bloqueos

Ninguno. La spec está aprobada, no choca con `CLAUDE.md` ni con `docs/constitution.md`, y todos los
endpoints y campos que usa existen en la API.
