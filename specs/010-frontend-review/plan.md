# 010 · Plan de la primera entrega (frentes A, B y parte de C)

- **Spec:** `specs/010-frontend-review/spec.md` (aprobada en Puerta 1, 2026-10-12).
- **Fecha del plan:** 2026-10-12.
- **Criterios cubiertos:** CA-1, CA-2, CA-3, CA-4, CA-8, CA-12, CA-13, CA-14, CA-15, CA-16.
- **Fuera de este plan:** CA-5, CA-6, CA-7, CA-9, CA-10, CA-11 (frentes D, E, F, G).

## 1. Resumen

El front gana tres puertas que hoy no tiene (pruebas, tope de avisos de lint que solo baja y
auditoría de dependencias bloqueante con excepciones escritas), más su flujo de specs versionado
(`CLAUDE.md`, principios, plantilla y agentes). En el repo de la API, el flujo de specs gana el paso
de RN-9: decidir si una funcionalidad toca al front y, si la toca, dejar la spec en borrador allá.

Casi todo se puede hacer y verificar en local. Lo que no (que GitHub impida el merge, el CI de
`main` en verde, medir los 10 minutos) depende de pasos de git del usuario y de un paso de Miguel,
que quedan marcados como tales.

## 2. Lo que se encontró al leer los repos (2026-10-12)

Hechos comprobados, no supuestos. Varios cambian el plan o necesitan una decisión (sección 13).

| # | Hecho | Dónde se ve |
|---|-------|-------------|
| H-1 | Versiones instaladas en `beta-front`: Next `15.5.27`, next-auth `4.24.15`, React `19.1.0`, TypeScript `5.9.3`, ESLint `9.39.4`, Tailwind `4.2.1`, zod `4.3.6`, Node local `22.20.0`, npm `10.9.3`. Sin runner de pruebas. | `package.json`, `node_modules` |
| H-2 | Scripts reales: `dev` (envuelto en `infisical run`), `build`, `start`, `lint` (`next lint`). No hay `test`. | `package.json` |
| H-3 | `npm audit --omit=dev` hoy: 3 hallazgos (2 altos, 1 moderado, 0 críticos). **`postcss@8.4.31` anidado en Next es de severidad ALTA**, no moderada: GHSA-6g55-p6wh-862q y GHSA-r28c-9q8g-f849 son altas (más dos moderadas). `xlsx@0.18.5`: GHSA-4r6h-8v6p-xvw6 y GHSA-5pgg-2g8v-p4x9, altas, sin corrección en npm. `npm audit --omit=dev --audit-level=high` sale con código 1 por los dos paquetes. | ejecutado hoy en el checkout beta |
| H-4 | Con las dependencias de desarrollo la auditoría reporta 5 altas más (`braces`, `micromatch`, `fast-glob`, vía `eslint-config-next`). La puerta actual usa `--omit=dev`. | `npm audit` hoy |
| H-5 | El repo del front es **público** en GitHub (cuenta personal `miguelangelvasquez1`), `main` **no** está protegida. Un repo público admite protección de rama en el plan gratuito. | API pública de GitHub, sin autenticación |
| H-6 | El `.gitignore` del front ignora `.claude` y `.agents` enteros. Los agentes no se pueden versionar sin cambiarlo. | `.gitignore` líneas 47-48 |
| H-7 | En el checkout principal del front ya existen `.claude/agents/{coordinator,planner,implementer,reviewer}.md` (2026-10-05), una adaptación previa de los de la API, ignorada por git. Su coordinator dice "si la funcionalidad ya tiene spec en el backend, usa el mismo número y slug". | `VerYganar-frontend/.claude/agents/` |
| H-8 | El `CLAUDE.md` del front (sin seguimiento) está en inglés y desactualizado: dice que no hay CI y que `/admin` está comentado en el matcher. | `VerYganar-frontend/CLAUDE.md` |
| H-9 | En el repo de la API, `/specs`, `.claude` (salvo `settings.local.json`) y `docs/constitution.md` están en `.gitignore`: agentes, plantilla, constitución y specs existen **solo en esta máquina**. | `.gitignore` líneas 44, 57, 58; `git ls-files` |
| H-10 | El middleware protege por prefijo `/admin`, `/commercial`, `/compliance`, `/game-designer` (menos dos páginas públicas) y, para consumidor, solo `/raffles` y `/ads` exactas. Las entradas `/consumer/...` del matcher no corresponden a ninguna página. | `src/middleware.ts` |
| H-11 | Páginas de consumidor que por su nombre parecen necesitar sesión y **no** pasan por el middleware: `/explore/*`, `/checkout`, `/purchases/[id]/confirmation`, `/raffles/[id]` y sus subrutas, `/plans/checkout`, entre otras. | `src/app/(consumer)/` contra el matcher |
| H-12 | La página `src/app/(consumer)/commercial/[id]/page.tsx` (perfil de un comercial visto por el consumidor, enlazada desde `ProductInfoCard.tsx:47` y `ConsumerProductCard.tsx:114`) cae bajo el prefijo `/commercial`, que exige `ROLE_COMMERCIAL`. Leído en el código, no ejecutado: con el middleware activo un consumidor sería redirigido a `/unauthorized`. | `src/middleware.ts:115-126` |
| H-13 | Sin sesión, `withAuth` redirige a `/api/auth/signin` antes de ejecutar el cuerpo del middleware: las ramas `/login?from=` del cuerpo no se alcanzan. `/unauthorized` no existe (404). | `node_modules/next-auth/next/middleware.js`, revisión 006 |
| H-14 | Next `15.5.27` trae `next/experimental/testing/server` con `unstable_doesMiddlewareMatch`. `next lint` acepta `--format` y `--output-file`. | `node_modules/next/dist/experimental/testing/server/`, `next lint --help` |
| H-15 | `gh` no está instalado en esta máquina. Las comprobaciones contra GitHub del plan usan `curl` a la API pública. | `command not found: gh` |
| H-16 | El checkout beta es un worktree del checkout principal (mismo `.git`). Tiene `next.config.ts` modificado sin commitear (buckets de beta, SCRUM-105), ajeno a esta spec. | `git status`, `.git` es un archivo |

