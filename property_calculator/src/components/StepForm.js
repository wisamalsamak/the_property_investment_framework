import React, { useState, useEffect } from 'react';
import InputWithLabel from './InputWithLabel';
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

const StepForm = ({ onComplete, initialData = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    ...DEFAULT_FORM_DATA,
    ...(initialData || {})
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const TOTAL_STEPS = 4;

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
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
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
          <div className="step">
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
          <div className="step">
            <h3>Schritt 2: Finanzierung</h3>
            <p className="step-intro">Wie wird der Kauf finanziert? Diese Angaben bestimmen Ihre monatliche Kreditrate.</p>
            
            <InputWithLabel
              label="Eigenkapital"
              name="eigenkapital"
              value={formData.eigenkapital}
              onChange={handleChange}
              description="Anteil der Gesamtkosten, den Sie selbst einbringen. Der Rest wird finanziert. Üblich: 10–30 %."
              tooltip="Eigenkapitalanteil in Prozent des Kaufpreises"
              unit="%"
              min="0"
              max="100"
              step="1"
              error={errors.eigenkapital}
            />
            
            <InputWithLabel
              label="Maklerprovision"
              name="provision"
              value={formData.provision}
              onChange={handleChange}
              description="Käuferanteil der Maklercourtage. Häufig 3,57 % inkl. MwSt. – 0 eingeben, wenn provisionsfrei."
              tooltip="Die Maklerprovision in Prozent des Kaufpreises"
              unit="%"
              min="0"
              step="0.01"
              error={errors.provision}
            />
            
            <InputWithLabel
              label="Kaufnebenkosten"
              name="kaufnebenkosten"
              value={formData.kaufnebenkosten}
              onChange={handleChange}
              description="Grunderwerbsteuer + Notar + Grundbuch. Je nach Bundesland ca. 6–10 % des Kaufpreises."
              tooltip="Grunderwerbsteuer, Notar, etc. in Prozent des Kaufpreises"
              unit="%"
              min="0"
              step="0.1"
              error={errors.kaufnebenkosten}
            />
            
            <div className="form-row">
              <InputWithLabel
                label="Sollzins"
                name="zins"
                value={formData.zins}
                onChange={handleChange}
                description="Jährlicher Kreditzins laut Bankangebot."
                tooltip="Jahreszinssatz für die Finanzierung"
                unit="%"
                min="0"
                step="0.01"
                error={errors.zins}
              />
              
              <InputWithLabel
                label="Anfängliche Tilgung"
                name="tilgung"
                value={formData.tilgung}
                onChange={handleChange}
                description="Jährliche Tilgungsrate. Höher = schneller schuldenfrei, aber höhere Rate."
                tooltip="Jährliche Tilgungsrate für die Finanzierung"
                unit="%"
                min="0"
                step="0.01"
                error={errors.tilgung}
              />
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
          <div className="step">
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
              <InputWithLabel
                label="Abschreibungsrate (AfA)"
                name="abschreibungsrate"
                value={formData.abschreibungsrate}
                onChange={handleChange}
                description="Steuerliche Abschreibung des Gebäudes pro Jahr. Standard: 2 % (Baujahr ab 1925)."
                tooltip="Jährliche Abschreibungsrate für den Gebäudewert (typischerweise 2%)"
                unit="%"
                min="0"
                step="0.1"
                error={errors.abschreibungsrate}
              />
              
              <InputWithLabel
                label="Grundstücksanteil"
                name="grundstueckswertAnteil"
                value={formData.grundstueckswertAnteil}
                onChange={handleChange}
                description="Anteil des Bodens am Kaufpreis. Nur das Gebäude ist abschreibbar – der Boden nicht."
                tooltip="Anteil des Grundstückswerts am Gesamtkaufpreis"
                unit="%"
                min="0"
                max="100"
                step="1"
                error={errors.grundstueckswertAnteil}
              />
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
          <div className="step">
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
    <form className="step-form" onSubmit={handleSubmit}>
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{width: `${(currentStep / TOTAL_STEPS) * 100}%`}}
        ></div>
      </div>
      {renderStep()}
    </form>
  );
};

export default StepForm;