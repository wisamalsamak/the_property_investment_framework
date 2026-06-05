// "Favoriten" panel: lists the user's bookmarked apartments from both the
// single-apartment view and the city overview. Favorites are stored per-user in
// Supabase when signed in, otherwise in localStorage.
import React, { useState } from 'react';
import { useFavorites } from '../lib/FavoritesContext';
import { useAuth } from '../lib/AuthContext';
import Results from './Results';
import { formatCurrency, formatPercent } from '../utils/calculations';

const fmtCur = (n) => (Number.isFinite(n) ? formatCurrency(n) : '–');
const fmtPct = (n) => (Number.isFinite(n) ? formatPercent(n) : '–');
const fmtPerQm = (n) => (Number.isFinite(n) ? `${n.toFixed(0)} €` : '–');

const sourceLabel = (fav) =>
  fav.source === 'einzel' ? 'Einzelne Wohnung' : fav.cityName || 'Städte-Übersicht';

const Favorites = () => {
  const { favorites, removeFavorite, loading, configured } = useFavorites();
  const { user } = useAuth();
  const [detailId, setDetailId] = useState(null);

  // Newest first.
  const rows = [...favorites].sort((a, b) =>
    String(b.savedAt || '').localeCompare(String(a.savedAt || ''))
  );

  // Detail view: show the preserved full calculation for one favorite.
  if (detailId) {
    const fav = favorites.find((f) => f.id === detailId);
    if (fav?.results) {
      return (
        <div className="portfolio-detail">
          <button className="secondary back-link" onClick={() => setDetailId(null)}>
            ← Zurück zu den Favoriten
          </button>
          <h2 className="detail-heading">
            {fav.titel}
            {fav.lage ? ` – ${fav.lage}` : ''}
          </h2>
          {fav.url && (
            <p className="detail-source">
              Quelle:{' '}
              <a href={fav.url} target="_blank" rel="noopener noreferrer">
                {fav.quelle || 'Anzeige bei Immowelt öffnen'}
              </a>
            </p>
          )}
          <Results results={fav.results} onReset={() => setDetailId(null)} />
        </div>
      );
    }
  }

  return (
    <div className="favorites">
      <p className="portfolio-intro">
        Ihre gemerkten Wohnungen aus der Einzelbewertung und der Städte-Übersicht.
        Mit dem Stern&nbsp;★ markierte Wohnungen erscheinen hier.
        {configured && (
          user
            ? ' Sie sind angemeldet – Favoriten werden in Ihrem Konto gespeichert.'
            : ' Melden Sie sich an, um Favoriten geräteübergreifend zu speichern.'
        )}
      </p>

      {loading && <p className="sync-status sync-loading">⟳ Favoriten werden geladen…</p>}

      {rows.length === 0 ? (
        <div className="favorites-empty">
          Noch keine Favoriten. Tippen Sie in der Einzelbewertung oder in der
          Städte-Übersicht auf den Stern&nbsp;☆, um eine Wohnung zu merken.
        </div>
      ) : (
        <div className="portfolio-table-wrap">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>Wohnung</th>
                <th>Quelle</th>
                <th className="num">Kaufpreis</th>
                <th className="num">€/m²</th>
                <th className="num">Mietrendite</th>
                <th className="num">Cashflow/Monat</th>
                <th className="num">Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((fav) => {
                const cashflowClass =
                  fav.cashflow == null ? '' : fav.cashflow >= 0 ? 'pos' : 'neg';
                return (
                  <tr key={fav.id}>
                    <td>
                      {fav.url ? (
                        <a
                          className="link-cell"
                          href={fav.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Anzeige bei der Quelle öffnen"
                        >
                          {fav.titel}
                        </a>
                      ) : (
                        <span className="fav-title">{fav.titel}</span>
                      )}
                      <span className="cell-sub">
                        {fav.lage}
                        {fav.groesse ? ` · ${fav.groesse} m²` : ''}
                        {fav.zimmer ? ` · ${fav.zimmer} Zi.` : ''}
                      </span>
                    </td>
                    <td data-label="Quelle">
                      <span className="cell-sub">{sourceLabel(fav)}</span>
                    </td>
                    <td className="num" data-label="Kaufpreis">{fmtCur(fav.kaufpreis)}</td>
                    <td className="num" data-label="€/m²">{fmtPerQm(fav.kaufpreisProQm)}</td>
                    <td className="num" data-label="Mietrendite">{fmtPct(fav.mietrendite)}</td>
                    <td className={`num ${cashflowClass}`} data-label="Cashflow/Monat">
                      {fmtCur(fav.cashflow)}
                    </td>
                    <td className="num" data-label="Score">
                      {fav.score == null ? '–' : <span className="score-pill">{fav.score}</span>}
                    </td>
                    <td className="row-actions">
                      {fav.results && (
                        <button
                          className="link-cell"
                          onClick={() => setDetailId(fav.id)}
                          title="Berechnungsdetails anzeigen"
                        >
                          Details
                        </button>
                      )}
                      <button
                        className="link-cell danger"
                        onClick={() => removeFavorite(fav.id)}
                        title="Aus Favoriten entfernen"
                      >
                        ★ Entfernen
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Favorites;
