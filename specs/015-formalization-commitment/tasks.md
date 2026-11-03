# 015 · Tareas (entrega B)

Plan: `plan.md` de esta carpeta. Spec: `spec.md`. Contrato:
`specs/014-tax-profile-and-compliance-case/backend-contract.md` (1.3 y 4.4).

## Reglas para todas las tareas

**Prueba primero.** La lógica sin interfaz lleva su prueba primero (P-13, P-17). Se escribe, se ve
fallar (el módulo o la función no existen, o la regla no está) y se anota en la tarea qué falló.
Después se implementa.

**Tareas de interfaz.** Se verifican con `npx tsc --noEmit`, con eslint sobre los archivos tocados y
con una comprobación manual en el navegador. Esta entrega no tiene pruebas de componentes ni de
Playwright. **Las comprobaciones manuales las hace el usuario al final de todas las entregas.** Quien
implementa las deja marcadas como PENDIENTES en la nota de la tarea, sin darlas por hechas.

**Variables.** Antes de verificar, en la misma terminal:

```bash
export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
  NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
  NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
```

**Tipos de rutas.** `npx tsc --noEmit` usa los tipos de rutas de `.next/types`. Si falla por tipos de
rutas ausentes o viejos, corre antes `npm run build`.

**Problemas conocidos y ajenos.** La entrega los deja fuera por decisión del usuario:

1. `npm test`: el único fallo admitido es
   `routeProtection.test.ts > /explore/recognitions pertenece a exactamente una clase`. Cualquier
   otro fallo es de esta entrega.
2. `npx next lint` da 352 avisos frente al tope de 348 por código ya commiteado en `dev`. Esta entrega
   no agrega avisos. El control es eslint sobre los archivos tocados:
   - los archivos **nuevos**, con `--max-warnings=0`;
   - los **modificados**, con el mismo número de avisos que la línea base: un solo aviso ajeno,
     `'rejectionNotes' is defined but never used` en `6-ContractStep.tsx:101`, que no se toca.

   `.lint-max-warnings` no se sube nunca (P-19).
3. En Windows `npm run lint:ci` y `npm run audit:ci` salen con código 3 (el script no encuentra
   `npx`/`npm`). Se corren igual y se anota la salida. La puerta real la confirma el CI en Linux.

**Dependencias.** No hay nuevas: `package.json` y `package-lock.json` no cambian.

**Comprobaciones manuales.**

- Entorno: `npx next dev --turbopack` (o `-p 3001`) con `.env.local`, la API local en
  `NEXT_PUBLIC_API_URL` y sesión de un usuario `ROLE_COMMERCIAL`.
- Hace falta un empresario en `BUSINESS_REVIEW_PENDING` con el contrato generado. Si hace falta otro,
  se genera con un empresario nuevo o regenerando tras un rechazo.
- DevTools abiertas: Console, Network (con la columna de cabeceras de la petición) y
  Application → Storage.

**Bloques para delegar.**

| Bloque | Tareas | Dependencias |
|---|---|---|
| **A** · lógica y datos | T1-T7 | T1-T5 son independientes entre sí; T6 no depende de nada; T7 necesita T2, T4, T5 y T6. |
| **B** · interfaz | T8-T11 | Necesita A. T8 antes que T9; T9 antes que T10; T10 antes que T11. |
| **C** · cierre | T12-T13 | Necesita todo lo anterior. |

---

## Bloque A · Lógica y datos

