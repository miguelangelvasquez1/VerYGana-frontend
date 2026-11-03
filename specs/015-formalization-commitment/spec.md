# 015 · Compromiso de formalización en la aprobación del contrato (entrega B)

- **Estado:** Aprobada
- **Fecha:** 2026-10-28
- **Ticket:** —
- **Origen:** API · `docs/frontend/instrucciones-frontend-caracterizacion.md` (copiado en
  `specs/014-tax-profile-and-compliance-case/backend-contract.md`, secciones 1.3, 2 y 4.4) ·
  numerales 1.7 y 4.7 del contrato. Controllers y servicios del repositorio de la API:
  `controllers/commercial/CommercialContractController.java` (`POST /approve`),
  `controllers/declarations/DeclarationController.java`,
  `services/declarations/DeclarationServiceImpl.java` (`recordContractManifestation`, `classify`),
  `dtos/user/commercial/onboarding/ContractApproveRequestDTO.java` y `ContractSummaryResponseDTO.java`.

> Es la entrega **B** de cuatro (ver `specs/014-tax-profile-and-compliance-case/instrucciones.md`,
> sección 1, y la fase 4). Depende de la A (spec 014): reutiliza sus tipos
> (`src/types/commercial/Declaration.types.ts`), `DeclarationService`, `useDeclaration`, el diccionario
> de `src/lib/labels` y el `Dialog` compartido. Para endpoints, campos y textos manda
> `backend-contract.md`; donde este documento lo precisa con lo que hace la API de verdad, manda este.

## Problema

La API ya registra el **compromiso de crecimiento y formalización** (apartado 9 de la Hoja Final de
Aceptación Electrónica) en el momento en que el empresario aprueba el Contrato Marco: espera en
`POST /commercials/onboarding/contract/approve` un cuerpo con la decisión de la casilla y la cabecera
`Idempotency-Key`. Hoy el paso "Revisa tu contrato" del onboarding llama a ese endpoint **sin cuerpo**:
el empresario nunca ve el texto del compromiso ni puede manifestarlo o negarse, y la API registra
siempre "no manifestado", lo que obliga a VERYGANA a pedirle una aclaración que se podía evitar.

El compromiso es una declaración legal: el texto se muestra literal y completo, la casilla nunca viene
marcada, se manifiesta una sola vez y solo aquí, y no marcarla nunca impide aprobar el contrato.

## Actores y roles

| Actor | Rol en el sistema | Qué ve y qué puede hacer en esta funcionalidad |
|-------|-------------------|------------------------------------------------|
| Empresario (representante legal) | `ROLE_COMMERCIAL` | En el paso "Revisa tu contrato" del onboarding lee el apartado 9 completo; marca la casilla, la deja sin marcar o declara expresamente que no acepta (con motivo opcional); aprueba el contrato en cualquiera de los tres casos. |

## Historias de usuario

- Como empresario, quiero leer el compromiso de formalización completo antes de aprobar mi contrato,
  para saber exactamente qué declaro.
- Como empresario, quiero poder manifestar el compromiso, no hacerlo o negarme expresamente, sin que
  eso me impida aprobar el contrato.
- Como empresario que ya manifestó el compromiso en este contrato, quiero ver esa evidencia en lugar de
  que me lo pidan otra vez.

## Pantallas y flujo

- **Ruta afectada:** `/commercial-onboarding`, paso `BUSINESS_REVIEW_PENDING` ("Revisa tu contrato",
  `ContractReviewStep`). No hay rutas nuevas ni cambios en el middleware ni en `routeAccess.ts`.
- **Flujo:**
  1. El empresario llega al paso con el contrato generado. Al mostrarse el paso, el front pide el texto
     vigente (`GET /commercials/declarations/FORMALIZATION_COMMITMENT?context=CONTRACT_SHEET`).
  2. Entre el aviso "Si tienes alguna objeción con el contrato…" y el botón "Aprobar contrato" aparece el
     bloque **"Hoja Final de Aceptación Electrónica"** (RN-2).
  3. El empresario puede:
     - marcar "Manifiesto expresamente este compromiso" (decisión `ACCEPT`);
     - pulsar "No acepto este compromiso", confirmar en un diálogo con motivo opcional (decisión
       `REFUSE`); aparece el chip "No aceptado — Deshacer";
     - no hacer nada (decisión ninguna).
  4. Pulsa "Aprobar contrato" (siempre habilitado salvo mientras envía). El front envía la decisión, la
     versión del texto mostrada y, si aplica, el motivo, con la cabecera `Idempotency-Key`.
  5. Con 200, sigue el flujo actual: pasa a "Contrato en revisión" (`VERYGANA_REVIEW_PENDING`).
