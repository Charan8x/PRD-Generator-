import React, { useState } from 'react';
import { login, signup } from '../api/client';
import ErrorMessage from '../components/ErrorMessage';

/**
 * LoginPage Component
 * Renders the Authentication screen for Login and Signup.
 * 
 * Props:
 * @param {function} onAuthSuccess - Callback called with (token, user) on successful login/signup.
 */
const LoginPage = ({ onAuthSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation and API error/success states
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle between Login and Signup modes
  const handleToggleMode = () => {
    setIsSignup(prev => !prev);
    // Clear error and success states when switching mode
    setValidationErrors({});
    setApiError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  // Basic email validation regex
  const validateEmail = (emailStr) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMessage('');
    setValidationErrors({});

    const errors = {};
    const trimmedEmail = email.trim();

    // ─── Frontend Validations ──────────────────────────────────────────────────
    if (!trimmedEmail) {
      errors.email = 'Email cannot be empty.';
    } else if (!validateEmail(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password cannot be empty.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (isSignup) {
      if (!confirmPassword) {
        errors.confirmPassword = 'Please confirm your password.';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
      }
    }

    // If validation fails, set errors and stop submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
<<<<<<< HEAD
        // Step 1: Sign up the user (sends confirmation email)
        await signup(trimmedEmail, password);
        
        // Show success confirmation and switch to login mode
        setSuccessMessage('Account created successfully! Please check your email to verify your account before logging in.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setIsSignup(false);
=======
        // Step 1: Sign up the user
        await signup(trimmedEmail, password);
        
        // Step 2: Show success message and transition to login screen
        setSuccessMessage('Account created! Please check your email inbox to verify your account before logging in.');
        setIsSignup(false);
        setPassword('');
        setConfirmPassword('');
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f
      } else {
        // Log in the user
        const loginResponse = await login(trimmedEmail, password);
        onAuthSuccess(loginResponse.access_token, loginResponse.user);
      }
    } catch (err) {
      // Inputs remain unchanged since we do NOT reset email/password states on error.
      setApiError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <main className="auth-card">
        <header className="auth-header">
          <h1 className="auth-title">AI PRD Generator</h1>
          <p className="auth-subtitle">
            {isSignup ? 'Create an account to start generating plans' : 'Log in to access your projects'}
          </p>
        </header>

        {apiError && <ErrorMessage message={apiError} />}
        {successMessage && (
<<<<<<< HEAD
          <div className="alert alert-success" style={{ marginBottom: '20px' }} role="alert">
            <span style={{ marginRight: '8px' }}>✅</span>
            <span>{successMessage}</span>
=======
          <div className="success-message-container" role="status">
            <span className="success-message-icon">✅</span>
            <p className="success-message-text">{successMessage}</p>
>>>>>>> cfa0fc6cfec5beef8fa7247382f176130378de1f
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
              placeholder="you@example.com"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
            {validationErrors.email && (
              <span className="error-text">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
            />
            {validationErrors.password && (
              <span className="error-text">{validationErrors.password}</span>
            )}
          </div>

          {isSignup && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type="password"
                className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                disabled={loading}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {validationErrors.confirmPassword && (
                <span className="error-text">{validationErrors.confirmPassword}</span>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary auth-submit-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <footer className="auth-footer">
          <button
            type="button"
            className="toggle-mode-button"
            disabled={loading}
            onClick={handleToggleMode}
          >
            {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
