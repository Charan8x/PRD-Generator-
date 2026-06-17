import React from 'react';

/**
 * SectionCard Component
 * Displays a single generated section of the PRD document.
 * 
 * Props:
 * @param {string} title - The title of the section (e.g. "Project Summary").
 * @param {string} content - The detailed content text for this section.
 */
const SectionCard = ({ title, content }) => {
  return (
    <article className="section-card">
      <h3 className="section-card-title">{title}</h3>
      <div className="section-card-content">
        {/* We use a paragraph structure or white-space pre-wrap for multiline formatting */}
        <p className="section-card-text">{content || 'No content generated.'}</p>
      </div>
    </article>
  );
};

export default SectionCard;
