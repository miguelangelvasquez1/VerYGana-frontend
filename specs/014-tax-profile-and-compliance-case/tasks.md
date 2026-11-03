# 014 · Tareas (entrega A)

Plan: `plan.md` de esta carpeta. Spec: `spec.md`. Contrato: `backend-contract.md`.

La lógica sin interfaz lleva **su prueba primero** (P-13, P-17): se escribe, se ve fallar (el módulo no
existe o la regla no está) y se anota en la tarea qué falló; luego se implementa. Las tareas de interfaz
se verifican con `npx tsc --noEmit` y una comprobación manual concreta en el navegador (no hay pruebas
de componentes ni Playwright en esta entrega).

**Antes de verificar**, en la misma terminal:

```bash
export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
  NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
  NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
```

- `npx tsc --noEmit` usa los tipos de rutas de `.next/types`: si falla por tipos de rutas ausentes o
  viejos (y siempre tras crear una `page.tsx`), corre antes `npm run build`.
- `.lint-max-warnings` hoy es **348**. Ninguna tarea lo sube; el código nuevo no agrega avisos (`any`,
  `<img>`, dependencias de hooks). Si `npm run lint:ci` dice que bajó, se edita al número que indica en
  esa misma tarea (P-19).
- Sin dependencias nuevas: `package.json` y `package-lock.json` no cambian.
- **Comprobaciones manuales:** `npx next dev --turbopack` (o `-p 3001`) con `.env.local` y la API local
  en `NEXT_PUBLIC_API_URL`, sesión de un usuario `ROLE_COMMERCIAL`. Para el paso del onboarding hace falta
  un empresario con documentos completos y sin ficha (`TAX_PROFILE_PENDING` tras "Continuar"). Con
  DevTools abiertas (Console, Network, Application → Storage) en todas.

Bloques para delegar: **A** base (T1-T11) · **B** componentes (T12-T16) · **C** onboarding (T17-T18) ·
**D** páginas, perfil y cierre (T19-T23). Dentro de A, T1 va primero; T2-T7 y T9 son independientes
entre sí; T8 necesita T3, T4 y T6; T10 necesita T1; T11 necesita T10. B necesita A. C necesita T16
(T17 puede ir en paralelo con B). D necesita B (T19-T20) y todo lo anterior (T22-T23).

---

## Bloque A · Base compartida

- [x] T1 · Tipos del contrato (base para A, B, C y D; CA-30)
  - Archivos: src/types/commercial/TaxProfile.types.ts, src/types/commercial/Expediente.types.ts,
    src/types/commercial/Declaration.types.ts, src/types/compliance/InformationRequest.types.ts
  - Test primero: no aplica (solo tipos); la verificación es el compilador.
  - Cambios: copiar las secciones 1.1 a 1.4 de `backend-contract.md` **tal cual** (nombres de campo del
    JSON). `TaxProfile.types.ts` importa `Manifestation` de `Declaration.types.ts`;
    `InformationRequest.types.ts` importa `CommercialDocumentType` de `Expediente.types.ts`. No se toca
    `OnboardingStep` aquí (va en T17 para que `tsc` siga en verde) ni `PagedResponse`.
  - Verificar: npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T2 · Diccionario de textos y colores (CA-17, CA-18, CA-22, CA-29)
  - Archivos: src/lib/labels/taxCompliance.ts, __tests__/taxProfile/labels.test.ts
  - Test primero: __tests__/taxProfile/labels.test.ts. Casos: (1) `TAX_PROFILE_STATUS_LABELS`:
    SUBMITTED "En revisión"/blue, OBSERVED "Con observaciones"/orange, REVIEWED "Revisada"/green;
    (2) revisión de sección: VERIFIED "Verificada"/green, OBSERVED "Observada"/orange, NOT_APPLICABLE
    "No aplica"/gray y la entrada "sin revisión" "Pendiente de revisión"/gray; (3) manifestación:
    MANIFESTED "Manifestado"/green, NOT_MANIFESTED "Sin manifestar — pendiente de aclaración"/orange,
    EXPRESS_REFUSAL "No aceptado"/red, TECHNICAL_INCIDENT "Falla técnica — pendiente de aclaración"/gray,
    y los cuatro textos son distintos; (4) alcances de ingreso, conceptos y relaciones de sede con los
    textos de la sección 3; (5) títulos de sección "a) RUT" … "h) Asesoría contable" en orden;
    (6) existen entradas para todos los enums de la tabla (documento, solicitudes, medidas,
    clasificaciones, triggers), con el valor `expired` → "Vencido"/red; (7) ningún texto del diccionario
    contiene "cambia" ni "modifica" junto a IVA, régimen, vocación, comisión o plan (RN-3). Falla antes
    porque el módulo no existe.
  - Cambios: objetos `Record<Enum, { label: string; tone: Tone }>` (o `Record<Enum, string>` donde la
    tabla no da color), `type Tone = 'blue' | 'orange' | 'green' | 'gray' | 'red'`, más
    `TAX_PROFILE_SECTION_TITLES` en el orden A_RUT…H_ADVISORY. Para solicitudes, las dos variantes
    (empresario / compliance). Sin `'use client'`.
  - Verificar: npx vitest run __tests__/taxProfile/labels.test.ts && npx tsc --noEmit
  - Comprobar: no aplica (sin interfaz todavía).