- [x] T1 · Textos del bloque (CA-1, CA-16; RN-2, RN-11)
  - Archivos: src/lib/labels/formalizationCommitment.ts,
    __tests__/formalization/formalizationTexts.test.ts
  - Test primero: __tests__/formalization/formalizationTexts.test.ts. Casos:
    1. `FORMALIZATION_TEXTS.title` es "Hoja Final de Aceptación Electrónica" y `subtitle` es
       "Apartado 9. Compromiso de crecimiento y formalización".
    2. `versionLabel('1.0')` es "(versión 1.0)".
    3. `checkboxLabel` es "Manifiesto expresamente este compromiso" y `refuseLink` es
       "No acepto este compromiso".
    4. `fixedNote` es exactamente "Aprobar el contrato no requiere marcar la casilla. Si no la marcas,
       VERYGANA te pedirá una aclaración. Este compromiso no cambia tu situación tributaria."
    5. `scrollRegionLabel` es "Texto del compromiso de formalización" y `scrollHint` es
       "Desplázate para leer el texto completo".
    6. `loadError` es "No pudimos cargar el compromiso de formalización.", `retry` es "Reintentar" y
       `loadErrorNote` es "Puedes aprobar tu contrato igual; VERYGANA te pedirá una aclaración
       después.".
    7. `forbidden` es "No tienes permiso para ver esta información".
    8. `refusedChip` es "No aceptado" y `undo` es "Deshacer".
    9. `dialogTitle` es "¿Confirmas que no aceptas este compromiso?", `reasonLabel` es "Motivo",
       `confirm` es "Confirmar" y `cancel` es "Cancelar".
    10. `evidence('27 de octubre de 2026, 10:00 p. m.', '1.0')` empieza por "✓ Ya manifestaste este
        compromiso el " y termina en "(versión 1.0)".
    11. `approveGenericError` es "No pudimos aprobar tu contrato. Intenta de nuevo".
    12. RN-11: ningún texto (recorriendo todos los valores; las funciones se evalúan con argumentos
        ficticios) contiene `\b(IVA|r[eé]gimen|vocaci[oó]n|comisi[oó]n|plan)\b` (sin distinguir
        mayúsculas). La única aparición de "cambia" va precedida de "no ".

    Falla antes porque el módulo no existe.
  - Cambios:
    - `export const FORMALIZATION_TEXTS = { … } as const`, con funciones para `versionLabel`,
      `evidence`, `reasonCounter(n)` ("{n}/1000") y `reasonMax` ("Máximo 1000 caracteres").
    - Sin `'use client'`.
    - Los textos que la spec no fija son los de D-4 del plan.
  - Verificar: npx vitest run __tests__/formalization/formalizationTexts.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T2 · Decisión, evidencia y cuerpo de la aprobación (CA-1 a CA-6, CA-8 a CA-10; RN-1, RN-3, RN-5, RN-6, RN-7)
  - Archivos: src/lib/formalization/commitmentDecision.ts,
    __tests__/formalization/commitmentDecision.test.ts
  - Test primero: __tests__/formalization/commitmentDecision.test.ts. Casos:
    1. **RN-1:** `INITIAL_DECISION_STATE` es `{ decision: null, refusalReason: '' }` y está congelado
       (`Object.isFrozen`).
    2. **Reductor:**
       - `toggleAccept(true)` → `ACCEPT`; `toggleAccept(false)` → `null`;
       - `confirmRefusal('  Lo revisaré con mi contador.  ')` → `REFUSE` con el motivo recortado, y
         `confirmRefusal('   ')` → `REFUSE` con `''`;
       - con `REFUSE`, `toggleAccept(true)` no cambia nada (casilla deshabilitada);
       - `undoRefusal` → igual a `INITIAL_DECISION_STATE`;
       - ninguna acción muta el estado anterior.
    3. **RN-5:** `shouldShowManifestationEvidence(m, '1.0', 7)`:
       - `true` solo con `status: 'MANIFESTED'`, `declarationVersion: '1.0'` y `contractId: 7`;
       - `false` con versión `'0.9'`, con `contractId: 8`, con cada uno de `NOT_MANIFESTED`,
         `EXPRESS_REFUSAL` y `TECHNICAL_INCIDENT`, y con `null`.
    4. **RN-7, `buildApproveRequest`:**
       - `view` con `version: '1.0'` y estado inicial → exactamente `{ declarationVersion: '1.0' }`
         (sin clave `decision`; `'decision' in body` es `false`) (CA-3);
       - con `ACCEPT` → `{ declarationVersion: '1.0', decision: 'ACCEPT' }` (CA-4);
       - con `REFUSE` y motivo → incluye `refusalReason`, y con motivo vacío no lo incluye (CA-5);
       - tras `undoRefusal` → sin `decision` ni `refusalReason` (CA-6).
    5. **RN-6:** `view: null` (cargando, error o 403) con cualquier estado, incluso `ACCEPT` → `{}`
       (CA-8).
    6. **RN-5:** `showEvidence: true` con `ACCEPT` → `{ declarationVersion: '1.0' }`, sin `decision`
       (CA-9).

    Falla antes porque el módulo no existe.
  - Cambios:
    - Tipos `CommitmentDecisionState` y `DecisionAction` (unión discriminada).
    - Funciones puras sin `'use client'`; importan solo tipos de `Declaration.types.ts`.
  - Verificar: npx vitest run __tests__/formalization/commitmentDecision.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T3 · Esquema zod del motivo (CA-5, CA-7; P-11)
  - Archivos: src/lib/formalization/refusalReasonSchema.ts,
    __tests__/formalization/refusalReasonSchema.test.ts
  - Test primero: __tests__/formalization/refusalReasonSchema.test.ts. Casos:
    1. `{ reason: '' }` es válido (el motivo es opcional).
    2. `'a'.repeat(1000)` es válido; `'a'.repeat(1001)` es inválido con "Máximo 1000 caracteres" en
       la ruta `reason`.
    3. `'  motivo  '` es válido (el recorte lo hace `confirmRefusal`, T2).
    4. `REFUSAL_REASON_MAX === 1000`.

    Falla antes porque el módulo no existe.
  - Cambios:
    - `z.object({ reason: z.string().max(REFUSAL_REASON_MAX, FORMALIZATION_TEXTS.reasonMax) })` y
      `RefusalReasonFormValues = z.infer<…>`.
    - Patrón de `zodResolver` de referencia: `src/app/(consumer)/explore/profile/edit/page.tsx`.
  - Verificar: npx vitest run __tests__/formalization/refusalReasonSchema.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T4 · Clave por intento y desenlace del error (CA-12, CA-13, CA-14; RN-8, RN-9)
  - Archivos: src/lib/formalization/contractApproval.ts,
    __tests__/formalization/contractApproval.test.ts
  - Test primero: __tests__/formalization/contractApproval.test.ts. Casos:
    1. **RN-8, `nextApprovalAttempt(previous, body, newKey)`** (con `newKey = vi.fn()` que devuelve
       `'k1'`, `'k2'`, …):
       - `previous` nulo → clave nueva;
       - misma huella → misma clave y `newKey` no se llama (CA-12);
       - cambia `decision` (`undefined` → `ACCEPT`), cambia `refusalReason` o cambia
         `declarationVersion` → clave nueva cada vez (CA-12);
       - `{ declarationVersion: '1.0' }` y `{ declarationVersion: '1.0', decision: undefined }` dan la
         misma huella (orden y claves ausentes no importan).
    2. **RN-9, `resolveApproveFailure(status)`:**
       - `null` → `'show-error'`;
       - `currentStep: 'BUSINESS_REVIEW_PENDING'` → `'show-error'` (CA-14);
       - `'VERYGANA_REVIEW_PENDING'`, `'SIGNATURE_PENDING'` y `'PAYMENT_PENDING'` → `'advance'` (CA-13);
       - `completed: true` o `'COMPLETED'` → `'completed'`;
       - `'CONTRACT_PENDING'` → `'advance'` (D-1, valor por defecto).
    3. **`approveErrorMessage(err)`** con `AxiosError` construidos a mano:
       - 400 con `message` → ese `message`;
       - 422 con `message: 'El contrato no está pendiente de revisión del empresario.'` → ese texto
         (C-1);
       - 500 con `message` → genérico;
       - error sin respuesta (red) → genérico;
       - `Error` normal o `undefined` → genérico.

    Falla antes porque el módulo no existe.
  - Cambios:
    - `ApprovalAttempt = { key: string; fingerprint: string }`.
    - `approvalFingerprint(body)` = `JSON.stringify([body.declarationVersion ?? null,
      body.decision ?? null, body.refusalReason ?? null])`.
    - `ApproveFailureAction = 'show-error' | 'advance' | 'completed'`.
    - `approveErrorMessage` usa `readApiError` (`src/lib/api/apiError.ts`) y
      `FORMALIZATION_TEXTS.approveGenericError`.
    - Sin `'use client'`. Tipos de `OnboardingService.ts` y `Declaration.types.ts`.
  - Verificar: npx vitest run __tests__/formalization/contractApproval.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T5 · Servicio: `approveContract` con cuerpo y `Idempotency-Key` (CA-3, CA-4, CA-5, CA-12)
  - Archivos: src/services/commercial/OnboardingService.ts,
    __tests__/formalization/approveContractService.test.ts
  - Test primero: __tests__/formalization/approveContractService.test.ts. Usa `vi.mock` de
    `@/lib/api/client`, igual que `__tests__/taxProfile/taxProfileService.test.ts`. Casos:
    1. `approveContract({ declarationVersion: '1.0', decision: 'REFUSE', refusalReason: 'x' }, 'k-1')`
       llama a `post('/commercials/onboarding/contract/approve', <el mismo cuerpo>,
       { headers: { 'Idempotency-Key': 'k-1' } })` y devuelve `data`.
    2. Con `{}` manda `{}` y la cabecera.

    Falla antes porque hoy `approveContract()` no recibe argumentos y llama a `post` con un solo
    parámetro.
  - Cambios:
    - Nueva firma `approveContract(body: ContractApproveRequest, idempotencyKey: string):
      Promise<OnboardingContract>`.
    - `import type { ContractApproveRequest } from '@/types/commercial/Declaration.types'`.
    - No cambia nada más del archivo.
    - El asistente deja de compilar hasta T11: para que `tsc` siga en verde, en esta tarea
      `handleApproveContract` pasa provisionalmente `({}, newIdempotencyKey())` y se anota en la nota
      de la tarea. T11 lo reemplaza.
  - Verificar: npx vitest run __tests__/formalization/approveContractService.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.
  - Nota: provisional aplicado: `handleApproveContract` pasa `({}, newIdempotencyKey())` (T11 lo reemplaza). Falló antes: la llamada a `post` salía con un solo parámetro.
  - Nota (T1-T4, T6): vistos en rojo antes (módulos inexistentes; `declarationCachePolicy`, `declarationsAll` y `approveContract` ausentes). T7: hooks sin prueba, como indica la tarea.

