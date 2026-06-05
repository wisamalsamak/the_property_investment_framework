import React, { useState, useEffect } from 'react';
import InputWithLabel from './InputWithLabel';
import InfoTooltip from './InfoTooltip';
import { BUNDESLAENDER, STEUERKLASSEN } from '../utils/germanTax';

const DEFAULT_FORM_DATA = {
  groesse: '',
  kaufpreis: '',
  eigenkapital: '20',
  provision: '3.57',
  kaufnebenkosten: '8.5',
  zins: '3.5',
  tilgung: '2',
  kaltmiete: '',
  stellplatz: '0',
  hausgeld: '',
  nebenkosten: '',
  nichtUmlegbareNebenkosten: '',
  abschreibungsrate: '2',
  grundstueckswertAnteil: '20',
  // Step 4: personal tax data (optional)
  bruttoJahresgehalt: '',
  gehaltsperiode: 'jahr',
  steuerklasse: '1',
  alter: '',
  bundesland: 'Nordrhein-Westfalen',
  kirchensteuerpflichtig: false,
  kinder: '0',
  zusatzbeitrag: '2.5'
};

const STEP_LABELS = [
  'Grunddaten',
  'Finanzierung',
  'Miete & Kosten',
  'Steuerdaten',
];

// Defined at module level (not inside StepForm) so React never remounts it.
// All per-render data is passed as explicit props.
const PctAbsInput = ({
  field, label, description, tooltip,
  min, max, step, required,
  isAbs, baseExists, absUnit,
  displayValue, error,
  onTogglePct, onToggleAbs, onChange,
}) => (
  <div className="form-group">
    <label htmlFor={field}>
      <span>{label}</span>
      {required && <span className="required">*</span>}
      {tooltip && <InfoTooltip text={tooltip} />}
      <span className="unit-toggle">
        <button type="button" className={!isAbs ? 'active' : ''} onClick={onTogglePct}>%</button>
        <button type="button" className={isAbs ? 'active' : ''} onClick={onToggleAbs}
          disabled={!baseExists} title={!baseExists ? 'Kaufpreis erst eingeben' : undefined}>€</button>
      </span>
    </label>
    {description && <p className="field-description">{description}</p>}
    <div className={`input-with-unit ${error ? 'error' : ''}`}>
      <input
        type="number"
        id={field}
        name={field}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        min={min != null ? min : '0'}
        max={isAbs ? undefined : max}
        step={isAbs ? '1' : (step || 'any')}
      />
      <span className="unit">{isAbs ? absUnit : '%'}</span>
    </div>
    {error && <div className="error-message">{error}</div>}
  </div>
);

