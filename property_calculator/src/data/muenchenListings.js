// Curated set of Munich apartment listings used by the portfolio overview.
//
// NOTE on the "ImmoScout integration":
// ImmoScout24 has no free public API and actively blocks automated scraping
// (requests return HTTP 401). A real live import would require their paid
// partner API plus a backend. This module therefore provides a curated,
// editable dataset of Munich listings, and the UI lets you add more listings
// manually (e.g. by pasting the key figures from an ImmoScout expose URL).
//
// All per-property values are the raw listing facts. Missing values are
// estimated at calculation time via `buildCalcInput` so every flat can be
// scored consistently with your personal financing/tax assumptions.

// Default personal + market assumptions applied to every listing.
export const DEFAULT_ASSUMPTIONS = {
  // Financing
  eigenkapital: '20', // % of total cost
  eigenkapitalMode: 'pct', // 'pct' (of total cost) or 'abs' (fixed € amount)
  eigenkapitalAbs: '', // absolute equity in € when eigenkapitalMode === 'abs'
  zins: '3.5', // % p.a.
  tilgung: '2', // % p.a.
  // Market estimates for missing data (Munich)
  mietProQm: '20', // €/m² cold rent estimate when a listing has none
  hausgeldProQm: '4', // €/m²/month estimate when a listing has none
  kaufnebenkosten: '5.5', // Bayern: GrESt 3,5 % + Notar/Grundbuch ~2 %
  grundstueckswertAnteil: '30', // high land share in Munich
  abschreibungsrate: '2', // % linear AfA
  // Personal tax profile
  bruttoJahresgehalt: '7000',
  gehaltsperiode: 'monat',
  steuerklasse: '1',
  alter: '35',
  bundesland: 'Bayern',
  kinder: '0',
  zusatzbeitrag: '2.5',
  kirchensteuerpflichtig: false
};

// Curated Munich listings. `kaltmiete`, `stellplatz`, `hausgeld`, `provision`
// are optional – if omitted they are estimated. Figures are illustrative and
// based on typical Munich market data; verify against the live expose.
export const MUENCHEN_LISTINGS = [
  {
    id: 'gh-164080118',
    titel: '4-Zi-Gartenwohnung Neubau (Erstbezug)',
    lage: 'Großhadern',
    plz: '81377',
    url: 'https://www.immobilienscout24.de/expose/164080118',
    kaufpreis: 1195000,
    groesse: 108.88,
    zimmer: 4,
    baujahr: 2027,
    stellplatz: 130, // Tiefgaragenstellplatz (geschätzte Miete)
    provision: 0, // provisionsfrei für Käufer
    quelle: 'ImmobilienScout24'
  },
  {
    id: 'sen-3zi',
    titel: '3-Zi-Altbauwohnung mit Balkon',
    lage: 'Sendling',
    plz: '81371',
    url: 'https://www.immobilienscout24.de/Suche/de/bayern/muenchen/sendling/wohnung-kaufen',
    kaufpreis: 749000,
    groesse: 79,
    zimmer: 3,
    baujahr: 1958,
    kaltmiete: 1580,
    hausgeld: 320,
    quelle: 'Beispiel'
  },
  {
    id: 'neu-2zi',
    titel: '2-Zi-Wohnung mit Loggia',
    lage: 'Neuperlach',
    plz: '81735',
    url: 'https://www.immobilienscout24.de/Suche/de/bayern/muenchen/neuperlach/wohnung-kaufen',
    kaufpreis: 365000,
    groesse: 58,
    zimmer: 2,
    baujahr: 1974,
    kaltmiete: 1180,
    hausgeld: 250,
    quelle: 'Beispiel'
  },
  {
    id: 'pas-3zi',
    titel: '3-Zi-Wohnung nahe Bahnhof',
    lage: 'Pasing',
    plz: '81241',
    url: 'https://www.immobilienscout24.de/Suche/de/bayern/muenchen/pasing/wohnung-kaufen',
    kaufpreis: 639000,
    groesse: 82,
    zimmer: 3,
    baujahr: 1995,
    kaltmiete: 1560,
    hausgeld: 290,
    quelle: 'Beispiel'
  },
  {
    id: 'moo-2zi',
    titel: '2-Zi-ETW mit Westbalkon',
    lage: 'Moosach',
    plz: '80992',
    url: 'https://www.immobilienscout24.de/Suche/de/bayern/muenchen/moosach/wohnung-kaufen',
    kaufpreis: 419000,
    groesse: 62,
    zimmer: 2,
    baujahr: 1981,
    kaltmiete: 1290,
    hausgeld: 240,
    quelle: 'Beispiel'
  },
  {
    id: 'swb-2zi',
    titel: '2-Zi-Stilaltbau, saniert',
    lage: 'Schwabing',
    plz: '80801',
    url: 'https://www.immobilienscout24.de/Suche/de/bayern/muenchen/schwabing/wohnung-kaufen',
    kaufpreis: 599000,
    groesse: 56,
    zimmer: 2,
    baujahr: 1906,
    kaltmiete: 1340,
    hausgeld: 260,
    quelle: 'Beispiel'
  },
  {
    id: 'tru-4zi',
    titel: '4-Zi-Familienwohnung mit Garten',
    lage: 'Trudering',
    plz: '81825',
    url: 'https://www.immobilienscout24.de/Suche/de/bayern/muenchen/trudering/wohnung-kaufen',
    kaufpreis: 849000,
    groesse: 104,
    zimmer: 4,
    baujahr: 2003,
    kaltmiete: 2050,
    hausgeld: 360,
    quelle: 'Beispiel'
  }
];