- [x] T6 · Caché del texto por contexto e invalidaciones de la aprobación (CA-2; RN-10; P-10)
  - Archivos: src/hooks/commercial/taxProfileKeys.ts, src/hooks/commercial/useTaxProfile.ts,
    __tests__/taxProfile/taxProfileKeys.test.ts
  - Test primero: amplía __tests__/taxProfile/taxProfileKeys.test.ts con:
    1. `declarationCachePolicy('CONTRACT_SHEET')` → `{ staleTime: 0, gcTime: 0,
       refetchOnMount: 'always' }`.
    2. Sin regresión de la 014: `declarationCachePolicy('TAX_PROFILE')` → `staleTime` de 30 min y sin
       `gcTime` ni `refetchOnMount`.
    3. `taxProfileKeys.declarationsAll` es prefijo de `declaration(code, 'TAX_PROFILE')` y de
       `declaration(code, 'CONTRACT_SHEET')`, y entra en la comprobación de "todas distintas".
    4. `TAX_PROFILE_INVALIDATIONS.approveContract` contiene `profile`, `declarationsAll` y
       `onboardingAll`.

    Falla antes porque `declarationCachePolicy`, `declarationsAll` y `approveContract` no existen.
  - Cambios:
    - En `taxProfileKeys.ts`: lo descrito en la sección 6.1 del plan, con el comentario de RN-10.
    - En `useTaxProfile.ts`, `useDeclaration` queda `useQuery({ queryKey, queryFn, enabled,
      ...declarationCachePolicy(context) })`. La firma no cambia y `CommitmentTextDialog.tsx` no se
      toca.
  - Verificar: npx vitest run __tests__/taxProfile/taxProfileKeys.test.ts && npx tsc --noEmit
  - Comprobar: tras T10, en `/commercial/profile/tax-info` abrir "Leer texto", cerrarlo y abrirlo otra
    vez dentro de 30 min: un solo `GET …?context=TAX_PROFILE` en Network (la 014 no cambia).

- [x] T7 · Hooks: compromiso del paso y aprobación (CA-2, CA-11, CA-12; RN-1, RN-8; P-10)
  - Archivos: src/hooks/commercial/useFormalizationCommitment.ts,
    src/hooks/commercial/useApproveContract.ts
  - Test primero: no aplica, porque son hooks de React y Vitest corre en `node`. La lógica ya está
    probada en T2, T4 y T6. La forma de `useReducer` la fija `commitmentStatic.test.ts` (T12).
  - Cambios:
    - `useFormalizationCommitment(contractId: number)` (`'use client'`):
      - `const query = useDeclaration('FORMALIZATION_COMMITMENT', 'CONTRACT_SHEET', { enabled: true })`;
      - `const [state, dispatch] = useReducer(decisionReducer, INITIAL_DECISION_STATE)`, **sin tercer
        argumento y sin leer `query.data` para inicializar**;
      - `showEvidence` (con `query.data`, `shouldShowManifestationEvidence`) y
        `buildRequest = () => buildApproveRequest({ view: query.data ?? null, showEvidence, state })`;
      - devuelve `{ query, state, dispatch, showEvidence, buildRequest }`.
    - `useApproveContract()` (`'use client'`):
      - `useMutation({ mutationFn: ({ body, key }) => OnboardingService.approveContract(body, key),
        onSuccess: invalida TAX_PROFILE_INVALIDATIONS.approveContract })`;
      - `attemptRef = useRef<ApprovalAttempt | null>(null)`;
      - `approve(body)` calcula `nextApprovalAttempt(attemptRef.current, body, newIdempotencyKey)`
        (importado de `@/utils/recognitions`, D-3), espera `mutateAsync`, pone `attemptRef.current =
        null` tras el éxito y lo deja intacto si hay error;
      - devuelve `{ approve, isPending }`.
    - Ningún `console.*`; la clave no sale del `ref`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/hooks/commercial/useFormalizationCommitment.ts src/hooks/commercial/useApproveContract.ts
  - Comprobar: no aplica (se comprueba con T10 y T11).

