# 013 · Tareas

Plan: `plan.md` de esta carpeta. Cada tarea de lógica lleva su prueba primero (P-13, P-17); las de
interfaz se verifican con su prueba de navegador escrita **antes** (debe verse roja) más `tsc` y una
comprobación manual concreta.

**Antes de verificar**, en la misma terminal:

```bash
export NEXT_TELEMETRY_DISABLED=1 NEXT_PUBLIC_API_URL=https://api.example.test \
  NEXT_PUBLIC_WS_URL=https://api.example.test/ws \
  NEXT_PUBLIC_PET_GAME_URL=https://games.example.test \
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=ficticia-solo-para-ci
```

- Las pruebas de navegador corren contra `npm run build:e2e`, que **reemplaza `.next`**: tras cambiar
  código de `src/`, vuelve a correr `npm run build:e2e` antes de `npx playwright test …`, y
  `npm run build` antes de `npx tsc --noEmit`.
- `.lint-max-warnings` hoy es `348`. Ninguna tarea lo sube; si `npm run lint:ci` dice que bajó, se edita
  al número que indica en la misma tarea (P-19).
- Las capturas `desktop-1280` no se regeneran en ninguna tarea.

Bloques para delegar: **A** barra y menú (T1-T3) · **B** layout, `/pet` y `/games/play` (T4-T7) ·
**C** bug de `/ads` (T8-T10) · **D** pruebas y puertas (T11-T13, U-1). A y C son independientes entre
sí; B toca `NavBar.tsx` (marcas `immersive`) después de A para no pisar el mismo archivo a la vez.

---

## Bloque A · Barra inferior y menú de Perfil

- [x] T1 · Lógica pura de la navegación del celular (CA-6, CA-7, CA-8)
  - Archivos: src/components/bars/mobileNav.ts, __tests__/ui/mobileNav.test.ts
  - Test primero: __tests__/ui/mobileNav.test.ts. Casos: (1) las etiquetas de `MOBILE_BAR_ITEMS` son, en
    orden, Inicio, Anuncios, Juegos, Mascota, Productos (Perfil es el botón del menú, fuera de la lista);
    (2) Juegos tiene `href` `/games` y Rifas no está en la barra; (3) `isMobileBarItemActive` da verdadero
    para Juegos en `/games` y `/games/play`, falso en `/gamesx` y en `/home`; los demás siguen exactos
    (`/products/1` no activa Productos, como hoy); (4) `MOBILE_MENU_ITEMS` contiene Rifas → `/raffles` y
    conserva Juegos → `/games` y los once de hoy con sus destinos. Falla antes porque el módulo no existe.
  - Verificar: npx vitest run __tests__/ui/mobileNav.test.ts && npx tsc --noEmit
  - Comprobar: no aplica (sin interfaz todavía).
  - Nota: visto en rojo (módulo `mobileNav` inexistente) y luego en verde, 6 pruebas.

- [x] T2 · Pruebas de navegador de la barra y el menú, en rojo (CA-6, CA-7, CA-8)
  - Archivos: e2e/navbar.spec.ts, e2e/rn4.spec.ts
  - Test primero: e2e/navbar.spec.ts (proyecto `mobile-360`, con sesión): CA-6 en `/home`, `/games`,
    `/ads` y `/pet` en vertical: `nav[aria-label="Navegación inferior"]` tiene, en orden, Inicio,
    Anuncios, Juegos, Mascota, Productos, Perfil, cada uno ≥ 44 × 44; Juegos con `href="/games"`, al
    tocarlo la URL es `/games`. CA-7: en `/games`, Juegos con `aria-current="page"`. CA-8: abrir Perfil,
    Rifas visible en la hoja y al tocarlo `/raffles`. En e2e/rn4.spec.ts, `PROFILE_MENU_LINKS` suma
    `['Rifas', '/raffles']`. Deben fallar hoy (no hay `aria-label` ni Juegos en la barra, ni Rifas en
    el menú); anota en "Hecho" qué falló.
  - Verificar: npm run build:e2e && npx playwright test e2e/navbar.spec.ts e2e/rn4.spec.ts --project=mobile-360 (rojo esperado)
  - Comprobar: no aplica.
  - Nota: en rojo: CA-6 (4 páginas), tocar Juegos, CA-7, CA-8 y D-13 de rn4 (sin `aria-label`, sin Juegos en la barra, sin Rifas en el menú).

