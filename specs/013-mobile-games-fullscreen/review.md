# 013 · Revisión

## Ronda 1: CAMBIOS

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅ · test:e2e ❌ (en frío, ver bloqueante) · desktop-1280 ✅

Revisado sobre `git diff HEAD` más los archivos sin seguimiento (rama `beta-front`, 2026-10-24).
Todas las puertas las corrió el reviewer con las variables ficticias de `CLAUDE.md`:

| Puerta | Resultado |
|--------|-----------|
| `npm test` | 709 pasan (12 archivos) |
| `npm run lint:ci` | 0 errores, 348 avisos; tope 348, `origin/main` 348. Los avisos de los archivos tocados ya existían (`VideoAdPlayer.tsx`: `<img>`, `any` en la línea 122, `formattedLikes` sin usar, dependencias del efecto) |
| `npm run build` / `npx tsc --noEmit` | pasan (`.next` queda con `npm run build`) |
| `npm run audit:ci` | pasa; las cuatro excepciones vigentes, ninguna nueva |
| `npm run build:e2e` + `npm run test:e2e` (`CI=1`) | **en frío (justo después del build) falla siempre**: `[mobile-390] smoke.spec.ts:23` agota los 180 s, y el reintento también (3 de 3 corridas). Con la caché ya llena pasa: 261 pasan, 102 omitidas, 3,2 min (3 de 3) |
| `npx playwright test --project=desktop-1280` | 10 capturas sin diferencias, sin `--update-snapshots` |

Con `HEAD` (sin la 013), en una copia aislada y en frío: 242 pasan en 3 de 3 corridas.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 | ✅ | `e2e/pet.spec.ts` "CA-1": barras ocultas, el marco mide la ventana (±1 px), sin scroll |
| CA-2 | ✅ | `e2e/pet.spec.ts` "CA-7 · vertical": barras visibles, aviso y "Salir" oculto |
| CA-3 | ✅ | `e2e/pet.spec.ts` "CA-3": marca en el elemento y en la ventana del iframe, y un solo pedido a `/pet-game-stub` después de girar dos veces. Por construcción, el DOM es el mismo en las dos orientaciones (solo CSS) |
| CA-4 | ✅ | `e2e/pet.spec.ts` "CA-4" (cargando, error y juego): ≥ 44 × 44, dentro de la pantalla, `elementFromPoint` y lleva a `/home`; en error no se cruza con "Reintentar" |
| CA-5 | ✅ | `e2e/pet.spec.ts` "CA-5" (1280 × 800, exige que los `data-app-bar` existan) más la ventana angosta 900 × 500; capturas `desktop-1280` sin diferencias |
| CA-6 | ✅ | `__tests__/ui/mobileNav.test.ts` y `e2e/navbar.spec.ts` "CA-6" en `/home`, `/games`, `/ads` y `/pet` |
| CA-7 | ✅ | `e2e/navbar.spec.ts` "CA-7" (`aria-current`, que sale de la misma variable `active` que pinta el resaltado) y `isMobileBarItemActive` en Vitest |
| CA-8 | ✅ | `e2e/navbar.spec.ts` "CA-8" y `e2e/rn4.spec.ts` (D-13 con Rifas) |
| CA-9 | ❌ | El job "Pruebas en navegador" falla en frío, que es como corre siempre en el CI (bloqueante 1). El resto de las puertas pasa |
| CA-10 | ⏳ | Pasada manual en los celulares (U-1). La tabla está en `spec.md`, vacía. Es un paso del usuario y no bloquea el código |
| CA-11 | ✅ | `e2e/games-play.spec.ts` horizontal (barras ocultas, iframe del tamaño de la ventana, "Volver" ≥ 44 y a `/games`) y vertical |
| CA-12 | ✅ | `e2e/ads.spec.ts` (4 casos). **P-17 comprobado por el reviewer**: con `ads/page.tsx` y `VideoAdPlayer.tsx` de `HEAD`, en una copia aislada, fallan los 4 casos: alto 817 > 740 en vertical; en imagen el centro del botón cae en otro `div`; en horizontal el borde llega a 395,5 > 360 y queda bajo la barra. Con el arreglo pasan los 4 |

Puntos que pidió revisar el coordinator:

