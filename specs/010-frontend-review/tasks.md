# 010 · Tareas de la primera entrega

Plan: `plan.md` de esta carpeta. Spec: `spec.md`.

## Convenciones

- `FRONT` = `/Users/nicolascastro/Desktop/VerYganar-frontend-beta`, rama `spec-010-quality-gates`
  en el commit `53b866c`, igual a `origin/main` (decidido el 2026-10-12: el usuario creó la rama
  en este checkout, no un worktree aparte; `beta-front` ya está en `main`).
- `API` = `/Users/nicolascastro/Desktop/verYganar`.
- `FRONT_PREVIO` = `/Users/nicolascastro/Desktop/VerYganar-frontend` (solo lectura: de ahí se leen
  el `CLAUDE.md` y los agentes previos).
- **Nadie hace git salvo el usuario.** Ninguna tarea `T` incluye `git add`, `commit`, `push`,
  `stash`, `reset`, `checkout` ni abrir un PR. Los pasos `U-n` son del usuario y `M-1` de Miguel.
  Los comandos `git` que aparecen en verificaciones son de lectura.
- Las tareas del front no usan Maven, Flyway ni PMD. Sí aplican el idioma (código en inglés;
  comentarios, documentos y mensajes en español).
- Los comandos del front se corren desde `FRONT`. El build y el lint necesitan estas variables
  públicas ficticias, las mismas del CI:

  ```bash
  export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
    NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
    NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
  ```

- "Debe fallar si" describe la comprobación de que la prueba sirve: el implementer hace ese
  cambio a mano, ve la prueba en rojo y lo deshace editando el archivo (no con git).

## Trazabilidad CA → tareas

| CA | Tareas | Cómo se comprueba |
|----|--------|-------------------|
| CA-1 | T11, T22, U-5, M-1, U-6 | CI con tres checks; `curl` de la protección; PR de prueba bloqueado |
| CA-2 | T7, T8, T11, U-6 | `lintRatchet.test.ts`; ensayo local con un aviso de más; PR de prueba |
| CA-3 | T9, T11, U-6 | `auditGate.test.ts`; PR de prueba |
| CA-4 | T2, T5, T6 | `routeProtection.test.ts` (inventario completo y matriz por rol) |
| CA-8 | T12, T14, T15, T16, T17 | Ensayo de copia limpia siguiendo `CLAUDE.md` |
| CA-12 | T3, T4, T11 | `downloadPolicy.test.ts` y `route.test.ts`, dentro del job `Pruebas` |
| CA-13 | T13, T15 | Conteo de Regla, Fuente, Versión y Excepción; agentes citan `P-n` |
| CA-14 | T18, T19, T20, T21, U-4 | `check-front-impact.sh` y ensayo en sesión nueva |
| CA-15 | T18, T19, T20, U-4 | `check-front-impact.sh` con caso "No" y ensayo |
| CA-16 | T9, T10, T22, U-5 | Excepción escrita; `npm run audit:ci` en verde; CI de `main` en verde |

---

## Bloque 0 · Prerrequisitos

- [x] U-1 · Usuario: crear la rama de trabajo
  - Repo: front
  - Hecho el 2026-10-12: rama `spec-010-quality-gates` en `VerYganar-frontend-beta`, commit `53b866c`, árbol limpio.
  - Verificar: `git -C /Users/nicolascastro/Desktop/VerYganar-frontend-beta branch --show-current` devuelve `spec-010-quality-gates`

- [x] U-2 · Usuario: Puerta 2
  - Aprobado el 2026-10-12 con las recomendaciones del plan; el detalle está en "Decisiones de la Puerta 2" de `spec.md`. D-1 es la opción 1 (excepción escrita también para `postcss`); fecha de revisión de las excepciones, 2026-11-30.

- [x] T1 · Preparar el checkout y medir la línea base
  - Repo: front
  - Archivos: ninguno versionado (solo `node_modules/` y `.next/`)
  - Hacer: `npm ci`; medir avisos de lint, build, tipos y auditoría, y anotar la duración de cada uno en una nota bajo esta tarea.
  - Verificar: `npm ci && npx next lint --max-warnings 360 && npm run build && npx tsc --noEmit` termina con salida 0; `npx next lint --max-warnings 359` termina con salida 1; `npm audit --omit=dev --audit-level=high` termina con salida 1 por `xlsx` y `postcss`
  - Si el conteo no es exactamente 360 o algo falla: parar y reportar al coordinator.
  - Nota: medido el 2026-10-12 en macOS, Node 22.20.0, npm 10.9.3. `npm ci` 22,3 s; `next lint --max-warnings 360` salida 0 con exactamente 360 avisos, 2,8 s; con 359 sale 1; `npm run build` 26,7 s, salida 0; `tsc --noEmit` 2,2 s, salida 0; `npm audit --omit=dev --audit-level=high` salida 1 (3 hallazgos: 2 altos `xlsx` y `postcss`, 1 moderado), 0,8 s.

## Bloque 1 · Pruebas (frente C)

- [x] T2 · Runner de pruebas y prueba mínima del middleware (CA-4)
  - Repo: front
  - Archivos: `package.json` (devDependency `vitest` en versión exacta; script `"test": "vitest run"`), `package-lock.json`, `vitest.config.mts` (entorno `node`, alias `@` a `src`, incluye `__tests__/**/*.test.ts`), `__tests__/middleware/smoke.test.ts`
  - Test primero: `smoke.test.ts` importa el `default` y el `config` de `src/middleware.ts`, llama al middleware con una petición a `/admin` sin sesión y con `MIDDLEWARE=ACTIVE`, y espera una redirección.
  - Verificar: `npm test`; `npx tsc --noEmit`; `npx next lint --max-warnings 360` sigue en salida 0
  - Si la importación falla: aplicar las salidas del plan (sección 5.2) y anotarlo en una nota. Si ninguna funciona, parar y reportar.
  - Nota: `vitest` instalado en 4.1.11 y no en 5.0.4 (la última): 5.0.4 declara `@types/node` `^22 || >=24` y el repo tiene `^20`, y `npm install` falla con ERESOLVE; con 4.1.11 (acepta `^20`) npm 10.9.3 falla con un error interno de arborist (`edgesOut`), así que se instaló con `--legacy-peer-deps` (el lockfile resultante pasa `npm ci` sin banderas; único cambio a una versión existente: `tinyglobby` 0.2.15 → 0.2.17, transitiva). La importación del middleware real funcionó a la primera: no hizo falta ninguna salida de 5.2 ni simular `next-auth/middleware`. La prueba mínima `smoke.test.ts` se borró en T6.

