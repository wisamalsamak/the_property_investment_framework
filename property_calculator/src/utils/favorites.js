// Helpers that normalize the two listing sources (city overview & single
// apartment) into one favorite record shape used by the Favoriten panel and the
// database. A favorite stores the listing's key figures plus a snapshot of the
// computed KPIs at bookmark time, so it can be displayed without recomputing.

const num = (v) => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// Build a favorite from a city-overview listing and its evaluated row.
// `evaluated` is the `{ results, score, cashflow }` object the overview derives
// for every listing.
export const favoriteFromListing = (listing, evaluated, cityId, cityName) => {
  const results = evaluated?.results || {};
  return {
    id: String(listing.id),
    source: 'portfolio',
    cityId: cityId || null,
    cityName: cityName || null,
    titel: listing.titel || 'Wohnung',
    lage: listing.lage || cityName || '',
    url: listing.url || '',
    quelle: listing.quelle || '',
    kaufpreis: num(listing.kaufpreis) ?? num(results.kaufpreis),
    groesse: num(listing.groesse),
    zimmer: num(listing.zimmer),
    kaltmiete: num(listing.kaltmiete) ?? num(results.kaltmiete),
    hausgeld: num(listing.hausgeld) ?? num(results.hausgeld),
    score: num(evaluated?.score),
    mietrendite: num(results.mietrendite),
    cashflow: num(evaluated?.cashflow),
    kaufpreisProQm: num(results.kaufpreisProQm),
    // Snapshot of the full computation so the Favoriten panel can show the
    // exact calculation details without recomputing.
    results
  };
};

// Build a favorite from the single-apartment result + the form data that
// produced it. The single-apartment view has no listing id, so a stable id is
// derived from the defining figures (price / size / rent) for idempotent
// toggling.
export const favoriteFromResults = (results, formData = {}) => {
  const input = results?.input || {};
  const kaufpreis = num(input.kaufpreis);
  const groesse = num(input.groesse);
  const kaltmiete = num(input.kaltmiete);
  const cashflow = results?.steuer?.hasTaxData
    ? results.steuer.nachSteuerCashflowMonat
    : results?.monatlicherCashflow;
  return {
    id: `einzel-${kaufpreis ?? '?'}-${groesse ?? '?'}-${kaltmiete ?? '?'}`,
    source: 'einzel',
    cityId: null,
    cityName: null,
    titel: formData.titel || 'Einzelne Wohnung',
    lage: formData.lage || '',
    url: '',
    quelle: '',
    kaufpreis,
    groesse,
    zimmer: num(formData.zimmer),
    kaltmiete,
    hausgeld: num(input.hausgeld),
    score: num(results?.verdict?.score),
    mietrendite: num(results?.mietrendite),
    cashflow: num(cashflow),
    kaufpreisProQm: num(results?.kaufpreisProQm),
    // Snapshot of the full computation so the Favoriten panel can show the
    // exact calculation details without recomputing.
    results: results || null
  };
};