- **RN-2:** se cumple. `/pet` sigue siendo de servidor, `PetGame` no tiene estado nuevo y el enlace "Salir" se pinta siempre (oculto con CSS), así que el árbol no cambia al girar. CA-3 lo comprueba de verdad: marca en la ventana del iframe y cuenta los pedidos.
- **`immersive` fuera de escritorio, tabletas y otras páginas:** el CSS generado es `@media (orientation:landscape) and (pointer:coarse) and (not (min-width:64rem))` con `:where(body:has([data-immersive]))`. Solo `/pet` y `/games/play` ponen `data-immersive`. CA-5 y la prueba de la ventana angosta lo cubren, y `tablet-768` sigue en verde.
- **44 px:** los elementos de la barra miden 60 × 64; "Salir" y "Volver" llevan `min-h-11`, y las pruebas lo miden. "Me gusta" compacto (`py-3` + `text-lg`) mide unos 52 px.
- **P-16:** el código nuevo cumple. "Salir" no lleva parámetros, los fixtures son ficticios y se quitaron los dos `console.log` de `VideoAdPlayer` (D-5).
- **`handleSave` sin efecto:** el comentario explica por qué existe. Ver la sugerencia 3.
- **"Me gusta" en escritorio:** cambió un poco. Ver la sugerencia 1.

### Bloqueantes

- `e2e/games-play.spec.ts:48-49` (P-19, P-13; CA-9): la prueba horizontal toca "Volver" y termina en cuanto la URL es `/games`. Así cierra la página mientras `/games` todavía pide `/_next/image?url=%2Fcategories%2Fjuguetes.jpg&w=640&q=75`. Esa imagen sale de `e2e/fixtures/api/games/list.json:7` y es un JPEG de 805 KB. Con la caché de imágenes vacía, el optimizador de Next queda colgado en esa clave, y más tarde `[mobile-390] smoke.spec.ts:23` pide la misma imagen y espera `networkidle` para siempre. El reintento del CI corre contra el mismo servidor, así que también falla.
  - Cómo se comprobó: la traza de la prueba fallida muestra esa petición sin respuesta (estado −1) en `/games`. En frío, con todas las pruebas falló 3 de 3. Sin `games-play.spec.ts` pasó, y también con `navbar.spec.ts` y sin `games-play.spec.ts`. `HEAD` pasó 3 de 3. Con la caché llena pasa siempre, y por eso parecía intermitente. En el CI cada corrida sale de un build nuevo, así que la caché está siempre vacía: no es carga de la máquina ni los medios de `/ads`.
  - Qué haría falta: que la prueba no cierre la página a medio cargar `/games`, por ejemplo con `await settle(page)` después del `toHaveURL`. `e2e/navbar.spec.ts:40-41` ("tocar Juegos") tiene el mismo patrón y conviene tratarlo igual. Para no depender de eso, que el fixture de juegos apunte a una imagen chica (por ejemplo `/categories/deporte.jpg`, 22 KB).
  - Para darlo por arreglado: `npm run build:e2e && CI=1 npx playwright test --retries=0`, dos veces, borrando antes de la segunda `.next/standalone/.next/cache/images`. Las dos corridas deben pasar.

### Sugerencias (no bloquean)

1. `src/components/consumer/ads/VideoAdPlayer.tsx:378`: el `z-[35]` del aviso aplica a todos los tamaños. En escritorio, la barra de progreso (`z-30`) y el bloque de información (`z-20`) ahora quedan debajo del velo `bg-black/60` del aviso. Antes la barra se veía encima, y el bloque se pintaba sobre la parte baja del aviso. El plan 8.3(4) lo aprobó sin limitarlo al celular, pero la spec dice "en escritorio no cambia nada" y las capturas de escritorio no cubren `/ads`. Que el usuario lo confirme en escritorio, o que el cambio se limite con `max-md:`.
2. `src/components/bars/mobileNav.ts:41-42`: el plan 8.4 pedía Rifas **después** de Juegos y quedó antes. Es inofensivo, y `rn4.spec.ts` sigue el orden implementado. Que se alinee con el plan, o que se anote la desviación en `tasks.md`.
3. `src/components/consumer/ads/VideoAdPlayer.tsx:242`: `handleSave` no hace nada y `VideoControls` tampoco usa `onSave`: la prop está declarada, pero no se desestructura. El comentario lo explica y no confunde, pero en la spec de deuda conviene quitar `onSave` de `VideoControls` y sus dos usos.
4. `__tests__/e2e-support/mockApi.test.ts`: los `as unknown as Router` desaparecen si el tipo `Router` de la prueba admite `body: string | Uint8Array`.
5. Las comprobaciones manuales de T3, T6, T7 y T10 ("Comprobar") no se hicieron: los implementers lo dicen y las cubren las pruebas de navegador. Quedan a cargo de CA-10 (U-1), sobre todo R-7, porque "Salir" y "Volver" podrían tapar la interfaz del juego real.
6. El aviso de `settle` en `/games` que anotó T12 tiene la misma causa que el bloqueante: la imagen de 805 KB del fixture.