- [x] T3 · `NavBar`: Juegos en la barra, Rifas en el menú (CA-6, CA-7, CA-8)
  - Archivos: src/components/bars/NavBar.tsx
  - Test primero: los de T1 y T2.
  - Cambios: la barra inferior se pinta con `map` sobre `MOBILE_BAR_ITEMS` con el mismo marcado y las
    mismas clases de hoy (ícono `Gamepad2` para Juegos), `aria-label="Navegación inferior"` en el
    `<nav>`, `aria-current="page"` en el activo (`isMobileBarItemActive`); el menú usa
    `MOBILE_MENU_ITEMS`. Se borra `mobileMenuItems` local y los imports sin uso. La barra de escritorio
    no se toca.
  - Verificar: npx vitest run __tests__/ui && npm run build:e2e && npx playwright test e2e/navbar.spec.ts e2e/rn4.spec.ts e2e/touch.spec.ts e2e/smoke.spec.ts --project=mobile-360 && npm run build && npx tsc --noEmit && npm run lint:ci
  - Nota: la comprobación manual en `next dev` no se hizo; la cubren las pruebas de navegador (90 en verde). Sin desviaciones del plan.
  - Comprobar: `npx next dev` con `MIDDLEWARE` sin definir y la API local, ventana de 360 px con
    emulación táctil: la barra inferior dice Inicio, Anuncios, Juegos, Mascota, Productos, Perfil; en
    `/games` Juegos se ve resaltado; Perfil → aparece Rifas y lleva a `/raffles`. A 1280 px la barra de
    escritorio es la misma de antes.

## Bloque B · Pantalla completa: layout, `/pet` y `/games/play`

- [x] T4 · Pruebas de navegador de pantalla completa, en rojo (CA-1, CA-2, CA-3, CA-4, CA-5, CA-11)
  - Archivos: e2e/pet.spec.ts, e2e/games-play.spec.ts
  - Test primero:
    - e2e/pet.spec.ts: se conservan la prueba R-3 y las de vertical (CA-2) y se les agrega que
      `[data-app-bar="top"]` y `[data-app-bar="bottom"]` se ven y "Salir" no. Se reemplaza el bloque
      horizontal de la 012 (y el comentario de D-7) por: CA-1 (barras ocultas; la caja del marco del
      iframe es `{0, 0, clientWidth, clientHeight}` ±1 px; sin scroll en documento ni marco); CA-3
      (marca en el elemento iframe y en su ventana, contador de pedidos a `/pet-game-stub`, giro a
      vertical y vuelta con `page.setViewportSize`: barras y aviso según orientación, misma marca,
      misma ventana, un solo pedido); CA-4 (cargando con `POST /pet/session/init` retenido, error con
      500, juego: "Salir" visible, ≥ 44 × 44, dentro del viewport, `elementFromPoint` de su centro es el
      enlace, tocarlo lleva a `/home`; en error no se cruza con "Reintentar"); CA-5 (`test.use` con 1280 ×
      800, `isMobile: false`, `hasTouch: false`: barra de escritorio visible, barras del celular y "Salir"
      ocultos, iframe dentro de `main` y no `position: fixed`); ventana angosta de escritorio (900 × 500
      sin táctil): barras del celular visibles y "Salir" oculto.
    - e2e/games-play.spec.ts (CA-11), con la URL de `/games/play` de `e2e/support/pages.ts`: horizontal
      740 × 360: barras ocultas, la caja del iframe ocupa el viewport (±1 px), sin scroll, "Volver"
      visible, ≥ 44 × 44, tocarlo lleva a `/games`. Vertical 360 × 740: el contenedor `fixed` con el
      iframe girado y "Volver" visible de ≥ 44 px (igual que hoy).
    - Deben fallar hoy: CA-1, CA-3 (barras visibles), CA-4 (no existe "Salir"), CA-11 horizontal y
      CA-2 (no existen los `data-app-bar`). CA-5 y la ventana angosta deben fallar solo por los
      `data-app-bar`. Anota en "Hecho" qué falló.
  - Verificar: npm run build:e2e && npx playwright test e2e/pet.spec.ts e2e/games-play.spec.ts --project=mobile-360 (rojo esperado)
  - Comprobar: no aplica.
  - Nota: en rojo: CA-2 vertical (sin `data-app-bar`), CA-1, CA-3, los tres CA-4, CA-11 horizontal y la ventana angosta; CA-5 falló solo por los `data-app-bar` (se exige `toHaveCount(1)` porque `toBeHidden` pasa con elementos inexistentes).

