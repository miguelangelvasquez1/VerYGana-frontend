# Principios del front de verYganar

Principios innegociables del front. Un PR que viole uno no se mergea. Los agentes de
`.claude/agents/` los citan por su id como `(P-n)`: si agregas, renumeras o quitas uno,
actualiza también esas citas.

## Cómo se lee

Cada principio es un bloque `### P-n · …` con cuatro campos:

- `Regla`: lo que se exige.
- `Fuente`: la recomendación oficial de la que sale, con la URL que se comprobó. Si la
  regla no sale de una documentación, dice "Regla del equipo" y su origen.
- `Versión`: la versión instalada (de `package.json` y `node_modules`) a la que aplica.
- `Excepción`: dónde el equipo se aparta de la recomendación y por qué, o "ninguna".

Las URL de Next.js llevan `/docs/15/` a propósito: son las páginas de la versión 15, la
instalada. Las comprobó una persona el 2026-10-12 (la página existe y dice lo que la regla
afirma). Al subir de versión mayor de una tecnología hay que volver a comprobar sus fuentes.

---

### P-1 · Stack cerrado

- **Regla:** el stack es Next.js 15.5 con App Router, React 19.1, TypeScript 5.9 con `strict`,
  Tailwind 4 y next-auth 4.24. Una dependencia nueva se justifica en el PR y no puede duplicar
  una existente.
- **Fuente:** Regla del equipo. Es el equivalente a la constitución de la API (principio 1,
  `docs/constitution.md` de ese repo) y a RN-1 de la spec 010.
- **Versión:** `next` 15.5.27, `react` 19.1.0, `typescript` 5.9.3 (`"strict": true` en
  `tsconfig.json`), `tailwindcss` 4.2.1, `next-auth` 4.24.15.
- **Excepción:** ninguna.

### P-2 · Componentes de servidor por defecto

- **Regla:** páginas y layouts son componentes de servidor. `'use client'` va solo en el
  componente interactivo que lo necesita (estado, efectos, eventos, APIs del navegador), no en
  una página o un layout enteros.
- **Fuente:** documentación de Next.js 15, "Server and Client Components":
  <https://nextjs.org/docs/15/app/getting-started/server-and-client-components>. Dice que por
  defecto los layouts y las páginas son componentes de servidor, enumera cuándo usar uno de
  cliente, y en "Reducing JS bundle size" pide agregar `'use client'` a componentes interactivos
  concretos en vez de marcar partes grandes de la interfaz.
- **Versión:** `next` 15.5.27, `react` 19.1.0.
- **Excepción:** deuda conocida: 60 de las 87 `page.tsx` de `src/app` empiezan por `'use client'`
  (medido el 2026-10-12; los 8 `layout.tsx` son de servidor). Esas páginas cargan sus datos y
  su estado en el cliente (ver también P-10), así que pasarlas a servidor exige rehacer cómo
  piden los datos, no solo quitar la directiva. Se acepta por ahora porque la beta ya funciona
  así y moverlas sin pruebas de componentes (CA-6, otra spec) es más riesgoso que dejarlas. El
  código nuevo sí cumple: una página nueva es de servidor y delega lo interactivo en un
  componente de cliente. Queda atada a una spec futura de deuda de calidad (frente E de la spec
  010), que decide el orden de la migración; no se corrige en la primera entrega.

### P-3 · Ningún secreto en `NEXT_PUBLIC_*`

- **Regla:** una variable con prefijo `NEXT_PUBLIC_` termina escrita en el JavaScript que
  recibe el navegador, así que nunca lleva un secreto. Los secretos (`NEXTAUTH_SECRET`) son
  variables de servidor sin ese prefijo y no se pasan como `ARG` al construir la imagen.
- **Fuente:** documentación de Next.js 15, "Environment Variables":
  <https://nextjs.org/docs/15/app/guides/environment-variables>. Dice que las variables sin
  `NEXT_PUBLIC_` solo existen en Node.js, que las que llevan el prefijo se incrustan en el
  JavaScript del navegador en tiempo de `next build`, y que tras el build la aplicación ya no
  responde a cambios en esos valores.
