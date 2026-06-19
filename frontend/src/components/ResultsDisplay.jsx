import React from 'react';
import SectionCard from './SectionCard';

/**
 * ResultsDisplay Component
 * Responsible for rendering all eight generated sections in the required order.
 * 
 * Props:
 * @param {Object} sections - An object containing the 8 generated sections:
 *                            { summary, features, user_stories, techstack, db_design, apis, test_cases, dev_plan }
 */
const ResultsDisplay = ({ sections }) => {
  if (!sections) return null;

  // The eight sections in the requested order with their respective titles
  const orderedSections = [
    { key: 'summary',      title: '1. Project Summary' },
    { key: 'features',     title: '2. Features' },
    { key: 'user_stories', title: '3. User Stories' },
    { key: 'techstack',    title: '4. Tech Stack' },
    { key: 'db_design',   title: '5. Database Design' },
    { key: 'apis',        title: '6. API Suggestions' },
    { key: 'test_cases',  title: '7. Test Cases' },
    { key: 'dev_plan',    title: '8. Development Plan' },
  ];

  return (
    <section className="results-display">
      <h2 className="results-title">Generated Product Requirement Document (PRD)</h2>
      <div className="sections-container">
        {orderedSections.map((sec) => {
          const content = sections[sec.key];
          return (
            <SectionCard 
              key={sec.key} 
              title={sec.title} 
              content={content} 
            />
          );
        })}
      </div>
    </section>
  );
};

export default ResultsDisplay;
