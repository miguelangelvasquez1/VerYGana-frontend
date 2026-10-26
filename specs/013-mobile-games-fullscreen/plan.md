# 013 · Plan: mascota a pantalla completa, Juegos en la barra del celular y "Me gusta" de `/ads`

- **Spec:** `spec.md` de esta carpeta (Puerta 1 aprobada el 2026-10-24). No hay spec de la API: no
  cambia ningún endpoint.
- **Sigue a:** `specs/012-consumer-mobile-responsive/` (implementada). Reemplaza su D-7 y su riesgo
  R-8 ("en `/pet` horizontal se mantienen las barras").
- **Fecha del plan:** 2026-10-24. Lecturas hechas sobre `beta-front` en `2674a0e`.
- **Tareas:** `tasks.md` de esta carpeta.
- **Cambio después de la ronda 3 (2026-10-24):** la mascota girada en vertical se planifica en la sección 19
  (tareas T14-T19). Las secciones 1-18 describen lo ya implementado y aprobado; donde la 19 contradice
  algo de ellas (8.1 "al volver a vertical… barras de vuelta y aviso", la CA-2 de 9.2, la fila de CA-2 de
  la tabla 15), manda la 19.

## 1. Resumen

En un celular en horizontal, `/pet` y `/games/play` pasan a pantalla completa: se ocultan las dos
barras de la app **solo con CSS** (una variante de Tailwind `immersive` que combina orientación,
puntero táctil, ancho < 1024 px y una marca `data-immersive` que pone la propia página), así que el
árbol de React no cambia al girar y el iframe de Unity no se desmonta (RN-2). La barra inferior cambia
Rifas por Juegos y Rifas pasa al menú de Perfil. En `/ads` se arregla que el botón "Me gusta" del
final del anuncio no se alcanza, con una prueba de navegador que falla antes del arreglo (P-17) y una
API simulada que ahora sirve un video y una imagen mínimos desde loopback (P-13).

## 2. Lo que se encontró al leer el código (2026-10-24)

### 2.1 Barras y layout

- `src/app/(consumer)/layout.tsx` (servidor): `div.flex.flex-col.h-dvh` > `<Navbar />` + `<main
  class="flex-1 … pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">`. Solo el layout de
  consumidor monta `NavBar` (`grep` de `bars/NavBar`: un único uso).
- `src/components/bars/NavBar.tsx` (cliente): barra superior del celular en la línea 453
  (`div.lg:hidden.sticky.top-0.z-50`, sin landmark ni atributo propio), barra inferior en la 624
  (`nav.lg:hidden.fixed.bottom-0.z-50`, `grid-cols-6 h-16`: seis `Link`/`button` copiados a mano, activo
  por `pathname === "/x"` exacto) y hoja del menú de Perfil en la 691 (`div.lg:hidden.fixed.inset-0.z-60`).
  `mobileMenuItems` (línea 52) no tiene Rifas. La clase `pb-safe` de la barra inferior **no existe** en
  Tailwind 4 ni en `globals.css` (no hace nada; no se toca, ver R-9).
- No hay `export const viewport` en `src/app/layout.tsx`: el sitio no usa `viewport-fit=cover`, así que
  en iPhone `env(safe-area-inset-*)` vale 0 y Safari ya deja la página dentro del área segura (bandas a
  los lados de la muesca en horizontal). RN-7 dice que el viewport no cambia: ver D-3.

### 2.2 `/pet`

- `src/app/(consumer)/pet/page.tsx` es de servidor: `<section class="h-full w-full p-0 sm:p-4 lg:p-6">
  <PetGame/>`. A 740 px de ancho aplica `sm:p-4`.
- `src/components/PetGame.tsx` (cliente) tiene tres estados con el mismo marco (`h-full w-full …
  sm:rounded-2xl sm:border`): cargando, error (con "Reintentar" de 44 px, centrado) y juego (iframe +
  `RotateHint`). `RotateHint` ya decide todo en CSS (`landscape:hidden pointer-fine:hidden`) para no
  provocar renders que toquen el iframe. `usePetSession` no escucha `resize` ni `orientationchange`
  (comprobado con `grep`): girar no dispara nada en React.

### 2.3 `/games/play`

- `'use client'` (deuda P-2/P-10, no se migra). Calcula `gameHeight` en JS restando la barra superior
  (medida por `main.getBoundingClientRect().top`) y 64 px de la inferior si `innerWidth < 1024`, y lo pone
  como **estilo en línea** `height`. En vertical en celular cambia de rama (`shouldRotate`): un contenedor
  `fixed inset-0 z-[60]` con el iframe girado −90°, que ya tapa las barras. Esa rama distinta **recrea el
  iframe al girar** (hoy; ver D-7).
- En horizontal en celular, "Volver" es `fixed bottom-[calc(5rem+…)] left-4 z-50`, encima de la barra
  inferior.
- El juego puede abrir el carrito (`PRODUCT_CLICKED` → `openCart()`): `CartDrawer` usa `z-40` (fondo) y
  `z-50` (cajón). La capa a pantalla completa tiene que quedar **por debajo** de eso.

### 2.4 `/ads`: diagnóstico del bug de "Me gusta" (a confirmar por la prueba, T9)

Archivos: `src/app/(consumer)/ads/page.tsx` y `src/components/consumer/ads/VideoAdPlayer.tsx`.

1. **La página es más alta que la pantalla.** La raíz de la página mide `h-[calc(100dvh-69px)]` (69 px
   fijos de barra superior), dentro de un `main` que ya reserva `4rem` abajo, y su `<main>` interno
   reserva otra vez `pb-16`. Documento ≈ 69 + (100dvh − 69) + 64 = 100dvh + 64 px. Además
   `VideoAdPlayer` pone `overflow: hidden` a `html` y `body` mientras está montado y su contenedor lleva
   `touch-none`: los 64 px de abajo quedan detrás de la barra inferior y no se puede desplazar.
2. **El medio no se ajusta al espacio real.** El video mide `h-[calc(80dvh-1rem)]` y la imagen
   `max-h-[calc(80dvh-1rem)]`: a 360 px de alto son 272 px, y el espacio útil en horizontal es
   ≈ 360 − 69 − 64 = 227 px (menos si se reserva dos veces). El marco negro (`overflow-hidden`) se sale
   de su contenedor, que lo recorta.
3. **El aviso vive dentro del marco del medio.** "¡Anuncio completado!" es `absolute inset-0 z-20` del
   marco del video. Con un video 9:16 en horizontal el marco mide ≈ 153 px de ancho y la tarjeta
   (`mx-4 px-8`, título `text-xl`, botón `px-8 py-4 text-lg`) no cabe: se recorta.
4. **Capas encima del botón.** Los controles del celular ("Visitar", "Compartir": `absolute right-3
   top-1/2 z-30`, botones de 48 px) están por encima del aviso (`z-20`), a media altura, justo donde
   cae la tarjeta. Y el bloque de información del anuncio (`absolute bottom-0 z-20`) va **después** del
   aviso en el DOM con el mismo `z-20`, así que se pinta encima de la parte baja del aviso.

Los puntos 1 a 4 se confirman o descartan con la prueba de T9 antes de tocar el código: T9 anota en
`tasks.md` qué aserción falla en cada uno de los cuatro casos (video/imagen × vertical/horizontal).

### 2.5 Por qué `/ads` agotaba la espera en la 012

`e2e/fixtures/api/ads/next.json` tiene `contentUrl: "/ads/ad1.mp4"`: el navegador lo pide al front
(`public/ads/ad1.mp4`, 3,3 MB, H.264). El Chromium de Playwright no trae códecs propietarios (H.264), así
que el video no llega a reproducirse y la red no queda quieta (aviso de `settle` en la revisión de la
012). Para llegar al estado "anuncio terminado" hace falta un medio que Chromium reproduzca (WebM VP8) y
que termine rápido, servido desde loopback.

## 3. Mecanismo de pantalla completa (D-1)

### 3.1 Propuesta: variante `immersive` en CSS con `:has()`

En `src/app/globals.css` se declara una variante de Tailwind 4 (sin dependencias, `@custom-variant` es
de Tailwind 4):

```css
/* Pantalla completa del juego en celular horizontal (spec 013). Solo CSS: girar no provoca ningún
   render de React y el iframe del juego no se desmonta (RN-2). La activa una página que marca un
   elemento con `data-immersive`. */
@custom-variant immersive {
  @media (orientation: landscape) and (pointer: coarse) and (width < 64rem) {
    :where(body:has([data-immersive])) & {
      @slot;
    }
  }
}
```

