import React, { useState, useEffect } from 'react';
import InputWithLabel from './InputWithLabel';

const StepForm = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
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
    grundstueckswertAnteil: '20'
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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
    
    // Only validate touched fields
    Object.keys(touched).forEach(field => {
      if (touched[field]) {
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
    if (isStepValid(1) && isStepValid(2) && isStepValid(3)) {
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
            <InputWithLabel
              label="Größe"
              name="groesse"
              value={formData.groesse}
              onChange={handleChange}
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
            
            <InputWithLabel
              label="Eigenkapital"
              name="eigenkapital"
              value={formData.eigenkapital}
              onChange={handleChange}
              tooltip="Eigenkapitalanteil in Prozent des Kaufpreises"
              unit="%"
              min="0"
              max="100"
              step="1"
              error={errors.eigenkapital}
            />
            
            <InputWithLabel
              label="Provision"
              name="provision"
              value={formData.provision}
              onChange={handleChange}
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
              tooltip="Grunderwerbsteuer, Notar, etc. in Prozent des Kaufpreises"
              unit="%"
              min="0"
              step="0.1"
              error={errors.kaufnebenkosten}
            />
            
            <div className="form-row">
              <InputWithLabel
                label="Zins"
                name="zins"
                value={formData.zins}
                onChange={handleChange}
                tooltip="Jahreszinssatz für die Finanzierung"
                unit="%"
                min="0"
                step="0.01"
                error={errors.zins}
              />
              
              <InputWithLabel
                label="Tilgung"
                name="tilgung"
                value={formData.tilgung}
                onChange={handleChange}
                tooltip="Jährliche Tilgungsrate für die Finanzierung"
                unit="%"
                min="0"
                step="0.01"
                error={errors.tilgung}
              />
            </div>
            
            <div className="step-navigation">
              <button onClick={prevStep} className="secondary">Zurück</button>
              <button 
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
            <h3>Schritt 3: Miete & Kosten</h3>
            
            <div className="form-row">
              <InputWithLabel
                label="Kaltmiete"
                name="kaltmiete"
                value={formData.kaltmiete}
                onChange={handleChange}
                tooltip="Monatliche Kaltmiete ohne Nebenkosten"
                unit="€/Monat"
                min="0"
                required={true}
                error={errors.kaltmiete}
              />
              
              <InputWithLabel
                label="Stellplatz"
                name="stellplatz"
                value={formData.stellplatz}
                onChange={handleChange}
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
              tooltip="Monatliches Hausgeld (bei Eigentumswohnungen)"
              unit="€/Monat"
              min="0"
              error={errors.hausgeld}
            />
            
            <InputWithLabel
              label="Nebenkosten"
              name="nebenkosten"
              value={formData.nebenkosten}
              onChange={handleChange}
              tooltip="Monatliche umlegbare Nebenkosten (wenn leer, wird 60% des Hausgelds angenommen)"
              unit="€/Monat"
              min="0"
              error={errors.nebenkosten}
            />
            
            <InputWithLabel
              label="Nicht umlegbare Nebenkosten"
              name="nichtUmlegbareNebenkosten"
              value={formData.nichtUmlegbareNebenkosten}
              onChange={handleChange}
              tooltip="Monatliche nicht umlegbare Nebenkosten (wenn leer, wird Hausgeld - Nebenkosten angenommen)"
              unit="€/Monat"
              min="0"
              error={errors.nichtUmlegbareNebenkosten}
            />
            
            <div className="form-row">
              <InputWithLabel
                label="Abschreibungsrate"
                name="abschreibungsrate"
                value={formData.abschreibungsrate}
                onChange={handleChange}
                tooltip="Jährliche Abschreibungsrate für den Gebäudewert (typischerweise 2%)"
                unit="%"
                min="0"
                step="0.1"
                error={errors.abschreibungsrate}
              />
              
              <InputWithLabel
                label="Grundstückswertanteil"
                name="grundstueckswertAnteil"
                value={formData.grundstueckswertAnteil}
                onChange={handleChange}
                tooltip="Anteil des Grundstückswerts am Gesamtkaufpreis"
                unit="%"
                min="0"
                max="100"
                step="1"
                error={errors.grundstueckswertAnteil}
              />
            </div>
            
            <div className="step-navigation">
              <button onClick={prevStep} className="secondary">Zurück</button>
              <button 
                onClick={handleSubmit}
                disabled={!isStepValid(3)}
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
          style={{width: `${(currentStep / 3) * 100}%`}}
        ></div>
      </div>
      {renderStep()}
    </form>
  );
};

export default StepForm;