- [x] T5 · Variante `immersive` y barras que se ocultan (CA-1, CA-3, CA-11; base de T6 y T7)
  - Archivos: src/app/globals.css, src/components/bars/NavBar.tsx, src/app/(consumer)/layout.tsx
  - Test primero: los de T4 (siguen rojos al terminar esta tarea: aún ninguna página pone
    `data-immersive`; lo que debe pasar ya es CA-2, CA-5 y la ventana angosta).
  - Cambios: `@custom-variant immersive` en `globals.css` (plan 3.1, con su comentario en español);
    `data-app-bar="top"` + `immersive:hidden` en la barra superior del celular, `data-app-bar="bottom"`
    + `immersive:hidden` en la inferior, `immersive:hidden` en la hoja del menú de Perfil;
    `immersive:pb-0` en el `<main>` del layout (sigue de servidor). Si Tailwind 4.2 no acepta el
    selector anidado `:where(body:has([data-immersive])) &` dentro de `@custom-variant`, se escriben
    las mismas reglas como CSS plano en `globals.css` sobre los `data-app-bar` y se anota la desviación.
  - Verificar: npm run build && npx tsc --noEmit && npm run lint:ci && npm run build:e2e && npx playwright test e2e/pet.spec.ts --project=mobile-360 -g "vertical|CA-5|angosta"
  - Comprobar: en `.next/static/css`, la regla generada de `immersive:hidden` lleva la consulta
    `(orientation: landscape) and (pointer: coarse) and (width < 64rem)` y `body:has([data-immersive])`.

- [x] T6 · `/pet` a pantalla completa con "Salir" (CA-1, CA-2, CA-3, CA-4, CA-5)
  - Archivos: src/app/(consumer)/pet/page.tsx, src/components/PetGame.tsx
  - Test primero: e2e/pet.spec.ts (T4).
  - Cambios: `<section data-immersive>` con `immersive:fixed immersive:inset-0 immersive:z-30
    immersive:p-0`; marco de `PetGame` con `immersive:rounded-none immersive:border-0
    immersive:shadow-none`; enlace `next/link` "Salir" a `/home` en la página (fuera de `PetGame`, para
    que se vea en cargando, error y juego): `hidden immersive:flex`, `min-h-11 min-w-11`, `bg-black/50`,
    texto blanco, ícono `ArrowLeft` con `aria-hidden`, arriba a la izquierda con
    `max(0.75rem, env(safe-area-inset-*))`, `immersive:z-[31]`. La página sigue de servidor (sin
    `'use client'`, P-2); `PetGame` no gana estado. Comentario de la cabecera de la página actualizado
    (ya no "todo el alto bajo la navbar").
  - Verificar: npm run build:e2e && npx playwright test e2e/pet.spec.ts e2e/touch.spec.ts e2e/layout.spec.ts --project=mobile-360 -g "pet|/pet" && npm run build && npx tsc --noEmit && npm run lint:ci
  - Comprobar: DevTools con un dispositivo táctil de 740 × 360 en `/pet`: sin barras, juego de borde a
    borde, "Salir" arriba a la izquierda; girar a 360 × 740 y volver: en la pestaña Red no hay un segundo
    pedido al juego; tocar "Salir" lleva a `/home`. A 1280 px, `/pet` igual que antes y sin "Salir".

