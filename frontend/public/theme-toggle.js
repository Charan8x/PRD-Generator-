(function () {
  // 1. Listen for OS theme updates in real time
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  function handleSystemThemeChange(e) {
    // Only update automatically if the user hasn't set a manual choice
    if (!localStorage.getItem('theme-preference')) {
      const theme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      if (window.updateToggleButtonIcon) {
        window.updateToggleButtonIcon(theme);
      }
    }
  }
  
  try {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } catch (err) {
    try {
      mediaQuery.addListener(handleSystemThemeChange);
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Build the toggle button dynamically on load
  function initToggleButton() {
    if (document.getElementById('theme-toggle-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'theme-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.setAttribute('title', 'Toggle dark/light theme');
    
    // Style the button fixed to the top-right corner
    btn.style.position = 'fixed';
    btn.style.top = '16px';
    btn.style.right = '16px';
    btn.style.zIndex = '99999';
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.style.borderRadius = '50%';
    btn.style.border = '1px solid var(--border-color)';
    btn.style.backgroundColor = 'var(--bg-card)';
    btn.style.color = 'var(--accent-color)';
    btn.style.cursor = 'pointer';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.boxShadow = 'var(--shadow-sm)';
    btn.style.transition = 'all 0.2s ease';
    btn.style.padding = '0';
    btn.style.outline = 'none';

    // SVG Icons
    const sunIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      </svg>
    `;
    const moonIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      </svg>
    `;

    // Swap icon based on theme value
    window.updateToggleButtonIcon = function (theme) {
      if (theme === 'dark') {
        btn.innerHTML = sunIcon;
      } else {
        btn.innerHTML = moonIcon;
      }
    };

    // Initialize toggle icon representation
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    window.updateToggleButtonIcon(currentTheme);

    // Dynamic hover effects matching standard UI transitions
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.08)';
      btn.style.borderColor = 'var(--accent-color)';
      btn.style.boxShadow = '0 0 0 3px var(--input-glow)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.borderColor = 'var(--border-color)';
      btn.style.boxShadow = 'var(--shadow-sm)';
    });

    // Toggle button click listener
    btn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme-preference', newTheme);
      window.updateToggleButtonIcon(newTheme);
    });

    document.body.appendChild(btn);
  }

  // Load dynamically on DOMContentLoaded, or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggleButton);
  } else {
    initToggleButton();
  }
})();