- [x] T3 · Pruebas de la función pura de la política de descargas (CA-12)
  - Repo: front
  - Archivos: `__tests__/proxy/downloadPolicy.test.ts`
  - Test primero: casos de la sección 5.1 del plan (destinos permitidos, destinos internos, esquemas no permitidos, variantes del host, listas mal escritas, constantes de límite). Mínimo los 23 casos que se probaron a mano en la spec 006.
  - Debe fallar si: en `downloadPolicy.ts` se quita la comprobación del protocolo, o se cambia la igualdad exacta del host por `endsWith`.
  - Verificar: `npx vitest run __tests__/proxy/downloadPolicy.test.ts`
  - Nota: 52 casos. Mutaciones: sin comprobación del protocolo, rojo (2 casos: `http` y `ftp`); `endsWith` en vez de igualdad exacta, rojo (2 casos: prefijo y subdominio). Deshechas.

- [x] T4 · Pruebas de los límites del handler de descargas (CA-12)
  - Repo: front
  - Archivos: `__tests__/proxy/route.test.ts`
  - Test primero: handler `GET` con `fetch` y `getToken` simulados. Casos de la sección 5.1 del plan: 400 sin llamar a `fetch`, 401 sin sesión, `redirect: 'error'` y señal de tiempo, tope por `Content-Length`, tope por flujo, tamaño exacto permitido, 504 por tiempo, 502 por red y por estado del origen, cabeceras fijas.
  - Debe fallar si: en `route.ts` se quita `redirect: 'error'`, o se sube `MAX_DOWNLOAD_BYTES`, o se reenvía el `Content-Type` del origen.
  - Verificar: `npx vitest run __tests__/proxy/route.test.ts`
  - Nota: 19 casos. En la prueba el tope es un literal (25 MiB) a propósito, para que subir `MAX_DOWNLOAD_BYTES` la ponga en rojo. Mutaciones: sin `redirect: 'error'`, rojo (1); tope a 50 MiB, rojo (3); reenviar el `Content-Type` del origen, rojo (1). Deshechas.

- [x] T5 · Inventario y clasificación de todas las páginas (CA-4)
  - Repo: front
  - Archivos: `__tests__/middleware/routeInventory.ts` (recorre `src/app/**/page.tsx` y arma las URL), `__tests__/middleware/routeAccess.ts` (tabla: prefijo o ruta exacta → rol, lista de públicas, y el grupo rotulado de H-11), `__tests__/middleware/routeProtection.test.ts` (primera parte)
  - Test primero: toda página del inventario pertenece a exactamente una clase; ninguna entrada de la tabla apunta a una página que no existe.
  - Debe fallar si: se crea un `page.tsx` vacío en `src/app/admin/nueva/` sin tocar la tabla (crearlo, ver el rojo y borrarlo).
  - Verificar: `npx vitest run __tests__/middleware/routeProtection.test.ts`
  - Nota fija: `/commercial/[id]` de `(consumer)` se clasifica como `ROLE_COMMERCIAL` (comportamiento de hoy) con un comentario que remite a D-7. No se corrige aquí.
  - Nota: la mutación `admin/nueva/page.tsx` NO pone la prueba en rojo: la tabla clasifica `/admin` por prefijo, así que la página nueva queda cubierta como `ROLE_ADMIN` (y entra sola a la matriz, que pasó con 508 casos). Una página fuera de todo prefijo (`src/app/zzz/`) sí da rojo ("pertenece a exactamente una clase"). Es una contradicción interna de la tarea (tabla por prefijo vs. rojo ante una página nueva bajo un prefijo); se dejó el comportamiento por prefijo.

- [x] T6 · Matriz de protección rol por rol (CA-4)
  - Repo: front
  - Archivos: `__tests__/middleware/routeProtection.test.ts` (segunda parte), `__tests__/middleware/session.ts` (crea la cookie de sesión con `encode` de `next-auth/jwt` y un secreto ficticio)
  - Test primero: para cada página protegida por las seis identidades, con `MIDDLEWARE=ACTIVE`: el `matcher` la alcanza (`unstable_doesMiddlewareMatch`); sin sesión redirige; rol equivocado redirige a `/unauthorized`; rol correcto pasa. Además: las dos páginas públicas del diseñador pasan sin sesión; `/commercial-onboarding` es pública; barra final; modo apagado deja pasar todo.
  - Debe fallar si: se quita `'/admin/:path*'` del `matcher`; o se cambia `COMPLIANCE_OFFICER` por otro rol en el cuerpo; o se quita la excepción pública del callback `authorized`. Probar las tres, una a una.
  - Verificar: `npm test`; `npx tsc --noEmit`
  - Al terminar: borrar `__tests__/middleware/smoke.test.ts` si quedó cubierto por esta prueba.
  - Nota: 500 casos en `routeProtection.test.ts` (571 con las otras dos pruebas, 3 archivos). Mutaciones: sin `/admin/:path*` en el `matcher`, rojo (15); `COMPLIANCE_OFFICER` por otro rol, rojo (12); sin la excepción pública en `authorized`, rojo (5). Deshechas; `git status -- src` vacío. `smoke.test.ts` borrado. El middleware solo corre si el `matcher` alcanza la URL, así que para páginas públicas o pendientes la prueba usa el resultado "efectivo" (no alcanzada = pasa).

## Bloque 2 · CI como puerta (frente B)

