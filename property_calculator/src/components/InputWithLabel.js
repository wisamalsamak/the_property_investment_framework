import React from 'react';
import InfoTooltip from './InfoTooltip';

const InputWithLabel = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'number', 
  tooltip = null,
  unit = null,
  min = null,
  step = null,
  required = false,
  error = null
}) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      <div className={`input-with-unit ${error ? 'error' : ''}`}>
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          step={step}
          required={required}
          className={error ? 'error' : ''}
        />
        {unit && <span className="unit">{unit}</span>}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default InputWithLabel;