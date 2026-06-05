import React, { useState } from 'react';
import InfoTooltip from './InfoTooltip';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { STEUERKLASSEN } from '../utils/germanTax';

// Formats a criterion value according to its unit (€, %, x).
const formatCriterionValue = (criterion) => {
  if (criterion.unit === '€') return formatCurrency(criterion.value);
  if (criterion.unit === '%') return formatPercent(criterion.value);
  if (criterion.unit === 'x') return `${criterion.value.toFixed(1)}x`;
  return `${criterion.value}`;
};

// Describes the threshold rule for a criterion in plain language.
const describeThreshold = (criterion) => {
  const { thresholds, unit, lowerIsBetter } = criterion;
  const fmt = (v) => (unit === '%' ? `${v} %` : unit === 'x' ? `${v}x` : formatCurrency(v));
  if (lowerIsBetter) {
    return `Gut ≤ ${fmt(thresholds.good)} · Neutral ≤ ${fmt(thresholds.neutral)} · sonst Schwach`;
  }
  return `Gut ≥ ${fmt(thresholds.good)} · Neutral ≥ ${fmt(thresholds.neutral)} · sonst Schwach`;
};

// Prominent verdict card plus a transparent breakdown table that shows
// exactly how each metric contributed to the overall score.
const VerdictSection = ({ verdict }) => {
  const verdictClass = verdict.score >= 60 ? 'good' : verdict.score >= 40 ? 'neutral' : 'poor';
  return (
    <div className="verdict">
      <div className={`verdict-banner verdict-${verdictClass}`}>
        <div className="verdict-score">
          <span className="verdict-score-value">{verdict.score}</span>
          <span className="verdict-score-max">/ 100</span>
        </div>
        <div className="verdict-text">
          <span className="verdict-rating">{verdict.rating}</span>
          <span className="verdict-summary">{verdict.summary}</span>
        </div>
      </div>

      <h3>So kam das Urteil zustande</h3>
      <p className="verdict-intro">
        Jede Kennzahl wird mit „Gut", „Neutral" oder „Schwach" bewertet (2 / 1 / 0 Punkte)
        und je nach Wichtigkeit gewichtet. Aus erreichten {verdict.earned} von {verdict.max}
        {' '}gewichteten Punkten ergibt sich der Score von {verdict.score} %.
      </p>
      <table className="details-table verdict-table">
        <thead>
          <tr>
            <th>Kennzahl</th>
            <th>Wert</th>
            <th>Bewertung</th>
            <th>Gewicht</th>
            <th>Punkte</th>
            <th>Schwellenwerte</th>
          </tr>
        </thead>
        <tbody>
          {verdict.breakdown.map((c) => (
            <tr key={c.key} className={`verdict-row-${c.color}`}>
              <td>
                {c.label}
                <InfoTooltip text={`${c.description}\n${c.explanation}`} />
              </td>
              <td>{formatCriterionValue(c)}</td>
              <td>
                <span className={`verdict-badge verdict-badge-${c.color}`}>
                  {c.ratingLabel}
                </span>
              </td>
              <td>×{c.weight}</td>
              <td>{c.weightedPoints} / {c.maxWeightedPoints}</td>
              <td className="verdict-threshold">{describeThreshold(c)}</td>
            </tr>
          ))}
          <tr className="verdict-total-row">
            <td colSpan={4}><strong>Gesamt</strong></td>
            <td><strong>{verdict.earned} / {verdict.max}</strong></td>
            <td><strong>{verdict.score} %</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Shared helper for positive/negative row coloring (module scope).
const getRowClass = (value) => (value > 0 ? 'positive' : value < 0 ? 'negative' : '');

// Brutto-Netto income breakdown and the property tax saving, shown only when
// the user provided income data in step 4.
const TaxSection = ({ steuer, results, showCalculations }) => {
  const savingClass = getRowClass(steuer.ersparnisJahr);
  const steuerklasseLabel = (STEUERKLASSEN.find(k => k.value === String(steuer.steuerklasse)) || {}).label;
  return (
    <div className="tax-section">
      <h3>Brutto-Netto-Rechner (Schätzung 2025)</h3>
      <p className="verdict-intro">
        Geschätztes Nettoeinkommen aus Ihrem Bruttogehalt – inkl. Sozialabgaben,
        Lohnsteuer, Soli und ggf. Kirchensteuer.
        {steuerklasseLabel && <> Steuerklasse: <strong>{steuerklasseLabel}</strong>.</>}
      </p>
      <table className="details-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Jährlich</th>
            <th>Monatlich</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bruttoeinkommen</td>
            <td>{formatCurrency(steuer.brutto)}</td>
            <td>{formatCurrency(steuer.brutto / 12)}</td>
          </tr>
          <tr>
            <td>− Rentenversicherung</td>
            <td>{formatCurrency(steuer.rv)}</td>
            <td>{formatCurrency(steuer.rv / 12)}</td>
          </tr>
          <tr>
            <td>− Arbeitslosenversicherung</td>
            <td>{formatCurrency(steuer.av)}</td>
            <td>{formatCurrency(steuer.av / 12)}</td>
          </tr>
          <tr>
            <td>− Krankenversicherung</td>
            <td>{formatCurrency(steuer.kv)}</td>
            <td>{formatCurrency(steuer.kv / 12)}</td>
          </tr>
          <tr>
            <td>− Pflegeversicherung</td>
            <td>{formatCurrency(steuer.pv)}</td>
            <td>{formatCurrency(steuer.pv / 12)}</td>
          </tr>
          <tr>
            <td>− Lohn-/Einkommensteuer</td>
            <td>{formatCurrency(steuer.est)}</td>
            <td>{formatCurrency(steuer.est / 12)}</td>
          </tr>
          {steuer.soli > 0 && (
            <tr>
              <td>− Solidaritätszuschlag</td>
              <td>{formatCurrency(steuer.soli)}</td>
              <td>{formatCurrency(steuer.soli / 12)}</td>
            </tr>
          )}
          {steuer.kirchensteuer > 0 && (
            <tr>
              <td>− Kirchensteuer ({Math.round(steuer.kircheRate * 100)}%)</td>
              <td>{formatCurrency(steuer.kirchensteuer)}</td>
              <td>{formatCurrency(steuer.kirchensteuer / 12)}</td>
            </tr>
          )}
          <tr className="verdict-total-row">
            <td><strong>= Nettoeinkommen</strong></td>
            <td><strong>{formatCurrency(steuer.netto)}</strong></td>
            <td><strong>{formatCurrency(steuer.nettoMonatlich)}</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>Steuerersparnis durch die Immobilie</h3>
      <p className="verdict-intro">
        Zinsen und Abschreibung (AfA) mindern Ihr zu versteuerndes Einkommen. Das
        steuerliche Vermietungsergebnis im 1. Jahr und die daraus folgende Ersparnis:
      </p>
      <table className="details-table">
        <tbody>
          <tr>
            <td>Jahresmiete (kalt + Stellplatz)</td>
            <td>{formatCurrency(results.jaehrlicheGesamtmiete)}</td>
            {showCalculations && <td>Einnahmen aus Vermietung</td>}
          </tr>
          <tr>
            <td>− Nicht umlegbare Nebenkosten</td>
            <td>{formatCurrency(results.jaehrlicheNichtUmlegbareNebenkosten)}</td>
            {showCalculations && <td>Werbungskosten</td>}
          </tr>
          <tr>
            <td>− Schuldzinsen</td>
            <td>{formatCurrency(results.jaehrlicheZinsen)}</td>
            {showCalculations && (
              <td>Fremdkapital × Zins = {formatCurrency(results.fremdkapital)} × {results.input.zins}%</td>
            )}
          </tr>
          <tr>
            <td>− Abschreibung (AfA)</td>
            <td>{formatCurrency(results.jaehrlicheAbschreibung)}</td>
            {showCalculations && (
              <td>Gebäudewert × {results.input.abschreibungsrate}%</td>
            )}
          </tr>
          <tr className={getRowClass(steuer.vermietungsErgebnis)}>
            <td><strong>= Steuerliches Vermietungsergebnis</strong></td>
            <td><strong>{formatCurrency(steuer.vermietungsErgebnis)}</strong></td>
            {showCalculations && (
              <td>Negativ = steuerlicher Verlust, mindert das Einkommen</td>
            )}
          </tr>
          <tr>
            <td>Steuer auf Gehalt (vorher)</td>
            <td>{formatCurrency(steuer.steuerVorher)}</td>
            {showCalculations && <td>ESt + Soli + Kirchensteuer auf zvE {formatCurrency(steuer.zvE)}</td>}
          </tr>
          <tr>
            <td>Steuer mit Immobilie (nachher)</td>
            <td>{formatCurrency(steuer.steuerNachher)}</td>
            {showCalculations && <td>ESt + Soli + Kirchensteuer auf zvE {formatCurrency(Math.max(0, steuer.zvE + steuer.vermietungsErgebnis))}</td>}
          </tr>
          <tr className={savingClass}>
            <td><strong>= Steuerersparnis pro Jahr</strong></td>
            <td><strong>{formatCurrency(steuer.ersparnisJahr)}</strong></td>
            {showCalculations && (
              <td>{formatCurrency(steuer.steuerVorher)} − {formatCurrency(steuer.steuerNachher)} = {formatCurrency(steuer.ersparnisJahr)}</td>
            )}
          </tr>
          <tr>
            <td>Steuerersparnis pro Monat</td>
            <td>{formatCurrency(steuer.ersparnisMonat)}</td>
            {showCalculations && <td>Jahresersparnis ÷ 12</td>}
          </tr>
          <tr className={`verdict-total-row ${getRowClass(steuer.nachSteuerCashflowMonat)}`}>
            <td><strong>Cashflow nach Steuern (Monat)</strong></td>
            <td><strong>{formatCurrency(steuer.nachSteuerCashflowMonat)}</strong></td>
            {showCalculations && (
              <td>{formatCurrency(results.monatlicherCashflow)} + {formatCurrency(steuer.ersparnisMonat)} = {formatCurrency(steuer.nachSteuerCashflowMonat)}</td>
            )}
          </tr>
        </tbody>
      </table>
      <p className="tax-disclaimer">
        Hinweis: vereinfachte Schätzung für das Steuerjahr 2025, keine Steuerberatung.
        Zinsen sinken über die Laufzeit, dadurch verändert sich die Ersparnis in Folgejahren.
      </p>
    </div>
  );
};

// Prompt shown when the user did not enter any income in step 4, so the
// Brutto-Netto-Rechner could not be calculated.
const TaxHint = ({ onEdit }) => (
  <div className="tax-section tax-hint">
    <h3>Brutto-Netto-Rechner (Schätzung 2025)</h3>
    <p className="verdict-intro">
      Für den Brutto-Netto-Rechner und die Steuerersparnis fehlt noch Ihr
      Bruttogehalt. Tragen Sie es in Schritt 4 „Persönliche Steuerdaten“ ein –
      dann sehen Sie hier Ihr geschätztes Netto und wie viel Steuern Sie durch die
      Immobilie (Zinsen + AfA) sparen.
    </p>
    {onEdit && (
      <button type="button" onClick={onEdit}>→ Steuerdaten ergänzen</button>
    )}
  </div>
);

// Collapsible year-by-year amortization & cashflow projection. Collapsed by
// default so it does not overwhelm the headline results.
const ProjectionSection = ({ projektion, hasTaxData }) => {
  const [open, setOpen] = useState(false);
  if (!projektion || projektion.length === 0) return null;

  const last = projektion[projektion.length - 1];
  const tilgungsdauer = last.restschuldEnde <= 0.01 ? last.jahr : null;

  return (
    <div className="projection-section">
      <button
        type="button"
        className="panel-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? '▾' : '▸'} Entwicklung über die Jahre {open ? 'ausblenden' : 'anzeigen'}
      </button>
      {open && (
        <>
          <p className="verdict-intro">
            Die Annuität bleibt konstant – mit der Zeit sinken die Zinsen und der
            Tilgungsanteil steigt. Dadurch verändern sich Cashflow und
            Steuerersparnis Jahr für Jahr.
            {tilgungsdauer && <> Das Darlehen ist nach <strong>{tilgungsdauer} Jahren</strong> getilgt.</>}
          </p>
          <div className="projection-table-wrap">
            <table className="details-table projection-table">
              <thead>
                <tr>
                  <th>Jahr</th>
                  <th className="num">Restschuld</th>
                  <th className="num">Zinsen</th>
                  <th className="num">Tilgung</th>
                  <th className="num">AfA</th>
                  <th className="num">Steuerl. Ergebnis</th>
                  <th className="num">Cashflow</th>
                  {hasTaxData && <th className="num">Steuerersparnis</th>}
                  {hasTaxData && <th className="num">Cashflow n. St.</th>}
                </tr>
              </thead>
              <tbody>
                {projektion.map((r) => (
                  <tr key={r.jahr}>
                    <td>{r.jahr}</td>
                    <td className="num">{formatCurrency(r.restschuldEnde)}</td>
                    <td className="num">{formatCurrency(r.zinsen)}</td>
                    <td className="num">{formatCurrency(r.tilgung)}</td>
                    <td className="num">{formatCurrency(r.afa)}</td>
                    <td className={`num ${getRowClass(r.vermietungsErgebnis)}`}>{formatCurrency(r.vermietungsErgebnis)}</td>
                    <td className={`num ${getRowClass(r.cashflow)}`}>{formatCurrency(r.cashflow)}</td>
                    {hasTaxData && <td className="num positive">{formatCurrency(r.ersparnisJahr)}</td>}
                    {hasTaxData && <td className={`num ${getRowClass(r.nachSteuerCashflow)}`}>{formatCurrency(r.nachSteuerCashflow)}</td>}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="verdict-total-row">
                  <td><strong>Summe</strong></td>
                  <td className="num"></td>
                  <td className="num"></td>
                  <td className="num"><strong>{formatCurrency(last.kumTilgung)}</strong></td>
                  <td className="num"></td>
                  <td className="num"></td>
                  <td className={`num ${getRowClass(last.kumCashflow)}`}><strong>{formatCurrency(last.kumCashflow)}</strong></td>
                  {hasTaxData && <td className="num"></td>}
                  {hasTaxData && <td className={`num ${getRowClass(last.kumNachSteuer)}`}><strong>{formatCurrency(last.kumNachSteuer)}</strong></td>}
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="tax-disclaimer">
            Vereinfachte Projektion mit konstanter Miete, konstantem Hausgeld und
            gleichbleibendem Zinssatz (keine Zinsbindung/Anschlussfinanzierung
            berücksichtigt). AfA als linear angenommen.
          </p>
        </>
      )}
    </div>
  );
};

const Results = ({ results, onReset, onEdit, favoriteControl = null }) => {
  const [showCalculations, setShowCalculations] = useState(false);
  
  if (!results) return null;
  
  // Helper function to determine if a value is positive or negative
  const getValueClass = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
  };
  
  const toggleCalculations = () => {
    setShowCalculations(!showCalculations);
  };
  
  return (
    <div className="results">
      <div className="results-title">
        <h2>Ergebnisse Ihrer Immobilieninvestition</h2>
        {favoriteControl}
      </div>
      
      <div className="toggle-container">
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={showCalculations} 
            onChange={toggleCalculations}
          />
          <span className="toggle-slider"></span>
        </label>
        <span className="toggle-label">Berechnungen anzeigen</span>
      </div>
      
      {results.verdict && (
        <VerdictSection verdict={results.verdict} />
      )}
      
      <div className="summary">
        <div className="summary-item">
          <span>Mietrendite</span>
          <span className={`value ${getValueClass(results.mietrendite)}`}>
            {formatPercent(results.mietrendite)}
          </span>
          <InfoTooltip text={`Brutto-Mietrendite: jährliche Mieteinnahmen im Verhältnis zum Kaufpreis
${showCalculations ? `Berechnung: (${formatCurrency(results.jaehrlicheGesamtmiete)} ÷ ${formatCurrency(results.kaufpreis)}) × 100 = ${formatPercent(results.mietrendite)}` : ''}`} />
        </div>
        
        <div className="summary-item">
          <span>Cashflow-Rendite</span>
          <span className={`value ${getValueClass(results.cashflowRendite)}`}>
            {formatPercent(results.cashflowRendite)}
          </span>
          <InfoTooltip text={`Jährlicher Cashflow im Verhältnis zur Gesamtinvestition
${showCalculations ? `Berechnung: (${formatCurrency(results.jaehrlicherCashflow)} ÷ ${formatCurrency(results.gesamtkosten)}) × 100 = ${formatPercent(results.cashflowRendite)}` : ''}`} />
        </div>
        
        <div className="summary-item">
          <span>Eigenkapitalrendite</span>
          <span className={`value ${getValueClass(results.eigenkapitalrendite)}`}>
            {formatPercent(results.eigenkapitalrendite)}
          </span>
          <InfoTooltip text={`Cash-on-Cash: jährlicher Cashflow im Verhältnis zum eingesetzten Eigenkapital (Tilgung zählt hier als Ausgabe)
${showCalculations ? `Berechnung: (${formatCurrency(results.jaehrlicherCashflow)} ÷ ${formatCurrency(results.eigenkapitalBetrag)}) × 100 = ${formatPercent(results.eigenkapitalrendite)}` : ''}`} />
        </div>

        <div className="summary-item">
          <span>Gesamtrendite EK (inkl. Tilgung)</span>
          <span className={`value ${getValueClass(results.eigenkapitalrenditeMitTilgung)}`}>
            {formatPercent(results.eigenkapitalrenditeMitTilgung)}
          </span>
          <InfoTooltip text={`Vermögenszuwachs auf das Eigenkapital: Cashflow + Tilgung (Tilgung baut Vermögen auf, ist keine echte Ausgabe)
${showCalculations ? `Berechnung: ((${formatCurrency(results.jaehrlicherCashflow)} + ${formatCurrency(results.jaehrlicheTilgung)}) ÷ ${formatCurrency(results.eigenkapitalBetrag)}) × 100 = ${formatPercent(results.eigenkapitalrenditeMitTilgung)}` : ''}`} />
        </div>
                
        <div className="summary-item">
          <span>Monatlicher Cashflow</span>
          <span className={`value ${getValueClass(results.monatlicherCashflow)}`}>
            {formatCurrency(results.monatlicherCashflow)}
          </span>
          <InfoTooltip text={`Monatliche Einnahmen abzüglich aller Ausgaben
${showCalculations ? `Berechnung: ${formatCurrency(results.monatlicheGesamtmiete)} - ${formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)} - ${formatCurrency(results.monatlicheAnnuitaet)} = ${formatCurrency(results.monatlicherCashflow)}` : ''}`} />
        </div>

        {results.steuer && results.steuer.hasTaxData && (
          <div className="summary-item">
            <span>Cashflow nach Steuern</span>
            <span className={`value ${getValueClass(results.steuer.nachSteuerCashflowMonat)}`}>
              {formatCurrency(results.steuer.nachSteuerCashflowMonat)}
            </span>
            <InfoTooltip text={`Monatlicher Cashflow inkl. Steuerersparnis
${showCalculations ? `Berechnung: ${formatCurrency(results.monatlicherCashflow)} + ${formatCurrency(results.steuer.ersparnisMonat)} (Steuerersparnis) = ${formatCurrency(results.steuer.nachSteuerCashflowMonat)}` : ''}`} />
          </div>
        )}
      </div>
      
      <h3>Kennzahlen im Detail</h3>
      <table className="details-table">
        <thead>
          <tr>
            <th>Kennzahl</th>
            <th>Monatlich</th>
            <th>Jährlich</th>
            {showCalculations && <th>Berechnung</th>}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Kaltmiete
              <InfoTooltip text="Einnahmen aus der Vermietung (Kaltmiete)" />
            </td>
            <td>{formatCurrency(results.kaltmiete)}</td>
            <td>{formatCurrency(results.jaehrlicheKaltmiete)}</td>
            {showCalculations && <td>Eingabewert × 12 = Jährlich</td>}
          </tr>
          
          {results.stellplatz > 0 && (
            <tr>
              <td>
                Stellplatz
                <InfoTooltip text="Einnahmen aus der Vermietung des Stellplatzes/Garage" />
              </td>
              <td>{formatCurrency(results.stellplatz)}</td>
              <td>{formatCurrency(results.jaehrlicheStellplatzmiete)}</td>
              {showCalculations && <td>Eingabewert × 12 = Jährlich</td>}
            </tr>
          )}
          
          <tr>
            <td>
              Gesamtmiete
              <InfoTooltip text="Summe aller Mieteinnahmen" />
            </td>
            <td>{formatCurrency(results.monatlicheGesamtmiete)}</td>
            <td>{formatCurrency(results.jaehrlicheGesamtmiete)}</td>
            {showCalculations && <td>Kaltmiete + Stellplatz = Gesamtmiete</td>}
          </tr>
          
          <tr>
            <td>
              Hausgeld
              <InfoTooltip text="Monatliches Hausgeld bei Eigentumswohnungen" />
            </td>
            <td>{formatCurrency(results.hausgeld)}</td>
            <td>{formatCurrency(results.jaehrlichesHausgeld)}</td>
            {showCalculations && <td>Eingabewert × 12 = Jährlich</td>}
          </tr>
          
          <tr>
            <td>
              Nebenkosten
              <InfoTooltip text="Umlegbare Nebenkosten, die vom Mieter getragen werden" />
            </td>
            <td>{formatCurrency(results.monatlicheNebenkosten)}</td>
            <td>{formatCurrency(results.jaehrlicheNebenkosten)}</td>
            {showCalculations && (
              <td>
                {results.input.nebenkosten > 0 
                  ? "Eingabewert × 12 = Jährlich" 
                  : `${formatCurrency(results.hausgeld)} × 0,6 = ${formatCurrency(results.monatlicheNebenkosten)}`}
              </td>
            )}
          </tr>
          
          <tr>
            <td>
              Nicht umlegbare Nebenkosten
              <InfoTooltip text="Kosten, die vom Vermieter getragen werden müssen (Hausgeld - Nebenkosten)" />
            </td>
            <td>{formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)}</td>
            <td>{formatCurrency(results.jaehrlicheNichtUmlegbareNebenkosten)}</td>
            {showCalculations && (
              <td>
                {results.input.nichtUmlegbareNebenkosten > 0 
                  ? "Eingabewert × 12 = Jährlich" 
                  : `Hausgeld - Nebenkosten = ${formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)}`}
              </td>
            )}
          </tr>
          
          <tr>
            <td>
              Annuität (Zins + Tilgung)
              <InfoTooltip text="Monatliche Zahlungen für Zins und Tilgung des Kredits" />
            </td>
            <td>{formatCurrency(results.monatlicheAnnuitaet)}</td>
            <td>{formatCurrency(results.jaehrlicheAnnuitaet)}</td>
            {showCalculations && (
              <td>
                Fremdkapital × (Zins + Tilgung) ÷ 12 = Monatlich<br/>
                {formatCurrency(results.fremdkapital)} × ({results.input.zins}% + {results.input.tilgung}%) ÷ 12 = {formatCurrency(results.monatlicheAnnuitaet)}
              </td>
            )}
          </tr>
          
          <tr>
            <td>
              Abschreibung
              <InfoTooltip text="Steuerliche Abschreibung des Gebäudewerts" />
            </td>
            <td>{formatCurrency(results.monatlicheAbschreibung)}</td>
            <td>{formatCurrency(results.jaehrlicheAbschreibung)}</td>
            {showCalculations && (
              <td>
                Gebäudewert × Abschreibungsrate ÷ 12 = Monatlich<br/>
                {formatCurrency(results.gebaeudewert)} × {results.input.abschreibungsrate}% ÷ 12 = {formatCurrency(results.monatlicheAbschreibung)}
              </td>
            )}
          </tr>
          
          <tr className={getValueClass(results.monatlicherCashflow)}>
            <td>
              <strong>Cashflow</strong>
              <InfoTooltip text="Einnahmen abzüglich aller Ausgaben" />
            </td>
            <td><strong>{formatCurrency(results.monatlicherCashflow)}</strong></td>
            <td><strong>{formatCurrency(results.jaehrlicherCashflow)}</strong></td>
            {showCalculations && (
              <td>
                Gesamtmiete - Nicht umlegbare NK - Annuität = Cashflow<br/>
                {formatCurrency(results.monatlicheGesamtmiete)} - {formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)} - {formatCurrency(results.monatlicheAnnuitaet)} = {formatCurrency(results.monatlicherCashflow)}
              </td>
            )}
          </tr>
        </tbody>
      </table>
      
      <h3>Investitionsdetails</h3>
      <table className="details-table">
        <tbody>
          <tr>
            <td>Kaufpreis</td>
            <td>{formatCurrency(results.kaufpreis)}</td>
            {showCalculations && <td>Eingabewert</td>}
          </tr>
          <tr>
            <td>Provision ({results.input.provision}%)</td>
            <td>{formatCurrency(results.provisionBetrag)}</td>
            {showCalculations && (
              <td>
                Kaufpreis × Provision% = Provisionsbetrag<br/>
                {formatCurrency(results.kaufpreis)} × {results.input.provision}% = {formatCurrency(results.provisionBetrag)}
              </td>
            )}
          </tr>
          <tr>
            <td>Kaufnebenkosten ({results.input.kaufnebenkosten}%)</td>
            <td>{formatCurrency(results.kaufnebenkostenBetrag)}</td>
            {showCalculations && (
              <td>
                Kaufpreis × Kaufnebenkosten% = Kaufnebenkostenbetrag<br/>
                {formatCurrency(results.kaufpreis)} × {results.input.kaufnebenkosten}% = {formatCurrency(results.kaufnebenkostenBetrag)}
              </td>
            )}
          </tr>
          <tr>
            <td><strong>Gesamtkosten</strong></td>
            <td><strong>{formatCurrency(results.gesamtkosten)}</strong></td>
            {showCalculations && (
              <td>
                Kaufpreis + Provision + Kaufnebenkosten = Gesamtkosten<br/>
                {formatCurrency(results.kaufpreis)} + {formatCurrency(results.provisionBetrag)} + {formatCurrency(results.kaufnebenkostenBetrag)} = {formatCurrency(results.gesamtkosten)}
              </td>
            )}
          </tr>
          <tr>
            <td>Eigenkapital ({results.input.eigenkapital}%)</td>
            <td>{formatCurrency(results.eigenkapitalBetrag)}</td>
            {showCalculations && (
              <td>
                Gesamtkosten × Eigenkapital% = Eigenkapitalbetrag<br/>
                {formatCurrency(results.gesamtkosten)} × {results.input.eigenkapital}% = {formatCurrency(results.eigenkapitalBetrag)}
              </td>
            )}
          </tr>
          <tr>
            <td>Fremdkapital</td>
            <td>{formatCurrency(results.fremdkapital)}</td>
            {showCalculations && (
              <td>
                Gesamtkosten - Eigenkapital = Fremdkapital<br/>
                {formatCurrency(results.gesamtkosten)} - {formatCurrency(results.eigenkapitalBetrag)} = {formatCurrency(results.fremdkapital)}
              </td>
            )}
          </tr>
        </tbody>
      </table>
      
      <h3>Kennzahlen pro Quadratmeter</h3>
      <table className="details-table">
        <tbody>
          <tr>
            <td>Kaufpreis pro m²</td>
            <td>{formatCurrency(results.kaufpreisProQm)}</td>
            {showCalculations && (
              <td>
                Kaufpreis ÷ Größe = Kaufpreis pro m²<br/>
                {formatCurrency(results.kaufpreis)} ÷ {results.input.groesse} m² = {formatCurrency(results.kaufpreisProQm)}
              </td>
            )}
          </tr>
          <tr>
            <td>Kaltmiete pro m²</td>
            <td>{formatCurrency(results.mieteProQm)}</td>
            {showCalculations && (
              <td>
                Kaltmiete ÷ Größe = Kaltmiete pro m²<br/>
                {formatCurrency(results.kaltmiete)} ÷ {results.input.groesse} m² = {formatCurrency(results.mieteProQm)}
              </td>
            )}
          </tr>
        </tbody>
      </table>
      
      <h3>Abschreibungsdetails</h3>
      <table className="details-table">
        <tbody>
          <tr>
            <td>Gebäudewert ({100 - results.input.grundstueckswertAnteil}%)</td>
            <td>{formatCurrency(results.gebaeudewert)}</td>
            {showCalculations && (
              <td>
                Gesamtkosten × (100% - Grundstückswertanteil%) = Gebäudewert<br/>
                {formatCurrency(results.gesamtkosten)} × (100% - {results.input.grundstueckswertAnteil}%) = {formatCurrency(results.gebaeudewert)}
              </td>
            )}
          </tr>
          <tr>
            <td>Grundstückswert ({results.input.grundstueckswertAnteil}%)</td>
            <td>{formatCurrency(results.grundstueckswert)}</td>
            {showCalculations && (
              <td>
                Gesamtkosten × Grundstückswertanteil% = Grundstückswert<br/>
                {formatCurrency(results.gesamtkosten)} × {results.input.grundstueckswertAnteil}% = {formatCurrency(results.grundstueckswert)}
              </td>
            )}
          </tr>
          <tr>
            <td>Jährliche Abschreibung ({results.input.abschreibungsrate}%)</td>
            <td>{formatCurrency(results.jaehrlicheAbschreibung)}</td>
            {showCalculations && (
              <td>
                Gebäudewert × Abschreibungsrate% = Jährliche Abschreibung<br/>
                {formatCurrency(results.gebaeudewert)} × {results.input.abschreibungsrate}% = {formatCurrency(results.jaehrlicheAbschreibung)}
              </td>
            )}
          </tr>
        </tbody>
      </table>
      <p className="tax-disclaimer">
        Die AfA-Bemessungsgrundlage umfasst den Gebäudeanteil der gesamten
        Anschaffungskosten (Kaufpreis + Makler, Notar &amp; Grunderwerbsteuer).
      </p>

      {results.steuer && results.steuer.hasTaxData ? (
        <TaxSection steuer={results.steuer} results={results} showCalculations={showCalculations} />
      ) : (
        <TaxHint onEdit={onEdit} />
      )}

      <ProjectionSection
        projektion={results.projektion}
        hasTaxData={!!(results.steuer && results.steuer.hasTaxData)}
      />
      
      <div className="button-container">
        {onEdit && (
          <button onClick={onEdit} className="secondary">← Eingaben bearbeiten</button>
        )}
        <button onClick={onReset}>Neue Berechnung</button>
        <button onClick={() => window.print()} className="secondary">Ergebnisse drucken</button>
      </div>
    </div>
  );
};

export default Results;