## 3. Dónde se trabaja

**Propuesta:** un tercer checkout, creado por el usuario como worktree nuevo a partir de `beta-front`:

- Ruta: `/Users/nicolascastro/Desktop/VerYganar-frontend-010`
- Rama: `spec-010-quality-gates`, nacida de `beta-front` (`2b792d0`)

En adelante, `FRONT` es esa ruta y `API` es `/Users/nicolascastro/Desktop/verYganar`.

Por qué no los otros dos:

- El checkout principal (rama `Nico`) no tiene el CI, el `Dockerfile`, `downloadPolicy.ts` ni el
  middleware corregido, y tiene un cambio ajeno en `usePetSession.ts`.
- El checkout beta es de donde sale la imagen desplegada y tiene un cambio ajeno en
  `next.config.ts`. Mezclar ahí el trabajo de esta spec ensucia la rama de despliegue.

Riesgos de la propuesta:

- La rama nueva lleva dentro el commit `2b792d0`. Hasta que `beta-front` llegue a `main`, un PR de
  la rama nueva muestra también ese commit. Si el PR de `beta-front` se mergea con "squash", la rama
  nueva queda desalineada y el usuario tendría que rebasarla. Recomendación: mergear `beta-front`
  con merge normal, o subir todo en un solo PR.
- Los archivos ignorados no viajan entre worktrees: los agentes previos (H-7) y el `CLAUDE.md`
  previo (H-8) se leen desde el checkout principal como insumo.
- Hace falta `npm ci` en el worktree nuevo (lo hace el implementer; no es git).

**Alternativa** si el usuario no quiere otro worktree: trabajar directamente en
`VerYganar-frontend-beta` sobre `beta-front`. Funciona igual; el costo es que los cambios quedan
mezclados con el de `next.config.ts` y el usuario tendrá que separarlos al commitear.

## 4. Dependencias nuevas propuestas (sujetas a aprobación en Puerta 2)

**Una sola, de desarrollo:** `vitest`, fijada a una versión exacta (la estable vigente; el
implementer la confirma con `npm view vitest version` y con la documentación de esa versión).

Justificación:

- La documentación oficial de Next para la versión 15 tiene guías de pruebas para Vitest y para
  Jest (sección "Testing"). Se propone Vitest porque ejecuta TypeScript y módulos ES sin
  transformadores adicionales y no necesita `ts-node`, `@types/jest` ni `jest-environment-*`.
- No duplica nada: hoy no hay ningún runner.
- **Excepción escrita frente a la guía (RN-8):** la guía de Vitest de Next instala además
  `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom` y
  `vite-tsconfig-paths`. No se instalan ahora porque la primera entrega solo prueba lógica sin
  interfaz en entorno `node`; el alias `@/` se resuelve con tres líneas en `vitest.config.mts`.
  Esas dependencias entran con las pruebas de componentes (CA-6), en su propia spec.

Descartado:

- `node --test` (cero dependencias, sugerido en la revisión 006): el middleware importa
  `next/server` y `next-auth/middleware` y el código usa el alias `@/`; resolverlos con el runner
  nativo exige cargadores a mano y es frágil.
- Jest con `next/jest`: también oficial, pero son al menos cuatro paquetes y más fricción con
  módulos ES.
- `audit-ci` / `better-npm-audit` para las excepciones de auditoría: se resuelve con un script
  propio de unas decenas de líneas, probado, sin dependencia.

Nota de fuentes: desde este agente no hubo acceso a la documentación en línea (ni context7). Las
referencias a la documentación oficial de este plan están citadas de memoria y **deben confirmarse
contra la versión instalada** en la tarea T13 antes de escribirlas en el documento de principios.

## 5. Pruebas (frente C, parte de la primera entrega)

Ubicación: carpeta `__tests__/` en la raíz del front (es la que usa la guía de Vitest de Next).
Queda fuera de los directorios que revisa `next lint`, así que no altera el conteo de avisos, y no
choca con las convenciones de archivos de Next dentro de `src/`.

### 5.1 Política de descargas (CA-12)

Dos archivos:

- `__tests__/proxy/downloadPolicy.test.ts` contra las funciones puras `parseAllowedHosts` y
  `validateTarget`. Casos, tomados de lo que la revisión 006 probó a mano:
  - Destinos permitidos: host exacto, mayúsculas, `:443` explícito, espacios alrededor, host con
    caracteres codificados que normalizan al permitido.
  - Destinos internos: `127.0.0.1`, `localhost`, `[::1]`, `[::ffff:127.0.0.1]`, `169.254.169.254`,
    IP en decimal, octal y hexadecimal, nombres de la red interna (`api`, `alloy`).
  - Esquemas no permitidos: `http`, `file`, `data`, `blob`, `javascript`, `ftp`, sin esquema, `//host`.
  - Variantes del host: sufijo, prefijo, subdominio, punto final, credenciales (`user@`,
    `permitido@otro`), otros puertos, homógrafo en punycode.
  - Lista de hosts: ausente, vacía, solo comas, con `https://`, con `:443`, con comodín. Todas
    rechazan todo (falla cerrado).
  - Constantes de límite: `MAX_DOWNLOAD_BYTES` es 25 MiB y `DOWNLOAD_TIMEOUT_MS` es 60 000.