---

## Bloque B · Interfaz

- [x] T8 · Diálogo de negativa con motivo (CA-5, CA-7; P-11)
  - Archivos: src/components/commercial/onboarding/contract/RefusalReasonDialog.tsx
  - Test primero: no aplica (interfaz); el esquema ya está probado en T3.
  - Cambios:
    - `'use client'`. Props `{ open, onConfirm(reason: string), onClose }`.
    - `Dialog` compartido con `title={FORMALIZATION_TEXTS.dialogTitle}`.
    - `useForm` con `zodResolver(refusalReasonSchema)` y `defaultValues: { reason: '' }`;
      `reset({ reason: '' })` al pasar a `open`.
    - `<label htmlFor>` "Motivo" con "(opcional)"; `<textarea maxLength={REFUSAL_REASON_MAX}>`.
    - Contador `reasonCounter(n)` con `useWatch({ name: 'reason' })`, `aria-live="polite"`.
    - Error bajo el campo con `aria-describedby` / `aria-invalid`.
    - `<form onSubmit={handleSubmit(v => onConfirm(v.reason))}>`, "Confirmar" `type="submit"`
      `disabled={isSubmitting}`, y "Cancelar" `type="button"` → `onClose`.
    - Escape, la X y el fondo los resuelve `Dialog` llamando a `onClose`. Nada cambia la decisión salvo
      "Confirmar".
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/onboarding/contract/RefusalReasonDialog.tsx
  - Comprobar: se comprueba en T10 (puntos 3 y 4).
  - Nota: hecho. tsc y eslint (--max-warnings=0) en verde. Comprobación manual PENDIENTE (T10.3 y T10.4).

- [x] T9 · Bloque "Hoja Final de Aceptación Electrónica" (CA-1, CA-6, CA-8 a CA-10, CA-15, CA-16; RN-2 a RN-6)
  - Archivos: src/components/commercial/onboarding/contract/FormalizationCommitmentBlock.tsx
  - Test primero: no aplica (interfaz). La lógica está en T1, T2 y T6, y lo estático en T12.
  - Cambios:
    - `'use client'`. Props `{ commitment: ReturnType<typeof useFormalizationCommitment>;
      submitting: boolean }`.
    - Estados de la tabla 7.1 del plan:
      - cargando: esqueleto con `role="status"`;
      - error ≠ 403, decidido con `readApiError(query.error).status`: `role="alert"`, "Reintentar"
        → `query.refetch()` y la nota de RN-6;
      - 403: `forbidden`;
      - éxito: título, subtítulo, versión y caja con scroll;
      - evidencia (`showEvidence`): `evidence(formatBogotaDateTime(m.occurredAt),
        m.declarationVersion)` en lugar de la casilla y el enlace;
      - en cualquier otro caso: casilla nativa con `checked={state.decision === 'ACCEPT'}`,
        `onChange={e => dispatch({ type: 'toggleAccept', checked: e.target.checked })}` y
        `disabled={submitting || state.decision === 'REFUSE'}`, y `<label htmlFor>` con
        `checkboxLabel`. Con `REFUSE`, el chip `refusedChip` + `<button>` `undo`; si no, el
        `<button>` `refuseLink`, que abre `RefusalReasonDialog`. Todos con `disabled={submitting}`.
      - La nota fija siempre que haya texto.
    - Caja con scroll:
      - `role="region"`, `aria-label={scrollRegionLabel}`, `tabIndex={0}`,
        `max-h-[50vh] overflow-y-auto whitespace-pre-line break-words`, anillo de foco visible;
      - `fullText` tal cual, sin `slice`, sin `line-clamp` y sin `truncate`;
      - `scrollHint` visible solo si `scrollHeight > clientHeight`, medido con `useRef` +
        `ResizeObserver` en un `useEffect` con limpieza.
    - Sin `defaultChecked`, sin almacenamiento, sin `console.*`. Ningún dato de `manifestation` entra
      en `checked`.
  - Verificar: npx tsc --noEmit && npx eslint --max-warnings=0 src/components/commercial/onboarding/contract/FormalizationCommitmentBlock.tsx
  - Comprobar: en T10.
  - Nota: hecho. tsc y eslint (--max-warnings=0) en verde. Comprobación manual PENDIENTE (T10).