- **"Celular"** es el criterio de la 012: ancho < 1024 px (`64rem`, el mismo corte que `lg:`, donde se
  ven las barras del celular) y puntero táctil. Una ventana angosta de escritorio (puntero fino) no
  entra.
- **Quién lo activa:** la página. `/pet` (servidor) pone `data-immersive` en su `<section>`;
  `/games/play` en el contenedor del juego (solo en la rama horizontal; la vertical ya es `fixed inset-0`).
  Al salir de la página el elemento desaparece y el `:has()` deja de casar: las barras vuelven sin código.
- **Qué hace en cada sitio** (clases `immersive:*`):

| Archivo | Elemento | Clases |
|---------|----------|--------|
| `NavBar.tsx` | barra superior del celular, barra inferior, hoja del menú de Perfil | `immersive:hidden` |
| `(consumer)/layout.tsx` | `<main>` | `immersive:pb-0` (no reservar el alto de una barra que no se ve) |
| `pet/page.tsx` | `<section data-immersive>` | `immersive:fixed immersive:inset-0 immersive:z-30 immersive:p-0` |
| `PetGame.tsx` | marco común | `immersive:rounded-none immersive:border-0 immersive:shadow-none` |
| `pet/page.tsx` | enlace "Salir" (nuevo) | `hidden immersive:flex` + posición en el área segura |
| `games/play/page.tsx` | contenedor del juego (rama horizontal) | `immersive:fixed immersive:inset-0 immersive:z-30` y alto sin estilo en línea (ver 3.3) |
| `games/play/page.tsx` | "Volver" del celular | en `immersive`, arriba a la izquierda, dentro del área segura |

- **`z-30`** a propósito: por encima del contenido, por debajo del `CartDrawer` (`z-40`/`z-50`), del
  `XpRewardToast` y del `Toaster`. Las barras no necesitan quedar tapadas porque están en `display: none`.

### 3.2 Por qué así y no de otra forma

- **Sin estado de React por orientación.** Con `matchMedia` en un estado, cada giro re-renderiza el árbol
  que contiene el iframe; es exactamente lo que `RotateHint` evita hoy. Con CSS, el DOM es idéntico en
  vertical y en horizontal: solo cambia el estilo calculado. RN-2 se cumple por construcción y CA-3 lo
  comprueba.
- **La página declara lo que necesita.** El layout de consumidor es de servidor y no conoce la ruta;
  pasarlo a cliente para leer `usePathname` rompería P-2. Poner la lista de rutas a pantalla completa en
  `NavBar` (que sí tiene `pathname`) acopla la barra con las páginas y obliga a tocarla para cada juego
  nuevo. Con `data-immersive`, `/pet` sigue siendo de servidor (P-2) y la barra no sabe qué páginas son.
- **Alternativa descartada (b):** que `NavBar` calcule `immersive = pathname === '/pet' ||
  pathname.startsWith('/games/play')` y añada clases `landscape:` + `pointer-coarse:`. Funciona, pero el
  `main` del layout y la propia página necesitan saberlo también (el relleno inferior, el `fixed`), y
  terminaría repetido en tres sitios.
- **Soporte de `:has()`:** Chrome/Android ≥ 105 y Safari/iOS ≥ 15.4. En un navegador más viejo la
  variante no casa y la página se ve **como hoy** (barras puestas, sin "Salir"): degrada sin romper
  (R-1).

### 3.3 `/games/play`: el alto en línea

Un `style={{ height }}` en línea gana a cualquier clase, así que `immersive:inset-0` no bastaría. El
alto calculado pasa a una variable CSS (`style={{ '--game-h': … } as React.CSSProperties}`) y el
contenedor usa `h-(--game-h)`; en `immersive` se anula con `immersive:h-auto` + `inset-0`. El cálculo
en JS no cambia (sigue sirviendo a la ventana angosta de escritorio y a la tableta), y deja de importar
en horizontal en el celular, que es lo que pide la spec ("deja de hacerlo en horizontal").

## 4. Archivos

### 4.1 Crear

| Ruta | Qué es |
|------|--------|
| `src/components/bars/mobileNav.ts` | Datos y lógica pura de la navegación del celular: `MOBILE_BAR_ITEMS` (Inicio, Anuncios, Juegos, Mascota, Productos, con `href`, etiqueta e ícono), `MOBILE_MENU_ITEMS` (el `mobileMenuItems` de hoy más Rifas) e `isMobileBarItemActive(pathname, item)`. Sin JSX. |
| `__tests__/ui/mobileNav.test.ts` | Orden de la barra, Juegos → `/games`, activo en `/games` y `/games/play` y no en `/gamesx`, Rifas en el menú y Juegos se queda. |
| `e2e/navbar.spec.ts` | CA-6, CA-7 y CA-8 en el DOM a 360 px. |
| `e2e/games-play.spec.ts` | CA-11 (horizontal y vertical). |
| `e2e/ads.spec.ts` | CA-12: video e imagen, vertical y horizontal. |
| `e2e/fixtures/media/ad-9x16-1s.webm`, `ad-9x16-10s.webm`, `ad-16x9.png` | Medios mínimos ficticios (color sólido, sin audio, unos KB cada uno; D-6), hechos con `ffmpeg` (comando en la cabecera de `e2e/ads.spec.ts`). |
| `e2e/fixtures/api/ads/next-video-short.json`, `next-image.json`, `like.json` | Anuncio de video de 1 s, anuncio de imagen con `durationSeconds: 1`, y respuesta de `POST /adLike/like` (`{ "liked": true, "rewardAmount": 5 }`, tipo `AdLikedResponse`). |

### 4.2 Modificar

| Ruta | Qué cambia |
|------|------------|
| `src/app/globals.css` | Variante `immersive` (3.1). |
| `src/components/bars/NavBar.tsx` | Barra inferior desde `MOBILE_BAR_ITEMS` (mismo marcado y clases que hoy; Juegos en el lugar de Rifas, ícono `Gamepad2` como en escritorio y en el menú), `aria-label="Navegación inferior"` en su `<nav>`, `aria-current="page"` en el activo; menú desde `MOBILE_MENU_ITEMS`; `data-app-bar="top"`/`"bottom"` y `immersive:hidden` en las dos barras y en la hoja del menú. La barra de escritorio no cambia. Se quitan los imports que queden sin uso (`Gift` sigue en `navItems` de escritorio). |
| `src/app/(consumer)/layout.tsx` | `immersive:pb-0` en `<main>`. Sigue de servidor. |
| `src/app/(consumer)/pet/page.tsx` | `data-immersive` y clases `immersive:*` en la `<section>`; enlace "Salir" (`next/link` a `/home`, `aria-label` no hace falta porque el texto es visible; ícono `aria-hidden`). Sigue de servidor (P-2). Comentario de la cabecera actualizado. |
| `src/components/PetGame.tsx` | Clases `immersive:*` en el marco común. Sin estado nuevo. |
| `src/app/(consumer)/games/play/page.tsx` | `data-immersive` en el contenedor de la rama horizontal; alto por variable CSS (3.3); "Volver" del celular reubicado en `immersive`. La rama vertical no cambia. |
| `src/app/(consumer)/ads/page.tsx` | Alto de la raíz sin los 69 px fijos en celular (`h-full`, que llena el `main` del layout ya descontada la barra inferior); sin el `pb-16` duplicado. Lo de `lg:` se queda igual. |
| `src/components/consumer/ads/VideoAdPlayer.tsx` | Arreglo según lo que confirme T9 (ver 8.3). |
| `e2e/support/mockRoutes.mjs` | `POST /adLike/like`; ruta `GET /media/<archivo>` que sirve bytes de `e2e/fixtures/media` (solo `.webm`, `.png`), con su `Content-Type` y sin salirse de la carpeta. |
| `e2e/support/mockApi.mjs` | Lectura binaria (`Buffer`) para lo que devuelva la ruta `/media`. |
| `__tests__/e2e-support/mockApi.test.ts` | Casos de `/media` y de `POST /adLike/like` (test primero). |
| `e2e/fixtures/api/ads/next.json` | Solo si se aprueba D-4: `contentUrl` → `http://127.0.0.1:4010/media/ad-9x16-10s.webm`. |
| `e2e/pet.spec.ts` | Se reescribe la parte horizontal (CA-1, CA-3, CA-4) y se agregan CA-5 y la ventana angosta de escritorio. Las pruebas en vertical de la 012 se quedan (CA-2) con una aserción más (barras visibles). El comentario de D-7 de la 012 se reemplaza. |
| `e2e/rn4.spec.ts` | `PROFILE_MENU_LINKS` suma `['Rifas', '/raffles']` (prueba D-13 de la 012). |
| `specs/013-mobile-games-fullscreen/spec.md` | Al final, sección "Resultados de la pasada en celulares" para CA-10 (la llena el usuario). |

