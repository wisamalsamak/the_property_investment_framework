// Netlify serverless proxy for live immowelt listings (production equivalent of
// src/setupProxy.js, which only runs on the CRA dev server).
//
// Why this exists:
//   The browser cannot fetch immowelt.de directly (no CORS headers + bot
//   protection). On Netlify there is no dev server, so the same-origin endpoint
//   `/api/immowelt?url=...` is served by this function instead. A redirect in
//   netlify.toml maps `/api/immowelt` -> `/.netlify/functions/immowelt`.
//
//   The function fetches immowelt server-side (no CORS) with a realistic browser
//   User-Agent so immowelt returns 200 instead of blocking, then returns the raw
//   HTML which immoweltProvider.js parses in the browser.

const ALLOWED_HOST = 'www.immowelt.de';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
};

exports.handler = async (event) => {
  const target = event.queryStringParameters && event.queryStringParameters.url;

  if (!target) {
    return { statusCode: 400, body: 'Missing "url" query parameter.' };
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return { statusCode: 400, body: 'Invalid "url" query parameter.' };
  }

  // Only allow proxying immowelt to avoid an open proxy.
  if (parsed.protocol !== 'https:' || parsed.hostname !== ALLOWED_HOST) {
    return { statusCode: 403, body: `Only https://${ALLOWED_HOST}/ URLs are allowed.` };
  }

  const controller = new AbortController();
  // Stay safely under Netlify's 10s synchronous-function limit.
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
    });

    const body = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body,
    };
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    return {
      statusCode: aborted ? 504 : 502,
      body: `Upstream fetch failed: ${(err && err.message) || err}`,
    };
  } finally {
    clearTimeout(timeout);
  }
};