- [x] T7 · Función que decide el tope de avisos (CA-2)
  - Repo: front
  - Archivos: `scripts/lint-ratchet.mjs` (función pura `evaluateLint` exportada y el arranque que corre `next lint --format json --output-file`), `__tests__/scripts/lintRatchet.test.ts`
  - Test primero: errores → falla; avisos por encima del tope → falla; avisos por debajo → falla con el número al que hay que bajar; tope mayor que el de la rama destino → falla; iguales → pasa; archivo ausente en la rama destino → usa 360.
  - Verificar: `npx vitest run __tests__/scripts/lintRatchet.test.ts`
  - Nota: 16 casos en `lintRatchet.test.ts`, vistos en rojo antes (módulo ausente). `evaluateLint` también rechaza un tope ilegible y `summarizeEslintReport` un reporte que no es lista. El tope de la rama destino sale de `LINT_BASE_CAP` (ensayos), o de `git show <ref>:.lint-max-warnings` con ref = `LINT_BASE_REF`, `origin/$GITHUB_BASE_REF` (PR en CI) u `origin/main`. Archivo ausente en esa rama: 360. Rama ausente: en un PR falla (salida 3), en local avisa y usa 360. Salidas: 0 pasa, 1 falla la puerta, 3 no se pudo ejecutar.

- [x] T8 · Tope versionado y script `lint:ci` (CA-2)
  - Repo: front
  - Archivos: `.lint-max-warnings` (valor medido en T1), `package.json` (script `lint:ci`), `.gitignore` (reporte temporal de lint)
  - Verificar: `npm run lint:ci` termina con salida 0
  - Comprobar a mano (y deshacer): agregar una variable sin usar en cualquier archivo de `src/` → `npm run lint:ci` sale con 1; subir `.lint-max-warnings` en uno junto con ese aviso → sigue saliendo con 1 por superar el tope de la rama destino (simular con la variable que el script lea para `baseCap`).
  - Nota: `npm run lint:ci` sale 0 con 360 avisos. Comprobaciones a mano, deshechas: variable sin usar en `downloadPolicy.ts` -> 361 avisos, salida 1; con `.lint-max-warnings` en 361 -> salida 1 (tope mayor que el de la rama destino, también con `LINT_BASE_CAP=360`). `git status -- src` vacío.

- [x] T9 · Función que decide la auditoría con excepciones (CA-3, CA-16)
  - Repo: front
  - Archivos: `scripts/audit-gate.mjs` (función pura `evaluateAudit` y el arranque que corre `npm audit --omit=dev --json`), `__tests__/scripts/auditGate.test.ts`, `__tests__/scripts/fixtures/audit-*.json` (incluye el reporte real de hoy)
  - Test primero: aviso alto sin excepción → falla; crítico sin excepción → falla; moderado → no cuenta; aviso con excepción vigente → pasa; aviso alto nuevo en un paquete que ya tiene otra excepción → falla; excepción vencida → falla; excepción sin motivo o sin fecha → falla; excepción sobrante → avisa y pasa; reporte de error del registro → falla con código y mensaje distintos.
  - Verificar: `npx vitest run __tests__/scripts/auditGate.test.ts`
  - Nota: 25 casos en `auditGate.test.ts` (rojo antes: módulo ausente), con fixtures en `__tests__/scripts/fixtures/` (incluye el reporte real `audit-real-2026-10-12.json`). Salidas: 0 pasa, 1 vulnerabilidades o excepción inválida/vencida, 2 registro inalcanzable (reintenta 3 veces), 3 error interno. La excepción casa por id + paquete; una excepción que vence hoy aún vale.

- [x] T10 · Excepciones escritas y script `audit:ci` (CA-16) — la parte de `postcss` depende de D-1
  - Repo: front
  - Archivos: `security/audit-exceptions.json`, `package.json` (script `audit:ci`)
  - Hacer: excepciones de `xlsx` (GHSA-4r6h-8v6p-xvw6 y GHSA-5pgg-2g8v-p4x9) con el motivo del plan (sección 6.2) y la fecha de D-4. Las de `postcss` (GHSA-6g55-p6wh-862q y GHSA-r28c-9q8g-f849) **solo** si el usuario eligió la opción 1 de D-1.
  - Verificar: `npm run audit:ci` termina con salida 0 y lista las excepciones con su fecha de revisión; `npm audit --omit=dev --audit-level=high` sigue saliendo con 1 (el umbral de npm no se tocó)
  - Si D-1 no es la opción 1: `npm run audit:ci` saldrá con 1 por `postcss`; parar y reportar, no relajar el script.
  - Nota: ids confirmados contra `npm audit --omit=dev --json` real; coinciden con el plan. `reviewBy` 2026-11-30, `approvedBy` Nicolás Castro, `approvedOn` 2026-10-12; las de `postcss` dicen que solo se corrige con Next 16 y que su revisión va atada a esa decisión. `audit:ci` sale 0 y `npm audit --omit=dev --audit-level=high` sigue saliendo 1. A mano, deshechas: `reviewBy` pasado -> salida 1; excepción quitada -> salida 1; registro apuntando a `127.0.0.1:9` -> salida 2 con mensaje distinto.

- [x] T11 · `ci.yml` con tres checks y tiempo límite (CA-1, CA-2, CA-3, CA-12)
  - Repo: front
  - Archivos: `.github/workflows/ci.yml`
  - Hacer: jobs `Lint, tipos y build`, `Pruebas` y `Auditoría de dependencias` según la sección 6.3 del plan; `timeout-minutes: 10` en los tres; quitar `continue-on-error`; traer la rama destino antes de `lint:ci` en los PR; caché de `.next/cache`; actualizar los comentarios que ya no son ciertos.
  - Verificar: `node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); for (const s of ['Lint, tipos y build','Pruebas','Auditoría de dependencias','npm run lint:ci','npm test','npm run audit:ci','timeout-minutes: 10']) if(!y.includes(s)) {console.error('falta: '+s); process.exit(1)}; if (y.includes('continue-on-error')||y.includes('secrets.')) {console.error('sobra continue-on-error o un secreto'); process.exit(1)}"`
  - Comprobar: correr en local, en el mismo orden que cada job, los comandos del workflow. La ejecución real en GitHub es U-5.
  - Nota: tres jobs (`Lint, tipos y build`, `Pruebas`, `Auditoría de dependencias`), `timeout-minutes: 10` en cada uno, sin `continue-on-error` ni secretos; YAML válido (`ruby -ryaml`). Trae la rama destino con `git fetch` solo en PR (la rama va por variable de entorno, no interpolada en el comando). Local, en orden de cada job: `npm ci` 21 s; `lint:ci` 3 s; `build` 32 s; `tsc` 2 s; `npm test` 1 s (5 archivos, 612 casos); `audit:ci` 1 s. (Corregido en la ronda 1, S-2: la nota original decía que en un push a `main` se usaba el respaldo 360; no era así, `actions/checkout` deja `origin/main` en el commit recién subido y el tope se comparaba consigo mismo. Ahora en un push se compara con `github.event.before`; ver "Ronda 1 de revisión".)

