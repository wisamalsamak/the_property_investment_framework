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
    provision,
    hausgeld,
    nebenkosten,
    nichtUmlegbareNebenkosten,
    zins,
    tilgung,
    mieteinnahmen,
    abschreibungsrate,
    grundstueckswertAnteil
  } = values;

  // Calculate derived values
  const provisionBetrag = kaufpreis * (provision / 100);
  const grunderwerbsteuer = kaufpreis * 0.065; // 6.5% Grunderwerbsteuer
  const notar = kaufpreis * 0.02; // 2% Notarkosten
  const gesamtkosten = kaufpreis + provisionBetrag + grunderwerbsteuer + notar;
  
  // Calculate Nebenkosten if not provided
  let calculatedNebenkosten = nebenkosten;
  let calculatedNichtUmlegbareNebenkosten = nichtUmlegbareNebenkosten;
  
  if (hausgeld > 0 && nebenkosten === 0) {
    calculatedNebenkosten = hausgeld * 0.6;
    calculatedNichtUmlegbareNebenkosten = hausgeld - calculatedNebenkosten;
  } else if (hausgeld > 0 && nebenkosten > 0 && nichtUmlegbareNebenkosten === 0) {
    calculatedNichtUmlegbareNebenkosten = hausgeld - nebenkosten;
  }
  
  // Financing calculations
  const jahreszins = zins / 100;
  const jahrestilgung = tilgung / 100;
  const annuitaet = gesamtkosten * (jahreszins + jahrestilgung);
  
  // Depreciation calculations
  const gebaeudewert = kaufpreis * (1 - (grundstueckswertAnteil / 100));
  const jaehrlicheAbschreibung = gebaeudewert * (abschreibungsrate / 100);
  
  // Monthly values
  const monatlicheMiete = mieteinnahmen / 12;
  const monatlicheNebenkosten = calculatedNebenkosten / 12;
  const monatlicheNichtUmlegbareNebenkosten = calculatedNichtUmlegbareNebenkosten / 12;
  const monatlicheAnnuitaet = annuitaet / 12;
  const monatlicheAbschreibung = jaehrlicheAbschreibung / 12;
  
  // Cash flow calculations
  const monatlicheEinnahmen = monatlicheMiete;
  const monatlicheAusgaben = monatlicheNichtUmlegbareNebenkosten + monatlicheAnnuitaet;
  const monatlicherCashflow = monatlicheEinnahmen - monatlicheAusgaben;
  const jaehrlicherCashflow = monatlicherCashflow * 12;
  
  // Return calculations
  const mietrendite = (mieteinnahmen / gesamtkosten) * 100;
  const cashflowRendite = (jaehrlicherCashflow / gesamtkosten) * 100;
  const eigenkapitalrendite = cashflowRendite; // Simplified, assuming 100% equity
  
  // Quadratmeter calculations
  const kaufpreisProQm = kaufpreis / groesse;
  const mieteProQm = monatlicheMiete / groesse;
  
  return {
    // Input values (for reference)
    input: values,
    
    // Costs
    kaufpreis,
    provisionBetrag,
    grunderwerbsteuer,
    notar,
    gesamtkosten,
    
    // Monthly values
    monatlicheMiete,
    monatlicheNebenkosten,
    monatlicheNichtUmlegbareNebenkosten,
    monatlicheAnnuitaet,
    monatlicheAbschreibung,
    monatlicherCashflow,
    
    // Annual values
    jaehrlicheMiete: mieteinnahmen,
    jaehrlicheNebenkosten: calculatedNebenkosten,
    jaehrlicheNichtUmlegbareNebenkosten: calculatedNichtUmlegbareNebenkosten,
    jaehrlicheAnnuitaet: annuitaet,
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