- `__tests__/proxy/route.test.ts` contra el handler `GET` de `src/app/api/proxy-download/route.ts`,
  con `fetch` y `getToken` simulados (sin red). Es lo que cubre "límites", que no viven en la
  función pura:
  - URL no permitida: 400 y `fetch` nunca se llama, con y sin sesión.
  - URL permitida sin sesión: 401 y `fetch` nunca se llama.
  - `fetch` se invoca con `redirect: 'error'` y con señal de tiempo límite.
  - `Content-Length` mayor al tope: 502. Cuerpo sin `Content-Length` que supera el tope: el flujo
    se corta. Cuerpo de exactamente el tope: pasa.
  - Tiempo agotado: 504. Otro fallo de red: 502. Origen con estado no 2xx: 502.
  - La respuesta correcta lleva solo las cabeceras fijas (`application/octet-stream`,
    `attachment`, `nosniff`, `private, no-store`) aunque el origen mande `text/html`.

### 5.2 Protección de rutas por rol (CA-4)

Un archivo, `__tests__/middleware/routeProtection.test.ts`, contra el middleware real (sin
refactorizarlo: es un componente de seguridad sin pruebas, primero se caracteriza).

Cómo se logra "para todas":

1. **Inventario automático.** La prueba recorre `src/app/**/page.tsx` y convierte cada archivo en
   su URL (quita los grupos entre paréntesis, sustituye `[id]` por un valor de ejemplo).
2. **Clasificación obligatoria.** Una tabla en la prueba asigna cada URL a una clase: protegida
   por un rol concreto, o pública de forma explícita. Si aparece una página que no está
   clasificada, la prueba falla con un mensaje que dice qué hacer. Así una ruta nueva no puede
   quedar sin decidir.
3. **Matriz.** Para cada página protegida y cada una de las seis identidades (sin sesión,
   consumidor, comercial, admin, oficial de cumplimiento, diseñador), con `MIDDLEWARE=ACTIVE`:
   - `unstable_doesMiddlewareMatch` confirma que el `matcher` exportado alcanza la URL (H-14);
   - se invoca el `default export` del middleware con una petición real de Next y una cookie de
     sesión creada con `encode` de `next-auth/jwt` y un secreto ficticio definido en la prueba;
   - sin sesión: redirección (a `/api/auth/signin`, H-13); rol equivocado: redirección a
     `/unauthorized`; rol correcto: deja pasar.
4. **Regresiones ya ocurridas (RN-6):** las dos páginas públicas del diseñador responden sin
   sesión (defecto D-1 de la revisión 006); `/commercial-onboarding` no se trata como
   `/commercial`; barra final; una subruta parecida a las públicas del diseñador sí exige sesión.
5. **Modo apagado:** sin `MIDDLEWARE=ACTIVE` todo pasa (documenta el comportamiento de desarrollo).

La prueba describe lo que el middleware hace **hoy**. Las páginas de H-11 quedan en la lista
pública bajo un grupo rotulado "sin protección de middleware hoy, decisión pendiente", y la de
H-12 queda clasificada como `ROLE_COMMERCIAL` con un comentario que remite a la decisión D-7. No se
cambia el comportamiento: la spec deja fuera los cambios de funcionalidad.

Riesgo técnico y salida: si Vitest no logra importar el middleware real (`next-auth/middleware`
requiere `next/server` en formato CommonJS), la tarea T2 lo detecta con una prueba mínima antes de
escribir el resto. Salidas, en orden: `server.deps.inline` para `next-auth`; simular
`next-auth/middleware` conservando el callback `authorized` real. La segunda pierde cobertura de
`withAuth` y habría que decirlo en la revisión.

## 6. CI como puerta (frente B)

### 6.1 Tope de avisos de lint que solo baja (RN-2, CA-2)

- `.lint-max-warnings`: un archivo con un número. Valor inicial: `360` (el conteo medido en la
  revisión 006; T1 lo vuelve a medir y, si difiere, se detiene y se avisa).
- `scripts/lint-ratchet.mjs`: corre `next lint --format json --output-file <temporal>` una sola
  vez y decide con una función pura `evaluateLint({ errors, warnings, cap, baseCap })`:
  - hay errores: falla (RN-1);
  - `warnings > cap`: falla (CA-2);
  - `warnings < cap`: falla con el mensaje "baja el tope a N en `.lint-max-warnings`". Esto es lo
    que hace que el tope baje de verdad: sin esta regla, quien corrige diez avisos deja diez de
    holgura para el siguiente PR;
  - `cap > baseCap`: falla (el tope nunca se sube). `baseCap` es el valor del archivo en la rama
    destino del PR (`git show origin/<base>:.lint-max-warnings`, lectura). Si el archivo aún no
    existe en la rama destino, `baseCap` es 360.
- `package.json`: script `lint:ci`. El script `lint` existente no cambia.
- La función pura se prueba con Vitest (`__tests__/scripts/lintRatchet.test.ts`).

