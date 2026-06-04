// German income-tax & Brutto->Netto estimation (Steuerjahr 2025).
// These are estimates for orientation, not tax advice.

// Social-security contribution ceilings 2025 (annual).
const BBG_RV_AV = 96600;   // Renten-/Arbeitslosenversicherung
const BBG_KV_PV = 66150;   // Kranken-/Pflegeversicherung

// Employee shares 2025.
const RV_SATZ = 0.093;     // Rentenversicherung (AN-Anteil)
const AV_SATZ = 0.013;     // Arbeitslosenversicherung (AN-Anteil)
const KV_SATZ = 0.073;     // Krankenversicherung Grundsatz (AN-Anteil, ohne Zusatzbeitrag)
const PV_SATZ = 0.018;     // Pflegeversicherung (AN-Anteil)
const PV_KINDERLOS = 0.006; // Zuschlag für Kinderlose ab 23

// Lump sums for the taxable-income estimate.
const ARBEITNEHMER_PAUSCHBETRAG = 1230;
const SONDERAUSGABEN_PAUSCHBETRAG = 36;
const GRUNDFREIBETRAG = 12096;                  // Grundfreibetrag 2025
const ENTLASTUNGSBETRAG_ALLEINERZIEHENDE = 4260; // Steuerklasse II (1. Kind)

// Bundesländer with 8 % church tax (rest: 9 %).
const KIRCHENSTEUER_8 = ['Bayern', 'Baden-Württemberg'];

// Steuerklassen for the selection in the form.
export const STEUERKLASSEN = [
  { value: '1', label: 'I – Ledig / geschieden' },
  { value: '2', label: 'II – Alleinerziehend' },
  { value: '3', label: 'III – Verheiratet (höheres Einkommen)' },
  { value: '4', label: 'IV – Verheiratet (ähnliches Einkommen)' },
  { value: '5', label: 'V – Verheiratet (geringeres Einkommen)' },
  { value: '6', label: 'VI – Zweit-/Nebenjob' }
];

export const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
];

export const kirchensteuersatz = (bundesland) =>
  KIRCHENSTEUER_8.includes(bundesland) ? 0.08 : 0.09;

// §32a EStG – Einkommensteuer-Grundtarif 2025.
export const einkommensteuerGrundtarif = (zvE) => {
  const x = Math.floor(Math.max(0, zvE));
  let tax;
  if (x <= 12096) {
    tax = 0;
  } else if (x <= 17443) {
    const y = (x - 12096) / 10000;
    tax = (932.30 * y + 1400) * y;
  } else if (x <= 68480) {
    const z = (x - 17443) / 10000;
    tax = (176.64 * z + 2397) * z + 1015.13;
  } else if (x <= 277825) {
    tax = 0.42 * x - 10911.92;
  } else {
    tax = 0.45 * x - 19246.67;
  }
  return Math.floor(tax);
};

// Apply Splitting-Verfahren for married/joint assessment.
export const einkommensteuer = (zvE, verheiratet) => {
  if (verheiratet) {
    return 2 * einkommensteuerGrundtarif(zvE / 2);
  }
  return einkommensteuerGrundtarif(zvE);
};

// Whether a Steuerklasse uses the Splitting tariff (doubled Grundfreibetrag).
export const istSplitting = (steuerklasse) => parseInt(steuerklasse, 10) === 3;

// Estimated annual Lohnsteuer depending on the Steuerklasse (vereinfacht).
export const lohnsteuer = (zvE, steuerklasse = 1) => {
  const klasse = parseInt(steuerklasse, 10) || 1;
  switch (klasse) {
    case 2:
      // Entlastungsbetrag für Alleinerziehende mindert die Bemessung.
      return einkommensteuerGrundtarif(Math.max(0, zvE - ENTLASTUNGSBETRAG_ALLEINERZIEHENDE));
    case 3:
      // Splittingtarif (doppelter Grundfreibetrag).
      return einkommensteuer(zvE, true);
    case 5:
    case 6:
      // Kein Grundfreibetrag (Schätzung: Einkommen um den Grundfreibetrag erhöht).
      return einkommensteuerGrundtarif(zvE + GRUNDFREIBETRAG);
    case 1:
    case 4:
    default:
      return einkommensteuerGrundtarif(zvE);
  }
};