- [x] T10 · `ContractReviewStep` con el bloque (CA-1, CA-2, CA-6 a CA-11, CA-15; RN-1, RN-4, RN-10)
  - Archivos: src/components/commercial/onboarding/steps/6-ContractStep.tsx
  - Test primero: no aplica (interfaz).
  - Cambios:
    - `ContractReviewProps.onApprove: (body: ContractApproveRequest) => void`.
    - Dentro: `const commitment = useFormalizationCommitment(contract.contractId)`.
    - `<FormalizationCommitmentBlock commitment={commitment} submitting={submitting} />` entre el
      aviso "Si tienes alguna objeción…" y `<StepButton … label="Aprobar contrato"
      onClick={() => onApprove(commitment.buildRequest())} />`. `StepButton` sigue **sin `disabled`**.
    - Los demás pasos del archivo no cambian.
  - Verificar: npx tsc --noEmit && npx eslint src/components/commercial/onboarding/steps/6-ContractStep.tsx (solo el aviso ajeno de la línea 101 de la línea base)
  - Comprobar (manual, el usuario al final), en `/commercial-onboarding` con un empresario en
    `BUSINESS_REVIEW_PENDING` y sin manifestación previa:
    1. **CA-1:** entre el aviso de objeciones y "Aprobar contrato" se ven el título, el subtítulo,
       "(versión X)", el texto completo en la caja (comparado con el `fullText` de la respuesta en
       Network), la casilla desmarcada, "No acepto este compromiso" y la nota fija. Network muestra
       un `GET …/FORMALIZATION_COMMITMENT?context=CONTRACT_SHEET`.
    2. **CA-2, RN-10:**
       - marcar la casilla y recargar: vuelve desmarcada y hay un `GET` nuevo;
       - marcarla, ir a `/commercial/profile` y volver a `/commercial-onboarding`: desmarcada y otro
         `GET` (no se reutiliza la caché);
       - Application → Local Storage y Session Storage: ninguna clave nueva con la decisión.
    3. **CA-7:** "No acepto este compromiso" → el diálogo con el foco dentro. Escribir algo y pulsar
       "Cancelar": la casilla sigue habilitada y no hay chip. Repetir con Escape: igual, y el foco
       vuelve al enlace. Pegar 1200 caracteres: el campo se queda en 1000 y el contador dice
       "1000/1000".
    4. **CA-6:** confirmar la negativa: chip "No aceptado — Deshacer", casilla desmarcada y
       deshabilitada. "Deshacer": casilla habilitada y desmarcada, y el enlace de nuevo.
    5. **CA-8:** DevTools → Network → bloquear la URL `*declarations/FORMALIZATION_COMMITMENT*` y
       recargar:
       - el bloque muestra "No pudimos cargar el compromiso de formalización.", "Reintentar" y la
         nota, sin casilla;
       - "Aprobar contrato" está habilitado;
       - quitar el bloqueo y pulsar "Reintentar": aparece el bloque normal.

       Repetir con el bloqueo, aprobar y comprobar en la carga de la petición que el cuerpo es `{}`.
    6. **CA-9:** con un empresario que manifestó en este contrato (`ACCEPT` y luego rechazo y
       regeneración, o datos de la API): "✓ Ya manifestaste este compromiso el {fecha en hora de
       Colombia} (versión X)", sin casilla ni enlace.
    7. **CA-10:** con una manifestación `MANIFESTED` de otra versión del texto o de otro contrato, o con
       una negativa previa: casilla desmarcada y enlace, como en el punto 1. Si no se puede producir,
       anotarlo (la regla la cubre `commitmentDecision.test.ts`).
    8. **CA-11:** mientras carga (Network → "Slow 3G"), con error, con la casilla marcada y con la
       negativa: "Aprobar contrato" habilitado en todos los casos.
    9. **CA-15:** DevTools a 360 px de ancho con un texto largo:
       - la caja tiene scroll propio y la página no tiene scroll horizontal;
       - se ve "Desplázate para leer el texto completo";
       - con Tab el foco llega a la caja (anillo visible) y con las flechas se desplaza hasta el final
         del texto.
  - Nota: hecho. tsc en verde; eslint con el único aviso ajeno de la línea base (`rejectionNotes`, ahora en la línea 104 por los imports nuevos). Comprobaciones manuales 1 a 9 PENDIENTES (las hace el usuario).

- [x] T11 · Aprobar con cuerpo, clave y relectura del estado (CA-3, CA-4, CA-5, CA-11 a CA-14; RN-8, RN-9; P-11)
  - Archivos: src/components/commercial/onboarding/OnboardingWizard.tsx
  - Test primero: no aplica (interfaz). La lógica está en T4 y el servicio en T5.
  - Cambios:
    - `const approval = useApproveContract()` y `const approvingRef = useRef(false)`.
    - `handleApproveContract(body: ContractApproveRequest)` según la sección 6.3 del plan:
      - guarda síncrona `approvingRef`;
      - si el error es 401, sale sin hacer nada más;
      - relee con `OnboardingService.getStatus()`; si llega, `syncRejectionState`;
      - `resolveApproveFailure` → `onCompleted()`, `setStep(status.currentStep as WizardStep)` sin
        toast, o `toast.error(approveErrorMessage(err))`;
      - `finally` libera la guarda y `submitting`.
    - No usa `handleApiError` en esta rama. Se quita el provisional de T5. Sin `console.*`.
  - Verificar: npx tsc --noEmit && npx eslint src/components/commercial/onboarding/OnboardingWizard.tsx (0 avisos, como en la línea base)
  - Comprobar (manual, el usuario al final), en Network con la cabecera `Idempotency-Key` visible:
    1. **CA-3:** sin tocar la casilla, "Aprobar contrato":
       - el cuerpo es `{"declarationVersion":"X"}`, sin `decision`;
       - lleva la cabecera `Idempotency-Key` (UUID);
       - pasa a "Contrato en revisión";
       - la casilla nunca se marcó.
    2. **CA-4** (otro empresario o regenerando): marcar y aprobar → `{"declarationVersion":"X",
       "decision":"ACCEPT"}`.
    3. **CA-5:** negativa con motivo → `decision: "REFUSE"` y `refusalReason` (recortado). Sin
       motivo → sin `refusalReason`.
    4. **CA-11:** doble clic rápido en "Aprobar contrato" → **una** sola `POST` en Network. Mientras
       envía: el botón con su indicador, y la casilla, el enlace y "Deshacer" deshabilitados.
    5. **CA-12:** Network → "Offline" y aprobar:
       - toast "No pudimos aprobar tu contrato. Intenta de nuevo" y la decisión se conserva;
       - aprobar otra vez sin cambiar nada → la misma `Idempotency-Key` que la primera;
       - cambiar la decisión y aprobar (aún sin conexión) → otra clave;
       - volver a "Online" y aprobar → 200.
    6. **CA-13:** con el paso abierto en dos pestañas, aprobar en la primera y luego en la segunda:
       - la segunda recibe 422;
       - se relee el estado y pasa a "Contrato en revisión" **sin** toast de error.
    7. **CA-14:** un error con el estado aún en `BUSINESS_REVIEW_PENDING` (el modo sin conexión del
       punto 5 cubre el texto genérico) → toast y la decisión y el motivo se conservan. El caso de un
       400 con `message` no se puede provocar desde la interfaz: lo cubre `contractApproval.test.ts`
       (R-1). Anotarlo en el PR.
  - Nota: hecho. Provisional de T5 reemplazado. tsc en verde; eslint de `OnboardingWizard.tsx` sin avisos. Comprobaciones manuales 1 a 7 PENDIENTES (las hace el usuario). El 401 sale sin relectura ni toast (lo maneja el interceptor).