No se toca `src/middleware.ts`, `__tests__/middleware/*`, `next.config.ts`, `package.json`, servicios,
hooks ni tipos, ni nada de `src/app/{admin,commercial,compliance,game-designer}` o
`src/components/{Admin,commercial,compliance,game-designer}`.

## 5. Rutas y acceso

- **Ninguna ruta nueva** ni route handler. `matcher`, cuerpo del middleware y `routeAccess.ts` no
  cambian; `routeProtection.test.ts` y `routeInventory.test.ts` siguen en verde sin tocarlos (P-4).
- `/pet` sigue siendo de servidor; "Salir" es un `Link` (sirve en servidor, P-7). `PetGame` ya es de
  cliente. No se agrega `'use client'` a ninguna página ni layout (P-2). `/games/play` ya es de cliente
  (deuda conocida), y no se migra.
- Sin `params` nuevos (P-6). `/games/play` sigue leyendo `?url=` con `useSearchParams` (deuda (e) de
  P-16, sin cambios).
- P-5 no cambia: ocultar barras no cambia qué datos se piden ni quién los autoriza.

## 6. Contrato con la API

Sin cambios ni dependencias de la API. Se consumen los mismos endpoints de hoy:

| Endpoint | Dónde | Notas |
|----------|-------|-------|
| `POST /pet/session/init` | `usePetSession` | Igual; los estados cargando/error ya existen. |
| `GET /adLike/next` | `useAdFlow` | Igual. |
| `POST /adLike/like` (`{ sessionUUID, adId }` → `AdLikedResponse`) | `adService.likeAd` | Igual; CA-12 comprueba que el toque lo llama. Errores: los de `mapAdFlowError`, sin cambios. |
| `GET /api/levels/me`, `/api/levels/me/history` | `levelService` tras el "me gusta" | Ya están en la API simulada. |

## 7. Datos y estado

- Sin servicios, hooks, `queryKey` ni mutaciones nuevas (P-10 no se ve afectado). La invalidación de
  `['consumer','initialData']` tras el "me gusta" sigue en `useAdFlow`.
- Sin estado nuevo de React para la orientación (3.2). `NavBar` cambia de marcado copiado a un `map`
  sobre `MOBILE_BAR_ITEMS`: el resultado en el DOM es el mismo (mismas clases), con `aria-current` y
  `aria-label` de más.
- **Activo de Juegos con subrutas:** `isMobileBarItemActive` marca `/games` y `/games/…` (CA-7). Los
  demás elementos conservan la comparación exacta de hoy, para no cambiar lo que la spec no pide
  (`/products/1` sigue sin marcar Productos, como hoy).

## 8. UI

### 8.1 `/pet` en celular horizontal

- Marco a pantalla completa: `fixed inset-0`, sin relleno, sin borde ni esquinas redondeadas; el
  fondo `#231f20` del build llena todo.
- **"Salir"**: `Link` a `/home` con ícono (`ArrowLeft` de `lucide-react`, ya instalado) y texto
  "Salir", `min-h-11 min-w-11`, `bg-black/50` + `backdrop-blur-sm`, texto blanco, `rounded-full`,
  `active:bg-black/70`, `focus-visible:ring`. Posición: arriba a la izquierda,
  `top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))]`
  (con `viewport-fit` sin cambiar, `env()` vale 0 y queda a 12 px; si algún día se activa `cover`,
  respeta la muesca). `z` por encima del marco (`immersive:z-[31]`). En vertical y en escritorio,
  `hidden`.
- No tapa el centro del juego ni "Reintentar" (centrado en el marco): CA-4 comprueba que las cajas no
  se cruzan.
- Al volver a vertical la variante deja de casar: barras de vuelta y aviso "Gira tu teléfono" encima del
  iframe, que sigue montado.

### 8.2 `/games/play` en celular horizontal

- Contenedor del juego `fixed inset-0` sin barras; "Volver" (mismo texto, ícono y 44 px de alto que
  hoy) arriba a la izquierda en el área segura, en lugar de encima de la barra inferior. En vertical y
  en escritorio, igual que hoy.

### 8.3 `/ads`: arreglo del botón "Me gusta"

Lo decide la prueba de T9; el arreglo previsto para cada causa de 2.4:

1. Alto: la raíz de la página llena el `main` (`h-full`) en celular, sin restar 69 px a mano y sin el
   `pb-16` interno. El relleno de la barra inferior lo pone el layout, una sola vez.
2. Medio: en celular, el video y la imagen se limitan al alto de su contenedor (`max-h-full`) en vez de
   `80dvh`; en `lg:` se conservan los valores de hoy.
3. Aviso: "¡Anuncio completado!" pasa a cubrir el contenedor del reproductor (el `div` con
   `containerRef`, que ya es `relative` y ocupa todo el espacio disponible), no solo el marco del medio,
   así que la tarjeta tiene el ancho de la pantalla aunque el video sea 9:16. En alturas cortas
   (horizontal) la tarjeta se compacta con una variante de alto (`[@media(max-height:30rem)]:`): menos
   relleno y el ícono de corazón más chico. Textos sin cambios.
4. Capas: el aviso queda por encima del bloque de información y de los controles; mientras se ve, los
   controles del celular ("Visitar", "Compartir") no se pintan, para que nada quede encima del botón ni
   reciba su toque.

El flujo de "me gusta" y la recompensa no cambian (fuera de alcance). `touch-none` se queda: con la
página del alto de la pantalla no hace falta desplazarse. El doble envío ya está cubierto
(`disabled={isLiking}` y la guarda de `handleLike`).

### 8.4 Barra inferior y menú

- Seis celdas de `grid-cols-6 h-16` (60 × 64 px a 360 px): Inicio, Anuncios, **Juegos**, Mascota,
  Productos, Perfil. Juegos con el mismo ícono `Gamepad2` de la barra de escritorio y del menú.
- Menú de Perfil: Rifas (`Gift`, el ícono de Rifas en escritorio) después de "Juegos"; el resto igual.

### 8.5 Estados, accesibilidad y textos

- Estados de la tabla de la spec: en horizontal, cargando y error de `/pet` también a pantalla completa
  con "Salir" (el enlace está en la página, fuera de `PetGame`, así que no depende del estado).
- "Salir" y "Volver": nombre accesible por su texto visible; contraste blanco sobre negro al 50 %
  encima del fondo oscuro del juego.
- Textos nuevos, en español: "Salir". Nada más cambia.
- Sin formularios nuevos (P-11 no aplica).

## 9. Pruebas

### 9.1 Vitest (lógica)

- `__tests__/ui/mobileNav.test.ts` (T1): la lista y la regla del activo.
- `__tests__/e2e-support/mockApi.test.ts` (T8): ruta `/media` (bytes, `Content-Type`, nombre fuera de la
  carpeta → 404 y queda en el registro de pedidos sin fixture, extensión no permitida → 404) y `POST
  /adLike/like`. La prueba existente de "cada fixture de `ROUTES` existe" cubre `like.json`.

### 9.2 Playwright (navegador)

Todas en el proyecto `mobile-360` (`isMobile`, `hasTouch`, `pointer: coarse` comprobado por la prueba
R-3 de `pet.spec.ts`), con `test.use({ viewport })` para la orientación y `page.setViewportSize` para
girar dentro de una prueba.

