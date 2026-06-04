// Live listing provider using immowelt.de search results.
//
// Why immowelt and not ImmoScout24?
//   ImmoScout24 returns HTTP 401 for automated requests and offers no free API.
//   immowelt.de serves its search results as parseable HTML, so we can extract
//   live listings (price, size, rooms) from the public results page.
//
// Browser CORS note:
//   A pure frontend cannot fetch immowelt directly (no CORS headers + bot
//   protection). We therefore route the request through a proxy that appends
//   the (URL-encoded) target URL. The default is the app's own same-origin dev
//   proxy (`/api/immowelt?url=`, see src/setupProxy.js), which fetches immowelt
//   server-side with a browser User-Agent. This is far more reliable than the
//   public CORS proxies (api.allorigins.win, corsproxy.io, …) that return
//   HTTP 408/403/522 under bot protection and rate limiting. You can still point
//   `proxyBase` at any other proxy/back-end via the UI.
//
// This is a best-effort parser of a third-party page: markup can change, so
// callers must handle errors and fall back to the curated data.

export const DEFAULT_PROXY = '/api/immowelt?url=';

const toNumber = (s) => {
  if (s == null) return undefined;
  // German format: 1.195.000,5 -> remove thousand dots, comma -> dot
  const cleaned = String(s).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
};

// Parse the immowelt results HTML into listing objects.
export const parseImmoweltHtml = (html, city, limit = 24) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const anchors = Array.from(doc.querySelectorAll('a[href*="/expose/"]'));

  const seen = new Set();
  const listings = [];

  for (const a of anchors) {
    const href = a.getAttribute('href') || '';
    const url = href.startsWith('http') ? href : `https://www.immowelt.de${href}`;
    const key = url.split('#')[0].split('?')[0];
    if (seen.has(key)) continue;

    // The anchor text / nested image alt usually contains the structured
    // summary, e.g. "Wohnung zum Kauf - Leipzig - 200.000 € - 3 Zimmer, 64,6 m²".
    const img = a.querySelector('img');
    const text = `${a.getAttribute('title') || ''} ${a.textContent || ''} ${img ? img.getAttribute('alt') || '' : ''}`
      .replace(/\s+/g, ' ')
      .trim();

    const priceMatch = text.match(/([\d.]+)\s*€/);
    const zimmerMatch = text.match(/([\d,.]+)\s*Zimmer/);
    const flaecheMatch = text.match(/([\d,.]+)\s*m²/);
    const plzMatch = text.match(/\b(\d{5})\b/);

    const kaufpreis = priceMatch ? toNumber(priceMatch[1]) : undefined;
    const groesse = flaecheMatch ? toNumber(flaecheMatch[1]) : undefined;
    const zimmer = zimmerMatch ? toNumber(zimmerMatch[1]) : undefined;

    // Require the essentials and a plausible apartment price.
    if (!kaufpreis || !groesse || kaufpreis < 20000) continue;

    seen.add(key);

    const provisionsfrei = /provisionsfrei/i.test(text);

    listings.push({
      id: `live-${city.id}-${key.split('/expose/')[1] || listings.length}`,
      titel: `${zimmer ? `${zimmer}-Zi` : 'Wohnung'}${/erstbezug|neubau/i.test(text) ? '-Neubau' : ''}`,
      lage: city.name,
      plz: plzMatch ? plzMatch[1] : undefined,
      url: key,
      kaufpreis,
      groesse,
      zimmer,
      provision: provisionsfrei ? 0 : undefined,
      quelle: 'immowelt (live)'
    });

    if (listings.length >= limit) break;
  }

  return listings;
};

// Strip HTML tags so a fact's text value can be read with a simple regex.
const stripTags = (s) =>
  String(s)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/\s+/g, ' ')
    .trim();

// Read a labelled "€" fact from an expose page, e.g. the value shown next to
// "Kaufpreis", "Hausgeld" or "Provision für Käufer".
const factEuro = (html, label) => {
  const i = html.indexOf(`>${label}<`);
  if (i < 0) return undefined;
  const seg = stripTags(html.slice(i, i + 400));
  const m = seg.match(/([\d.]+)\s*€/);
  return m ? toNumber(m[1]) : undefined;
};

// Recognise an immowelt single-listing (expose) URL and normalise it.
export const isImmoweltExposeUrl = (url) => {
  try {
    const u = new URL(String(url).trim());
    return u.hostname === 'www.immowelt.de' && /\/expose\/[a-z0-9-]+/i.test(u.pathname);
  } catch {
    return false;
  }
};

