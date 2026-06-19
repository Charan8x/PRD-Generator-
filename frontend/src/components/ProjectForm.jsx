import React, { useState } from 'react';
import { createProject, generateProject } from '../api/client';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

/**
 * ProjectForm Component
 * Renders the form to enter a project name and description,
 * validates inputs, handles submissions, and coordinates the AI PRD generation.
 * 
 * Props:
 * @param {string} token - The authenticated user's JWT token.
 * @param {function} onGenerationSuccess - Callback called when a project and its PRD are successfully generated.
 *                                         Receives the full project object including generated documents.
 */
const ProjectForm = ({ token, onGenerationSuccess }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [descError, setDescError] = useState(false);

  // Validate fields in real time or on submit
  const isFormInvalid = !projectName.trim();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset previous errors
    setError('');
    setValidationError('');
    setDescError(false);

    // Pre-submit validation
    if (!projectDescription.trim()) {
      setDescError(true);
      return;
    }

    if (!projectName.trim()) {
      setValidationError('Project Name is required.');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the project record
      const createdProject = await createProject(token, projectName, projectDescription);
      
      // Step 2: Trigger AI generation for this project
      const generateResponse = await generateProject(token, createdProject.id);

      // On success, notify parent component and clear fields
      onGenerationSuccess(createdProject.id, projectName, projectDescription, generateResponse.sections);
      setProjectName('');
      setProjectDescription('');
    } catch (err) {
      // Preserve entered values when generation fails (do not reset state fields)
      setError(err.message || 'PRD generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="project-form-container">
      <h2 className="form-title">Create a New PRD</h2>
      
      {error && <ErrorMessage message={error} />}
      
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="projectName" className="form-label">Project Name</label>
          <input
            id="projectName"
            type="text"
            className="form-input"
            placeholder="e.g. Movie Streaming App"
            value={projectName}
            disabled={loading}
            onChange={(e) => {
              setProjectName(e.target.value);
              if (e.target.value.trim()) setValidationError('');
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="projectDescription" className="form-label">Project Description</label>
          <textarea
            id="projectDescription"
            className={`form-textarea ${descError ? 'input-error' : ''}`}
            placeholder="Describe your app's core features, target users, and goals..."
            value={projectDescription}
            disabled={loading}
            onChange={(e) => {
              setProjectDescription(e.target.value);
              if (e.target.value.trim()) {
                setDescError(false);
                setValidationError('');
              }
            }}
            rows={5}
          />
          {descError && (
            <p className="validation-error-message" role="alert" style={{ color: 'var(--error)', marginTop: '4px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ❌ Project description is required.
            </p>
          )}
        </div>

        {/* Display inline validation warning if user interacts and fields are missing */}
        {validationError && (
          <p className="validation-error-message" role="alert">
            {validationError}
          </p>
        )}

        {isFormInvalid && !validationError && (
          <p className="form-hint-message">
            Fill out both fields to enable AI PRD generation.
          </p>
        )}

        <button
          type="submit"
          className="btn-primary generate-button"
          disabled={isFormInvalid || loading}
        >
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
      </form>

      {loading && <LoadingSpinner />}
    </div>
  );
};

export default ProjectForm;