- **Diálogo "¿Confirmas que no aceptas este compromiso?":** textarea opcional "Motivo" (máx. 1000
  caracteres, con contador), botones "Confirmar" y "Cancelar". Cancelar no cambia nada.

### Estados de pantalla (bloque del apartado 9)

| Estado | Qué se muestra |
|--------|----------------|
| Cargando | Esqueleto del bloque con el título; el botón "Aprobar contrato" **sigue habilitado** (RN-6). |
| Vacío | No aplica: siempre hay un texto activo; si la API no lo tiene responde error (fila siguiente). |
| Error (red, 5xx, 404) | Dentro del bloque: "No pudimos cargar el compromiso de formalización." + botón "Reintentar" + nota "Puedes aprobar tu contrato igual; VERYGANA te pedirá una aclaración después." Sin casilla ni enlace. "Aprobar contrato" habilitado; se aprueba sin decisión (RN-6). |
| Sin permiso (401, 403) | 401 lo maneja el interceptor. 403: "No tienes permiso para ver esta información" dentro del bloque; aprobar sigue habilitado (la API decide). |
| Éxito sin manifestación previa válida | Texto completo, casilla desmarcada, enlace "No acepto este compromiso", nota fija (RN-2). |
| Éxito con manifestación vigente (RN-5) | Texto completo y, en lugar de la casilla y el enlace: "✓ Ya manifestaste este compromiso el {fecha en hora de Colombia} (versión {declarationVersion})". |
| Enviando | "Aprobar contrato" deshabilitado con indicador; casilla, enlace, "Deshacer" y "Reintentar" (del estado de error) deshabilitados. |

## Contrato con la API

| Endpoint | Método | Rol | Entrada (DTO) | Salida (DTO) | Errores y qué ve el usuario |
|----------|--------|-----|---------------|--------------|-----------------------------|
| `/commercials/declarations/FORMALIZATION_COMMITMENT?context=CONTRACT_SHEET` | GET | `ROLE_COMMERCIAL` | — | `DeclarationView` (`code`, `version`, `fullText`, `textHash`, `manifestation`) | Cualquier error: estado "Error" del bloque; no bloquea aprobar (RN-6). |
| `/commercials/onboarding/contract/approve` | POST | `ROLE_COMMERCIAL` | `ContractApproveRequest` (`declarationVersion?`, `decision?`, `refusalReason?` ≤ 1000) + cabecera `Idempotency-Key` | `ContractSummaryResponseDTO` (superconjunto de `OnboardingContract`: añade `esignatureSentAt`, `esignatureSignedAt`, `documents`, `businessProfile`, `diagnosticAnswers`) | 4xx con `message` (400 de validación, 422 de regla de negocio): toast con el `message` (salvo RN-9). Error de red / 5xx: toast "No pudimos aprobar tu contrato. Intenta de nuevo" y se conserva la decisión (RN-8, RN-9). |
| `/commercials/onboarding/status` (ya existe) | GET | `ROLE_COMMERCIAL` | — | `OnboardingStatus` | Solo se usa tras un error al aprobar (RN-9). |

Comportamiento de la API que la spec tiene en cuenta (`DeclarationServiceImpl`):

- Cada `GET` de la declaración **registra** que el texto se puso a disposición del empresario.
- Sin `decision` → `NOT_MANIFESTED`. Con `decision` pero `declarationVersion` distinta de la vigente →
  `TECHNICAL_INCIDENT` (nunca se cuenta como aceptación ni negativa). `REFUSE` → `EXPRESS_REFUSAL` con el
  motivo. `ACCEPT` → `MANIFESTED`.