// Solidaritätszuschlag 2025 (Freigrenze + Milderungszone).
export const soli = (est, verheiratet) => {
  const freigrenze = verheiratet ? 39900 : 19950;
  if (est <= freigrenze) return 0;
  return Math.min(0.055 * est, 0.119 * (est - freigrenze));
};

// Employee social-security contributions.
export const sozialabgaben = ({ brutto, alter, kinder, zusatzbeitrag }) => {
  const rvBasis = Math.min(brutto, BBG_RV_AV);
  const kvBasis = Math.min(brutto, BBG_KV_PV);

  const rv = rvBasis * RV_SATZ;
  const av = rvBasis * AV_SATZ;
  const kv = kvBasis * (KV_SATZ + (zusatzbeitrag / 100) / 2);

  let pvSatz = PV_SATZ;
  if (alter >= 23 && kinder === 0) pvSatz += PV_KINDERLOS;
  if (kinder >= 2) pvSatz -= 0.0025 * Math.min(kinder - 1, 4);
  pvSatz = Math.max(pvSatz, 0);
  const pv = kvBasis * pvSatz;

  return { rv, av, kv, pv, summe: rv + av + kv + pv };
};

// Total income-related tax (ESt + Soli + Kirchensteuer) for a given zvE.
const gesamtsteuer = (zvE, { steuerklasse, kircheRate }) => {
  const est = lohnsteuer(zvE, steuerklasse);
  const s = soli(est, istSplitting(steuerklasse));
  const kirche = est * kircheRate;
  return { est, soli: s, kirche, summe: est + s + kirche };
};

// Full Brutto -> Netto estimate plus the values needed for the property
// tax-saving comparison.
export const berechneNetto = (params) => {
  const {
    brutto = 0,
    alter = 0,
    bundesland = 'Nordrhein-Westfalen',
    steuerklasse = '1',
    kirchensteuerpflichtig = false,
    kinder = 0,
    zusatzbeitrag = 2.5
  } = params;

  const kircheRate = kirchensteuerpflichtig ? kirchensteuersatz(bundesland) : 0;
  const sozial = sozialabgaben({ brutto, alter, kinder, zusatzbeitrag });

  // Deductible provisions (vereinfachte Vorsorgepauschale: RV + KV + PV).
  const vorsorge = sozial.rv + sozial.kv + sozial.pv;
  const zvE = Math.max(0, brutto - ARBEITNEHMER_PAUSCHBETRAG - SONDERAUSGABEN_PAUSCHBETRAG - vorsorge);

  const steuer = gesamtsteuer(zvE, { steuerklasse, kircheRate });
  const netto = brutto - steuer.summe - sozial.summe;

  return {
    brutto,
    zvE,
    est: steuer.est,
    soli: steuer.soli,
    kirchensteuer: steuer.kirche,
    kircheRate,
    rv: sozial.rv,
    av: sozial.av,
    kv: sozial.kv,
    pv: sozial.pv,
    sozialabgaben: sozial.summe,
    steuernGesamt: steuer.summe,
    netto,
    nettoMonatlich: netto / 12,
    steuerklasse,
    // expose context so the property comparison can re-use it
    _ctx: { steuerklasse, kircheRate }
  };
};

// Tax saving from a property: the rental tax result (often a loss in the
// first years thanks to Zinsen + AfA) is added to the taxable income, and we
// compare the income tax before vs. after.
export const berechneSteuerersparnis = (nettoErgebnis, vermietungsErgebnis) => {
  const { zvE, _ctx } = nettoErgebnis;
  const steuerVorher = gesamtsteuer(zvE, _ctx).summe;
  const zvEneu = Math.max(0, zvE + vermietungsErgebnis);
  const steuerNachher = gesamtsteuer(zvEneu, _ctx).summe;
  const ersparnisJahr = steuerVorher - steuerNachher;
  return {
    vermietungsErgebnis,
    steuerVorher,
    steuerNachher,
    ersparnisJahr,
    ersparnisMonat: ersparnisJahr / 12
  };
};