## Bloque 3 · Flujo de trabajo y documentos del front (frente A)

- [x] T12 · Dejar de ignorar los agentes y sacar lo nuevo del contexto de Docker (CA-8)
  - Repo: front
  - Archivos: `.gitignore`, `.dockerignore`
  - Verificar: después de T15, `git -C "$FRONT" check-ignore -q .claude/agents/planner.md; echo $?` imprime `1`; `git -C "$FRONT" check-ignore -q .claude/settings.local.json; echo $?` imprime `0`; `grep -c -E '^(specs|docs|__tests__|scripts|security)$' .dockerignore` imprime `5`
  - Nota: `.gitignore` ahora ignora `.claude/*` (el contenido, no la carpeta) y re-incluye `!.claude/agents/`; `.agents`, `.infisical.json` y `.env*` siguen ignorados. `.dockerignore` suma `specs`, `docs`, `__tests__`, `scripts`, `security`, `vitest.config.mts`, `.lint-max-warnings` y `.lint-report.json` (`grep -c` = 5). Resultados: `check-ignore -q .claude/agents/{planner,coordinator,implementer,reviewer}.md` imprime 1 (no ignorados); `.env` imprime 0. **Contradicción con la verificación escrita:** `git check-ignore -q .claude/settings.local.json` imprime **1**, no 0, porque ese archivo ya está **versionado** en git (`git ls-files .claude` lo lista; `check-ignore` no evalúa archivos rastreados). Con `--no-index` sí imprime 0 y apunta a `.gitignore:49 .claude/*`, o sea la regla lo ignoraría si no estuviera rastreado. El archivo es público en GitHub y trae rutas de Windows de otra persona; sacarlo del índice (`git rm --cached`) es un paso de git del usuario, no se hizo.

- [x] T13 · Documento de principios del front (CA-13)
  - Repo: front
  - Archivos: `docs/constitution.md`
  - Hacer: partir de la tabla de la sección 7 del plan. Confirmar cada fuente contra la documentación oficial de la versión instalada (context7, pidiendo la versión de `package.json`) antes de escribirla. Cada regla es un bloque `### P-n · …` con las líneas `- **Regla:**`, `- **Fuente:**`, `- **Versión:**` y `- **Excepción:**`. Lo que no se pueda confirmar se rotula "Regla del equipo" con su origen.
  - Verificar: `f=docs/constitution.md; a=$(grep -c '^### P-' $f); for k in Regla Fuente Versión Excepción; do b=$(grep -c "^- \*\*$k:\*\*" $f); [ "$a" = "$b" ] || { echo "$k: $b de $a"; exit 1; }; done; echo "$a reglas completas"`
  - Comprobar: en el reporte, la lista de fuentes confirmadas y la de reglas que quedaron como "Regla del equipo".
  - Nota: 20 principios (P-1 a P-20), `grep` de verificación: `20 reglas completas`. Fuentes confirmadas con `curl` (HTTP 200 y texto leído) contra la versión instalada; las de Next llevan `/docs/15/` y la propia página dice «version 15». Confirmadas: P-2, P-3, P-4, P-5, P-6, P-7, P-8, P-9, P-10, P-11 (solo el mecanismo `resolver`), P-12, P-13, P-14. Regla del equipo: P-1, P-15, P-16, P-17, P-18, P-19, P-20. Lo que el plan citó de memoria y se corrigió: la guía de autenticación recomienda el middleware en todas las rutas (se escribió como excepción de P-4); `no-img-element` es aviso en 15.5.27 (excepción de P-7); typescript-eslint.io se leyó en la 8.71.2 y está instalada la 8.57.1 (misma serie 8; además se comprobó `'error'` en el `recommended.js` instalado). Se agregaron P-19 y P-20 (RN-1/RN-2 y RN-3/RN-5); no se quitó ninguna regla del plan.

- [x] T14 · Plantilla de spec del front (CA-8)
  - Repo: front
  - Archivos: `specs/_template/spec.md`
  - Hacer: copiar `API/specs/_template/spec.md` y adaptarla (campo "Origen", sección "Contrato con la API", estados de pantalla).
  - Verificar: `grep -c -E '^\- \*\*Origen:\*\*|^## Contrato con la API|^## Criterios de aceptación' specs/_template/spec.md` imprime `3`
  - Nota: Copia de la plantilla de la API con `Origen`, «Pantallas y flujo» con tabla de estados de pantalla, y «Contrato con la API». `grep -c` imprime 3.

- [x] T15 · Agentes del front (CA-8, CA-13)
  - Repo: front
  - Archivos: `.claude/agents/coordinator.md`, `.claude/agents/planner.md`, `.claude/agents/implementer.md`, `.claude/agents/reviewer.md`
  - Hacer: base, los cuatro de `API/.claude/agents/`; insumo, los de `FRONT_PREVIO/.claude/agents/`. Adaptar a la realidad nueva: comandos `npm test`, `npm run lint:ci`, `npm run audit:ci`, `npm run build`, `npx tsc --noEmit`; test primero; numeración propia de specs (sustituye "mismo número y slug"); una ruta protegida nueva actualiza la tabla de `__tests__/middleware/routeAccess.ts`. Cada regla técnica cita su principio como `(P-n)`.
  - Verificar: `for a in coordinator planner implementer reviewer; do f=.claude/agents/$a.md; test -f $f && grep -q "^name: $a$" $f && grep -q 'docs/constitution.md' $f || { echo "mal: $a"; exit 1; }; done; grep -c '(P-[0-9]*)' .claude/agents/implementer.md .claude/agents/reviewer.md; ! grep -rn 'mismo número y slug' .claude/agents/`
  - Comprobar: cada `(P-n)` citado existe en `docs/constitution.md`: `grep -oh '(P-[0-9]*)' .claude/agents/*.md | sort -u | tr -d '()' | while read p; do grep -q "^### $p " docs/constitution.md || echo "no existe $p"; done` no imprime nada.
  - Nota: Cuatro agentes con el frontmatter de los de la API (mismo `name`, `tools` y `model`). Verificación: los 4 existen con `name` y `docs/constitution.md`; `(P-n)` citados: 13 en implementer y 9 en reviewer; `grep 'mismo número y slug'` sin resultados; ningún `P-n` citado (con el `grep` de la tarea ni revisando todos los `P-\d+` de los agentes) deja de existir en la constitución. Sin reglas de Spring, Flyway, PMD ni MapStruct. Los agentes dicen que la aprueba quien trabaje el front, que la numeración es propia (`git ls-tree` de `origin/main` solo para no chocar) y que una ruta protegida nueva toca `matcher`, cuerpo del middleware y `routeAccess.ts`. Desviación menor: la regla de `apiClient` cita `CLAUDE.md` («Capa de API») porque no tiene principio propio.