const StepForm = ({ onComplete, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const formTopRef = React.useRef(null);
  const [formData, setFormData] = useState({
    ...DEFAULT_FORM_DATA,
    ...(initialData || {})
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Track which % fields are shown as absolute € values
  const [modes, setModes] = useState({
    eigenkapital: 'pct',
    provision: 'pct',
    kaufnebenkosten: 'pct',
    zins: 'pct',
    tilgung: 'pct',
    abschreibungsrate: 'pct',
    grundstueckswertAnteil: 'pct',
  });

  // Compute the base value (denominator) used to convert % ↔ €
  const getBase = (field) => {
    const kp = parseFloat(formData.kaufpreis) || 0;
    const prov = parseFloat(formData.provision) || 0;
    const nk = parseFloat(formData.kaufnebenkosten) || 0;
    const gesamtkosten = kp * (1 + prov / 100 + nk / 100);
    const ekPct = parseFloat(formData.eigenkapital) || 0;
    const fremdkapital = gesamtkosten * (1 - ekPct / 100);
    const grundPct = parseFloat(formData.grundstueckswertAnteil) || 20;
    const gebaeudewert = kp * (1 - grundPct / 100);
    switch (field) {
      case 'eigenkapital': return gesamtkosten;
      case 'provision': return kp;
      case 'kaufnebenkosten': return kp;
      case 'zins': return fremdkapital;
      case 'tilgung': return fremdkapital;
      case 'abschreibungsrate': return gebaeudewert;
      case 'grundstueckswertAnteil': return kp;
      default: return 0;
    }
  };

  // Return the value to show in the input: either the stored % or the computed €
  const getDisplayValue = (field) => {
    if (modes[field] === 'abs') {
      const pct = parseFloat(formData[field]) || 0;
      const base = getBase(field);
      if (base <= 0) return '';
      return String(Math.round(pct / 100 * base * 100) / 100);
    }
    return formData[field];
  };

  // Handle input changes for toggleable % fields
  const handlePctAbsChange = (field, value) => {
    if (modes[field] === 'abs') {
      const base = getBase(field);
      if (base > 0 && value !== '') {
        const pct = (parseFloat(value) / base) * 100;
        setFormData(prev => ({ ...prev, [field]: String(pct) }));
      } else {
        setFormData(prev => ({ ...prev, [field]: '' }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (!touched[field]) setTouched(prev => ({ ...prev, [field]: true }));
  };

  const toggleMode = (field, newMode) => setModes(prev => ({ ...prev, [field]: newMode }));

  // Helper to build all props for a PctAbsInput field
  const pctAbsProps = (field, opts = {}) => ({
    field,
    isAbs: modes[field] === 'abs',
    baseExists: getBase(field) > 0,
    absUnit: (field === 'zins' || field === 'tilgung') ? '€/Jahr' : '€',
    displayValue: getDisplayValue(field),
    error: errors[field],
    onTogglePct: () => toggleMode(field, 'pct'),
    onToggleAbs: () => toggleMode(field, 'abs'),
    onChange: (value) => handlePctAbsChange(field, value),
    ...opts,
  });


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched({
        ...touched,
        [name]: true
      });
    }
  };

  // Validate form data
  useEffect(() => {
    const newErrors = {};
    const nonNumericFields = ['bundesland', 'steuerklasse', 'gehaltsperiode', 'kirchensteuerpflichtig'];
    
    // Only validate touched fields
    Object.keys(touched).forEach(field => {
      if (touched[field] && !nonNumericFields.includes(field)) {
        const value = formData[field];
        
        // Required fields
        if (['groesse', 'kaufpreis', 'kaltmiete'].includes(field) && !value) {
          newErrors[field] = 'Dieses Feld ist erforderlich';
        }
        
        // Numeric validation
        if (value && isNaN(parseFloat(value))) {
          newErrors[field] = 'Bitte geben Sie eine gültige Zahl ein';
        }
        
        // Positive values
        if (parseFloat(value) < 0) {
          newErrors[field] = 'Der Wert muss positiv sein';
        }
        
        // Eigenkapital validation (0-100%)
        if (field === 'eigenkapital' && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
          newErrors[field] = 'Der Wert muss zwischen 0 und 100 liegen';
        }
      }
    });
    
    setErrors(newErrors);
  }, [formData, touched]);

  const isStepValid = (step) => {
    switch(step) {
      case 1:
        return formData.groesse && formData.kaufpreis && 
               !errors.groesse && !errors.kaufpreis;
      case 2:
        return !errors.eigenkapital && !errors.provision && 
               !errors.kaufnebenkosten && !errors.zins && !errors.tilgung;
      case 3:
        return formData.kaltmiete && !errors.kaltmiete && 
               !errors.stellplatz && !errors.hausgeld && 
               !errors.nebenkosten && !errors.nichtUmlegbareNebenkosten;
      case 4:
        // Optional step – only block on actual input errors
        return !errors.bruttoJahresgehalt && !errors.alter && 
               !errors.kinder && !errors.zusatzbeitrag;
      default:
        return true;
    }
  };

  const nextStep = () => {
    // Mark all fields in current step as touched
    const fieldsInCurrentStep = getFieldsForStep(currentStep);
    const newTouched = { ...touched };
    fieldsInCurrentStep.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    // Only proceed if current step is valid
    if (isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToStep = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
      if (formTopRef.current) {
        formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mark all fields as touched for final validation
    const allFields = Object.keys(formData);
    const newTouched = {};
    allFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);
    
    // Only submit if all steps are valid
    if (isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4)) {
      onComplete(formData);
    }
  };
  
  // Helper to get fields for a specific step
  const getFieldsForStep = (step) => {
    switch(step) {
      case 1:
        return ['groesse', 'kaufpreis'];
      case 2:
        return ['eigenkapital', 'provision', 'kaufnebenkosten', 'zins', 'tilgung'];
      case 3:
        return ['kaltmiete', 'stellplatz', 'hausgeld', 'nebenkosten', 'nichtUmlegbareNebenkosten', 'abschreibungsrate', 'grundstueckswertAnteil'];
      case 4:
        return ['bruttoJahresgehalt', 'gehaltsperiode', 'steuerklasse', 'alter', 'bundesland', 'kirchensteuerpflichtig', 'kinder', 'zusatzbeitrag'];
      default:
        return [];
    }
  };

  // Render different form sections based on current step
  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="step" key="step-1">
            <h3>Schritt 1: Grunddaten der Immobilie</h3>
            <p className="step-intro">Beginnen Sie mit den Eckdaten des Objekts. Felder mit * sind Pflichtfelder.</p>
            <InputWithLabel
              label="Wohnfläche"
              name="groesse"
              value={formData.groesse}
              onChange={handleChange}
              description="Wohnfläche laut Exposé – dient zur Berechnung von Preis und Miete pro m²."
              tooltip="Die Wohnfläche der Immobilie in Quadratmetern"
              unit="m²"
              min="0"
              step="0.01"
              required={true}
              error={errors.groesse}
            />
            
            <InputWithLabel
              label="Kaufpreis"
              name="kaufpreis"
              value={formData.kaufpreis}
              onChange={handleChange}
              description="Reiner Kaufpreis ohne Makler, Notar oder Grunderwerbsteuer (diese folgen in Schritt 2)."
              tooltip="Der Kaufpreis der Immobilie ohne Nebenkosten"
              unit="€"
              min="0"
              step="1000"
              required={true}
              error={errors.kaufpreis}
            />
            
            <div className="step-navigation">
              <div></div>
              <button 
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(1)}
              >
                Weiter
              </button>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="step" key="step-2">
            <h3>Schritt 2: Finanzierung</h3>
            <p className="step-intro">Wie wird der Kauf finanziert? Diese Angaben bestimmen Ihre monatliche Kreditrate.</p>
            
            <PctAbsInput {...pctAbsProps('eigenkapital', {
              label: 'Eigenkapital',
              description: 'Anteil der Gesamtkosten, den Sie selbst einbringen. Der Rest wird finanziert. Üblich: 10–30 %.',
              tooltip: 'Eigenkapitalanteil in Prozent der Gesamtkosten (Kaufpreis + Nebenkosten)',
              max: '100',
              step: '1',
            })} />
            
            <PctAbsInput {...pctAbsProps('provision', {
              label: 'Maklerprovision',
              description: 'Käuferanteil der Maklercourtage. Häufig 3,57 % inkl. MwSt. – 0 eingeben, wenn provisionsfrei.',
              tooltip: 'Die Maklerprovision in Prozent des Kaufpreises',
              step: '0.01',
            })} />
            
            <PctAbsInput {...pctAbsProps('kaufnebenkosten', {
              label: 'Kaufnebenkosten',
              description: 'Grunderwerbsteuer + Notar + Grundbuch. Je nach Bundesland ca. 6–10 % des Kaufpreises.',
              tooltip: 'Grunderwerbsteuer, Notar, etc. in Prozent des Kaufpreises',
              step: '0.1',
            })} />
            
            <div className="form-row">
              <PctAbsInput {...pctAbsProps('zins', {
                label: 'Sollzins',
                description: 'Jährlicher Kreditzins laut Bankangebot.',
                tooltip: 'Jahreszinssatz für die Finanzierung',
                step: '0.01',
              })} />
              
              <PctAbsInput {...pctAbsProps('tilgung', {
                label: 'Anfängliche Tilgung',
                description: 'Jährliche Tilgungsrate. Höher = schneller schuldenfrei, aber höhere Rate.',
                tooltip: 'Jährliche Tilgungsrate für die Finanzierung',
                step: '0.01',
              })} />
            </div>
            
            <div className="step-navigation">
              <button type="button" onClick={prevStep} className="secondary">Zurück</button>
              <button 
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(2)}
              >
                Weiter
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="step" key="step-3">
            <h3>Schritt 3: Miete & laufende Kosten</h3>
            <p className="step-intro">Einnahmen und Ausgaben pro Monat – daraus ergeben sich Cashflow und Rendite.</p>
            
            <div className="form-row">
              <InputWithLabel
                label="Kaltmiete"
                name="kaltmiete"
                value={formData.kaltmiete}
                onChange={handleChange}
                description="Monatliche Nettomiete ohne Betriebskosten."
                tooltip="Monatliche Kaltmiete ohne Nebenkosten"
                unit="€/Monat"
                min="0"
                required={true}
                error={errors.kaltmiete}
              />
              
              <InputWithLabel
                label="Stellplatz / Garage"
                name="stellplatz"
                value={formData.stellplatz}
                onChange={handleChange}
                description="Zusätzliche Mieteinnahme. 0 lassen, wenn nicht vorhanden."
                tooltip="Monatliche Mieteinnahmen für Stellplatz/Garage (falls vorhanden)"
                unit="€/Monat"
                min="0"
                error={errors.stellplatz}
              />
            </div>
            
            <InputWithLabel
              label="Hausgeld"
              name="hausgeld"
              value={formData.hausgeld}
              onChange={handleChange}
              description="Monatliche Zahlung an die Eigentümergemeinschaft (WEG). Teil davon legen Sie auf den Mieter um."
              tooltip="Monatliches Hausgeld (bei Eigentumswohnungen)"
              unit="€/Monat"
              min="0"
              error={errors.hausgeld}
            />
            
            <InputWithLabel
              label="davon umlegbare Nebenkosten"
              name="nebenkosten"
              value={formData.nebenkosten}
              onChange={handleChange}
              description="Vom Mieter erstattbarer Anteil (Heizung, Wasser, Müll …). Leer lassen = automatisch 60 % des Hausgelds."
              tooltip="Monatliche umlegbare Nebenkosten (wenn leer, wird 60% des Hausgelds angenommen)"
              unit="€/Monat"
              min="0"
              error={errors.nebenkosten}
            />
            
            <InputWithLabel
              label="davon nicht umlegbare Nebenkosten"
              name="nichtUmlegbareNebenkosten"
              value={formData.nichtUmlegbareNebenkosten}
              onChange={handleChange}
              description="Ihr Eigenanteil, der nicht auf den Mieter umgelegt werden kann (z. B. Verwaltung, Rücklage). Leer lassen = Hausgeld − umlegbare NK."
              tooltip="Monatliche nicht umlegbare Nebenkosten (wenn leer, wird Hausgeld - Nebenkosten angenommen)"
              unit="€/Monat"
              min="0"
              error={errors.nichtUmlegbareNebenkosten}
            />
            
            <div className="form-row">
              <PctAbsInput {...pctAbsProps('abschreibungsrate', {
                label: 'Abschreibungsrate (AfA)',
                description: 'Steuerliche Abschreibung des Gebäudes pro Jahr. Standard: 2 % (Baujahr ab 1925).',
                tooltip: 'Jährliche Abschreibungsrate für den Gebäudewert (typischerweise 2%)',
                step: '0.1',
              })} />
              
              <PctAbsInput {...pctAbsProps('grundstueckswertAnteil', {
                label: 'Grundstücksanteil',
                description: 'Anteil des Bodens am Kaufpreis. Nur das Gebäude ist abschreibbar – der Boden nicht.',
                tooltip: 'Anteil des Grundstückswerts am Gesamtkaufpreis',
                max: '100',
                step: '1',
              })} />
            </div>
            
            <div className="step-navigation">
              <button type="button" onClick={prevStep} className="secondary">Zurück</button>
              <button 
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(3)}
              >
                Weiter
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step" key="step-4">
            <h3>Schritt 4: Persönliche Steuerdaten (optional)</h3>
            <p className="step-intro">
              Optional: Mit Ihrem Einkommen schätzen wir Ihr Netto und die jährliche
              Steuerersparnis durch Zinsen und Abschreibung (AfA). Ohne Brutto-Gehalt
              wird dieser Teil übersprungen. Alle Angaben sind eine Schätzung für 2025,
              keine Steuerberatung.
            </p>

            <div className="form-row">
              <InputWithLabel
                label={formData.gehaltsperiode === 'monat' ? 'Brutto-Monatsgehalt' : 'Brutto-Jahresgehalt'}
                name="bruttoJahresgehalt"
                value={formData.bruttoJahresgehalt}
                onChange={handleChange}
                description="Ihr Bruttolohn. Leer lassen, um die Steuerberechnung zu überspringen."
                tooltip="Bruttoeinkommen aus nichtselbständiger Arbeit"
                unit={formData.gehaltsperiode === 'monat' ? '€/Monat' : '€/Jahr'}
                min="0"
                step={formData.gehaltsperiode === 'monat' ? '100' : '1000'}
                error={errors.bruttoJahresgehalt}
              />

              <InputWithLabel
                label="Zeitraum"
                name="gehaltsperiode"
                type="select"
                value={formData.gehaltsperiode}
                onChange={handleChange}
                description="Geben Sie Ihr Gehalt pro Jahr oder pro Monat ein."
                options={[
                  { value: 'jahr', label: 'pro Jahr' },
                  { value: 'monat', label: 'pro Monat' }
                ]}
              />
            </div>

            <div className="form-row">
              <InputWithLabel
                label="Steuerklasse"
                name="steuerklasse"
                type="select"
                value={formData.steuerklasse}
                onChange={handleChange}
                description="Bestimmt die Lohnsteuer. III/IV/V setzen eine Ehe/Lebenspartnerschaft voraus."
                options={STEUERKLASSEN}
              />

              <InputWithLabel
                label="Alter"
                name="alter"
                value={formData.alter}
                onChange={handleChange}
                description="Beeinflusst den Pflegeversicherungs-Zuschlag für Kinderlose ab 23."
                tooltip="Ihr Alter in Jahren"
                unit="Jahre"
                min="0"
                step="1"
                error={errors.alter}
              />
            </div>

            <InputWithLabel
              label="Bundesland"
              name="bundesland"
              type="select"
              value={formData.bundesland}
              onChange={handleChange}
              description="Bestimmt den Kirchensteuersatz (8 % in Bayern/Baden-Württemberg, sonst 9 %)."
              options={BUNDESLAENDER}
            />

            <div className="form-row">
              <InputWithLabel
                label="Anzahl Kinder"
                name="kinder"
                value={formData.kinder}
                onChange={handleChange}
                description="Reduziert ggf. den Pflegeversicherungsbeitrag."
                unit="Kinder"
                min="0"
                step="1"
                error={errors.kinder}
              />

              <InputWithLabel
                label="KV-Zusatzbeitrag"
                name="zusatzbeitrag"
                value={formData.zusatzbeitrag}
                onChange={handleChange}
                description="Kassenindividueller Zusatzbeitrag zur Krankenversicherung (Ø ca. 2,5 %)."
                tooltip="Zusatzbeitrag der gesetzlichen Krankenkasse in Prozent"
                unit="%"
                min="0"
                step="0.1"
                error={errors.zusatzbeitrag}
              />
            </div>

            <InputWithLabel
              label="Kirchensteuerpflichtig"
              name="kirchensteuerpflichtig"
              type="checkbox"
              checked={formData.kirchensteuerpflichtig}
              onChange={handleChange}
              description="Aktivieren, wenn Sie Kirchensteuer zahlen."
            />

            <div className="step-navigation">
              <button type="button" onClick={prevStep} className="secondary">Zurück</button>
              <button 
                type="submit"
                onClick={handleSubmit}
                disabled={!isStepValid(4)}
              >
                Berechnen
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form className="step-form" onSubmit={handleSubmit} ref={formTopRef}>
      <div className="step-indicator">
        {STEP_LABELS.map((label, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          if (isDone) {
            return (
              <button
                key={stepNum}
                type="button"
                className="step-indicator-item done"
                onClick={() => goToStep(stepNum)}
                title={`Zurück zu ${label}`}
              >
                <div className="step-bubble">✓</div>
                <span className="step-label">{label}</span>
              </button>
            );
          }
          return (
            <div
              key={stepNum}
              className={`step-indicator-item ${isCurrent ? 'active' : ''}`}
            >
              <div className="step-bubble">{stepNum}</div>
              <span className="step-label">{label}</span>
            </div>
          );
        })}
      </div>
      {renderStep()}
    </form>
  );
};

export default StepForm;