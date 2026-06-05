import React, { useState } from 'react';
import StepForm from './StepForm';
import Results from './Results';
import Portfolio from './Portfolio';
import Favorites from './Favorites';
import FavoriteButton from './FavoriteButton';
import { calculateResults } from '../utils/calculations';
import { favoriteFromResults } from '../utils/favorites';

const Calculator = () => {
  // Deep links (e.g. a detail opened in a new tab) carry ?ansicht=portfolio.
  const [view, setView] = useState(() =>
    new URLSearchParams(window.location.search).get('ansicht') === 'portfolio'
      ? 'muenchen'
      : 'einzel'
  ); // 'einzel' | 'muenchen' | 'favoriten'
  const [results, setResults] = useState(null);
  const [formData, setFormData] = useState(null);
  
  const handleCalculate = (data) => {
    setFormData(data);
    const calculatedResults = calculateResults(data);
    setResults(calculatedResults);
  };
  
  const handleEdit = () => {
    // Keep the entered data so the user can tweak a few values.
    setResults(null);
  };
  
  const handleReset = () => {
    // Start over with a clean form.
    setResults(null);
    setFormData(null);
  };
  
  return (
    <div className="calculator">
      <h1>Immobilien-Investitionsrechner</h1>

      <div className="view-tabs">
        <button
          type="button"
          className={view === 'einzel' ? 'active' : ''}
          onClick={() => setView('einzel')}
        >
          Einzelne Wohnung
        </button>
        <button
          type="button"
          className={view === 'muenchen' ? 'active' : ''}
          onClick={() => setView('muenchen')}
        >
          Städte-Übersicht
        </button>
        <button
          type="button"
          className={view === 'favoriten' ? 'active' : ''}
          onClick={() => setView('favoriten')}
        >
          Favoriten
        </button>
      </div>

      {view === 'muenchen' ? (
        <Portfolio />
      ) : view === 'favoriten' ? (
        <Favorites />
      ) : !results ? (
        <StepForm onComplete={handleCalculate} initialData={formData} />
      ) : (
        <Results
          results={results}
          onReset={handleReset}
          onEdit={handleEdit}
          favoriteControl={<FavoriteButton favorite={favoriteFromResults(results, formData)} label />}
        />
      )}
    </div>
  );
};

export default Calculator;