- [x] T16 · `CLAUDE.md` del front, versionado y en español (CA-8)
  - Repo: front
  - Archivos: `CLAUDE.md`
  - Hacer: contenido de la sección 7 del plan. Insumo: `FRONT_PREVIO/CLAUDE.md`, corrigiendo lo desactualizado. Nombres de variables, nunca valores; sin el identificador del proyecto de Infisical.
  - Verificar: `for s in 'npm ci' 'npm test' 'npm run lint:ci' 'npm run audit:ci' 'npm run build' '@docs/constitution.md' 'claude --agent coordinator' 'MIDDLEWARE' 'PROXY_DOWNLOAD_ALLOWED_HOSTS' 'NEXTAUTH_SECRET'; do grep -q -- "$s" CLAUDE.md || echo "falta: $s"; done` no imprime nada; `! grep -n -i -E 'workspaceId|no CI workflows|currently commented out' CLAUDE.md`
  - Nota: `CLAUDE.md` en español, con `@docs/constitution.md`, tabla de variables (solo nombres), comandos reales, puertas de CI con códigos de salida (lint 0/1/3, auditoría 0/1/2/3), cómo bajar el tope, cómo escribir una excepción, cómo clasificar una ruta nueva, flujo de specs y qué revisar en un PR. Corregido respecto al previo: sí hay CI y pruebas, `/admin` sí está en el `matcher`. Verificaciones de la tarea: sin salida (nada falta, nada prohibido).

- [x] T17 · Ensayo de copia limpia siguiendo `CLAUDE.md` (CA-8)
  - Repo: front (lectura) y una carpeta temporal fuera de los repos
  - Archivos: ninguno
  - Hacer: copiar a una carpeta temporal solo lo que quedaría en un clon (`git -C "$FRONT" ls-files -co --exclude-standard` como lista para `rsync --files-from`; es lectura). En la copia, seguir `CLAUDE.md` al pie de la letra, sin usar nada que no esté escrito ahí.
  - Verificar (en la copia, con las variables ficticias): `npm ci && npm test && npm run lint:ci && npm run build && npx tsc --noEmit`; `test -f CLAUDE.md -a -f docs/constitution.md -a -f specs/_template/spec.md -a -f .claude/agents/coordinator.md`; levantar con `npx next dev` y comprobar `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login` → `200`
  - Comprobar: anotar cada paso en el que hizo falta algo que `CLAUDE.md` no decía y corregir el documento. Borrar la carpeta temporal al terminar.
  - Nota: Copia limpia en la carpeta temporal de la sesión (667 archivos de `git ls-files -co --exclude-standard`, sin `.git` ni `node_modules`), con las variables ficticias. Resultados: `npm ci` 7 s; `npm test` 5 archivos y 612 casos; `lint:ci` 0 errores y 360 avisos (avisa que no hay `origin/main`, usa 360); `build` salida 0; `tsc` salida 0; `audit:ci` salida 0; los 4 archivos existen; `npx next dev` en el puerto 3000 respondió `/login` **200** a la primera. Faltaba en `CLAUDE.md` (ya corregido): (1) decir que hace falta internet también para las fuentes de Google y que el primer `build` tarda más (~2 min frío frente a ~34 s); (2) con `npx next dev --turbopack`, la primera petición de un clon recién construido dio 500 por `next/font/google` («queries have exactly one entry»); no se reprodujo en tres intentos más (en frío y tras un build), así que se documentó como incidencia con salida (reiniciar o usar `npx next dev`); (3) la comprobación del `curl` a `/login`. Servidor terminado (sin procesos de `next` ni puerto 3000 en uso) y carpeta temporal borrada.

## Bloque 4 · RN-9 en el flujo de la API

- [x] T18 · Plantilla de spec de la API con "Impacto en el front" (CA-14, CA-15)
  - Repo: API
  - Archivos: `specs/_template/spec.md`
  - Hacer: sección obligatoria `## Impacto en el front` con `- **Toca al front:** Sí | No`, `- **Motivo o cambios:**` y `- **Spec del front:**`, más los seis criterios de la sección 8.1 del plan como guía.
  - Verificar: `grep -c -E '^## Impacto en el front|^\- \*\*Toca al front:\*\*|^\- \*\*Spec del front:\*\*' specs/_template/spec.md` imprime `3`
  - Nota: sección `## Impacto en el front` insertada antes de «Requisitos no funcionales» (solo líneas agregadas). Tres líneas fijas (`- **Toca al front:** Sí | No`, `- **Motivo o cambios:**`, `- **Spec del front:**`) y los seis criterios de 8.1 como cita (`>`), para que el script no los lea. `grep -c` imprime 3; la plantilla sin llenar hace que el script salga con 1.

