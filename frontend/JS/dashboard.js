const BACKEND_URL = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('access_token');

  // 1. Guard Authentication Check
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Verify token is valid via get_me
  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      localStorage.removeItem('access_token');
      window.location.href = 'login.html';
      return;
    }
  } catch (err) {
    console.error('Token validation failed:', err);
    // If API is down, we don't necessarily log out, but warn user
  }

  const projectForm = document.getElementById('project-form');
  const projectNameInput = document.getElementById('project-name');
  const projectDescInput = document.getElementById('project-description');
  const validationMessageEl = document.getElementById('validation-message');
  const loadingIndicatorEl = document.getElementById('loading-indicator');
  const errorMessageEl = document.getElementById('error-message');
  const resultsSectionEl = document.getElementById('results-section');
  const sidebarListEl = document.getElementById('sidebar-list');

  // 2. Fetch and Load Project History in Sidebar
  async function loadProjectHistory() {
    try {
      const response = await fetch(`${BACKEND_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const projects = await response.json();
        sidebarListEl.innerHTML = '';
        
        if (projects.length === 0) {
          sidebarListEl.innerHTML = '<li style="padding: 10px 12px; color: var(--text-muted); font-size: 13px;">No history yet.</li>';
          return;
        }

        projects.forEach(project => {
          const li = document.createElement('li');
          const date = new Date(project.created_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          
          li.innerHTML = `
            <a href="#" class="project-history-item" data-id="${project.id}">
              <span class="project-name-text">${escapeHTML(project.project_name)}</span>
              <span class="project-date-text">Created: ${date}</span>
            </a>
          `;
          sidebarListEl.appendChild(li);
        });

        // Add event listeners to history items
        sidebarListEl.querySelectorAll('.project-history-item').forEach(item => {
          item.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Remove active classes
            sidebarListEl.querySelectorAll('.project-history-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            const id = item.getAttribute('data-id');
            await fetchAndDisplayProject(id);
          });
        });
      }
    } catch (err) {
      console.error('Failed to load project history:', err);
    }
  }

  // 3. Fetch and Render a Single Project's PRD
  async function fetchAndDisplayProject(projectId) {
    try {
      loadingIndicatorEl.classList.remove('hidden');
      errorMessageEl.classList.add('hidden');
      resultsSectionEl.classList.add('hidden');

      const response = await fetch(`${BACKEND_URL}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const projectData = await response.json();
      loadingIndicatorEl.classList.add('hidden');

      if (response.ok) {
        renderPrdCards(projectData);
        resultsSectionEl.classList.remove('hidden');
      } else {
        errorMessageEl.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      loadingIndicatorEl.classList.add('hidden');
      errorMessageEl.classList.remove('hidden');
    }
  }

  // 4. Render PRD contents in the 7 cards
  function renderPrdCards(project) {
    const cards = resultsSectionEl.querySelectorAll('.prd-card');
    const doc = project.document;

    // Keys in database order matching sections:
    // 0: summary, 1: features, 2: user_stories, 3: db_design, 4: apis, 5: test_cases, 6: dev_plan
    const sectionKeys = ['summary', 'features', 'user_stories', 'db_design', 'apis', 'test_cases', 'dev_plan'];

    if (!doc) {
      // Document is not generated yet (e.g. only project schema created but generator failed/interrupted)
      sectionKeys.forEach((key, index) => {
        const contentEl = cards[index].querySelector('.prd-card-content');
        if (contentEl) {
          contentEl.innerHTML = `<p style="color: var(--text-muted); font-style: italic;">No document plan generated for this project yet. Use the fields above to generate a new document.</p>`;
        }
      });
      return;
    }

    sectionKeys.forEach((key, index) => {
      const contentEl = cards[index].querySelector('.prd-card-content');
      if (contentEl) {
        const textContent = doc[key];
        contentEl.innerHTML = formatPrdContent(textContent);
      }
    });
  }

  // 5. Handle Project form Submit (Create Project -> Trigger Generation)
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      validationMessageEl.classList.add('hidden');
      errorMessageEl.classList.add('hidden');

      const name = projectNameInput.value.trim();
      const description = projectDescInput.value.trim();

      if (!name || !description) {
        validationMessageEl.classList.remove('hidden');
        return;
      }

      try {
        loadingIndicatorEl.classList.remove('hidden');
        resultsSectionEl.classList.add('hidden');

        // Step 1: Create project entry
        const createRes = await fetch(`${BACKEND_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ project_name: name, description: description })
        });

        const project = await createRes.json();

        if (!createRes.ok) {
          loadingIndicatorEl.classList.add('hidden');
          errorMessageEl.classList.remove('hidden');
          return;
        }

        // Step 2: Trigger AI PRD generation
        const generateRes = await fetch(`${BACKEND_URL}/projects/${project.id}/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        loadingIndicatorEl.classList.add('hidden');

        if (generateRes.ok) {
          // Refresh sidebar history and load newly generated document
          await loadProjectHistory();
          await fetchAndDisplayProject(project.id);
        } else {
          errorMessageEl.classList.remove('hidden');
        }
      } catch (err) {
        console.error('Generation flow error:', err);
        loadingIndicatorEl.classList.add('hidden');
        errorMessageEl.classList.remove('hidden');
      }
    });
  }

  // 6. Handle Logout Button
  const logoutBtn = document.querySelector('.sidebar-footer a');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('access_token');
      window.location.href = 'login.html';
    });
  }

  // Initial loads
  await loadProjectHistory();
});

// Markdown / Plain Text formatter helper
function formatPrdContent(text) {
  if (!text) return '<p style="color: var(--text-muted); font-style: italic;">Empty section content.</p>';
  
  // Format code blocks ```
  let html = text.replace(/```([\s\S]*?)```/g, (match, p1) => {
    return `<pre><code>${escapeHTML(p1.trim())}</code></pre>`;
  });
  
  const lines = html.split('\n');
  let result = '';
  let inList = false;
  let listType = null; // 'ul' or 'ol'
  
  for (let line of lines) {
    let trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        result += `</${listType}>`;
        inList = false;
        listType = null;
      }
      continue;
    }
    
    const isUlItem = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const isOlItem = /^\d+\.\s/.test(trimmed);
    
    if (isUlItem) {
      if (!inList || listType !== 'ul') {
        if (inList) result += `</${listType}>`;
        result += '<ul>';
        inList = true;
        listType = 'ul';
      }
      result += `<li>${escapeHTML(trimmed.substring(2))}</li>`;
    } else if (isOlItem) {
      if (!inList || listType !== 'ol') {
        if (inList) result += `</${listType}>`;
        result += '<ol>';
        inList = true;
        listType = 'ol';
      }
      const itemText = trimmed.replace(/^\d+\.\s/, '');
      result += `<li>${escapeHTML(itemText)}</li>`;
    } else {
      if (inList) {
        result += `</${listType}>`;
        inList = false;
        listType = null;
      }
      if (line.includes('<pre>') || line.includes('</pre>') || line.includes('<code>') || line.includes('</code>')) {
        result += line + '\n';
      } else {
        result += `<p>${escapeHTML(line)}</p>`;
      }
    }
  }
  
  if (inList) {
    result += `</${listType}>`;
  }
  
  return result;
}

// Utility escape helper to prevent cross-site scripting (XSS)
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
