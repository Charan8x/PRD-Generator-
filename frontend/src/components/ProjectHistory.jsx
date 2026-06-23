import React, { useState, useEffect } from 'react';
import { logout, renameProject, deleteProject } from '../api/client';
import ErrorMessage from './ErrorMessage';

/**
 * ProjectHistory Component
 * Redesigned as a narrow icon activity bar + slide-out history panel.
 * Redesigned as a narrow icon activity bar + slide-out history panel.
 */
const ProjectHistory = ({
  token,
  projects = [],
  loading = false,
  error = '',
  selectedProjectId,
  onSelectProject,
  onNewPrd,
  onLogout,
  onProjectRenamed = () => { },
  onProjectDeleted = () => { }
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true); // history slide-out panel
  const [isPanelOpen, setIsPanelOpen] = useState(true); // history slide-out panel

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        openMenuId !== null &&
        !e.target.closest('.project-menu-dropdown') &&
        !e.target.closest('.project-item-menu-btn')
      ) {
        if (
          openMenuId !== null &&
          !e.target.closest('.project-menu-dropdown') &&
          !e.target.closest('.project-item-menu-btn')
        ) {
          setOpenMenuId(null);
        }
      };
      document.addEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
      return () => document.removeEventListener('click', handleOutsideClick);
    }, [openMenuId]);

  const handleLogoutClick = async () => {
    try { await logout(token); } catch (err) {
      try { await logout(token); } catch (err) {
        console.error('Logout error, clearing local session anyway', err);
      } finally { onLogout(); }
    } finally { onLogout(); }
  };

  const handleMenuToggle = (e, projectId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  const handleStartRename = (e, project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setRenameValue(project.project_name);
    setOpenMenuId(null);
  };

  const handleSaveRename = async (projectId) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      await renameProject(token, projectId, trimmed);
      setEditingProjectId(null);
      onProjectRenamed(projectId, trimmed);
    } catch (err) { alert(err.message || 'Failed to rename project.'); }
  } catch (err) { alert(err.message || 'Failed to rename project.'); }
};

const handleRenameKeyDown = (e, projectId) => {
  if (e.key === 'Enter') handleSaveRename(projectId);
  else if (e.key === 'Escape') setEditingProjectId(null);
  if (e.key === 'Enter') handleSaveRename(projectId);
  else if (e.key === 'Escape') setEditingProjectId(null);
};

