const API_BASE_URL = 'http://localhost:8000';

/**
 * Helper function to handle fetch responses and throw friendly errors.
 * Parses JSON error responses from FastAPI and Supabase.
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  let data = null;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    // Check if the response contains FastAPI-style detail error
    if (data && data.detail) {
      
      if (typeof data.detail === 'string') {
        throw new Error(data.detail);
      } else if (Array.isArray(data.detail)) {
        // Validation errors list
        const messages = data.detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        throw new Error(messages);
      }
    }
    // General error fallback
    throw new Error((data && data.message) || `Request failed with status ${response.status}`);
  }

  return data;
}

/**
 * Logs in an existing user.
 * Returns: { access_token, token_type, user: { id, email } }
 */
export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

/**
 * Registers a new user.
 * Returns: { message, user: { id, email } }
 */
export async function signup(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

/**
 * Logs out the current user (client-side and optionally makes logout API request).
 */
export async function logout(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return await handleResponse(response);
  } catch (err) {
    // If the endpoint doesn't exist on the backend yet, log it and return success
    console.warn('Backend logout not supported or failed:', err);
    return { success: true };
  }
}

/**
 * Fetches current user profile to verify token validity.
 * Returns: { user: { id, email } }
 */
export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

/**
 * Fetches all projects for the current user.
 * Returns: list of ProjectOut
 */
export async function getProjects(token) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

/**
 * Fetches details of a specific project (with generated documents).
 * Returns: ProjectWithDocuments
 */
export async function getProjectById(token, id) {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

/**
 * Creates a new project database record.
 * Returns: ProjectOut
 */
export async function createProject(token, projectName, description) {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      project_name: projectName,
      description: description,
    }),
  });
  return handleResponse(response);
}

/**
 * Triggers AI generation for the given project ID.
 * Returns: GenerateResponse
 */
export async function generateProject(token, id) {
  const response = await fetch(`${API_BASE_URL}/projects/${id}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}
