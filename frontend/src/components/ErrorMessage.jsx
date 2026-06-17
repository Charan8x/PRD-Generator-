import React from 'react';

/**
 * ErrorMessage Component
 * Displays a friendly error message to the user.
 * 
 * Props:
 * @param {string} message - The error message text to display.
 */
const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="error-message-container" role="alert">
      <span className="error-message-icon">⚠️</span>
      <p className="error-message-text">{message}</p>
    </div>
  );
};

export default ErrorMessage;
