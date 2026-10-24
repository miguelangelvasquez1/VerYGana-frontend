# 010 · Revisión de la primera entrega

Rutas: `FRONT` = `/Users/nicolascastro/Desktop/VerYganar-frontend-beta` (rama
`spec-010-quality-gates`, commit `53b866c`, igual a `origin/main`; cambios sin commitear).
`API` = `/Users/nicolascastro/Desktop/verYganar`.

> **Veredicto vigente: Ronda 3 (última), APROBADO.** B-3 quedó cerrado y N-1 a N-7 también.
> Hay un hallazgo nuevo de documento, N-8, que no bloquea con el criterio de esta ronda pero
> conviene corregir antes del commit (dos frases en P-16). Los diez CA de la primera entrega
> están cumplidos en local; lo que falta son pasos del usuario y de Miguel (U-3 a U-6, M-1).
> El detalle está en "Ronda 3"; las rondas 2 y 1 se conservan debajo.

## Ronda 3: APROBADO

Front: `npm test` OK (6 archivos, 640) · `lint:ci` OK · `tsc` OK · `audit:ci` OK · `build` OK
API: `bash -n scripts/check-front-impact.sh` OK · `./mvnw verify` y PMD no se corrieron (por
indicación: hay un merge del usuario en curso y esta spec no toca Java)

El bloqueante de la ronda 2 está cerrado: cada afirmación de la excepción de P-16 es cierta en el
código, tiene motivo, dice que el código nuevo cumple y a qué frente queda atada. Las puertas
siguen en verde y las mutaciones repetidas dan rojo. Mi propia búsqueda encontró tres llamadas a
la API que llevan teléfono, correo y cédula en la query y que P-16 no nombra (N-8). No lo marco
bloqueante, y dejo escrito por qué, porque con el criterio de las rondas 1 y 2 sí lo habría sido.

### Estado de los hallazgos de la ronda 2

| Hallazgo | Estado | Cómo se comprobó |
|----------|--------|------------------|
| B-3 (P-16) | **Cerrado** | Los cinco puntos medidos uno a uno en `src` (tabla abajo). `20 reglas completas`. Resto nuevo en N-8. |
| N-1 (`route.tsx`, `route.jsx`) | Cerrado | `src/app/api/zzzreview3/route.tsx` creado: rojo (1 de 510 en `__tests__/middleware`). `src/app/zzzreview3/route.jsx` creado: rojo (1). Borrados: 510 de 510. Constitución (`:72-73`), `CLAUDE.md` y planner dicen las cuatro extensiones. |
| N-2 (`check-front-impact.sh`) | Cerrado, con un resto nuevo no realista (N-9) | Lanzador del implementer: 33 de 33 con `/bin/bash` 3.2.57. Mis 54 casos de la ronda 2: 51 como se esperaba; los 3 restantes son los que se acordó no cerrar (enlace simbólico de archivo dentro del front, repo de mentira fuera de la API, sección solo en bloque de código). 20 casos nuevos: 19 como se esperaba. |
| N-3 (prueba de prioridad en PR) | Cerrado | Mutación "en un PR manda `LINT_BASE_SHA`": rojo (1 de 32). |
| N-4 (detección de CI) | Cerrado en la parte pedida | Mutaciones "`GITHUB_ACTIONS` vacía no cuenta" y "`CI` no cuenta": rojo (1 cada una). De punta a punta, `GITHUB_ACTIONS= LINT_BASE_CAP=999 node scripts/lint-ratchet.mjs`: avisa que la ignora y compara con 360. El respaldo 360 fijo sigue igual, a propósito. |
| N-5 (conteos) | Cerrado | P-7 y P-10 dicen "unos" y con qué comando se midió (`docs/constitution.md:124`, `:170-173`). |
| N-6 (coordinator de la API) | Cerrado | Sección leída entera (abajo). `diff` contra las copias previas: 0 líneas quitadas o cambiadas en los seis archivos. |
| N-7 (`CLAUDE.md` del front) | Cerrado | `CLAUDE.md:78` dice dónde `API_URL` cae en `NEXT_PUBLIC_API_URL` y dónde no; coincide con `authOptions.ts:11` y `live/page.tsx:12`. |

### Criterios de aceptación: estado final de la primera entrega

| CA | Estado | Qué falta | Evidencia de esta ronda |
|----|--------|-----------|-------------------------|
| CA-1 | Cumplido en local | U-5 (subir y ver los tres checks), M-1 (proteger `main`), U-6 (PR de prueba) | `ci.yml` válido: `Lint, tipos y build`, `Pruebas`, `Auditoría de dependencias`, 10 minutos cada uno; sin `continue-on-error`, `secrets.` ni `pull_request_target`. `lint:ci`, `tsc` y `build` con salida 0. |
| CA-2 | Cumplido en local | U-6 | `lintRatchet.test.ts` (32 casos); 4 mutaciones repetidas en rojo. |
| CA-3 | Cumplido en local | U-6 | `audit:ci` 0; `npm audit --omit=dev --audit-level=high` sigue saliendo 1. |
| CA-4 | Cumplido en local | Nada | `routeProtection.test.ts` (500) y `routeInventory.test.ts` (10). Rojo con `route.tsx` y `route.jsx`. |
| CA-8 | Cumplido en local | Nada | Rutas y variables citadas en `CLAUDE.md` existen. El ensayo de copia limpia es el de la ronda 1; no se repitió. |
| CA-12 | Cumplido en local | U-5 (que corra en CI) | Dentro de `npm test` (640). |
| CA-13 | Cumplido | Nada obligatorio; recomendado N-8 antes del commit | 20 reglas con Regla, Fuente, Versión y Excepción; todo `P-n` citado en agentes, `CLAUDE.md` y plantilla existe; la excepción de P-16 es cierta, con motivo y frente. |
| CA-14 | Cumplido en local | U-3 (variable y permiso), U-4 (ensayo en sesión nueva) | Script, plantilla, `CLAUDE.md` y coordinator coherentes; caso feliz con las plantillas reales: 0. |
| CA-15 | Cumplido en local | U-3, U-4 | "No" con motivo: 0; plantilla sin llenar: 1. |
| CA-16 | Cumplido en local | U-5 (CI de `main` en verde) | Cuatro excepciones vigentes hasta 2026-11-30. |

No queda ningún CA "no cumplido". Ninguno se puede dar por cerrado del todo sin los pasos del
usuario: lo comprobado aquí es local.

### B-3: cada afirmación de P-16 contra el código

`FRONT/docs/constitution.md:271-324`.

| Punto | Afirmación | Medido |
|-------|-----------|--------|
| (a) | El middleware escribe ruta y rol en el log | `src/middleware.ts:82` y `:97`. Cierto. |
| (b) | JWT en la query en cuatro archivos | `src/lib/api/client.ts:196`, `src/hooks/useAuthenticatedAssetSrc.ts:6`, `src/lib/notifications/notificationStream.ts:88`, `src/components/Admin/products/ProductsManagement.tsx:405`. Cierto; no hay un quinto. |
| (b) | URL firmada en `?url=` hacia `/api/proxy-download` | `src/components/game-designer/tabs/ResourcesTab.tsx:36`; el handler registra solo el host (`route.ts:45`, `:50`). Cierto. |
| (c) | Token en `console.log` | `src/services/adService.ts:250`, dentro de `orphanAssetKeepAlive`. Cierto. |
| (c) | El permiso de subida, con URL firmada, se imprime | `src/hooks/useImpactStory.ts:141` imprime `permission`, que trae `permission.uploadUrl` (`:157`). Cierto. |
| (c) | 123 líneas con `console.` | `grep -rn 'console\.' src \| wc -l` = 123. Cierto. |
| (d) | Correo o identificador en la query | `RegisterForm.tsx:408` y `:427` (con `window.location.href`), `LoginForm.tsx:231` y `:244`; los leen `VerificationForm.tsx:18` y `UnlockAccountForm.tsx:14`. Cierto. |
| (d) | Teléfono enmascarado en `sessionStorage` | `RegisterForm.tsx:407` y `:426` guardan `***` más los cuatro últimos dígitos; lo lee `VerificationForm.tsx:33`. Cierto. |
| (e) | `session_token` y `user_hash` en la URL de juego, puesta en `?url=` | `src/app/(consumer)/games/page.tsx:39` y `:44`; la lee `games/play/page.tsx:13`. En la API, `GameSession` y `PetSession` tienen esas dos columnas. Cierto. |
| (e) | Mascota: los dos en la query y `bearer_token` en el fragmento | `src/hooks/pet/usePetSession.ts:32-42`. Cierto, y el comentario del propio archivo explica el fragmento. |
| Regla | Token de un solo uso de `setup-password` admitido | `src/app/game-designer/setup-password/page.tsx:12`. La distinción (un solo uso frente a token de acceso o de sesión) está escrita en la Regla. |
| "No son caso" | `?ref=`, transacción del checkout, `from`, `ScenePreviewModal.tsx`, referencias de pago | Comprobados: `ScenePreviewModal.tsx:34` usa el literal `preview`; las claves de `sessionStorage` de pagos guardan solo la referencia. Cierto. |