- **`e2e/pet.spec.ts`**
  - CA-2 (vertical, se queda la de la 012): más `[data-app-bar="top"]` y `[data-app-bar="bottom"]`
    visibles y "Salir" oculto.
  - CA-1 (740 × 360): barras ocultas (`toBeHidden`), la caja del marco del iframe es
    `{0, 0, clientWidth, clientHeight}` (±1 px) y ni el documento ni el marco tienen scroll.
  - CA-3: en horizontal, se marca el elemento iframe (`data-e2e-mark`) y su ventana
    (`frame.evaluate` deja una variable global); se cuentan los pedidos a `/pet-game-stub`. Se gira a
    vertical (barras visibles, aviso visible) y de nuevo a horizontal (barras ocultas). Al final: el
    atributo sigue, la variable de la ventana sigue (no se recargó) y hubo un solo pedido al juego.
  - CA-4: en horizontal, para cargando (`POST /pet/session/init` retenido), error (500) y juego:
    "Salir" visible, ≥ 44 × 44, dentro del viewport, `elementFromPoint` de su centro es el enlace; al
    tocarlo, URL `/home`. En error, las cajas de "Salir" y "Reintentar" no se cruzan.
  - CA-5: `test.use({ viewport: 1280 × 800, isMobile: false, hasTouch: false })`: barra de escritorio
    visible, barras del celular ocultas, iframe visible dentro de `main` (no `fixed`), "Salir" oculto.
  - Ventana angosta de escritorio (900 × 500, sin táctil): barras del celular visibles, "Salir" oculto
    (el criterio de "celular" de la spec).
- **`e2e/games-play.spec.ts`** (CA-11): con la URL de `e2e/support/pages.ts`. Horizontal: barras
  ocultas, la caja del iframe ocupa el viewport, sin scroll, "Volver" visible, ≥ 44 × 44, al tocarlo
  `/games`. Vertical: el contenedor girado `fixed` sigue y "Volver" sigue visible y de 44 px (igual que
  hoy).
- **`e2e/navbar.spec.ts`** (CA-6, CA-7, CA-8): en `/home`, `/games`, `/ads` y `/pet` (vertical), la
  barra `nav[aria-label="Navegación inferior"]` tiene, en orden, los nombres Inicio, Anuncios, Juegos,
  Mascota, Productos y Perfil, cada uno ≥ 44 × 44; Juegos tiene `href="/games"` y al tocarlo lleva a
  `/games`. En `/games`, Juegos tiene `aria-current="page"` y Rifas no está en la barra. Con el menú de
  Perfil abierto, Rifas es visible y lleva a `/raffles`.
- **`e2e/ads.spec.ts`** (CA-12), cuatro casos (video/imagen × 360 × 740 / 740 × 360):
  1. `page.route('**/adLike/next', …)` responde `next-video-short.json` o `next-image.json` (leídos con
     una ruta relativa al archivo de la prueba, no con `process.cwd()`, como pidió la revisión de la 012).
     El video y la imagen vienen de `http://127.0.0.1:4010/media/…` (la API simulada; loopback, P-13).
  2. `test.use({ launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } })` en el
     archivo. Antes de esperar el final, el caso de video comprueba que el `<video>` no está en pausa;
     si no arrancó, falla diciendo que es la política de reproducción automática (R-3), no el bug.
  3. Espera al botón "Me gusta" (tope de 10 s; video de 1 s, imagen de 1 s + 300 ms).
  4. Mide: caja del botón completa dentro de `[0, clientWidth] × [0, clientHeight]` y con su borde
     inferior por encima del borde superior de la barra inferior; `document.elementFromPoint` en su
     centro, `closest('button')`, es el propio botón; `scrollHeight ≤ clientHeight` del documento.
  5. `locator.tap()` (Playwright además comprueba que ningún otro elemento intercepta el toque) y
     `page.waitForRequest` de `POST …/adLike/like`.
  6. Con el código de hoy debe fallar (P-17): como mínimo la del alto del documento en los cuatro
     casos; T9 anota qué más falla en cada uno.
- **Capturas de escritorio** (`desktop-1280`, solo local): no se regeneran. Se corren al final y
  deben pasar sin diferencias (CA-9). Ninguna de las diez páginas capturadas usa `/pet`, `/games/play`
  ni `/ads`, y lo que cambia de `NavBar` está bajo `lg:hidden`.

### 9.3 Tiempo del job "Pruebas en navegador"

Se suman unas 25 pruebas; las de `/ads` esperan 1-2 s cada una. Con 2 workers el job debería seguir
bajo 10 min (la 012 midió unos 6-8). T12 mide la corrida completa y lo anota.

## 10. Configuración

- Variables de entorno nuevas: **ninguna**. `NEXT_PUBLIC_*`, `CLAUDE.md` y `next.config.ts` no cambian.
- `images.remotePatterns`: sin hosts nuevos (los medios de `/ads` se pintan con `<img>`/`<video>` como
  hoy, no con `next/image`).
- Sin cambios en `.github/workflows/ci.yml`: `--autoplay-policy` va en la prueba, no en el CI.

## 11. Dependencias

Ninguna nueva (P-1). `ffmpeg` se usa una sola vez en la máquina de quien implementa para generar los
tres medios de `e2e/fixtures/media`; no entra al repo ni al CI (D-6).

## 12. Seguridad y PII

- Ningún dato personal ni token nuevo en URL, `localStorage` ni `console.*` (P-16). "Salir" no lleva
  parámetros. Los fixtures son ficticios (`example.test`, UUID de ceros).
- El iframe de la mascota y el `?url=` de `/games/play` siguen con su URL actual (deuda (e) de P-16, la
  spec lo dice explícitamente).
- `VideoAdPlayer.tsx` tiene hoy `console.log('Guardar:', currentAd)` (imprime el anuncio entero,
  `sessionUUID` incluido) y `console.log('Link copiado:', …)`. No están en la lista de deuda de P-16;
  como la tarea toca el archivo, se propone quitarlos (D-5).
- Tokens: no se toca el flujo de auth (P-12).

## 13. Llamadas salientes del servidor

El plan no agrega rutas en `src/app/api` ni `fetch` de servidor (P-15 no aplica). La API simulada es
herramienta de pruebas.

## 14. Efectos colaterales

- **Otras pantallas:** `NavBar` y el layout de consumidor se ven en todas las páginas de `(consumer)`;
  la variante `immersive` solo casa donde hay `data-immersive`, así que en las demás nada cambia (en
  horizontal en el celular siguen las barras, como hoy).
- **Rifas** sale de la barra inferior: se llega desde el menú de Perfil y desde los enlaces de `/home`
  (RN-6). En `/raffles` ya no hay un elemento activo en la barra inferior.
- **Carrito y avisos sobre el juego:** el `CartDrawer` que abre `/games/play` y los avisos (`Toaster`,
  `XpRewardToast`) quedan por encima de la capa a pantalla completa (`z-30`).
- **Menú de Perfil abierto al girar:** la hoja lleva `immersive:hidden`, así que no queda flotando sobre
  el juego; su estado `openMenu` no cambia (al volver a vertical sigue abierta, como hoy).
- **Unity:** al ocultar las barras el iframe cambia de tamaño en el mismo momento del giro; el build ya
  se reajusta con `resize`/`orientationchange` (comentario de `RotateHint`). No hay recarga.
- **Tiempo real:** STOMP y SSE no cambian.
- **Una validación que falla antes de la API:** no aplica; no hay validaciones nuevas.

## 15. Trazabilidad

| CA | Tareas | Cómo se verifica |
|----|--------|------------------|
| CA-1 | T4, T5, T6 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-1"` |
| CA-2 | T4, T6 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "vertical"` |
| CA-3 | T4, T5, T6 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-3"` |
| CA-4 | T4, T6 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-4"` |
| CA-5 | T4, T6, T12 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-5"` y capturas `desktop-1280` sin diferencias |
| CA-6 | T1, T2, T3 | `npx vitest run __tests__/ui/mobileNav.test.ts` y `npx playwright test e2e/navbar.spec.ts -g "CA-6"` |
| CA-7 | T1, T2, T3 | `npx vitest run __tests__/ui/mobileNav.test.ts` y `npx playwright test e2e/navbar.spec.ts -g "CA-7"` |
| CA-8 | T1, T2, T3 | `npx playwright test e2e/navbar.spec.ts -g "CA-8"` y `e2e/rn4.spec.ts -g "D-13"` |
| CA-9 | T12, T13 | `npm run test:e2e` completo, `npx playwright test --project=desktop-1280` sin diferencias, `npm test`, `npm run lint:ci` (tope ≤ 348), `npm run build`, `npx tsc --noEmit`, `npm run audit:ci` |
| CA-10 | T11, U-1 | Tabla "Resultados de la pasada en celulares" de `spec.md` llena en los dos celulares |
| CA-11 | T4, T5, T7 | `npx playwright test e2e/games-play.spec.ts --project=mobile-360` |
| CA-12 | T8, T9, T10 | `npx playwright test e2e/ads.spec.ts --project=mobile-360` (roja antes de T10, verde después) |

