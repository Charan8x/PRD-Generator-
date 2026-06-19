import React, { useState, useEffect } from 'react';
import { getProjects, logout } from '../api/client';
import ErrorMessage from './ErrorMessage';

/**
 * ProjectHistory Component
 * Renders the left sidebar containing the user's project history.
 * Displays project names, created dates, handles selections, and logout.
 * 
 * Props:
 * @param {string} token - The authenticated user's JWT token.
 * @param {number|null} selectedProjectId - The currently selected project ID.
 * @param {function} onSelectProject - Callback when a project is clicked.
 * @param {function} onLogout - Callback when the user logs out.
 */
const ProjectHistory = ({ token, selectedProjectId, refreshTrigger, onSelectProject, onNewPrd, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects list on mount or when token changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchProjects = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const data = await getProjects(token);
        if (isMounted) {
          // Sort projects newest to oldest just in case backend order varies
          const sorted = [...data].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
          setProjects(sorted);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load project history.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, [token, refreshTrigger]);

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
        <h2 className="sidebar-title" style={{ padding: '0' }}>PRD History</h2>
        <button
          type="button"
          className="btn-primary"
          style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
          onClick={onNewPrd}
        >
          + New PRD
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="sidebar-content">
        {loading ? (
          <p className="sidebar-loading" style={{ padding: '0 8px', fontSize: '13px', color: 'var(--text-muted)' }}>Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="sidebar-empty" style={{ padding: '0 8px', fontSize: '13px', color: 'var(--text-muted)' }}>No projects found. Create one to get started!</p>
        ) : (
          <ul className="project-history-list">
            {projects.map((project) => (
              <li key={project.id} style={{ listStyle: 'none' }}>
                <button
                  type="button"
                  className={`project-history-item ${selectedProjectId === project.id ? 'active' : ''}`}
                  onClick={() => onSelectProject(project.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: selectedProjectId === project.id ? 'var(--bg-card)' : 'transparent',
                    borderColor: selectedProjectId === project.id ? 'var(--border-focus)' : 'transparent',
                    fontFamily: 'inherit',
                  }}
                >
                  <span className="project-name-text">{project.project_name}</span>
                  <span className="project-date-text">{formatDate(project.created_date)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="btn btn-secondary logout-button"
          onClick={handleLogoutClick}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default ProjectHistory;
