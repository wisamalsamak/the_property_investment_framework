// Local development proxy for live immowelt listings.
//
// Why this exists:
//   The browser cannot fetch immowelt.de directly (no CORS headers + bot
//   protection), and public CORS proxies (api.allorigins.win, corsproxy.io, …)
//   are rate-limited and frequently fail with HTTP 408/403/522. Instead of
//   depending on a flaky third party, the Create-React-App dev server exposes a
//   same-origin endpoint that fetches immowelt server-side (Node, no CORS) using
//   a realistic browser User-Agent so immowelt returns 200 instead of blocking.
//
// CRA loads this file automatically (config/webpackDevServer.config.js requires
// src/setupProxy.js when present); no extra dependency is needed.
//
// Endpoint: GET /api/immowelt?url=<immowelt search url>
//   -> returns the raw immowelt HTML, which immoweltProvider.js then parses.

const ALLOWED_HOST = 'www.immowelt.de';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
};

module.exports = function setupProxy(app) {
  app.get('/api/immowelt', async (req, res) => {
    const target = req.query.url;

    if (!target) {
      res.status(400).send('Missing "url" query parameter.');
      return;
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      res.status(400).send('Invalid "url" query parameter.');
      return;
    }

    // Only allow proxying immowelt to avoid an open proxy.
    if (parsed.protocol !== 'https:' || parsed.hostname !== ALLOWED_HOST) {
      res.status(403).send(`Only https://${ALLOWED_HOST}/ URLs are allowed.`);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const upstream = await fetch(parsed.toString(), {
        headers: BROWSER_HEADERS,
        signal: controller.signal,
      });

      const body = await upstream.text();
      res
        .status(upstream.status)
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(body);
    } catch (err) {
      const aborted = err && err.name === 'AbortError';
      res
        .status(aborted ? 504 : 502)
        .send(`Upstream fetch failed: ${err.message || err}`);
    } finally {
      clearTimeout(timeout);
    }
  });
};
