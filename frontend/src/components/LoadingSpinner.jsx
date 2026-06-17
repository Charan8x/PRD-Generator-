import React from 'react';

/**
 * LoadingSpinner Component
 * Renders a visual loading indicator container.
 * The actual animation or visual style should be handled in the CSS.
 */
const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner" aria-label="Loading..." role="status"></div>
      <p className="loading-text">Generating PRD documents using AI, please wait...</p>
    </div>
  );
};

export default LoadingSpinner;