La excepción dice por qué se acepta (b), (d) y (e), que (c) no tiene justificación, que el
código nuevo cumple, y los ata a los frentes D y E. Comando de T13: `20 reglas completas`.

### Bloqueantes

Ninguno.

### Hallazgos nuevos que no bloquean

- **N-8 · `FRONT/docs/constitution.md:283-285` y `:299-306` (P-16): tres llamadas a la API con
  dato personal o credencial de partida en la query, sin declarar.** La excepción dice que se
  buscó `email`, `phone` y `document` en `src`, pero la lista solo recoge las navegaciones del
  navegador. Faltan las URL de las peticiones a la API:
  - `src/services/raffleService.ts:84-86`: teléfono en la query de `POST /winners/claim/send-otp`.
  - `src/services/raffleService.ts:91-93`: correo en la query de `POST /winners/claim/send-email-otp`.
  - `src/services/PurchaseItemService.ts:39-47`: número de documento (cédula) en la query de
    `GET .../pending-claims`.
  - `src/services/GameService.ts:26`: el token de la partida en la query de `GET /games/rewards`
    (es la categoría (e), pero el archivo no está nombrado).
  - No aparecen en la barra del navegador ni en el historial; sí en los logs de acceso de la API
    y de lo que haya delante. El contrato lo fija la API (son `@RequestParam`), así que el front
    no puede cumplir solo: es también deuda del principio 5 de la constitución de la API.
  - Por qué no bloquea: con el criterio de las rondas 1 y 2 (una desviación del código sin
    excepción escrita) esto habría sido bloqueante, igual que B-1 y B-3. Lo bajo por el criterio
    de esta ronda y por tres razones medibles: las categorías ya están declaradas con su motivo
    (dato personal en la query, credencial de partida en la query); son flujos secundarios
    (reclamo de premio, entregas pendientes del comercial), no el registro ni el inicio de
    sesión; y los agentes del front fallan cerrado ante deuda no declarada (`reviewer.md:38-40`:
    la deuda "no excusa lo que el diff agrega"). El costo de dejarlo es que el documento afirma
    una búsqueda completa que no lo fue. Lo decide el usuario.
  - Arreglo, solo documento: en (d) agregar "y en la query de tres llamadas a la API
    (`raffleService.ts`: teléfono y correo del reclamo de premio; `PurchaseItemService.ts`:
    número de documento del filtro de entregas pendientes), contrato que fija la API"; en (e)
    agregar `src/services/GameService.ts`; cambiar "cinco cosas" si cambia el número; y cerrar
    con una frase que evite una cuarta ronda de lo mismo: "la lista es lo encontrado el
    2026-10-12; lo que no esté en ella no queda admitido por omisión".
- **N-9 · `API/scripts/check-front-impact.sh:140-146`: la comparación con la raíz de la API
  distingue mayúsculas y el disco de macOS no.** Un "front" fabricado dentro de la API se acepta
  si la referencia escribe la ruta con otras mayúsculas (`.../VERYGANAR/specs/...`): salida 0.
  No sale del flujo normal: hay que fabricar el repo falso y además escribir mal la ruta. Lo
  demás de N-2 está bien: front hermano con prefijo compartido (`verYganar-front`, `verYganar2`,
  `verYganar front`, `verYganarFRONT`), absoluto y relativo: 0; API y front con espacios: 0; API
  alcanzada por enlace simbólico: 0; front falso dentro de la API, también por enlace: 1.
  Un front clonado dentro de la carpeta de la API sale 1 (falla cerrado; es una disposición que
  nadie usa, queda anotada). La API dentro del repo del front: 0.
- **N-10 · `API/.claude/agents/coordinator.md`, "Spec del front (RN-9)", paso 2.** La sección es
  inequívoca y se puede ejecutar de principio a fin: localizar (1), no duplicar (2), sin permiso
  al camino alterno (3), numerar (4), escribir (5), referenciar (6), camino alterno (7), sin git
  (8); el paso 14 del cierre la invoca y dice qué salida esperar. Un detalle: el paso 2 dice
  "actualízala" pero no que después se salta al paso 6 sin numerar ni crear; se entiende por el
  "no crees otra", y una frase lo dejaría explícito. En el paso 5, `<NNN>` significa el número
  del front en la ruta y el de la API en `Origen`; el paréntesis "(con el número de la API)" lo
  aclara.
- **N-11 · `FRONT/scripts/lint-ratchet.mjs:97`: `CI` con cualquier valor no vacío cuenta como
  CI.** Quien tenga `CI=1` en su terminal verá que `LINT_BASE_CAP` se ignora en un ensayo local,
  con aviso. Falla cerrado; solo para saberlo.
- **S-5 y S-9 de la ronda 1** siguen sin cambios y fuera del encargo (acciones por etiqueta y no
  por SHA; `Si` sin tilde aceptado).

### Repo público: opinión para decidir si se publica así

Busqué en todo lo nuevo del front (`docs/`, `CLAUDE.md`, `.claude/agents/`, `specs/`,
`security/`, `scripts/`, `__tests__/`, `ci.yml`): los únicos hosts son los de documentación
oficial, `localhost`, `api.example.test` y `games.example.test`; no hay direcciones IP, correos,
tokens, identificadores de Infisical, hosts de la infraestructura ni valores de variables. Solo
el secreto rotulado ficticio de `__tests__/middleware/session.ts` y las credenciales de ejemplo
de `downloadPolicy.test.ts`.