// Parse a single immowelt expose page into a listing object.
export const parseImmoweltExpose = (html, url, fallbackCity) => {
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((x) => {
      try {
        return JSON.parse(x[1]);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const realEstate = ld.find((o) => o['@type'] === 'RealEstateListing');
  const summary = realEstate ? realEstate.description || realEstate.name || '' : '';

  // The structured summary reads e.g. "Wohnung 45 m² 170000 € zum Kauf Köpenick,Berlin (12557)".
  const dPrice = summary.match(/([\d.]+)\s*€/);
  const dSize = summary.match(/([\d.,]+)\s*m²/);
  const dPlz = summary.match(/\((\d{5})\)/);
  let lage;
  if (realEstate && realEstate.name) {
    const mm = realEstate.name.match(/zum Kauf\s+([^()]+?)\s*\(/);
    if (mm) lage = mm[1].replace(/,/g, ', ').trim();
  }

  // "2 Zimmer • 45 m²" appears together in the fact header.
  const zm = stripTags(html).match(/(\d+(?:[.,]\d+)?)\s*Zimmer\s*•?\s*([\d.,]+)\s*m²/);

  const kaufpreis = factEuro(html, 'Kaufpreis') || (dPrice && toNumber(dPrice[1]));
  const groesse = (zm && toNumber(zm[2])) || (dSize && toNumber(dSize[1]));
  const zimmer = zm ? toNumber(zm[1]) : undefined;
  const hausgeld = factEuro(html, 'Hausgeld');
  const provisionBetrag = factEuro(html, 'Provision für Käufer');
  const bj = stripTags(html).match(/Baujahr\s*(\d{4})/);

  if (!kaufpreis || !groesse) {
    throw new Error('Aus dem Expose konnten Kaufpreis und Wohnfläche nicht gelesen werden.');
  }

  const exposeId = (url.match(/\/expose\/([a-z0-9-]+)/i) || [])[1] || `${Date.now()}`;

  const listing = {
    id: `live-url-${exposeId}`,
    titel: `${zimmer ? `${zimmer}-Zi` : 'Wohnung'}${/erstbezug|neubau/i.test(html) ? '-Neubau' : ''}`,
    lage: lage || (fallbackCity && fallbackCity.name) || 'Unbekannt',
    plz: dPlz ? dPlz[1] : undefined,
    url: url.split('#')[0].split('?')[0],
    kaufpreis,
    groesse,
    zimmer,
    hausgeld,
    baujahr: bj ? Number(bj[1]) : undefined,
    quelle: 'immowelt (Link)'
  };

  // The expose shows the buyer's commission as an absolute amount; feed it to
  // the calculator as an absolute override so the percentage is derived from it.
  if (provisionBetrag) {
    listing.provisionAbs = provisionBetrag;
    listing.provisionMode = 'abs';
  }

  return listing;
};

// Fetch + parse a single immowelt expose page through the proxy.
export const fetchListingByUrl = async (url, { proxyBase = DEFAULT_PROXY, city } = {}) => {
  const clean = String(url || '').trim();
  if (!isImmoweltExposeUrl(clean)) {
    throw new Error('Bitte einen gültigen immowelt-Expose-Link einfügen (www.immowelt.de/expose/…).');
  }
  const requestUrl = `${proxyBase}${encodeURIComponent(clean)}`;
  const response = await fetch(requestUrl, { headers: { Accept: 'text/html' } });
  if (!response.ok) {
    throw new Error(`Quelle nicht erreichbar (HTTP ${response.status}). Proxy ggf. anpassen.`);
  }
  const html = await response.text();
  return parseImmoweltExpose(html, clean, city);
};

// Fetch + parse live listings for a city through a CORS proxy.
export const fetchLiveListings = async (city, { proxyBase = DEFAULT_PROXY, limit = 24 } = {}) => {
  if (!city || !city.immoweltUrl) {
    throw new Error('Für diese Stadt ist keine Live-Quelle hinterlegt.');
  }
  const requestUrl = `${proxyBase}${encodeURIComponent(city.immoweltUrl)}`;

  const response = await fetch(requestUrl, { headers: { Accept: 'text/html' } });
  if (!response.ok) {
    throw new Error(`Quelle nicht erreichbar (HTTP ${response.status}). Proxy ggf. anpassen.`);
  }
  const html = await response.text();
  const listings = parseImmoweltHtml(html, city, limit);

  if (listings.length === 0) {
    throw new Error(
      'Keine Wohnungen aus der Live-Seite gelesen (Markup geändert oder Proxy blockiert). Kuratierte Daten werden angezeigt.'
    );
  }
  return listings;
};
