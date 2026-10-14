// UI helpers: escaping, markup, icons, overlays, the macron keyboard.
import { analyzer } from '../core/corpus.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** Escape, then render {Latin} in the serif face and **bold** / *italic*. */
export const fmt = (s) => esc(s).replace(/\{([^}]+)\}/g, '<span class="la">$1</span>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>');
export const la = (s) => `<span class="la">${esc(s)}</span>`;
export const pct = (x, d = 0) => (x == null ? '—' : (x * 100).toFixed(d) + '%');
export const plural = (n, a, b) => `${n} ${n === 1 ? a : b || a + 's'}`;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** Is a string (probably) Latin? Used to choose the serif face for answer options. */
export function looksLatin(s) {
  if (/[āēīōūĀĒĪŌŪ]/.test(s)) return true;
  if (/^-\S+$/.test(s) || /\S-$/.test(s)) return true;
  const toks = s.replace(/[.,;:!?“”"()]/g, ' ').split(/\s+/).filter(Boolean);
  return toks.length > 0 && toks.length <= 8 && toks.every((t) => analyzer.analyzeLoose(t).length > 0) && !/^(a|in)$/i.test(s.trim());
}
export const optHtml = (o) => (looksLatin(o) ? `<span class="la">${esc(o)}</span>` : fmt(o));

const P = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
  study: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 19.7 4 20.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5z"/>',
  vocab: '<rect x="3" y="6" width="14" height="13" rx="2"/><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M7 11h6M7 14.5h4"/>',
  grammar: '<path d="M9 3h6M10 3v6.5L5 19a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 19l-5-9.5V3"/><path d="M7.5 15h9"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  lib: '<path d="M4 4v16M9 4v16M14 6l5 14M4 20h16"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>', refresh: '<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  col: '<path d="M6 3h12M6 21h12M8 3v18M16 3v18"/>', flame: '<path d="M12 22c4 0 7-2.8 7-7 0-3-2-5-3-7-1 1-2 2-3 2 0-3-1-6-4-8 0 4-4 6-4 12 0 4 3 8 7 8z"/>',
};
export const icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

// ---------------------------------------------------------------- overlays
export function toast(msg, ms = 2200) {
  const wrap = $('#toasts'); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; wrap.append(t);
  setTimeout(() => t.remove(), ms);
}
export function openModal(html, { wide = false, sheet = false, onClose } = {}) {
  const ov = $('#overlay'); const scrim = document.createElement('div'); scrim.className = 'scrim' + (sheet ? ' bottom' : '');
  scrim.innerHTML = `<div class="modal${wide ? ' wide' : ''}${sheet ? ' sheet' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { scrim.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  scrim.addEventListener('mousedown', (e) => { if (e.target === scrim) close(); });
  document.addEventListener('keydown', onKey);
  ov.append(scrim);
  const first = $('input,select,button.primary,button', scrim); first && first.focus();
  return { el: scrim, root: scrim.firstElementChild, close };
}
export function confirmDialog({ title, body, ok = 'Confirm', cancel = 'Cancel', danger = false }) {
  return new Promise((res) => {
    let done = false;
    const m = openModal(`<h3>${esc(title)}</h3><div class="mt1 muted">${body}</div><div class="row mt3" style="justify-content:flex-end"><button class="btn" data-c>${esc(cancel)}</button><button class="btn primary" data-o ${danger ? 'style="background:var(--bad)"' : ''}>${esc(ok)}</button></div>`, { onClose: () => !done && res(false) });
    m.root.querySelector('[data-c]').onclick = () => { done = true; m.close(); res(false); };
    m.root.querySelector('[data-o]').onclick = () => { done = true; m.close(); res(true); };
  });
}

// ---------------------------------------------------------------- macron keyboard
const MAC = { a: 'ā', e: 'ē', i: 'ī', o: 'ō', u: 'ū', A: 'Ā', E: 'Ē', I: 'Ī', O: 'Ō', U: 'Ū' };
export function initMacronBar() {
  const bar = $('#macron-bar');
  bar.innerHTML = ['ā', 'ē', 'ī', 'ō', 'ū'].map((c) => `<button type="button" tabindex="-1" aria-label="insert ${c}">${c}</button>`).join('');
  let active = null;
  const place = () => { const vv = window.visualViewport; if (!vv) return; bar.style.bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px'; };
  window.visualViewport && ['resize', 'scroll'].forEach((e) => window.visualViewport.addEventListener(e, place));
  bar.addEventListener('mousedown', (e) => e.preventDefault());
  bar.addEventListener('pointerdown', (e) => e.preventDefault());
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b || !active) return;
    insert(active, b.textContent);
  });
  const isLa = (el) => el && el.matches && el.matches('input[data-la], textarea[data-la]');
  document.addEventListener('focusin', (e) => { if (isLa(e.target)) { active = e.target; bar.hidden = false; place(); } });
  document.addEventListener('focusout', (e) => { if (isLa(e.target)) setTimeout(() => { if (!isLa(document.activeElement)) { bar.hidden = true; active = null; } }, 60); });
  // typing a vowel followed by "-" or "_" makes a macron (a- → ā), unless the field is data-la="plain"
  document.addEventListener('input', (e) => {
    const el = e.target; if (!isLa(el) || el.dataset.la === 'plain' || !/^(insertText)$/.test(e.inputType || '')) return;
    if (e.data !== '-' && e.data !== '_') return;
    const p = el.selectionStart; const prev = el.value[p - 2];
    if (prev && MAC[prev]) { el.setRangeText(MAC[prev], p - 2, p, 'end'); el.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  function insert(el, ch) { const s = el.selectionStart ?? el.value.length, e2 = el.selectionEnd ?? s; el.setRangeText(ch, s, e2, 'end'); el.dispatchEvent(new Event('input', { bubbles: true })); el.focus(); }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function download(name, text, type = 'application/json') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
export function fmtDur(ms) { const s = Math.max(0, Math.round(ms / 1000)); const m = Math.floor(s / 60); return `${m}:${String(s % 60).padStart(2, '0')}`; }
export function ago(t, now) { const d = Math.round((now - t) / 60000); if (d < 1) return 'just now'; if (d < 60) return d + ' min ago'; if (d < 1440) return Math.round(d / 60) + ' h ago'; return Math.round(d / 1440) + ' d ago'; }