## Ronda 2: CAMBIOS

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅ · test:e2e ✅ (dos corridas en frío) · desktop-1280 ✅

Revisado sobre `git diff HEAD` más los archivos sin seguimiento (2026-10-24). La spec 012 está en `HEAD`.
El reviewer corrió todas las puertas con las variables ficticias de `CLAUDE.md`, y `.next` quedó con `npm run build`.

| Puerta | Resultado |
|--------|-----------|
| `npm test` | 710 pasan (12 archivos) |
| `npm run lint:ci` | 0 errores, 348 avisos; tope 348, `origin/main` 348 |
| `npm run build` y después `npx tsc --noEmit` | pasan |
| `npm run audit:ci` | pasa: las cuatro excepciones vigentes, ninguna nueva; `package.json` y `security/` sin cambios |
| `npm run build:e2e && CI=1 npx playwright test --retries=0`, primera corrida | 261 pasan, 102 omitidas, 3,2 min |
| La misma, borrando antes `.next/standalone/.next/cache/images` | 261 pasan, 102 omitidas, 3,3 min |
| `npx playwright test --project=desktop-1280` (sin `--update-snapshots`) | 10 pasan, sin diferencias |

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 a CA-8, CA-11 | ✅ | Como en la ronda 1 (`e2e/pet.spec.ts`, `e2e/navbar.spec.ts`, `e2e/rn4.spec.ts`, `e2e/games-play.spec.ts`, `__tests__/ui/mobileNav.test.ts`) |
| CA-9 | ✅ | Las cinco puertas, las dos corridas de e2e en frío y las capturas de escritorio pasan |
| CA-10 | ⏳ | Pasada manual del usuario en los celulares (U-1); no bloquea el código |
| CA-12 | ❌ | Cumple en los dos tamaños que nombra el criterio (`e2e/ads.spec.ts`, 360 × 740 y 740 × 360). Falla en celulares en horizontal de 768 px o más de ancho, que la spec incluye (bloqueante 1) |

Comprobaciones pedidas:

1. **Bloqueante 1 de la ronda 1: resuelto.** `games-play.spec.ts:50` y `navbar.spec.ts:40` esperan `settle` después de la navegación. El fixture de juegos usa `deporte.jpg`. Las dos corridas pasan con el criterio fijado, también con la caché de imágenes vacía.
2. **"Me gusta" desde `md` igual que en `HEAD`: sí.** Desde `md`, el aviso vuelve a `z-20` y la compactación por altura no aplica. El marco (`md:w-auto md:h-auto`), la imagen y el video recuperan las clases de `HEAD` con prefijo `md:`. En `ads/page.tsx`, `lg:h-[calc(100dvh-76px)]` no cambia y `max-lg:absolute` no aplica desde `lg`. En escritorio (≥ 1024 px) el aviso es idéntico al de `HEAD`. Esto cierra la sugerencia 1.
3. **La desviación anotada: no se alcanza el botón (bloqueante).** Ver abajo.
4. **Menú de Perfil:** Rifas va justo después de Juegos (`mobileNav.ts:41-42`). `mobileNav.test.ts` lo fija con "pone Rifas justo después de Juegos", y `rn4.spec.ts` sigue el mismo orden. **`mockApi.test.ts`:** `Reply.body` ahora es `string | Uint8Array`, ya no hay ningún `as unknown as Router` y `tsc` pasa. Esto cierra las sugerencias 2 y 4.

### Bloqueantes

