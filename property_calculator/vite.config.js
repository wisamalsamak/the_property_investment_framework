/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// --- Local dev proxy for live immowelt listings -----------------------------
// Mirrors the production Netlify function (netlify/functions/immowelt.js): the
// browser cannot fetch immowelt.de directly (no CORS + bot protection), so the
// dev server exposes a same-origin endpoint that fetches it server-side with a
// realistic User-Agent. Only immowelt is allowed, to avoid an open proxy.
//
// Endpoint: GET /api/immowelt?url=<immowelt url>
const ALLOWED_HOST = 'www.immowelt.de';
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
};

function immoweltDevProxy() {
  return {
    name: 'immowelt-dev-proxy',
    configureServer(server) {
      // Connect strips the mount path, so req.url here is `/?url=...`.
      server.middlewares.use('/api/immowelt', async (req, res) => {
        const send = (status, body) => {
          res.statusCode = status;
          res.end(body);
        };

        const target = new URL(req.url, 'http://localhost').searchParams.get('url');
        if (!target) return send(400, 'Missing "url" query parameter.');

        let parsed;
        try {
          parsed = new URL(target);
        } catch {
          return send(400, 'Invalid "url" query parameter.');
        }
        if (parsed.protocol !== 'https:' || parsed.hostname !== ALLOWED_HOST) {
          return send(403, `Only https://${ALLOWED_HOST}/ URLs are allowed.`);
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        try {
          const upstream = await fetch(parsed.toString(), {
            headers: BROWSER_HEADERS,
            signal: controller.signal,
          });
          const html = await upstream.text();
          res.statusCode = upstream.status;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
        } catch (err) {
          const aborted = err && err.name === 'AbortError';
          send(aborted ? 504 : 502, `Upstream fetch failed: ${err.message || err}`);
        } finally {
          clearTimeout(timeout);
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), immoweltDevProxy()],
  server: {
    port: 3000,
    open: false,
  },
  // Keep the output folder name `build` so the existing netlify.toml
  // (publish = "build") and the public/_redirects copy keep working.
  build: {
    outDir: 'build',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: false,
  },
});