- [x] T19 · Script de comprobación del impacto en el front (CA-14, CA-15)
  - Repo: API
  - Archivos: `scripts/check-front-impact.sh`
  - Test primero: preparar en la carpeta temporal de la sesión cinco specs de ejemplo y sus resultados esperados: "No" con motivo → 0; "Sí" con referencia a un `spec.md` existente en borrador → 0; sección ausente → 1; "Sí" sin referencia → 1; "Sí" con `PENDIENTE DE TRASLADAR` → 1. Correr el script antes de escribirlo no aplica: escribir primero los cinco casos y el pequeño lanzador que compara salidas.
  - Verificar: el lanzador reporta 5 de 5; `bash -n scripts/check-front-impact.sh`
  - Nota: compatible con el `bash` 3.2 de macOS y con Git Bash en Windows. No escribe nada.
  - Nota: `scripts/check-front-impact.sh` (ejecutable, solo lectura, bash 3.2). Lanzador en la carpeta temporal con 12 casos (los 5 de la tarea, «No» sin motivo, «Sí» con archivo inexistente y otros 5): primero 0 de 12 (script inexistente, salida 127), después 12 de 12 también con `/bin/bash` 3.2; `bash -n` sin salida. Salidas: 0 correcto; 1 incumple; 2 mal uso (sin argumento o sin `spec.md`). Ruta de «Spec del front»: absoluta tal cual, relativa contra `VERYGANA_FRONT_DIR`; relativa sin variable → 1. Contra `specs/010-frontend-review` y `specs/006-beta-deployment` (sin la sección) sale 1 con «falta la sección».

- [x] T20 · Agentes de la API con el paso de RN-9 (CA-14, CA-15) — requiere D-9
  - Repo: API
  - Archivos: `.claude/agents/coordinator.md`, `.claude/agents/planner.md`, `.claude/agents/implementer.md`, `.claude/agents/reviewer.md`
  - Hacer: lo descrito en las secciones 8.1 a 8.5 y 8.7 del plan. En el coordinator: decisión en la fase 1, resumen del impacto en las dos puertas, escritura de la spec del front en la fase 5, localización del repo, numeración, y el camino alterno si el repo no está. Sin datos reales de usuarios en la spec del front.
  - Verificar: `grep -q 'Impacto en el front' .claude/agents/coordinator.md && grep -q 'VERYGANA_FRONT_DIR' .claude/agents/coordinator.md && grep -q 'front-spec.md' .claude/agents/coordinator.md && grep -q 'Contrato con el front' .claude/agents/planner.md && grep -q 'check-front-impact.sh' .claude/agents/reviewer.md && grep -q 'Contrato con el front' .claude/agents/implementer.md && echo ok`
  - Comprobar: las reglas existentes de los cuatro agentes siguen intactas (comparar con una copia previa hecha en la carpeta temporal: `diff` solo muestra líneas agregadas).
  - Nota: solo líneas agregadas en los cuatro agentes (`diff`: 0 líneas quitadas o cambiadas). Coordinator: paso 3a (fase 1), una línea tras cada puerta, paso 14 en el cierre y sección «Spec del front (RN-9)» (localización, numeración, borrador, referencia, camino alterno). Planner: «Contrato con el front» y bloqueo. Implementer: parar y reportar. Reviewer: sección «Impacto en el front (RN-9)» con el script. La verificación de la tarea imprime `ok`.

- [x] T21 · `CLAUDE.md` de la API: sección de RN-9 (CA-14) — requiere D-9
  - Repo: API
  - Archivos: `CLAUDE.md`
  - Hacer: sección corta "Specs que tocan al front": la regla, la variable `VERYGANA_FRONT_DIR`, el script y qué pasa si el repo del front no está.
  - Verificar: `grep -c -E 'VERYGANA_FRONT_DIR|check-front-impact.sh' CLAUDE.md` imprime al menos `2`
  - Nota: sección «Specs que tocan al front» agregada antes de «Qué revisar en cada PR» (20 líneas agregadas, 0 cambiadas). `grep -c` imprime 2.

- [ ] U-3 · Usuario: configuración local para RN-9
  - Definir `VERYGANA_FRONT_DIR` con la ruta del checkout del front donde deben caer los borradores y dar al coordinator de la API permiso de escritura sobre esa carpeta. Es configuración local: no la hace un agente.
  - Verificar: `test -f "$VERYGANA_FRONT_DIR/specs/_template/spec.md" && grep -q '"name": "rifacel-app-nextjs"' "$VERYGANA_FRONT_DIR/package.json" && echo ok`

- [ ] U-4 · Usuario: ensayo de RN-9 en una sesión nueva (CA-14, CA-15)
  - Por qué es del usuario: los agentes se cargan al iniciar la sesión; la sesión que los editó no los prueba.
  - Paso: en `API`, `claude --agent coordinator`, y pedirle dos ensayos con carpetas de descarte, llevando cada uno solo hasta la spec y el cierre simulado:
    1. `specs/998-rn9-dry-run-index/`: "agregar un índice a una tabla, sin cambiar ningún endpoint".
    2. `specs/999-rn9-dry-run-field/`: "agregar el campo `nickname` a la respuesta de un endpoint que el front ya consume".
  - Verificar caso 1 (CA-15): `bash scripts/check-front-impact.sh specs/998-rn9-dry-run-index; echo $?` imprime `0`; `grep -A2 'Toca al front' specs/998-rn9-dry-run-index/spec.md` muestra "No" con su motivo; `ls "$VERYGANA_FRONT_DIR/specs" | grep -c rn9-dry-run-index` imprime `0`
  - Verificar caso 2 (CA-14): `bash scripts/check-front-impact.sh specs/999-rn9-dry-run-field; echo $?` imprime `0`; `ls -d "$VERYGANA_FRONT_DIR"/specs/*-rn9-dry-run-field` existe; `grep -E '^\- \*\*(Estado|Origen):\*\*' "$VERYGANA_FRONT_DIR"/specs/*-rn9-dry-run-field/spec.md` muestra "Borrador" y la spec 999 de la API
  - Verificar el camino alterno: repetir el caso 2 con `VERYGANA_FRONT_DIR` apuntando a una carpeta que no existe → se crea `specs/999-rn9-dry-run-field/front-spec.md` y el script sale con `1`
  - Al terminar: borrar las cuatro carpetas de ensayo (las dos de la API y las del front).

## Bloque 5 · Cierre

