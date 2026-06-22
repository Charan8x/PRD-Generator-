import React from 'react';

/**
 * SectionCard Component
 * Displays a single generated section of the PRD document.
 * 
 * Props:
 * @param {string} title - The title of the section (e.g. "Project Summary").
 * @param {string} content - The detailed content text for this section.
 */
const SectionCard = ({ title, badgeNumber, content, isUpdated }) => {
  return (
    <article className={`prd-card ${isUpdated ? 'flash-highlight' : ''}`}>
      <div className="prd-card-title">
        {badgeNumber && <span className="prd-card-title-badge">{badgeNumber}</span>}
        <h3>{title}</h3>
      </div>
      <div className="prd-card-content">
        <p style={{ whiteSpace: 'pre-wrap' }}>{content || 'No content generated.'}</p>
      </div>
    </article>
  );
};


export default SectionCard;