## 16. Riesgos

- **R-1 · `:has()` en equipos viejos** (iOS < 15.4, Chrome < 105): la variante no casa y la página se
  ve como hoy, con barras. Degrada sin romper; los dos celulares de CA-10 son actuales.
- **R-2 · La barra de direcciones de Safari/Chrome sigue a la vista** en horizontal (la Fullscreen API
  está fuera de alcance). `fixed inset-0` llena lo que el navegador deja; el juego gana los ~128 px de
  las barras de la app, no los del navegador.
- **R-3 · Reproducción automática en Chromium sin interfaz:** si el video no arranca, CA-12 no llega al
  final. Se pasa `--autoplay-policy=no-user-gesture-required` en la prueba y la prueba lo comprueba
  primero con un mensaje claro. El medio no tiene pista de audio.
- **R-4 · Pedidos de rango del `<video>`:** Chromium pide `Range: bytes=0-`; la API simulada responde
  200 con el archivo entero (unos KB). Si Chromium no lo acepta, T8 agrega `206` con `Content-Range`;
  sigue siendo loopback y sin dependencias.
- **R-5 · El diagnóstico de `/ads` puede no ser el real o estar incompleto.** La prueba manda: T9 anota
  qué falla en cada caso y T10 arregla lo que la prueba muestre. Si el usuario ve otra cosa en su
  teléfono (por ejemplo, el toque no responde por otra causa), CA-10 lo detecta.
- **R-6 · Tamaño del binario:** tres medios de unos KB. Si alguno pasa de 50 KB, se baja la resolución.
- **R-7 · Esquina de "Salir":** si la interfaz del build de Unity pone un botón arriba a la izquierda,
  "Salir" lo taparía. No se puede ver en las pruebas (el juego es una página de relleno); se revisa en
  CA-10 (D-2).
- **R-8 · Capturas de escritorio:** dependen del sistema operativo (hoy `-darwin.png`): se corren en la
  misma máquina que las generó. No se regeneran en esta spec.
- **R-9 · `pb-safe`** de la barra inferior no existe en Tailwind 4 (no hace nada). Ya era así y no
  cambia con esta spec; se anota para la de deuda.
- **R-10 · `/games/play` recarga el juego al girar** (hoy, por sus dos ramas). No es RN-2 (que es de la
  mascota), pero CA-10 dice "el giro sin recarga" junto a `/games/play`: ver D-7.

## 17. Decisiones para el usuario (Puerta 2)

| Id | Decisión | Recomendación |
|----|----------|---------------|
| D-1 | Mecanismo para ocultar las barras: **(a)** variante CSS `immersive` con `:has([data-immersive])` + orientación + puntero + ancho (sección 3), o **(b)** `NavBar` decide por `pathname` y el layout/página repiten la condición. | **(a).** Cero renders al girar (RN-2 por construcción), `/pet` sigue de servidor (P-2) y la barra no sabe qué páginas son a pantalla completa. |
| D-2 | Esquina de "Salir" (`/pet`) y "Volver" (`/games/play`) en horizontal. | **Arriba a la izquierda**, las dos iguales, dentro del área segura. Se confirma en CA-10 con el juego real (R-7); moverla es cambiar dos clases. |
| D-3 | ¿Activar `viewport-fit=cover` para ir de borde a borde en iPhone? | **No.** Cambia el viewport de todo el sitio (RN-7 lo prohíbe) y obligaría a revisar todas las páginas. Sin él, Safari ya deja la página dentro del área segura; los botones usan `env()` igual por si un día se activa. |
| D-4 | Cambiar el `contentUrl` de `e2e/fixtures/api/ads/next.json` a un WebM de 10 s servido por la API simulada, para que las pruebas de la 012 en `/ads` midan el reproductor de verdad y desaparezca el aviso de `settle` que anotó la revisión de la 012. | **Sí.** Es el mismo mecanismo que necesita CA-12 y un cambio de una línea; sin él, esas pruebas siguen midiendo un video que no carga. |
| D-5 | Quitar los dos `console.log` de `VideoAdPlayer.tsx` (`'Guardar:', currentAd` imprime el `sessionUUID`; `'Link copiado:'`). | **Sí**, en la misma tarea del arreglo (P-16: el código que se toca no deja datos de sesión en la consola). |
| D-6 | Versionar tres medios binarios mínimos en `e2e/fixtures/media/` (WebM y PNG de unos KB, hechos con `ffmpeg` en local). Alternativa: generarlos al vuelo en la prueba con `MediaRecorder` (sin binarios, pero el WebM queda sin duración y es más frágil). | **Versionarlos**, con el comando de `ffmpeg` en la cabecera de `e2e/ads.spec.ts`. |
| D-7 | `/games/play` recrea el iframe al girar (rama vertical girada contra rama horizontal). ¿Queda fuera de esta spec? | **Fuera.** RN-8 pide RN-1, RN-3 y RN-4 para `/games/play`, no RN-2; unificar las ramas toca el giro por CSS del juego patrocinado y merece su propia spec. En CA-10 "el giro sin recarga" se revisa en la mascota. |

## 18. Bloqueos

Ninguno. La spec está aprobada, no choca con `CLAUDE.md` ni con la constitución, no depende de la API y
no crea rutas ni dependencias. Todo el plan puede empezar sin esperar decisiones salvo: T5-T7 asumen
D-1 = (a) y D-2 = arriba a la izquierda; T8 asume D-6; D-4 y D-5 son una línea cada una dentro de T8 y
T10.

---

## 19. Cambio después de la ronda 3: mascota girada en vertical (T14-T19)

- **Spec:** sección "Cambio después de la ronda 3 (2026-10-24)", paso 1 del flujo de `/pet`, RN-1, RN-3,
  RN-10, CA-2, CA-3, CA-4 y CA-13. T1-T13 y las correcciones de las rondas 1 y 2 no se rehacen.
- **Lecturas** (2026-10-24, árbol de trabajo de `beta-front` sobre `09352f8`): `src/app/globals.css`
  (variante `immersive`), `src/app/(consumer)/pet/page.tsx`, `src/components/PetGame.tsx`,
  `src/app/(consumer)/games/play/page.tsx`, `src/app/(consumer)/layout.tsx`, `src/components/bars/NavBar.tsx`
  (líneas 438, 609 y 646), `src/hooks/pet/usePetSession.ts`, `e2e/pet.spec.ts`, `e2e/navbar.spec.ts`,
  `e2e/games-play.spec.ts`, `e2e/layout.spec.ts`, `e2e/touch.spec.ts`, `e2e/fixtures/pet-game.html`,
  `e2e/support/{pages.ts,measure.ts,mockRoutes.mjs}` y `playwright.config.ts`.

### 19.1 Resumen

En el celular en vertical, `/pet` oculta las dos barras y gira **la sección entera de la página** −90°
con CSS (`fixed`, `100dvh × 100dvw`, `translate(-50%,-50%) rotate(-90deg)`, como `/games/play`). Como el
marco del juego y "Salir" son hijos de esa sección, giran juntos: "Salir" queda en la esquina de arriba
a la izquierda del juego girado sin cálculo aparte. Lo activa una segunda variante, `immersive-portrait`,
gemela de `immersive`: el DOM y el árbol de React son los mismos en las dos orientaciones (RN-2).

### 19.2 Lo que se encontró

- **`/games/play` (la referencia)** decide el giro con estado (`shouldRotate`, por `resize`) y pinta dos
  ramas distintas: al girar se desmonta un iframe y se monta otro. En la mascota eso está prohibido (RN-2):
  aquí se toma solo el CSS de su rama vertical (`fixed`, `top/left 50%`, `width: 100dvh`, `height: 100dvw`,
  `transform: translate(-50%, -50%) rotate(-90deg)`), que es lo que el usuario ya vio funcionar en su iPhone.
- **La esquina de "Volver" en `/games/play` vertical no es la que dice su comentario.** El botón está arriba
  a la derecha de la pantalla con el comentario "en portrait top-right = landscape top-left". Con
  `rotate(-90deg)` (antihorario), un punto del juego `(x, y)` relativo al centro pasa a `(y, −x)` en
  pantalla: la esquina de arriba a la izquierda del juego cae **abajo a la izquierda** de la pantalla, y la
  de arriba a la derecha de la pantalla es la de **abajo a la derecha** del juego. La spec pide para "Salir"
  la de arriba a la izquierda del juego; se cumple por construcción porque "Salir" gira con la sección
  (19.3). `/games/play` vertical no cambia (spec): ver D-9.