Se sigue usando `next lint` aunque en Next 15.5 está en desuso y desaparece en Next 16: migrar el
linter es parte de la decisión de Next 16 (pregunta abierta de la spec, frente D). Queda escrito
como excepción en el documento de principios.

Límite conocido: un PR podría editar el propio script. Eso se ve en la revisión del PR; no hay
defensa automática en esta entrega.

### 6.2 Auditoría bloqueante con excepciones escritas (RN-10, CA-3, CA-16)

`npm audit` no tiene forma nativa de ignorar un aviso concreto. Bajar `--audit-level` a `critical`
relajaría el umbral para todo, que es justo lo que CA-16 prohíbe. Se propone:

- `security/audit-exceptions.json`: lista de excepciones **por aviso** (id `GHSA-…`), no por
  paquete. Campos obligatorios: `id`, `package`, `reason`, `approvedBy`, `approvedOn`, `reviewBy`.
- `scripts/audit-gate.mjs`: corre `npm audit --omit=dev --json` y decide con una función pura
  `evaluateAudit(report, exceptions, today)`:
  - un aviso alto o crítico sin excepción: falla (CA-3);
  - un aviso con excepción vigente: pasa y se lista en la salida con su fecha de revisión;
  - excepción vencida (`reviewBy` anterior a hoy) o con campos faltantes: falla (RN-10);
  - excepción que ya no corresponde a ningún aviso: aviso en la salida, no falla;
  - si `npm audit` no pudo hablar con el registro (salida sin el formato esperado): falla con un
    mensaje y un código de salida **distintos** de "hay vulnerabilidades", para no confundir la
    caída del registro con un hallazgo. Se reintenta la corrida.
- Como la excepción es por aviso, un aviso alto **nuevo** en `xlsx` vuelve a fallar: el umbral no
  baja ni siquiera para el paquete exceptuado.
- `package.json`: script `audit:ci`. La función pura se prueba con Vitest y reportes de ejemplo
  (`__tests__/scripts/auditGate.test.ts`), incluido el reporte real de hoy.

Excepción de `xlsx` (aprobada en la spec), texto propuesto:

- Avisos: GHSA-4r6h-8v6p-xvw6 y GHSA-5pgg-2g8v-p4x9, `xlsx@0.18.5`.
- Motivo: no existe versión corregida en npm; se usa en cuatro archivos del panel del comercial
  (carga de inventario y exportación de respuestas de encuestas) y corre en el navegador, no en la
  imagen del servidor; resolverla es del frente D.
- Fecha de revisión propuesta: 2026-11-30 (la confirma el usuario, D-4).

**El `postcss` anidado en Next afecta la puerta (H-3).** Sus dos avisos altos hacen fallar la
auditoría igual que `xlsx`, y la spec solo aprueba la excepción de `xlsx`. Con la spec tal como
está, CA-16 ("el CI de `main` queda en verde") no se puede cumplir. No se resuelve aquí: es la
decisión D-1. Opciones:

1. Segunda excepción escrita para los dos avisos altos de `postcss` (recomendada). Motivo
   disponible en la revisión 006: solo se usa durante el build, no se carga en ejecución (0 cargas
   medidas) y solo procesa el CSS del propio repo. Revisión atada a la decisión de Next 16.
2. `overrides` en `package.json` para forzar un `postcss` corregido dentro de Next. Es un arreglo
   real, pero cambia una dependencia interna que Next fija a una versión exacta; habría que
   probar el build completo. Corresponde más al frente D.
3. No hacer bloqueante la auditoría hasta Next 16. Deja CA-3 y CA-16 sin cumplir.

El plan está escrito para la opción 1: las excepciones son datos, así que agregar o no las de
`postcss` es un cambio en un archivo. Si el usuario elige otra, cambia solo la tarea T10.

Nota sobre alcance: la puerta audita dependencias de producción (`--omit=dev`), como la actual y
como dice CA-11. Una dependencia de desarrollo vulnerable no bloquea; hoy hay cinco altas ahí (H-4).

### 6.3 `ci.yml`

Tres jobs en paralelo, cada uno con `timeout-minutes: 10`:

| Job (nombre del check) | Pasos |
|------------------------|-------|
| `Lint, tipos y build` | `npm ci`, traer la rama destino (solo en PR), `npm run lint:ci`, `npm run build`, `npx tsc --noEmit` |
| `Pruebas` | `npm ci`, `npm test` |
| `Auditoría de dependencias` | `npm ci`, `npm run audit:ci` (se quita `continue-on-error`) |

- Se conservan: disparadores, `permissions: contents: read`, concurrencia, Node 22, variables
  públicas ficticias, ningún secreto.
- Se agrega la caché de `.next/cache` que recomienda la guía de Next sobre caché de build en CI.
- Los tres nombres son los checks que Miguel marca como obligatorios.

### 6.4 Menos de 10 minutos

- Jobs en paralelo y caché de npm y de `.next/cache`.
- El `timeout-minutes: 10` convierte el requisito en una comprobación: un job que lo supere falla.
- T1 y T22 miden los tiempos en local como estimación; la medida real es la duración de la primera
  corrida en GitHub (paso U-5).

### 6.5 Protección de `main` (paso de Miguel)

En GitHub, sobre `main`: exigir PR, exigir los tres checks, y no permitir que los administradores
se la salten. Comprobación sin credenciales (el repo es público):

```bash
curl -s https://api.github.com/repos/miguelangelvasquez1/VerYGana-frontend/branches/main \
  | grep -E '"protected"|"enforcement_level"|"contexts"' -A4
```

