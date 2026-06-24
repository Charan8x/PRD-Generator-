import React, { useState, useEffect, useRef } from 'react';
import ProjectHistory from '../components/ProjectHistory';
import ProjectForm from '../components/ProjectForm';
import ResultsDisplay from '../components/ResultsDisplay';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProjectById, editProject, getProjects, transcribeAudio } from '../api/client';

const MainPage = ({ token, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('input'); // 'input' (Screen 2) or 'generated' (Screen 3)
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectSections, setSelectedProjectSections] = useState(null);
  const [currentProjectName, setCurrentProjectName] = useState('');
  const [currentProjectDescription, setCurrentProjectDescription] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Elevated projects list states
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');

  // States for Screen 3 editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editRequest, setEditRequest] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [updatedSections, setUpdatedSections] = useState([]);

  // Voice transcription state variables for Edit Form
  const [transcribeState, setTranscribeState] = useState('default'); // 'default' | 'recording' | 'processing'
  const [statusPill, setStatusPill] = useState(null); // 'listening' | 'polishing' | null
  const [inlineMsg, setInlineMsg] = useState(null); // error or warning text
  const [showToast, setShowToast] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasShownTooltip, setHasShownTooltip] = useState(false);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const voiceSessionBaseRef = useRef('');
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  // Speech Recognition support check
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSpeechSupported = !!SpeechRecognition;

  useEffect(() => {
    return () => {
      // Release tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const handleMouseEnterTextarea = () => {
    if (!isSpeechSupported && !hasShownTooltip) {
      setShowTooltip(true);
    }
  };

  const handleMouseLeaveTextarea = () => {
    if (showTooltip) {
      setShowTooltip(false);
      setHasShownTooltip(true); // show tooltip only once on hover
    }
  };

  const handleMicClick = async () => {
    if (transcribeState === 'recording') {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop speech recognition:", e);
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn("Failed to stop MediaRecorder:", e);
        }
      }
      return;
    }

    if (transcribeState === 'processing') return;

    setInlineMsg(null);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    voiceSessionBaseRef.current = editRequest;

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;
    } catch (err) {
      setInlineMsg("Microphone access denied. Please allow access in your browser settings.");
      setTimeout(() => {
        setInlineMsg(prev => prev === "Microphone access denied. Please allow access in your browser settings." ? null : prev);
      }, 5000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.stream = stream;
    recognitionRef.current = recognition;

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
      .find(type => MediaRecorder.isTypeSupported(type)) || '';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mediaRecorder;
    const chunks = [];
    
    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      setTranscribeState('processing');
      setStatusPill('polishing');

      const audioBlob = new Blob(chunks, { type: mimeType });
      const webSpeechAdded = finalTranscriptRef.current + interimTranscriptRef.current;
      const voiceAddedTextLength = webSpeechAdded.trim().length;

      try {
        const result = await transcribeAudio(token, audioBlob);
        const groqResult = result && result.text ? result.text : '';

        if (voiceAddedTextLength === 0 && groqResult.trim().length === 0) {
          setInlineMsg("No speech detected. Please try again.");
          setTimeout(() => {
            setInlineMsg(prev => prev === "No speech detected. Please try again." ? null : prev);
          }, 3000);
          setEditRequest(voiceSessionBaseRef.current);
        } else {
          setEditRequest(voiceSessionBaseRef.current + groqResult);
          
          setShowToast(true);
          setTimeout(() => {
            setShowToast(false);
          }, 2000);
        }
      } catch (err) {
        setInlineMsg("Could not polish transcript — speech-to-text result kept.");
        setTimeout(() => {
          setInlineMsg(prev => prev === "Could not polish transcript — speech-to-text result kept." ? null : prev);
        }, 4000);
      } finally {
        setTranscribeState('default');
        setStatusPill(null);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    };

    recognition.onresult = event => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current = finalTranscript;
      interimTranscriptRef.current = interimTranscript;
      
      setEditRequest(voiceSessionBaseRef.current + finalTranscript + interimTranscript);
    };

    recognition.onerror = e => {
      console.error("Speech recognition error:", e);
      if (e.error === 'not-allowed') {
        setInlineMsg("Microphone access denied. Please allow access in your browser settings.");
        setTimeout(() => {
          setInlineMsg(prev => prev === "Microphone access denied. Please allow access in your browser settings." ? null : prev);
        }, 5000);
        cleanupRecordingState();
      }
    };

    const cleanupRecordingState = () => {
      setTranscribeState('default');
      setStatusPill(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };

    try {
      recognition.start();
      mediaRecorder.start(250);
      setTranscribeState('recording');
      setStatusPill('listening');
    } catch (e) {
      console.error("Failed to start speech recording:", e);
      setInlineMsg("Failed to start speech recording. Please try again.");
      setTimeout(() => {
        setInlineMsg(prev => prev === "Failed to start speech recording. Please try again." ? null : prev);
      }, 3000);
      cleanupRecordingState();
    }
  };

  const popoverRef = useRef(null);

  const SECTION_LABELS = {
    summary: 'Project Summary',
    features: 'Features',
    user_stories: 'User Stories',
    techstack: 'Tech Stack',
    db_design: 'Database Design',
    apis: 'API Suggestions',
    test_cases: 'Test Cases',
    development_plan: 'Development Plan'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch projects list at parent level to synchronize sidebar updates
  useEffect(() => {
    let isMounted = true;
    
    const fetchProjects = async () => {
      if (!token) return;
      setProjectsLoading(true);
      setProjectsError('');
      try {
        const data = await getProjects(token);
        if (isMounted) {
          const sorted = [...data].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
          setProjects(sorted);
        }
      } catch (err) {
        if (isMounted) {
          setProjectsError(err.message || 'Failed to load project history.');
        }
      } finally {
        if (isMounted) {
          setProjectsLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [token, refreshTrigger]);

  // Callback when user selects a project from history
  const handleSelectProject = async (projectId) => {
    setFetchLoading(true);
    setFetchError('');
    setSelectedProjectId(projectId);
    setSelectedProjectSections(null);
    setIsEditing(false);
    setUpdatedSections([]);

    try {
      const projectData = await getProjectById(token, projectId);
      
      setCurrentProjectName(projectData.project_name);
      setCurrentProjectDescription(projectData.description);
      
      if (projectData.document) {
        const doc = projectData.document;
        // All 8 sections
        setSelectedProjectSections({
          summary: doc.summary,
          features: doc.features,
          user_stories: doc.user_stories,
          techstack: doc.techstack,
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
    setUpdatedSections([]);
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
    setUpdatedSections([]);
    setCurrentScreen('input');
  };

  // Handles clicking "Edit" next to the project name/description on Screen 3
  const handleStartEdit = () => {
    setEditName(currentProjectName);
    setEditRequest('');
    setSelectedSections([]);
    setIsPopoverOpen(false);
    setEditError('');
    setIsEditing(true);
  };

  // Handles clicking "Cancel" in Screen 3 edit mode
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Handles clicking "Apply Edit" in Screen 3 edit mode
  const handleApplyEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    const nameChanged = editName.trim() !== currentProjectName;
    const hasContentEdit = editRequest.trim().length > 0;

    if (!nameChanged && !hasContentEdit) {
      setEditError('Please change the project name or enter an edit request.');
      return;
    }

    if (nameChanged && !editName.trim()) {
      setEditError('Project Name is required.');
      return;
    }

    if (hasContentEdit && selectedSections.length === 0) {
      setEditError('Please add at least one section to edit.');
      return;
    }

    setEditLoading(true);

    try {
      const data = {};
      if (nameChanged) {
        data.new_project_name = editName.trim();
      }
      if (hasContentEdit) {
        data.edit_request = editRequest.trim();
        data.target_sections = selectedSections;
      }

      const response = await editProject(token, selectedProjectId, data);

      // Compute which sections changed to trigger flash animation
      const newlyUpdated = [];
      if (selectedProjectSections) {
        Object.keys(response.sections).forEach(key => {
          if (response.sections[key] !== selectedProjectSections[key]) {
            newlyUpdated.push(key);
          }
        });
      }

      // Update state details
      setCurrentProjectName(response.project_name);
      setSelectedProjectSections(response.sections);
      setUpdatedSections(newlyUpdated);

      // Update sidebar locally without full reload
      setProjects(prev => prev.map(p =>
        p.id === selectedProjectId ? { ...p, project_name: response.project_name } : p
      ));

      setEditRequest('');
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || 'Failed to apply edits. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleProjectRenamed = (projectId, newName) => {
    if (selectedProjectId === projectId) {
      setCurrentProjectName(newName);
    }
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, project_name: newName } : p));
  };

  const handleProjectDeleted = (projectId) => {
    if (selectedProjectId === projectId) {
      handleNewPrd();
    }
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };
  return (
    <div className="main-page-container">

      {/* Sidebar */}
      <ProjectHistory
        token={token}
        projects={projects}
        loading={projectsLoading}
        error={projectsError}
        selectedProjectId={selectedProjectId}
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

              {isEditing && (
                <div className="project-form-container" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 className="form-title" style={{ margin: 0 }}>Edit PRD Document</h2>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleCancelEdit}
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                  </div>

                  {editError && <ErrorMessage message={editError} />}

                  <form onSubmit={handleApplyEdit} className="project-form">
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

                    <div className="form-group" style={{ position: 'relative' }} ref={popoverRef}>
                      <label className="form-label">Target Section(s)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', minHeight: '38px' }}>
                        <button
                          type="button"
                          className="btn-add-section"
                          onClick={() => {
                            if (!editLoading) {
                              setIsPopoverOpen(prev => !prev);
                            }
                          }}
                          disabled={editLoading}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-input)',
                            color: 'var(--accent-coral)',
                            cursor: editLoading ? 'not-allowed' : 'pointer',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease',
                            outline: 'none',
                          }}
                          onMouseEnter={(e) => {
                            if (!editLoading) {
                              e.currentTarget.style.borderColor = 'var(--accent-coral)';
                              e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-glow)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          +
                        </button>

                        {/* Chips Row */}
                        {selectedSections.map((key) => (
                          <div
                            key={key}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: 'var(--accent-bg-subtle)',
                              border: '1px solid rgba(255, 107, 74, 0.3)',
                              borderRadius: '20px',
                              padding: '4px 10px 4px 12px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: 'var(--accent-coral)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <span>{SECTION_LABELS[key]}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!editLoading) {
                                  setSelectedSections(prev => prev.filter(k => k !== key));
                                }
                              }}
                              disabled={editLoading}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(255, 107, 74, 0.15)',
                                color: 'var(--accent-coral)',
                                cursor: editLoading ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                lineHeight: 1,
                                padding: 0,
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                if (!editLoading) {
                                  e.currentTarget.style.background = 'var(--accent-coral)';
                                  e.currentTarget.style.color = '#fff';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 107, 74, 0.15)';
                                e.currentTarget.style.color = 'var(--accent-coral)';
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Dropdown/Popover List */}
                      {isPopoverOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: '0',
                            zIndex: 100,
                            width: '240px',
                            marginTop: '4px',
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            padding: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                          }}
                        >
                          {(() => {
                            const available = Object.keys(SECTION_LABELS).filter(
                              (k) => !selectedSections.includes(k)
                            );
                            if (available.length === 0) {
                              return (
                                <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                  All sections added
                                </div>
                              );
                            }
                            return available.map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() => {
                                  setSelectedSections(prev => [...prev, k]);
                                  setIsPopoverOpen(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  border: 'none',
                                  background: 'none',
                                  color: 'var(--text-primary)',
                                  fontSize: '13px',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--accent-bg-subtle)';
                                  e.currentTarget.style.color = 'var(--accent-coral)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                              >
                                {SECTION_LABELS[k]}
                              </button>
                            ));
                          })()}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="editRequestText" className="form-label">Describe your changes</label>
                      <div 
                        className="textarea-wrapper" 
                        style={{ position: 'relative' }}
                        onMouseEnter={handleMouseEnterTextarea}
                        onMouseLeave={handleMouseLeaveTextarea}
                      >
                        <textarea
                          id="editRequestText"
                          className="form-textarea"
                          placeholder="e.g. Add OAuth login using Google, or add a column for profile pictures..."
                          value={editRequest}
                          disabled={editLoading}
                          onChange={(e) => setEditRequest(e.target.value)}
                          rows={4}
                          style={{ paddingBottom: isSpeechSupported ? '44px' : undefined }}
                        />
                        {isSpeechSupported ? (
                          <button
                            type="button"
                            className={`mic-button ${transcribeState} ${editLoading ? 'disabled' : ''}`}
                            onClick={handleMicClick}
                            disabled={editLoading || transcribeState === 'processing'}
                            title={transcribeState === 'recording' ? 'Stop listening' : 'Start voice input'}
                          >
                            {transcribeState === 'processing' ? (
                              <svg className="spinner-icon-mini" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255, 255, 255, 0.2)"/>
                                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeDasharray="30 150"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                                <line x1="8" y1="23" x2="16" y2="23"/>
                              </svg>
                            )}
                          </button>
                        ) : (
                          showTooltip && (
                            <div className="unsupported-tooltip">
                              Voice input requires Chrome or Edge
                            </div>
                          )
                        )}
                      </div>
                      
                      {statusPill === 'listening' && (
                        <div className="transcription-pill listening">
                          <span className="red-dot"></span>
                          Listening... click mic to stop
                        </div>
                      )}
                      {statusPill === 'polishing' && (
                        <div className="transcription-pill polishing">
                          <span className="spinner-mini"></span>
                          Polishing transcript...
                        </div>
                      )}
                      
                      {inlineMsg && (
                        <p className="transcription-error-message" role="alert">
                          {inlineMsg}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={editLoading || (!editRequest.trim() && editName.trim() === currentProjectName)}
                      style={{ marginTop: '8px', width: 'auto' }}
                    >
                      {editLoading ? 'Applying Changes...' : 'Apply Edit'}
                    </button>
                  </form>
                  {editLoading && <LoadingSpinner />}
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
                  updatedSections={updatedSections}
                  isEditing={isEditing}
                  onStartEdit={handleStartEdit}
                />
              )}
            </section>
          </>
        )}
      </main>

      {showToast && (
        <div className="success-toast">
          Transcript ready
        </div>
      )}
    </div>
  );
};

export default MainPage;