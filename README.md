# Wingz Ride Management UI

> React + Vite single-page admin console for the Wingz ride management API — built for the Wingz AI Solutions Engineer (Full Stack) take-home assessment.

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white)](https://eslint.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

**Live demo:** [`https://wingz-ride.d3sarrollo.dev`](https://wingz-ride.d3sarrollo.dev) &nbsp;·&nbsp; Login: `admin@wingz.com` / `adminpass123`

Backend repository: [`../ride0/`](../ride0/README.md).

---

## Table of Contents

- [30-Second Overview](#30-second-overview)
- [Feature Walkthrough](#feature-walkthrough)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [API Layer](#api-layer)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [Known Limitations & Future Work](#known-limitations--future-work)
- [Deployment](#deployment)
- [License](#license)

---

## 30-Second Overview

A small, fast, dependency-minimal React 19 + Vite 8 single-page app that consumes the [ride0 Django API](../ride0/README.md). It covers the full admin surface the take-home asks for: sign-in, paginated ride list, column filters, sort by pickup time, sort by distance from a geolocation, a slide-out ride detail drawer, and a bonus trips-over-hour report. Every filter and pagination slice is deep-linkable via URL parameters, and session expiry is handled transparently with a one-shot refresh round-trip.

Highlights at a glance:

- **Zero runtime dependencies beyond React and React-DOM.** No Redux, no Tailwind, no router library, no CSS-in-JS runtime
- **URL-synced filter state** via a ~40-line custom hook — refresh, share a link, hit back/forward, state survives
- **Automatic JWT refresh on 401** inside the `apiFetch` wrapper, transparent to every caller
- **Single-origin deployment** — nginx reverse-proxies `/api/` to gunicorn, so the browser never makes a cross-origin request and there is no CORS plumbing to get wrong
- **Plain CSS with design tokens** — every colour, radius, spacing, and font scale lives in `src/styles/tokens.css`

Jump to [Quick Start](#quick-start) to run it locally against the backend, [Architecture](#architecture) for the component tree and refresh flow, or [Design Decisions](#design-decisions--trade-offs) for the reasoning behind every non-obvious choice.

---

## Feature Walkthrough

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Wingz Admin    Rides                             AU  admin@wingz.com [⎋]│
├─────────────────────────────────────────────────────────────────────────┤
│ [  Rides  |  Reports  ]                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Status: en-route  ▾    Rider: alice@…    Sort: Pickup time  ▾    [×]    │
├──────┬─────────────┬──────────────┬────────────┬──────────────────────┤
│  ID  │   Status    │    Rider     │   Driver   │     Pickup time      │
├──────┼─────────────┼──────────────┼────────────┼──────────────────────┤
│  #4  │  en-route   │  Alice J.    │  Chris H.  │ 2026-04-11 08:00 UTC │
│ #12  │  pickup     │  Bob M.      │  Howard Y. │ 2026-04-11 08:15 UTC │
│  …   │             │              │            │                      │
├──────┴─────────────┴──────────────┴────────────┴──────────────────────┤
│                          «  1  2  3  4  »                               │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Login.** `LoginForm.jsx` posts `{ email, password }` to `/api/auth/login/` and stores the returned access + refresh tokens in `localStorage`. Session-expired flashes surface as a friendly banner on the login screen the next time the user lands there.
- **Ride list.** Paginated table with per-column sort indicators. Clicking a header toggles the sort and resets the page cursor to 1 so users never land on an empty page after a sort change.
- **Filter bar.** Status, rider email (debounced 300 ms), sort mode (pickup time / distance), geolocation lat+lng input, and page size. Every control is URL-synced.
- **Distance sort.** The browser's `navigator.geolocation` fills in lat/lng if the user grants permission. `navigator.geolocation` is a secure-context API — it silently no-ops on plain `http://`, which is why the production deployment uses HTTPS on a real domain.
- **Ride detail drawer.** Clicking a row loads `/api/rides/{id}/` and slides a panel in from the right with the full ride payload: rider, driver, pickup + dropoff coordinates, and the last-24-hour event list.
- **Reports tab.** Toggles `App.jsx`'s `view` state from `'rides'` to `'reports'` and renders `TripsReport.jsx`, which calls `GET /api/reports/trips-over-hour/` and displays the bonus-SQL result as a table (month, driver, count of trips over one hour).
- **Session expiry handling.** Any 401 from the API triggers a silent refresh. If the refresh itself fails, the tokens are cleared, the main view is unmounted, and the user is routed back to `LoginForm` with a flash message. All of this is implemented in `src/services/api.js::apiFetch()`.

---

## Quick Start

The frontend talks to the ride0 backend, so start the backend first.

```bash
# 1. Backend (in its own terminal)
cd ride0/backend
USE_SQLITE=1 python manage.py migrate
USE_SQLITE=1 python manage.py seed_db
USE_SQLITE=1 python manage.py runserver

# 2. Frontend (this repo)
cd ride1
cp .env.example .env.local      # optional — defaults are correct for localhost
npm install
npm run dev                     # → http://localhost:5173
```

Open `http://localhost:5173`, log in with `admin@wingz.com` / `adminpass123`, and the ride list loads.

**Dev vs production proxy.** In development, Vite proxies `/api` to `VITE_API_BASE_URL` with `changeOrigin: true`. In production, nginx does the same thing with the same path. Because of that symmetry, `src/services/api.js` always hits `/api/...` — it never constructs an absolute backend URL, and there is no hostname baked into the bundle.

---

## Environment Variables

```bash
# ride1/.env.example
VITE_API_BASE_URL=http://localhost:8000
```

| Variable | Purpose | Required | Default |
|---|---|---|---|
| `VITE_API_BASE_URL` | Target that Vite's dev proxy forwards `/api/*` to | no | `http://localhost:8000` |

**Note on the removed vars.** An earlier iteration of this project used `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` to inline HTTP Basic credentials into the client bundle at build time. That was a credential leak even with a seeded admin. Both variables have been removed; the app now uses a real JWT login form that posts to `/api/auth/login/`.

---

## Architecture

### Component tree

```text
App.jsx
├── (unauthenticated)
│   └── LoginForm            # email + password, POST /api/auth/login/
│
└── (authenticated)
    ├── AppHeader            # logo, current user, logout
    ├── Nav                  # [ Rides | Reports ] toggle
    │
    ├── view === 'rides'
    │   ├── FilterBar        # status, rider_email, sort, lat+lng, page size
    │   ├── SkeletonRow      # (while loading)
    │   ├── EmptyState       # (when filters return zero rows)
    │   ├── RideTable        # paginated table + per-column sort
    │   ├── Pagination       # first / prev / page buttons / next / last
    │   └── RideDetailDrawer # slide-out, fetches GET /api/rides/{id}/
    │
    └── view === 'reports'
        └── TripsReport      # fetches GET /api/reports/trips-over-hour/
```

### State management

All state is plain `useState` inside `App.jsx`. There is no Context, no Redux, no Zustand, and no router library. Filter and pagination state is persisted to the URL by `useSearchParamsState`, a ~40-line custom hook that wraps `URLSearchParams` and listens for `popstate` so back/forward navigation replays the state correctly. This lets any filtered view be deep-linked, bookmarked, or shared.

### The `apiFetch` wrapper

`src/services/api.js` exports an authenticated fetch wrapper that every API call flows through. Its core responsibility is injecting the `Authorization: Bearer …` header, but it also implements the single-attempt refresh retry:

```text
Component           api.js                            Django
    │─fetchRides()───▶│
    │                 │─GET /api/rides/ + access_A ──────▶│
    │                 │◀── 401 token_expired ─────────────│
    │                 │                                   │
    │                 │─POST /auth/refresh/ + refresh ───▶│
    │                 │◀── 200 { access_B } ──────────────│
    │                 │                                   │
    │                 │─GET /api/rides/ + access_B ──────▶│
    │                 │◀── 200 { count, next, results } ──│
    │◀── rides ───────│
```

If the refresh round-trip itself fails, tokens are cleared and the wrapper throws `'Session expired'`. `App.jsx` catches that exact message, unmounts the main view, sets a `sessionFlash`, and the user lands back on `LoginForm` with a friendly banner.

The wrapper makes exactly **one** refresh attempt per call — there is no retry loop, no exponential backoff, no concurrent-refresh deduplication. Those are deliberate simplifications for the assessment and are flagged in [Known Limitations](#known-limitations--future-work).

---

## API Layer

`src/services/api.js` is the single boundary between the UI and the backend. Every network call goes through it.

| Function | Endpoint | Auth | Behaviour |
|---|---|---|---|
| `login(email, password)` | `POST /api/auth/login/` | public | Stores access + refresh tokens, returns the user |
| `logout()` | `POST /api/auth/logout/` | Bearer | Best-effort notify, then clears tokens |
| `getCurrentUser()` | `GET /api/auth/me/` | Bearer | Returns the authenticated user's profile |
| `fetchRides(params)` | `GET /api/rides/?…` | Bearer | Paginated ride list; accepts every filter + sort param |
| `fetchRide(id)` | `GET /api/rides/{id}/` | Bearer | Single ride with full event history |
| `fetchTripsReport()` | `GET /api/reports/trips-over-hour/` | Bearer | Bonus SQL report as `{ month, driver, count }[]` |
| `getAccessToken()` / `getRefreshToken()` | — | — | Local-storage readers |
| `clearTokens()` | — | — | Drops both tokens |
| `isAuthenticated()` | — | — | `true` iff an access token exists |

Token storage key names are `wingz_access_token` and `wingz_refresh_token`. Error responses are parsed into a single `Error` whose message is `data.error ?? data.detail ?? HTTP <status>`, matching the shape the backend's custom exception handler always emits.

---

## Project Structure

```text
ride1/
├── README.md                      ← this file
├── index.html                     Vite entry
├── vite.config.js                 Dev server + /api proxy
├── eslint.config.js               ESLint 9 flat config
├── package.json                   deps: react, react-dom
├── .env.example                   VITE_API_BASE_URL
├── deploy/
│   └── nginx-wingz.conf           Production nginx (SPA + /api proxy + TLS)
├── .github/workflows/
│   └── deploy.yaml                Build + SCP + smoke tests
└── src/
    ├── main.jsx                   ReactDOM bootstrap
    ├── App.jsx                    Top-level auth gate, tab switch, ride list state
    ├── services/
    │   └── api.js                 Authenticated fetch + all endpoint calls
    ├── hooks/
    │   ├── useSearchParamsState.js   URL-synced state
    │   └── useDebouncedValue.js      Debounce for the rider-email filter
    ├── components/
    │   ├── LoginForm.jsx             Email + password + flash banner
    │   ├── FilterBar.jsx             Status / rider / sort / lat+lng / page size
    │   ├── RideTable.jsx             Paginated table + per-column sort
    │   ├── RideDetailDrawer.jsx      Slide-out with full ride + events
    │   ├── Pagination.jsx            First / prev / pages / next / last
    │   ├── SkeletonRow.jsx           Loading placeholders
    │   ├── EmptyState.jsx            Friendly empty-result view
    │   ├── TripsReport.jsx           Bonus report table
    │   └── icons.jsx                 Inline SVG icon set
    └── styles/
        ├── index.css                 Imports all others
        ├── tokens.css                Design-token CSS variables
        ├── base.css                  Resets and typography
        ├── layout.css                Header, nav, main grid
        ├── forms.css                 Form fields, inputs, buttons
        ├── login.css                 Login screen
        ├── table.css                 Ride table + status chips
        ├── drawer.css                Side panel layout
        └── pagination.css            Pagination controls
```

---

## Scripts

```bash
npm run dev       # Vite dev server on http://localhost:5173
npm run build     # production build to dist/
npm run lint      # ESLint flat config against the whole repo
npm run preview   # serve the built dist/ locally for a smoke test
```

There is no `npm test`. The only end-to-end coverage of this frontend is `ride0/tests/test_deployed_api.sh`, which exercises the API contract the frontend consumes. Adding Vitest + React Testing Library is the first item in [Known Limitations](#known-limitations--future-work).

---

## Design Decisions & Trade-offs

Six non-obvious choices. Each lists what was chosen, what was rejected, and why.

1. **Plain JavaScript, not TypeScript.** Kept the Vite template's default scope to minimise the surface area of the submission. TypeScript is the first upgrade for a codebase that will live longer than a week; for an assessment, the extra `tsconfig.json`, `@types/*` churn, and type declarations on every component would add review friction without adding bugs caught.

2. **Plain CSS with design tokens, not Tailwind or CSS-in-JS.** `src/styles/tokens.css` defines every colour, spacing, radius, font, and shadow variable; component stylesheets consume them. Tailwind was rejected for the markup noise it would add and for being an extra build step layered on top of Vite. CSS-in-JS was rejected for the runtime cost and the hydration complexity. SCSS was rejected because plain CSS custom properties cover everything SCSS variables would have given us.

3. **Function components + `useState` / `useEffect` only — no Context, no Redux, no Zustand.** The state surface is small (~10 pieces in `App.jsx`). Adding any state container would be pure ceremony. If the app grows past two screens, splitting the ride-list view into its own component and using Context for auth would be the first step — not reaching for a library.

4. **URL-synced filters via a thin custom hook, not React Router.** React Router ships a `useSearchParams` hook, but it arrives with 50 kB of router machinery for an app with two views. The ~40-line `useSearchParamsState` wraps the native `URLSearchParams` API and listens for `popstate` — that is the entire feature set the app needs. When a third view appears, this is a non-load-bearing decision to revisit.

5. **JWT in `localStorage` with automatic refresh, not HttpOnly cookies.** Cookie-based auth needs CSRF tokens, a shared domain strategy, `SameSite` tuning, and a refresh flow that survives page reloads. `localStorage` trades all of that for a one-line storage primitive. The trade-off is XSS exposure — flagged in [Known Limitations](#known-limitations--future-work) as the top production upgrade.

6. **Single-origin deployment via nginx reverse-proxy, not CORS.** The SPA and the API live behind the same origin in production (`https://wingz-ride.d3sarrollo.dev/api/`), so the browser never makes a cross-origin request and the backend never sends a single CORS header. In development, Vite's proxy mirrors the same `/api` path, so `src/services/api.js` literally hardcodes `const API_BASE = '/api'` and stays environment-agnostic. Eliminates preflight overhead and a whole class of misconfigurations.

---

## Known Limitations & Future Work

Six items, balanced between what matters for production and what was consciously deferred for the assessment.

1. **No automated test suite.** Vitest + React Testing Library should cover at minimum: login happy/sad path, filter URL sync, pagination, drawer data fetch, and the session-expired fallback. Until that lands, the only regression guard on the UI is the shell script that exercises the API contract in `ride0/tests/test_deployed_api.sh`.
2. **JWT tokens in `localStorage`.** Vulnerable to XSS in the same way every localStorage-based SPA is. Upgrade path: HttpOnly cookies + CSRF tokens on the backend, which also means revisiting the refresh round-trip to live entirely server-side.
3. **No React error boundary.** An uncaught render error currently blanks the UI. A single `<ErrorBoundary>` around the authed view would show a friendly fallback and a "retry" button without reloading the page.
4. **Refresh round-trip is not concurrency-safe.** If two API calls 401 at the same time, both trigger their own refresh. The second one would normally succeed against the newly-rotated access token, but a proper implementation would serialise concurrent refreshes behind a single promise and have every waiting call retry with the one shared result.
5. **No API contract validation.** The frontend reads `ride.todays_ride_events`, `ride.id_rider.email`, etc. with no schema to check those fields against. `drf-spectacular` on the backend plus a typed client on the frontend would catch the first silent field-rename before it hits production.
6. **Reports tab fetches on every click.** A tiny `useRef` cache would skip the second fetch when the user flips back and forth. Harmless at one-digit row counts, worth fixing if the report grows.

---

## Deployment

- **Workflow**: [`.github/workflows/deploy.yaml`](.github/workflows/deploy.yaml) runs `npm run lint` and `npm run build` on every push, then SCPs the `dist/` artifact and `deploy/nginx-wingz.conf` to the EC2 box
- **Target**: `/usr/share/nginx/html/ride1/dist` on the shared Amazon Linux 2023 instance
- **nginx config** ([`deploy/nginx-wingz.conf`](deploy/nginx-wingz.conf)):
  - Plain HTTP on `:80` redirects everything to `https://wingz-ride.d3sarrollo.dev`
  - HTTPS on `:443` serves the SPA from `/usr/share/nginx/html/ride1/dist`
  - SPA fallback: any non-file path returns `index.html` for client-side deep links
  - `/api/` reverse-proxies to `http://127.0.0.1:8000` (gunicorn + ride0 backend) with a 60-second read timeout
  - Static assets (`*.js`, `*.css`, `*.woff2`, images) are cached for 7 days with an `immutable` flag — Vite's content-hashed filenames make that safe
- **TLS**: Let's Encrypt certificate issued via `certbot --nginx`, auto-renewed by the `certbot-renew.timer` systemd unit
- **Smoke tests in the workflow**: a `curl` against the HTTPS root expecting `200`, followed by a login round-trip and an authenticated `GET /api/rides/` also expecting `200`

A full deploy takes roughly the lint + build time plus an SCP. The backend deploy is orthogonal and lives in `ride0`.