P-16 nombra archivos y parámetros y describe la consecuencia en una frase ("llega al servidor
del front y a lo que haya delante"). No trae valores ni pasos. Todo lo que dice se lee en el
código, que ya es público. Mi opinión: **se puede publicar así**, sabiendo dos cosas.

1. El documento es un índice ordenado de debilidades conocidas. No revela nada nuevo, pero
   ahorra a quien busque el trabajo de encontrarlas. Las de P-16 necesitan acceso previo a algo
   de la víctima (historial, logs, consola), así que el índice no las hace explotables desde
   fuera.
2. La deuda que más prioridad merece está en P-12, aprobada en rondas anteriores. Se trata como
   requisito en `specs/011-security-and-pii-debt/spec.md`.

Decisión tomada (2026-10-23): la tabla de deuda de esta revisión no se publica en esta copia;
pasa como requisitos a la spec 011 del front.

### Mutaciones y archivos de comprobación de esta ronda

| Área | Mutación o archivo | Resultado |
|------|--------------------|-----------|
| Inventario | `src/app/api/zzzreview3/route.tsx` creado | rojo (1 de 510) |
| Inventario | `src/app/zzzreview3/route.jsx` creado | rojo (1 de 510) |
| Tope de lint | en un PR manda `LINT_BASE_SHA` antes que la rama destino | rojo (1 de 32) |
| Tope de lint | `GITHUB_ACTIONS` vacía no cuenta como CI | rojo (1) |
| Tope de lint | `CI` no cuenta como CI | rojo (1) |
| Tope de lint | en CI se obedece `LINT_BASE_CAP` | rojo (3) |

Archivos borrados y `scripts/lint-ratchet.mjs` restaurado desde copia (`cmp` igual). Al final
`git -C FRONT status --short -- src` vacío y `npm test` en 640.

### Comandos corridos

Front, con las variables ficticias (Node 22.20.0, npm 10.9.3):

| Comando | Salida | Tiempo | Resultado |
|---------|--------|--------|-----------|
| `npm test` | 0 | 1 s | 6 archivos, 640 casos |
| `npm run lint:ci` | 0 | 4 s | 0 errores, 360 avisos; tope 360; respaldo 360 (el archivo aún no existe en `origin/main`) |
| `npx tsc --noEmit` | 0 | 3 s | sin errores |
| `npm run audit:ci` | 0 | 2 s | cuatro excepciones vigentes, revisión 2026-11-30 |
| `npm audit --omit=dev --audit-level=high` | 1 | 1 s | el umbral de npm no se tocó |
| `npm run build` | 0 | 36 s | build completo, middleware 63.6 kB |
| `ruby -ryaml` sobre `ci.yml` | 0 | - | tres jobs con su nombre exacto, 10 minutos cada uno |
| comando de T13 | 0 | - | `20 reglas completas` |
| `P-n` citados en agentes, `CLAUDE.md` y plantilla | 0 | - | todos existen en `docs/constitution.md` |

API, con `/bin/bash` 3.2.57:

| Comando | Salida | Tiempo | Resultado |
|---------|--------|--------|-----------|
| `bash -n scripts/check-front-impact.sh` | 0 | - | sintaxis válida |
| lanzador del implementer (`bak/run-cases.sh`) | 0 | 1 s | 33 de 33 |
| mis casos de la ronda 2 (`r2/cfi.sh`) | 0 | 2 s | 51 de 54 como se esperaba; 3 restos acordados |
| 20 casos nuevos | - | 1 s | 19 como se esperaba; 1 resto nuevo (N-9) |
| caso feliz real | 0 | - | plantilla real de la API llena con "Sí" y ruta relativa, plantilla real del front con `Estado` y `Origen` llenos, `package.json` real del front por enlace |
| lo mismo con "No" y motivo | 0 | - | |
| plantilla real de la API sin llenar; spec del front sin llenar | 1 y 1 | - | |
| `scripts/check-front-impact.sh specs/010-frontend-review` | 1 | - | "falta la sección": correcto, la spec 010 es anterior a RN-9 |

`diff` contra las copias previas: 0 líneas quitadas o cambiadas en los seis archivos; agregadas
54 (coordinator), 5 (planner), 3 (implementer), 12 (reviewer), 37 (plantilla) y 22 (`CLAUDE.md`).
El script tiene 24 líneas agregadas y 3 cambiadas respecto a `HEAD` (las tres son de la
cabecera de comentarios).

### Deuda del front descubierta, fuera de esta entrega

La tabla de deuda de `src/` que encontró esta ronda no se publica aquí: se trasladó, como requisitos, a `specs/011-security-and-pii-debt/spec.md`.

### Lo que no se pudo verificar

- Nada de GitHub: que el workflow corra, la duración real, los tres checks, la protección de
  `main` y el PR bloqueado (U-5, M-1, U-6). El conteo de 360 avisos en Linux.
- Los agentes en una sesión nueva (U-3, U-4): la sección del coordinator se leyó, no se ejecutó.
- El caso feliz del script con un archivo dentro del checkout real del front: no se escribe ahí;
  se usó una carpeta temporal con la plantilla real copiada y el `package.json` real enlazado.
- `./mvnw verify` y PMD de la API, por indicación.
- Las filas 2 y 3 de la tabla de deuda salen de leer el código; no se intentó ninguna de las dos
  contra un servidor.
- La búsqueda de N-8 cubrió plantillas con `?`, objetos `params:` de `apiClient`,
  `URLSearchParams`, navegaciones y todo `console.`. No leí una a una las 123 líneas de
  `console.` ni los filtros genéricos que se pasan enteros como `params` (auditoría, eventos de
  seguridad, historias): puede quedar algún caso más del mismo tipo, y por eso la frase de cierre
  que propone N-8.
- El ensayo de copia limpia (CA-8) y las 18 URL de la constitución no se repitieron.

### Cómo se probó

- Sin git de escritura en el front ni en la API. No se corrigió código.
- Dos archivos creados y borrados en `FRONT/src/app` y un script mutado y restaurado desde copia.
- `npm run build` reescribió `.next/` del checkout beta (ignorado por git).
- Los casos del script quedaron en `scratchpad/r3/` (carpeta temporal de la sesión); se pueden
  borrar a mano.

---

## Ronda 2: CAMBIOS

Front: `npm test` OK (6 archivos, 635) · `lint:ci` OK · `tsc` OK · `audit:ci` OK · `build` OK
API: `bash -n scripts/check-front-impact.sh` OK · `./mvnw verify` y PMD no se repitieron (no se tocó Java)

Queda un solo bloqueante y es un párrafo de `FRONT/docs/constitution.md`: la excepción de P-16
sigue declarando menos de lo que el código hace (el correo viaja en la URL en el registro y el
inicio de sesión). Es el mismo criterio con el que se abrió B-1. Todo lo demás de la ronda 1
está corregido y comprobado: el script de RN-9 ya no se deja engañar por ningún caso del flujo
normal, y el camino de push de la puerta de lint funciona de punta a punta.

### Estado de los hallazgos de la ronda 1

| Hallazgo | Estado | Cómo se comprobó |
|----------|--------|------------------|
| B-1 (P-2, P-16) | **Parcial**: P-2 cerrado; P-16 incompleto (ver B-3) | P-2: 60 de 87 `page.tsx` con `'use client'` y 8 `layout.tsx` de servidor, igual que el texto. P-16: los cuatro archivos con `?token=` y el `console.log` de `adService.ts` son ciertos; `console.*` = 123. Falta el correo en la URL. |
| B-2 (`check-front-impact.sh`) | **Cerrado** | Mis cuatro casos de la ronda 1 con `/bin/bash` 3.2.57: los cuatro salen 1. 55 casos propios más el lanzador del implementer (27 de 27). Caso feliz con el `package.json` y la plantilla reales del front: 0. |
| S-1 (inventario) | Cerrado, con un resto menor (N-1) | `page.ts` fuera de prefijo: rojo. `route.ts` y `route.js` nuevos: rojo. `page.jsx` bajo `/admin`: entra sola a la matriz (516 casos). |
| S-2 (push a `main`) | Cerrado | Reproducido con un commit anterior que sí tiene `.lint-max-warnings` (tabla abajo). |
| S-3 (`LINT_BASE_CAP` en CI) | Cerrado | Con `GITHUB_ACTIONS=true`, `LINT_BASE_CAP=999` y `LINT_BASE_REF` se ignoran con aviso y la salida es 1. |
| S-4 (a) (mensaje de ENOLOCK) | Cerrado | Carpeta sin lockfile: salida 2 en 1 s, sin reintentos, mensaje del lockfile. Registro caído: salida 2 en 6 s, mensaje del registro. (b) y (c) no se hicieron, por indicación. |
| S-5 (acciones por SHA) | Sin cambios, fuera del encargo | Sigue como sugerencia. |
| S-6 (sección "Comandos") | Cerrado | `FRONT/.claude/agents/implementer.md:24`. |
| S-7 (coordinator de la API) | Cerrado, con una nota de orden (N-6) | Pasos 6 y 7 leídos; `diff` contra las copias previas: 0 líneas quitadas o cambiadas en los seis archivos. |
| S-8 (URL de TanStack) | Cerrado | `/query/latest/...` responde 200 en las dos; `/query/v5/...` responde 308 hacia `/latest/`, como dice el texto. |
| S-9 (estrictez del script) | Sin cambios, fuera del encargo | `Si` sin tilde se sigue aceptando. |

### Criterios de aceptación (primera entrega)

| CA | Estado | Evidencia de esta ronda |
|----|--------|-------------------------|
| CA-1 | Cumplido en local · pendiente de U-5, M-1, U-6 | `ci.yml` válido (`ruby -ryaml`), tres jobs con el nombre exacto y `timeout-minutes: 10`; sin `continue-on-error`, `secrets.` ni `pull_request_target`. `lint:ci`, `build` y `tsc` con salida 0. |
| CA-2 | Cumplido en local · pendiente de U-6 | `lintRatchet.test.ts` (29 casos; 5 de 6 mutaciones en rojo, ver N-3). De punta a punta: +1 aviso con tope subido sale 1 en PR y en push. |
| CA-3 | Cumplido en local · pendiente de U-6 | `auditGate.test.ts` (2 mutaciones nuevas en rojo); `audit:ci` 0; `npm audit --omit=dev --audit-level=high` sigue saliendo 1. |
| CA-4 | Cumplido en local | `routeProtection.test.ts` (500) y `routeInventory.test.ts` (8). Rojo comprobado creando y borrando archivos. Resto menor en N-1. |
| CA-8 | Cumplido en local | No cambió el camino del clon limpio; rutas y variables citadas en `CLAUDE.md` siguen existiendo. Imprecisión menor en N-7. |
| CA-12 | Cumplido en local · corre en CI tras U-5 | Sin cambios en `__tests__/proxy/`; dentro de `npm test`. |
| CA-13 | **No cumplido** (B-3) | `20 reglas completas`; todo `P-n` citado existe; P-1, P-3, P-5 y P-6 se cumplen en el código (búsqueda propia). Falta una excepción en P-16. |
| CA-14 | Cumplido en local · pendiente de U-3, U-4 | Script corregido; plantilla, `CLAUDE.md` y coordinator describen lo que hace. |
| CA-15 | Cumplido en local · pendiente de U-3, U-4 | "No" con motivo 0; "No" sin motivo 1 (también con CRLF); plantilla sin llenar 1. |
| CA-16 | Cumplido en local · pendiente de U-5 | Cuatro excepciones vigentes hasta 2026-11-30; umbral de npm sin tocar. |

### Bloqueantes

- **B-3 · `FRONT/docs/constitution.md:277-292` (P-16): la excepción dice "tres cosas" y hay una
  cuarta sin escribir (CA-13, RN-8; es el resto de B-1).** La regla empieza por "cédula, correo,
  teléfono ... no aparecen en ... URLs". El código pone el correo (o el identificador de inicio de
  sesión, que puede ser el correo) en la query al navegar:
  - `src/components/auth/RegisterForm.tsx:408` y `:427`: `window.location.href = /verify?email=...`
    (carga completa: la URL con el correo llega al servidor del front y a lo que haya delante).
  - `src/components/auth/LoginForm.tsx:231`: `/unlock-account?identifier=...`; `:244`:
    `/verify?email=...`.
  - Lo leen `src/components/auth/VerificationForm.tsx:18` y `UnlockAccountForm.tsx:14`.
  - Del mismo tipo, menor: `src/app/game-designer/setup-password/page.tsx:12` recibe un token de
    un solo uso en `?token=` (enlace que la API manda por correo). La regla dice "tokens" sin
    distinguir.
  - Por qué bloquea: es exactamente el criterio de B-1. Un PR que toque el registro o el inicio de
    sesión (el flujo más usado, y el de CA-6) deja al reviewer del front en contradicción con el
    documento, y el implementer tiene al lado el patrón que la regla prohíbe sin que nada le diga
    que es deuda.
  - Qué haría falta (solo documento, sin tocar `src/`): agregar a la excepción de P-16 un punto
    (d) con el correo o identificador en la query de `/verify` y `/unlock-account` (los dos
    archivos que lo escriben), por qué se acepta por ahora, que el código nuevo no lo hace y a qué
    frente queda atado; y decir en una frase si el enlace de un solo uso de `setup-password` es
    deuda o un caso que la regla admite. Cambiar "tres cosas" por el número que quede. Sin copiar
    ningún valor: basta nombrar archivos y parámetros, como en (b).

