import React, { useState, useEffect } from 'react';
import { logout, renameProject, deleteProject } from '../api/client';
import ErrorMessage from './ErrorMessage';

/**
 * ProjectHistory Component
 * Renders the left sidebar containing the user's project history.
 * Displays project names, created dates, handles selections, and logout.
 * 
 * Props:
 * @param {string} token - The authenticated user's JWT token.
 * @param {Array} projects - Array of project objects.
 * @param {boolean} loading - Loading state for projects.
 * @param {string} error - Error message if any.
 * @param {number|null} selectedProjectId - The currently selected project ID.
 * @param {function} onSelectProject - Callback when a project is clicked.
 * @param {function} onNewPrd - Callback when new PRD is clicked.
 * @param {function} onLogout - Callback when the user logs out.
 * @param {function} onProjectRenamed - Callback when a project is renamed.
 * @param {function} onProjectDeleted - Callback when a project is deleted.
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
  onProjectRenamed = () => {},
  onProjectDeleted = () => {}
}) => {
  // Sidebar actions UI states
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (openMenuId !== null && !e.target.closest('.project-menu-dropdown') && !e.target.closest('.project-item-menu-btn')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [openMenuId]);

  // Handle logout button click
  const handleLogoutClick = async () => {
    try {
      await logout(token);
    } catch (err) {
      console.error('Logout error, clearing local session anyway', err);
    } finally {
      // Always trigger frontend logout callback
      onLogout();
    }
  };

  // Toggle the three-dot menu dropdown
  const handleMenuToggle = (e, projectId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === projectId ? null : projectId);
  };

  // Start inline rename mode
  const handleStartRename = (e, project) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setRenameValue(project.project_name);
    setOpenMenuId(null);
  };

  // Submit renamed project name
  const handleSaveRename = async (projectId) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;

    try {
      await renameProject(token, projectId, trimmed);
      setEditingProjectId(null);
      onProjectRenamed(projectId, trimmed);
    } catch (err) {
      alert(err.message || 'Failed to rename project.');
    }
  };

  // Handle inline input keys (Enter to save, Escape to cancel)
  const handleRenameKeyDown = (e, projectId) => {
    if (e.key === 'Enter') {
      handleSaveRename(projectId);
    } else if (e.key === 'Escape') {
      setEditingProjectId(null);
    }
  };

  // Share a project (copy URL to clipboard)
  const handleShareProject = (e, project) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    const shareUrl = `${window.location.origin}/projects/${project.id}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setToastMessage('Link copied!');
        setTimeout(() => {
          setToastMessage('');
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy link:', err);
      });
  };

  // Delete a project permanently after confirmation
  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    setOpenMenuId(null);

    const confirmDelete = window.confirm("Are you sure you want to delete this project? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      await deleteProject(token, projectId);
      onProjectDeleted(projectId);
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  // Helper to format the ISO date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
          onClick={onNewPrd}
        >
          + New PRD
        </button>
        <h2 className="sidebar-title" style={{ padding: '0', marginTop: '4px' }}>PRD History</h2>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="sidebar-content">
        {loading ? (
          <p className="sidebar-loading">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="sidebar-empty">No projects found. Create one to get started!</p>
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
                        <button 
                          type="button" 
                          className="project-rename-btn save" 
                          onClick={() => handleSaveRename(project.id)}
                          title="Save"
                        >
                          ✓
                        </button>
                        <button 
                          type="button" 
                          className="project-rename-btn cancel" 
                          onClick={() => setEditingProjectId(null)}
                          title="Cancel"
                        >
                          ✕
                        </button>
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
                          <button 
                            type="button" 
                            className="project-menu-item" 
                            onClick={(e) => handleStartRename(e, project)}
                          >
                            <span className="project-menu-item-icon">✏️</span> Rename
                          </button>
                          <button 
                            type="button" 
                            className="project-menu-item" 
                            onClick={(e) => handleShareProject(e, project)}
                          >
                            <span className="project-menu-item-icon">🔗</span> Share
                          </button>
                          <button 
                            type="button" 
                            className="project-menu-item delete" 
                            onClick={(e) => handleDeleteProject(e, project.id)}
                          >
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

      <div className="sidebar-footer">
        <button
          type="button"
          className="btn-primary"
          onClick={handleLogoutClick}
          style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
        >
          Logout
        </button>
      </div>

      {toastMessage && (
        <div className="sidebar-toast">
          {toastMessage}
        </div>
      )}
    </aside>
  );
};

export default ProjectHistory;
