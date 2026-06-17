const BACKEND_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const errorMessageEl = document.getElementById('error-message');
  const errorTextEl = errorMessageEl ? errorMessageEl.querySelector('span') : null;

  // Helper function to display errors
  function showError(message) {
    if (errorMessageEl && errorTextEl) {
      errorTextEl.textContent = message;
      errorMessageEl.classList.remove('hidden');
    } else {
      alert(message);
    }
  }

  // Helper function to hide errors
  function hideError() {
    if (errorMessageEl) {
      errorMessageEl.classList.add('hidden');
    }
  }

  // 1. Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token in localStorage and redirect
          localStorage.setItem('access_token', data.access_token);
          window.location.href = 'dashboard.html';
        } else {
          showError(data.detail || 'Failed to sign in. Please check your credentials.');
        }
      } catch (err) {
        console.error('Login error:', err);
        showError('Unable to connect to the backend server. Make sure the API is running.');
      }
    });
  }

  // 2. Handle Sign Up Form Submit
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      // Validation
      if (password !== confirmPassword) {
        showError('Passwords do not match.');
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Automatically log in the user on successful signup for seamless onboarding
          const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const loginData = await loginResponse.json();

          if (loginResponse.ok) {
            localStorage.setItem('access_token', loginData.access_token);
            window.location.href = 'dashboard.html';
          } else {
            // If auto-login fails, redirect them to login page view
            document.getElementById('tab-login-radio').checked = true;
            alert('Account created! Please log in.');
          }
        } else {
          showError(data.detail || 'Sign up failed. Please try again.');
        }
      } catch (err) {
        console.error('Signup error:', err);
        showError('Unable to connect to the backend server. Make sure the API is running.');
      }
    });
  }
});
