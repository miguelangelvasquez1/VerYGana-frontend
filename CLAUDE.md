# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — runs `next dev --turbopack` wrapped in `infisical run`, so env vars come from Infisical (workspace in `.infisical.json`, env `dev`). You need the Infisical CLI logged in; otherwise run `npx next dev --turbopack` with a local `.env`.
- `npm run build` / `npm run start` — production build / serve.
- `npm run lint` — `next lint` (ESLint 9 flat config in `eslint.config.mjs`).
- No test runner is configured, and there are no CI workflows (`.github/workflows` is empty).

## Stack

Next.js 15 (App Router, Turbopack) + React 19, TypeScript, Tailwind 4, next-auth v4, axios, TanStack Query, react-hook-form + zod. Path alias `@/*` → `src/*`. UI copy and many code comments are in Spanish.

This is the frontend for a Spring-style backend (default `http://localhost:8080`). Platform with roles: CONSUMER, COMMERCIAL, ADMIN, COMPLIANCE_OFFICER, GAME_DESIGNER.

## Architecture

**Routing / roles.** `src/app/` is split by role: `(consumer)` (route group, public URLs like `/home`, `/products`, `/pet`), `commercial/`, `admin/`, `compliance/`, `game-designer/`, plus `(auth)` and public pages. [src/middleware.ts](src/middleware.ts) enforces role access via next-auth `withAuth`, but **it is a no-op unless `MIDDLEWARE=ACTIVE`** (dev mode lets everything through). Its `config.matcher` is a literal list — a new protected route must be added there *and* to the role checks in the function body. The `/admin` matcher is currently commented out.

**API layer.** Everything goes through the shared axios instance in [src/lib/api/client.ts](src/lib/api/client.ts) (`NEXT_PUBLIC_API_URL`), consumed by `src/services/*Service.ts` (plain functions/objects per backend domain, subfolders `admin/`, `commercial/`, `games-campaigns/`), which are in turn wrapped by React Query hooks in `src/hooks/**`. Types per domain live in `src/types/`. The response interceptor handles cross-cutting concerns globally: 503 toast, 402 → `paymentRequiredBus` (wallet-recharge modal), 400 plan-change-block → `planChangeBlockBus`, and 401 → refresh-and-retry once, else `signOut` + redirect to `/login`. Don't re-implement these in services/components.

**Auth/token flow.** next-auth uses a `credentials-sync` provider ([src/lib/auth/authOptions.ts](src/lib/auth/authOptions.ts)): the backend issues the JWT; the frontend decodes it (`parseJwt`) and stores `accessToken`, `publicId`, `role` in the next-auth JWT session (7 days). Users are identified by `publicId` (UUID), never the internal id. Client requests read the token from an in-memory store ([src/lib/auth/tokenStore.ts](src/lib/auth/tokenStore.ts)) synced by `<AuthProvider>` ([src/app/providers/AuthProvider.tsx](src/app/providers/AuthProvider.tsx)); refresh is centralized with a single-flight lock in `tokenRefresh.ts` and broadcast across tabs. Server-side code (SSR product pages) uses `getSession()` instead. [plan-token-serverside.md](plan-token-serverside.md) is a *proposed* (not implemented) migration to a BFF proxy under `/api/proxy/*` so the JWT stops being exposed to client JS — check it before touching auth/token code.

**Requests that bypass `apiClient`** (and so need token handling by hand): `LevelService` (raw `fetch` with a token param), private images (`?token=` in the URL), notifications SSE (`useNotifications`/`NotificationService`), and the `adService` keepalive beacon. `src/app/api/proxy-download/route.ts` is the only custom API route besides next-auth.

**File uploads.** The backend hands out presigned URLs and the browser PUTs straight to Cloudflare R2 (see `FileUploadService`, `hooks/pets/*Upload*`). A failure that only happens in the browser is usually bucket CORS in Cloudflare, not code.

**Pet game (Unity WebGL).** `/pet` embeds a Unity build hosted on R2. [next.config.ts](next.config.ts) rewrites `/pet-game/*` and `/pet-assets/*` to the R2 public domain so the game page is same-origin (avoids mixed content / Local Network Access blocks / missing CORS on scene assets). Locally the backend needs `PETS_ASSET_BASE_URL=http://localhost:3000/pet-assets`. Session state for the game is in `src/hooks/pet/usePetSession.ts`.

**Real-time.** WebSocket via `@stomp/stompjs` + `sockjs-client` (`NEXT_PUBLIC_WS_URL`) and SSE for notifications.

**Dynamic game forms.** Game campaign configuration forms are generated from JSON Schema with `@rjsf/*` (shadcn theme).

## Environment variables

`API_URL` (server-side backend URL, falls back to `NEXT_PUBLIC_API_URL`), `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_PET_GAME_URL`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `NEXTAUTH_SECRET`, `MIDDLEWARE` (`ACTIVE` to enforce role guards), and `NEXT_PUBLIC_CONTACT_*`. Remote images are restricted to the hosts in `next.config.ts` `images.remotePatterns` — add new CDN hosts there.

## Skills

`.claude/skills` (mirrored in `.agents/skills`) ships UI/animation skills (frontend-design, emil-design-eng, apple-design, improve-animations, vercel-react-best-practices, etc.) — use them for UI polish work.