---

## Bloque C · Cierre

- [x] T12 · Barridos estáticos: casilla nunca premarcada, solo aquí y sin PII (CA-2, CA-11, CA-16, CA-17; RN-1, RN-12; P-16)
  - Archivos: __tests__/formalization/commitmentStatic.test.ts,
    __tests__/taxProfile/noPiiLeaks.test.ts
  - Test primero: __tests__/formalization/commitmentStatic.test.ts. Sigue el patrón de
    `noPiiLeaks.test.ts`: quita los comentarios y cada regla se prueba también sobre fragmentos
    (`it.each`) para verla fallar con un caso malo. Casos:
    1. **RN-1:** `FormalizationCommitmentBlock.tsx` no contiene `defaultChecked`, `localStorage`,
       `sessionStorage` ni `checked={true}`.
    2. **RN-1:** `useFormalizationCommitment.ts` contiene
       `useReducer(decisionReducer, INITIAL_DECISION_STATE)` exactamente, sin tercer argumento, y no
       pasa `query.data` al reductor.
    3. **RN-12, CA-16:** en todo `src/`, `FORMALIZATION_TEXTS.checkboxLabel` solo aparece en
       `FormalizationCommitmentBlock.tsx`, y el texto literal "Manifiesto expresamente este
       compromiso" solo en `src/lib/labels/formalizationCommitment.ts`.
    4. **RN-12, CA-16:** `FormalizationCommitmentBlock` solo se importa desde `6-ContractStep.tsx`.
    5. **CA-11:** en `6-ContractStep.tsx`, el `StepButton` con `label="Aprobar contrato"` no lleva
       `disabled`.

    Ver fallar cada regla con su fragmento malo antes de correrla sobre los archivos reales.
  - Cambios:
    - En `noPiiLeaks.test.ts`, añadir a `TARGETS`:
      - `src/lib/formalization`;
      - `src/lib/labels/formalizationCommitment.ts`;
      - `src/components/commercial/onboarding/contract`;
      - `src/components/commercial/onboarding/steps/6-ContractStep.tsx`;
      - `src/hooks/commercial/useFormalizationCommitment.ts`;
      - `src/hooks/commercial/useApproveContract.ts`.

      Comprobar que la prueba falla si se añade `console.log(body)` temporalmente a uno de ellos, y
      quitarlo.
    - Revisión de textos (CA-16): `grep -rniE "(cambia|modifica|mejora).{0,40}(iva|r[eé]gimen|vocaci[oó]n|comisi[oó]n|plan)" src/lib/labels/formalizationCommitment.ts src/components/commercial/onboarding/contract`
      sin resultados. Anotar el resultado.
  - Verificar: npx vitest run __tests__/formalization __tests__/taxProfile/noPiiLeaks.test.ts && npx tsc --noEmit
  - Comprobar (manual, el usuario al final; CA-17), tras aprobar con una negativa con motivo:
    - Console sin el motivo, la decisión, la clave ni datos del representante;
    - la URL de `/commercial-onboarding` sin query;
    - Application → Local Storage y Session Storage sin claves nuevas de esta funcionalidad.

- [x] T13 · Puertas finales (CA-18)
  - Archivos: ninguno (solo `.lint-max-warnings` si `lint:ci` corre en Linux y pide **bajarlo**).
  - Test primero: no aplica.
  - Cambios: ninguno.
  - Verificar: npm test && npm run lint:ci && npm run build && npx tsc --noEmit && npm run audit:ci
    - `npm test`: todo en verde salvo el único fallo admitido
      (`routeProtection.test.ts > /explore/recognitions`). Anotar el recuento.
    - `npm run lint:ci` y `npm run audit:ci`: en Windows salen con 3 (ajeno 3). Anotarlo y correr
      además:
      - `npx next lint`: 0 errores y como máximo 352 avisos, los mismos que antes (ninguno nuevo);
      - `npx eslint --max-warnings=0` sobre todos los archivos nuevos de `src/` y `__tests__/`;
      - `npx eslint` sobre los modificados (`OnboardingService.ts`, `taxProfileKeys.ts`,
        `useTaxProfile.ts`, `6-ContractStep.tsx`, `OnboardingWizard.tsx`, `taxProfileKeys.test.ts`,
        `noPiiLeaks.test.ts`), con solo el aviso ajeno de `6-ContractStep.tsx:101`;
      - `npm audit --omit=dev`: solo los avisos altos con excepción vigente en
        `security/audit-exceptions.json`.
    - `npm run build` en verde. `npx tsc --noEmit` **después** del build.
  - Comprobar:
    - `git diff --stat -- package.json package-lock.json src/middleware.ts __tests__/middleware/routeAccess.ts next.config.ts`
      vacío;
    - `.lint-max-warnings` sigue en 348 (no sube);
    - en la salida de `npm run build`, anotar el "First Load JS" de `/commercial-onboarding` (antes:
      233 kB) para ver que el bloque no lo dispara.
    - Recopilar en el PR las comprobaciones manuales PENDIENTES de T6, T10, T11 y T12, y lo que no se
      pueda producir (R-1, excepción de P-17).
  - Nota T12: hecho. `commitmentStatic.test.ts` (17 pruebas, cada regla vista fallar con fragmento malo y el
    botón "Aprobar contrato" con `disabled` real temporal) y 6 TARGETS nuevos en `noPiiLeaks.test.ts`
    (visto fallar con `console.log(body)` temporal en `refusalReasonSchema.ts`, ya quitado). El `grep` de
    textos (CA-16) no da resultados. Manual de CA-17 PENDIENTE (abajo).
  - Nota T13 (Windows, 2026-10-28): `npm test` 997/998, único fallo el ajeno `/explore/recognitions`.
    `lint:ci` sale 3 ("next lint no produjo reporte", ajeno de Windows); `npx next lint` 0 errores y 352
    avisos (<= 352, ninguno nuevo); `eslint --max-warnings=0` sobre los nuevos limpio; los modificados
    solo dan el aviso ajeno `rejectionNotes` de `6-ContractStep.tsx:104`. `npm run build` 0, `tsc` 0.
    `audit:ci` sale 3 (`spawnSync npm ENOENT`, ajeno de Windows); `npm audit --omit=dev`: 2 altos
    (`postcss` anidado en Next, `xlsx`), ambos con excepción vigente, y 2 moderados (`fast-uri`).
    `git diff --stat` de package.json, lockfile, middleware, routeAccess y next.config vacío;
    `.lint-max-warnings` sigue en 348. First Load JS de `/commercial-onboarding`: 239 kB (antes 233 kB).
  - PENDIENTE (manual, lo hace el usuario en el navegador): comprobaciones de T6, T10 (1 a 8), T11 (1 a 7)
    y T12 (CA-17: Console sin motivo/decisión/clave/datos del representante, URL de
    `/commercial-onboarding` sin query, Local y Session Storage sin claves nuevas). No producible:
    400 con `message` (R-1), cubierto por `contractApproval.test.ts`.

