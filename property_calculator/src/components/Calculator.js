import React, { useState } from 'react';
import StepForm from './StepForm';
import Results from './Results';
import { calculateResults } from '../utils/calculations';

const Calculator = () => {
  const [results, setResults] = useState(null);
  
  const handleCalculate = (formData) => {
    const calculatedResults = calculateResults(formData);
    setResults(calculatedResults);
  };
  
  const handleReset = () => {
    setResults(null);
  };
  
  return (
    <div className="calculator">
      <h1>Immobilien-Investitionsrechner</h1>
      
      {!results ? (
        <StepForm onComplete={handleCalculate} />
      ) : (
        <Results results={results} onReset={handleReset} />
      )}
    </div>
  );
};

export default Calculator;