- [x] T22 · Verificación local completa y tiempos (CA-1, CA-16)
  - Nota (coordinator, 2026-10-12): front, todo con salida 0: `npm ci` 21 s, `lint:ci` 3 s (0 errores, 360 avisos), `build` 36 s, `tsc` 2 s, `npm test` 1 s (612 casos), `audit:ci` 1 s. Job más largo ≈ 62 s. `git status --short -- src` vacío.
  - Nota API: `./mvnw compile` y `./mvnw pmd:check` con salida 0. `./mvnw verify` con salida 1: 2479 pruebas, 1 error, `AdRepositoryConcurrencyIntegrationTest.concurrentLikes_lastSlot_neverOversells` (`ConcurrentModificationException`). Es intermitente y ajena a esta spec (no se tocó Java): repetida sola tres veces, pasó 2 y falló 1. Queda reportada al usuario, sin corregir aquí.
  - Repo: front y API
  - Archivos: ninguno
  - Verificar en el front, cronometrando cada comando con `time`: `npm ci`; `npm run lint:ci`; `npm run build`; `npx tsc --noEmit`; `npm test`; `npm run audit:ci`. Todos con salida 0. La suma de los tres primeros más `tsc` (el job más largo) debe quedar muy por debajo de 10 minutos; anotar los tiempos.
  - Verificar que no cambió código de producción: `git -C "$FRONT" status --short -- src` no muestra nada.
  - Verificar en la API (no se tocó código Java; es solo la comprobación de cierre del repo): `export JAVA_HOME=$(/usr/libexec/java_home -v 21) && ./mvnw verify` y `./mvnw compile && ./mvnw pmd:check`. La rama tiene cambios ajenos sin commitear: un fallo se reporta indicando si el archivo pertenece o no a esta spec.

- [x] T23 · Trasladar la spec 010 al repo del front (2026-10-23; sin las tablas de deuda de `review.md`)
  - Repo: front y API
  - Cuándo: con la revisión aprobada (`review.md` en APROBADO).
  - Archivos: crear `FRONT/specs/010-frontend-review/{spec.md,plan.md,tasks.md,review.md}` como copia; en `API/specs/010-frontend-review/spec.md` agregar una primera línea de aviso ("Copia de trabajo trasladada al repo del front el AAAA-MM-DD; no editar aquí"). Aplicar antes lo que el usuario decida en D-5 y D-6.
  - Verificar: `diff -r "$API/specs/010-frontend-review" "$FRONT/specs/010-frontend-review"` solo muestra la línea de aviso

- [ ] U-5 · Usuario: subir las ramas y abrir los PR
  - Pasos del usuario: subir `beta-front` y abrir su PR a `main`; commitear y subir `spec-010-quality-gates` y abrir su PR (o un solo PR con todo). Si el primero se mergea con "squash", rebasar la segunda rama.
  - Verificar: en la pestaña Actions del repo, la corrida del PR muestra los tres checks en verde y cada job dura menos de 10 minutos (anotar la duración). Tras el merge, la corrida de `main` queda en verde (CA-16).
  - Si el conteo de avisos en GitHub difiere del local: ajustar `.lint-max-warnings` al valor de GitHub antes de M-1 y avisar.
  - Bloquea: M-1, U-6 y T24.

- [ ] M-1 · Miguel: proteger `main` del front (CA-1)
  - Responsable: Miguel (administrador del repositorio).
  - Paso: en GitHub, Settings → Branches (o Rulesets), sobre `main`: exigir pull request; exigir los checks `Lint, tipos y build`, `Pruebas` y `Auditoría de dependencias`; no permitir que los administradores se salten la regla. Avisar antes al equipo: las ramas viejas tendrán que traer `main`.
  - Verificar (cualquiera, sin credenciales): `curl -s https://api.github.com/repos/miguelangelvasquez1/VerYGana-frontend/branches/main | grep -E '"protected"|"enforcement_level"|"contexts"' -A4` muestra `"protected": true`, un nivel distinto de `off` y los tres nombres.
  - Si el check de auditoría no puede ser obligatorio por D-1: marcar los otros dos y dejarlo anotado aquí.

- [ ] U-6 · Usuario: PR de prueba que GitHub debe bloquear (CA-1, CA-2, CA-3)
  - Paso del usuario: una rama de descarte con tres commits, uno por caso, y un PR a `main` que **no** se mergea:
    1. un error de tipos en cualquier archivo → falla `Lint, tipos y build`;
    2. una variable sin usar (un aviso de lint más) → falla `Lint, tipos y build` en el paso de lint;
    3. `npm install lodash@4.17.20` (versión con avisos altos conocidos) → falla `Auditoría de dependencias`.
  - Verificar: en cada caso el check correspondiente queda en rojo y el botón de merge aparece bloqueado. Cerrar el PR y borrar la rama.

- [x] T24 · Dejar el puntero en la API y actualizar el estado (2026-10-23)
  - Repo: API
  - Condición: `git -C "$FRONT" ls-files specs/010-frontend-review | wc -l` imprime `4` (la copia del front ya está en git). Si no, no hacer nada y reportarlo.
  - Archivos: `API/specs/010-frontend-review/spec.md` pasa a ser una nota de cinco líneas que apunta a la spec del front (repositorio, ruta, fecha, ticket SCRUM-106); se quitan `plan.md`, `tasks.md` y `review.md` de la carpeta de la API. En la copia del front, el estado de la spec refleja qué criterios quedaron cumplidos y cuáles esperan a M-1 o a D-1.
  - Verificar: `ls "$API/specs/010-frontend-review"` muestra solo `spec.md`; `grep -c 'VerYGana-frontend' "$API/specs/010-frontend-review/spec.md"` imprime al menos `1`

## Ronda 1 de revisión

Hallazgos de `review.md` (ronda 1) y lo que se hizo. Front en `FRONT`, API en `API`.

