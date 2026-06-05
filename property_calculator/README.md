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

## Project structure

- `src/` – React app
  - `components/` – UI (`Calculator`, `Portfolio`, `Results`, `StepForm`, …)
  - `utils/` – `calculations.js`, `germanTax.js`, `immoweltProvider.js`
  - `data/` – static city / listing data
- `netlify/functions/immowelt.js` – production immowelt proxy
- `vite.config.js` – Vite + Vitest config and the local immowelt dev proxy plugin
- `index.html` – Vite HTML entry (loads `/src/index.jsx`)
