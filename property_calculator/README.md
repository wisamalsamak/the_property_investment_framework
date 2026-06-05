# Immobilien-Investitionsrechner

A client-side React app for evaluating German real-estate investments (Mietrendite,
Cashflow, tax effects, multi-year projection). Built with [Vite](https://vitejs.dev/)
and tested with [Vitest](https://vitest.dev/).

## Prerequisites

- Node.js 18+ (Netlify build uses Node 20)
- npm

> All commands below must be run from this `property_calculator/` folder, **not** the
> repository root. The repo root has no `package.json`, so `npm start` there fails with
> `ENOENT ... package.json`.

## Available scripts

### `npm run dev` (alias: `npm start`)

Runs the app in development mode on [http://localhost:3000](http://localhost:3000).
The page hot-reloads on changes. A small Vite dev-server middleware proxies
`/api/immowelt?url=...` to `www.immowelt.de` (replicated from the old CRA `setupProxy.js`).

### `npm test` / `npm run test:watch`

Runs the Vitest suite once (`test`) or in watch mode (`test:watch`),
using `jsdom` and `@testing-library/react`.

### `npm run build`

Builds the production bundle into the `build/` folder (kept as `build` instead of
Vite's default `dist` so `netlify.toml` stays unchanged).

### `npm run preview`

Serves the production `build/` locally to verify the built output.

## Deployment

Deployed on Netlify (`netlify.toml`):

- `command = "npm run build"`, `publish = "build"`, `functions = "netlify/functions"`
- In production, `/api/immowelt` is rewritten to the `netlify/functions/immowelt.js`
  serverless function (the dev proxy above is only for local development).
- SPA fallback routes `/*` to `/index.html`.

## Authentication & database (Supabase)

Optional accounts and per-user saved portfolios are backed by
[Supabase](https://supabase.com) (auth + Postgres). The browser talks to Supabase
directly with the public **anon** key; data is protected by Row Level Security, so
a user can only read/write their own portfolio. **No backend server or Netlify
function is needed for this.**

If the env vars below are absent, the app still runs as a guest with data kept in
`localStorage` — so it deploys and works before Supabase is set up.

### One-time setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the schema: Supabase Dashboard → **SQL Editor** → paste
   `supabase/migrations/0001_init.sql` → **Run**. This creates the `portfolios`
   table and its RLS policies.
3. (Optional) Dashboard → **Authentication → Providers → Email** to toggle whether
   sign-ups require email confirmation.
4. Copy `.env.example` to `.env.local` and fill in (Dashboard → **Project Settings → API**):
   - `VITE_SUPABASE_URL` ← Project URL
   - `VITE_SUPABASE_ANON_KEY` ← `anon` public key
5. On **Netlify**: Site settings → **Environment variables** → add the same two
   variables (scope: Builds). They are inlined at build time, so redeploy after
   changing them.
   In Supabase, also add your Netlify site URL under **Authentication → URL
   Configuration** (Site URL / Redirect URLs).

> The anon key is meant to be public. Never put the Supabase **service-role** key
> in any `VITE_` variable or client code.

## Project structure

- `src/` – React app
  - `components/` – UI (`Calculator`, `Portfolio`, `Results`, `StepForm`, `AuthBar`, …)
  - `lib/` – `supabaseClient.js`, `AuthContext.jsx`, `portfolioStore.js`
  - `utils/` – `calculations.js`, `germanTax.js`, `immoweltProvider.js`
  - `data/` – static city / listing data
- `supabase/migrations/0001_init.sql` – DB schema + Row Level Security policies
- `netlify/functions/immowelt.js` – production immowelt proxy
- `vite.config.js` – Vite + Vitest config and the local immowelt dev proxy plugin
- `index.html` – Vite HTML entry (loads `/src/index.jsx`)