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
const ProjectHistory = ({ token, selectedProjectId, refreshTrigger, onSelectProject, onLogout }) => {
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
      <div className="sidebar-header">
        <h2 className="sidebar-title">PRD History</h2>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="sidebar-content">
        {loading ? (
          <p className="sidebar-loading">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="sidebar-empty">No projects found. Create one to get started!</p>
        ) : (
          <ul className="project-list">
            {projects.map((project) => (
              <li 
                key={project.id}
                className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="project-item-button"
                  onClick={() => onSelectProject(project.id)}
                >
                  <span className="project-item-name">{project.project_name}</span>
                  <span className="project-item-date">{formatDate(project.created_date)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sidebar-footer">
        <button
          type="button"
          className="logout-button"
          onClick={handleLogoutClick}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default ProjectHistory;