- **Versión:** `next` 15.5.27.
- **Excepción:** ninguna.

### P-4 · El `matcher` del middleware es una lista literal y toda ruta con rol está en ella

- **Regla:** el `matcher` de `src/middleware.ts` es un arreglo literal de cadenas. Una ruta
  nueva que exige un rol entra en el `matcher`, en la lógica por rol del cuerpo del middleware
  y en la tabla de `__tests__/middleware/routeAccess.ts`; la prueba `routeProtection.test.ts`
  falla si una página (`page.tsx`, `page.ts`, `page.jsx` o `page.js` bajo `src/app`) queda sin
  clasificar. Los route handlers (`route.tsx`, `route.ts`, `route.jsx` o `route.js`) no entran en esa tabla: la prueba
  `routeInventory.test.ts` falla si aparece uno que no esté en su lista de conocidos (hoy
  `api/auth` y `api/proxy-download`), para obligar a decidir cómo se protege; no comprueba
  por sí sola que el handler nuevo exija rol.
- **Fuente:** documentación de Next.js 15, "middleware.js", apartado "Matcher":
  <https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware>. Dice que los
  valores del `matcher` deben ser constantes para poder analizarse de forma estática al
  compilar, y que los valores dinámicos (variables) se ignoran.
- **Versión:** `next` 15.5.27 y `next-auth` 4.24.15 (`withAuth`).
- **Excepción:** la guía de autenticación de Next recomienda que, para autenticación, el
  middleware corra en todas las rutas
  (<https://nextjs.org/docs/15/app/guides/authentication>). Aquí el `matcher` lista solo las
  rutas protegidas porque el front mezcla páginas públicas y por rol, y el middleware solo actúa
  con `MIDDLEWARE=ACTIVE`. Consecuencia conocida: las páginas de consumidor que no están en el
  `matcher` no tienen protección de middleware; están rotuladas `UNPROTECTED_PENDING` en
  `routeAccess.ts` a la espera de la decisión D-7 de la spec 010.

### P-5 · El middleware no es la única defensa

- **Regla:** el middleware es una comprobación inicial. Los datos los autoriza la API: el front
  nunca da por seguro que una pantalla oculta equivale a un dato protegido.
- **Fuente:** documentación de Next.js 15, guía "Authentication":
  <https://nextjs.org/docs/15/app/guides/authentication>. Dice que el middleware sirve para
  comprobaciones iniciales pero no debe ser la única línea de defensa, y que la mayoría de las
  comprobaciones de seguridad deben hacerse lo más cerca posible de los datos.
- **Versión:** `next` 15.5.27.
- **Excepción:** ninguna.

### P-6 · `params` y `searchParams` son asíncronos

- **Regla:** en páginas y layouts, `params` y `searchParams` son promesas: se leen con
  `await` (o con `use` en componentes de cliente), no de forma síncrona.
- **Fuente:** documentación de Next.js 15, referencia de `page`
  (<https://nextjs.org/docs/15/app/api-reference/file-conventions/page>) y de `layout`
  (<https://nextjs.org/docs/15/app/api-reference/file-conventions/layout>). Ambas tipan
  `params` como `Promise<…>`, piden `async/await` o `use`, y avisan de que el acceso síncrono
  que se conserva por compatibilidad dejará de existir.
- **Versión:** `next` 15.5.27.
- **Excepción:** ninguna.

### P-7 · Imágenes con `next/image` y enlaces internos con `next/link`

- **Regla:** no se usa `<img>` ni `<a>` para ir a una página interna. Las imágenes remotas
  vienen de un host declarado en `images.remotePatterns` de `next.config.ts`.
- **Fuente:** documentación de Next.js 15, "ESLint" (lista de reglas de `eslint-config-next`):
  <https://nextjs.org/docs/15/app/api-reference/config/eslint>. `@next/next/no-img-element`
  ("Prevent usage of `<img>` element due to slower LCP and higher bandwidth") y
  `@next/next/no-html-link-for-pages` ("Prevent usage of `<a>` elements to navigate to
  internal Next.js pages").
- **Versión:** `next` 15.5.27 y `eslint-config-next` 15.5.27.
- **Excepción:** en `eslint-config-next` 15.5.27 `no-img-element` es un aviso, no un error, así
  que los `<img>` existentes (unas 100 líneas con `<img` en `src`: `grep -rn '<img' src`, medido el 2026-10-12) cuentan dentro
  del tope de avisos (P-19) en vez de bloquear.

### P-8 · ESLint 9 en configuración plana con las bases de Next

- **Regla:** el lint se configura en `eslint.config.mjs` (formato plano) extendiendo
  `next/core-web-vitals` y `next/typescript`. Los errores de lint nunca se toleran.
- **Fuente:** documentación de Next.js 15, "ESLint":
  <https://nextjs.org/docs/15/app/api-reference/config/eslint>. Muestra exactamente esa
  configuración (`FlatCompat` con `extends: ['next/core-web-vitals', 'next/typescript']`).
- **Versión:** `eslint` 9.39.4 y `eslint-config-next` 15.5.27.
- **Excepción:** el comando `npm run lint` y el script `lint:ci` siguen usando `next lint`
  aunque en Next 15.5 está en desuso y desaparece en Next 16 (anuncio de la versión:
  <https://nextjs.org/blog/next-15-5>, apartado "next lint Deprecation"; el propio
  `npx next lint --help` de la versión instalada lo avisa). Migrar el linter al CLI de ESLint
  va atado a la decisión de pasar a Next 16 (frente D de la spec 010), no se hace aquí.

### P-9 · Sin `any`

- **Regla:** no se agregan `any` nuevos; se usa un tipo real o `unknown` con su comprobación.
- **Fuente:** documentación de typescript-eslint, regla `no-explicit-any`:
  <https://typescript-eslint.io/rules/no-explicit-any>. La describe como "escape hatch"
  peligroso del sistema de tipos y la incluye en la configuración `recommended`, que
  `next/typescript` extiende. En la versión instalada también se comprobó en
  `node_modules/@typescript-eslint/eslint-plugin/dist/configs/eslintrc/recommended.js`, donde
  la regla es `'error'`.
- **Versión:** `@typescript-eslint/eslint-plugin` 8.57.1 instalado; la página de la regla es
  de la serie 8 (se consultó con la 8.71.2).
- **Excepción:** `eslint.config.mjs` baja la regla a aviso (`"warn"`) por deuda: unos 190 usos
  heredados que se pagan por partes. Un `any` nuevo cuenta como aviso nuevo y el CI lo rechaza
  porque el tope de avisos solo baja (P-19).

### P-10 · Datos del servidor en el cliente con TanStack Query

- **Regla:** los datos del backend en componentes de cliente se piden con TanStack Query desde
  hooks en `src/hooks/**`. Cada `queryKey` describe de forma única los datos que trae, y cada
  mutación invalida las claves que deja desactualizadas.
- **Fuente:** documentación de TanStack Query v5, "Query Keys"
  (<https://tanstack.com/query/latest/docs/framework/react/guides/query-keys>: la clave debe ser
  serializable y única para los datos de la consulta) y "Invalidations from Mutations"
  (<https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations>:
  invalidar con `invalidateQueries` en el `onSuccess` de la mutación). Las URL con `/query/v5/`
  redirigen (308) a `/latest/`, y no hay una URL fija por versión: la página vigente es la que
  responde, y la versión instalada es la 5 (5.90.21). Al salir la v6 hay que volver a comprobar
  que la página sigue diciendo lo mismo.
- **Versión:** `@tanstack/react-query` 5.90.21.
- **Excepción:** deuda conocida: unos 140 de unos 300 archivos de cliente de `src/app` y
  `src/components` llaman a `src/services` o a `apiClient` directamente, con `useEffect` y
  estado local; solo unos 22 archivos de `src/hooks` y unos 10 componentes usan TanStack Query
  (conteos aproximados, según el método: archivos con `'use client'` bajo `src/app` y `src/components`
  que importan de `src/services`, `src/lib/api` o `apiClient`, y archivos con `useQuery`,
  `useMutation` o `useInfiniteQuery`; medido el 2026-10-12). Se acepta por ahora porque esas pantallas funcionan así desde antes de
  que existiera la regla y migrarlas sin pruebas de componentes (CA-6) es riesgoso. El código
  nuevo sí cumple: un dato del backend en el cliente se pide con un hook de `src/hooks/**`. Queda
  atada a la spec futura de deuda de calidad (frente E de la spec 010), junto con P-2.

### P-11 · Formularios con react-hook-form y un esquema zod

- **Regla:** los formularios usan react-hook-form y declaran su validación en un esquema zod
  conectado con la opción `resolver` (`@hookform/resolvers`). Un formulario que envía algo
  evita el doble envío.
- **Fuente:** documentación de react-hook-form, `useForm`:
  <https://react-hook-form.com/docs/useform>. La opción `resolver` "integrates with your
  preferred schema validation library".
- **Versión:** `react-hook-form` 7.71.2, `@hookform/resolvers` 5.2.2, `zod` 4.3.6.
- **Excepción:** la documentación de react-hook-form no recomienda una librería de esquemas
  concreta; elegir zod es decisión del equipo (P-1). El evitar el doble envío es regla del
  equipo, no de la documentación. Deuda conocida: de los 33 archivos con `<form`, solo 1 usa
  react-hook-form con `zodResolver`; los otros 32 manejan el estado y la validación a mano
  (medido el 2026-10-12). Se acepta por ahora porque funcionan y migrarlos sin pruebas de
  componentes (CA-6) es riesgoso; el código nuevo sí cumple. Queda atada a la spec futura de
  deuda de calidad (frente E de la spec 010).

### P-12 · Sesión con next-auth v4

- **Regla:** la sesión se maneja con next-auth v4 (`withAuth` en el middleware, `getToken` y
  `getSession` según el contexto). El mismo secreto se usa en la configuración de NextAuth y en
  el middleware, y viene de `NEXTAUTH_SECRET`, una variable de servidor (P-3).
- **Fuente:** documentación de next-auth v4, "Next.js" (apartado "Middleware", "Prerequisites"):
  <https://next-auth.js.org/configuration/nextjs>. Dice que hay que usar el mismo secreto en el
  middleware y en NextAuth y que lo más simple es la variable `NEXTAUTH_SECRET`. Su significado
  está en <https://next-auth.js.org/configuration/options>.
- **Versión:** `next-auth` 4.24.15.
- **Excepción:** el front decodifica el JWT que emite la API sin verificar su firma; los datos
  los protege la API (P-5). Es deuda conocida del frente D de la spec 010 y no se corrige en la
  primera entrega.

### P-13 · Pruebas con Vitest

- **Regla:** las pruebas viven en `__tests__/` y corren con Vitest en entorno `node`. El
  middleware real se prueba sin refactorizarlo, con las utilidades de pruebas de Next. Las
  pruebas no tocan la red ni usan secretos reales.
- **Fuente:** documentación de Next.js 15, "Setting up Vitest with Next.js":
  <https://nextjs.org/docs/15/app/guides/testing/vitest> (usa `vitest.config.mts` y la carpeta
  `__tests__`, y avisa de que Vitest no soporta aún los componentes de servidor asíncronos).
  Para el middleware, "middleware.js", apartado "Unit testing (experimental)":
  <https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware>. Para el comando
  `vitest run` (una sola pasada, sin modo de vigilancia): <https://v4.vitest.dev/guide/cli>.
- **Versión:** `vitest` 4.1.11 (exige Node 20, 22 o 24 o superior; ver `engines`), `next`
  15.5.27.
- **Excepción:** (a) de la guía de Vitest de Next solo se instaló `vitest`; no se instalan
  `@vitejs/plugin-react`, `jsdom`, `@testing-library/*` ni `vite-tsconfig-paths` porque estas
  pruebas son de lógica sin interfaz en entorno `node` y el alias `@` se declara en tres líneas
  de `vitest.config.mts`. Entran con las pruebas de componentes, en su propia spec. (b)
  `unstable_doesMiddlewareMatch` es una API experimental de Next
  (`next/experimental/testing/server`) y puede cambiar sin aviso; es la única forma de
  comprobar el `matcher` real y, si cambia, se arregla la prueba, no el middleware. (c) El
  script es `"test": "vitest run"` y no `vitest` como en la guía: el CI no puede quedarse en
  modo de vigilancia.

### P-14 · Instalación reproducible y auditoría de producción

- **Regla:** en CI y en la imagen se instala con `npm ci` y el `package-lock.json`. La
  auditoría de dependencias de producción (`--omit=dev`) bloquea los avisos altos y críticos.
  Un aviso solo se tolera si tiene una excepción escrita en `security/audit-exceptions.json`
  con motivo, aprobador y fecha de revisión; una excepción vencida hace fallar el CI.
- **Fuente:** documentación de npm 10, `npm ci`:
  <https://docs.npmjs.com/cli/v10/commands/npm-ci> (pensado para entornos automatizados, falla
  si el lockfile no coincide con `package.json`, nunca lo reescribe) y `npm audit`:
  <https://docs.npmjs.com/cli/v10/commands/npm-audit> (sale con código distinto de cero si hay
  vulnerabilidades, y en CI conviene `--audit-level` para fijar el umbral).
- **Versión:** npm 10.9.3 (el local; el CI usa el npm que trae Node 22, de la serie 10); la
  documentación consultada es la de la serie 10.
- **Excepción:** `xlsx` (sin corrección publicada en npm) y el `postcss` anidado en Next
  (solo se corrige pasando a Next 16) tienen excepciones escritas con revisión el 2026-11-30.
  Para poder escribirlas por aviso sin bajar el umbral del resto, la puerta es el script propio
  `scripts/audit-gate.mjs`, que no sustituye a `npm audit` sino que decide sobre su informe.

### P-15 · Toda llamada saliente del servidor lleva tiempo límite

- **Regla:** cualquier `fetch` u otra llamada que el servidor del front hace hacia afuera
  (por ejemplo `/api/proxy-download`) lleva tiempo límite (`AbortSignal.timeout`) y distingue
  "el destino respondió que no" de "no se pudo hablar con él" (en la ruta de descargas: 502
  frente a 504), sin colapsarlos en un solo `catch`.
- **Fuente:** Regla del equipo. Sale de la sección "Dependencias externas" del `CLAUDE.md` de
  la API y se aplica aquí por igual.
- **Versión:** Node 22 (`AbortSignal.timeout` es de Node estándar), `next` 15.5.27.
- **Excepción:** deuda conocida: la página de servidor
  `src/app/(consumer)/raffles/[id]/live/page.tsx` hace un `fetch` a la API sin tiempo límite y
  sin mirar `res.ok` antes de leer el JSON, así que una API caída o lenta deja colgada la
  página o la rompe con un error poco claro (medido el 2026-10-12: es la única llamada saliente
  de servidor, aparte de `/api/proxy-download`, que sí cumple y tiene pruebas). Se acepta por
  ahora porque la regla es posterior a esa página y no es parte de la primera entrega. El código
  nuevo sí cumple. Queda atada a la spec futura de deuda de calidad (frente E de la spec 010).
  Las llamadas del navegador (`apiClient` tiene 30 s; los `fetch` sueltos de `src/services` no)
  quedan fuera de esta regla, que habla del servidor.

### P-16 · Datos personales y tokens nunca en logs, errores ni URLs

- **Regla:** cédula, correo, teléfono, dirección, datos bancarios y tokens de acceso o de sesión
  no aparecen en `console.*`, en mensajes de error, en URLs ni en `localStorage`. Los secretos
  viven solo en Infisical (nunca en el repositorio ni en la imagen). Caso admitido por la regla,
  no deuda: el token de un solo uso que la API manda en un enlace de correo
  (`src/app/game-designer/setup-password/page.tsx` lo lee de `?token=`); caduca y deja de servir
  al usarse, y el enlace de correo no tiene otra forma de llegar al navegador. Lo que la regla
  prohíbe es un token de acceso o de sesión, que sigue valiendo después de leerse.
- **Fuente:** Regla del equipo. Es el principio 5 de la constitución de la API y RN-3 de la spec
  010.
- **Versión:** aplica a todo el código del front.
- **Excepción:** deuda conocida, cinco cosas (medido el 2026-10-12, con una búsqueda en `src` de
  `email`, `identifier`, `phone`, `document`, `cedula`, `token`, `code`, `otp`, `password`,
  `router.push`, `window.location`, `URLSearchParams`, plantillas con `?` y todo `console.`):
  (a) el middleware escribe ruta y rol en el log de cada petición (frente E de la spec 010); no
  incluye datos personales, pero hay que quitarlo. (b) El JWT de acceso viaja en la query de una
  URL en cuatro sitios: `src/lib/api/client.ts` (URL de imágenes privadas),
  `src/hooks/useAuthenticatedAssetSrc.ts` (lo mismo para un `<img>`),
  `src/lib/notifications/notificationStream.ts` (el `EventSource` de las notificaciones, que no
  admite cabeceras) y `src/components/Admin/products/ProductsManagement.tsx` (imágenes de
  producto). Además, `src/components/game-designer/tabs/ResourcesTab.tsx` manda a
  `/api/proxy-download` en `?url=` una URL de descarga temporal ya firmada (el handler solo
  registra el host). (c) `src/services/adService.ts` escribe el token en `console.log`
  (`orphanAssetKeepAlive`); `src/hooks/useImpactStory.ts` imprime la respuesta del permiso de
  subida, que trae una URL firmada; y `src` tiene 123 líneas con `console.` (`grep -rn
  'console\.' src`) cuyo argumento es casi siempre el objeto de error capturado, que en un
  error HTTP de `apiClient` (axios) puede arrastrar la configuración de la petición, con su
  cabecera de autorización y su cuerpo. No se revisó cada una. (d) El correo, o el
  identificador de inicio de sesión (que puede ser el correo), viaja en la query al navegar:
  `src/components/auth/RegisterForm.tsx` y `src/components/auth/LoginForm.tsx` escriben
  `/verify?email=` y `/unlock-account?identifier=`, y los leen
  `src/components/auth/VerificationForm.tsx` y `src/components/auth/UnlockAccountForm.tsx`.
  `RegisterForm.tsx` navega con `window.location.href`, así que la URL llega también al servidor
  del front y a lo que haya delante. Además, `RegisterForm.tsx` guarda en `sessionStorage` el
  teléfono enmascarado (solo los últimos dígitos) para `VerificationForm.tsx`. (e) Credenciales
  de partida: la URL de juego que devuelve la API trae `session_token` y `user_hash` en la
  query y el front la pone en `?url=` de `/games/play` (`src/app/(consumer)/games/page.tsx` y
  `src/app/(consumer)/games/play/page.tsx`); `src/hooks/pet/usePetSession.ts` arma la URL del
  iframe de la mascota con esos dos en la query y el JWT de acceso (`bearer_token`) en el
  fragmento `#`, que no viaja al servidor. Se acepta
  (b) por ahora porque esos recursos y el stream se autentican hoy solo con `?token=` y
  cambiarlo exige un cambio coordinado de API y front (cookie o ticket de un solo uso). Se
  acepta (d) y (e) por ahora porque el flujo de verificación, el desbloqueo y los juegos se
  construyeron así y cambiarlos exige también a la API (pasar el correo por estado del
  servidor o una cookie, y un ticket de partida en lugar de las credenciales en la URL). (c)
  no tiene justificación: se quita en cuanto alguien toque ese archivo. El código nuevo sí
  cumple: ningún dato personal ni token de acceso o de sesión en una URL ni en un log. Queda
  atada al frente D de la spec 010 (deuda de seguridad) para (b), (d) y (e) y al frente E
  (deuda de calidad) para (a) y (c). Revisado y que no son caso: el código de referido
  (`?ref=` en `RegisterForm.tsx` y `ReferralShareButtons.tsx`) y el identificador de
  transacción de `src/app/plans/checkout/page.tsx` no son datos personales; el parámetro
  `from` del middleware lleva solo la ruta; `ScenePreviewModal.tsx` usa valores literales de
  vista previa; las referencias de pago en `sessionStorage` no son credenciales.

### P-17 · Todo bug arreglado trae la prueba que falla sin el arreglo

- **Regla:** un PR que arregla un bug incluye la prueba que lo habría atrapado. Si la prueba
  pasa igual con el bug reintroducido, no sirve. Quien escribe una prueba nueva la ve fallar
  antes de que pase.
- **Fuente:** Regla del equipo. Es el principio 4 de la constitución de la API y RN-6 de la spec
  010.
- **Versión:** `vitest` 4.1.11.
- **Excepción:** mientras no existan pruebas de componentes (CA-6, otra spec), un bug de
  interfaz que no se pueda probar en entorno `node` se documenta en el PR con cómo se comprobó
  a mano.

### P-18 · Idioma

- **Regla:** código (clases, funciones, variables, rutas, nombres de archivo) en inglés;
  comentarios, commits, documentación y textos para el usuario final en español.
- **Fuente:** Regla del equipo. Es el principio 6 de la constitución de la API y RN-7 de la spec
  010.
- **Versión:** aplica a todo el repositorio.
- **Excepción:** deuda menor (medido el 2026-10-12): la ruta pública `/terminos`
  (`src/app/terminos/page.tsx`, enlazada desde el login y el registro) está en español, y hay
  identificadores sueltos como `fecha` (`PetStoreMetrics.tsx`) y `dia`/`valor` (`reportUi.tsx`).
  Unas 78 líneas de comentario `//` en 32 archivos están en inglés (recuento aproximado por
  palabras clave). Renombrar la ruta rompe enlaces ya publicados y exige una redirección, por eso
  no se hace ahora. El código nuevo sí cumple. Queda atada a la spec futura de deuda de calidad
  (frente E de la spec 010).

### P-19 · Un cambio no llega a `main` si falla una puerta de CI

- **Regla:** el CI tiene tres checks que deben pasar: `Lint, tipos y build`, `Pruebas` y
  `Auditoría de dependencias`. El tope de avisos de lint (`.lint-max-warnings`) solo baja: un
  PR que agrega avisos falla, y uno que corrige avisos sin bajar el tope también falla.
- **Fuente:** Regla del equipo (RN-1 y RN-2 de la spec 010; D-10).
- **Versión:** `eslint` 9.39.4, `next` 15.5.27 (`next lint`), Node 22.
- **Excepción:** temporal: mientras Miguel no active la protección de `main` (tarea M-1 de la
  spec 010) los tres checks avisan pero no impiden el merge ni un push directo. Es el cierre de
  la primera entrega de la spec 010, no deuda del código.

### P-20 · Lo que se despliega sale de un commit de `main`, sin secretos dentro

- **Regla:** la imagen se construye con el `Dockerfile` desde un commit de `main`. Solo recibe
  variables públicas (`NEXT_PUBLIC_*`) como argumentos de build; los secretos y las variables
  de ejecución (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `API_URL`, `MIDDLEWARE`,
  `PROXY_DOWNLOAD_ALLOWED_HOSTS`) entran solo al arrancar el contenedor.
- **Fuente:** Regla del equipo (RN-3 y RN-5 de la spec 010), coherente con P-3.
- **Versión:** `next` 15.5.27 con `output: 'standalone'`.
- **Excepción:** deuda conocida: el `Dockerfile` cumple lo de los secretos (solo `ARG`
  `NEXT_PUBLIC_*`), pero nada construye ni publica la imagen de forma automática, y su
  `COPY . .` toma lo que haya en la carpeta: hoy "desde un commit de `main`" depende de quien
  construye, no de un procedimiento (medido el 2026-10-12: `ci.yml` es el único workflow). Se
  acepta por ahora porque la construcción automatizada es el frente G de la spec 010, que no
  entra en la primera entrega. El código nuevo sí cumple. Queda atada al frente G.