Hoy devuelve `"protected": false`. Debe devolver `true` y los tres nombres en `contexts`.

## 7. Flujo de trabajo del front (frente A)

Archivos nuevos en `FRONT`:

| Archivo | Contenido |
|---------|-----------|
| `CLAUDE.md` | En español. Requisitos (Node 22, CLI de Infisical), cómo levantar con y sin Infisical, tabla de variables de entorno (nombres, nunca valores), comandos reales (`dev`, `build`, `lint`, `lint:ci`, `test`, `audit:ci`), arquitectura (se rescata lo vigente del `CLAUDE.md` previo, corrigiendo H-8), flujo de specs y cómo arrancar los agentes, qué revisar en cada PR, cómo bajar el tope de lint, cómo se escribe una excepción de auditoría, y qué hacer al crear una ruta protegida. Incluye `@docs/constitution.md`. |
| `docs/constitution.md` | Principios innegociables del front. Cada regla técnica es un bloque con **Regla**, **Fuente** (documento oficial y URL), **Versión** (la instalada) y **Excepción** (motivo, o "ninguna"). Las reglas que son del equipo y no de una documentación (idioma, datos personales, prueba por cada bug) se rotulan "Regla del equipo" con su origen. |
| `specs/_template/spec.md` | Plantilla de la API adaptada: campo "Origen" (propia del front, o spec de la API que la originó), sección "Contrato con la API", estados de pantalla. |
| `.claude/agents/coordinator.md`, `planner.md`, `implementer.md`, `reviewer.md` | Base: los de la API. Insumo: la adaptación previa del front (H-7). Cada regla técnica cita el id del principio (`P-n`) del que sale en vez de repetir la fuente. Se actualizan a la realidad nueva: ya hay runner de pruebas, puertas de CI y `specs/` propia. |

Archivos que cambian en `FRONT`:

- `.gitignore`: deja de ignorar `.claude/agents/`; el resto de `.claude` y `.agents` sigue
  ignorado (habilidades de terceros y ajustes locales). Ignora el reporte temporal de lint.
- `.dockerignore`: excluye `specs`, `docs`, `__tests__`, `scripts`, `security` y la configuración
  de Vitest, para que nada de esto entre al contexto de build de la imagen.

Reglas candidatas del documento de principios (la lista final y sus fuentes se confirman en T13):

| Id | Regla | Fuente a confirmar |
|----|-------|--------------------|
| P-1 | Stack cerrado: Next 15.5 con App Router, React 19.1, TypeScript 5.9 estricto, Tailwind 4, next-auth 4.24. Una dependencia nueva se justifica y no duplica otra. | Regla del equipo (constitución de la API §1) |
| P-2 | Componentes de servidor por defecto; `'use client'` solo en la hoja que lo necesita. | Next 15, "Server and Client Components" |
| P-3 | Ningún secreto en `NEXT_PUBLIC_*`: esas variables quedan dentro del bundle al compilar. | Next 15, "Environment Variables" |
| P-4 | El `matcher` del middleware es una lista literal; toda ruta con rol entra ahí y en la prueba de protección. | Next 15, "Middleware", apartado del matcher |
| P-5 | El middleware no es la única defensa: los datos los autoriza la API. | Next 15, guía "Authentication" |
| P-6 | `params` y `searchParams` son asíncronos en páginas y layouts. | Next 15, referencia de `page` |
| P-7 | Imágenes con `next/image` y enlaces internos con `next/link`. | Next 15, reglas de `eslint-config-next` |
| P-8 | Lint con ESLint 9 en configuración plana y las bases `next/core-web-vitals` y `next/typescript`. Excepción: `next lint` sigue en uso pese a estar en desuso. | Next 15, "ESLint" |
| P-9 | Sin `any`. Excepción: hoy es aviso por deuda, bajo el tope de RN-2. | typescript-eslint, `no-explicit-any` |
| P-10 | Datos del servidor en el cliente con TanStack Query; claves e invalidaciones explícitas. | TanStack Query 5 |
| P-11 | Formularios con react-hook-form y validación con zod. | react-hook-form 7, zod 4 |
| P-12 | Sesión con next-auth v4 (`withAuth`, `getToken`); el secreto solo en el servidor. | next-auth 4, "Next.js middleware" |
| P-13 | Pruebas con Vitest; el middleware se prueba con las utilidades experimentales de Next. Excepción: API marcada `unstable_`. | Next 15, "Testing: Vitest" y "Middleware: unit testing" |
| P-14 | Instalación reproducible con `npm ci` y el lockfile; auditoría con excepciones escritas. | npm 10, `npm ci` y `npm audit` |
| P-15 | Toda llamada saliente del servidor lleva tiempo límite y distingue "inválido" de "caído". | Regla del equipo (`CLAUDE.md` de la API) |
| P-16 | Datos personales y tokens nunca en logs, errores ni URLs. | Regla del equipo (constitución de la API §5) |
| P-17 | Todo bug arreglado trae la prueba que falla sin el arreglo. | Regla del equipo (RN-6) |
| P-18 | Código en inglés; comentarios, commits, documentación y textos al usuario en español. | Regla del equipo (RN-7) |

Si una fuente no se puede confirmar para la versión instalada, la regla se rotula "Regla del
equipo" en vez de citar una fuente que no se verificó.

No se copia `.claude/commands/feature.md`: la spec pide agentes, no ese comando.

## 8. RN-9: la spec del front escrita por el flujo de la API