### Hallazgos nuevos que no bloquean

- **N-1 · `FRONT/__tests__/middleware/routeInventory.ts:20`: la prueba no ve `route.tsx` ni
  `route.jsx`.** Next 15.5.27 los acepta como route handler: en el clon de descarte, un
  `src/app/api/zzzreview/route.tsx` salió en `next build` como `ƒ /api/zzzreview`, y en el front la
  prueba siguió en verde (508 de 508) con ese archivo creado (y luego borrado). Los textos
  (`docs/constitution.md:73-76`, `CLAUDE.md:202-205`, `planner.md:36`) dicen exactamente lo que la
  prueba hace ("`route.ts` o `route.js`"), así que no hay contradicción entre documento y prueba;
  lo que falta es la extensión. Arreglo: `/^route\.(tsx|ts|jsx|js)$/`, dos casos más en
  `it.each` y la misma lista en los tres textos. Conviene hacerlo junto con B-3.
- **N-2 · `API/scripts/check-front-impact.sh`: formas de obtener 0 que quedan.** Ninguna sale del
  flujo normal; todas exigen fabricar algo a propósito o una spec mal formada que el reviewer lee:
  1. `:50-53`, la línea `- **Toca al front:**` dos veces dentro de la sección ("No" y luego "Sí"):
     `grep -m1` toma la primera y sale 0. Poco realista (la plantilla trae una sola línea y se
     edita), pero es barato cerrarlo: exigir que cada una de las tres líneas aparezca una vez.
  2. Los campos de ejemplo dentro de un bloque de código al comienzo de la sección ganan a los
     reales. No realista.
  3. La sección solo dentro de un bloque de código, con "No" y motivo: sale 0. No realista (es
     una spec sin sección real). La sección dentro de una cita (`> ##`) sí se ignora, y una
     sección real más un ejemplo en bloque de código sale 1 (falla cerrado).
  4. Enlace simbólico dentro del repo del front que apunta al `front-spec.md` de la API: sale 0.
     No realista: hay que escribir en el front de todos modos.
  5. `:127-130`, un `package.json` falso con `"name": "rifacel-app-nextjs"` creado dentro de la
     carpeta de la API (en la carpeta de la spec con `specs/` anidado, o un "front" completo
     dentro): sale 0. No realista en el flujo normal: es fabricar la prueba. Cierre barato para 4
     y 5: rechazar si la ruta real de la referencia (`cd ... && pwd -P`) queda dentro del repo de
     la API.
  - Lo que sí falla cerrado: `specs/` anidado sin `package.json` (1), `Origen` con prefijo
    parecido (`050-foo-bar`, `1050-foo`, `050-foo2`, `050-foo_x`: todos 1), primer `Origen` ajeno
    aunque haya otro correcto más abajo (1), `..` en la ruta (1), `Specs/` con mayúscula (1),
    plantilla real del front (1), `Origen` de plantilla sin llenar (1), `Estado` con texto extra o
    en minúscula (1). Rutas con espacios y CRLF en ambas specs funcionan (0 donde corresponde).
  - Límite conocido, no es un defecto: el script no puede saber si el archivo del front está en
    git ni juzgar su contenido; eso es del usuario (commit) y del reviewer (contrato).
  - Invocado con `.` desde dentro de la carpeta sale 1 (toma `.` como nombre): falla cerrado; el
    uso documentado es `specs/<NNN>-<slug>`.
- **N-3 · `FRONT/__tests__/scripts/lintRatchet.test.ts`: falta el caso "en un PR manda la rama
  destino aunque `LINT_BASE_SHA` esté definida".** La mutación que invierte esa prioridad en
  `scripts/lint-ratchet.mjs:103` quedó en verde (29 de 29). De punta a punta el comportamiento es
  correcto (lo probé) y el workflow manda `LINT_BASE_SHA` vacío en un PR (`ci.yml:79`), así que hoy
  no es alcanzable; es una línea de prueba.
- **N-4 · `FRONT/scripts/lint-ratchet.mjs:16`: el respaldo es 360 para siempre.** Respuesta a lo
  que se pidió revisar: el respaldo no abre un hueco peor que el que cierra. Antes, en un push
  cualquier tope pasaba (se comparaba consigo mismo); ahora, si el commit anterior no se puede
  traer, lo máximo que pasa es 360, y además con exactamente 360 avisos. El caso existe solo
  cuando el tope ya bajó de 360 y `github.event.before` no está (push forzado con el commit ya
  recolectado, o SHA en ceros); lo reproduje: tope 300 en el commit anterior, sin traer, tope y
  avisos en 360 -> salida 0 con aviso. Está documentado en `CLAUDE.md:138-143`. Sugerencia: bajar
  `DEFAULT_BASE_CAP` cada vez que se baje el tope, o fallar en vez de usar el respaldo una vez que
  `main` tenga el archivo. Residual de S-3: una línea `GITHUB_ACTIONS= LINT_BASE_CAP=999 ...` en
  `package.json` o en un `run:` vuelve a activar la variable (reproducido, salida 0); se ve en el
  diff igual que antes, y GitHub no deja sobrescribir `GITHUB_*` desde `env:`.
- **N-5 · `FRONT/docs/constitution.md:170-172` (P-10) y `:124` (P-7): los conteos dependen del
  método.** Con mi búsqueda salen 142 de 309 archivos de cliente (no 143 de 302), 13 componentes
  con TanStack Query (no 10) y 95 `<img>` en JSX o 101 líneas con `<img` (no 97). 22 hooks, 33
  archivos con `<form` y 1 con `zodResolver` coinciden. El orden de magnitud y la conclusión son
  los mismos; sugerencia: escribir "unos" o dejar el comando con el que se midió.
- **N-6 · `API/.claude/agents/coordinator.md` pasos 6 y 7 de "Spec del front (RN-9)".** Son
  inequívocos en lo que mandan (no duplicar; sin permiso, camino alterno y no pedir ni cambiar
  permisos). Dos detalles: están numerados después de los pasos 2 y 3, a los que condicionan
  (conviene un "antes de numerar" en el paso 2, o subirlos), y "si ya la aprobaron o la cambiaron"
  no dice cómo saber que la cambiaron (basta "si su `Estado` ya no es `Borrador`").
- **N-7 · `FRONT/CLAUDE.md:78` y `:249`.** La tabla dice que `API_URL`, si falta, usa
  `NEXT_PUBLIC_API_URL`: es cierto en `src/lib/auth/authOptions.ts:11` pero no en
  `src/app/(consumer)/raffles/[id]/live/page.tsx:12`, que usa `API_URL` sola. Y "El `Dockerfile`
  construye ... desde un commit de `main`" no cuadra del todo con la excepción de P-20 (hoy
  depende de quien construye). Imprecisiones de documento.
