// Helper functions for calculations
import { berechneNetto, berechneSteuerersparnis } from './germanTax';

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercent = (value) => {
  return new Intl.NumberFormat('de-DE', { 
    style: 'percent', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Rating thresholds for each criterion used in the final verdict.
// These are intentionally exposed so the UI can show *why* a verdict was reached.
export const VERDICT_CRITERIA = [
  {
    key: 'mietrendite',
    label: 'Mietrendite (Brutto)',
    description: 'Jährliche Mieteinnahmen im Verhältnis zur Gesamtinvestition. Faustregel: höher ist besser.',
    unit: '%',
    weight: 2,
    good: 5,      // >= 5 %  -> gut
    neutral: 3.5, // 3.5-5 % -> neutral, darunter schwach
    goodText: 'Gute Brutto-Mietrendite (≥ 5 %).',
    neutralText: 'Durchschnittliche Mietrendite (3,5 – 5 %).',
    poorText: 'Niedrige Mietrendite (< 3,5 %).'
  },
  {
    key: 'monatlicherCashflow',
    label: 'Monatlicher Cashflow',
    description: 'Was nach Zins, Tilgung und nicht umlegbaren Kosten monatlich übrig bleibt.',
    unit: '€',
    weight: 3,
    good: 0,      // >= 0 €   -> gut (trägt sich selbst)
    neutral: -100, // -100-0 € -> neutral, darunter schwach
    goodText: 'Positiver Cashflow – die Immobilie trägt sich selbst.',
    neutralText: 'Leicht negativer Cashflow – geringe monatliche Zuzahlung nötig.',
    poorText: 'Deutlich negativer Cashflow – erhebliche monatliche Zuzahlung nötig.'
  },
  {
    key: 'eigenkapitalrendite',
    label: 'Eigenkapitalrendite',
    description: 'Cashflow im Verhältnis zum eingesetzten Eigenkapital (Hebelwirkung).',
    unit: '%',
    weight: 2,
    good: 6,      // >= 6 %  -> gut
    neutral: 2,   // 2-6 %   -> neutral, darunter schwach
    goodText: 'Starke Eigenkapitalrendite (≥ 6 %).',
    neutralText: 'Moderate Eigenkapitalrendite (2 – 6 %).',
    poorText: 'Schwache Eigenkapitalrendite (< 2 %).'
  },
  {
    key: 'kaufpreisFaktor',
    label: 'Kaufpreisfaktor',
    description: 'Kaufpreis geteilt durch Jahres-Kaltmiete. Niedriger ist günstiger eingekauft.',
    unit: 'x',
    weight: 1,
    lowerIsBetter: true,
    good: 22,     // <= 22  -> gut
    neutral: 28,  // 22-28  -> neutral, darüber schwach
    goodText: 'Günstiger Einkaufsfaktor (≤ 22 Jahresmieten).',
    neutralText: 'Marktüblicher Faktor (22 – 28 Jahresmieten).',
    poorText: 'Hoher Kaufpreisfaktor (> 28 Jahresmieten).'
  }
];

// Map a numeric rating to a label, color and 0/1/2 point score.
const RATING_LEVELS = {
  good: { points: 2, label: 'Gut', color: 'good' },
  neutral: { points: 1, label: 'Neutral', color: 'neutral' },
  poor: { points: 0, label: 'Schwach', color: 'poor' }
};

const rateCriterion = (criterion, value) => {
  let level;
  if (criterion.lowerIsBetter) {
    if (value <= criterion.good) level = 'good';
    else if (value <= criterion.neutral) level = 'neutral';
    else level = 'poor';
  } else {
    if (value >= criterion.good) level = 'good';
    else if (value >= criterion.neutral) level = 'neutral';
    else level = 'poor';
  }
  const meta = RATING_LEVELS[level];
  const text =
    level === 'good' ? criterion.goodText
    : level === 'neutral' ? criterion.neutralText
    : criterion.poorText;
  return { level, ...meta, text };
};

// Build a transparent verdict: an overall score plus a per-criterion breakdown
// that explains exactly how the result was reached.
export const calculateVerdict = (results) => {
  // Base criteria, plus an after-tax cashflow criterion when tax data exists.
  const criteria = [...VERDICT_CRITERIA];
  if (results.steuer && results.steuer.hasTaxData) {
    criteria.splice(1, 0, {
      key: 'nachSteuerCashflowMonatlich',
      label: 'Cashflow nach Steuern (Monat)',
      description: 'Monatlicher Cashflow inkl. Steuerersparnis aus Zinsen und AfA.',
      unit: '€',
      weight: 3,
      good: 0,
      neutral: -100,
      goodText: 'Nach Steuern positiver Cashflow – die Steuervorteile tragen das Objekt.',
      neutralText: 'Nach Steuern nur leicht negativ – geringe Zuzahlung trotz Steuervorteil.',
      poorText: 'Auch nach Steuern deutlich negativ – hohe Zuzahlung nötig.'
    });
  }

  const breakdown = criteria.map((criterion) => {
    const value = results[criterion.key];
    const rating = rateCriterion(criterion, value);
    return {
      key: criterion.key,
      label: criterion.label,
      description: criterion.description,
      unit: criterion.unit,
      value,
      weight: criterion.weight,
      lowerIsBetter: !!criterion.lowerIsBetter,
      thresholds: { good: criterion.good, neutral: criterion.neutral },
      level: rating.level,
      ratingLabel: rating.label,
      color: rating.color,
      points: rating.points,
      maxPoints: 2,
      weightedPoints: rating.points * criterion.weight,
      maxWeightedPoints: 2 * criterion.weight,
      explanation: rating.text
    };
  });

  const earned = breakdown.reduce((sum, c) => sum + c.weightedPoints, 0);
  const max = breakdown.reduce((sum, c) => sum + c.maxWeightedPoints, 0);
  const score = max > 0 ? Math.round((earned / max) * 100) : 0;

  let rating, summary;
  if (score >= 80) {
    rating = 'Sehr gut';
    summary = 'Die Kennzahlen sind durchweg stark – ein attraktives Investment.';
  } else if (score >= 60) {
    rating = 'Gut';
    summary = 'Solide Kennzahlen mit leichten Schwächen – grundsätzlich attraktiv.';
  } else if (score >= 40) {
    rating = 'Neutral';
    summary = 'Gemischtes Bild – einzelne Kennzahlen sollten verbessert werden.';
  } else if (score >= 20) {
    rating = 'Schwach';
    summary = 'Mehrere Kennzahlen sind unterdurchschnittlich – kritisch prüfen.';
  } else {
    rating = 'Ungünstig';
    summary = 'Die Kennzahlen sprechen aktuell gegen das Investment.';
  }

  return { score, earned, max, rating, summary, breakdown };
};

// Build a year-by-year amortization & cashflow projection. The annuity stays
// constant while interest declines and Tilgung rises; the loan is paid down
// until the remaining debt reaches zero (capped at 40 years). When tax context
// (nettoCtx) is provided, the per-year tax saving is recomputed from the
// shrinking interest deduction.
export const buildProjection = ({
  fremdkapital,
  jahreszins,
  jaehrlicheAnnuitaet,
  jaehrlicheGesamtmiete,
  jaehrlicheNichtUmlegbareNebenkosten,
  jaehrlicheAbschreibung,
  nettoCtx = null,
  maxYears = 40
}) => {
  const rows = [];
  const hasDebt = fremdkapital > 0 && jaehrlicheAnnuitaet > 0;
  const horizon = hasDebt ? maxYears : 15;
  let restschuld = fremdkapital;
  let kumCashflow = 0;
  let kumNachSteuer = 0;
  let kumTilgung = 0;

  for (let jahr = 1; jahr <= horizon; jahr++) {
    const zinsen = restschuld > 0 ? restschuld * jahreszins : 0;
    let tilgung = restschuld > 0 ? Math.min(jaehrlicheAnnuitaet - zinsen, restschuld) : 0;
    if (tilgung < 0) tilgung = 0;
    const annuitaet = zinsen + tilgung;
    const restschuldEnde = Math.max(0, restschuld - tilgung);

    const cashflow = jaehrlicheGesamtmiete - jaehrlicheNichtUmlegbareNebenkosten - annuitaet;
    const vermietungsErgebnis =
      jaehrlicheGesamtmiete - jaehrlicheNichtUmlegbareNebenkosten - zinsen - jaehrlicheAbschreibung;

    let ersparnisJahr = 0;
    if (nettoCtx) {
      ersparnisJahr = berechneSteuerersparnis(nettoCtx, vermietungsErgebnis).ersparnisJahr;
    }
    const nachSteuerCashflow = cashflow + ersparnisJahr;

    kumCashflow += cashflow;
    kumNachSteuer += nachSteuerCashflow;
    kumTilgung += tilgung;

    rows.push({
      jahr,
      restschuldAnfang: restschuld,
      zinsen,
      tilgung,
      annuitaet,
      restschuldEnde,
      afa: jaehrlicheAbschreibung,
      vermietungsErgebnis,
      cashflow,
      ersparnisJahr,
      nachSteuerCashflow,
      kumCashflow,
      kumNachSteuer,
      kumTilgung
    });

    restschuld = restschuldEnde;
    if (hasDebt && restschuld <= 0.01) break;
  }

  return rows;
};

export const calculateResults = (data) => {
  // Parse all input values to numbers
  const values = {};
  Object.keys(data).forEach(key => {
    values[key] = parseFloat(data[key]) || 0;
  });

  // Extract values for easier reference
  const {
    groesse,
    kaufpreis,
    eigenkapital,
    provision,
    kaufnebenkosten,
    zins,
    tilgung,
    kaltmiete,
    stellplatz,
    hausgeld,
    nebenkosten,
    nichtUmlegbareNebenkosten,
    abschreibungsrate,
    grundstueckswertAnteil
  } = values;

  // Calculate derived values
  const provisionBetrag = kaufpreis * (provision / 100);
  const kaufnebenkostenBetrag = kaufpreis * (kaufnebenkosten / 100);
  const gesamtkosten = kaufpreis + provisionBetrag + kaufnebenkostenBetrag;
  
  // Calculate Eigenkapital and Fremdkapital
  const eigenkapitalBetrag = gesamtkosten * (eigenkapital / 100);
  const fremdkapital = gesamtkosten - eigenkapitalBetrag;
  
  // Calculate Nebenkosten if not provided (monthly values)
  let calculatedNebenkosten = nebenkosten;
  let calculatedNichtUmlegbareNebenkosten = nichtUmlegbareNebenkosten;
  
  if (hausgeld > 0 && nebenkosten === 0) {
    calculatedNebenkosten = hausgeld * 0.6;
    calculatedNichtUmlegbareNebenkosten = hausgeld - calculatedNebenkosten;
  } else if (hausgeld > 0 && nebenkosten > 0 && nichtUmlegbareNebenkosten === 0) {
    calculatedNichtUmlegbareNebenkosten = hausgeld - nebenkosten;
  }
  
  // Convert monthly values to yearly
  const jaehrlicheKaltmiete = kaltmiete * 12;
  const jaehrlicheStellplatzmiete = stellplatz * 12;
  const jaehrlicheGesamtmiete = jaehrlicheKaltmiete + jaehrlicheStellplatzmiete;
  const jaehrlichesHausgeld = hausgeld * 12;
  const jaehrlicheNebenkosten = calculatedNebenkosten * 12;
  const jaehrlicheNichtUmlegbareNebenkosten = calculatedNichtUmlegbareNebenkosten * 12;
  
  // Financing calculations
  const jahreszins = zins / 100;
  const jahrestilgung = tilgung / 100;
  const jaehrlicheAnnuitaet = fremdkapital * (jahreszins + jahrestilgung);
  const monatlicheAnnuitaet = jaehrlicheAnnuitaet / 12;

  // Split annuity into interest (tax-deductible) and principal (not deductible)
  const jaehrlicheZinsen = fremdkapital * jahreszins;
  const monatlicheZinsen = jaehrlicheZinsen / 12;
  const jaehrlicheTilgung = fremdkapital * jahrestilgung;
  
  // Depreciation calculations
  // The depreciable basis is the building's share of the TOTAL acquisition cost
  // (Kaufpreis + Anschaffungsnebenkosten: Makler, Notar, Grunderwerbsteuer),
  // since these incidental costs are added to the AfA basis proportionally.
  const gebaeudeAnteil = 1 - (grundstueckswertAnteil / 100);
  const gebaeudewert = gesamtkosten * gebaeudeAnteil;
  const grundstueckswert = gesamtkosten - gebaeudewert;
  const jaehrlicheAbschreibung = gebaeudewert * (abschreibungsrate / 100);
  const monatlicheAbschreibung = jaehrlicheAbschreibung / 12;
  
  // Cash flow calculations
  const monatlicheEinnahmen = kaltmiete + stellplatz;
  const monatlicheAusgaben = calculatedNichtUmlegbareNebenkosten + monatlicheAnnuitaet;
  const monatlicherCashflow = monatlicheEinnahmen - monatlicheAusgaben;
  const jaehrlicherCashflow = monatlicherCashflow * 12;
  
  // Return calculations
  // Bruttomietrendite is conventionally measured against the purchase price,
  // which matches the "good >= 5 %" threshold used in the verdict.
  const mietrendite = (jaehrlicheGesamtmiete / kaufpreis) * 100;
  const cashflowRendite = (jaehrlicherCashflow / gesamtkosten) * 100;
  // Cash-on-cash return: pure liquidity return on the equity employed.
  const eigenkapitalrendite = (jaehrlicherCashflow / eigenkapitalBetrag) * 100;
  // Total equity return incl. principal repayment (Tilgung): the Tilgung is not
  // a real "cost" but builds equity, so it counts towards the wealth growth.
  const jaehrlicherVermoegenszuwachs = jaehrlicherCashflow + jaehrlicheTilgung;
  const eigenkapitalrenditeMitTilgung =
    eigenkapitalBetrag > 0 ? (jaehrlicherVermoegenszuwachs / eigenkapitalBetrag) * 100 : 0;
  
  // Quadratmeter calculations
  const kaufpreisProQm = kaufpreis / groesse;
  const mieteProQm = kaltmiete / groesse;

  // Kaufpreisfaktor: how many annual cold rents the purchase price equals
  const kaufpreisFaktor = jaehrlicheGesamtmiete > 0 ? kaufpreis / jaehrlicheGesamtmiete : 0;

  // ===== Brutto-Netto & tax saving from the property =====
  const gehaltEingabe = parseFloat(data.bruttoJahresgehalt) || 0;
  // The salary can be entered monthly or yearly.
  const brutto = data.gehaltsperiode === 'monat' ? gehaltEingabe * 12 : gehaltEingabe;
  const hasTaxData = brutto > 0;
  let steuer = { hasTaxData: false };
  let nettoCtx = null;

  if (hasTaxData) {
    const truthy = (v) => v === true || v === 'true' || v === 'ja';
    const netto = berechneNetto({
      brutto,
      alter: parseFloat(data.alter) || 0,
      bundesland: data.bundesland || 'Nordrhein-Westfalen',
      steuerklasse: data.steuerklasse || '1',
      kirchensteuerpflichtig: truthy(data.kirchensteuerpflichtig),
      kinder: parseFloat(data.kinder) || 0,
      zusatzbeitrag: data.zusatzbeitrag !== undefined && data.zusatzbeitrag !== ''
        ? parseFloat(data.zusatzbeitrag) : 2.5
    });
    nettoCtx = netto;

    // Taxable rental result (year 1): rent minus deductible costs (interest, AfA,
    // non-recoverable running costs). Usually a loss in the early years.
    const vermietungsErgebnis =
      jaehrlicheGesamtmiete
      - jaehrlicheNichtUmlegbareNebenkosten
      - jaehrlicheZinsen
      - jaehrlicheAbschreibung;

    const ersparnis = berechneSteuerersparnis(netto, vermietungsErgebnis);

    steuer = {
      hasTaxData: true,
      ...netto,
      ...ersparnis,
      nachSteuerCashflowJahr: jaehrlicherCashflow + ersparnis.ersparnisJahr,
      nachSteuerCashflowMonat: monatlicherCashflow + ersparnis.ersparnisMonat,
      // Total equity return incl. Tilgung and the tax saving.
      eigenkapitalrenditeMitTilgungNachSteuer: eigenkapitalBetrag > 0
        ? ((jaehrlicherVermoegenszuwachs + ersparnis.ersparnisJahr) / eigenkapitalBetrag) * 100
        : 0
    };
  }

  const results = {
    // Input values (for reference)
    input: values,
    
    // Costs
    kaufpreis,
    provisionBetrag,
    kaufnebenkostenBetrag,
    gesamtkosten,
    eigenkapitalBetrag,
    fremdkapital,
    
    // Monthly values
    kaltmiete,
    stellplatz,
    monatlicheGesamtmiete: kaltmiete + stellplatz,
    hausgeld,
    monatlicheNebenkosten: calculatedNebenkosten,
    monatlicheNichtUmlegbareNebenkosten: calculatedNichtUmlegbareNebenkosten,
    monatlicheAnnuitaet,
    monatlicheZinsen,
    monatlicheAbschreibung,
    monatlicherCashflow,
    
    // Annual values
    jaehrlicheKaltmiete,
    jaehrlicheStellplatzmiete,
    jaehrlicheGesamtmiete,
    jaehrlichesHausgeld,
    jaehrlicheNebenkosten,
    jaehrlicheNichtUmlegbareNebenkosten,
    jaehrlicheAnnuitaet,
    jaehrlicheZinsen,
    jaehrlicheTilgung,
    jaehrlicheAbschreibung,
    jaehrlicherCashflow,
    
    // Key metrics
    mietrendite,
    cashflowRendite,
    eigenkapitalrendite,
    eigenkapitalrenditeMitTilgung,
    jaehrlicherVermoegenszuwachs,
    kaufpreisFaktor,
    nachSteuerCashflowMonatlich: steuer.hasTaxData ? steuer.nachSteuerCashflowMonat : monatlicherCashflow,
    
    // Tax / net income
    steuer,
    
    // Per square meter
    kaufpreisProQm,
    mieteProQm,
    
    // Depreciation
    gebaeudewert,
    grundstueckswert
  };

  // Transparent overall verdict derived from the key metrics above
  results.verdict = calculateVerdict(results);

  // Multi-year amortization & cashflow projection (optional, on-demand display).
  results.projektion = buildProjection({
    fremdkapital,
    jahreszins,
    jaehrlicheAnnuitaet,
    jaehrlicheGesamtmiete,
    jaehrlicheNichtUmlegbareNebenkosten,
    jaehrlicheAbschreibung,
    nettoCtx
  });

  return results;
};