### 8.1 Cómo decide el flujo si una funcionalidad toca al front

El coordinator lo decide en la fase de spec y lo escribe en una sección obligatoria nueva de la
plantilla, "Impacto en el front". Toca al front si cumple **cualquiera** de estos criterios:

1. Agrega, cambia o elimina la ruta o el método de un endpoint que el front llama o va a llamar.
2. Cambia un DTO de entrada o de salida: campo nuevo, eliminado o renombrado, tipo, si admite
   nulo, valores de un enumerado.
3. Cambia un código HTTP o un mensaje de error que el front muestra o sobre el que decide (su
   interceptor trata 401, 402, 503 y el 400 de cambio de plan).
4. Cambia roles, un `@PreAuthorize` o `PublicPaths` de forma que cambia quién ve una pantalla.
5. Cambia un flujo: un paso nuevo, un estado nuevo, un enlace de correo que abre una página del
   front, una acción de reCAPTCHA.
6. Cambia algo que el front debe replicar en su configuración: orígenes de CORS, atributos de
   cookies, límites de tamaño de archivos.

No lo toca, por ejemplo: un índice, una migración sin cambio de DTO, un scheduler, logs,
rendimiento interno, webhooks de terceros.

Si la respuesta es "No", la sección lleva el motivo en una línea. Si el cambio pasa por un
controller o un DTO y aun así es "No", lleva además la búsqueda que lo respalda (por ejemplo
`grep -rn "<ruta>" <front>/src/services <front>/src/hooks <front>/src/types` sin resultados).

Segunda comprobación, para que no dependa solo del criterio de la primera fase:

- El planner agrega a `plan.md` la sección "Contrato con el front" cuando la respuesta es "Sí", y
  si su plan toca controllers, DTOs, roles o errores con la spec en "No", lo anota en "Bloqueos".
- El reviewer compara el diff con la sección: un cambio en `controllers/`, `dtos/`, manejo de
  errores o `PublicPaths` con la spec en "No" y sin la búsqueda de respaldo es bloqueante.

### 8.2 Dónde escribe y cuándo

- Cuándo: en el cierre (fase 5), con la revisión aprobada, para que el contrato descrito sea el
  implementado y no el planeado.
- Dónde: `<front>/specs/<NNN>-<slug>/spec.md`, con la plantilla del front, `Estado: Borrador`,
  `Origen: API · specs/<NNN>-<slug> · SCRUM-<n>`. Contiene qué cambió en el contrato (endpoints,
  DTOs, errores, roles), qué se espera del front en términos del usuario, criterios de aceptación
  propuestos y preguntas abiertas. No lleva plan ni tareas: eso lo hace el flujo del front cuando
  alguien la aprueba.
- La spec de la API recibe en "Impacto en el front" la referencia: repositorio y ruta de la spec
  creada.
- El coordinator no hace git en ninguno de los dos repos. El archivo queda sin seguimiento en el
  checkout del front y el informe de cierre le dice al usuario que debe commitearlo.

### 8.3 Cómo se localiza el repo del front

1. Variable de entorno `VERYGANA_FRONT_DIR`, si está definida.
2. Si no, los directorios hermanos `../VerYGana-frontend` y `../VerYganar-frontend`.
3. El candidato vale solo si su `package.json` tiene `"name": "rifacel-app-nextjs"` y existe
   `specs/_template/spec.md`.

En esta máquina hay varios checkouts del front, así que la variable debe definirse de forma
explícita. Definirla y dar al coordinator permiso de escritura sobre esa carpeta son ajustes de
configuración local que hace el usuario (U-3), no un agente.

### 8.4 Cómo se numera en el otro repo

- La numeración del front es propia e independiente de la de la API.
- `NNN` es el mayor número entre las carpetas de `specs/` en el checkout y las de
  `origin/main` (`git ls-tree`, lectura), más uno. El slug es el mismo de la spec de la API.
- La relación entre las dos specs va en sus encabezados ("Origen" y "Spec del front"), nunca en
  que coincidan los números.
- Si dos ramas crean el mismo número, se renombra la más nueva al hacer merge (mismo criterio que
  las migraciones con fecha).
- Esto contradice la regla "mismo número y slug" de los agentes previos del front (H-7); en la
  versión nueva de esos agentes se sustituye.

### 8.5 Si el repo del front no está en la máquina

El flujo no falla en silencio ni inventa una ruta:

- escribe el mismo contenido en `specs/<NNN>-<slug>/front-spec.md`, dentro de la carpeta de la
  spec de la API;
- en "Impacto en el front" deja `Spec del front: PENDIENTE DE TRASLADAR (front-spec.md)`;
- el estado de la spec de la API no pasa a "Implementada" a secas: queda "Implementada · pendiente
  la spec del front", y el informe de cierre lo dice.

### 8.6 Comprobación automática

`scripts/check-front-impact.sh <carpeta de la spec>` en el repo de la API. Sale con 0 si la spec
dice "No" con motivo, o "Sí" con una referencia a un `spec.md` que existe y está en borrador o
más avanzado. Sale con 1 en cualquier otro caso (sección ausente, "Sí" sin spec, pendiente de
trasladar). Lo corre el reviewer y es el comando de verificación de CA-14 y CA-15.

### 8.7 Archivos que cambian en `API`

