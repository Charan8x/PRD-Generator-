import React from 'react';
import SectionCard from './SectionCard';

/**
 * ResultsDisplay Component
 * Responsible for rendering all seven generated sections in the required order.
 * 
 * Props:
 * @param {Object} sections - An object containing the 7 generated sections:
 *                            { summary, features, user_stories, db_design, apis, test_cases, dev_plan }
 */
const ResultsDisplay = ({ sections }) => {
  if (!sections) return null;

  // The seven sections in the requested order with their respective titles and numbers
  const orderedSections = [
    { key: 'summary', title: 'Project Summary', num: '01' },
    { key: 'features', title: 'Features', num: '02' },
    { key: 'user_stories', title: 'User Stories', num: '03' },
    { key: 'db_design', title: 'Database Design', num: '04' },
    { key: 'apis', title: 'API Suggestions', num: '05' },
    { key: 'test_cases', title: 'Test Cases', num: '06' },
    { key: 'dev_plan', title: 'Development Plan', num: '07' },
  ];

  return (
    <section className="results-section-wrapper">
      <h2 className="results-header-title">Generated Product Requirement Document (PRD)</h2>
      <div className="results-section-wrapper" style={{ marginTop: '16px' }}>
        {orderedSections.map((sec) => {
          const content = sections[sec.key];
          return (
            <SectionCard 
              key={sec.key} 
              title={sec.title} 
              badgeNumber={sec.num}
              content={content} 
            />
          );
        })}
      </div>
    </section>
  );
};

export default ResultsDisplay;