- **La variante `immersive` exige `orientation: landscape`** y la usan `/pet` y `/games/play`. Si se le
  quitara la orientación, `/games/play` vertical también ocultaría las barras y aplicaría las clases
  `immersive:*` de su rama horizontal en el primer render (antes de que `shouldRotate` pase a `true`); la
  spec dice que `/games/play` vertical no cambia. Por eso no se toca `immersive` y se agrega otra variante
  que solo activa `/pet`.
- **`RotateHint`** se decide solo con CSS (`landscape:hidden pointer-fine:hidden`): hoy se ve en cualquier
  vertical táctil, de cualquier ancho.
- **`usePetSession`** escucha `message` solo para `PET_GAME_READY` y `PET_AUTH_EXPIRED`; `/games/play`, para
  `GAME_LOADED`, `PRODUCT_CLICKED` y `GAME_FINISHED`. Las dos ignoran los demás tipos. El fixture
  `pet-game.html` lo sirven las dos (`/pet-game-stub`), así que lo que se le agregue no debe mandar mensajes
  que una de ellas pueda interpretar.
- **Pruebas que chocan con el cambio:** `e2e/pet.spec.ts` ("se ve 'Gira tu teléfono'" y la vuelta a vertical
  de CA-3 esperan barras y aviso) y `e2e/navbar.spec.ts` (CA-6 recorre `/pet` en vertical y espera la barra
  inferior). `layout.spec.ts` y `touch.spec.ts` recorren `/pet` en 360 × 740 (y `layout`, también en
  390 × 844 y 768 × 1024): deben seguir en verde con el juego girado.

### 19.3 Mecanismo: variante `immersive-portrait`

En `src/app/globals.css`, junto a `immersive`, con su comentario en español:

```css
/* Mascota girada en el celular en vertical (spec 013, RN-10). Gemela de `immersive`: solo CSS, así que
   girar no cambia el árbol de React ni desmonta el iframe (RN-2). La activa solo una página que marca un
   elemento con `data-immersive="rotate"` (hoy, `/pet`); `/games/play` vertical no cambia. */
@custom-variant immersive-portrait {
  @media (orientation: portrait) and (pointer: coarse) and (width < 64rem) {
    :where(body:has([data-immersive="rotate"])) & {
      @slot;
    }
  }
}
```

- `/pet` cambia `data-immersive` por `data-immersive="rotate"`: `[data-immersive]` sigue casando (la variante
  horizontal no cambia) y la nueva solo casa en `/pet`. `/games/play` sigue con `data-immersive` a secas.
- Las dos variantes se excluyen por la orientación: nunca aplican a la vez y no compiten entre sí.
- Una ventana angosta de escritorio (puntero fino) no casa con ninguna: la prueba de 900 × 500 sigue igual.

| Archivo | Elemento | Clases nuevas |
|---------|----------|---------------|
| `NavBar.tsx` | barra superior, barra inferior y hoja del menú de Perfil (líneas 438, 609, 646) | `immersive-portrait:hidden` |
| `(consumer)/layout.tsx` | `<main>` | `immersive-portrait:pb-0 immersive-portrait:bg-[#231f20]` (el fondo es red de seguridad para R-12) |
| `pet/page.tsx` | `<section data-immersive="rotate">` | `immersive-portrait:fixed immersive-portrait:top-1/2 immersive-portrait:left-1/2 immersive-portrait:z-30 immersive-portrait:p-0 immersive-portrait:w-[100dvh] immersive-portrait:h-[100dvw] immersive-portrait:[transform:translate(-50%,-50%)_rotate(-90deg)]` |
| `pet/page.tsx` | enlace "Salir" | `immersive-portrait:flex` y, en coordenadas del juego, `immersive-portrait:top-[max(0.75rem,env(safe-area-inset-left))] immersive-portrait:left-[max(0.75rem,env(safe-area-inset-bottom))]` (19.5) |
| `PetGame.tsx` | marco común | `immersive-portrait:rounded-none immersive-portrait:border-0 immersive-portrait:shadow-none` |
| `PetGame.tsx` | `RotateHint` | `immersive-portrait:hidden` (19.4) |

- **El giro va en la `<section>`, no en el iframe.** Así giran a la vez el marco (en los tres estados:
  cargando, error y juego), el iframe y "Salir", y el iframe nunca cambia de padre. Antes del giro la
  sección mide `100dvh` de ancho y `100dvw` de alto (740 × 360 en un 360 × 740); girada, su caja en pantalla
  es 360 × 740 en `(0, 0)`.
- **Transformación explícita** (`[transform:…]`) y no `-rotate-90` + `-translate-*` de Tailwind 4 (que usan
  las propiedades `rotate` y `translate`): da el mismo resultado, pero así es literalmente la de
  `/games/play`, la que ya funciona en el iPhone.
- **`fixed` con `transform`** convierte la sección en bloque contenedor de sus hijos fijos; dentro no hay
  ninguno ("Salir" es `absolute`). El `CartDrawer`, el `Toaster` y el `XpRewardToast` no son hijos: siguen
  por encima (`z-30`, como en horizontal).
- `sm:p-4` aplica en 768 px de ancho: `immersive-portrait:p-0` lo anula.
- **Sin estado de React, sin `matchMedia`, sin `resize`.** `/pet` sigue de servidor (P-2) y `PetGame` no
  gana estado.

### 19.4 `RotateHint`: se queda, oculto en el celular

Decisión del plan (y D-8 para el usuario): `RotateHint` **no se borra**; gana `immersive-portrait:hidden` y su
comentario se actualiza. Razones:

1. **Degradación (R-1, R-17).** Si el navegador no entiende `:has()` (iOS < 15.4, Chrome < 105), la regla
   entera de `immersive-portrait` se descarta: la página queda como hoy en vertical (barras puestas y juego
   sin girar). Con `RotateHint`, ese usuario ve "Gira tu teléfono", como hoy, en vez de un juego horizontal
   de 200 px de alto. Sin él, vería el juego diminuto sin ninguna indicación.
2. **Tableta grande en vertical** (táctil y ≥ 1024 px de ancho, por ejemplo iPad Pro 1024 × 1366): no es
   "celular" para la spec, `immersive-portrait` no casa, y el aviso se sigue viendo, como hoy. Sin aviso se
   vería el juego a 16:9 dentro de una pantalla vertical.
3. Cuesta una clase y no toca el iframe (es una capa encima, decidida por CSS).

En el celular con un navegador actual nunca se ve: CA-2 lo comprueba.

### 19.5 "Salir" girado y el área segura

- "Salir" ya está en la sección, fuera de `PetGame`: se ve en los tres estados y gira con el juego. Las
  posiciones `top` y `left` del enlace son del sistema del juego. En pantalla: el borde de arriba del juego
  es el lado **izquierdo** de la pantalla y el borde izquierdo del juego es el lado de **abajo**. Por eso,
  en vertical girado, `top` usa `env(safe-area-inset-left)` y `left` usa `env(safe-area-inset-bottom)`, con
  un mínimo de 12 px (`0.75rem`).
- Con `viewport-fit` sin `cover` (D-3, sigue igual), `env()` vale 0 en el iPhone y Safari deja la página
  fuera de la muesca y de la barra de estado. Abajo está la barra de Safari, que `100dvh` ya descuenta: el
  botón queda a 12 px por encima del borde inferior de la zona visible (R-13).
- Tamaño: el mismo enlace de hoy (`min-h-11 min-w-11`, unos 80 × 44 en el juego; 44 × 80 en pantalla).
  Sigue cumpliendo los 44 × 44 en los dos ejes.
- No tapa "Reintentar", que va centrado en el marco: CA-4 comprueba que las cajas no se cruzan.

### 19.6 Toques en el juego girado (CA-13)

El navegador entrega los eventos dentro del iframe en el sistema de coordenadas del propio iframe: el
documento del juego no está transformado (lo está el elemento padre), y la prueba de impacto atraviesa la
transformación. Para un iframe que llena la sección girada en un viewport `vw × vh` (aquí 360 × 740, iframe
de `vh × vw` = 740 × 360 en sus coordenadas), un punto del juego `(gx, gy)` está en pantalla en:

```
x = gy
y = vh − gx
```

La prueba usa dos puntos asimétricos, lejos de "Salir" (que ocupa la esquina `(0..~95, 0..56)` del juego):