| Archivo | Cambio | ¿Versionado? |
|---------|--------|--------------|
| `specs/_template/spec.md` | Sección obligatoria "Impacto en el front" | No (H-9) |
| `.claude/agents/coordinator.md` | Fase 1: decidir y escribir el impacto. Fase 5: escribir la spec del front, referenciarla, o aplicar 8.5 | No (H-9) |
| `.claude/agents/planner.md` | Sección "Contrato con el front" en `plan.md`; bloqueo si hay incoherencia | No (H-9) |
| `.claude/agents/implementer.md` | Si un cambio altera una ruta, respuesta o rol que no está en el contrato, para y lo reporta | No (H-9) |
| `.claude/agents/reviewer.md` | Compara el diff con el impacto declarado y corre el script | No (H-9) |
| `scripts/check-front-impact.sh` | Nuevo | Sí, cuando el usuario lo commitee |
| `CLAUDE.md` | Sección corta: RN-9 y la variable `VERYGANA_FRONT_DIR` | Sí |

`CLAUDE.md` y los agentes son instrucciones compartidas: su cambio está pedido por la spec
aprobada, y aun así el plan lo deja señalado para que el usuario lo confirme en Puerta 2 (D-9).

Consecuencia de H-9: salvo `CLAUDE.md` y el script, RN-9 queda funcionando solo en la máquina de
quien tenga estos archivos locales. Ver D-8.

## 9. Traslado de la spec 010 al repo del front

- **Cuándo:** al cierre, con la revisión aprobada. Durante la ejecución hay una sola fuente de
  verdad, la carpeta de la API, que es donde el flujo en curso lee y marca tareas.
- **Cómo:** se copian `spec.md`, `plan.md`, `tasks.md` y `review.md` a
  `FRONT/specs/010-frontend-review/`. `review-front.md` de la spec 006 no se traslada.
- **Número:** se conserva `010`, para no romper las referencias existentes (SCRUM-106, la spec
  006). La siguiente spec del front será la 011 de su propia secuencia (D-5).
- **La copia de la API:** hasta que el usuario commitee la copia del front, la de aquí se queda
  intacta con un aviso en la primera línea. Después se reemplaza `spec.md` por una nota de cinco
  líneas que apunta a la spec del front, y se quitan `plan.md`, `tasks.md` y `review.md`. La
  carpeta `010-frontend-review` permanece para que el número no se reutilice en la API.
- **Ojo (H-5):** el repo del front es público. La spec 010 describe debilidades aún abiertas (el
  front acepta un token sin verificar la firma). Ver D-6.

## 10. Seguridad y datos personales

- Las pruebas usan un secreto, tokens, hosts y URLs ficticios definidos en el propio archivo de
  prueba. Ningún valor sale de `.env` ni de Infisical. El CI sigue sin usar secretos de GitHub.
- El middleware imprime ruta y rol por petición: en la salida de las pruebas aparecerían rutas y
  roles ficticios. Las pruebas silencian `console.log` para no ensuciar la salida del CI.
- `CLAUDE.md` y los principios listan nombres de variables, nunca valores, y no incluyen el
  identificador del proyecto de Infisical.
- El archivo de excepciones solo contiene identificadores públicos de avisos.
- La spec del front que escribe RN-9 describe contratos: no debe copiar datos reales de
  usuarios ni ejemplos con correos o teléfonos reales. Queda como regla en el coordinator.

## 11. Dependencias externas y efectos colaterales

- `npm audit` habla con el registro de npm: el script distingue "hay vulnerabilidades" de "no se
  pudo consultar" (6.2). Con el check obligatorio, una caída del registro bloquea merges hasta
  reintentar; se acepta y se documenta.
- Ninguna prueba toca la red.
- Qué deja de ocurrir cuando las puertas se activan: un PR con un aviso de lint nuevo, con una
  prueba roja o con una dependencia vulnerable ya no se puede mergear, **incluidos los PR que
  hoy están abiertos o en ramas viejas** (`dev`, `Helen`, `Nico`), que tendrán que traer `main`
  antes. Una excepción de auditoría vencida pone en rojo todos los PR hasta que se revise.
- El código de producción del front no cambia en esta entrega: ni el middleware ni la ruta de
  descargas. Solo se agregan pruebas, scripts, documentos y configuración de CI.

## 12. Orden y dependencias con los pasos de git

| Paso | Quién | Bloquea a |
|------|-------|-----------|
| U-1 Crear el worktree y la rama | Usuario | Todo el trabajo en el front |
| U-2 Aprobar dependencias y decisiones (Puerta 2) | Usuario | T2 en adelante |
| U-3 Definir `VERYGANA_FRONT_DIR` y el permiso de escritura | Usuario | El ensayo U-4 |
| U-4 Ensayo de RN-9 en una sesión nueva | Usuario | Cierre de CA-14 y CA-15 |
| U-5 Subir `beta-front` y la rama de trabajo, abrir los PR | Usuario | M-1, U-6, la medida de los 10 minutos |
| M-1 Proteger `main` con los tres checks | Miguel | Cierre de CA-1 |
| U-6 PR de prueba que debe quedar bloqueado | Usuario | Cierre de CA-1, CA-2, CA-3 en GitHub |

Pueden avanzar sin esperar a U-5: todas las tareas T1 a T23 (pruebas, scripts, CI escrito,
documentos, agentes, RN-9 y la verificación local completa). No pueden cerrarse sin U-5: que
GitHub impida el merge (CA-1), el CI de `main` en verde (CA-16) y la duración real del CI.