- Si ya hay `MANIFESTED` para **este contrato y esta versión del texto**, no registra otra.
- `manifestation` del `GET` es la última `MANIFESTED` del empresario (de cualquier contrato o versión)
  o, si no hay, la última de cualquier estado.
- La `Idempotency-Key` solo protege el registro de la manifestación: un reintento de una aprobación que
  ya se aplicó responde 422 "El contrato no está pendiente de revisión del empresario." (RN-9).

Ejemplo de cuerpo (datos ficticios):

```json
{ "declarationVersion": "1.0", "decision": "REFUSE", "refusalReason": "Lo revisaré con mi contador." }
```

## Reglas de negocio

- **RN-1 · Casilla nunca premarcada (L-1):** la casilla arranca desmarcada **siempre**, cada vez que se
  muestra el paso. No se inicializa desde `localStorage`, `sessionStorage`, la caché de consultas, la
  respuesta de la API (incluida una manifestación anterior), ni desde otra casilla. Nada la marca salvo
  un clic (o la tecla espacio) del empresario sobre ella: ni navegar, ni recargar, ni pulsar "Aprobar".
- **RN-2 · Bloque del apartado 9 (L-3):** textos literales:
  - Título "Hoja Final de Aceptación Electrónica"; subtítulo "Apartado 9. Compromiso de crecimiento y
    formalización"; "(versión {version})".
  - `fullText` **literal y completo**, respetando sus saltos de línea, dentro de una **caja con scroll
    propio** (decisión del usuario) de alto máximo. La caja es enfocable con teclado, tiene nombre
    accesible ("Texto del compromiso de formalización") y una indicación visible "Desplázate para leer
    el texto completo" cuando el texto no cabe. Nunca se recorta, resume ni trunca con "…".
  - Casilla con etiqueta "Manifiesto expresamente este compromiso" (la etiqueta nunca resume el texto).
  - Enlace secundario "No acepto este compromiso".
  - Nota fija: "Aprobar el contrato no requiere marcar la casilla. Si no la marcas, VERYGANA te pedirá
    una aclaración. Este compromiso no cambia tu situación tributaria."
- **RN-3 · Decisión:** estado local `decision` (`ACCEPT` | `REFUSE` | ninguna) y `refusalReason`, que
  empiezan vacíos. Marcar la casilla → `ACCEPT`; desmarcarla → ninguna. Confirmar el diálogo de negativa →
  `REFUSE` con el motivo (recortado; vacío no se envía), la casilla queda desmarcada y deshabilitada y se
  ve el chip "No aceptado — Deshacer". "Deshacer" → ninguna, borra el motivo y habilita la casilla.
- **RN-4 · No bloquea (L-4):** "Aprobar contrato" nunca depende de la casilla, de leer el texto hasta el
  final, ni de que el texto haya cargado. Solo se deshabilita mientras envía.
- **RN-5 · Evidencia de manifestación previa (L-2):** se muestra la evidencia en lugar de la casilla y el
  enlace **solo si** `manifestation.status === 'MANIFESTED'`, `manifestation.declarationVersion` es igual
  a la `version` vigente **y** `manifestation.contractId` es el del contrato que se está aprobando
  (decisión del usuario). En ese caso se envía sin `decision`. En cualquier otro caso (otra versión del
  texto, otro contrato, u otro estado) se muestra la casilla desmarcada, sin mencionar la manifestación
  anterior.
- **RN-6 · Falla al cargar el texto (L-5):** si el `GET` falla, se puede aprobar igual: se envía sin
  `decision` ni `declarationVersion`. Nunca se presenta como una negativa.
- **RN-7 · Cuerpo enviado:** `declarationVersion` = la `version` que se mostró (si el texto cargó);
  `decision` solo si es `ACCEPT` o `REFUSE`; `refusalReason` solo con `REFUSE` y no vacío.
- **RN-8 · Idempotencia:** la `Idempotency-Key` (UUID aleatorio) se genera **una vez por intento** de
  aprobación y se reutiliza si el empresario reintenta tras un error. Si cambia la decisión, el motivo o
  la versión del texto antes de reintentar, es un intento nuevo y se genera otra clave. Tras un 200 se
  descarta. La clave no se guarda en `localStorage` ni en la URL.
