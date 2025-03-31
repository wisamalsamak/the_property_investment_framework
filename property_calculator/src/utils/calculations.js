// Helper functions for calculations
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
  
  // Depreciation calculations
  const gebaeudewert = kaufpreis * (1 - (grundstueckswertAnteil / 100));
  const jaehrlicheAbschreibung = gebaeudewert * (abschreibungsrate / 100);
  const monatlicheAbschreibung = jaehrlicheAbschreibung / 12;
  
  // Cash flow calculations
  const monatlicheEinnahmen = kaltmiete + stellplatz;
  const monatlicheAusgaben = calculatedNichtUmlegbareNebenkosten + monatlicheAnnuitaet;
  const monatlicherCashflow = monatlicheEinnahmen - monatlicheAusgaben;
  const jaehrlicherCashflow = monatlicherCashflow * 12;
  
  // Return calculations
  const mietrendite = (jaehrlicheGesamtmiete / gesamtkosten) * 100;
  const cashflowRendite = (jaehrlicherCashflow / gesamtkosten) * 100;
  const eigenkapitalrendite = (jaehrlicherCashflow / eigenkapitalBetrag) * 100;
  
  // Quadratmeter calculations
  const kaufpreisProQm = kaufpreis / groesse;
  const mieteProQm = kaltmiete / groesse;
  
  return {
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
    jaehrlicheAbschreibung,
    jaehrlicherCashflow,
    
    // Key metrics
    mietrendite,
    cashflowRendite,
    eigenkapitalrendite,
    
    // Per square meter
    kaufpreisProQm,
    mieteProQm,
    
    // Depreciation
    gebaeudewert,
    grundstueckswert: kaufpreis - gebaeudewert
  };
};