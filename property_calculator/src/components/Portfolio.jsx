import React, { useEffect, useMemo, useRef, useState } from 'react';
import InputWithLabel from './InputWithLabel';
import Results from './Results';
import { calculateResults, formatCurrency, formatPercent } from '../utils/calculations';
import { STEUERKLASSEN, BUNDESLAENDER } from '../utils/germanTax';
import {
  DEFAULT_ASSUMPTIONS,
  buildCalcInput,
  empfehlungForScore
} from '../data/muenchenListings';
import { CITIES, getCityById } from '../data/cities';
import { fetchLiveListings, fetchListingByUrl, DEFAULT_PROXY } from '../utils/immoweltProvider';
import { useAuth } from '../lib/AuthContext';
import { loadRemotePortfolio, saveRemotePortfolio } from '../lib/portfolioStore';

const EMPTY_LISTING = {
  titel: '',
  lage: '',
  url: '',
  kaufpreis: '',
  groesse: '',
  zimmer: '',
  kaltmiete: '',
  hausgeld: '',
  stellplatz: '',
  provision: ''
};

// Compact inline-editable number cell used in the overview table.
const EditableCell = ({ value, placeholder, onChange, step, prefix }) => (
  <input
    className="cell-input"
    type="number"
    inputMode="decimal"
    step={step}
    value={value == null ? '' : value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    title={prefix}
  />
);

const fmtFactor = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}×` : '–');
const fmtPerQm = (n) => (Number.isFinite(n) ? `${n.toFixed(2)} €` : '–');
const round0 = (n) => String(Math.round(Number.isFinite(n) ? n : 0));

// A field that can be entered either as a percentage or as an absolute amount,
// with a small unit toggle. The percentage lives in `pctKey`, the absolute in
// `absKey` (default `${pctKey}Abs`) and the chosen mode in `modeKey`
// (default `${pctKey}Mode`) on the listing object.
const PctAbsField = ({
  label,
  listing,
  pctKey,
  absKey,
  modeKey,
  absUnit = '€',
  defaultMode = 'pct',
  pctPlaceholder,
  absPlaceholder,
  hint,
  step = '0.01',
  onFieldChange
}) => {
  const mKey = modeKey || `${pctKey}Mode`;
  const aKey = absKey || `${pctKey}Abs`;
  const isAbs = (listing[mKey] || defaultMode) === 'abs';
  const activeKey = isAbs ? aKey : pctKey;
  return (
    <div className="form-group pct-abs-field">
      <label htmlFor={`${listing.id}-${activeKey}`}>
        <span>{label}</span>
        <span className="unit-toggle">
          <button
            type="button"
            className={!isAbs ? 'active' : ''}
            onClick={() => onFieldChange(listing.id, mKey, 'pct')}
            title="als Prozent eingeben"
          >
            %
          </button>
          <button
            type="button"
            className={isAbs ? 'active' : ''}
            onClick={() => onFieldChange(listing.id, mKey, 'abs')}
            title="als Betrag eingeben"
          >
            {absUnit}
          </button>
        </span>
      </label>
      <div className="input-with-unit">
        <input
          id={`${listing.id}-${activeKey}`}
          type="number"
          inputMode="decimal"
          step={step}
          value={listing[activeKey] ?? ''}
          placeholder={isAbs ? absPlaceholder : pctPlaceholder}
          onChange={(e) => onFieldChange(listing.id, activeKey, e.target.value)}
        />
        <span className="unit">{isAbs ? absUnit : '%'}</span>
      </div>
      {hint && <p className="field-description">{hint}</p>}
    </div>
  );
};

// Inline, collapsible edit + KPI panel for a single apartment. All listing
// fields are editable; because the parent recomputes `results` from the edited
// listing on every change, every KPI shown here updates dynamically.
const DetailPanel = ({ listing, results, score, empfehlung, assumptions = {}, onFieldChange, onFullAnalysis, onClose }) => {
  const handle = (e) => onFieldChange(listing.id, e.target.name, e.target.value);
  const mieteEstimate = Math.round(results.kaltmiete);
  const hausgeldEstimate = Math.round(results.hausgeld);

  // Effective (resolved) values for the percent-or-absolute fields, used for
  // hints and placeholders so the user always sees what is actually applied.
  const eff = results.input || {};
  const nkPct = results.hausgeld > 0 ? (results.monatlicheNebenkosten / results.hausgeld) * 100 : 0;

  const kpis = [
    { label: 'Score', value: score, sub: empfehlung.label, tone: empfehlung.color },
    { label: 'Mietrendite', value: formatPercent(results.mietrendite) },
    { label: 'Kaufpreisfaktor', value: fmtFactor(results.kaufpreisFaktor) },
    { label: 'Kaufpreis / m²', value: formatCurrency(results.kaufpreisProQm) },
    { label: 'Miete / m²', value: fmtPerQm(results.mieteProQm) },
    {
      label: 'Cashflow / Monat (vor Steuer)',
      value: formatCurrency(results.monatlicherCashflow),
      tone: results.monatlicherCashflow >= 0 ? 'pos' : 'neg'
    },
    {
      label: 'Cashflow / Monat (nach Steuer)',
      value: formatCurrency(results.nachSteuerCashflowMonatlich),
      tone: results.nachSteuerCashflowMonatlich >= 0 ? 'pos' : 'neg'
    },
    { label: 'Eigenkapitalrendite', value: formatPercent(results.eigenkapitalrendite) },
    { label: 'Eigenkapital', value: formatCurrency(results.eigenkapitalBetrag) },
    { label: 'Gesamtkosten', value: formatCurrency(results.gesamtkosten) },
    { label: 'Darlehen', value: formatCurrency(results.fremdkapital) },
    { label: 'Monatliche Rate', value: formatCurrency(results.monatlicheAnnuitaet) },
    { label: 'AfA / Jahr', value: formatCurrency(results.jaehrlicheAbschreibung) },
    {
      label: 'Nicht uml. NK / Monat',
      value: formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)
    }
  ];

  return (
    <div className="detail-panel">
      <div className="detail-panel-head">
        <h3>{listing.titel || 'Wohnung'} – bearbeiten</h3>
        <button type="button" className="link-cell" onClick={onClose}>
          ▴ Einklappen
        </button>
      </div>

      <div className="detail-panel-grid">
        <div className="detail-panel-edit">
          <div className="form-row">
            <InputWithLabel label="Titel" name="titel" type="text" value={listing.titel ?? ''} onChange={handle} />
            <InputWithLabel label="Lage / Stadtteil" name="lage" type="text" value={listing.lage ?? ''} onChange={handle} />
          </div>
          <div className="form-row">
            <InputWithLabel label="Kaufpreis" name="kaufpreis" value={listing.kaufpreis ?? ''} onChange={handle} unit="€" />
            <InputWithLabel label="Wohnfläche" name="groesse" value={listing.groesse ?? ''} onChange={handle} unit="m²" />
            <InputWithLabel label="Zimmer" name="zimmer" value={listing.zimmer ?? ''} onChange={handle} />
          </div>
          <div className="form-row">
            <InputWithLabel
              label="Kaltmiete"
              name="kaltmiete"
              value={listing.kaltmiete ?? ''}
              onChange={handle}
              unit="€/Monat"
              description={`Leer = Schätzung (${mieteEstimate} €/Monat).`}
            />
            <InputWithLabel
              label="Hausgeld"
              name="hausgeld"
              value={listing.hausgeld ?? ''}
              onChange={handle}
              unit="€/Monat"
              description={`Leer = Schätzung (${hausgeldEstimate} €/Monat).`}
            />
            <InputWithLabel label="Stellplatz" name="stellplatz" value={listing.stellplatz ?? ''} onChange={handle} unit="€/Monat" />
          </div>
          <div className="form-row">
            <PctAbsField
              label="Nebenkosten (umlegbar)"
              listing={listing}
              pctKey="nebenkostenPct"
              absKey="nebenkostenAbs"
              modeKey="nebenkostenMode"
              absUnit="€/Monat"
              step="1"
              pctPlaceholder={round0(nkPct)}
              absPlaceholder={round0(results.monatlicheNebenkosten)}
              onFieldChange={onFieldChange}
              hint={`Effektiv: ${nkPct.toFixed(0)} % vom Hausgeld · ${formatCurrency(results.monatlicheNebenkosten)}/Mon. umlegbar · nicht umlegbar ${formatCurrency(results.monatlicheNichtUmlegbareNebenkosten)}. Leer = 60/40-Automatik.`}
            />
            <PctAbsField
              label="AfA (Abschreibung)"
              listing={listing}
              pctKey="abschreibungsrate"
              absUnit="€/Jahr"
              step="0.1"
              pctPlaceholder={(+eff.abschreibungsrate || 0).toFixed(1)}
              absPlaceholder={round0(results.jaehrlicheAbschreibung)}
              onFieldChange={onFieldChange}
              hint={`Effektiv: ${(+eff.abschreibungsrate || 0).toFixed(2)} % auf Gebäudewert · ${formatCurrency(results.jaehrlicheAbschreibung)}/Jahr.`}
            />
          </div>
          <div className="form-row">
            <PctAbsField
              label="Provision"
              listing={listing}
              pctKey="provision"
              absUnit="€"
              pctPlaceholder={(+eff.provision || 0).toFixed(2)}
              absPlaceholder={round0(results.provisionBetrag)}
              onFieldChange={onFieldChange}
              hint={`Effektiv: ${(+eff.provision || 0).toFixed(2)} % · ${formatCurrency(results.provisionBetrag)}.`}
            />
            <PctAbsField
              label="Kaufnebenkosten"
              listing={listing}
              pctKey="kaufnebenkosten"
              absUnit="€"
              step="0.1"
              pctPlaceholder={(+eff.kaufnebenkosten || 0).toFixed(1)}
              absPlaceholder={round0(results.kaufnebenkostenBetrag)}
              onFieldChange={onFieldChange}
              hint={`Effektiv: ${(+eff.kaufnebenkosten || 0).toFixed(2)} % · ${formatCurrency(results.kaufnebenkostenBetrag)}.`}
            />
            <PctAbsField
              label="Grundstücksanteil"
              listing={listing}
              pctKey="grundstueckswertAnteil"
              absUnit="€"
              step="1"
              pctPlaceholder={(+eff.grundstueckswertAnteil || 0).toFixed(0)}
              absPlaceholder={round0(results.grundstueckswert)}
              onFieldChange={onFieldChange}
              hint={`Effektiv: ${(+eff.grundstueckswertAnteil || 0).toFixed(1)} % · Bodenwert ${formatCurrency(results.grundstueckswert)} · Gebäudewert ${formatCurrency(results.gebaeudewert)}.`}
            />
          </div>
          <div className="form-row">
            <InputWithLabel label="Expose-URL" name="url" type="text" value={listing.url ?? ''} onChange={handle} />
          </div>

          <div className="detail-tax-override">
            <h4 className="assumptions-subhead">Steuerdaten (für diese Wohnung)</h4>
            <p className="field-description">
              Vorbelegt aus den globalen Annahmen. Leere Felder bzw. „(global)“
              übernehmen den globalen Wert – nur überschreiben, wenn diese Wohnung
              abweichen soll.
            </p>
            <div className="form-row">
              <InputWithLabel
                label="Bruttogehalt"
                name="bruttoJahresgehalt"
                value={listing.bruttoJahresgehalt ?? ''}
                onChange={handle}
                unit="€"
                description={`Global: ${assumptions.bruttoJahresgehalt || '–'} €`}
              />
              <InputWithLabel
                label="Zeitraum"
                name="gehaltsperiode"
                type="select"
                value={listing.gehaltsperiode ?? ''}
                onChange={handle}
                options={[
                  { value: '', label: `(global: ${assumptions.gehaltsperiode === 'jahr' ? 'pro Jahr' : 'pro Monat'})` },
                  { value: 'jahr', label: 'pro Jahr' },
                  { value: 'monat', label: 'pro Monat' }
                ]}
              />
              <InputWithLabel
                label="Steuerklasse"
                name="steuerklasse"
                type="select"
                value={listing.steuerklasse ?? ''}
                onChange={handle}
                options={[{ value: '', label: '(global)' }, ...STEUERKLASSEN]}
              />
            </div>
            <div className="form-row">
              <InputWithLabel
                label="Alter"
                name="alter"
                value={listing.alter ?? ''}
                onChange={handle}
                unit="Jahre"
                description={`Global: ${assumptions.alter || '–'}`}
              />
              <InputWithLabel
                label="Bundesland"
                name="bundesland"
                type="select"
                value={listing.bundesland ?? ''}
                onChange={handle}
                options={[
                  { value: '', label: `(global: ${assumptions.bundesland || 'Bayern'})` },
                  ...BUNDESLAENDER.map((b) => ({ value: b, label: b }))
                ]}
              />
              <InputWithLabel
                label="Kinder"
                name="kinder"
                value={listing.kinder ?? ''}
                onChange={handle}
                description={`Global: ${assumptions.kinder ?? '0'}`}
              />
            </div>
            <div className="form-row">
              <InputWithLabel
                label="KV-Zusatzbeitrag"
                name="zusatzbeitrag"
                value={listing.zusatzbeitrag ?? ''}
                onChange={handle}
                unit="%"
                step="0.1"
                description={`Global: ${assumptions.zusatzbeitrag ?? '2.5'} %`}
              />
              <InputWithLabel
                label="Kirchensteuer"
                name="kirchensteuerpflichtig"
                type="select"
                value={listing.kirchensteuerpflichtig ?? ''}
                onChange={handle}
                options={[
                  { value: '', label: `(global: ${assumptions.kirchensteuerpflichtig ? 'ja' : 'nein'})` },
                  { value: 'ja', label: 'ja' },
                  { value: 'nein', label: 'nein' }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="detail-panel-kpis">
          {kpis.map((k) => (
            <div className="kpi-card" key={k.label}>
              <span className="kpi-label">{k.label}</span>
              <span className={`kpi-value ${k.tone || ''}`}>{k.value}</span>
              {k.sub && <span className="kpi-sub">{k.sub}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="detail-panel-actions">
        {listing.url && (
          <a href={listing.url} target="_blank" rel="noopener noreferrer" className="link-cell">
            ↗ Anzeige bei der Quelle öffnen
          </a>
        )}
        <button type="button" className="link-cell" onClick={() => onFullAnalysis(listing.id)}>
          Vollständige Auswertung anzeigen
        </button>
      </div>
    </div>
  );
};

const SORTERS = {
  score: (a, b) => b.score - a.score,
  preis: (a, b) => a.results.kaufpreis - b.results.kaufpreis,
  rendite: (a, b) => b.results.mietrendite - a.results.mietrendite,
  cashflow: (a, b) => b.cashflow - a.cashflow,
  qm: (a, b) => a.results.kaufpreisProQm - b.results.kaufpreisProQm
};

// Initial listings keyed by city id (from the curated dataset).
const initialListingsByCity = () =>
  Object.fromEntries(CITIES.map((c) => [c.id, c.listings]));

// Persisting the portfolio (loaded listings, edits, assumptions) to
// localStorage lets a freshly opened browser tab restore the same state, which
// is what makes "open details in a new tab" work even for live-imported flats
// that otherwise only live in component memory.
const STORAGE_KEY = 'portfolio-state-v1';

const loadPersisted = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

// Deep-link parameters of the current URL (set when a detail is opened in a new
// tab): ?ansicht=portfolio&stadt=<cityId>&wohnung=<listingId>
const readDeepLink = () => {
  const params = new URLSearchParams(window.location.search);
  return { stadt: params.get('stadt'), wohnung: params.get('wohnung') };
};

// Relative URL that re-opens a specific apartment's detail view in a new tab.
const detailHref = (cityId, listingId) =>
  `?ansicht=portfolio&stadt=${encodeURIComponent(cityId)}&wohnung=${encodeURIComponent(listingId)}`;

const Portfolio = () => {
  const { user } = useAuth();
  const [persisted] = useState(loadPersisted);
  const [deepLink] = useState(readDeepLink);

  const initialCityId =
    (deepLink.stadt && CITIES.some((c) => c.id === deepLink.stadt) && deepLink.stadt) ||
    persisted.cityId ||
    'muenchen';

  const [cityId, setCityId] = useState(initialCityId);
  const [assumptions, setAssumptions] = useState(persisted.assumptions || DEFAULT_ASSUMPTIONS);
  const [listingsByCity, setListingsByCity] = useState(() => ({
    ...initialListingsByCity(),
    ...(persisted.listingsByCity || {})
  }));
  const [sortBy, setSortBy] = useState('score');
  const [detailId, setDetailId] = useState(null);
  const [expandedId, setExpandedId] = useState(deepLink.wohnung || null);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newListing, setNewListing] = useState(EMPTY_LISTING);

  // Add-by-link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);

  // Live import state
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(null);
  const [liveLoadedCities, setLiveLoadedCities] = useState(persisted.liveLoadedCities || {});
  const [proxyBase] = useState(persisted.proxyBase || DEFAULT_PROXY);
  const [liveLimit, setLiveLimit] = useState(persisted.liveLimit || 24);

  // Persist the portfolio so other tabs (and reloads) can restore it.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cityId, assumptions, listingsByCity, liveLoadedCities, proxyBase, liveLimit })
      );
    } catch {
      /* storage full or unavailable – ignore */
    }
  }, [cityId, assumptions, listingsByCity, liveLoadedCities, proxyBase, liveLimit]);

  // ---- Cloud sync (Supabase) ---------------------------------------------
  // When a user is signed in, their portfolio is stored per-user in Supabase
  // and takes precedence over localStorage. Guests keep using localStorage only.
  const [syncState, setSyncState] = useState('idle'); // 'idle'|'loading'|'saving'|'saved'|'error'
  // Skips the first save right after we hydrate remote state into local state,
  // so loading a portfolio does not immediately write the same data back.
  const skipNextSaveRef = useRef(false);
  const saveTimerRef = useRef(null);

  const applyRemoteBlob = (blob) => {
    if (!blob || typeof blob !== 'object') return;
    skipNextSaveRef.current = true;
    if (blob.cityId) setCityId(blob.cityId);
    if (blob.assumptions) setAssumptions(blob.assumptions);
    if (blob.listingsByCity) {
      setListingsByCity({ ...initialListingsByCity(), ...blob.listingsByCity });
    }
    if (blob.liveLoadedCities) setLiveLoadedCities(blob.liveLoadedCities);
    if (blob.liveLimit) setLiveLimit(blob.liveLimit);
  };

  // On login (or session restore): pull the user's saved portfolio. If they have
  // no row yet, seed it with whatever is currently on screen (their guest work).
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setSyncState('loading');
    (async () => {
      try {
        const blob = await loadRemotePortfolio(user.id);
        if (!active) return;
        if (blob) {
          applyRemoteBlob(blob);
        } else {
          await saveRemotePortfolio(user.id, {
            cityId, assumptions, listingsByCity, liveLoadedCities, proxyBase, liveLimit
          });
        }
        if (active) setSyncState('saved');
      } catch {
        if (active) setSyncState('error');
      }
    })();
    return () => {
      active = false;
    };
    // Only react to the identity of the user, not to local state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Debounced push of local changes to Supabase while signed in.
  useEffect(() => {
    if (!user?.id) return undefined;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return undefined;
    }
    setSyncState('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveRemotePortfolio(user.id, {
          cityId, assumptions, listingsByCity, liveLoadedCities, proxyBase, liveLimit
        });
        setSyncState('saved');
      } catch {
        setSyncState('error');
      }
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cityId, assumptions, listingsByCity, liveLoadedCities, liveLimit]);

  // When opened via a deep link (new tab), scroll the expanded apartment row
  // into view so its detail panel is immediately visible.
  useEffect(() => {
    if (!deepLink.wohnung) return;
    const el = document.getElementById(`portfolio-row-${deepLink.wohnung}`);
    if (el) el.scrollIntoView({ block: 'center' });
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const city = getCityById(cityId);
  const listings = useMemo(() => listingsByCity[cityId] || [], [listingsByCity, cityId]);

  // Evaluate every listing of the current city with the current assumptions.
  const rows = useMemo(() => {
    const cityAssumptions = { ...assumptions, mietProQm: city.mietProQm || assumptions.mietProQm };
    const evaluated = listings.map((listing) => {
      const input = buildCalcInput(listing, cityAssumptions);
      const results = calculateResults(input);
      const score = results.verdict.score;
      const cashflow = results.steuer.hasTaxData
        ? results.steuer.nachSteuerCashflowMonat
        : results.monatlicherCashflow;
      return { listing, results, score, cashflow, empfehlung: empfehlungForScore(score) };
    });
    const sorter = SORTERS[sortBy] || SORTERS.score;
    return [...evaluated].sort(sorter);
  }, [listings, assumptions, sortBy, city]);

  const handleAssumptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAssumptions((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNewChange = (e) => {
    const { name, value } = e.target;
    setNewListing((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddListing = (e) => {
    e.preventDefault();
    if (!newListing.kaufpreis || !newListing.groesse) return;
    const id = `custom-${Date.now()}`;
    const toNum = (v) => (v === '' || v == null ? undefined : parseFloat(v));
    const entry = {
      id,
      titel: newListing.titel || 'Eigene Wohnung',
      lage: newListing.lage || city.name,
      url: newListing.url || '',
      kaufpreis: toNum(newListing.kaufpreis),
      groesse: toNum(newListing.groesse),
      zimmer: toNum(newListing.zimmer),
      kaltmiete: toNum(newListing.kaltmiete),
      hausgeld: toNum(newListing.hausgeld),
      stellplatz: toNum(newListing.stellplatz),
      provision: toNum(newListing.provision),
      quelle: 'Eigene Eingabe'
    };
    setListingsByCity((prev) => ({ ...prev, [cityId]: [...(prev[cityId] || []), entry] }));
    setNewListing(EMPTY_LISTING);
    setShowAddForm(false);
  };

  // Add a single apartment straight from its immowelt expose link: fetch the
  // page through the proxy, parse the key figures and append it to the city.
  const handleAddByUrl = async (e) => {
    if (e) e.preventDefault();
    const url = linkUrl.trim();
    if (!url) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      const entry = await fetchListingByUrl(url, { proxyBase, city });
      setListingsByCity((prev) => {
        const current = prev[cityId] || [];
        // Replace an existing entry with the same expose URL instead of duplicating.
        const without = current.filter((l) => l.id !== entry.id);
        return { ...prev, [cityId]: [...without, entry] };
      });
      setLinkUrl('');
      setExpandedId(entry.id);
    } catch (err) {
      setLinkError(err.message || 'Wohnung konnte nicht geladen werden.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleRemove = (id) => {
    setListingsByCity((prev) => ({
      ...prev,
      [cityId]: (prev[cityId] || []).filter((l) => l.id !== id)
    }));
  };

  // Toggle the inline detail/edit panel on a plain left-click, but let the
  // browser handle new-tab / new-window gestures (Ctrl/Cmd/Shift/middle-click)
  // natively so an apartment's details can be opened in a separate tab.
  const handleDetailClick = (e, id) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    setExpandedId((cur) => (cur === id ? null : id));
  };

  // Edit a single key figure of one listing in place. The overview recalculates
  // automatically because `rows` is derived from `listingsByCity`. An empty
  // value falls back to the estimate (see buildCalcInput).
  const handleListingFieldChange = (id, field, value) => {
    setListingsByCity((prev) => ({
      ...prev,
      [cityId]: (prev[cityId] || []).map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      )
    }));
  };

  const handleResetCity = () => {
    setListingsByCity((prev) => ({ ...prev, [cityId]: city.listings }));
    setLiveLoadedCities((prev) => ({ ...prev, [cityId]: false }));
    setLiveError(null);
  };

  const handleLoadLive = async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const live = await fetchLiveListings(city, { proxyBase, limit: Number(liveLimit) || 24 });
      setListingsByCity((prev) => ({ ...prev, [cityId]: live }));
      setLiveLoadedCities((prev) => ({ ...prev, [cityId]: true }));
    } catch (err) {
      setLiveError(err.message || 'Live-Daten konnten nicht geladen werden.');
    } finally {
      setLiveLoading(false);
    }
  };

  // Detail view for a single flat reuses the full Results component.
  if (detailId) {
    const row = rows.find((r) => r.listing.id === detailId);
    if (row) {
      return (
        <div className="portfolio-detail">
          <button className="secondary back-link" onClick={() => setDetailId(null)}>
            ← Zurück zur Übersicht
          </button>
          <h2 className="detail-heading">
            {row.listing.titel} – {row.listing.lage}
          </h2>
          {row.listing.url && (
            <p className="detail-source">
              Quelle:{' '}
              <a href={row.listing.url} target="_blank" rel="noopener noreferrer">
                {row.listing.quelle || 'Anzeige öffnen'}
              </a>
            </p>
          )}
          <Results results={row.results} onReset={() => setDetailId(null)} />
        </div>
      );
    }
  }

  const bestScore = rows.length ? rows[0].score : 0;
  const isLive = !!liveLoadedCities[cityId];

  return (
    <div className="portfolio">
      <p className="portfolio-intro">
        Mehrere Wohnungen einer Stadt auf einmal bewerten. Jede Wohnung wird mit Ihren
        persönlichen Annahmen (Finanzierung &amp; Steuer) durchgerechnet und erhält einen
        Score von 0–100 inklusive Empfehlung.
      </p>

      {user && (
        <p className={`sync-status sync-${syncState}`}>
          {syncState === 'loading' && '⟳ Portfolio wird geladen…'}
          {syncState === 'saving' && '⟳ Änderungen werden gespeichert…'}
          {syncState === 'saved' && '✓ In deinem Konto gespeichert'}
          {syncState === 'error' && '⚠ Synchronisierung fehlgeschlagen – lokal gespeichert'}
        </p>
      )}

      {/* City selector + source */}
      <div className="city-bar">
        <div className="city-select">
          <label htmlFor="citySelect">Stadt</label>
          <select
            id="citySelect"
            value={cityId}
            onChange={(e) => {
              setCityId(e.target.value);
              setDetailId(null);
              setLiveError(null);
            }}
          >
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="live-count">
          <label htmlFor="liveLimit">Anzahl</label>
          <input
            id="liveLimit"
            type="number"
            inputMode="numeric"
            min="1"
            max="100"
            value={liveLimit}
            onChange={(e) =>
              setLiveLimit(
                e.target.value === ''
                  ? ''
                  : Math.max(1, Math.min(100, Math.floor(Number(e.target.value)) || 1))
              )
            }
          />
        </div>

        <div className="source-control">
          <span className={`source-badge ${isLive ? 'live' : 'curated'}`}>
            {isLive ? '● Live (immowelt)' : '○ Kuratierte Daten'}
          </span>
          <button type="button" onClick={handleLoadLive} disabled={liveLoading}>
            {liveLoading ? 'Lade …' : `Live laden (${city.name}, ${liveLimit || 1})`}
          </button>
          {isLive && (
            <button type="button" className="secondary" onClick={handleResetCity}>
              Zurücksetzen
            </button>
          )}
        </div>
      </div>

      {liveError && <div className="live-error">{liveError}</div>}

      {/* Global assumptions */}
      <div className="assumptions-panel">
        <button
          type="button"
          className="panel-toggle"
          onClick={() => setShowAssumptions((s) => !s)}
        >
          {showAssumptions ? '▾' : '▸'} Meine Annahmen (Finanzierung &amp; Steuer)
        </button>
        {showAssumptions && (
          <div className="assumptions-grid">
            <p className="assumptions-hint">
              Änderungen werden <strong>sofort</strong> auf alle geladenen Wohnungen
              angewendet – kein erneutes „Live laden“ nötig.
            </p>

            <h4 className="assumptions-subhead">Steuerdaten (global)</h4>
            <p className="assumptions-hint">
              Gelten für alle Wohnungen. Pro Wohnung lassen sie sich im
              Detail-Panel bei Bedarf überschreiben.
            </p>
            <div className="form-row">
              <InputWithLabel
                label="Bruttogehalt"
                name="bruttoJahresgehalt"
                value={assumptions.bruttoJahresgehalt}
                onChange={handleAssumptionChange}
                unit="€"
              />
              <InputWithLabel
                label="Zeitraum"
                name="gehaltsperiode"
                type="select"
                value={assumptions.gehaltsperiode}
                onChange={handleAssumptionChange}
                options={[
                  { value: 'jahr', label: 'pro Jahr' },
                  { value: 'monat', label: 'pro Monat' }
                ]}
              />
              <InputWithLabel
                label="Steuerklasse"
                name="steuerklasse"
                type="select"
                value={assumptions.steuerklasse}
                onChange={handleAssumptionChange}
                options={STEUERKLASSEN}
              />
            </div>
            <div className="form-row">
              <InputWithLabel
                label="Alter"
                name="alter"
                value={assumptions.alter ?? ''}
                onChange={handleAssumptionChange}
                unit="Jahre"
              />
              <InputWithLabel
                label="Bundesland"
                name="bundesland"
                type="select"
                value={assumptions.bundesland || 'Bayern'}
                onChange={handleAssumptionChange}
                options={BUNDESLAENDER.map((b) => ({ value: b, label: b }))}
              />
              <InputWithLabel
                label="Kinder"
                name="kinder"
                value={assumptions.kinder ?? '0'}
                onChange={handleAssumptionChange}
              />
            </div>
            <div className="form-row">
              <InputWithLabel
                label="KV-Zusatzbeitrag"
                name="zusatzbeitrag"
                value={assumptions.zusatzbeitrag ?? '2.5'}
                onChange={handleAssumptionChange}
                unit="%"
                step="0.1"
              />
              <InputWithLabel
                label="Kirchensteuerpflichtig"
                name="kirchensteuerpflichtig"
                type="checkbox"
                checked={!!assumptions.kirchensteuerpflichtig}
                onChange={handleAssumptionChange}
              />
            </div>

            <h4 className="assumptions-subhead">Finanzierung &amp; Markt</h4>
            <div className="form-row">
              <div className="form-group pct-abs-field">
                <label htmlFor="assumption-eigenkapital">
                  <span>Eigenkapital</span>
                  <span className="unit-toggle">
                    <button
                      type="button"
                      className={(assumptions.eigenkapitalMode || 'pct') !== 'abs' ? 'active' : ''}
                      onClick={() => setAssumptions((p) => ({ ...p, eigenkapitalMode: 'pct' }))}
                      title="als Prozent eingeben"
                    >
                      %
                    </button>
                    <button
                      type="button"
                      className={(assumptions.eigenkapitalMode || 'pct') === 'abs' ? 'active' : ''}
                      onClick={() => setAssumptions((p) => ({ ...p, eigenkapitalMode: 'abs' }))}
                      title="als Betrag eingeben"
                    >
                      €
                    </button>
                  </span>
                </label>
                <div className="input-with-unit">
                  <input
                    id="assumption-eigenkapital"
                    type="number"
                    inputMode="decimal"
                    step={(assumptions.eigenkapitalMode || 'pct') === 'abs' ? '1000' : '1'}
                    name={(assumptions.eigenkapitalMode || 'pct') === 'abs' ? 'eigenkapitalAbs' : 'eigenkapital'}
                    value={
                      (assumptions.eigenkapitalMode || 'pct') === 'abs'
                        ? assumptions.eigenkapitalAbs ?? ''
                        : assumptions.eigenkapital ?? ''
                    }
                    placeholder={(assumptions.eigenkapitalMode || 'pct') === 'abs' ? 'z. B. 60000' : 'z. B. 20'}
                    onChange={handleAssumptionChange}
                  />
                  <span className="unit">{(assumptions.eigenkapitalMode || 'pct') === 'abs' ? '€' : '%'}</span>
                </div>
                <p className="field-description">
                  {(assumptions.eigenkapitalMode || 'pct') === 'abs'
                    ? 'Fester Betrag, der je Wohnung als Eigenkapital eingesetzt wird.'
                    : 'Anteil der Gesamtkosten (Kaufpreis + Nebenkosten).'}
                </p>
              </div>
              <InputWithLabel
                label="Zins"
                name="zins"
                value={assumptions.zins}
                onChange={handleAssumptionChange}
                unit="%"
                step="0.1"
              />
              <InputWithLabel
                label="Tilgung"
                name="tilgung"
                value={assumptions.tilgung}
                onChange={handleAssumptionChange}
                unit="%"
                step="0.1"
              />
            </div>
            <div className="form-row">
              <InputWithLabel
                label="Miete-Schätzung"
                name="mietProQm"
                value={assumptions.mietProQm}
                onChange={handleAssumptionChange}
                description={`Für Wohnungen ohne Mietangabe. Stadt-Standard ${city.name}: ${city.mietProQm} €/m².`}
                unit="€/m²"
                step="0.5"
              />
              <InputWithLabel
                label="Grundstücksanteil"
                name="grundstueckswertAnteil"
                value={assumptions.grundstueckswertAnteil}
                onChange={handleAssumptionChange}
                unit="%"
              />
              <InputWithLabel
                label="AfA-Satz"
                name="abschreibungsrate"
                value={assumptions.abschreibungsrate}
                onChange={handleAssumptionChange}
                unit="%"
                step="0.1"
              />
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="portfolio-toolbar">
        <div className="sort-control">
          <label htmlFor="sortBy">Sortieren nach:</label>
          <select id="sortBy" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="score">Score</option>
            <option value="rendite">Mietrendite</option>
            <option value="cashflow">Cashflow</option>
            <option value="preis">Kaufpreis</option>
            <option value="qm">Preis pro m²</option>
          </select>
        </div>
        <button type="button" onClick={() => setShowAddForm((s) => !s)}>
          {showAddForm ? '× Abbrechen' : '+ Wohnung hinzufügen'}
        </button>
      </div>

      {/* Add by immowelt link */}
      <form className="add-by-link" onSubmit={handleAddByUrl}>
        <input
          type="url"
          className="link-input"
          placeholder="immowelt-Link einfügen (www.immowelt.de/expose/…)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          disabled={linkLoading}
        />
        <button type="submit" disabled={linkLoading || !linkUrl.trim()}>
          {linkLoading ? 'Lädt…' : '+ Aus Link hinzufügen'}
        </button>
        {linkError && <span className="link-error">{linkError}</span>}
      </form>

      {/* Add listing form */}
      {showAddForm && (
        <form className="add-listing-form" onSubmit={handleAddListing}>
          <p className="add-hint">
            Eckdaten aus einem Expose (z. B. immowelt/ImmoScout) übernehmen. Pflicht:
            Kaufpreis &amp; Wohnfläche. Leere Felder werden geschätzt.
          </p>
          <div className="form-row">
            <InputWithLabel label="Titel" name="titel" type="text" value={newListing.titel} onChange={handleNewChange} />
            <InputWithLabel label="Lage / Stadtteil" name="lage" type="text" value={newListing.lage} onChange={handleNewChange} />
          </div>
          <div className="form-row">
            <InputWithLabel label="Kaufpreis" name="kaufpreis" value={newListing.kaufpreis} onChange={handleNewChange} unit="€" required />
            <InputWithLabel label="Wohnfläche" name="groesse" value={newListing.groesse} onChange={handleNewChange} unit="m²" required />
            <InputWithLabel label="Zimmer" name="zimmer" value={newListing.zimmer} onChange={handleNewChange} />
          </div>
          <div className="form-row">
            <InputWithLabel label="Kaltmiete (optional)" name="kaltmiete" value={newListing.kaltmiete} onChange={handleNewChange} unit="€/Monat" />
            <InputWithLabel label="Hausgeld (optional)" name="hausgeld" value={newListing.hausgeld} onChange={handleNewChange} unit="€/Monat" />
            <InputWithLabel label="Stellplatz (optional)" name="stellplatz" value={newListing.stellplatz} onChange={handleNewChange} unit="€/Monat" />
          </div>
          <div className="form-row">
            <InputWithLabel label="Provision (optional)" name="provision" value={newListing.provision} onChange={handleNewChange} unit="%" />
            <InputWithLabel label="Expose-URL (optional)" name="url" type="text" value={newListing.url} onChange={handleNewChange} />
          </div>
          <button type="submit">Wohnung übernehmen &amp; bewerten</button>
        </form>
      )}

      {/* Overview table */}
      <div className="portfolio-table-wrap">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Wohnung</th>
              <th className="num">Kaufpreis</th>
              <th className="num">Miete (kalt)</th>
              <th className="num">Hausgeld</th>
              <th className="num">€/m²</th>
              <th className="num">Mietrendite</th>
              <th className="num">Cashflow/Monat</th>
              <th className="num">Score</th>
              <th>Empfehlung</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ listing, results, score, cashflow, empfehlung }) => {
              const mieteEigen = listing.kaltmiete != null && listing.kaltmiete !== '';
              const hausgeldEigen = listing.hausgeld != null && listing.hausgeld !== '';
              return (
              <React.Fragment key={listing.id}>
              <tr
                id={`portfolio-row-${listing.id}`}
                className={`${score === bestScore ? 'is-best' : ''}${expandedId === listing.id ? ' is-expanded' : ''}`}
              >
                <td>
                  {listing.url ? (
                    <a
                      className="link-cell"
                      href={listing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Anzeige bei der Quelle öffnen"
                    >
                      {listing.titel}
                    </a>
                  ) : (
                    <a
                      className="link-cell"
                      href={detailHref(cityId, listing.id)}
                      onClick={(e) => handleDetailClick(e, listing.id)}
                    >
                      {listing.titel}
                    </a>
                  )}
                  <span className="cell-sub">
                    {listing.lage}
                    {listing.groesse ? ` · ${listing.groesse} m²` : ''}
                    {listing.zimmer ? ` · ${listing.zimmer} Zi.` : ''}
                  </span>
                </td>
                <td className="num" data-label="Kaufpreis">
                  <EditableCell
                    value={listing.kaufpreis}
                    onChange={(v) => handleListingFieldChange(listing.id, 'kaufpreis', v)}
                  />
                </td>
                <td className="num col-hide-mobile" data-label="Miete (kalt)">
                  <EditableCell
                    value={listing.kaltmiete}
                    placeholder={`≈ ${Math.round(results.kaltmiete)}`}
                    onChange={(v) => handleListingFieldChange(listing.id, 'kaltmiete', v)}
                  />
                  <span className="cell-sub">{mieteEigen ? 'eigene Angabe' : 'geschätzt'}</span>
                </td>
                <td className="num col-hide-mobile" data-label="Hausgeld">
                  <EditableCell
                    value={listing.hausgeld}
                    placeholder={`≈ ${Math.round(results.hausgeld)}`}
                    onChange={(v) => handleListingFieldChange(listing.id, 'hausgeld', v)}
                  />
                  <span className="cell-sub">{hausgeldEigen ? 'eigene Angabe' : 'geschätzt'}</span>
                </td>
                <td className="num col-hide-mobile" data-label="€/m²">{formatCurrency(results.kaufpreisProQm)}</td>
                <td className="num" data-label="Mietrendite">{formatPercent(results.mietrendite)}</td>
                <td className={`num ${cashflow >= 0 ? 'pos' : 'neg'}`} data-label="Cashflow/Monat">
                  {formatCurrency(cashflow)}
                </td>
                <td className="num" data-label="Score">
                  <span className={`score-pill ${empfehlung.color}`}>{score}</span>
                </td>
                <td data-label="Empfehlung">
                  <span className={`empfehlung ${empfehlung.color}`}>{empfehlung.label}</span>
                  <span className="cell-sub">{empfehlung.kurz}</span>
                </td>
                <td className="row-actions">
                  <a
                    className="link-cell"
                    href={detailHref(cityId, listing.id)}
                    onClick={(e) => handleDetailClick(e, listing.id)}
                    title="Details öffnen (Strg/⌘ + Klick für neuen Tab)"
                  >
                    {expandedId === listing.id ? '▴ Schließen' : 'Details'}
                  </a>
                  <button
                    className="link-cell danger"
                    onClick={() => handleRemove(listing.id)}
                    title="Aus der Liste entfernen"
                  >
                    Entfernen
                  </button>
                </td>
              </tr>
              {expandedId === listing.id && (
                <tr className="detail-panel-row">
                  <td colSpan={10}>
                    <DetailPanel
                      listing={listing}
                      results={results}
                      score={score}
                      empfehlung={empfehlung}
                      assumptions={assumptions}
                      onFieldChange={handleListingFieldChange}
                      onFullAnalysis={setDetailId}
                      onClose={() => setExpandedId(null)}
                    />
                  </td>
                </tr>
              )}
              </React.Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="empty-row">
                  Keine Wohnungen in der Liste. „Live laden“ oder „+ Wohnung hinzufügen“ nutzen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="portfolio-disclaimer">
        Cashflow/Monat ist – sofern ein Gehalt hinterlegt ist – der Cashflow nach Steuern.
        Live-/Beispiel-Wohnungen ohne Mietangabe nutzen die Miete-Schätzung. Vereinfachte
        Schätzung, keine Anlage- oder Steuerberatung.
      </p>
    </div>
  );
};

export default Portfolio;