---

## Ronda 2 (decidida por el usuario el 2026-10-29, tras la ronda 1 APROBADO)

Ajustes que salen de las sugerencias de `review.md` (ronda 1) y del arreglo de la base del CI. No
cambian ningún CA; T14 y T15 precisan RN-10 y el estado "Enviando" de la spec.

- [x] T14 · Tras aprobar no se vuelve a pedir el texto de la Hoja Final (RN-10, CA-2; P-10)
  - Archivos: `src/hooks/commercial/taxProfileKeys.ts`, `src/hooks/commercial/useApproveContract.ts`,
    `__tests__/taxProfile/taxProfileKeys.test.ts` (o una prueba nueva en `__tests__/formalization/`).
  - Problema: el `onSuccess` invalida `declarationsAll` con `await`; la consulta
    `['commercial-declarations', 'FORMALIZATION_COMMITMENT', 'CONTRACT_SHEET']` está activa con
    `staleTime: 0`, así que se vuelve a pedir: la API registra una puesta a disposición extra y el avance
    espera ese `GET`.
  - Cambios: la invalidación de la aprobación sigue marcando como desactualizadas las declaraciones
    (la vista `TAX_PROFILE` trae `manifestation`), pero **no vuelve a pedir** las de contexto
    `CONTRACT_SHEET` (p. ej. un `predicate` que las excluya, o `refetchType: 'none'` para ellas); que la
    decisión quede en una función pura de `taxProfileKeys.ts` probable en `node`. El resultado de la
    aprobación no espera relecturas que no hacen falta para decidir el avance (el estado del onboarding sí
    se relee, RN-9).
  - Test primero: la función pura excluye cualquier clave `[..., 'CONTRACT_SHEET']` y deja la de
    `TAX_PROFILE`, `profile` y `onboardingAll`; verla fallar con la lista actual.
  - Verificar: `npx vitest run __tests__/taxProfile __tests__/formalization`
  - Manual (PENDIENTE para el usuario): en Network, tras aprobar, ningún `GET
    /commercials/declarations/FORMALIZATION_COMMITMENT?context=CONTRACT_SHEET` posterior al `POST`.
  - Nota: `isContractSheetDeclarationKey` (taxProfileKeys.ts) + `useApproveContract` invalida CONTRACT_SHEET con `refetchType: 'none'`, las demás declaraciones sin esperarlas; solo se espera ficha y onboarding. Pendiente manual: Network tras aprobar.

- [x] T15 · "Reintentar" deshabilitado mientras se envía (estado "Enviando" de la spec)
  - Archivos: `src/components/commercial/onboarding/contract/FormalizationCommitmentBlock.tsx`,
    `__tests__/formalization/commitmentStatic.test.ts`.
  - Cambios: el botón "Reintentar" del estado de error recibe el mismo `disabled` que la casilla, el
    enlace y "Deshacer" mientras la aprobación está en curso.
  - Test primero: barrido estático en `commitmentStatic.test.ts` que exige ese `disabled` en el botón;
    verlo fallar antes.
  - Verificar: `npx vitest run __tests__/formalization`
  - Nota: `disabled={submitting}` en Reintentar; barrido en commitmentStatic.test.ts (visto en rojo sin el `disabled`).

- [x] T16 · `useDeclaration` sin reintento en 403/404
  - Archivos: `src/hooks/commercial/useTaxProfile.ts` y su prueba (si `retryUnlessForbiddenOrMissing`
    no está exportada ni probada, exportarla desde un módulo sin `'use client'` y probarla).
  - Cambios: `useDeclaration` usa `retry: retryUnlessForbiddenOrMissing`, como los demás hooks del
    archivo. No toca la política de caché por contexto.
  - Test primero: 403 y 404 → `false`; 500 o red → reintenta una vez. Verla fallar si se prueba nueva.
  - Verificar: `npx vitest run __tests__/taxProfile __tests__/formalization`
  - Nota: `retryUnlessForbiddenOrMissing` movida a `src/hooks/commercial/retryPolicy.ts` (sin 'use client'), probada en taxProfileKeys.test.ts; `useDeclaration` la usa.

