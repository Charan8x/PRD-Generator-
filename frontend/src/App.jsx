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
    const isTokenExpired = (jwtToken) => {
      try {
        const parts = jwtToken.split('.');
        if (parts.length !== 3) return true;
        // Decode base64url payload
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (payload.exp) {
          const now = Math.floor(Date.now() / 1000);
          return payload.exp < now;
        }
        return false;
      } catch (e) {
        return true;
      }
    };

    const checkSession = async () => {
      const storedToken = localStorage.getItem('prd_token');
      if (storedToken) {
        if (isTokenExpired(storedToken)) {
          // Token is expired; clear it silently without calling backend
          localStorage.removeItem('prd_token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        } else {
          try {
            // Verify with backend that the token is still valid
            const response = await getCurrentUser(storedToken);
            setToken(storedToken);
            setUser(response.user);
            setIsAuthenticated(true);
          } catch (err) {
            // Token is invalid/expired; clear it
            localStorage.removeItem('prd_token');
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
          }
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