const handleShareProject = (e, project) => {
  e.stopPropagation();
  setOpenMenuId(null);
  navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}`)
  navigator.clipboard.writeText(`${window.location.origin}/projects/${project.id}`)
    .then(() => {
      setToastMessage('Link copied!');
      setTimeout(() => setToastMessage(''), 2000);
      setTimeout(() => setToastMessage(''), 2000);
    })
    .catch(err => console.error('Failed to copy link:', err));
      .catch (err => console.error('Failed to copy link:', err));
  };

const handleDeleteProject = async (e, projectId) => {
  e.stopPropagation();
  setOpenMenuId(null);
  if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
  if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
  try {
    await deleteProject(token, projectId);
    onProjectDeleted(projectId);
  } catch (err) { alert(err.message || 'Failed to delete project.'); }
} catch (err) { alert(err.message || 'Failed to delete project.'); }
  };

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch { return dateString; }
  } catch { return dateString; }
};

return (
  // Wrapper holds both the icon bar and the slide-out panel
  <div className="sidebar-wrapper">

    {/* Floating Toggle Button (visible only when panel is closed) */}
    {!isPanelOpen && (
      <button
        type="button"
        className="floating-toggle-btn"
        title="Open sidebar"
        onClick={() => setIsPanelOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>
    )}

    {/* ── Slide-out History Panel ── */}
    <div className={`sidebar-panel${isPanelOpen ? ' open' : ''}`}>

      {/* Panel header: Logo + Toggle, then + New PRD button */}
      <div className="sidebar-panel-header">
        <div className="sidebar-panel-top-row">
          <span className="sidebar-logo-text">PRD Generator</span>
          <button
            type="button"
            className="sidebar-toggle-btn"
            title="Close sidebar"
            onClick={() => setIsPanelOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          className="btn-primary new-prd-btn"
          onClick={onNewPrd}
        >
          + New PRD
        </button>
        <span className="sidebar-panel-title">PRD History</span>
      </div>
    // Wrapper holds both the icon bar and the slide-out panel
      <div className="sidebar-wrapper">

        {/* ── Narrow Icon Activity Bar ── */}
        <div className="sidebar-icon-bar">
          <div className="sidebar-icon-bar-top">

            {/* + New PRD icon — only when panel is closed */}
            {!isPanelOpen && (
              <button
                type="button"
                className="icon-bar-btn"
                title="New PRD"
                onClick={onNewPrd}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            )}

            {/* Toggle History Panel — always visible */}
            <button
              type="button"
              className={`icon-bar-btn${isPanelOpen ? ' active' : ''}`}
              title={isPanelOpen ? 'Close sidebar' : 'Open sidebar'}
              onClick={() => setIsPanelOpen(p => !p)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>

          </div>

          <div className="sidebar-icon-bar-bottom">
            {/* Logout icon — only when panel is closed */}
            {!isPanelOpen && (
              <button
                type="button"
                className="icon-bar-btn icon-bar-btn--logout"
                title="Logout"
                onClick={handleLogoutClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Slide-out History Panel ── */}
        <div className={`sidebar-panel${isPanelOpen ? ' open' : ''}`}>

          {/* Panel header: + New PRD button + title */}
          <div className="sidebar-panel-header">
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginBottom: '14px' }}
              onClick={onNewPrd}
            >
              + New PRD
            </button>
            <span className="sidebar-panel-title">PRD History</span>
          </div>

          {error && <ErrorMessage message={error} />}
          {error && <ErrorMessage message={error} />}

          <div className="sidebar-panel-content">
            {loading ? (
              <p className="sidebar-loading">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="sidebar-empty">No projects yet.<br />Create one to get started!</p>
            ) : (
              <ul className="project-list">
                {projects.map((project) => {
                  const isEditingThis = editingProjectId === project.id;
                  const isMenuOpenThis = openMenuId === project.id;
                  return (
                    <li
                      key={project.id}
                      className={`project-item ${selectedProjectId === project.id ? 'active' : ''} ${isEditingThis ? 'editing' : ''}`}
                    >
                      {isEditingThis ? (
                        <div className="project-rename-container" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            className="project-rename-input"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyDown(e, project.id)}
                            autoFocus
                          />
                          <div className="project-rename-actions">
                            <button type="button" className="project-rename-btn save"
                              onClick={() => handleSaveRename(project.id)} title="Save">✓</button>
                            <button type="button" className="project-rename-btn cancel"
                              onClick={() => setEditingProjectId(null)} title="Cancel">✕</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="project-item-button"
                            onClick={() => onSelectProject(project.id)}
                          >
                            <span className="project-item-name">{project.project_name}</span>
                            <span className="project-item-date">{formatDate(project.created_date)}</span>
                          </button>

                          <button
                            type="button"
                            className="project-item-menu-btn"
                            onClick={(e) => handleMenuToggle(e, project.id)}
                            title="Project options"
                          >
                            ⋮
                          </button>
                          <div className="sidebar-panel-content">
                            {loading ? (
                              <p className="sidebar-loading">Loading projects...</p>
                            ) : projects.length === 0 ? (
                              <p className="sidebar-empty">No projects yet.<br />Create one to get started!</p>
                            ) : (
                              <ul className="project-list">
                                {projects.map((project) => {
                                  const isEditingThis = editingProjectId === project.id;
                                  const isMenuOpenThis = openMenuId === project.id;
                                  return (
                                    <li
                                      key={project.id}
                                      className={`project-item ${selectedProjectId === project.id ? 'active' : ''} ${isEditingThis ? 'editing' : ''}`}
                                    >
                                      {isEditingThis ? (
                                        <div className="project-rename-container" onClick={(e) => e.stopPropagation()}>
                                          <input
                                            type="text"
                                            className="project-rename-input"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => handleRenameKeyDown(e, project.id)}
                                            autoFocus
                                          />
                                          <div className="project-rename-actions">
                                            <button type="button" className="project-rename-btn save"
                                              onClick={() => handleSaveRename(project.id)} title="Save">✓</button>
                                            <button type="button" className="project-rename-btn cancel"
                                              onClick={() => setEditingProjectId(null)} title="Cancel">✕</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <button
                                            type="button"
                                            className="project-item-button"
                                            onClick={() => onSelectProject(project.id)}
                                          >
                                            <span className="project-item-name">{project.project_name}</span>
                                            <span className="project-item-date">{formatDate(project.created_date)}</span>
                                          </button>

                                          <button
                                            type="button"
                                            className="project-item-menu-btn"
                                            onClick={(e) => handleMenuToggle(e, project.id)}
                                            title="Project options"
                                          >
                                            ⋮
                                          </button>

                                          {isMenuOpenThis && (
                                            <div className="project-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                                              <button type="button" className="project-menu-item"
                                                onClick={(e) => handleStartRename(e, project)}>
                                                <span className="project-menu-item-icon">✏️</span> Rename
                                              </button>
                                              <button type="button" className="project-menu-item"
                                                onClick={(e) => handleShareProject(e, project)}>
                                                <span className="project-menu-item-icon">🔗</span> Share
                                              </button>
                                              <button type="button" className="project-menu-item delete"
                                                onClick={(e) => handleDeleteProject(e, project.id)}>
                                                <span className="project-menu-item-icon">🗑️</span> Delete
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                          {isMenuOpenThis && (
                            <div className="project-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                              <button type="button" className="project-menu-item"
                                onClick={(e) => handleStartRename(e, project)}>
                                <span className="project-menu-item-icon">✏️</span> Rename
                              </button>
                              <button type="button" className="project-menu-item"
                                onClick={(e) => handleShareProject(e, project)}>
                                <span className="project-menu-item-icon">🔗</span> Share
                              </button>
                              <button type="button" className="project-menu-item delete"
                                onClick={(e) => handleDeleteProject(e, project.id)}>
                                <span className="project-menu-item-icon">🗑️</span> Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Panel footer: Logout button */}
          <div className="sidebar-panel-footer">
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>
          {/* Panel footer: Logout button */}
          <div className="sidebar-panel-footer">
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
              onClick={handleLogoutClick}
            >
              Logout
            </button>
          </div>

          {toastMessage && <div className="sidebar-toast">{toastMessage}</div>}
        </div>

      </div>
      {toastMessage && <div className="sidebar-toast">{toastMessage}</div>}
    </div>

  </div>
);
};

export default ProjectHistory;