const num = (v, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const hasVal = (v) => v != null && v !== '';

// Resolve a cost field that may be entered either as a percentage (of `base`)
// or as an absolute amount, returning the effective percentage that
// `calculateResults` expects. Falls back to `fallbackPct` when nothing is set.
const resolvePercent = (listing, pctKey, base, fallbackPct) => {
  const mode = listing[`${pctKey}Mode`] || 'pct';
  if (mode === 'abs' && hasVal(listing[`${pctKey}Abs`]) && base > 0) {
    return (num(listing[`${pctKey}Abs`]) / base) * 100;
  }
  if (hasVal(listing[pctKey])) return num(listing[pctKey]);
  return fallbackPct;
};

// Build a full input object for `calculateResults` from a listing plus the
// global assumptions, estimating any missing per-property values.
export const buildCalcInput = (listing, assumptions = DEFAULT_ASSUMPTIONS) => {
  const groesse = num(listing.groesse);
  const kaufpreis = num(listing.kaufpreis);
  const mietProQm = num(assumptions.mietProQm, 20);
  const hausgeldProQm = num(assumptions.hausgeldProQm, 4);

  const kaltmiete = hasVal(listing.kaltmiete)
    ? num(listing.kaltmiete)
    : Math.round(groesse * mietProQm);

  const hausgeld = hasVal(listing.hausgeld)
    ? num(listing.hausgeld)
    : Math.round(groesse * hausgeldProQm);

  const stellplatz = hasVal(listing.stellplatz) ? num(listing.stellplatz) : 0;

  // Percentage-or-absolute cost fields. Each can be overridden per listing,
  // otherwise the global assumption (or a sensible default) applies. The
  // grundstücks share is resolved first because the building value (and thus
  // the AfA base) depends on it.
  const provision = resolvePercent(listing, 'provision', kaufpreis, 3.57);
  const kaufnebenkosten = resolvePercent(
    listing, 'kaufnebenkosten', kaufpreis, num(assumptions.kaufnebenkosten, 5.5)
  );
  const grundstueckswertAnteil = resolvePercent(
    listing, 'grundstueckswertAnteil', kaufpreis, num(assumptions.grundstueckswertAnteil, 30)
  );
  const gebaeudewert = kaufpreis * (1 - grundstueckswertAnteil / 100);
  const abschreibungsrate = resolvePercent(
    listing, 'abschreibungsrate', gebaeudewert, num(assumptions.abschreibungsrate, 2)
  );

  // Nebenkosten (umlegbarer Anteil, €/Monat): either a share of the Hausgeld or
  // an absolute amount; empty falls back to the automatic 60/40 split.
  let nebenkosten = '';
  const nkMode = listing.nebenkostenMode || 'pct';
  if (nkMode === 'abs' && hasVal(listing.nebenkostenAbs)) {
    nebenkosten = String(num(listing.nebenkostenAbs));
  } else if (nkMode === 'pct' && hasVal(listing.nebenkostenPct)) {
    nebenkosten = String((hausgeld * num(listing.nebenkostenPct)) / 100);
  }

  // Eigenkapital (global): a percentage of the total cost or an absolute amount.
  // An absolute value is converted to the equivalent percentage of this flat's
  // total cost (purchase price + commission + purchase incidentals).
  const gesamtkosten = kaufpreis * (1 + provision / 100 + kaufnebenkosten / 100);
  let eigenkapital = num(assumptions.eigenkapital, 20);
  if (
    assumptions.eigenkapitalMode === 'abs' &&
    hasVal(assumptions.eigenkapitalAbs) &&
    gesamtkosten > 0
  ) {
    eigenkapital = (num(assumptions.eigenkapitalAbs) / gesamtkosten) * 100;
  }

  return {
    // per-property
    groesse: String(groesse),
    kaufpreis: String(kaufpreis),
    kaltmiete: String(kaltmiete),
    stellplatz: String(stellplatz),
    hausgeld: String(hausgeld),
    nebenkosten, // '' = auto (60 % of Hausgeld)
    nichtUmlegbareNebenkosten: '', // auto
    provision: String(provision),
    kaufnebenkosten: String(kaufnebenkosten),
    abschreibungsrate: String(abschreibungsrate),
    grundstueckswertAnteil: String(grundstueckswertAnteil),
    // financing (global)
    eigenkapital: String(eigenkapital),
    zins: String(num(assumptions.zins, 3.5)),
    tilgung: String(num(assumptions.tilgung, 2)),
    // personal tax (global)
    bruttoJahresgehalt: String(assumptions.bruttoJahresgehalt || ''),
    gehaltsperiode: assumptions.gehaltsperiode || 'monat',
    steuerklasse: assumptions.steuerklasse || '1',
    alter: String(assumptions.alter || ''),
    bundesland: assumptions.bundesland || 'Bayern',
    kinder: String(assumptions.kinder || '0'),
    zusatzbeitrag: String(assumptions.zusatzbeitrag || '2.5'),
    kirchensteuerpflichtig: !!assumptions.kirchensteuerpflichtig
  };
};

// Map a 0–100 score to a short, actionable recommendation.
export const empfehlungForScore = (score) => {
  if (score >= 60) {
    return { label: 'Kaufenswert', color: 'good', kurz: 'Solide Kennzahlen – nähere Prüfung lohnt.' };
  }
  if (score >= 40) {
    return { label: 'Beobachten', color: 'neutral', kurz: 'Gemischtes Bild – nur mit Anpassungen interessant.' };
  }
  return { label: 'Eher meiden', color: 'poor', kurz: 'Kennzahlen sprechen aktuell dagegen.' };
};
