import React, { useState } from 'react';
import ProjectHistory from '../components/ProjectHistory';
import ProjectForm from '../components/ProjectForm';
import ResultsDisplay from '../components/ResultsDisplay';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProjectById, updateProject, generateProject } from '../api/client';

const MainPage = ({ token, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('input'); // 'input' (Screen 2) or 'generated' (Screen 3)
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectSections, setSelectedProjectSections] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [currentProjectDescription, setCurrentProjectDescription] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // States for Screen 3 editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editValError, setEditValError] = useState('');

  // Callback when user selects a project from history
  const handleSelectProject = async (projectId) => {
    setFetchLoading(true);
    setFetchError('');
    setSelectedProjectId(projectId);
    setSelectedProjectSections(null);
    setIsEditing(false);

    try {
      const projectData = await getProjectById(token, projectId);
      
      setCurrentProjectName(projectData.project_name);
      setCurrentProjectDescription(projectData.description);
      
      if (projectData.document) {
        const doc = projectData.document;
        // Only the 7 sections — no techstack
        setSelectedProjectSections({
          summary: doc.summary,
          features: doc.features,
          user_stories: doc.user_stories,
          db_design: doc.db_design,
          apis: doc.apis,
          test_cases: doc.test_cases,
          dev_plan: doc.dev_plan,
        });
        setCurrentScreen('generated');
      } else {
        setSelectedProjectSections(null);
        setFetchError('No PRD generated for this project yet. Please generate a new plan.');
        setCurrentScreen('generated');
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load project details.');
      setSelectedProjectSections(null);
      setCurrentScreen('generated');
    } finally {
      setFetchLoading(false);
    }
  };

  // Callback when ProjectForm successfully generates a new project and PRD
  const handleGenerationSuccess = (projectId, name, description, sections) => {
    setSelectedProjectId(projectId);
    setCurrentProjectName(name);
    setCurrentProjectDescription(description);
    setSelectedProjectSections(sections);
    setFetchError('');
    setIsEditing(false);
    setCurrentScreen('generated');
    // Increment refresh trigger to tell ProjectHistory to fetch list again
    setRefreshTrigger(prev => prev + 1);
  };

  // Callback when user clicks "+ New PRD" in sidebar
  const handleNewPrd = () => {
    setSelectedProjectId(null);
    setSelectedProjectSections(null);
    setCurrentProjectName('');
    setCurrentProjectDescription('');
    setFetchError('');
    setIsEditing(false);
    setCurrentScreen('input');
  };

  // Handles clicking "Edit" next to the project name/description on Screen 3
  const handleStartEdit = () => {
    setEditName(currentProjectName);
    setEditDesc(currentProjectDescription);
    setEditError('');
    setEditValError('');
    setIsEditing(true);
  };

  // Handles clicking "Cancel" in Screen 3 edit mode
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Handles clicking "Save & Regenerate" in Screen 3 edit mode
  const handleSaveAndRegenerate = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditValError('');

    if (!editDesc.trim()) {
      setEditValError('Project description is required.');
      return;
    }

    if (!editName.trim()) {
      setEditError('Project Name is required.');
      return;
    }

    setEditLoading(true);

    try {
      // Step 1: Update project name and description
      await updateProject(token, selectedProjectId, editName, editDesc);

      // Step 2: Trigger regeneration
      const generateResponse = await generateProject(token, selectedProjectId);

      // Update state details
      setCurrentProjectName(editName);
      setCurrentProjectDescription(editDesc);
      setSelectedProjectSections(generateResponse.sections);

      // Refresh sidebar list
      setRefreshTrigger(prev => prev + 1);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || 'Regeneration failed. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleProjectRenamed = (projectId, newName) => {
    if (selectedProjectId === projectId) {
      setCurrentProjectName(newName);
    }
  };

  const handleProjectDeleted = (projectId) => {
    if (selectedProjectId === projectId) {
      handleNewPrd();
    }
  };
  return (
    <div className="main-page-container">

      {/* Sidebar */}
      <ProjectHistory
        token={token}
        selectedProjectId={selectedProjectId}
        refreshTrigger={refreshTrigger}
        onSelectProject={handleSelectProject}
        onNewPrd={handleNewPrd}
        onLogout={onLogout}
        onProjectRenamed={handleProjectRenamed}
        onProjectDeleted={handleProjectDeleted}
      />

      {/* Main content */}
      <main className="main-content">
        {currentScreen === 'input' ? (
          <>
            <header className="main-content-header">
              <h1 className="main-title">AI Product Requirement Document Generator</h1>
              <p className="main-subtitle">Create structured PRD documents instantly using AI</p>
            </header>
            {/* Input Form only */}
            <section className="form-section">
              <ProjectForm 
                token={token} 
                onGenerationSuccess={handleGenerationSuccess} 
              />
            </section>
          </>
        ) : (
          <>
            {/* Screen 3 - Generated Plan View */}
            <section className="results-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {isEditing ? (
                <div className="project-form-container" style={{ position: 'relative' }}>
                  <h2 className="form-title">Edit PRD Details</h2>
                  {editError && <ErrorMessage message={editError} />}
                  <form onSubmit={handleSaveAndRegenerate} className="project-form">
                    <div className="form-group">
                      <label htmlFor="editProjectName" className="form-label">Project Name</label>
                      <input
                        id="editProjectName"
                        name="project_name"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Movie Streaming App"
                        value={editName}
                        disabled={editLoading}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          if (e.target.value.trim()) setEditError('');
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="editProjectDescription" className="form-label">Project Description</label>
                      <textarea
                        id="editProjectDescription"
                        name="project_description"
                        className={`form-textarea ${editValError ? 'input-error' : ''}`}
                        placeholder="Describe your app's core features, target users, and goals..."
                        value={editDesc}
                        disabled={editLoading}
                        onChange={(e) => {
                          setEditDesc(e.target.value);
                          if (e.target.value.trim()) {
                            setEditValError('');
                          }
                        }}
                        rows={5}
                      />
                      {editValError && (
                        <p className="validation-error-message" role="alert" style={{ color: 'var(--error)', marginTop: '4px', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ❌ Project description is required.
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: 'auto' }}
                        disabled={!editName.trim() || editLoading}
                      >
                        {editLoading ? 'Regenerating...' : 'Save & Regenerate'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-cancel-edit"
                        style={{ width: 'auto' }}
                        disabled={editLoading}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                  {editLoading && <LoadingSpinner />}
                </div>
              ) : (
                <div className="content-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div style={{ flex: 1 }}>
                      <h1 className="main-title" style={{ fontSize: '24px', marginBottom: '8px' }}>{currentProjectName}</h1>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{currentProjectDescription}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary btn-edit-details"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', marginLeft: '16px', flexShrink: 0 }}
                      onClick={handleStartEdit}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ marginRight: '6px' }}>
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                      Edit Details
                    </button>
                  </div>
                </div>
              )}

              {fetchLoading && (
                <div className="loading-container">
                  <p className="loading-text">Loading selected project PRD...</p>
                </div>
              )}

              {fetchError && <ErrorMessage message={fetchError} />}

              {!fetchLoading && selectedProjectSections && (
                <ResultsDisplay
                  project={{ project_name: currentProjectName, document: selectedProjectSections }}
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default MainPage;