- `src/components/consumer/ads/VideoAdPlayer.tsx:312`, `:378`, `:380` y `:439` (RN-9, CA-12; la spec, en la línea 213, cubre "celulares de 360 a 932 px de ancho en horizontal"): todo lo del celular quedó limitado a `max-md:`. Entre 768 px y 1023 px de ancho sigue visible la barra inferior del celular, que se oculta recién en `lg`. En ese rango el aviso vuelve al diseño de `HEAD`. Por eso el marco se ajusta al tamaño del medio y recorta la tarjeta (`overflow-hidden`), la tarjeta no se compacta, y el bloque de información (`:439`, `z-20`, que va después en el DOM) se pinta encima del aviso, también en `z-20`.
  - Cómo se comprobó: con una copia de `e2e/ads.spec.ts` fuera del árbol (en el scratchpad), en 932 × 430 y 915 × 412, con `isMobile`, `hasTouch` y el build de `build:e2e`. **Fallan los 4 casos:**
    - Video, 932 × 430: el botón va de y = 278 a y = 394, y la barra empieza en 366, así que su borde queda 28 px bajo la barra. El marco termina en 388 y lo recorta. En el centro del botón está el `<p>` "Mira el video completo…" del bloque de información, y `tap()` agota los 5 s porque otro elemento intercepta el toque.
    - Video, 915 × 412: el borde llega a 395 y la barra empieza en 348. Mismo elemento encima y mismo `tap()` agotado.
    - Imagen, 932 × 430 y 915 × 412: el marco mide 320 × 180 (el tamaño del PNG). El botón va de 286 a 346 y el marco termina en 314, así que el centro del botón queda fuera de la parte visible. `elementFromPoint` devuelve el velo del aviso, no el botón. El toque llega, pero el botón no se ve completo.
  - Qué haría falta: que el arreglo del celular aplique mientras se vea la barra del celular (hasta `lg`) y no solo por debajo de `md`, o con una condición de celular (`pointer:coarse`, como `immersive`) si se quiere dejar intactas las ventanas angostas de escritorio. Además, que `e2e/ads.spec.ts:22-25` agregue un tamaño horizontal de ≥ 768 px (por ejemplo 932 × 430) para que no vuelva a pasar. El escritorio (≥ 1024 px) puede seguir como en `HEAD`.

### Sugerencias (no bloquean)

1. La sugerencia 3 de la ronda 1 (`handleSave` sin efecto y `onSave` sin usar en `VideoControls`) sigue pendiente, para la spec de deuda.
2. La sugerencia 5 de la ronda 1 sigue a cargo de CA-10 (U-1): la pasada en celulares reales, sobre todo R-7. Conviene incluir en esa pasada un celular grande en horizontal (iPhone Pro Max o equivalente) en `/ads`.

## Ronda 3: APROBADO

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅ · test:e2e ✅ (dos corridas en frío) · desktop-1280 ✅

Revisado sobre `git diff HEAD` más los archivos sin seguimiento (2026-10-24). La spec 012 está en `HEAD`.
El reviewer corrió todas las puertas con las variables ficticias de `CLAUDE.md`, y `.next` quedó con `npm run build`.

| Puerta | Resultado |
|--------|-----------|
| `npm test` | 710 pasan (12 archivos) |
| `npm run lint:ci` | 0 errores, 348 avisos; tope 348, `origin/main` 348 |
| `npm run build` y después `npx tsc --noEmit` | pasan |
| `npm run audit:ci` | sale con 0: las excepciones vigentes, ninguna nueva. `package.json`, el lockfile y `security/` sin cambios |
| `npm run build:e2e && CI=1 npx playwright test --retries=0`, primera corrida | 267 pasan, 102 omitidas, 3,4 min |
| La misma, borrando antes `.next/standalone/.next/cache/images` | 267 pasan, 102 omitidas, 3,4 min |
| `npx playwright test --project=desktop-1280` (sin `--update-snapshots`) | 10 pasan, sin diferencias |

Los `AxiosError ... status code 500` del `[WebServer]` en la salida vienen del id reservado de error de `mockRoutes.mjs`. Ya salían con `HEAD`, y no son un fallo.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-1 a CA-8, CA-11 | ✅ | Como en las rondas 1 y 2 (`e2e/pet.spec.ts`, `e2e/navbar.spec.ts`, `e2e/rn4.spec.ts`, `e2e/games-play.spec.ts`, `__tests__/ui/mobileNav.test.ts`) |
| CA-9 | ✅ | Las cinco puertas, las dos corridas de e2e en frío y las capturas de escritorio pasan |
| CA-10 | ⏳ | Pasada manual del usuario en los celulares (U-1); no bloquea el código |
| CA-12 | ✅ | `e2e/ads.spec.ts`: 10 casos (video e imagen en 360 × 740, 740 × 360, 932 × 430, 915 × 412 y 768 × 1024). Pasan los 10. P-17 comprobado (ver abajo) |

