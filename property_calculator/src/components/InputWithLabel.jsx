import React from 'react';
import InfoTooltip from './InfoTooltip';

const InputWithLabel = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'number', 
  tooltip = null,
  description = null,
  unit = null,
  min = null,
  max = null,
  step = null,
  required = false,
  error = null,
  options = null,
  checked = false
}) => {
  // Checkbox variant (e.g. yes/no toggles like married / church tax)
  if (type === 'checkbox') {
    return (
      <div className="form-group form-group-checkbox">
        <label htmlFor={name} className="checkbox-label">
          <input
            type="checkbox"
            id={name}
            name={name}
            checked={checked}
            onChange={onChange}
          />
          <span>{label}</span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {description && <p className="field-description">{description}</p>}
      </div>
    );
  }

  // Select variant (e.g. Bundesland)
  if (type === 'select') {
    return (
      <div className="form-group">
        <label htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
          {tooltip && <InfoTooltip text={tooltip} />}
        </label>
        {description && <p className="field-description">{description}</p>}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className={error ? 'error' : ''}
        >
          {(options || []).map((opt) => {
            const val = typeof opt === 'string' ? opt : opt.value;
            const text = typeof opt === 'string' ? opt : opt.label;
            return <option key={val} value={val}>{text}</option>;
          })}
        </select>
        {error && <div className="error-message">{error}</div>}
      </div>
    );
  }

  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      {description && <p className="field-description">{description}</p>}
      <div className={`input-with-unit ${error ? 'error' : ''}`}>
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
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