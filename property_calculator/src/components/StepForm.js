import React, { useState, useEffect } from 'react';
import InputWithLabel from './InputWithLabel';

const StepForm = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    groesse: '',
    kaufpreis: '',
    provision: '3.57',
    hausgeld: '',
    nebenkosten: '',
    nichtUmlegbareNebenkosten: '',
    zins: '3.5',
    tilgung: '2',
    mieteinnahmen: '',
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
        if (['groesse', 'kaufpreis', 'mieteinnahmen'].includes(field) && !value) {
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
        return !errors.provision && !errors.hausgeld && 
               !errors.nebenkosten && !errors.nichtUmlegbareNebenkosten;
      case 3:
        return formData.mieteinnahmen && !errors.mieteinnahmen && 
               !errors.zins && !errors.tilgung && 
               !errors.abschreibungsrate && !errors.grundstueckswertAnteil;
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
        return ['provision', 'hausgeld', 'nebenkosten', 'nichtUmlegbareNebenkosten'];
      case 3:
        return ['mieteinnahmen', 'zins', 'tilgung', 'abschreibungsrate', 'grundstueckswertAnteil'];
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
            <h3>Schritt 2: Kosten und Nebenkosten</h3>
            
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
              label="Hausgeld"
              name="hausgeld"
              value={formData.hausgeld}
              onChange={handleChange}
              tooltip="Jährliche Kosten für die Verwaltung und Instandhaltung des Gebäudes"
              unit="€/Jahr"
              min="0"
              error={errors.hausgeld}
            />
            
            <InputWithLabel
              label="Nebenkosten"
              name="nebenkosten"
              value={formData.nebenkosten}
              onChange={handleChange}
              tooltip="Jährliche umlegbare Nebenkosten (wenn leer, wird 60% des Hausgelds angenommen)"
              unit="€/Jahr"
              min="0"
              error={errors.nebenkosten}
            />
            
            <InputWithLabel
              label="Nicht umlegbare Nebenkosten"
              name="nichtUmlegbareNebenkosten"
              value={formData.nichtUmlegbareNebenkosten}
              onChange={handleChange}
              tooltip="Jährliche nicht umlegbare Nebenkosten (wenn leer, wird Hausgeld - Nebenkosten angenommen)"
              unit="€/Jahr"
              min="0"
              error={errors.nichtUmlegbareNebenkosten}
            />
            
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
            <h3>Schritt 3: Finanzierung und Mieteinnahmen</h3>
            
            <InputWithLabel
              label="Mieteinnahmen"
              name="mieteinnahmen"
              value={formData.mieteinnahmen}
              onChange={handleChange}
              tooltip="Jährliche Mieteinnahmen (Kaltmiete)"
              unit="€/Jahr"
              min="0"
              required={true}
              error={errors.mieteinnahmen}
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