- **RN-9 · Error al aprobar (decisión del usuario):** ante cualquier error del `POST`, el front relee el
  estado del onboarding. Si ya está en `VERYGANA_REVIEW_PENDING` (o más adelante), avanza a ese paso como
  si hubiera sido un 200, sin mostrar el error. Si sigue en `BUSINESS_REVIEW_PENDING`, muestra el toast
  (con el `message` de un 4xx o el texto genérico) y conserva la decisión y el motivo. Si la relectura
  también falla, muestra el error original.
- **RN-10 · Texto fresco:** el texto se pide cada vez que se muestra el paso (no se reutiliza uno guardado
  en caché de otra pantalla), porque la API registra cada puesta a disposición y la versión enviada debe
  ser la vigente. Por la misma razón, **después de aprobar el contrato el texto no se vuelve a pedir**:
  la aprobación no deja una puesta a disposición extra en la traza, y el avance al estado siguiente no
  espera esa lectura (decisión del usuario, 2026-10-29, tras la ronda 1 de revisión).
- **RN-11 · Ningún texto sugiere que el compromiso cambia la situación tributaria (L-6):** ni la condición
  frente al IVA, el régimen, la vocación, la comisión ni el plan.
- **RN-12 · Solo aquí (L-2):** la casilla y el enlace de negativa existen solo en este paso. La ficha
  tributaria y el perfil siguen mostrando el compromiso en solo lectura (spec 014).

## Criterios de aceptación

- **CA-1:** Dado un empresario en "Revisa tu contrato" sin manifestación previa, cuando se muestra el paso,
  entonces ve el bloque con título, subtítulo, versión, el `fullText` completo y literal en la caja con
  scroll, la casilla **desmarcada**, el enlace "No acepto este compromiso" y la nota fija de RN-2, entre el
  aviso de objeciones y el botón "Aprobar contrato".
- **CA-2:** Dado el paso mostrado, cuando el empresario recarga la página, sale y vuelve, o la consulta se
  repite, entonces la casilla aparece desmarcada otra vez y en `localStorage`/`sessionStorage` no hay
  ninguna clave nueva con la decisión.
- **CA-3:** Dado que no marcó la casilla, cuando pulsa "Aprobar contrato", entonces la petición sale sin
  `decision` (y con `declarationVersion`), la casilla sigue desmarcada y el flujo pasa a "Contrato en
  revisión".
- **CA-4:** Dado que marcó la casilla, cuando aprueba, entonces el cuerpo lleva `decision: "ACCEPT"` y la
  `declarationVersion` mostrada.
- **CA-5:** Dado que pulsó "No acepto este compromiso", escribió un motivo y confirmó, cuando aprueba,
  entonces el cuerpo lleva `decision: "REFUSE"` y `refusalReason` con el motivo; con el motivo vacío, sin
  `refusalReason`.
- **CA-6:** Dado el chip "No aceptado — Deshacer", cuando pulsa "Deshacer", entonces la casilla vuelve a
  estar habilitada y desmarcada y una aprobación posterior sale sin `decision` ni `refusalReason`.
- **CA-7:** Dado el diálogo de negativa, cuando pulsa "Cancelar" o Escape, entonces la decisión no cambia;
  y el motivo no admite más de 1000 caracteres (contador visible).
- **CA-8:** Dado que el `GET` del texto falla, cuando se muestra el paso, entonces se ve el error con
  "Reintentar" y la nota de RN-6, no hay casilla, "Aprobar contrato" está habilitado y aprobar envía sin
  `decision`; "Reintentar" vuelve a pedir el texto y, si llega, muestra el bloque normal.
- **CA-9:** Dado una manifestación `MANIFESTED` de la versión vigente y del contrato actual, cuando se
  muestra el paso, entonces se ve "✓ Ya manifestaste este compromiso el {fecha} (versión {v})" sin casilla
  ni enlace, y aprobar envía sin `decision`.
- **CA-10:** Dado una manifestación `MANIFESTED` de otra versión del texto o de otro contrato, o una
  manifestación en otro estado, cuando se muestra el paso, entonces se ve la casilla desmarcada y el
  enlace, como en CA-1.