- [x] T7 · `/games/play` a pantalla completa en horizontal (CA-11)
  - Archivos: src/app/(consumer)/games/play/page.tsx
  - Test primero: e2e/games-play.spec.ts (T4).
  - Cambios: `data-immersive` en el contenedor de la rama horizontal; el alto calculado pasa a la
    variable `--game-h` (`h-(--game-h)`, con `as React.CSSProperties`, sin `any`) y en `immersive`
    `fixed inset-0 h-auto z-30`; el "Volver" del celular en `immersive` va arriba a la izquierda en el
    área segura (`immersive:top-… immersive:bottom-auto immersive:z-[31]`), mismo texto y 44 px. La rama
    vertical (`shouldRotate`) y el botón de escritorio no cambian. El cálculo de `gameHeight` no cambia.
  - Verificar: npm run build:e2e && npx playwright test e2e/games-play.spec.ts e2e/layout.spec.ts e2e/touch.spec.ts --project=mobile-360 -g "games" && npm run build && npx tsc --noEmit && npm run lint:ci
  - Comprobar: en DevTools táctil 740 × 360, `/games/play?url=<juego de prueba>`: el juego llena la
    pantalla y "Volver" arriba a la izquierda lleva a `/games`. Si el juego manda `PRODUCT_CLICKED`, el
    carrito se abre **encima** del juego. En vertical, igual que hoy.

## Bloque C · Bug de "Me gusta" en `/ads`

- [x] T8 · API simulada: medios en loopback y "me gusta" (CA-12)
  - Archivos: e2e/support/mockRoutes.mjs, e2e/support/mockApi.mjs, __tests__/e2e-support/mockApi.test.ts,
    e2e/fixtures/media/ad-9x16-1s.webm, e2e/fixtures/media/ad-9x16-10s.webm, e2e/fixtures/media/ad-16x9.png,
    e2e/fixtures/api/ads/next-video-short.json, e2e/fixtures/api/ads/next-image.json,
    e2e/fixtures/api/ads/like.json, e2e/fixtures/api/ads/next.json (solo si D-4)
  - Test primero: __tests__/e2e-support/mockApi.test.ts. Casos: `GET /media/ad.webm` → 200,
    `Content-Type: video/webm`, cuerpo con los bytes que da el lector binario; `.png` → `image/png`;
    `/media/..%2Fapi%2Fx.json` y `/media/x.exe` → 404 y quedan en `/__unmatched`; `POST /adLike/like`
    → el fixture `like.json`. Falla antes porque la ruta y la entrada no existen.
  - Cambios: ruta `/media/<archivo>` en el enrutador (puro: devuelve qué archivo leer y su tipo) y
    lectura con `Buffer` en `mockApi.mjs`; si Chromium rechaza el 200 entero del video (R-4), se agrega
    `206` con `Content-Range`. Medios con `ffmpeg` (color sólido, sin audio), por ejemplo
    `ffmpeg -f lavfi -i color=c=0x0b2448:s=180x320:r=10:d=1 -an -c:v libvpx -b:v 30k ad-9x16-1s.webm`
    (y `d=10` para el de 10 s; `-frames:v 1` a 320 × 180 para el PNG); cada uno < 50 KB. Los JSON de
    anuncio copian `next.json` con `contentUrl` en `http://127.0.0.1:4010/media/…` (`durationSeconds: 1`
    en el de imagen). D-4: `next.json` apunta al WebM de 10 s.
  - Verificar: npx vitest run __tests__/e2e-support/mockApi.test.ts && npx tsc --noEmit && npm run build:e2e && npx playwright test e2e/layout.spec.ts e2e/touch.spec.ts e2e/rn4.spec.ts --project=mobile-360 -g "/ads|fila 14"
  - Comprobar: con `node e2e/support/mockApi.mjs` levantado,
    `curl -sI http://127.0.0.1:4010/media/ad-9x16-1s.webm` da `200` y `video/webm`; con D-4, la corrida
    de `/ads` ya no muestra el aviso de `settle`.
  - Nota: visto en rojo (404 en `/media` y `/adLike/like`) y luego en verde (23 pruebas). `mockApi.mjs` lee los medios con `readBinary` (carpeta `e2e/fixtures/media`, solo nombres simples). Chromium aceptó el 200 entero del video: no hizo falta `206` (R-4). D-4 aplicada: `next.json` apunta al WebM de 10 s (`durationSeconds` 10). Medios: `ad-9x16-1s.webm` 953 B, `ad-9x16-10s.webm` 3745 B, `ad-16x9.png` 631 B.