- [x] T17 · `RefusalReasonDialog` con `next/dynamic`
  - Archivos: el componente que hoy importa `RefusalReasonDialog` (bloque o `6-ContractStep.tsx`).
  - Cambios: cargarlo con `next/dynamic` (`ssr: false`) solo cuando se abre, para sacar react-hook-form
    y zod del First Load JS de `/commercial-onboarding` (239 kB en la ronda 1; antes de la 015, 233 kB).
    Mantener el comportamiento de CA-5 y CA-7 (foco, Escape, Cancelar, contador).
  - Test primero: no aplica en `node` (P-17, excepción); si `commitmentStatic.test.ts` comprueba el
    import, ajustarlo para exigir el import dinámico.
  - Verificar: `npm run build` y anotar el First Load JS de `/commercial-onboarding`.
  - Manual (PENDIENTE para el usuario): abrir "No acepto…", el diálogo aparece sin parpadeo y con foco.
  - Nota: `next/dynamic` (`ssr: false`) y montaje solo con el diálogo abierto, en FormalizationCommitmentBlock.tsx; barrido estático ajustado. First Load JS de `/commercial-onboarding` sigue en 239 kB (react-hook-form/zod ya entran por 5b-TaxProfileStep de la 014, así que no baja). Pendiente manual: abrir 'No acepto…' (sin parpadeo, con foco).

- [x] T18 · Base del CI: clasificar `/explore/recognitions` y bajar a 348 avisos (P-4, P-19; ajeno a la 015)
  - Archivos: `__tests__/middleware/routeAccess.ts`; los archivos con los 4 avisos de más que entraron
    después de `2674a0e` (localizarlos con `git diff 2674a0e HEAD --name-only` y eslint sobre cada uno).
  - Ruta: `src/middleware.ts` **ya** protege `/explore/recognitions` para `ROLE_CONSUMER` (en el
    `matcher` y en `CONSUMER_ALLOWED`), y la página solo admite `CONSUMER`. La tabla debe describir lo
    que el middleware hace: `{ path: '/explore/recognitions', match: 'exact', role: 'ROLE_CONSUMER' }`
    en `ROLE_RULES`, junto a `/raffles` y `/ads`. **No se toca `src/middleware.ts`.**
  - Lint: corregir 4 avisos reales (de preferencia en los archivos que los agregaron, sin cambiar
    comportamiento) hasta que `npx next lint` dé ≤ 348. Si quedan menos de 348, bajar
    `.lint-max-warnings` al número nuevo. **Nunca subir el tope.** No vale silenciarlos con
    `eslint-disable`.
  - Test primero: `routeProtection.test.ts` ya falla con `/explore/recognitions`; tras el cambio pasa,
    incluidas las seis identidades.
  - Verificar: `npm test` (todo en verde) y `npx next lint` (0 errores, ≤ 348 avisos).
- Nota: `/explore/recognitions` agregada a ROLE_RULES (routeProtection pasa, 6 identidades; middleware intacto). Avisos 352 a 348 (tope sin cambios): quitados `UserState` sin uso (admin/users/UserDetailModal.tsx), `rejectionNotes` sin desestructurar (6-ContractStep.tsx; la prop sigue en el tipo), `useCallback` sin uso (commercial/ads/CreateAdForm.tsx) y el import `getCommercialInitialData` sin uso (commercial/layout/Header.tsx).

- [x] T19 · Puertas finales de la ronda 2
  - Verificar: `npm test && npm run lint:ci && npm run build && npx tsc --noEmit && npm run audit:ci`
    (en Windows, los equivalentes de T13 para `lint:ci` y `audit:ci`). `npm test` debe quedar todo en
    verde y `npx next lint` en ≤ 348 avisos. `git diff --stat -- package.json package-lock.json
    src/middleware.ts next.config.ts` vacío.
  - Nota: `npm test` 32 archivos, 1012 pruebas, verde; `npx next lint` 0 errores, 348 avisos (tope intacto); build y `tsc --noEmit` verdes; `npm audit --omit=dev`: 2 altos (xlsx, postcss anidado en Next) con excepción vigente, más 2 moderados de fast-uri; diff de package*.json, middleware.ts y next.config.ts vacío. `lint:ci` y `audit:ci` no se corrieron (Windows).

---

## Trazabilidad CA → tareas

| CA | Tareas | Verificación |
|---|---|---|
| CA-1 | T1, T2, T9, T10 | `formalizationTexts.test.ts`, `commitmentDecision.test.ts`; manual T10.1 |
| CA-2 | T2, T6, T7, T10, T12 | `commitmentDecision.test.ts`, `taxProfileKeys.test.ts`, `commitmentStatic.test.ts`; manual T10.2 |
| CA-3 | T2, T5, T10, T11 | `commitmentDecision.test.ts`, `approveContractService.test.ts`; manual T11.1 |
| CA-4 | T2, T5, T10, T11 | `commitmentDecision.test.ts`, `approveContractService.test.ts`; manual T11.2 |
| CA-5 | T2, T3, T5, T8, T11 | `commitmentDecision.test.ts`, `refusalReasonSchema.test.ts`, `approveContractService.test.ts`; manual T11.3 |
| CA-6 | T2, T9, T10 | `commitmentDecision.test.ts`; manual T10.4 |
| CA-7 | T3, T8, T10 | `refusalReasonSchema.test.ts`; manual T10.3 |
| CA-8 | T2, T9, T10 | `commitmentDecision.test.ts`; manual T10.5 |
| CA-9 | T2, T9, T10 | `commitmentDecision.test.ts`; manual T10.6 |
| CA-10 | T2, T9, T10 | `commitmentDecision.test.ts`; manual T10.7 |
| CA-11 | T7, T10, T11, T12 | `commitmentStatic.test.ts`; manual T10.8, T11.4 |
| CA-12 | T4, T5, T7, T11 | `contractApproval.test.ts`, `approveContractService.test.ts`; manual T11.5 |
| CA-13 | T4, T11 | `contractApproval.test.ts`; manual T11.6 |
| CA-14 | T4, T11 | `contractApproval.test.ts`; manual T11.7 (red) y R-1 |
| CA-15 | T9, T10 | manual T10.9 |
| CA-16 | T1, T12 | `formalizationTexts.test.ts`, `commitmentStatic.test.ts`, `grep` de T12 |
| CA-17 | T7, T12 | `noPiiLeaks.test.ts` (con los archivos nuevos); manual T12 |
| CA-18 | T13 | puertas y comprobaciones de T13 |