| Punto del juego `(gx, gy)` | Toque en pantalla `(x, y)` | Si el giro fuera +90° caería en |
|----------------------------|----------------------------|---------------------------------|
| `(160, 90)` | `(90, 580)` | `(270, 160)` |
| `(600, 300)` | `(300, 140)` | `(60, 600)` |

Tolerancia ±2 px. El fixture `e2e/fixtures/pet-game.html` gana un script que, en `pointerdown` y en
`touchstart` (en fase de captura, sobre `window`), guarda el último toque en el propio DOM del iframe:
`document.documentElement.dataset.lastPointer = JSON.stringify({ type, x: clientX, y: clientY })` y un
contador en `data-pointer-count`. Se eligió el DOM y no `postMessage`: el fixture lo sirven `/pet` y
`/games/play`, y un mensaje nuevo pasaría por los dos manejadores de `message` (19.2). La prueba lo lee con
`contentFrame.evaluate` (el mismo recurso que ya usa CA-3, que funciona entre orígenes en Playwright) y
toca con `page.touchscreen.tap(x, y)` (proyecto `mobile-360`, `hasTouch`). También comprueba que el juego se
ve en horizontal desde dentro: `innerWidth` del iframe ≈ 740 e `innerHeight` ≈ 360.

Con el código de hoy CA-13 falla: en vertical `RotateHint` tapa el iframe y bloquea el toque (no tiene
`pointer-events-none`), así que el fixture no registra nada.

### 19.7 Archivos

**Modificar:**

| Ruta | Qué cambia |
|------|------------|
| `src/app/globals.css` | Variante `immersive-portrait` (19.3). `immersive` no cambia. |
| `src/components/bars/NavBar.tsx` | `immersive-portrait:hidden` en las dos barras del celular y en la hoja del menú. Nada más. |
| `src/app/(consumer)/layout.tsx` | `immersive-portrait:pb-0 immersive-portrait:bg-[#231f20]` en `<main>`. Sigue de servidor. |
| `src/app/(consumer)/pet/page.tsx` | `data-immersive="rotate"`, clases de la sección y de "Salir" (19.3, 19.5) y comentario de la cabecera (vertical girada). Sigue de servidor (P-2). |
| `src/components/PetGame.tsx` | Clases `immersive-portrait:*` del marco; `immersive-portrait:hidden` y comentario nuevo en `RotateHint` (19.4). Sin estado nuevo. |
| `e2e/fixtures/pet-game.html` | Script que registra el último toque en el DOM del iframe (19.6). Sin texto visible nuevo. |
| `e2e/pet.spec.ts` | Se reemplaza el bloque "CA-7 · vertical" por CA-2 (juego, cargando y error), se ajusta CA-3, se agregan CA-4 en vertical y CA-13; la prueba R-3 se queda. Comentario de la cabecera actualizado (19.8). |
| `e2e/navbar.spec.ts` | CA-6 recorre `/home`, `/games`, `/ads` y **`/products`** (en lugar de `/pet`, que en vertical ya no tiene barras: RN-1). Comentario que lo explica. |

**No se tocan:** `/games/play` (su vertical no cambia; D-9), `e2e/games-play.spec.ts`, `src/middleware.ts`,
`__tests__/middleware/*`, `next.config.ts`, `package.json`, servicios, hooks, tipos, `e2e/desktop.spec.ts`
y sus capturas, ni las carpetas de otros roles. Ninguna ruta nueva ni route handler (P-4).

### 19.8 Pruebas (`e2e/pet.spec.ts`, proyecto `mobile-360`)

Helpers nuevos en el mismo archivo: `frameBox(page, selector)` devuelve `getBoundingClientRect()` (ya incluye
la transformación) y `offsetWidth`/`offsetHeight` (que no la incluyen) del elemento. Si la caja en pantalla
mide 360 × 740 y el tamaño de maquetación 740 × 360, el elemento está **girado**, no solo estirado.
`expectExitReachable` se reutiliza con el viewport vertical.