- [x] B-1 · `FRONT/docs/constitution.md`: P-2 y P-16 con su excepción como deuda conocida (conteos remedidos el 2026-10-12: 60 de 87 `page.tsx` con `'use client'`; token en la query en 4 archivos, más `console.log` del token en `adService.ts` y la URL firmada de `?url=`). Revisadas las demás reglas con "ninguna": P-10, P-15, P-18, P-19 y P-20 tenían deuda y ahora la declaran; P-1, P-3, P-5 y P-6 se comprobaron y siguen en "ninguna". Además P-11 (solo 1 de 33 formularios usa react-hook-form) y P-7 (97 `<img>`) quedaron precisadas. `CLAUDE.md` y los agentes del front aclaran que la deuda declarada no es licencia para código nuevo. Verificación de T13: `20 reglas completas`.
- [x] B-2 · `API/scripts/check-front-impact.sh`: exige una sola sección, ruta `specs/<NNN>-<slug>/spec.md` con NNN numérico, repo con `package.json` `rifacel-app-nextjs`, `Estado` de un solo valor y `Origen` que nombre la carpeta de la spec de la API (arreglos a-e). Variables en inglés (`touches`, `reason`, `inside`). Lanzador con los 12 casos previos y los 9 nuevos: antes 14 de 27 (13 en rojo), después 27 de 27 con `/bin/bash` 3.2. Plantilla, `CLAUDE.md` y coordinator ajustados con el cambio mínimo.
- [x] S-1 · `FRONT/__tests__/middleware/routeInventory.ts`: ve `page.tsx`, `page.ts`, `page.jsx` y `page.js`; nueva `routeInventory.test.ts` que falla si aparece un `route.{ts,js}` que no sea `api/auth` o `api/proxy-download`. Rojo comprobado creando y borrando `src/app/api/zzz/route.ts` y `src/app/zzzpage/page.ts`. Constitución (P-4), `CLAUDE.md` y planner afirman exactamente eso.
- [x] S-2 · `FRONT/scripts/lint-ratchet.mjs` + `ci.yml`: en un push a `main` se compara con `github.event.before` (variable de entorno `LINT_BASE_SHA`, traído con `git fetch` por SHA, sin interpolar en `run:`); si no está disponible, respaldo 360 con aviso. Función pura `resolveBaseSource` con 13 casos nuevos en `lintRatchet.test.ts`. Documentado en `CLAUDE.md`. Nota de T11 corregida arriba.
- [x] S-3 · `lint-ratchet.mjs`: `LINT_BASE_CAP` (y también `LINT_BASE_REF`, mismo hueco) se ignoran con aviso cuando `GITHUB_ACTIONS` está definida.
- [x] S-4 · `FRONT/scripts/audit-gate.mjs`: el mensaje de "sin lockfile" (ENOLOCK) ya no dice "registro inalcanzable" y no reintenta; sale 2 igual. Dos casos nuevos y fixture `audit-no-lockfile.json`. Probado de punta a punta en una carpeta sin lockfile. No se hicieron (b) ni (c), por indicación.
- [x] S-6 · `FRONT/.claude/agents/implementer.md`: las variables ficticias están en "Comandos".
- [x] S-7 · `API/.claude/agents/coordinator.md`: pasos 6 (spec ya existente con ese slug y `Origen`: actualizar o reportar, no duplicar) y 7 (sin permiso de escritura: camino alterno, sin pedir ni cambiar permisos).
- [x] S-8 · `FRONT/docs/constitution.md` (P-10): las URL `/query/v5/` redirigen (308) a `/query/latest/`, sin URL fija por versión; la fuente ahora cita la URL que responde e indica que la versión instalada es la 5.90.21.
- [ ] S-5 y S-9 · sin cambios: S-5 (acciones por SHA) y S-9 (`Si` sin tilde, motivo `No aplica`) no estaban en el encargo de esta ronda.


## Ronda 2 de revisión

Hallazgos de `review.md` (ronda 2). Front en `FRONT`, API en `API`. Sin cambios en `src/` del front.

- [x] B-3 · `FRONT/docs/constitution.md` (P-16): la excepción pasa de tres a cinco cosas. Nuevo (d): el correo o identificador en la query de `/verify` y `/unlock-account` (`RegisterForm.tsx`, `LoginForm.tsx`; los leen `VerificationForm.tsx` y `UnlockAccountForm.tsx`), más el teléfono enmascarado en `sessionStorage`. Nuevo (e), hallado en la búsqueda completa: `session_token` y `user_hash` en `?url=` de `/games/play` y en el iframe de la mascota, y el JWT en el fragmento (`usePetSession.ts`). En (c) se agrega `useImpactStory.ts` (imprime el permiso de subida, con URL firmada) y el riesgo de los `console.error(..., error)` con errores HTTP de axios. El token de `setup-password` queda como caso admitido por la regla (caduca y se invalida al usarse), escrito en la propia Regla. Se listan los casos revisados que no son deuda. `20 reglas completas`.
- [x] N-1 · `routeInventory.ts` ve también `route.tsx` y `route.jsx`; `routeInventory.test.ts` suma los dos casos (rojo con 2 fallos, verde con 10 de 10; con la mutación a `(ts|js)` vuelve a rojo). Alineados constitución (P-4), `CLAUDE.md` y planner.
- [x] N-3 · `lintRatchet.test.ts`: caso "en un PR manda la rama destino aunque exista `LINT_BASE_SHA`"; la mutación que invierte la prioridad lo pone en rojo (1 fallo).
- [x] N-4 (segunda mitad) · `lint-ratchet.mjs`: `GITHUB_ACTIONS` definida aunque vacía, o `CI`, cuentan como CI (dos casos nuevos, rojos antes). Límite conocido en un comentario: `env -u` de ambas variables lo desactiva y se ve en el diff. Respaldo 360 sin tocar. `CLAUDE.md` lo dice.
- [x] N-2 · `check-front-impact.sh`: cada uno de los tres campos una sola vez, y rechaza si la ruta física de la referencia (`cd` y `pwd -P`) cae dentro del repo de la API (dos niveles arriba de la spec). Lanzador con 6 casos nuevos: 28 de 33 antes (5 en rojo), 33 de 33 después con `/bin/bash` 3.2. Cabecera actualizada. Bloques de código y enlaces simbólicos dentro del front no se cerraron, como se pidió.
- [x] N-6 · `API/.claude/agents/coordinator.md` (RN-9): "ya existe una spec con ese slug y Origen" (paso 2) y "sin permiso de escritura" (paso 3) pasan antes de numerar; renumerado solo dentro de la sección; "la cambiaron" pasa a "su `Estado` ya no es `Borrador`".
- [x] N-7 · `FRONT/CLAUDE.md`: la fila de `API_URL` dice dónde cae en `NEXT_PUBLIC_API_URL` y dónde no; "Despliegue" describe lo que hace el `Dockerfile` (`COPY . .`) y remite a la excepción de P-20.
- [x] N-5 · conteos de P-7 y P-10 escritos como aproximados, con el método de medida.