## 13. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Vitest no importa el middleware real | T2 lo prueba primero; salidas descritas en 5.2 |
| El conteo de avisos difiere entre macOS y Linux | T1 mide en local; la primera corrida en GitHub lo confirma. Si difiere, se ajusta el tope al valor del CI antes de proteger la rama |
| `unstable_doesMiddlewareMatch` cambia de nombre | Next está fijado en versión exacta; queda como excepción escrita y se revisa al subir Next |
| Activar los checks bloquea a quien tenga ramas viejas | Avisar al equipo antes de M-1; la protección se activa después de que `main` esté en verde |
| Una excepción vence un día cualquiera y pone `main` en rojo | La fecha se elige a propósito y se anota en el calendario; alternativa en D-4 |
| El agente no aplica RN-9 aunque la regla esté escrita | Script de comprobación en el cierre y revisión del diff por el reviewer (8.1, 8.6); ensayo U-4 |
| Las fuentes citadas de memoria son inexactas para la versión instalada | T13 obliga a confirmarlas y a rotular como regla del equipo lo que no se confirme |
| El traslado de la spec se pierde si el usuario no commitea | La copia de la API no se toca hasta comprobar que la del front está en git (T24) |

## 14. Decisiones que le tocan al usuario

- **D-1 · `postcss` (bloquea CA-16).** La auditoría bloqueante no queda en verde solo con la
  excepción de `xlsx`. Elegir entre segunda excepción escrita (recomendado), `overrides`, o no
  bloquear todavía. Si se elige la primera, hay que actualizar RN-10 y CA-16 en la spec, que hoy
  nombran solo `xlsx`.
- **D-2 · Dependencia nueva.** Aprobar `vitest` como única dependencia de desarrollo nueva.
- **D-3 · Checkout.** Worktree nuevo `VerYganar-frontend-010` (recomendado) o trabajar en el
  checkout beta.
- **D-4 · Excepciones de auditoría.** Fecha de revisión de `xlsx` (propuesta: 2026-11-30) y si una
  excepción vencida hace fallar el CI (recomendado) o solo avisa.
- **D-5 · Número de la spec en el front.** Conservar `010` (recomendado) o renumerar a `001`.
- **D-6 · Repo público.** Trasladar la spec 010 tal cual, o recortar antes la descripción del
  frente D (token sin verificar). La debilidad ya se puede leer en el código público, así que el
  riesgo adicional es bajo, pero es decisión del usuario.
- **D-7 · Alcance de CA-4.** Las pruebas cubren lo que el middleware protege hoy. Decidir si las
  páginas de consumidor sin protección (H-11) y la página `/commercial/[id]` bloqueada para el
  consumidor (H-12) van a una spec aparte (recomendado: son cambios de comportamiento, fuera del
  alcance de esta).
- **D-8 · Flujo de la API sin versionar.** Los agentes, la plantilla, la constitución y las specs
  de la API están ignorados por git (H-9). RN-9 funcionará solo en esta máquina mientras siga
  así. Decidir si se versionan; no está en el alcance de esta spec.
- **D-9 · Cambios en instrucciones compartidas.** Confirmar que se modifican `CLAUDE.md` y los
  agentes de la API como describe 8.7.
- **D-10 · Regla estricta del tope.** Confirmar que un PR que baja los avisos sin bajar el tope
  falla (6.1). Sin ella RN-2 se cumple solo a medias.

## 15. Bloqueos

- **Parcial, sobre CA-16:** depende de D-1. Todo lo demás del plan avanza sin esa decisión; solo
  T10 y el paso de hacer obligatorio el check de auditoría la necesitan.
- Ninguna contradicción con la constitución de la API. Las reglas de idioma y de no hacer git se
  aplican a las dos mitades del plan.

## 16. Trazabilidad

| CA | Tareas | Prueba o comprobación |
|----|--------|-----------------------|
| CA-1 | T11, T22, U-5, M-1, U-6 | `ci.yml` con los tres checks; `curl` de la protección de `main`; PR de prueba con un error de tipos que GitHub no deja mergear |
| CA-2 | T7, T8, T11, U-6 | `__tests__/scripts/lintRatchet.test.ts`; ensayo local con un aviso de más; PR de prueba |
| CA-3 | T9, T11, U-6 | `__tests__/scripts/auditGate.test.ts` (aviso alto nuevo, crítico, aviso nuevo en paquete exceptuado); PR de prueba |
| CA-4 | T2, T5, T6 | `__tests__/middleware/routeProtection.test.ts`: inventario de todas las páginas y matriz por rol |
| CA-8 | T12, T14, T15, T16, T17 | Ensayo de copia limpia: instalar, probar, compilar y levantar siguiendo `CLAUDE.md` |
| CA-12 | T3, T4, T11 | `__tests__/proxy/downloadPolicy.test.ts` y `__tests__/proxy/route.test.ts`, en el job `Pruebas` |
| CA-13 | T13, T15 | Comprobación de que cada regla tiene Fuente, Versión y Excepción, y de que los agentes citan el id del principio |
| CA-14 | T18, T19, T20, T21, U-4 | `scripts/check-front-impact.sh` contra casos de ejemplo; ensayo en sesión nueva con una funcionalidad que toca al front |
| CA-15 | T18, T19, T20, U-4 | El mismo script con un caso "No"; ensayo con una funcionalidad que no toca al front y comprobación de que no se creó nada |
| CA-16 | T9, T10, T22, U-5 | Excepción escrita con motivo y fecha; `npm run audit:ci` en verde; prueba de que un aviso alto ajeno sigue fallando; CI de `main` en verde |
