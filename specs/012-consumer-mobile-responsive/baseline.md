# 012 · Línea base (T1)

Medida el 2026-10-23 sobre `beta-front` en `4af0956` (con los cambios sin commitear ajenos a esta
spec), antes de tocar código de la spec, con `npm run build` y las variables públicas ficticias de
`CLAUDE.md`. Next 15.5.27. "First Load JS" tal como la imprime `next build`.

## Avisos de lint

- `npm run lint`: **360 avisos**, 0 errores.
- `.lint-max-warnings`: **360**. Coinciden.

## First Load JS por ruta del alcance (RN-8)

Compartido por todas las rutas: 102 kB.

| # | Ruta | Size (antes) | First Load JS (antes) | First Load JS (después) |
|---|------|--------------|-----------------------|-------------------------|
| 1 | `/` | 10.6 kB | 131 kB | 131 kB |
| 2 | `/login` | 7.19 kB | 157 kB | 157 kB |
| 3 | `/register` | 10.7 kB | 170 kB | 170 kB |
| 4 | `/verify` | 7.07 kB | 154 kB | 154 kB |
| 5 | `/ads` | 10.9 kB | 162 kB | 161 kB |
| 6 | `/checkout` | 5.23 kB | 146 kB | 152 kB (+6, sube) |
| 7 | `/commercial/[id]` | 2.45 kB | 154 kB | 157 kB (+3, sube) |
| 8 | `/forum` | 9.1 kB | 156 kB | 156 kB |
| 9 | `/home` | 8 kB | 119 kB | 119 kB |
| 10 | `/pet` | 2.55 kB | 140 kB | 140 kB |
| 11 | `/support` | 844 B | 148 kB | 148 kB |
| 12 | `/surveys` | 12.8 kB | 172 kB | 172 kB |
| 13 | `/explore/favorites` | 3.55 kB | 154 kB | 154 kB |
| 14 | `/explore/gamification` | 8.39 kB | 161 kB | 161 kB |
| 15 | `/explore/participations` | 8.26 kB | 146 kB | 146 kB |
| 16 | `/explore/profile` | 4.47 kB | 146 kB | 146 kB |
| 17 | `/explore/profile/edit` | 45.2 kB | 186 kB | 182 kB |
| 18 | `/explore/purchases` | 7.9 kB | 155 kB | 155 kB |
| 19 | `/explore/referrals` | 10.9 kB | 203 kB | 203 kB |
| 20 | `/explore/transactions` | 4.87 kB | 143 kB | 143 kB |
| 21 | `/games` | 3.61 kB | 141 kB | 147 kB (+6, sube) |
| 22 | `/games/play` | 3.77 kB | 142 kB | 142 kB |
| 23 | `/plans/mobile-plans` | 6.37 kB | 109 kB | 109 kB |
| 24 | `/products` | 6.8 kB | 154 kB | 158 kB (+4, sube) |
| 25 | `/products/[id]` | 2.71 kB | 148 kB | 148 kB |
| 26 | `/purchases/[id]/confirmation` | 3.72 kB | 155 kB | 164 kB (+9, sube) |
| 27 | `/raffles` | 6.4 kB | 148 kB | 148 kB |
| 28 | `/raffles/[id]` | 2.73 kB | 144 kB | 144 kB |
| 29 | `/raffles/[id]/live` | 36.1 kB | 224 kB | 224 kB |
| 30 | `/raffles/[id]/results` | 4.8 kB | 143 kB | 143 kB |

## Después (T26, 2026-10-24)

`npm run build` con las variables ficticias, tras los bloques 0 a 5. Compartido: 102 kB. Rutas que
suben: `/checkout` (+6), `/commercial/[id]` (+3), `/games` (+6), `/products` (+4) y
`/purchases/[id]/confirmation` (+9); bajan `/ads` (-1) y `/explore/profile/edit` (-4); las otras 23
quedan igual. Causas (comprobadas por el reviewer comparando `next build` de `HEAD` con el árbol actual,
ruta por ruta, con `.next/app-build-manifest.json`):

- `/checkout` y `/games`: el chunk del runtime de `next/image` (5,2 kB comprimido), que RN-8 pide.
- `/purchases/[id]/confirmation` (+9): suma `next/image` (5,2 kB) **y** el runtime de `next/link`
  (3,4 kB), porque la página pasó sus botones a `Link` (RN-5).
- `/products` y `/commercial/[id]`: `ConsumerProductCard` dejó `useRouter` + `<div onClick>` y pasó a
  `Link` (T19, RN-5); la entrada de ambas páginas arrastra ahora el chunk de `next/link` (3,4 kB). Su
  tamaño propio casi no cambia (`/products` 6,8 -> 6,77 kB).
- No es peso real descargado: los chunks de `next/link` y `next/image` ya están en la lista del layout de
  consumidor (los usa `NavBar`), así que el navegador ya los tiene; "First Load JS" los cuenta otra vez
  por página. Solo crece el chunk propio de cada página (menos de 0,7 kB).
- La bajada de `/explore/profile/edit` (186 -> 182) no es de esta spec: viene de Next 15.5.28 (la
  actualización de seguridad); `HEAD` con esa versión ya da 182. `/checkout` y `/login` se mueven 1 kB
  por la misma razón. `/ads` (-1) sí es de la spec (bloque del `Sidebar`).

Veredicto: subida explicada y justificada por RN-5 y RN-8; no hay código que corregir.
Lint: 348 avisos, `.lint-max-warnings` en 348 (antes 360).
