import React, { useState, useEffect } from 'react';
import { logout } from '../api/client';
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
const ProjectHistory = ({ token, projects = [], loading = false, error = '', selectedProjectId, onSelectProject, onNewPrd, onLogout }) => {
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
          className="btn-primary"
          onClick={handleLogoutClick}
          style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default ProjectHistory;
