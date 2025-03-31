import React from 'react';
import InfoTooltip from './InfoTooltip';
import { formatCurrency, formatPercent } from '../utils/calculations';

const Results = ({ results, onReset }) => {
  if (!results) return null;
  
  // Helper function to determine if a value is positive or negative
  const getValueClass = (value) => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
  };
  
  return (
    <div className="results">
      <h2>Ergebnisse Ihrer Immobilieninvestition</h2>
      
      <div className="summary">
        <div className="summary-item">
          <span>Mietrendite</span>
          <span className={`value ${getValueClass(results.mietrendite)}`}>
            {formatPercent(results.mietrendite)}
          </span>
          <InfoTooltip text="Jährliche Mieteinnahmen im Verhältnis zur Gesamtinvestition" />
        </div>
        
        <div className="summary-item">
          <span>Cashflow-Rendite</span>
          <span className={`value ${getValueClass(results.cashflowRendite)}`}>
            {formatPercent(results.cashflowRendite)}
          </span>
          <InfoTooltip text="Jährlicher Cashflow im Verhältnis zur Gesamtinvestition" />
        </div>
        
        <div className="summary-item">
          <span>Monatlicher Cashflow</span>
          <span className={`value ${getValueClass(results.monatlicherCashflow)}`}>
            {formatCurrency(results.monatlicherCashflow)}
          </span>
          <InfoTooltip text="Monatliche Einnahmen abzüglich aller Ausgaben" />
        </div>
        
        <div className="summary-item">
          <span>Kaufpreis pro m²</span>
          <span className="value">
            {formatCurrency(results.kaufpreisProQm)}
          </span>
          <InfoTooltip text="Kaufpreis geteilt durch die Wohnfläche" />
        </div>
      </div>
      
      <h3>Kennzahlen im Detail</h3>
      <table className="details-table">
        <thead>
          <tr>
            <th>Kennzahl</th>
            <th>Monatlich</th>
            <th>Jährlich</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Mieteinnahmen
              <InfoTooltip text="Einnahmen aus der Vermietung (Kaltmiete)" />
            </td>
            <td>{formatCurrency(results.monatlicheMiete)}</td>
            <td>{formatCurrency(results.jaehrlicheMiete)}</td>
          </tr>
          
          <tr>
            <td>
              Nebenkosten
              <InfoTooltip text="Umlegbare Nebenkosten, die vom Mieter getragen werden" />
            </td>
            <td>{formatCurrency(results.monatlicheNebenkosten)}</td>
            <td>{formatCurrency(results.jaehrlicheNebenkosten)}</td>
          </tr>
          
          <tr>
            <td>
              Nicht umlegbare Nebenkosten
              <InfoTooltip text="Kosten, die vom Vermieter getragen werden müssen (Hausgeld - Nebenkosten)" />
            </td>
            <td>{formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)}</td>
            <td>{formatCurrency(results.jaehrlicheNichtUmlegbareNebenkosten)}</td>
          </tr>
          
          <tr>
            <td>
              Annuität (Zins + Tilgung)
              <InfoTooltip text="Monatliche Zahlungen für Zins und Tilgung des Kredits" />
            </td>
            <td>{formatCurrency(results.monatlicheAnnuitaet)}</td>
            <td>{formatCurrency(results.jaehrlicheAnnuitaet)}</td>
          </tr>
          
          <tr>
            <td>
              Abschreibung
              <InfoTooltip text="Steuerliche Abschreibung des Gebäudewerts" />
            </td>
            <td>{formatCurrency(results.monatlicheAbschreibung)}</td>
            <td>{formatCurrency(results.jaehrlicheAbschreibung)}</td>
          </tr>
          
          <tr className={getValueClass(results.monatlicherCashflow)}>
            <td>
              <strong>Cashflow</strong>
              <InfoTooltip text="Einnahmen abzüglich aller Ausgaben" />
            </td>
            <td><strong>{formatCurrency(results.monatlicherCashflow)}</strong></td>
            <td><strong>{formatCurrency(results.jaehrlicherCashflow)}</strong></td>
          </tr>
        </tbody>
      </table>
      
      <h3>Investitionsdetails</h3>
      <table className="details-table">
        <tbody>
          <tr>
            <td>Kaufpreis</td>
            <td>{formatCurrency(results.kaufpreis)}</td>
          </tr>
          <tr>
            <td>Provision</td>
            <td>{formatCurrency(results.provisionBetrag)}</td>
          </tr>
          <tr>
            <td>Grunderwerbsteuer (6,5%)</td>
            <td>{formatCurrency(results.grunderwerbsteuer)}</td>
          </tr>
          <tr>
            <td>Notar (2%)</td>
            <td>{formatCurrency(results.notar)}</td>
          </tr>
          <tr>
            <td><strong>Gesamtkosten</strong></td>
            <td><strong>{formatCurrency(results.gesamtkosten)}</strong></td>
          </tr>
        </tbody>
      </table>
      
      <h3>Abschreibungsdetails</h3>
      <table className="details-table">
        <tbody>
          <tr>
            <td>Gebäudewert</td>
            <td>{formatCurrency(results.gebaeudewert)}</td>
          </tr>
          <tr>
            <td>Grundstückswert</td>
            <td>{formatCurrency(results.grundstueckswert)}</td>
          </tr>
          <tr>
            <td>Jährliche Abschreibung</td>
            <td>{formatCurrency(results.jaehrlicheAbschreibung)}</td>
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