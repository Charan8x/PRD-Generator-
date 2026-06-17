import React, { useState } from 'react';
import ProjectHistory from '../components/ProjectHistory';
import ProjectForm from '../components/ProjectForm';
import ResultsDisplay from '../components/ResultsDisplay';
import ErrorMessage from '../components/ErrorMessage';
import { getProjectById } from '../api/client';

/**
 * MainPage Component
 * The main application page containing the workspace layout.
 * Includes the Project History sidebar and the main area for project creation and results view.
 * 
 * Props:
 * @param {string} token - The authenticated user's JWT token.
 * @param {function} onLogout - Callback to sign the user out.
 */
const MainPage = ({ token, onLogout }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectSections, setSelectedProjectSections] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // States for fetching a project's existing PRD document
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Callback when user selects a project from history
  const handleSelectProject = async (projectId) => {
    setFetchLoading(true);
    setFetchError('');
    setSelectedProjectId(projectId);
    setSelectedProjectSections(null);

    try {
      const projectData = await getProjectById(token, projectId);
      
      if (projectData.document) {
        // Map the database document columns to the sections expected by ResultsDisplay
        const doc = projectData.document;
        setSelectedProjectSections({
          summary: doc.summary,
          features: doc.features,
          user_stories: doc.user_stories,
          db_design: doc.db_design,
          apis: doc.apis,
          test_cases: doc.test_cases,
          dev_plan: doc.dev_plan,
        });
      } else {
        setSelectedProjectSections(null);
        setFetchError('No PRD generated for this project yet. Please generate a new plan.');
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load project details.');
      setSelectedProjectSections(null);
    } finally {
      setFetchLoading(false);
    }
  };

  // Callback when ProjectForm successfully generates a new project and PRD
  const handleGenerationSuccess = (projectId, sections) => {
    setSelectedProjectId(projectId);
    setSelectedProjectSections(sections);
    setFetchError('');
    // Increment refresh trigger to tell ProjectHistory to fetch list again
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="main-page-container">
      {/* Sidebar Section */}
      <ProjectHistory
        token={token}
        selectedProjectId={selectedProjectId}
        refreshTrigger={refreshTrigger}
        onSelectProject={handleSelectProject}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-content-header">
          <h1 className="main-title">AI Product Requirement Document Generator</h1>
          <p className="main-subtitle">Create structured PRD documents instantly using AI</p>
        </header>

        {/* Input Form at the top */}
        <section className="form-section">
          <ProjectForm 
            token={token} 
            onGenerationSuccess={handleGenerationSuccess} 
          />
        </section>

        {/* Details and Results below the form */}
        <section className="results-section">
          {fetchLoading && (
            <div className="loading-container">
              <p className="loading-text">Loading selected project PRD...</p>
            </div>
          )}

          {fetchError && <ErrorMessage message={fetchError} />}

          {!fetchLoading && selectedProjectSections && (
            <ResultsDisplay sections={selectedProjectSections} />
          )}

          {!fetchLoading && !selectedProjectSections && !fetchError && (
            <div className="placeholder-container">
              <p className="placeholder-text">
                Select an existing project from the history sidebar, or use the form above to generate a new PRD.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MainPage;