Comprobaciones pedidas:

1. **Bloqueante de la ronda 2: resuelto.** `VideoAdPlayer.tsx:312`, `:328`, `:339`, `:378`, `:380`, `:399`, `:406` y `:413` pasan a `max-lg:` / `lg:`.
   - Pasan los 10 casos de `e2e/ads.spec.ts`. También pasa la prueba temporal del reviewer de la ronda 2 (`scratchpad/pw/wide-landscape.spec.ts`, 4 casos en 932 × 430 y 915 × 412). Con 932 × 430, el botón va de y = 250 a y = 302 y la barra empieza en 366.
   - **P-17:** en una copia aislada (rsync sin `.git`) se volvió a la versión de la ronda 2, con `max-lg:` → `max-md:` y `lg:` → `md:` en ese archivo, y se hizo `build:e2e`. Fallan 5 de los 6 casos nuevos: 932 × 430 y 915 × 412 en video e imagen, y la imagen en 768 × 1024. Pasa el video en 768 × 1024 y pasan los 4 casos originales. Es lo mismo que anota `tasks.md`, así que las pruebas nuevas atrapan el bug.
2. **Desde `lg`, igual que en `HEAD`: sí, píxel a píxel.** Se tomaron capturas de `/ads` con el anuncio terminado (aviso "Me gusta", video e imagen) en 1024 × 768, 1280 × 800 y 1440 × 900. Se compararon el build actual y el de `HEAD` (copia aislada), los dos con la misma API simulada: las 6 capturas son idénticas byte a byte. Por las clases también cuadra: en `lg`, `lg:w-auto lg:h-auto` y las clases del medio con `lg:` reponen las de `HEAD`, el aviso queda en `z-20`, y la compactación y `max-lg:absolute` no aplican.
   - **Tableta (768 a 1023):** en 768 × 1024 y 1000 × 700, el marco ocupa el espacio que queda entre la barra lateral de `md` (360 px) y los controles laterales. El aviso queda centrado y entero, y "Visitar" y "Compartir" no se pisan con el marco. Con `HEAD`, en 1000 × 700, el bloque de información se pintaba encima del aviso y el botón quedaba recortado. Ahora se ve bien.
3. **Vistazo final:**
   - Sin cambios en `package.json`, el lockfile, `security/`, `.lint-max-warnings`, `src/middleware.ts` ni `__tests__/middleware` (no cambia ningún rol).
   - En las líneas agregadas en `src` no hay `any`, `@ts-ignore`, `console.*`, `<img>`, `<a>`, `'use client'` nuevos ni tokens.
   - Las páginas siguen siendo de servidor.
   - Los textos y comentarios están en español.
   - Los medios y fixtures son ficticios, y las pruebas solo hablan con `127.0.0.1` (P-13, P-16, P-18).

### Bloqueantes

Ninguno.

### Sugerencias (no bloquean)

1. En tableta, mientras el anuncio se reproduce, el marco ocupa todo el alto y el video vertical lleva franjas negras arriba y abajo. Es cosmético y coherente con el celular. Que el usuario lo vea en la pasada de CA-10.
2. Siguen pendientes la sugerencia 3 de la ronda 1 (`handleSave` y `onSave` sin uso, para la spec de deuda) y la pasada manual en celulares reales (U-1), con un celular grande en horizontal en `/ads`.

## Cambio: mascota girada, ronda 1: APROBADO

Pruebas ✅ · lint:ci ✅ · build ✅ · tsc ✅ · audit:ci ✅ · test:e2e ✅ (dos corridas en frío) · desktop-1280 ✅

Revisado sobre `git diff HEAD` (2026-10-24), centrado en el Bloque E (T14 a T19): `globals.css`, `NavBar.tsx`,
`(consumer)/layout.tsx`, `pet/page.tsx`, `PetGame.tsx`, `e2e/pet.spec.ts`, `e2e/navbar.spec.ts` y
`e2e/fixtures/pet-game.html`. No hay archivos sin seguimiento. El reviewer corrió todas las puertas con las
variables ficticias de `CLAUDE.md`, y `.next` quedó con `npm run build`.