- [x] T9 · Prueba de CA-12, en rojo con el código de hoy (CA-12, P-17)
  - Archivos: e2e/ads.spec.ts
  - Test primero: e2e/ads.spec.ts (plan 9.2): cuatro casos, video e imagen a 360 × 740 y 740 × 360, con
    sesión; `page.route('**/adLike/next')` sirve `next-video-short.json` o `next-image.json` (ruta
    relativa al archivo de la prueba); `test.use({ launchOptions: { args:
    ['--autoplay-policy=no-user-gesture-required'] } })`; el caso de video comprueba primero que el
    `<video>` no está en pausa (mensaje de R-3 si sí); espera "Me gusta" (≤ 10 s); mide caja completa
    dentro del viewport y por encima de `nav[aria-label="Navegación inferior"]` (si T3 aún no está, el
    `nav.fixed.bottom-0`), `elementFromPoint` de su centro → el botón, `scrollHeight ≤ clientHeight`;
    `tap()` y `waitForRequest` de `POST …/adLike/like`. Cabecera con el comando de `ffmpeg` de T8.
  - Debe fallar en los cuatro casos con el código de hoy. **Anota en "Hecho", caso por caso, qué
    aserción falló** (alto del documento, botón fuera del viewport o bajo la barra, otro elemento en su
    centro, toque interceptado): eso confirma o corrige el diagnóstico de plan 2.4 antes de T10.
  - Verificar: npm run build:e2e && npx playwright test e2e/ads.spec.ts --project=mobile-360 (rojo esperado, con fallos de aserción y no de tiempo de espera del medio)
  - Comprobar: no aplica.
  - Nota: en rojo con el código de hoy, cuatro casos, todos por aserción (el video arrancó en los dos casos de video). Aserciones blandas (`expect.soft`) para ver todas las causas:
    - vertical 360 × 740, video: solo el alto del documento (817 > 740). El botón está completo y recibe el toque: el diagnóstico (4) no se confirma aquí.
    - vertical, imagen: el elemento en el centro del botón es el marco, no el botón (botón recortado por el `overflow-hidden` del marco), y el alto del documento (817 > 740).
    - horizontal 740 × 360, video: borde inferior fuera de la pantalla (395,5 > 360) y bajo la barra inferior, el elemento en su centro es el enlace "Mascota" de la barra, y alto del documento 437 > 360.
    - horizontal, imagen: borde inferior bajo la barra inferior (317,5 > 296), elemento en el centro = el marco (recortado) y alto del documento 437 > 360.
    - Confirmado: (1) el documento más alto que la pantalla en los cuatro, y (2)/(3) botón recortado o fuera de pantalla en horizontal y en imagen vertical. No confirmado: (4) "Visitar"/"Compartir" encima del botón (no apareció en ningún caso; se aplicó igual la capa más alta del aviso como defensa). Corrección al plan: la barra superior mide 82 px, no 69, y el 100 % del `main` no basta porque el `main` del layout crece con su contenido (`min-height: auto`): el video 9:16 a 360 px de ancho pide 640 px y empujaba la página a 786 px.