- [x] T3 · Dinero: pesos ↔ centavos y formato COP (CA-4, CA-7, CA-9)
  - Archivos: src/lib/money/cents.ts, __tests__/money/cents.test.ts
  - Test primero: __tests__/money/cents.test.ts. Casos: `parsePesosInput("1234,56")` y `("1234.56")`
    → 1234,56 válido; `pesosToCents("1234,56")` → 123456 (sin el 123455 que da `1234.56 * 100`);
    `("0,005")` → 1 y `("0,004")` → 0 (la utilidad redondea al centavo más cercano; el esquema limita a 2 decimales, D-1); `("0")` → 0;
    `("1500000")` → 150000000; `("-5")` → resultado "negativo"; `("abc")`, `("")`, `("1,2,3")`,
    `("1.500.000")` → inválido; `centsToPesosInput(123456)` → "1234,56", `(150000000)` → "1500000",
    `(5)` → "0,05"; `formatCents(123456)` contiene "1.234,56" y `formatCents(150000000)` "1.500.000"
    (con ` ` tolerado). Falla antes porque el módulo no existe.
  - Cambios: aritmética sobre la cadena (parte entera y fraccionaria), sin `parseFloat` sin redondear;
    `formatCents` con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP',
    minimumFractionDigits: 0, maximumFractionDigits: 2 })`. `formatCOP` de `onboarding.shared.tsx` no se
    toca.
  - Verificar: npx vitest run __tests__/money/cents.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T4 · Fechas de presentación y "hoy" en Colombia (CA-7, CA-21)
  - Archivos: src/lib/utils/dateDisplay.ts, __tests__/utils/dateDisplay.test.ts
  - Test primero: __tests__/utils/dateDisplay.test.ts. Casos: `formatPlainDate("2026-10-01")` →
    "1 de octubre de 2026" (corre igual con `TZ=America/Bogota`: el test fija `process.env.TZ` o usa una
    fecha que en UTC−5 caería el día anterior); `formatPlainDate("2026-02-30")` y `("")` → "—";
    `todayInBogota(new Date("2026-10-28T03:00:00Z"))` → "2026-10-27" (ya es 28 en UTC);
    `todayInBogota(new Date("2026-10-27T15:00:00Z"))` → "2026-10-27";
    `formatBogotaDateTime("2026-10-28T03:00:00Z")` contiene "27" y la hora 10 p. m. (no 28 ni 3 a. m.).
    Falla antes porque el módulo no existe.
  - Cambios: `formatPlainDate` arma la fecha desde la cadena (`Date.UTC` + `timeZone: 'UTC'` o nombres
    de mes propios), nunca `new Date('AAAA-MM-DD')` en zona local; `todayInBogota` con
    `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })`; `formatBogotaDateTime` con
    `'es-CO'` y `timeZone: 'America/Bogota'`. `dateTime.ts` no se toca.
  - Verificar: npx vitest run __tests__/utils/dateDisplay.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T5 · Errores de la API sin `any` y rutas de `details` (CA-15, RN-15)
  - Archivos: src/lib/api/apiError.ts, __tests__/api/apiErrorDetails.test.ts
  - Test primero: __tests__/api/apiErrorDetails.test.ts. Casos: `toFormFieldPath("activities[0].ciiuCode")`
    → "activities.0.ciiuCode"; `("incomeReports[1].amountCents")` → "incomeReports.1.amount";
    `("currentCapacity")` → igual; `("incomeReports[10].periodEnd")` → "incomeReports.10.periodEnd";
    `readApiError` con un `AxiosError` construido a mano (status 400, `data: { message, details }`)
    devuelve `status`, `message` y `details`; con `details` no objeto → sin `details`; con un `Error`
    normal o `undefined` → `{}`; el resultado nunca incluye `config` ni cabeceras (se comprueba con
    `JSON.stringify` que no aparece "Authorization"). Falla antes porque el módulo no existe.
  - Cambios: `axios.isAxiosError` + guardia `isApiErrorBody(data: unknown)` sobre `ApiErrorBody` de
    `OnboardingService.ts`; `RENAMED_FIELDS = { amountCents: 'amount' }`.
  - Verificar: npx vitest run __tests__/api/apiErrorDetails.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T6 · Solapamiento de ingresos (CA-8, RN-10)
  - Archivos: src/lib/taxProfile/incomeOverlap.ts, __tests__/taxProfile/incomeOverlap.test.ts
  - Test primero: __tests__/taxProfile/incomeOverlap.test.ts. Casos: VENTAS 2026-01-01..2026-06-30
    CONSOLIDATED + VENTAS 2026-03-01..2026-03-31 EXTERNAL_ONLY → índices {0,1} (CA-8); los mismos sin
    cruzarse (2026-07-01..) → vacío; mismo alcance EXTERNAL_ONLY y cruzados → {0,1}; EXTERNAL_ONLY +
    PLATFORM_ONLY cruzados → vacío; distinto concepto (VENTAS / INGRESOS) → vacío; extremos que se tocan
    (fin = inicio) → chocan (igual que la API); tres filas donde solo dos chocan → solo esas dos; filas
    con fechas vacías o concepto/alcance sin elegir se ignoran. Falla antes porque el módulo no existe.
  - Cambios: `findIncomeOverlaps(rows: Array<{ concept?: string; scope?: string; periodStart?: string;
    periodEnd?: string }>): Set<number>`; comparación de cadenas `AAAA-MM-DD`.
  - Verificar: npx vitest run __tests__/taxProfile/incomeOverlap.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T7 · Catálogo y presentación de la ficha (CA-10, CA-11, CA-17, CA-18, CA-19, CA-20)
  - Archivos: src/lib/taxProfile/catalog.ts, src/lib/taxProfile/display.ts,
    __tests__/taxProfile/catalog.test.ts, __tests__/taxProfile/display.test.ts
  - Test primero: __tests__/taxProfile/catalog.test.ts: `groupCatalog` con entradas de dos tipos devuelve
    los cinco tipos, los otros tres vacíos; conserva el orden de la API; `catalogOptionLabel` →
    "R-99 — Régimen de prueba" (datos ficticios del test, ninguno real); `displayCode("X1", entries)` →
    "X1 — Etiqueta" si está y "X1" si no; `displayCode(null)` → "—".
    __tests__/taxProfile/display.test.ts: `commitmentDisplay(null)` → texto "Aún no registrado. Se
    manifiesta al aprobar el contrato", sin insignia; `MANIFESTED` → "Manifestado el {fecha} por {nombre}
    · versión {v}" con la fecha en hora de Colombia; NOT_MANIFESTED / EXPRESS_REFUSAL /
    TECHNICAL_INCIDENT → su insignia y tono del diccionario y `pendingClarification: true`; los cinco
    resultados son distintos entre sí y TECHNICAL_INCIDENT nunca usa el texto ni el tono de EXPRESS_REFUSAL
    (RN-2); `sectionReviewDisplay` con revisión `OBSERVED` y nota → "Observada" + nota, sin revisión →
    "Pendiente de revisión" (CA-17); `sortVersionsDesc` ordena 1,3,2 → 3,2,1 sin mutar la entrada;
    `vigentRutDocuments` deja solo `RUT` + `VALIDATED` (excluye `SUPERSEDED`, `PENDING` y otros tipos)
    (CA-11); `nextVersionMessage(3)` → "Se creará la versión 4. La anterior queda en el historial"
    (CA-19). Fallan antes porque los módulos no existen.
  - Verificar: npx vitest run __tests__/taxProfile/catalog.test.ts __tests__/taxProfile/display.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T8 · Esquema zod de la ficha y mapeos formulario ↔ API (CA-4, CA-5, CA-6, CA-7, CA-8, CA-9, CA-10, CA-11, CA-14, CA-15)
  - Archivos: src/lib/taxProfile/taxProfileSchema.ts, __tests__/taxProfile/taxProfileSchema.test.ts,
    __tests__/taxProfile/taxProfileMapping.test.ts
  - Test primero: __tests__/taxProfile/taxProfileSchema.test.ts (con `today = "2026-10-27"` fijo y un
    caso base válido): sin actividades → error en `activities`; cero y dos principales → error en
    `activities`; CIIU "123", "12a4", "12345" → error en `activities.N.ciiuCode`; dos CIIU "4711" → error
    en la fila repetida (CA-5); los tres Sí/No en `undefined` → "Selecciona una opción" en
    `invoicingObligated`, `withholdingAgent` y `hasAccountingAdvisor` (CA-6); `currentCapacity` "   " →
    error; 2001 caracteres → "Máximo 2000 caracteres"; notas de periodo de 501 → "Máximo 500 caracteres";
    fin < inicio, fin "2026-10-28", monto "-1" y monto "1234,567" ("Máximo 2 decimales", D-1 resuelta) → su texto de RN-9 en esa fila; sin periodos → error
    (CA-7); dos periodos de CA-8 → texto de RN-10 en `incomeReports.0.scope` e `incomeReports.1.scope`;
    los mismos sin cruzarse → válido (CA-8); `sectionForField("activities.0.ciiuCode")` →
    "B_REGIME_ACTIVITIES", `("incomeReports.2.amount")` → "E_INCOME", `("advisorScope")` →
    "H_ADVISORY", `("desconocido")` → `null` (CA-15).
    __tests__/taxProfile/taxProfileMapping.test.ts: `emptyTaxProfileValues()` trae una actividad y un
    periodo en blanco y los tres Sí/No en `undefined` (CA-6); `toSubmitRequest` con monto "1234,56" →
    `amountCents: 123456` (CA-9); códigos `''` → `null` (CA-10); RUT sin elegir →
    `rutDocumentId: null` (CA-11); "tiene asesor" No con texto en el alcance → `advisorScope` ausente
    (CA-14); textos opcionales vacíos → ausentes; `currency: 'COP'`; `supportDocumentId` de la fila se
    conserva (7 → 7, `null` → `null`, RN-11); `fromVersionDetail` con `amountCents: 123456` → "1234,56",
    booleanos y actividades tal cual, `null` → `''` (CA-4); un código que no está en el catálogo y un
    `rutDocumentId` que no está en `vigentRutIds` arrancan en `''` / `null` y se informan en
    `staleCodes` (D-3); ida y vuelta `toSubmitRequest(fromVersionDetail(x))` reproduce `x` en los campos
    del envío. Fallan antes porque el módulo no existe.
  - Cambios: lo descrito en el plan, 7.1. `createTaxProfileSchema({ today })` usa `findIncomeOverlaps`
    (T6) y `parsePesosInput` (T3) en `superRefine`; mensajes de D-5 y los literales de RN-8, RN-9 y RN-10.
    Sin `'use client'`.
  - Verificar: npx vitest run __tests__/taxProfile/taxProfileSchema.test.ts __tests__/taxProfile/taxProfileMapping.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T9 · Esquemas de sedes (CA-22, CA-23, CA-24, RN-14)
  - Archivos: src/lib/taxProfile/establishmentSchema.ts, __tests__/taxProfile/establishmentSchema.test.ts
  - Test primero: __tests__/taxProfile/establishmentSchema.test.ts. Casos: direcciones con "http",
    "HTTPS://x", "WwW.tienda", "Www.", "ventas@x", "@tienda" → el texto literal de RN-14 en `address`;
    "Calle 10 # 5-20" → válida; nombre vacío o de 151 → error; dirección de 301 → error; sin municipio o
    sin relación → error; relación fuera de OWNED/LEASED/FRANCHISE/OTHER → error; motivo de cierre vacío
    o "   " → error y de 301 → error, "Me trasladé" → válido (CA-24); `splitEstablishments` separa
    ACTIVE / CLOSED conservando el orden de la API (CA-22). Falla antes porque el módulo no existe.
  - Verificar: npx vitest run __tests__/taxProfile/establishmentSchema.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T10 · Servicios de ficha, sedes y declaración (CA-12, CA-16; contrato)
  - Archivos: src/services/commercial/TaxProfileService.ts, src/services/commercial/DeclarationService.ts,
    __tests__/taxProfile/taxProfileService.test.ts
  - Test primero: __tests__/taxProfile/taxProfileService.test.ts con
    `vi.mock('@/lib/api/client', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }))`.
    Casos: `getTaxProfile` con `{ status: 204, data: "" }` → `null`; con `{ status: 200, data: perfil }`
    → el perfil (CA-16); `submitTaxProfile(body)` → `put('/commercials/tax-profile', body)`;
    `listTaxProfileVersions` → `get('/commercials/tax-profile/versions')`; `getTaxProfileVersion(3)` →
    `get('/commercials/tax-profile/versions/3')`; `getTaxCatalog` → `/commercials/tax-profile/catalog`;
    `listEstablishments`, `createEstablishment(body)` → `post('/commercials/establishments', body)`;
    `closeEstablishment(5, { reason })` → `post('/commercials/establishments/5/close', { reason })`;
    `getDeclaration('FORMALIZATION_COMMITMENT', 'TAX_PROFILE')` →
    `get('/commercials/declarations/FORMALIZATION_COMMITMENT', { params: { context: 'TAX_PROFILE' } })`
    (CA-12); un error del cliente se propaga sin tocarlo (no se imprime). Falla antes porque los módulos
    no existen.
  - Cambios: funciones exportadas en un objeto `TaxProfileService` / `DeclarationService` como
    `OnboardingService`; tipadas con `src/types/commercial/*`; sin `console.*`.
  - Verificar: npx vitest run __tests__/taxProfile/taxProfileService.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

- [x] T11 · Claves de consulta, invalidaciones y hooks (CA-3, CA-13, RN-17)
  - Archivos: src/hooks/commercial/taxProfileKeys.ts, src/hooks/commercial/useTaxProfile.ts,
    __tests__/taxProfile/taxProfileKeys.test.ts
  - Test primero: __tests__/taxProfile/taxProfileKeys.test.ts. Casos: todas las claves son distintas
    entre sí y serializables; `version(1)` ≠ `version(2)`; `declaration(code, 'TAX_PROFILE')` ≠
    `declaration(code, 'CONTRACT_SHEET')`; `TAX_PROFILE_INVALIDATIONS.submit` contiene `profile`,
    `versions` y `onboardingAll`; `createEstablishment` y `closeEstablishment` contienen `establishments`
    y `profile`; `onboardingAll` es prefijo de `onboardingDocuments`. Falla antes porque el módulo no
    existe.
  - Cambios: `taxProfileKeys.ts` sin `'use client'`; `useTaxProfile.ts` con `'use client'` y los hooks de
    la tabla del plan (sección 6): `useTaxProfile`, `useTaxProfileVersions`, `useTaxProfileVersion`,
    `useTaxCatalog`, `useEstablishments`, `useOnboardingDocuments`, `useDeclaration`,
    `useSubmitTaxProfile` (`setQueryData` + invalidaciones), `useCreateEstablishment`,
    `useCloseEstablishment`. `retry` que no reintenta 403/404.
  - Verificar: npx vitest run __tests__/taxProfile/taxProfileKeys.test.ts && npx tsc --noEmit
  - Comprobar: no aplica.

## Bloque B · Componentes

- [x] T12 · Diálogo accesible e insignia compartidos (CA-12, CA-17, CA-18; accesibilidad)
  - Archivos: src/components/shared/Dialog.tsx, src/components/shared/StatusBadge.tsx
  - Test primero: no aplica (interfaz; sin pruebas de componentes).
  - Cambios: `Dialog` (`'use client'`) con portal, `role="dialog"`, `aria-modal`, `aria-labelledby`,
    pila de diálogos abiertos para que Escape cierre solo el de arriba, foco al panel al abrir y de vuelta
    al disparador al cerrar, scroll del fondo bloqueado, botón "Cerrar" con `aria-label`; modelado sobre
    `Modal` de `src/components/compliance/ui/primitives.tsx`, sin `framer-motion` ni clases `cmp-*`.
    `StatusBadge` sin `'use client'`, recibe `{ label, tone }` (tonos de T2).
  - Verificar: npx tsc --noEmit && npm run lint:ci
  - Comprobar: se comprueba en uso en T18-T20 (Escape, foco, anidado).
  - Nota: `Dialog` recibe `open` y `title` como props (no se monta condicionalmente) para poder restaurar el foco; la pila de diálogos es un arreglo de módulo.

- [x] T13 · Piezas del formulario (CA-6, CA-10, CA-12)
  - Archivos: src/components/commercial/tax-profile/CollapsibleSection.tsx,
    src/components/commercial/tax-profile/YesNoRadioGroup.tsx,
    src/components/commercial/tax-profile/CatalogSelect.tsx,
    src/components/commercial/tax-profile/CommitmentTextDialog.tsx
  - Test primero: la lógica ya probada en T7 (catálogo) y T10 (ruta del texto).
  - Cambios: `CollapsibleSection` (botón con `aria-expanded`/`aria-controls`, abierto controlado);
    `YesNoRadioGroup` (`fieldset`/`legend`, dos radios con el mismo `name`, sin valor inicial, error con
    `aria-describedby`); `CatalogSelect` / `CatalogMultiSelect` (opciones `catalogOptionLabel`, sin
    entradas → deshabilitado "Aún no disponible"; ningún código escrito en el componente, RN-4);
    `CommitmentTextDialog` (enlace con texto configurable, `useDeclaration(..., { enabled: open })`,
    `fullText` literal con `whitespace-pre-line`, nota "Este compromiso se manifiesta al aprobar el
    contrato", un único botón "Cerrar", sin casilla ni botón de aceptar; error "No pudimos cargar el
    texto" + "Reintentar" dentro del diálogo).
  - Verificar: npx tsc --noEmit && npm run lint:ci
  - Comprobar: en uso en T18 y T19.
  - Nota: se agregaron `Field.tsx` (etiqueta/ayuda/error asociados) y `FormFields.tsx` (`FormTextArea`, `FormTextInput`, `useFieldError`) en la misma carpeta, compartidos por las secciones y las sedes.

- [x] T14 · Gestión de sedes (CA-22, CA-23, CA-24, CA-25)
  - Archivos: src/components/commercial/establishments/EstablishmentsManager.tsx,
    src/components/commercial/establishments/EstablishmentFormDialog.tsx,
    src/components/commercial/establishments/CloseEstablishmentDialog.tsx
  - Test primero: los esquemas de T9.
  - Cambios: lo del plan, 7.4. Formularios con `useForm` + `zodResolver` (T9), envío con
    `mutateAsync` dentro de `try/catch` y `readApiError` (T5): éxito → toast "Sede registrada" / "Sede
    cerrada" y cierra; error → toast con `message` (o "No pudimos guardar la sede. Intenta de nuevo"), el
    diálogo sigue abierto con lo escrito. Botones deshabilitados mientras envían (RN-16). Departamento →
    municipio con `useDepartments` / `useMunicipalities` (`src/hooks/useLocation.ts`); al cambiar de
    departamento se limpia el municipio. Sin botones de editar ni eliminar.
  - Verificar: npx tsc --noEmit && npm run lint:ci
  - Comprobar: en T20.
  - Nota (revisión, ronda 1): ambos `<form>` cortan la propagación de `submit` (`e.stopPropagation()`); ver la nota de T15 para la comprobación manual.

- [x] T15 · Secciones a)–h) del formulario (CA-5, CA-6, CA-7, CA-8, CA-10, CA-11, CA-13, CA-14)
  - Archivos: src/components/commercial/tax-profile/sections/RutSection.tsx,
    RegimeActivitiesSection.tsx, VatIncSection.tsx, InvoicingSection.tsx, IncomeSection.tsx,
    EstablishmentsSummarySection.tsx, GrowthSection.tsx, AdvisorySection.tsx (misma carpeta)
  - Test primero: la lógica de T6, T7 y T8.
  - Cambios: lo del plan, 7.1, sección por sección, con `useFormContext` y `useFieldArray`. Actividades:
    un solo grupo de radio "Principal" para toda la lista; "Quitar" deshabilitado con una fila.
    Ingresos: tarjetas apiladas bajo `md`, vista previa del monto con `formatCents`, marca en vivo de las
    filas que chocan (`useWatch({ name: 'incomeReports' })` + `findIncomeOverlaps`), sin selector de
    soporte (RN-11). Sección f): N de `useEstablishments` y "Gestionar sedes" → `Dialog` con
    `EstablishmentsManager`. Sección h): alcance solo con "Sí" y la nota fija siempre visible. Textos
    de etiquetas y ayudas literales de la spec.
  - Verificar: npx tsc --noEmit && npm run lint:ci
  - Comprobar: en T18.
  - Nota: `OVERLAP_MESSAGE` pasó a exportarse desde `taxProfileSchema.ts` para reutilizar el literal de RN-10 en la marca en vivo.
  - Nota (revisión, ronda 1): el `Dialog` de "Gestionar sedes" vive dentro del `<form>` de la ficha y React propaga `submit` de un portal por su árbol; los `<form>` de `EstablishmentFormDialog` y `CloseEstablishmentDialog` ahora llaman a `e.stopPropagation()` antes de `handleSubmit`. Sin prueba de componentes (P-17), se comprueba a mano: abrir la ficha a medias (onboarding o "Editar ficha"), agregar una sede desde f) y cerrar otra; en Network no sale ningún `PUT` de la ficha, no aparecen errores de validación ni se abre "Se creará la versión N+1". Los otros diálogos del árbol (`CommitmentTextDialog` y la confirmación de `TaxInfoScreen`) no tienen `<form>` y esta última queda fuera del formulario. Además, el alcance de la asesoría (h) solo se valida (máx. 1000) con "Sí" en `taxProfileSchema.ts`.

- [x] T16 · Formulario y contenedor de carga (CA-3, CA-4, CA-10, CA-11, CA-15; P-11)
  - Archivos: src/components/commercial/tax-profile/TaxProfileForm.tsx,
    src/components/commercial/tax-profile/TaxProfileFormContainer.tsx
  - Test primero: la lógica de T5 y T8.
  - Cambios: `TaxProfileForm` (`'use client'`): `useForm({ resolver: zodResolver(createTaxProfileSchema({
    today: todayInBogota() })), defaultValues })`, `FormProvider`, bloque informativo literal de 4.1,
    `CommitmentTextDialog` "Leer el compromiso de formalización", ocho `CollapsibleSection` con títulos del
    diccionario, estado de secciones abiertas; `onInvalid` y los `details` de un 400 abren su sección
    (`sectionForField`) y enfocan el primer error; botón `type="submit"` con la etiqueta del modo,
    deshabilitado con `isSubmitting`; prop `confirmBeforeSubmit?: (request) => Promise<boolean>` para el
    perfil (T19); `onSubmit` hace `mutateAsync(toSubmitRequest(values))` y luego `await onSaved(response)`;
    error → toast con `message` o "No pudimos guardar tu ficha. Intenta de nuevo", `setError` por cada
    `details` con `toFormFieldPath`, claves sin campo sumadas al toast; lo escrito se conserva.
    Ayudas de D-3 para `staleCodes`. `TaxProfileFormContainer`: las cuatro consultas en paralelo
    (`useTaxProfile`, `useTaxCatalog`, `useEstablishments`, `useOnboardingDocuments`); cargando →
    `Loader2`; error → "No pudimos cargar tu ficha tributaria" + "Reintentar" (refetch de las que
    fallaron); 403 → "No tienes permiso para ver esta información"; con datos → valores iniciales con
    `fromVersionDetail` o `emptyTaxProfileValues`. Sin `console.*`.
  - Verificar: npx tsc --noEmit && npm run lint:ci
  - Comprobar: en T18 y T19.
  - Nota: las ayudas de D-3 (`staleCodes` / `staleRut`) se muestran en un aviso único sobre las secciones, porque `fromVersionDetail` no indica a qué campo pertenece cada código. El esquema se arma en cada validación con `todayInBogota()` vía un `resolver` envolvente. `lint:ci` no se pudo ejecutar en este entorno (ver reporte).

## Bloque C · Onboarding

- [x] T17 · Paso nuevo en el tipo y en el stepper (CA-1)
  - Archivos: src/components/commercial/onboarding/onboardingSteps.ts,
    src/services/commercial/OnboardingService.ts,
    src/components/commercial/onboarding/OnboardingWizard.tsx,
    __tests__/onboarding/onboardingSteps.test.ts
  - Test primero: __tests__/onboarding/onboardingSteps.test.ts. Casos: `STEP_LABELS` es exactamente
    Términos, Identificación, Diagnóstico, Plan, Documentos, Ficha tributaria, Contrato, Pago;
    `STEP_INDEX.TAX_PROFILE_PENDING === 5` y `STEP_LABELS[5] === "Ficha tributaria"`;
    `STEP_INDEX.DOCUMENTS_PENDING === 4`; CONTRACT_PENDING, BUSINESS_REVIEW_PENDING,
    VERYGANA_REVIEW_PENDING y SIGNATURE_PENDING === 6; PAYMENT_PENDING === 7; los pasos anteriores sin
    cambio. Falla antes porque el módulo no existe.
  - Cambios: `'TAX_PROFILE_PENDING'` en `OnboardingStep` entre `DOCUMENTS_PENDING` y `CONTRACT_PENDING`;
    `onboardingSteps.ts` (sin `'use client'`) exporta `WizardStep`, `STEP_LABELS` y `STEP_INDEX` con su
    comentario actual; el asistente los importa y borra los locales. Sin otros cambios en el asistente.
  - Verificar: npx vitest run __tests__/onboarding/onboardingSteps.test.ts && npx tsc --noEmit && npm run lint:ci
  - Comprobar: `/commercial-onboarding` con un empresario en `DOCUMENTS_PENDING`: el stepper muestra 8
    burbujas y "Documentos" es la quinta activa.
  - Nota: prueba vista fallar (el módulo `onboardingSteps` no existía) y luego en verde. `OnboardingStep` ganó `TAX_PROFILE_PENDING` en `OnboardingService.ts` (único archivo extra tocado). Falta la comprobación manual del stepper de 8 burbujas.

- [x] T18 · Paso "Ficha tributaria" en el asistente (CA-1, CA-2, CA-3, CA-4, CA-5 a CA-15 en pantalla)
  - Archivos: src/components/commercial/onboarding/steps/5b-TaxProfileStep.tsx,
    src/components/commercial/onboarding/OnboardingWizard.tsx
  - Test primero: la lógica de T8, T11 y T17.
  - Cambios: `TaxProfileStep` con título "Ficha tributaria" y `TaxProfileFormContainer mode="onboarding"`
    ("Guardar y continuar"). En el asistente: rama `step === "TAX_PROFILE_PENDING"` y
    `handleTaxProfileSaved` (relee `getStatus()`, `syncRejectionState`, `onCompleted()` si `completed`,
    si no `setStep(status.currentStep)`; si falla, toast con el texto de D-4). `handleDocumentsNext` no
    cambia.
  - Verificar: npx tsc --noEmit && npm run lint:ci
  - Comprobar (en `/commercial-onboarding`):
    1. CA-2: en Documentos con todo cargado y sin ficha, "Continuar" → se ve "Ficha tributaria" y la
       sexta burbuja activa (CA-1), las cinco anteriores con check. Recargar la página: sigue en el mismo
       paso (CA-1). Con una ficha ya enviada (p. ej. tras "Solicitar cambios" del contrato), "Continuar"
       lleva al contrato.
    2. En Network: al entrar salen en paralelo `tax-profile`, `tax-profile/catalog`, `establishments` y
       `onboarding/documents`.
    3. Sin RUT vigente: "No tienes un RUT vigente cargado" (CA-11). Un tipo de catálogo sin entradas:
       selector deshabilitado "Aún no disponible" (CA-10); los demás con opciones `código — etiqueta`.
    4. Enviar vacío: "Selecciona una opción" en las tres preguntas Sí/No, ninguna marcada al abrir
       (CA-6); errores de actividad y periodo bajo su campo, las secciones con error se abren (CA-5,
       CA-7); en Network no sale ningún `PUT`.
    5. Dos periodos de Ventas cruzados, uno "Total que ya incluye VERYGANA" y otro "Solo operaciones fuera
       de VERYGANA": ambas filas marcadas con el texto de RN-10 y no se envía; al mover uno fuera del
       rango, la marca desaparece (CA-8).
    6. "Leer el compromiso de formalización": diálogo con el texto, la nota y solo "Cerrar"; Escape
       cierra y el foco vuelve al enlace. Con la API apagada para esa ruta (o sin red), "No pudimos
       cargar el texto" dentro del diálogo y el formulario sigue usable (CA-12).
    7. Sección f): "Gestionar sedes", registrar una sede, cerrar el diálogo: "Tienes N establecimientos
       activos" sube en uno (CA-13). Escape en el diálogo anidado cierra solo ese.
    8. Sección h): la nota fija siempre; el alcance aparece solo con "Sí" (CA-14).
    9. Monto `1234,56` → en el cuerpo del `PUT` (Network → Payload) `amountCents: 123456` (CA-9) Monto `1234,567` → "Máximo 2 decimales" y no se envía (CA-9).
    10. Forzar un 400 con `details` (p. ej. un CIIU que pase el front pero la API rechace, o la API con
        un `details` de `activities[0].ciiuCode`): toast con el `message` y el detalle bajo el CIIU de la
        primera actividad, con su sección abierta (CA-15).
    11. Ficha válida → "Guardar y continuar" se deshabilita durante el envío y la relectura (CA-3); al
        terminar se ve el paso del contrato. Volver a Documentos con "Solicitar cambios" y regresar: el
        formulario (vía perfil, T19) arranca con la versión vigente y montos en pesos (CA-4).
    12. A 360 px de ancho: sin scroll horizontal, actividades y periodos como tarjetas.
  - Nota: implementado; `handleTaxProfileSaved` usa el texto de D-4. Faltan por comprobar a mano en el navegador los puntos 1 a 12 de "Comprobar" (no se pudo abrir el navegador).

## Bloque D · Páginas, perfil y cierre

- [x] T19 · `/commercial/profile/tax-info` (CA-4, CA-16 a CA-21, CA-27)
  - Archivos: src/app/commercial/profile/tax-info/page.tsx,
    src/components/commercial/tax-profile/TaxInfoScreen.tsx,
    src/components/commercial/tax-profile/TaxProfileReadView.tsx,
    src/components/commercial/tax-profile/CommitmentBlock.tsx,
    src/components/commercial/tax-profile/TaxProfileHistory.tsx
  - Test primero: la lógica de T4, T7, T10 y T11; `__tests__/middleware` ya existe y debe seguir en verde
    con la página nueva.
  - Cambios: lo del plan, 7.3. `page.tsx` de servidor (sin `'use client'`), con `export const metadata`
    ("Información tributaria"), `Link` "Volver a Mi perfil" a `/commercial/profile` y `<TaxInfoScreen />`.
    Edición con `confirmBeforeSubmit` que abre `Dialog` con `nextVersionMessage(currentVersion)`
    (Confirmar / Cancelar); "Completar ficha" sin confirmación (D-2). Pestañas con estado local (nada en
    la URL). Historial con `useTaxProfileVersions({ enabled })` y `useTaxProfileVersion(n)`; 404 → "No
    encontramos esa versión".
  - Verificar: npx vitest run __tests__/middleware && npm run build && npx tsc --noEmit && npm run lint:ci
  - Comprobar (en `/commercial/profile/tax-info`):
    1. Empresario sin ficha (204): "Aún no has diligenciado tu ficha tributaria" y "Completar ficha";
       completar y enviar: toast "Ficha enviada. Versión 1" y la vista de lectura con "Versión 1" (CA-16).
    2. Cabecera con "En revisión", "Versión N" y la fecha de actualización en hora de Colombia (comparar
       con `updatedAt` de Network) (CA-21). Un periodo `2026-10-01` se lee "1 de octubre de 2026".
    3. Ficha `OBSERVED` con la sección e) observada (revisión hecha por la API de compliance): insignia
       "Con observaciones", banner naranja literal, "Observada" y la nota en e), "Pendiente de revisión"
       en las demás (CA-17). Si no se puede producir el caso, anotarlo en el PR (R-1).
    4. Bloque del compromiso: con `null`, "Aún no registrado. Se manifiesta al aprobar el contrato" y
       "Leer texto"; ninguna casilla en la página (CA-18). Los demás valores, si la API permite
       producirlos; si no, anotarlo (R-1).
    5. Con la versión 3: "Editar ficha", formulario precargado con montos en pesos (CA-4); enviar → "Se
       creará la versión 4. La anterior queda en el historial"; Cancelar → en Network no sale `PUT`;
       Confirmar → "Versión 4" (CA-19). "Cancelar edición" vuelve sin enviar.
    6. Historial: versiones de la más reciente a la más antigua con su fecha; elegir una → lectura sin
       insignias de revisión ni "Editar ficha" (CA-20).
    7. 360 px sin scroll horizontal; la URL no cambia al usar pestañas o versiones.
  - Nota: verificado: `npm run build`, `npx tsc --noEmit` y eslint sin avisos nuevos; `npm test` solo falla `/explore/recognitions` (ajeno); `tax-info` no sale sin clasificar (cubierta por el prefijo `/commercial`). Comprobaciones manuales 1 a 7 de "Comprobar" PENDIENTES (no se abrió el navegador).

- [x] T20 · `/commercial/profile/establishments` (CA-13, CA-22 a CA-25, CA-27)
  - Archivos: src/app/commercial/profile/establishments/page.tsx
  - Test primero: los esquemas de T9; `__tests__/middleware` debe seguir en verde.
  - Cambios: `page.tsx` de servidor (sin `'use client'`), `metadata` ("Establecimientos"), `Link` de vuelta
    a `/commercial/profile`, título y `<EstablishmentsManager />`.
  - Verificar: npx vitest run __tests__/middleware && npm run build && npx tsc --noEmit && npm run lint:ci
  - Comprobar (en `/commercial/profile/establishments`):
    1. Sin sedes: "Aún no tienes sedes registradas" y "Agregar sede"; el grupo "Cerrados" no aparece.
    2. "Agregar sede" con dirección `WWW.tienda.com`, `Http://x` o `ventas@x`: el texto de RN-14 bajo la
       dirección y en Network no sale `POST` (CA-23). Con datos válidos (departamento → municipio): toast
       "Sede registrada" y aparece en "Activos" con nombre, dirección, municipio y relación (CA-23).
    3. Registrar otra sede con la misma dirección y municipio: toast con el `message` de la API y el
       diálogo sigue abierto con lo escrito (CA-25).
    4. "Cerrar sede" con el motivo vacío: no se envía; con motivo: toast "Sede cerrada", la sede pasa a
       "Cerrados" (plegado por defecto) con la fecha y el motivo (CA-24, CA-22). No hay botones de editar
       ni eliminar; se ven las dos ayudas (CA-22).
    5. Escape en cada diálogo cierra solo ese y el foco vuelve a su botón.
    6. Volver a `/commercial/profile/tax-info` → "Editar ficha" → sección f): N refleja las activas
       (CA-13). 360 px sin scroll horizontal.
  - Nota: verificado igual que T19; `establishments` bajo `/commercial` no sale sin clasificar. Comprobaciones manuales 1 a 6 PENDIENTES.

- [x] T21 · Accesos desde "Mi perfil" (CA-26)
  - Archivos: src/components/commercial/profile/TaxAndEstablishmentsLinks.tsx,
    src/components/commercial/profile/CommercialProfileSeller.tsx,
    src/components/commercial/profile/CommercialProfilePremium.tsx
  - Test primero: no aplica (interfaz).
  - Cambios: tarjeta "Información tributaria y sedes" con `next/link` a las dos rutas, sin
    `'use client'`; se inserta después del bloque "Tu plan" en las dos vistas. `Sidebar` sin cambios.
  - Verificar: npx tsc --noEmit && npm run lint:ci
  - Comprobar: `/commercial/profile` con un empresario de plan no Premium y con uno Premium: en ambos el
    bloque "Información tributaria y sedes" con los dos enlaces, y cada enlace abre su pantalla.
  - Nota: verificado: `tsc` y eslint; `CommercialProfileSeller.tsx` conserva sus 2 avisos `no-explicit-any` previos (iguales en HEAD, líneas 112/131 antes), `CommercialProfilePremium.tsx` sin avisos. Comprobación manual en navegador (plan no Premium y Premium) PENDIENTE.

- [x] T22 · Barrido de PII y revisión de textos (CA-28, CA-29)
  - Archivos: __tests__/taxProfile/noPiiLeaks.test.ts
  - Test primero: __tests__/taxProfile/noPiiLeaks.test.ts. (1) `scanForLeaks(source)` (función del
    propio archivo de prueba) sobre fragmentos: `console.log(x)`, `localStorage.setItem`,
    `sessionStorage`, `new URLSearchParams`, `window.location`, `router.push(\`/x?y=${z}\`)` y
    `href={\`/x?${q}\`}` → violación; `toast.error(message)` y `href="/commercial/profile"` → sin
    violación. (2) Recorre los archivos nuevos de esta entrega (las carpetas
    `src/components/commercial/tax-profile`, `src/components/commercial/establishments`,
    `src/lib/taxProfile`, `src/lib/money`, y los archivos de `src/lib/api/apiError.ts`,
    `src/lib/utils/dateDisplay.ts`, `src/lib/labels/taxCompliance.ts`, los dos servicios, los dos
    archivos de hooks, `5b-TaxProfileStep.tsx`, `onboardingSteps.ts`, `src/components/shared/Dialog.tsx`,
    `StatusBadge.tsx`, `TaxAndEstablishmentsLinks.tsx` y las dos `page.tsx`), exige que la lista no esté
    vacía y que no haya violaciones. Ver fallar la parte (1) antes de escribir `scanForLeaks` y la parte
    (2) agregando a mano un `console.log` en un archivo nuevo (y quitarlo).
  - Cambios: solo la prueba. Además, revisión de textos (CA-29): `grep -rniE "(cambia|modifica|mejora).{0,40}(iva|r[eé]gimen|vocaci[oó]n|comisi[oó]n|plan)" src/components/commercial/tax-profile src/components/commercial/establishments src/lib/labels src/lib/taxProfile`
    sin resultados, y `grep -rnE "['\"][A-Z]{1,3}-?[0-9]{1,3}['\"]" src/components/commercial/tax-profile src/lib/taxProfile`
    sin códigos de catálogo escritos a mano (RN-4); anotar el resultado en la tarea.
  - Verificar: npx vitest run __tests__/taxProfile/noPiiLeaks.test.ts && npx tsc --noEmit
  - Comprobar: tras T18-T20, con DevTools: Console sin mensajes con datos de la ficha o sedes; la URL de
    las tres pantallas sin query; Application → Local Storage y Session Storage sin claves nuevas de esta
    funcionalidad (CA-28).
  - Nota: `noPiiLeaks.test.ts` pasa dentro de `npm test` (25 archivos verdes). CA-29: el grep de textos no dio resultados; el grep de códigos de catálogo escritos a mano no dio resultados. Comprobación manual con DevTools (Console, URL, Storage) PENDIENTE.

- [x] T23 · Puertas finales (CA-27, CA-30)
  - Archivos: .lint-max-warnings (solo si `lint:ci` pide bajarlo)
  - Test primero: no aplica.
  - Cambios: ninguno salvo bajar `.lint-max-warnings` al número que indique `lint:ci`.
  - Verificar: npm test && npm run lint:ci && npm run build && npx tsc --noEmit && npm run audit:ci
  - Comprobar: `head -1 src/app/commercial/profile/tax-info/page.tsx src/app/commercial/profile/establishments/page.tsx`
    no muestra `'use client'` (CA-27); `git diff --stat -- src/middleware.ts __tests__/middleware/routeAccess.ts package.json package-lock.json`
    vacío (CA-27, CA-30); `.lint-max-warnings` ≤ 348; en la salida de `npm run build`, anotar el "First
    Load JS" de `/commercial-onboarding` y `/commercial/profile/tax-info` (R-6). Recopilar en el PR las
    comprobaciones manuales de T18-T22 y lo que no se pudo producir (R-1, excepción de P-17).
  - Nota: `npm test` 936/937, solo falla `/explore/recognitions`. `npm run lint:ci` sale con 3 ("`next lint` no produjo reporte"); `npx next lint`: 0 errores, 352 avisos; eslint sobre los 51 archivos nuevos o tocados: 0 errores y 2 avisos `no-explicit-any` previos de `CommercialProfileSeller.tsx` (no son de la spec). `npm run build` verde; First Load JS: `/commercial-onboarding` 233 kB (28.3 kB de página), `/commercial/profile/tax-info` 209 kB (5.59 kB), `/commercial/profile/establishments` 196 kB (2.06 kB), compartido 103 kB. `npx tsc --noEmit` verde. `npm run audit:ci` sale con 3 ("spawnSync npm ENOENT", el mismo problema de Windows que lint-ratchet), no con 2; `npm audit --omit=dev` suelto: 2 altos (`xlsx`, `postcss`) con excepciones en `security/audit-exceptions.json`; la puerta no se ejecutó. `head -1` de las dos `page.tsx`: `import type { Metadata } from 'next';` (sin `'use client'`). `git diff --stat` de middleware, routeAccess, package.json y package-lock.json: vacío. `.lint-max-warnings` = 348, sin tocar.
  - Pendientes ajenos a la spec (decisión del usuario): (1) `routeProtection.test.ts` falla por `/explore/recognitions` sin clasificar; (2) `next lint` da 352 avisos frente al tope 348 (también 348 en origin/main); (3) en Windows `lint:ci` (y `audit:ci`) salen con 3 porque el script no encuentra `npx`/`npm`.
  - Auditoría (coordinador, 2026-10-28): con `npm audit --omit=dev --json` y las excepciones en mano, los 4 avisos altos (`xlsx` ×2, `postcss` ×2) tienen excepción vigente (revisión 2026-11-30); el resto es moderado o bajo (`postcss` ×2, `fast-uri` ×4), que la puerta no bloquea. La spec no cambia `package.json` ni el lockfile. La puerta en sí debe confirmarse en el CI (Linux).
  - Comprobaciones manuales pendientes para el PR (no se abrió el navegador): T17 stepper de 8 burbujas con "Documentos" quinta activa; T18 puntos 1 a 12 en `/commercial-onboarding` (CA-1 a CA-15); T19 puntos 1 a 7 en `/commercial/profile/tax-info`; T20 puntos 1 a 6 en `/commercial/profile/establishments`; T21 bloque "Información tributaria y sedes" en `/commercial/profile` con plan no Premium y Premium; T22 DevTools (Console sin datos de ficha o sedes, URL sin query, Local/Session Storage sin claves nuevas). Sin pruebas de componentes (R-1, excepción de P-17).

---

## Trazabilidad CA → tareas

| CA | Tareas | Verificación |
|---|---|---|
| CA-1 | T17, T18 | `__tests__/onboarding/onboardingSteps.test.ts`; manual T18.1 |
| CA-2 | T18 | manual T18.1 |
| CA-3 | T11, T16, T18 | `__tests__/taxProfile/taxProfileKeys.test.ts`; manual T18.11 |
| CA-4 | T8, T16, T18, T19 | `__tests__/taxProfile/taxProfileMapping.test.ts`; manual T18.11, T19.5 |
| CA-5 | T8, T15 | `__tests__/taxProfile/taxProfileSchema.test.ts`; manual T18.4 |
| CA-6 | T8, T13, T15 | `taxProfileSchema.test.ts`, `taxProfileMapping.test.ts`; manual T18.4 |
| CA-7 | T3, T4, T8, T15 | `__tests__/money/cents.test.ts`, `__tests__/utils/dateDisplay.test.ts`, `taxProfileSchema.test.ts`; manual T18.4 |
| CA-8 | T6, T8, T15 | `__tests__/taxProfile/incomeOverlap.test.ts`, `taxProfileSchema.test.ts`; manual T18.5 |
| CA-9 | T3, T8 | `cents.test.ts`, `taxProfileMapping.test.ts`; manual T18.9 |
| CA-10 | T7, T8, T13 | `__tests__/taxProfile/catalog.test.ts`, `taxProfileMapping.test.ts`; manual T18.3 |
| CA-11 | T7, T8, T15 | `__tests__/taxProfile/display.test.ts`, `taxProfileMapping.test.ts`; manual T18.3 |
| CA-12 | T10, T13 | `__tests__/taxProfile/taxProfileService.test.ts`; manual T18.6 |
| CA-13 | T11, T14, T15 | `taxProfileKeys.test.ts`; manual T18.7, T20.6 |
| CA-14 | T8, T15 | `taxProfileMapping.test.ts`; manual T18.8 |
| CA-15 | T5, T8, T16 | `__tests__/api/apiErrorDetails.test.ts`, `taxProfileSchema.test.ts`; manual T18.10 |
| CA-16 | T10, T19 | `taxProfileService.test.ts`; manual T19.1 |
| CA-17 | T2, T7, T19 | `__tests__/taxProfile/labels.test.ts`, `display.test.ts`, `catalog.test.ts`; manual T19.3 |
| CA-18 | T2, T7, T19 | `labels.test.ts`, `display.test.ts`; manual T19.4 |
| CA-19 | T7, T16, T19 | `display.test.ts`; manual T19.5 |
| CA-20 | T7, T19 | `display.test.ts`; manual T19.6 |
| CA-21 | T4, T19 | `dateDisplay.test.ts`; manual T19.2 |
| CA-22 | T9, T14, T20 | `__tests__/taxProfile/establishmentSchema.test.ts`; manual T20.4 |
| CA-23 | T9, T14, T20 | `establishmentSchema.test.ts`; manual T20.2 |
| CA-24 | T9, T14, T20 | `establishmentSchema.test.ts`; manual T20.4 |
| CA-25 | T14, T20 | manual T20.3 |
| CA-26 | T21 | manual T21 |
| CA-27 | T19, T20, T23 | `npx vitest run __tests__/middleware`; comprobación de T23 |
| CA-28 | T22 | `__tests__/taxProfile/noPiiLeaks.test.ts`; manual T22 |
| CA-29 | T2, T22 | `labels.test.ts`; `grep` de T22 |
| CA-30 | T23 | `npm test`, `npm run lint:ci`, `npm run build`, `npx tsc --noEmit`, `npm run audit:ci`; `git diff` de T23 |