| Puerta | Resultado |
|--------|-----------|
| `npm test` | 710 pasan (12 archivos) |
| `npm run lint:ci` | 0 errores, 348 avisos; tope 348, `origin/main` 348 |
| `npm run build` y después `npx tsc --noEmit` | pasan |
| `npm run audit:ci` | sale con 0: las cuatro excepciones vigentes y ninguna nueva |
| `npm run build:e2e && CI=1 npx playwright test --retries=0`, primera corrida | 271 pasan, 102 omitidas, 3,4 min (3 min 25 s en total) |
| La misma, borrando antes `.next/standalone/.next/cache/images` | 271 pasan, 102 omitidas, 3,7 min (3 min 41 s en total) |
| `npx playwright test --project=desktop-1280` (sin `--update-snapshots`) | 10 pasan, sin diferencias |

`package.json`, el lockfile, `security/`, `.lint-max-warnings`, `src/middleware.ts`, `__tests__/`,
`src/app/(consumer)/games/play/page.tsx`, `e2e/games-play.spec.ts` y `e2e/desktop.spec.ts` no cambian.

| CA | Cumplido | Prueba o verificación |
|----|----------|-----------------------|
| CA-2 | ✅ | `e2e/pet.spec.ts`, "CA-2 · vertical 360 × 740, girada": juego, cargando y error. Caja en pantalla 360 × 740 y maquetación 740 × 360; barras y aviso ocultos (con `toHaveCount(1)`); sin scroll. "Reintentar" recibe el toque y provoca un segundo `POST` |
| CA-3 | ✅ | `e2e/pet.spec.ts`, "CA-3": horizontal → vertical → horizontal con la misma marca en el elemento y en la ventana, y un solo pedido al juego; girado en vertical y derecho en horizontal |
| CA-4 (vertical) | ✅ | `e2e/pet.spec.ts`, "CA-4 · 'Salir' en vertical girado": tres estados, ≥ 44 × 44, más alto que ancho, abajo a la izquierda de la pantalla, sin cruzarse con "Reintentar", lleva a `/home`. CA-4 horizontal sin cambios y en verde |
| CA-13 | ✅ | `e2e/pet.spec.ts`, "CA-13": `innerWidth`/`innerHeight` del juego 740 × 360; los toques en (90, 580) y (300, 140) llegan al juego en (160, 90) y (600, 300), ±2 px. Con el juego real queda en CA-10 (R-11) |
| CA-1, CA-5, CA-6, CA-11 | ✅ | Siguen en verde (`pet.spec.ts`, `navbar.spec.ts` con `/products` en lugar de `/pet`, `games-play.spec.ts`, la ventana angosta) |
| CA-9 | ✅ | Las cinco puertas, las dos corridas de e2e y las capturas de escritorio |
| CA-10 | ⏳ | Pasada manual del usuario (U-1), con las filas nuevas de vertical; no bloquea el código |

Comprobaciones pedidas:

1. **RN-2: el giro es solo CSS.** La variante `immersive-portrait` (`globals.css:18-24`) es una media query con
   `:has()`. `PetGame.tsx` no gana estado, `matchMedia` ni `resize`, y `pet/page.tsx` sigue de servidor. El
   giro va en la `<section>`, así que el iframe nunca cambia de padre.
   - **CA-3 lo demuestra:** en una copia aislada (rsync sin `.git`) se le puso al iframe un `key` que cambia
     con la orientación (por `matchMedia`). CA-3 falla en `toHaveAttribute('data-e2e-mark', 'misma-instancia')`
     (recibe `""`).
2. **P-17: rojo sin el cambio.** En otra copia aislada, los cinco archivos de `src` del Bloque E se volvieron a
   la versión de `HEAD`, con las pruebas y el fixture nuevos, y se hizo `build:e2e`. Fallan 8, todas por
   aserción, igual que anota T15:
   - CA-2 (los tres estados) y CA-3: `toBeHidden` de la barra (se ve).
   - Los tres CA-4 de vertical: `toBeVisible` de "Salir" (no existe).
   - CA-13: `innerWidth` del juego (380 contra 740).
   - Siguen verdes R-3, CA-1, CA-4 horizontal, CA-5, la ventana angosta y `navbar.spec.ts`.