- [x] T10 · Arreglo de "Me gusta" en el celular (CA-12)
  - Archivos: src/app/(consumer)/ads/page.tsx, src/components/consumer/ads/VideoAdPlayer.tsx
  - Test primero: e2e/ads.spec.ts (T9).
  - Cambios (los que la prueba de T9 justifique, plan 8.3): raíz de la página `h-full` en celular sin
    los 69 px fijos y sin el `pb-16` interno (lo de `lg:` igual); medio limitado al alto del contenedor
    en celular (`max-h-full`; `lg:` igual); el aviso "¡Anuncio completado!" cubre el contenedor del
    reproductor (`containerRef`) y no solo el marco del medio, por encima del bloque de información; los
    controles del celular no se pintan mientras se ve el aviso; tarjeta compacta en alturas cortas
    (`[@media(max-height:30rem)]:`). Textos, flujo de "me gusta" y recompensa sin cambios. D-5: quitar
    `console.log('Guardar:', currentAd)` y `console.log('Link copiado:', …)`.
  - Verificar: npm run build:e2e && npx playwright test e2e/ads.spec.ts e2e/layout.spec.ts e2e/touch.spec.ts e2e/rn4.spec.ts --project=mobile-360 -g "ads|/ads|fila 14" && npm run build && npx tsc --noEmit && npm run lint:ci
  - Comprobar: DevTools táctil a 360 × 740 y 740 × 360 en `/ads` con la API local: al terminar un anuncio
    se ve "¡Anuncio completado!" entero sobre la barra inferior, "Visitar" y "Compartir" no lo tapan, un
    toque en "Me gusta" muestra la recompensa. A 1280 px, `/ads` igual que antes.
  - Nota: desviación del plan 8.3: en vez de mover el aviso al contenedor, en el celular (< md) el marco llena el contenedor (`w-full h-full`) y el video y la imagen usan `w-full h-full object-contain`, así que el aviso (que sigue dentro del marco, ahora `z-[35]`) tiene todo el espacio; desde `md` queda igual que antes. La raíz de `/ads` es `h-full` y su contenido va `max-lg:absolute max-lg:inset-0` (si no, el `main` del layout crece con el alto natural del video y la página sigue desbordando); se quitó el `pb-16` interno. Tarjeta compacta con `[@media(max-height:30rem)]:`, controles "Visitar"/"Compartir" `invisible` mientras se ve el aviso. D-5: quitados los dos `console.log` (`handleSave` queda sin efecto). Verde: ads (4), layout, touch, navbar, pet y smoke en `mobile-360` (161 pruebas); `ads` en `tablet-768`/`mobile-390` (layout) bien. `build`, `tsc`, `npm test` (709) y `lint:ci` (348 avisos, tope 348, sin cambio) en verde. Sin comprobación manual en DevTools.

## Bloque D · Pruebas y puertas

- [x] T11 · Tabla de la pasada manual en `spec.md` (CA-10)
  - Archivos: specs/013-mobile-games-fullscreen/spec.md
  - Test primero: no aplica (documentación).
  - Cambios: sección final "Resultados de la pasada en celulares" con la tabla
    `Comprobación | Android (modelo, Chrome N) | iPhone (modelo, iOS N) | Notas` y una fila por punto:
    `/pet` horizontal sin barras; "Salir" visible en cargando (modo avión al entrar), error y juego, y
    lleva a `/home`; girar varias veces sin recarga (la mascota no reinicia); `/pet` vertical con barras
    y aviso; `/games/play` horizontal sin barras y "Volver" a `/games`; barra inferior con Juegos hasta
    tocar "¡Jugar ahora!"; Rifas desde Perfil; "Me gusta" de `/ads` al final de un video y de una imagen,
    en vertical y en horizontal; "Salir"/"Volver" no tapan botones del juego real (D-2, R-7).
  - Verificar: la sección existe con todas las filas y las celdas vacías para el usuario.
  - Comprobar: no aplica.
  - Nota: sección añadida al final de `spec.md` con 15 filas (el punto de "Me gusta" separado en 4: video/imagen x vertical/horizontal; "Salir" separado en cargando, error y juego), celdas vacías.

