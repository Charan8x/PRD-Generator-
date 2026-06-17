import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import { getCurrentUser } from './api/client';

/**
 * App Component
 * Manages the root application state, authentication verification, and client-side routing.
 */
function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check for an existing token and verify it on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem('prd_token');
      if (storedToken) {
        try {
          // Verify with backend that the token is still valid
          const response = await getCurrentUser(storedToken);
          setToken(storedToken);
          setUser(response.user);
          setIsAuthenticated(true);
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          // Token is invalid/expired; clear it
          localStorage.removeItem('prd_token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setCheckingAuth(false);
    };

    checkSession();
  }, []);

  // Handle successful login or sign up
  const handleAuthSuccess = (accessToken, authUser) => {
    localStorage.setItem('prd_token', accessToken);
    setToken(accessToken);
    setUser(authUser);
    setIsAuthenticated(true);
  };

  // Handle client-side logout
  const handleLogout = () => {
    localStorage.removeItem('prd_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  if (checkingAuth) {
    return (
      <div className="app-loading-screen">
        <p className="app-loading-text">Checking authentication session...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <MainPage token={token} onLogout={handleLogout} />
      ) : (
        <LoginPage onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default App;
