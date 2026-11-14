// Welcome / sign-in screen. There is no password form on purpose: identity comes from the Claude account the page
// is opened under, and progress is stored privately against that account.
import { art } from '../art.js';
import { identify } from '../../core/cloud.js';
import { session } from '../../core/session.js';
import { LEXICON } from '../../data/lexicon.js';

export function showSignin(onEnter) {
  const hosted = !!(globalThis.claude && globalThis.claude.use);
  const el = document.createElement('div');
  el.id = 'gate'; el.className = 'signin';
  el.innerHTML = `
    <div class="si-copy">
      <div class="si-top"><b>LATIN <i>IV</i></b><span>Wheelock’s Latin · 7th ed. · Ch. 1–8</span></div>
      <h1>Master the language.<br>Conquer the exam.</h1>
      <p class="si-lead">Vocabulary with spaced repetition, a grammar lab, translation practice and timed mock exams, built around the first eight chapters of Wheelock.</p>
      <div class="si-actions">
        <button class="btn lg si-go" id="si-go">${hosted ? 'Continue with your Claude account' : 'Start on this device'}</button>
        ${hosted ? '<button class="btn lg si-alt" id="si-local">Use this device only</button>' : ''}
      </div>
      <p class="si-note" id="si-note" role="status">${hosted
        ? 'No password to create. This page already opens inside your Claude account, so signing in links your progress to it and keeps it in step on every device.'
        : 'Opened outside Claude, so there is no account to sign in to here. Progress is saved in this browser.'}</p>
      <ul class="si-facts"><li><b>${LEXICON.length}</b>words</li><li><b>8</b>chapters</li><li><b>7</b>grammar drills</li><li><b>2,600+</b>questions</li></ul>
    </div>
    <div class="si-art">${art('laocoon', 'si-hero')}<div class="si-strip">${art('head')}${art('krater')}${art('discobolus')}</div></div>`;
  document.body.appendChild(el);
  document.body.classList.add('gate');
  const note = el.querySelector('#si-note'), go = el.querySelector('#si-go'), alt = el.querySelector('#si-local');
  const enter = (mode) => { session.start(mode); document.body.classList.remove('gate'); el.remove(); onEnter(); };
  go.onclick = async () => {
    if (!hosted) return enter('device');
    go.disabled = true; if (alt) alt.disabled = true; go.textContent = 'Connecting…';
    const who = await identify();
    if (who && who.id) { note.textContent = `Signed in${who.name ? ' as ' + who.name : ''}. Loading your progress…`; return enter('account'); }
    go.disabled = false; if (alt) alt.disabled = false; go.textContent = 'Try again';
    note.textContent = 'Could not reach a Claude account from this view (you may be signed out of Claude). You can try again, or use this device only: progress then stays in this browser.';
  };
  if (alt) alt.onclick = () => enter('device');
  go.focus();
}