- [x] T12 · Pruebas de navegador completas y capturas de escritorio (CA-5, CA-9)
  - Archivos: ninguno (si algo falla, se corrige en la tarea que corresponde)
  - Test primero: no aplica.
  - Verificar: npm run build:e2e && npm run test:e2e && npx playwright test --project=desktop-1280 (sin `--update-snapshots`; las diez capturas sin diferencias, en la misma máquina que las generó) && git diff --stat main -- src/app/admin src/app/commercial src/app/compliance src/app/game-designer src/components/Admin src/components/commercial src/components/compliance src/components/game-designer (vacío)
  - Comprobar: anota en "Hecho" la duración de `npm run test:e2e` (debe dejar margen bajo los 10 min
    del job) y que no hubo avisos de `settle` en `/ads`.
  - Nota: `test:e2e` 271 pasadas, 102 omitidas, 3 min 44 s (una primera corrida: 270 pasadas y 1 fallo por tiempo agotado en `smoke` mobile-390, 5 min 40 s; aislada y en la segunda corrida pasó, se toma como intermitente por carga). `desktop-1280`: 10 capturas sin diferencias, sin `--update-snapshots`. Sin avisos de `settle` en `/ads` (queda uno en `/games`, en la primera corrida). `git diff --stat main` de las carpetas de otros roles no está vacío (36 archivos) pero son cambios ya commiteados en la rama; el árbol de trabajo no toca ninguna.

- [x] T13 · Puertas finales (CA-9)
  - Archivos: .lint-max-warnings solo si `lint:ci` pide bajarlo
  - Test primero: no aplica.
  - Verificar: npm test && npm run lint:ci && npm run build && npx tsc --noEmit && npm run audit:ci
  - Nota: lint:ci 0 errores y 348 avisos (tope sin cambio), npm test 709, build, tsc y audit:ci en verde.
  - Comprobar: `.lint-max-warnings` ≤ 348; ningún `'use client'` nuevo en páginas ni layouts
    (`git diff main -- 'src/app/**/page.tsx' 'src/app/**/layout.tsx' | grep "use client"` vacío);
    ningún `any` ni `console.*` nuevo en el diff; `package.json` y `package-lock.json` sin cambios.

## Pasos del usuario

- [ ] U-1 · Pasada manual en el Android y el iPhone reales (CA-10): llenar la tabla de T11 con "Cumple" o
  el defecto encontrado. Con la beta o con `next start` en la red local, la API levantada y una cuenta de
  consumidor de pruebas.

## Correcciones de la ronda 1 de revisión

- [x] Bloqueante 1: `await settle(page)` tras el `toHaveURL` en `e2e/games-play.spec.ts` y en `e2e/navbar.spec.ts` ("tocar Juegos"); el fixture `e2e/fixtures/api/games/list.json` usa `/categories/deporte.jpg` (22 KB) en vez de `juguetes.jpg` (805 KB). Las demás pruebas nuevas (`pet.spec.ts`, `ads.spec.ts`) ya esperan o no navegan a otra página al terminar. Dos corridas `CI=1 npx playwright test --retries=0` (la segunda sin `.next/standalone/.next/cache/images`): 261 pasan, 102 omitidas.
- [x] Sugerencia 1: en `VideoAdPlayer.tsx` el `z-[35]` del aviso y la compactación por altura corta quedan solo por debajo de `md` (`max-md:`); desde `md` es como en `HEAD`.
  - Nota: la compactación por altura ya no aplica a celulares en horizontal con ancho >= 768 px; ahí el aviso se ve como en escritorio.
- [x] Sugerencia 2: Rifas va después de Juegos en `MOBILE_MENU_ITEMS`; `mobileNav.test.ts` fija el orden y `rn4.spec.ts` sigue el mismo orden.
- [x] Sugerencia 4: quitados los `as unknown as Router` de `__tests__/e2e-support/mockApi.test.ts` (`body?: string | Uint8Array`).

## Correcciones de la ronda 2

- [x] Bloqueante (RN-9, CA-12): el arreglo del celular en `/ads` pasa de `max-md:` a `max-lg:` (la barra inferior se ve hasta `lg`). En `VideoAdPlayer.tsx`: marco que llena el contenedor, clases del video y la imagen, `z-[35]` del aviso y compactación por altura corta. Desde `lg` queda como en `HEAD`. `ads/page.tsx` ya usaba `max-lg:`.
  - Pruebas: `e2e/ads.spec.ts` suma 932 × 430, 915 × 412 y tableta 768 × 1024 (video e imagen). Antes del arreglo fallaron 5 de los 6 casos nuevos (el video de 768 × 1024 ya pasaba); con el arreglo pasan los 6.