- **CA-11:** Dado cualquier estado del bloque (cargando, error, decisión elegida o no), cuando el
  empresario mira el botón, entonces "Aprobar contrato" está habilitado; solo se deshabilita mientras
  envía y un doble clic no genera dos peticiones.
- **CA-12:** Dado un error de red al aprobar, cuando el empresario reintenta sin cambiar nada, entonces la
  segunda petición lleva la **misma** `Idempotency-Key`; si cambió la decisión antes de reintentar, una
  clave distinta.
- **CA-13:** Dado un error al aprobar y que el estado releído ya es `VERYGANA_REVIEW_PENDING`, cuando
  termina la relectura, entonces el paso pasa a "Contrato en revisión" sin toast de error.
- **CA-14:** Dado un 4xx (400 o 422) al aprobar y que el estado sigue en `BUSINESS_REVIEW_PENDING`, entonces se ve un
  toast con el `message` de la API y la decisión y el motivo se conservan.
- **CA-15:** Dado un texto largo, cuando se ve en un móvil de 360 px, entonces la caja tiene scroll propio
  sin scroll horizontal de la página, se alcanza y desplaza con teclado, y el texto completo es legible
  desplazándose.
- **CA-16:** Ningún texto nuevo dice o sugiere que el compromiso cambia la condición frente al IVA, el
  régimen, la vocación, la comisión ni el plan; y la casilla del compromiso no aparece en ninguna otra
  pantalla.
- **CA-17:** Ni el motivo, ni la decisión, ni la `Idempotency-Key`, ni datos del representante legal
  aparecen en `console.*`, URLs ni storage.
- **CA-18:** Las puertas del repositorio quedan como antes de la spec o mejor: pruebas, build, tipos,
  ningún aviso de lint nuevo, sin dependencias nuevas.

## Fuera de alcance

- La casilla en otros contratos (otrosí de cambio de plan, recargas): la API solo registra la
  manifestación en el Contrato Marco del onboarding.
- Pantallas de compliance sobre las manifestaciones (historial, aclaraciones): entrega D (spec 017).
- Cambiar el bloque de solo lectura del perfil y la ficha (spec 014).
- Exigir leer el texto hasta el final antes de aprobar (lo prohíbe RN-4).
- Pruebas de navegador (Playwright) de este paso.

## Requisitos no funcionales

- **Accesibilidad:** casilla nativa con `<label>` asociada; la caja del texto enfocable con nombre
  accesible; el diálogo de negativa con el `Dialog` compartido (foco, Escape); el chip "Deshacer" es un
  botón.
- **Responsive:** 360 px sin scroll horizontal; la caja con alto máximo relativo a la pantalla.
- **PII:** el motivo puede contener datos personales: nunca en `console.*`, URLs ni storage (P-16).
- **Componentes:** el bloque es un componente de cliente aparte; datos por el hook `useDeclaration`
  (P-10); el diálogo del motivo con react-hook-form + zod y sin doble envío (P-11).

## Dependencias de la API (sugerencias, no bloquean)

- **Idempotencia de la aprobación completa:** hoy la `Idempotency-Key` solo protege el registro de la
  manifestación; un reintento de una aprobación ya aplicada responde 422. El front lo resuelve releyendo
  el estado (RN-9), pero lo ideal es que la API devuelva el mismo resultado ante la misma clave.
- **`manifestation` del `GET`:** devuelve la última `MANIFESTED` de cualquier contrato o versión; el front
  filtra (RN-5). Podría devolver solo la que aplica al contrato actual y al texto vigente.
- **Sin texto activo:** si la API no tiene un texto activo del compromiso, el `GET` responde 500 y la
  aprobación también falla, porque `recordContractManifestation` siempre pide el texto activo. En ese caso
  RN-6 no se puede cumplir desde el front: la API debería aprobar igual y registrar una falla técnica.

## Preguntas abiertas

- [x] Evidencia previa: solo si coincide versión y contrato (RN-5).
- [x] Error al aprobar: releer el estado (RN-9).
- [x] Texto largo: caja con scroll (RN-2).
- [x] Alcance: solo el paso de aprobación del Contrato Marco.
