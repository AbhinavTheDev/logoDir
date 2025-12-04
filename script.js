const CARDS_EL = document.getElementById('cards');
const SEARCH_EL = document.getElementById('search');
const THEME_TOGGLE = document.getElementById('themeToggle');
const THEME_ICON = document.getElementById('themeIcon');
const THEME_KEY = 'themePreference';

// Sun icon for light mode
const sunIcon = `
  <circle cx="12" cy="12" r="5" stroke-width="1.6"/>
  <line x1="12" y1="1" x2="12" y2="3" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="12" y1="21" x2="12" y2="23" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="1" y1="12" x2="3" y2="12" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="21" y1="12" x2="23" y2="12" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke-width="1.6" stroke-linecap="round"/>
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke-width="1.6" stroke-linecap="round"/>
`;

// Moon icon for dark mode
const moonIcon = `
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
`;

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  setTheme(theme, false);
}

function setTheme(theme, save = true) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  
  if (theme === 'dark') {
    THEME_ICON.innerHTML = moonIcon;
    THEME_TOGGLE.title = 'Switch to light mode';
  } else {
    THEME_ICON.innerHTML = sunIcon;
    THEME_TOGGLE.title = 'Switch to dark mode';
  }
  
  if (save) {
    localStorage.setItem(THEME_KEY, theme);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

function iconOpen() {
  return `<svg viewBox="0 -960 960 960" fill="currentColor"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>`;
}
function iconCopy() {
  return `<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke-width="1.6"/><rect x="4" y="4" width="11" height="11" rx="2" stroke-width="1.6"/></svg>`;
}
function iconDownload() {
  return `<svg viewBox="0 -960 960 960" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;
}

async function loadManifest() {
  try {
    const res = await fetch('./assets/manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('no manifest');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchSvgCode(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error('Failed to fetch SVG');
    const svgText = await res.text();
    return svgText;
  } catch (err) {
    console.error('Error fetching SVG:', err);
    return null;
  }
}

function buildCard(item) {
  const src = `./assets/${item.file}`;
  const name = item.name || item.file || 'Logo';
  const url = item.url || src;

  return `
    <article class="card" data-name="${escapeAttr(name)}" data-src="${escapeAttr(src)}" data-url="${escapeAttr(url)}">
      <div class="thumb">
        <img src="${src}" alt="${escapeAttr(name)} logo" loading="lazy" />
      </div>
      <div class="meta">
        <div class="name" title="${escapeAttr(name)}">${escapeHtml(name)}</div>
        <div class="actions">
          <button class="icon-btn act-open" title="Open URL">${iconOpen()}</button>
          <button class="icon-btn act-copy" title="Copy SVG code">${iconCopy()}</button>
          <button class="icon-btn act-dl" title="Download">${iconDownload()}</button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(s = '') {
  return escapeHtml(s);
}

function render(list) {
  if (!list.length) {
    CARDS_EL.innerHTML = `<div class="empty">No logos found. Add files to /assets and/or create assets/manifest.json.</div>`;
    return;
  }
  CARDS_EL.innerHTML = list.map(buildCard).join('');
}

function filterList(all, q) {
  if (!q) return all;
  const term = q.toLowerCase();
  return all.filter(item =>
    (item.name || '').toLowerCase().includes(term) ||
    (item.file || '').toLowerCase().includes(term)
  );
}

function wireActions() {
  CARDS_EL.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const card = e.target.closest('.card');
    if (!card) return;

    const src = card.dataset.src;
    const url = card.dataset.url;

    if (btn.classList.contains('act-open')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (btn.classList.contains('act-copy')) {
      const originalTitle = btn.title;
      btn.title = 'Loading...';
      
      const svgCode = await fetchSvgCode(src);
      
      if (svgCode) {
        try {
          await navigator.clipboard.writeText(svgCode);
          btn.title = 'Copied SVG!';
          setTimeout(() => (btn.title = originalTitle), 1500);
        } catch {
          fallbackCopy(svgCode);
          btn.title = 'Copied SVG!';
          setTimeout(() => (btn.title = originalTitle), 1500);
        }
      } else {
        btn.title = 'Failed to copy';
        setTimeout(() => (btn.title = originalTitle), 1500);
      }
    } else if (btn.classList.contains('act-dl')) {
      const a = document.createElement('a');
      a.href = src;
      a.download = src.split('/').pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  });
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

async function main() {
  try {
    // Initialize theme first
    initTheme();
    
    const all = await loadManifest();
    let current = all.slice();

    render(current);
    wireActions();

    // Theme toggle
    THEME_TOGGLE?.addEventListener('click', toggleTheme);

    // Search
    SEARCH_EL?.addEventListener('input', () => {
      current = filterList(all, SEARCH_EL.value);
      render(current);
    });
  } catch (err) {
    console.error(err);
    CARDS_EL.innerHTML = `<div class="error">Failed to load logos.</div>`;
  }
}

main();