3. **Sentido del giro (CA-13 y "Salir").** Mutante con `rotate(90deg)` en lugar de `-90deg`:
   - CA-13 falla en la coordenada del toque (x del juego 580 contra 160).
   - Los tres CA-4 de vertical fallan porque "Salir" queda a la derecha (centro en x = 326).
   - La geometría cuadra con el plan (19.6): con `rotate(-90deg)` el punto del juego (gx, gy) cae en
     pantalla en (gy, vh − gx). Es el mismo sentido que `/games/play` (`games/play/page.tsx:170`).
   - "Salir" usa `env(safe-area-inset-left)` como `top` y `env(safe-area-inset-bottom)` como `left`, que es la
     traducción correcta al eje girado.
4. **No afecta a nada más.** Con una prueba temporal fuera del árbol (en el scratchpad) se midieron `/pet` y
   `/games/play` con el build actual y con el revertido (equivale a `HEAD`), en 360 × 740, 390 × 844,
   768 × 1024 táctil, 740 × 360 táctil, 900 × 500 y 500 × 900 sin táctil, y 1280 × 800. Se midió la caja y la
   maquetación del iframe, la barra inferior, "Salir", el aviso y el scroll.
   - **Los 14 casos son idénticos** entre los dos builds, salvo `/pet` en vertical táctil (360, 390 y 768),
     que es lo que pide el cambio.
   - `/games/play` en vertical no cambia (D-9). Tampoco cambian la ventana angosta de escritorio (en las dos
     orientaciones), el escritorio ni `/pet` en horizontal.
   - `data-immersive="rotate"` solo existe en `/pet`, y `layout.spec.ts` y `smoke.spec.ts` pasan en todas las
     páginas.
5. **R-18: `tablet-768` sí ve la mascota girada.** En ese proyecto (`isMobile: false`, `hasTouch: true`),
   `matchMedia('(pointer: coarse)')` da `true`. En `/pet`, el iframe mide 1024 × 768 de maquetación y llena
   los 768 × 1024 de la pantalla, sin barras y con "Salir". Es lo que acepta D-10. `layout.spec.ts` pasa así
   en `tablet-768`.
6. **Constitución.** Sin `'use client'` nuevo (P-2), sin `any` ni `@ts-ignore` (P-9), sin `console.*`, `<img>`
   ni `<a>` internos (P-7, P-16), sin rutas ni roles nuevos (P-4), y sin dependencias (P-1). Comentarios en
   español (P-18). El fixture solo guarda coordenadas en su propio DOM, sin `postMessage` ni red (P-13).

### Bloqueantes

Ninguno.

### Sugerencias (no bloquean)

1. CA-6 dice "cualquier página del consumidor" a 360 de ancho. Con RN-1, `/pet` en vertical ya no tiene la
   barra, y `navbar.spec.ts` la cambió por `/products`. Conviene que la spec exceptúe `/pet` en CA-6 (la
   sección "Cambio después de la ronda 3" no lo nombra), para que el criterio y la prueba digan lo mismo.
2. CA-2 por sí solo no fija el sentido del giro (pasa con `+90deg`). Lo fijan CA-13 y CA-4 vertical, así que
   la cobertura está completa. Basta con saberlo si algún día se tocan esas pruebas.
3. Los CA-4 de vertical tocan "Salir" y comprueban la URL `/home`, pero no que las barras vuelvan al salir de
   `/pet`. Lo cubre en la práctica CA-6 sobre `/home`. Una aserción de la barra inferior visible tras el
   `tap()` lo dejaría explícito.
4. Como anota T16, Tailwind genera CSS de las clases que aparecen en los `.md` de `specs/`. Es inofensivo,
   pero un `@source not "../../specs"` en `globals.css` lo evitaría (para la spec de deuda).
5. En la pasada de CA-10 (U-1) hay que mirar R-11 (toques del build real de Unity, que dentro del iframe ve
   `screen.orientation` en vertical), R-12 a R-14 (franja o salto con la barra de Safari, "Salir" cerca del
   indicador de inicio) y D-9.
6. Al cerrar, actualizar el `Estado` de `spec.md`, que todavía dice "en implementación".
