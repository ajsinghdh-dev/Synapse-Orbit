// LATIN IV — application shell: router, navigation, theme, settings.
import '../core/custom-boot.js';
import { createStore } from '../core/store.js';
import { LEXICON } from '../data/lexicon.js';
import { $, $$, esc, icon, initMacronBar, openModal, toast, download, confirmDialog } from './util.js';

let storage = null;
try { storage = window.localStorage; storage.setItem('latin-iv:probe', '1'); storage.removeItem('latin-iv:probe'); } catch { storage = null; }
// ?now=2026-10-14T10:00 lets you rehearse any day of the plan
const nowParam = new URLSearchParams(location.search).get('now');
const offset = nowParam && !isNaN(Date.parse(nowParam)) ? Date.parse(nowParam) - Date.now() : 0;
export const store = createStore(storage, () => Date.now() + offset);
export const ctxBase = {
  store,
  now: () => store.now(),
  activeIds: () => LEXICON.filter((w) => !store.isExcluded(w.id)).map((w) => w.id),
  go: (h) => { location.hash = h; },
};

export const NAV = [
  ['dashboard', 'Dashboard', 'home'], ['study', 'Study', 'study'], ['vocabulary', 'Vocabulary', 'vocab'], ['grammar', 'Grammar Lab', 'grammar'], ['translation', 'Translation Studio', 'pen'],
  ['practice', 'Practice Tests', 'target'], ['mock', 'Mock Exams', 'clock'], ['mistakes', 'Mistake Bank', 'alert'], ['progress', 'Progress', 'chart'], ['reference', 'Reference Library', 'lib'],
];
const VIEWS = {
  dashboard: () => import('./views/dashboard.js'), study: () => import('./views/study.js'), vocabulary: () => import('./views/vocab.js'), grammar: () => import('./views/grammar.js'),
  translation: () => import('./views/translation.js'), practice: () => import('./views/practice.js'), mock: () => import('./views/mock.js'), mistakes: () => import('./views/mistakes.js'),
  progress: () => import('./views/progress.js'), reference: () => import('./views/reference.js'), settings: () => import('./views/settings.js'),
};

export function applyTheme() {
  const t = store.state.settings.theme;
  document.documentElement.dataset.theme = t;
}
function isDark() { const t = store.state.settings.theme; return t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches); }
function toggleTheme() { store.setSetting('theme', isDark() ? 'light' : 'dark'); applyTheme(); renderChrome(); }

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [p, qs] = raw.split('?');
  const parts = p.split('/').filter(Boolean);
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  return { name: parts[0] || 'dashboard', parts: parts.slice(1), q };
}

function daysLeftLabel() {
  const now = new Date(store.now()); const [y, m, d] = store.state.settings.examDate.split('-').map(Number);
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), b = new Date(y, m - 1, d).getTime();
  return Math.round((b - a) / 86400000);
}

function renderChrome() {
  const { name } = parseHash();
  const cur = (k) => (k === name ? ' aria-current="page"' : '');
  $('#sidebar').innerHTML = `
    <a class="brand" href="#/dashboard" aria-label="LATIN IV home"><b>LATIN <i>IV</i></b><span>Master the language. Conquer the exam.</span></a>
    <nav class="nav" aria-label="Sections">${NAV.map(([k, l, i]) => `<a href="#/${k}"${cur(k)}>${icon(i)}<span>${l}</span></a>`).join('')}</nav>
    <div class="side-foot">
      <div class="small muted">${exLabel()}</div>
      <div class="row between"><span class="motto">Festīnā lentē</span>
        <span class="row tight"><button class="iconbtn" data-theme-toggle aria-label="Toggle light / dark mode">${icon(isDark() ? 'sun' : 'moon')}</button><a class="iconbtn" href="#/settings" aria-label="Settings" ${name === 'settings' ? 'aria-current="page"' : ''}>${icon('gear')}</a></span></div>
    </div>`;
  $('#topbar').innerHTML = `<a class="brand" href="#/dashboard"><b>LATIN <i>IV</i></b><span>Master the language</span></a><span class="row tight"><span class="small muted">${exLabel(true)}</span><button class="iconbtn" data-theme-toggle aria-label="Toggle light / dark mode">${icon(isDark() ? 'sun' : 'moon')}</button><a class="iconbtn" href="#/settings" aria-label="Settings">${icon('gear')}</a></span>`;
  const more = !['dashboard', 'study', 'vocabulary', 'grammar'].includes(name);
  $('#tabbar').innerHTML = `<a href="#/dashboard"${cur('dashboard')}>${icon('home')}Home</a><a href="#/study"${cur('study')}>${icon('study')}Study</a><a href="#/vocabulary"${cur('vocabulary')}>${icon('vocab')}Vocab</a><a href="#/grammar"${cur('grammar')}>${icon('grammar')}Grammar</a><button data-more${more ? ' aria-current="page"' : ''}>${icon('more')}More</button>`;
  $$('[data-theme-toggle]').forEach((b) => (b.onclick = toggleTheme));
  const mb = $('[data-more]'); if (mb) mb.onclick = openMore;
}
function exLabel(short = false) {
  const n = daysLeftLabel();
  if (n < 0) return 'Exam day has passed';
  if (n === 0) return short ? 'Exam today' : 'Exam is today';
  return short ? `${n} day${n === 1 ? '' : 's'} to exam` : `${n} study day${n === 1 ? '' : 's'} until the exam`;
}
function openMore() {
  const items = NAV.filter(([k]) => !['dashboard', 'study', 'vocabulary', 'grammar'].includes(k));
  const m = openModal(`<div class="caps" style="margin-bottom:8px">More</div><div class="col" style="gap:4px">${items.map(([k, l, i]) => `<a class="btn quiet" style="justify-content:flex-start;min-height:52px;font-size:16px" href="#/${k}">${icon(i)}${l}</a>`).join('')}<a class="btn quiet" style="justify-content:flex-start;min-height:52px;font-size:16px" href="#/settings">${icon('gear')}Settings</a></div>`, { sheet: true });
  m.root.addEventListener('click', (e) => { if (e.target.closest('a')) m.close(); });
}

let cleanup = null; let token = 0;
async function route() {
  const my = ++token;
  if (cleanup) { try { cleanup(); } catch { /* view cleanup is best-effort */ } cleanup = null; }
  const r = parseHash();
  renderChrome();
  const main = $('#main');
  const loader = VIEWS[r.name] || VIEWS.dashboard;
  try {
    const mod = await loader();
    if (my !== token) return;
    main.innerHTML = '';
    cleanup = (await mod.default({ ...ctxBase, root: main, parts: r.parts, q: r.q, name: r.name })) || null;
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="card"><h3>Something went wrong</h3><p class="muted">${esc(err.message)}</p><a class="btn" href="#/dashboard">Back to dashboard</a></div>`;
  }
  if (r.parts.length === 0 || true) window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}

addEventListener('hashchange', route);
addEventListener('beforeunload', () => store.flush());
document.addEventListener('visibilitychange', () => { if (document.hidden) store.flush(); });
initMacronBar();
applyTheme();
route();
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !nowParam) navigator.serviceWorker.register('sw.js').catch(() => {});
window.__latin = { store };
void toast; void download; void confirmDialog;
