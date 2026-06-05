import React from 'react';

const InfoTooltip = ({ text }) => {
  return (
    <span className="tooltip">
      <i className="info-icon">i</i>
      <span className="tooltip-text">{text}</span>
    </span>
  );
};

export default InfoTooltip;