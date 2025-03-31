import React, { useState } from 'react';
import InfoTooltip from './InfoTooltip';
import { formatCurrency, formatPercent } from '../utils/calculations';

const Results = ({ results, onReset }) => {
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
      <h2>Ergebnisse Ihrer Immobilieninvestition</h2>
      
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
      
      <div className="summary">
        <div className="summary-item">
          <span>Mietrendite</span>
          <span className={`value ${getValueClass(results.mietrendite)}`}>
            {formatPercent(results.mietrendite)}
          </span>
          <InfoTooltip text={`Jährliche Mieteinnahmen im Verhältnis zur Gesamtinvestition
${showCalculations ? `Berechnung: (${formatCurrency(results.jaehrlicheGesamtmiete)} ÷ ${formatCurrency(results.gesamtkosten)}) × 100 = ${formatPercent(results.mietrendite)}` : ''}`} />
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
          <InfoTooltip text={`Jährlicher Cashflow im Verhältnis zum eingesetzten Eigenkapital
${showCalculations ? `Berechnung: (${formatCurrency(results.jaehrlicherCashflow)} ÷ ${formatCurrency(results.eigenkapitalBetrag)}) × 100 = ${formatPercent(results.eigenkapitalrendite)}` : ''}`} />
        </div>
        
        <div className="summary-item">
          <span>Monatlicher Cashflow</span>
          <span className={`value ${getValueClass(results.monatlicherCashflow)}`}>
            {formatCurrency(results.monatlicherCashflow)}
          </span>
          <InfoTooltip text={`Monatliche Einnahmen abzüglich aller Ausgaben
${showCalculations ? `Berechnung: ${formatCurrency(results.monatlicheGesamtmiete)} - ${formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)} - ${formatCurrency(results.monatlicheAnnuitaet)} = ${formatCurrency(results.monatlicherCashflow)}` : ''}`} />
        </div>
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
                Kaufpreis × (100% - Grundstückswertanteil%) = Gebäudewert<br/>
                {formatCurrency(results.kaufpreis)} × (100% - {results.input.grundstueckswertAnteil}%) = {formatCurrency(results.gebaeudewert)}
              </td>
            )}
          </tr>
          <tr>
            <td>Grundstückswert ({results.input.grundstueckswertAnteil}%)</td>
            <td>{formatCurrency(results.grundstueckswert)}</td>
            {showCalculations && (
              <td>
                Kaufpreis × Grundstückswertanteil% = Grundstückswert<br/>
                {formatCurrency(results.kaufpreis)} × {results.input.grundstueckswertAnteil}% = {formatCurrency(results.grundstueckswert)}
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
      
      <div className="button-container">
        <button onClick={onReset}>Neue Berechnung</button>
        <button onClick={() => window.print()} className="secondary">Ergebnisse drucken</button>
      </div>
    </div>
  );
};

export default Results;