- **Coherencia entre documentos (lo que se pidió comprobar):** `CLAUDE.md:19-22` del front dice que
  la excepción describe lo que existe y que el código nuevo cumple; `implementer.md:34-37` ("lo que
  imitas es el estilo, no la deuda") y `reviewer.md:38-40` ("no excusan lo que el diff agrega")
  dicen lo mismo. Ningún agente usa una excepción como permiso. Las nueve excepciones nuevas o
  ampliadas dicen qué hay, por qué, que lo nuevo cumple y a qué frente quedan atadas (P-19 es
  temporal y lo dice).
- **Repo público:** ninguna excepción copia un valor. P-16 nombra archivo y función
  (`adService.ts`, `orphanAssetKeepAlive`) y los cuatro archivos del `?token=`; no dice más de lo
  que ya se lee en el código, que es público. Búsqueda de correos, JWT, IP y hosts propios en todo
  lo nuevo: solo las IP y credenciales de ejemplo de `downloadPolicy.test.ts`.

### Reglas con "Excepción: ninguna", comprobadas en el código

- **P-1:** `"strict": true` en `tsconfig.json`; versiones como en la ronda 1; `package.json` solo
  gana `vitest` y tres scripts.
- **P-3:** las `NEXT_PUBLIC_*` usadas son siete (URL, WS, juego, clave pública de reCAPTCHA y tres
  de contacto); ninguna es un secreto. El `Dockerfile` solo declara `ARG NEXT_PUBLIC_*`.
  `NEXTAUTH_SECRET` se lee solo en `authOptions.ts:140`.
- **P-5:** es un principio de diseño; no hay nada en el código que lo contradiga (la falta de
  verificación de firma está declarada en P-12).
- **P-6:** las tres páginas de servidor que reciben `params` lo tipan como `Promise` y hacen
  `await`; las de cliente usan `useParams` o `useSearchParams`. Ningún acceso síncrono.
- **P-15 (con excepción):** la única llamada saliente de servidor fuera de `/api/proxy-download` es
  la de `live/page.tsx`, como dice el texto. Los `fetch` de `src/lib/auth/authService.ts` se
  llaman solo desde componentes de cliente y `tokenRefresh.ts`; `authOptions.ts` no llama a la API.

### Puerta de lint, caso de push (S-2), de punta a punta

Repo remoto y "runner" de descarte en la carpeta temporal, con tres commits (tope 360, 300 y
361), el runner superficial con solo el último, y el paso del workflow tal cual
(`git fetch --no-tags --depth=1 origin "$BEFORE_SHA"`). Todo con `GITHUB_ACTIONS=true`.

| Caso | Salida |
|------|--------|
| push, commit anterior (tope 300) traído; 361 avisos y tope 361 | 1 ("mayor que el de la rama destino (300)") |
| lo mismo con `LINT_BASE_CAP=999` y `LINT_BASE_REF` | 1, con los dos avisos de "se ignora" |
| push, commit anterior sin traer; 361 y 361 | 1 (respaldo 360) |
| push con SHA en ceros, vacío o `--upload-pack=x`; 361 y 361 | 1 (respaldo 360; el valor nunca llega a `git`) |
| push, commit anterior (tope 300) traído; 360 y 360 | 1 |
| push, commit anterior inexistente; 360 y 360 con el tope previo en 300 | 0 con aviso (N-4: lo máximo que deja subir es 360) |
| push, commit anterior (tope 360) traído; 360 y 360 | 0 |
| PR, `GITHUB_BASE_REF=main`; también con `LINT_BASE_SHA` definida | 0, fuente `origin/main` (camino sin cambios) |
| PR con la rama destino sin traer | 3 |
| PR con tope 362 sobre `origin/main` 361 | 1 |

`ci.yml`: `github.event.before` y `github.base_ref` llegan a `run:` solo por `env:` y entre
comillas; no hay interpolación dentro de un comando. El script valida el SHA con
`^[0-9a-f]{40}$` antes de pasarlo a `git`. En `pull_request` el paso nuevo no corre y
`LINT_BASE_SHA` va vacío.

### Mutaciones de esta ronda

Aplicadas sobre el archivo, prueba corrida y archivo restaurado desde una copia (`cmp` igual).

| Área | Mutación | Resultado |
|------|----------|-----------|
| Inventario | solo `page.tsx` | rojo (3) |
| Inventario | route handlers solo `.ts` | rojo (1) |
| Tope de lint | en CI se obedece `LINT_BASE_CAP` | rojo (3) |
| Tope de lint | push acepta el SHA en ceros | rojo (1) |
| Tope de lint | SHA sin validar formato | rojo (3) |
| Tope de lint | sin `cap > baseCap` | rojo (1) |
| Tope de lint | en un PR manda `LINT_BASE_SHA` antes que la rama destino | verde (N-3) |
| Auditoría | ENOLOCK rotulado como registro | rojo (1) |
| Auditoría | registro inalcanzable pasa | rojo (3) |

Archivos creados y borrados en `FRONT/src/app` para ver el rojo: `api/zzzreview/route.ts`,
`zzzreview/route.js`, `zzzreview/page.ts`, `admin/zzzreview/page.jsx`, `api/zzzreview/route.tsx`.
Al final `git -C FRONT status --short -- src` vacío y `npm test` en 635.

### Comandos corridos

Front, con las variables ficticias (Node 22.20.0, npm 10.9.3):

| Comando | Salida | Tiempo | Resultado |
|---------|--------|--------|-----------|
| `npm test` | 0 | 1 s | 6 archivos, 635 casos |
| `npm run lint:ci` | 0 | 1 s | 0 errores, 360 avisos; tope 360; respaldo 360 (el archivo aún no existe en `origin/main`) |
| `npm run build` | 0 | 25 s | build completo |
| `npx tsc --noEmit` | 0 | 2 s | sin errores |
| `npm run audit:ci` | 0 | 1 s | cuatro excepciones vigentes, revisión 2026-11-30 |
| `npm audit --omit=dev --audit-level=high` | 1 | 1 s | el umbral de npm no se tocó |
| `ruby -ryaml` sobre `ci.yml` | 0 | - | `Lint, tipos y build`, `Pruebas`, `Auditoría de dependencias`; 10 minutos cada uno |
| comando de T13 | 0 | - | `20 reglas completas` |

API: `/bin/bash` 3.2.57 con `scripts/check-front-impact.sh`: 55 casos propios (1,3 s) y el
lanzador del implementer (27 de 27). `bash -n`: 0. Caso feliz real: carpeta temporal con enlaces
al `package.json` y a `specs/_template` reales de `VerYganar-frontend-beta`, una spec de ejemplo
hecha con la plantilla real del front y una spec de la API hecha con la plantilla real de la
API: salida 0. La misma con la plantilla del front sin llenar: 1 (Estado); con `Estado` lleno y
`Origen` sin llenar: 1. Variables del script en inglés (`touches`, `reason`, `inside`, `ref`,
`path`, `full`, `norm`, `front_root`, `status`, `api_name`, `origin`, `rest`).

`diff` contra las copias previas: 0 líneas quitadas o cambiadas; agregadas 37 (plantilla), 53
(coordinator), 5 (planner), 3 (implementer), 12 (reviewer) y 22 (`CLAUDE.md`).

### Deuda del front descubierta, fuera de esta entrega

La tabla de deuda de `src/` que encontró esta ronda no se publica aquí: se trasladó, como requisitos, a `specs/011-security-and-pii-debt/spec.md`.

### Lo que no se pudo verificar

- Nada de GitHub: que el workflow corra, que `git fetch` por SHA funcione contra GitHub real (lo
  probé contra un remoto local con `uploadpack.allowAnySHA1InWant`; GitHub lo permite para
  commits alcanzables), la duración real, la protección de `main` (U-5, M-1, U-6).
- El conteo de 360 avisos en Linux.
- Los agentes en una sesión nueva (U-3, U-4): los pasos 6 y 7 del coordinator se leyeron, no se
  ejecutaron.
- El caso feliz del script con un archivo dentro del checkout real del front: no se escribe ahí;
  se usó una carpeta temporal con enlaces a su `package.json` y a su plantilla.
- Las 18 URL de la constitución no se volvieron a pedir, salvo las tres de TanStack.
- `./mvnw verify` y PMD de la API no se repitieron (no hay Java en esta spec).

### Cómo se probó

- Sin git de escritura en el front ni en la API. Los `git init`, `commit`, `push` y `fetch` de la
  prueba de push ocurrieron en repos de descarte dentro de `scratchpad/r2/` y, para el lint, con
  `GIT_DIR` apuntando a ese runner sobre la copia limpia de la ronda 1 (`scratchpad/review-clone`).
- `npm run build` reescribió `.next/` del checkout beta (ignorado por git).
- Quedan en la carpeta temporal `scratchpad/r2/` (casos, repos de descarte) y la copia de la
  ronda 1; no se borraron con `rm -rf`. Se pueden borrar a mano.
- Durante la revisión cambió el estado del repo de la API, y no fue por esta revisión: a las
  21:35 apareció el commit `ef576eb` (autor Nicolás Castro), que ya incluye
  `scripts/check-front-impact.sh` y la sección de RN-9 de `CLAUDE.md`, y hay un merge en curso con
  Java y migraciones en el índice, ajenos a esta spec. El script commiteado es idéntico al que se
  revisó aquí (`cmp` contra `HEAD`), así que B-2 queda cerrado sobre la versión que está en git.
  Por eso "no se tocó Java" vale para esta spec, no para el árbol de trabajo de la API de ahora.

---

## Ronda 1: CAMBIOS

Front: `npm ci` OK · `lint:ci` OK · `build` OK · `tsc` OK · `npm test` OK (612) · `audit:ci` OK
API: `./mvnw compile` OK · `./mvnw pmd:check` OK · `./mvnw verify` no se repitió (ver "Fuera de alcance")

Dos bloqueantes, los dos pequeños y ninguno toca código de producción: uno en
`FRONT/docs/constitution.md` (CA-13) y otro en `API/scripts/check-front-impact.sh` (CA-14).
Las puertas, las pruebas y el CI están bien: las 28 mutaciones que probé dieron rojo salvo
dos, que son equivalentes (no cambian el comportamiento observable).

### Criterios de aceptación (solo los de la primera entrega)

| CA | Estado | Evidencia |
|----|--------|-----------|
| CA-1 | Cumplido en local · pendiente de U-5, M-1, U-6 | `ci.yml` con los tres jobs de nombre exacto. En una copia limpia: error de sintaxis -> `lint:ci` sale 1; error de tipos -> `tsc` sale 2 (también dentro de `__tests__/`). `next.config.ts` no tiene `ignoreBuildErrors` ni `ignoreDuringBuilds`. En GitHub hoy: `"protected": false` y la rama no existe en el remoto (404), como se esperaba. |
| CA-2 | Cumplido en local · pendiente de U-6 | `__tests__/scripts/lintRatchet.test.ts` (16 casos, 4 mutaciones en rojo). De punta a punta en un repo de descarte con `origin/main` real: +1 aviso -> salida 1; +1 aviso y tope en 361 -> salida 1 ("mayor que el de la rama destino"); rama destino sin traer en un PR -> salida 3. |
| CA-3 | Cumplido en local · pendiente de U-6 | `__tests__/scripts/auditGate.test.ts` (25 casos, 5 mutaciones en rojo). De punta a punta: `lodash@4.17.20` en el lockfile -> `audit:ci` sale 1 con los dos avisos altos de `lodash`. |
| CA-4 | Cumplido en local | `__tests__/middleware/routeProtection.test.ts`: 500 casos. Inventario de 87 `page.tsx` (coincide con `find`), 52 protegidas x (matcher + 6 identidades) = 364 casos, 10 públicas, 25 pendientes (D-7). Middleware real, `withAuth` real, cookie firmada con `encode` real. 7 mutaciones en rojo, 1 equivalente. Hueco menor en S-1. |
| CA-8 | Cumplido en local | Copia limpia de 667 archivos, entorno vacío (`env -i`): `npm ci`, `npm test`, `audit:ci`, `lint:ci`, `build`, `tsc`, todos salida 0. `npx next dev --turbopack -p 3111` respondió `/login` 200. Todas las rutas y variables que cita `CLAUDE.md` existen en el código. Imprecisión menor en S-6. |
| CA-12 | Cumplido en local · corre en CI tras U-5 | `__tests__/proxy/downloadPolicy.test.ts` (52) y `__tests__/proxy/route.test.ts` (19), dentro de `npm test`, que es el job `Pruebas`. 10 mutaciones en rojo, 1 equivalente. |
| CA-13 | **No cumplido** (B-1) | Lo que sí está: 20 principios con sus cuatro campos; las 18 URL citadas responden 200 y dicen lo que la regla afirma (lista abajo); versiones citadas = versiones de `node_modules`; todo `P-n` citado en agentes, `CLAUDE.md` y plantilla existe. Lo que falta: dos principios declaran menos excepción de la que el código tiene. |
| CA-14 | **No cumplido** (B-2) · además pendiente de U-3, U-4 | Plantilla, cuatro agentes y `CLAUDE.md` con solo líneas agregadas (0 quitadas en los seis `diff`). El script funciona en los casos previstos, pero da salida 0 en cuatro casos en los que no hay spec en el repo del front. |
| CA-15 | Cumplido en local · pendiente de U-3, U-4 | "No" con motivo -> 0; "No" sin motivo -> 1; plantilla sin llenar -> 1; el coordinator no crea nada en el front si es "No". |
| CA-16 | Cumplido en local · pendiente de U-5 (CI de `main` en verde) | Cuatro excepciones por aviso, con motivo, aprobador y revisión 2026-11-30. Los ids coinciden con `npm audit --omit=dev --json` de hoy (2 altos `xlsx`, 2 altos `postcss`, 2 moderados `postcss`). `npm audit --omit=dev --audit-level=high` sigue saliendo 1: el umbral no se tocó. Aviso alto nuevo en `xlsx` o `postcss` -> falla (fixtures y mutación "excepción por paquete" en rojo). |

Reglas: RN-1, RN-2, RN-6, RN-10 verificadas con lo anterior. RN-7: una desviación menor
(dentro de B-2). RN-8: B-1. RN-9: B-2 y S-7.

### Bloqueantes

- **B-1 · `FRONT/docs/constitution.md:45` (P-2) y `:244-245` (P-16): excepciones sin escribir
  (CA-13, RN-8).** CA-13 exige que "las excepciones tienen su motivo escrito" y RN-8 que
  quede escrito dónde el equipo se aparta de la recomendación.
  - P-2 dice "`'use client'` ... no en una página o un layout enteros" y "Excepción: ninguna".
    En el repo, 60 de las 87 `page.tsx` empiezan por `'use client'` (los 8 layouts, ninguno).
  - P-16 dice que los tokens no aparecen en URLs, y su excepción solo menciona el log del
    middleware. El código pone el JWT en la query en cuatro sitios:
    `src/lib/api/client.ts:196`, `src/hooks/useAuthenticatedAssetSrc.ts:6`,
    `src/lib/notifications/notificationStream.ts:88` y
    `src/components/Admin/products/ProductsManagement.tsx:405`. El propio `CLAUDE.md:210-211`
    lo describe ("las imágenes privadas (`?token=` en la URL), las notificaciones por SSE").
  - Por qué bloquea y no es cosmético: el reviewer del front recorre la constitución contra el
    diff y el implementer imita el código vecino; con el documento así, uno de los dos queda
    en contradicción en cada PR que toque esas páginas.
  - Qué haría falta: escribir las dos excepciones como deuda conocida, igual que ya se hizo en
    P-7, P-9 y P-12 (qué hay hoy, por qué, que el código nuevo sí cumple, y a qué frente o
    spec queda atada). No hay que tocar código de producción.

- **B-2 · `API/scripts/check-front-impact.sh:104-108` y `:47-57`: el comprobador de CA-14 da
  salida 0 sin que exista una spec en el repo del front.** El script solo comprueba que el
  archivo referenciado exista y tenga una línea `Estado`. Casos que probé con `/bin/bash` 3.2,
  todos con salida 0:
  1. `Spec del front:` apunta por ruta absoluta al `front-spec.md` de la propia carpeta de la
     API. Es el caso serio: convierte el camino alterno ("PENDIENTE DE TRASLADAR", que debe
     salir 1) en un 0 sin haber trasladado nada.
  2. Apunta al `spec.md` de la propia spec de la API (se referencia a sí misma).
  3. Apunta a `specs/_template/spec.md` del front: la línea sin llenar
     `- **Estado:** Borrador | Aprobada | Implementada` pasa la expresión regular.
  4. La sección aparece dos veces con respuestas opuestas ("No" primero, "Sí" después): se lee
     solo la primera y sale 0.
  - Qué haría falta: (a) exigir que la ruta termine en `specs/<NNN>-<slug>/spec.md` con `NNN`
    numérico (ni `_template` ni `front-spec.md`); (b) exigir que dos niveles arriba haya un
    `package.json` con `"name": "rifacel-app-nextjs"` (la misma condición que el plan 8.3 pone
    para localizar el repo); (c) que el `Estado` sea un solo valor (rechazar la línea con `|`);
    (d) fallar si hay más de una sección `## Impacto en el front`; (e) opcional pero barato:
    que el `Origen` de la spec del front nombre la carpeta de la spec de la API. Y agregar
    estos casos al lanzador de T19.
  - De paso, en el mismo archivo (constitución de la API, principio 6, RN-7): las variables
    `toca`, `motivo` y `dentro` están en español; el código va en inglés.

### Sugerencias (no bloquean)

- **S-1 · `FRONT/__tests__/middleware/routeInventory.ts:23`: el inventario solo ve
  `page.tsx`.** Next también acepta `page.ts`, `page.jsx` y `page.js`, y los route handlers
  (`route.ts`) quedan fuera. Hoy no hay hueco real: las 87 páginas son `.tsx`, no hay rutas
  paralelas ni interceptadas, y los únicos handlers son `api/auth/[...nextauth]` (público) y
  `api/proxy-download` (exige sesión, no rol, y lo cubre `route.test.ts`). Pero
  `docs/constitution.md:65` y `CLAUDE.md:185` afirman que la prueba falla si una página queda
  sin clasificar, y con otra extensión no fallaría. Sugerencia: aceptar
  `page.(tsx|ts|jsx|js)` y agregar una prueba que fije la lista de `route.*` de `src/app/api`
  para que un handler nuevo obligue a decidir. Respecto a RN-4: ningún handler exige rol hoy,
  así que no hay incumplimiento; el día que exista uno, la prueba no lo vería.
- **Clasificación por prefijo (lo que se pidió opinar):** no veo hueco. Una página nueva bajo
  `/admin` entra sola a la matriz y se prueba contra el middleware real con las seis
  identidades, que es más de lo que daría una lista exacta. El riesgo que queda es humano:
  clasificar una página sensible como `PUBLIC` o `UNPROTECTED_PENDING`; se ve en el diff.
- **S-2 · `FRONT/scripts/lint-ratchet.mjs:88-93`: en un push a `main` la regla "el tope nunca
  sube" se compara consigo misma.** `actions/checkout` deja `origin/main` apuntando al commit
  recién subido, así que `baseCap == cap` (lo reproduje: tope 361 ya en `main` -> salida 0). La
  nota de T11 en `tasks.md:147` dice que se usa el respaldo 360; no es así. No es un salto de
  la puerta mientras todo entre por PR, pero hasta M-1 un push directo con el tope subido
  pasa. Sugerencia: en `push`, comparar con `github.event.before` (por variable de entorno,
  como ya se hace con `BASE_REF`), o dejarlo escrito.
- **S-3 · `FRONT/scripts/lint-ratchet.mjs:83-87`: `LINT_BASE_CAP` también manda en el CI.** Con
  `LINT_BASE_CAP=999` un tope subido pasa (reproducido). Hace falta editar `ci.yml` o
  `package.json` para definirla, y eso se ve en el PR, pero es más discreto que editar el
  script. Sugerencia: ignorarla cuando `GITHUB_ACTIONS` está definida. El respaldo 360 no es
  un salto: en un PR sin la rama destino sale 3, y con el archivo ya en `main` nunca se usa.
- **S-4 · `FRONT/scripts/audit-gate.mjs`:** (a) `:63-80`, cualquier reporte con `error` se
  rotula "registro inalcanzable", también `ENOLOCK` (sin lockfile); falla cerrado, pero el
  mensaje confunde. (b) `:97`, `reviewBy` no tiene máximo: una excepción al año 2099 vale.
  Sugerencia: tope de 90 días desde `approvedOn`. (c) No cruza con `metadata.vulnerabilities`:
  si npm cambiara el formato de `via`, `high > 0` con cero avisos listados pasaría; una
  comprobación de coherencia lo cerraría. No encontré ningún camino que falle abierto: registro
  caído, sin lockfile, salida vacía y JSON inválido dan 2; archivo de excepciones ausente da 3.
- **S-5 · `FRONT/.github/workflows/ci.yml:34,36,45`:** acciones por etiqueta (`@v4`) y no por
  SHA. Son de GitHub y el workflow no tiene secretos ni permisos de escritura, así que el
  riesgo es bajo. Lo demás está bien: `permissions: contents: read`, `timeout-minutes: 10` en
  los tres, sin `continue-on-error`, sin `secrets.`, `pull_request` (no `pull_request_target`)
  y `push` a `main` corren los tres jobs, y la única expresión que llega a un `run:` va por
  variable de entorno (`BASE_REF`), sin inyección. El refspec del `git fetch` deja disponible
  exactamente el ref que lee el script (comprobado contra un remoto local).
- **S-6 · `FRONT/.claude/agents/implementer.md:24`:** dice que las variables ficticias están en
  la sección "Levantar el front" de `CLAUDE.md`; están en "Comandos".
- **S-7 · `API/.claude/agents/coordinator.md:102`:** el paso que escribe la spec del front no
  dice qué hacer si ya existe en el front una carpeta `*-<slug>` con ese `Origen` (flujo
  retomado o cierre repetido): crearía una segunda con `NNN+1`. Sugerencia: "si ya existe,
  actualízala en vez de crear otra". Además, el coordinator de la API necesita permiso de
  escritura fuera de su repo (U-3); sin él, el paso falla y debe caer al camino alterno: el
  texto lo cubre solo para "el repo no está", no para "no puedo escribir".
- **S-8 · `FRONT/docs/constitution.md:150-152` (P-10):** las dos URL `/query/v5/...` de
  TanStack redirigen hoy a `/query/latest/...`. El contenido coincide, pero cuando salga la
  v6 el enlace dejará de ser el de la versión instalada.
- **S-9 · `scripts/check-front-impact.sh`, estrictez:** `no`, `NO`, `No.`, `sí` y `**Sí**`
  salen 1 con un mensaje claro (falla cerrado, correcto). `Si` sin tilde se acepta. Espacios
  alrededor, CRLF, carpeta con espacios, barra final y `VERYGANA_FRONT_DIR` con espacios
  funcionan. Un "No" con motivo `No aplica` pasa: el script no puede juzgar el motivo, eso es
  del reviewer.

### Notas sobre el repo público

- En todo lo nuevo del front (documentos, agentes, pruebas, fixtures, excepciones, CI) no hay
  correos, teléfonos, cédulas, IPs ni hosts de la infraestructura, valores de `.env`, tokens ni
  identificadores de Infisical. Solo aparecen `localhost`, `*.example.test`, las IP de prueba
  de la política de descargas y un secreto rotulado ficticio en `__tests__/middleware/session.ts`.
- `security/audit-exceptions.json` lleva el nombre de quien aprueba ("Nicolás Castro") cuatro
  veces. Es el diseño aprobado; queda dicho porque el repo es público.
- `.gitignore`: `.env*`, `.infisical.json`, `.agents`, `.claude/*` (salvo `agents/`) y
  `.lint-report.json` siguen ignorados (comprobado con `git check-ignore --no-index`).
  `.dockerignore` solo suma exclusiones; `.env`, `.env.*`, `*.pem`, `*.key` y `.claude` siguen fuera.
- **Hallazgo previo, sigue vigente:** `.claude/settings.local.json` está versionado en el front
  (también en `origin/main`). Contiene `permissions` (13 entradas en `allow`), `enabledPlugins`
  y `extraKnownMarketplaces`, con rutas del perfil de Windows de otra persona
  (`Users\Usuario...`). No contiene tokens, correos, IPs ni variables con valor. Sacarlo del
  índice es un paso de git del usuario.

### Mutaciones (RN-6)

Cada una aplicada a mano sobre el archivo, prueba corrida y archivo restaurado desde una copia
(sin git). Al final `git -C FRONT status --short -- src` quedó vacío y `npm test` en 612.

| Área | Mutación | Resultado |
|------|----------|-----------|
| Política | sin chequeo de credenciales | rojo (2) |
| Política | sin chequeo de puerto | rojo (2) |
| Política | sin `toLowerCase` al leer la lista | rojo (1) |
| Política | tiempo límite a 120 s | rojo (1) |
| Política | sin `allowedHosts.size === 0` | verde: equivalente (un conjunto vacío ya rechaza todo) |
| Handler | sin chequeo de sesión | rojo (1) |
| Handler | sin corte por flujo | rojo (2) |
| Handler | sin chequeo de `Content-Length` | rojo (1) |
| Handler | tiempo agotado tratado como 502 | rojo (1) |
| Handler | log con la URL completa (firma incluida) | rojo (1) |
| Handler | origen no 2xx deja pasar | rojo (2) |
| Middleware | sin `/compliance/:path*` en el matcher | rojo (5) |
| Middleware | sin `/raffles` en el matcher | rojo (1) |
| Middleware | diseñador acepta cualquier rol | rojo (5) |
| Middleware | `/admin` y `/commercial` sin chequeo de rol | rojo (173) |
| Middleware | consumidor sin chequeo de rol | rojo (8) |
| Middleware | `authorized` siempre `true` | rojo (52) |
| Middleware | modo apagado ignorado | rojo (1) |
| Middleware | excepción pública del diseñador por `startsWith` solo en `authorized` | verde: equivalente (el cuerpo sigue redirigiendo la subruta; la prueba lo afirma) |
| Tope de lint | sin `cap > baseCap` | rojo (1) |
| Tope de lint | sin `warnings < cap` | rojo (1) |
| Tope de lint | tolera 5 avisos de más | rojo (1) |
| Tope de lint | tolera errores | rojo (1) |
| Auditoría | excepción por paquete en vez de por aviso | rojo (3) |
| Auditoría | umbral solo `critical` | rojo (6) |
| Auditoría | registro inalcanzable = pasa | rojo (5) |
| Auditoría | excepción vencida tolerada | rojo (1) |
| Auditoría | campos obligatorios sin validar | rojo (3) |

Pruebas que podrían pasar por la razón equivocada, revisadas:

- `route.test.ts` compara el tope con un literal propio (25 MiB), no con la constante. Bien.
- `route.test.ts` compara el tiempo límite con `DOWNLOAD_TIMEOUT_MS` (la misma constante), pero
  `downloadPolicy.test.ts` la fija en 60 000; juntas sirven (mutación en rojo).
- Los "destinos internos" se rechazan porque no están en la lista, no por un filtro de IP: es
  la política real (lista exacta), no un falso verde.
- `getToken` está simulado en `route.test.ts`: prueba que el handler exige el resultado, no que
  next-auth valide la cookie. La validación real de la cookie sí se ejerce en la prueba del
  middleware.

### Fuentes de la constitución comprobadas (CA-13, RN-8)

Las 18 URL con `curl`: HTTP 200 y la frase que sustenta la regla presente en la página.

| Principio | URL | Frase encontrada |
|-----------|-----|------------------|
| P-2 | nextjs.org/docs/15/.../server-and-client-components | "By default, layouts and pages are Server Components"; "add 'use client' to specific interactive components" |
| P-3 | nextjs.org/docs/15/app/guides/environment-variables | "only available in the Node.js environment"; "inlined into the JavaScript bundle during next build"; "will no longer respond to changes" |
| P-4, P-13 | nextjs.org/docs/15/.../file-conventions/middleware | "matcher values need to be constants ... Dynamic values such as variables will be ignored"; `unstable_doesMiddlewareMatch` |
| P-4, P-5 | nextjs.org/docs/15/app/guides/authentication | "should not be your only line of defense"; "as close as possible to your data source" |
| P-6 | .../file-conventions/page y /layout | `Promise<{ slug: '1' }>`; "this behavior will be deprecated in the future" |
| P-7, P-8 | nextjs.org/docs/15/app/api-reference/config/eslint | `no-img-element` "slower LCP and higher bandwidth"; `no-html-link-for-pages`; `FlatCompat`; `next/typescript` |
| P-8 | nextjs.org/blog/next-15-5 | "next lint command shows a deprecation warning and will be removed in Next.js 16" |
| P-9 | typescript-eslint.io/rules/no-explicit-any | "dangerous 'escape hatch'"; en `recommended`. Instalado 8.57.1, `'error'` en `recommended.js:16` |
| P-10 | tanstack.com/query/v5/... (dos) | 200, redirigen a `/latest/` (S-8) |
| P-11 | react-hook-form.com/docs/useform | "Integrates with your preferred schema validation library" |
| P-12 | next-auth.js.org/configuration/nextjs y /options | "You must set the same secret in the middleware that you use in NextAuth ... NEXTAUTH_SECRET" |
| P-13 | nextjs.org/docs/15/app/guides/testing/vitest; v4.vitest.dev/guide/cli | `vitest.config.mts`, `__tests__`, "async Server Components"; "Perform a single run without watch mode" |
| P-14 | docs.npmjs.com/cli/v10/commands/npm-ci y npm-audit | "automated environments"; "will exit with an error"; "never write to package.json"; "non-zero code" |

Versiones instaladas (leídas de `node_modules`): next 15.5.27, next-auth 4.24.15, react 19.1.0,
typescript 5.9.3, tailwindcss 4.2.1, eslint 9.39.4, eslint-config-next 15.5.27,
@typescript-eslint/eslint-plugin 8.57.1, @tanstack/react-query 5.90.21, react-hook-form 7.71.2,
@hookform/resolvers 5.2.2, zod 4.3.6, vitest 4.1.11. Coinciden con el documento.

### Dependencias

`package.json`: una sola dependencia directa nueva, `vitest` `4.1.11` (versión exacta, en
`devDependencies`), más tres scripts. El lockfile pasa `npm ci` sin banderas (dos veces: en el
checkout y en la copia limpia). Único cambio de versión en un paquete que ya existía:
`tinyglobby` 0.2.15 -> 0.2.17. `npm ci` reporta 8 vulnerabilidades (1 moderada, 7 altas)
contando desarrollo: son las 2 altas de producción exceptuadas más las 5 de desarrollo que el
plan ya conocía (H-4); `vitest` no agregó ninguna alta.

### Comandos corridos

Front, en el checkout, con las variables ficticias (Node 22.20.0, npm 10.9.3):

| Comando | Salida | Tiempo | Resultado |
|---------|--------|--------|-----------|
| `npm ci` | 0 | 18 s | instalado desde el lockfile, sin banderas |
| `npm run lint:ci` | 0 | 3 s | 0 errores, 360 avisos; tope 360; rama destino 360 (respaldo: el archivo aún no existe en `origin/main`) |
| `npm run build` | 0 | 27 s | build completo, middleware 63.6 kB |
| `npx tsc --noEmit` | 0 | 2 s | sin errores |
| `npm test` | 0 | 1 s | 5 archivos, 612 casos |
| `npm run audit:ci` | 0 | 1 s | 4 excepciones vigentes listadas, revisión 2026-11-30 |

Job más largo (`npm ci` + lint + build + tsc): unos 50 s, muy por debajo de 10 minutos.

Front, copia limpia con `env -i` (solo lo que quedaría en un clon): `npm ci` 0 (8 s);
`npm test` 0 (612, sin ninguna variable `NEXT_PUBLIC_*`, igual que el job `Pruebas`);
`audit:ci` 0; `lint:ci` 0 (5 s); `build` 0 (34 s); `tsc` 0 (7 s); `next dev` -> `/login` 200.

Puerta de lint de punta a punta (repo de descarte, ver "Cómo se probó"):

| Caso | Salida |
|------|--------|
| PR sin cambios, `GITHUB_BASE_REF=main` | 0, fuente `origin/main` |
| PR con la rama destino sin traer | 3 |
| +1 aviso, tope 360 | 1 |
| +1 aviso y tope 361 | 1 |
| lo mismo con `LINT_BASE_CAP=999` | 0 (S-3) |
| push a `main` con el tope ya en 361 | 0 (S-2) |
| error de sintaxis | 1 |

Puerta de auditoría de punta a punta: registro apuntando a `127.0.0.1:9` -> 2 (7 s, tres
intentos); sin lockfile -> 2; sin archivo de excepciones -> 3; `lodash@4.17.20` -> 1.

API: `./mvnw -q compile` 0; `./mvnw -q pmd:check` 0 (3 s); `bash -n scripts/check-front-impact.sh` 0.
`check-front-impact.sh` con 25 casos propios bajo `/bin/bash` 3.2.57: los resultados están en
B-2 y S-9. Contra `specs/_template`, `specs/010-frontend-review` y `specs/005-*`: salida 1
("sin llenar" o "falta la sección"), que es lo correcto para specs anteriores a RN-9.

`diff` de los seis archivos de la API contra sus copias previas: 0 líneas quitadas o
cambiadas en los seis; agregadas 34 (plantilla), 45 (coordinator), 5 (planner), 3
(implementer), 12 (reviewer) y 20 (`CLAUDE.md`).

### Cómo se probó (para que se pueda repetir)

- Las mutaciones se hicieron sobre el checkout y se restauraron copiando el original; no se
  usó git para deshacer.
- Para probar `git show origin/main:.lint-max-warnings` y el `git fetch` del workflow hacía
  falta un ref que tuviera el archivo, y ninguno de los repos lo tiene aún. Creé un repo de
  descarte **dentro de la carpeta temporal de la sesión** (`git init` y dos commits ahí). No
  se ejecutó ningún git de escritura en el front ni en la API.
- `npm ci` y `npm run build` reescribieron `node_modules/` y `.next/` del checkout beta
  (ignorados por git).

### Lo que no se pudo verificar

- Nada de lo que ocurre en GitHub: que el workflow corra, la duración real, que los tres
  nombres aparezcan como checks, la protección de `main` y el PR bloqueado (U-5, M-1, U-6).
- Que el conteo de 360 avisos sea el mismo en Linux (riesgo ya anotado en el plan).
- El ensayo de RN-9 con los agentes en sesión nueva (U-3, U-4): los pasos se leyeron, no se
  ejecutaron. `VERYGANA_FRONT_DIR` no está definida en esta máquina; de los directorios
  hermanos, `../VerYGana-frontend` no existe y `../VerYganar-frontend` no tiene
  `specs/_template/spec.md`, así que hoy el coordinator caería al camino alterno (correcto).
- La imagen de Docker con el `.dockerignore` nuevo (no se construyó; el `Dockerfile` no
  referencia ninguna de las carpetas excluidas).
- `./mvnw verify` de la API no se repitió, por indicación.

### Fuera de alcance (observaciones)

- `AdRepositoryConcurrencyIntegrationTest.concurrentLikes_lastSlot_neverOversells` falla de
  forma intermitente con `ConcurrentModificationException` (reporte del coordinator: 1 de 2479
  en la suite; sola, 2 de 3 en verde). Esta spec no tocó Java: el `git status` de la API solo
  muestra, de esta spec, `CLAUDE.md` y `scripts/check-front-impact.sh`. No veo relación.
  Merece su propio ticket: es una prueba de concurrencia de cupos y un intermitente ahí puede
  ser de la prueba o del código.
- Quedó en la carpeta temporal de la sesión la copia limpia con sus `node_modules`
  (`scratchpad/review-clone` y archivos `review-*`). No la borré: la comprobación de seguridad
  del entorno bloqueó un `rm -rf` y no la rodeé. Se puede borrar a mano.