- **CA-2 · vertical 360 × 740 (reemplaza "se ve 'Gira tu teléfono'")**, en tres estados:
  - juego: `[data-app-bar="top"]` y `"bottom"` existen (`toHaveCount(1)`) y están ocultos; "Gira tu teléfono"
    oculto; el iframe mide en pantalla `{0, 0, clientWidth, clientHeight}` ±1 px y su maquetación es
    `clientHeight × clientWidth` ±1 px; sin scroll en el documento (`scrollWidth`/`scrollHeight`).
  - cargando (`POST /pet/session/init` retenido): lo mismo sobre el marco (padre de "Preparando tu
    mascota…"), y el texto queda dentro del viewport.
  - error (500): lo mismo sobre el marco; "Reintentar" ≥ 44 × 44, `elementFromPoint` de su centro es el
    botón, y `tap()` provoca un segundo `POST /pet/session/init` (`waitForRequest`): "se puede tocar".
- **R-3** se queda (comprueba `pointer: coarse` y `orientation: portrait` del emulador); su mensaje pasa a
  nombrar la variante `immersive-portrait` en lugar de `RotateHint`.
- **CA-3 (ajustada):** el mismo arranque de hoy en horizontal (marca en el elemento, marca en la ventana,
  contador de pedidos). En cada paso (horizontal → vertical → horizontal): barras ocultas y "Gira tu
  teléfono" oculto; en vertical el iframe está girado (`frameBox`: caja 360 × 740, maquetación 740 × 360) y en
  horizontal derecho (caja = maquetación = 740 × 360). Al final: misma marca, misma ventana y un solo pedido
  a `/pet-game-stub`.
- **CA-4 · "Salir" en vertical girado** (nuevo `describe`, mismos tres estados que el horizontal):
  `expectExitReachable(page, PORTRAIT)`; además, la caja de "Salir" es más alta que ancha (gira con el
  juego) y su centro está en la mitad izquierda y la mitad de abajo de la pantalla (esquina de arriba a la
  izquierda del juego, 19.2); en error no se cruza con "Reintentar"; `tap()` lleva a `/home` y luego
  `settle`.
- **CA-13 · toques en el juego girado:** juego cargado en 360 × 740; para cada fila de la tabla de 19.6,
  `page.touchscreen.tap(x, y)` y `expect.poll` sobre `data-pointer-count` (que sube) y `data-last-pointer`
  (`x ≈ gx`, `y ≈ gy`, ±2 px). Además, `innerWidth`/`innerHeight` del iframe ≈ 740 / 360.
- **Sin cambios:** CA-1, CA-4 horizontal, CA-5 (1280 × 800) y la ventana angosta (900 × 500): deben seguir
  en verde tal como están.
- **Rojo primero (P-17), con el código de hoy:** CA-2 en los tres estados (barras visibles, aviso visible,
  marco sin girar), CA-3 (barras al pasar a vertical, iframe no girado), CA-4 vertical ("Salir" oculto) y
  CA-13 (el aviso tapa el iframe: no llega ningún toque). T15 anota qué aserción falló en cada una. CA-13 y
  la medida girada de CA-2 tienen que fallar **por aserción**, no por un error del helper.
- **Otras suites:** `layout.spec.ts` (360, 390, 768) y `touch.spec.ts` (360) recorren `/pet` y deben seguir
  verdes con el juego girado (los fijos no cuentan para el desborde; "Salir" y "Reintentar" girados siguen
  midiendo ≥ 44 en los dos ejes). `games-play.spec.ts` debe seguir verde con el fixture nuevo.
- **Capturas de escritorio** (`desktop-1280`): no se regeneran y deben pasar sin diferencias (ninguna
  captura usa `/pet`; lo nuevo solo casa con puntero táctil).

### 19.9 Rutas, contrato, datos, configuración, dependencias, PII

- Ninguna ruta nueva; `matcher`, cuerpo del middleware y `routeAccess.ts` sin cambios (P-4). P-5 igual.
- Sin `'use client'` nuevo (P-2), sin `params` (P-6), sin servicios, hooks ni `queryKey` (P-10), sin
  formularios (P-11).
- API: sin cambios ni dependencias (`POST /pet/session/init`, igual que hoy).
- Configuración: sin variables nuevas, sin hosts de imágenes (P-3, P-7). `viewport-fit` sigue sin `cover` (D-3).
- Dependencias: ninguna (P-1).
- PII y tokens: sin cambios; el iframe sigue con su URL actual (deuda (e) de P-16). El fixture solo guarda
  coordenadas de un toque, en el DOM de una página de relleno.
- Llamadas salientes del servidor: ninguna (P-15 no aplica).
- Lint: tope 348; ningún aviso nuevo (P-19). Textos al usuario: ninguno nuevo; comentarios en español (P-18).

### 19.10 Efectos colaterales

- **Vertical en `/pet` ya no muestra las barras:** desde la mascota en vertical se sale solo con "Salir" (o
  el botón Atrás del sistema). El menú de Perfil abierto antes de entrar queda oculto (`immersive-portrait:hidden`),
  como en horizontal.
- **Unity cambia de tamaño al girar el teléfono con la rotación desbloqueada:** pasa de 740 × 360 girado a
  740 × 360 derecho (en un 360 × 740): el tamaño del iframe en su propio sistema es casi el mismo, así que
  el reajuste es menor que hoy (antes pasaba de 360 × ~600 a 740 × 360).
- **Tableta táctil en vertical de menos de 1024 px** (por ejemplo 768 × 1024): también gira, como hace
  `/games/play` (su `shouldRotate` usa el mismo corte). Ver D-10.
- **`/games/play`, el resto de páginas y el escritorio:** sin cambios (`data-immersive="rotate"` solo existe
  en `/pet`).
- **Si una validación falla antes de la API:** no aplica.

### 19.11 Trazabilidad del cambio

| CA | Tareas | Cómo se verifica |
|----|--------|------------------|
| CA-2 (nuevo) | T14, T15, T16, T17 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-2"` (roja en T15, verde en T17) |
| CA-3 (ajustado) | T15, T16, T17 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-3"` |
| CA-4 (vertical) | T15, T17 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-4"` (horizontal y vertical) |
| CA-13 | T14, T15, T17 | `npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "CA-13"`; con el juego real, CA-10 (U-1, filas de vertical) |
| CA-1, CA-5, CA-6, CA-11 (no deben romperse) | T15, T18 | `pet.spec.ts` completo, `navbar.spec.ts`, `games-play.spec.ts`, la ventana angosta y `desktop-1280` sin diferencias |
| CA-9 | T18, T19 | `npm run test:e2e` completo (dos corridas en frío), `desktop-1280`, `npm test`, `npm run lint:ci` (≤ 348), `npm run build`, `npx tsc --noEmit`, `npm run audit:ci` |
| CA-10 | U-1 | Filas de vertical de la tabla de `spec.md` (girado sin barra de Safari quitando alto, toques del juego real, "Salir") |

### 19.12 Riesgos del cambio

- **R-11 · Toques de Unity con el iframe girado.** El navegador traduce el toque al sistema del iframe y el
  fixture lo prueba en Chromium (CA-13). Lo que la prueba no puede ver: (a) que el build de Unity lea
  `screen.orientation`, `screen.width/height` o `window.orientation`, que **dentro del iframe siguen diciendo
  vertical**, y decida su interfaz o un aviso propio con eso en lugar del tamaño de su ventana (740 × 360,
  que CA-13 sí comprueba); (b) WebKit en el iPhone. Evidencia a favor: `/games/play` usa la misma técnica y
  el usuario la vio funcionar en su iPhone. Se confirma en CA-10 ("los toques en el juego real caen donde se
  toca": alimentar, botones). Si falla, no se arregla en el front: es un cambio del build de Unity (fuera de
  alcance), y se vuelve al usuario.
- **R-12 · `100dvh` y `100dvw` con la barra de Safari en vertical.** `100dvh` es el alto visible con las
  barras de Safari en su estado actual, y la sección se centra con `top/left: 50%` del bloque fijo. Si en
  algún iPhone el bloque fijo y `100dvh` no coinciden, el juego quedaría corrido o con una franja. Mitigación:
  es el mismo CSS que `/games/play`, que se ve completo en el iPhone del usuario; el `<main>` toma el fondo
  oscuro del juego (`immersive-portrait:bg-[#231f20]`), así que una franja no se ve blanca. Alternativa si
  CA-10 lo muestra: anclar arriba a la izquierda (`top-0 left-0`, `origin-top-left`,
  `translateY(100dvh) rotate(-90deg)`), que no depende del centro del bloque fijo. En Chromium (CI) la
  prueba de CA-2 mide la caja exacta.
- **R-13 · Área segura en vertical girado.** Sin `viewport-fit=cover` (D-3) `env()` vale 0 y Safari mantiene
  la página fuera de la muesca y la barra de estado (lado izquierdo del juego girado: su borde de arriba).
  "Salir" queda abajo a la izquierda de la pantalla, 12 px sobre el borde inferior visible, que `100dvh`
  pone por encima de la barra de Safari. Caso límite: si Safari compacta su barra (en `/pet` no hay scroll
  que lo provoque), el borde inferior visible baja hasta la zona del indicador de inicio y "Salir" quedaría
  cerca del gesto de inicio. Las clases ya traducen `env()` al eje girado por si un día se activa `cover`.
  Se mira en CA-10.
- **R-14 · `dvh` cambia cuando Safari muestra u oculta su barra.** Si cambia, cambia el **ancho** del juego
  girado: el iframe se redimensiona y Unity se reajusta con su `resize` (sin recarga, sin render de React,
  sin desmontar nada; RN-2 se mantiene). Mientras dura la animación de la barra puede verse un salto del
  juego o una franja oscura (por el fondo del `<main>`). En `/pet` no hay scroll, así que la barra cambia
  poco (por ejemplo, al tocar la barra de estado o la barra compacta). Se mira en CA-10.
- **R-15 · Ventana de maquetación ensanchada en la emulación.** Antes del giro la sección mide 740 px de
  ancho; los elementos `fixed` no cuentan para el desborde del documento y la caja girada cae dentro de la
  pantalla. CA-2 comprueba `scrollWidth ≤ clientWidth`, y `layout.spec.ts` el desborde en 360, 390 y 768.
- **R-16 · Esquina distinta entre `/pet` y `/games/play` en vertical** (19.2): "Salir" queda arriba a la
  izquierda del juego (como pide la spec) y "Volver", abajo a la derecha del juego. Ver D-9.
- **R-17 · `:has()` o `dvh` no soportados:** la variante no casa y la mascota en vertical queda como hoy
  (barras y "Gira tu teléfono"), gracias a que `RotateHint` se queda (19.4). Chrome 105-107 tiene `:has()`
  pero no `dvh`: la sección quedaría sin tamaño correcto; Chrome de Android se actualiza solo y esas
  versiones son de 2022, se acepta.
- **R-18 · `tablet-768` y el puntero:** si el emulador de `tablet-768` (`hasTouch`, `isMobile: false`) no
  responde a `pointer: coarse`, esa corrida no ve el giro y no lo cubre; si responde, ve `/pet` girada.
  `layout.spec.ts` debe pasar en los dos casos. T18 anota cuál fue.

### 19.13 Decisiones para el usuario

| Id | Decisión | Recomendación |
|----|----------|---------------|
| D-8 | `RotateHint`: **(a)** se queda con `immersive-portrait:hidden` (no se ve en el celular; queda para navegadores sin `:has()` y tabletas grandes en vertical), o **(b)** se borra. | **(a).** Es la degradación a lo de hoy si la variante no casa, cuesta una clase y no toca el iframe (19.4). |
| D-9 | `/games/play` vertical pone "Volver" en la esquina de **abajo a la derecha** del juego girado (su comentario dice "arriba a la izquierda"). La mascota la pondrá arriba a la izquierda, como pide la spec. ¿Se iguala `/games/play` aquí? | **No en esta spec.** La spec dice que `/games/play` vertical no cambia, y moverlo exige tocar su rama girada (D-7). Que el usuario lo mire en CA-10 y, si molesta, una spec corta lo arregla. Mientras, el comentario equivocado queda como está (no se toca el archivo). |
| D-10 | Una tableta táctil en vertical de menos de 1024 px (iPad mini, 768 × 1024) también ve la mascota girada a pantalla completa. | **Aceptarlo.** Es el criterio de "celular" de la spec (táctil y < 1024 px, donde se ven las barras del celular) y lo mismo que hace `/games/play`. Limitarlo exigiría otro corte de ancho que la spec no define. |

### 19.14 Bloqueos

Ninguno. La spec está en "Aprobada con cambio", no choca con `CLAUDE.md` ni con la constitución, no
depende de la API y no crea rutas ni dependencias. T14-T19 asumen D-8 = (a); D-9 y D-10 no cambian ninguna
tarea si se aceptan las recomendaciones.
