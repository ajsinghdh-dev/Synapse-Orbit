import { Q_BY_ID } from '../../core/questions.js';
import { TOPICS } from '../../data/curriculum.js';
import { ERR_LABEL, startOfDay } from '../../core/analytics.js';
import { runPractice } from './practice.js';
import { esc, fmt, la, icon, $, optHtml } from '../util.js';
import { qBadges, ruleBox } from '../qrun.js';
import { mascot } from '../mascot.js';

export default function mistakes({ root, store, now, q: Q }) {
  const st = store.state; let cleanup = null;
  const f = { status: Q.status || 'open', ch: Q.ch || 'all', kind: 'all', yesterday: Q.filter === 'yesterday' };
  const items = () => Object.values(st.mistakes).filter((m) => Q_BY_ID[m.qid]).filter((m) => (f.status === 'all' || m.status === f.status) && (f.ch === 'all' || Q_BY_ID[m.qid].ch === +f.ch) && (f.kind === 'all' || m.kind === f.kind) && (!f.yesterday || (m.last >= startOfDay(now()) - 86400000 && m.last < startOfDay(now())))).sort((a, b) => b.last - a.last);
  const correctText = (q) => (q.type === 'typed' && q.lang === 'la' ? q.accept.map(la).join(' / ') : q.type === 'typed' ? esc(q.accept[0]) : q.type === 'mcq' ? optHtml(q.answer) : q.type === 'compose' ? la(q.ref) : esc(q.sent.en));
  const draw = () => {
    const list = items(); const open = Object.values(st.mistakes).filter((m) => m.status === 'open').length;
    root.innerHTML = `<div class="page-head"><div><h1>Mistake Bank</h1><p>Every incorrect answer is saved with your answer, the correct answer and the reason. Get a question right twice in a row to close it.</p></div>${list.some((m) => m.status === 'open') ? `<button class="btn primary" id="re">${icon('refresh')}Re-attempt ${Math.min(list.filter((m) => m.status === 'open').length, 20)} open</button>` : ''}</div>
    <div class="row mb0" style="margin-bottom:var(--s4)"><div class="chips">${[['open', `Open (${open})`], ['resolved', 'Resolved'], ['all', 'All']].map(([v, l]) => `<button class="chip" data-s="${v}" aria-pressed="${f.status === v}">${l}</button>`).join('')}</div>
      <select class="input" id="fch" style="width:auto;min-height:36px"><option value="all">All chapters</option>${[1, 2, 3, 4].map((c) => `<option value="${c}" ${f.ch == c ? 'selected' : ''}>Chapter ${c}</option>`).join('')}</select>
      <select class="input" id="fk" style="width:auto;min-height:36px"><option value="all">All error types</option><option value="gap" ${f.kind === 'gap' ? 'selected' : ''}>Repeated misunderstanding</option><option value="slip" ${f.kind === 'slip' ? 'selected' : ''}>Probably a slip</option></select>
      ${f.yesterday ? '<span class="badge gold">yesterday only</span>' : ''}</div>
    ${list.length ? list.map((m) => { const q = Q_BY_ID[m.qid]; const last = m.answers[m.answers.length - 1]; return `<article class="card tight mb0" style="margin-bottom:var(--s3)"><div class="qmeta">${qBadges(q)}<span class="badge ${m.status === 'open' ? 'bad' : 'ok'}">${m.status}</span>${m.kind ? `<span class="badge gold">${ERR_LABEL[m.kind]}</span>` : ''}</div>
      <div class="qprompt" style="font-size:17px;margin-bottom:var(--s2)">${q.type === 'translate' ? 'Translate: <span class="la">' + esc(q.sent.la) + '</span>' : fmt(q.prompt)}</div>
      <div class="small">Your answer: <strong>${last?.ans ? (q.type === 'typed' && q.lang === 'la' || q.type === 'compose' ? la(last.ans) : esc(last.ans)) : '<span class="muted">(blank)</span>'}</strong> · Correct: <strong>${correctText(q)}</strong></div>
      <details class="rule mt1"><summary>Explanation</summary><div class="body">${fmt(q.explanation)}</div>${ruleBox(q.rule)}</details>
      <div class="tiny muted mt1">Missed ${m.count}× · first ${new Date(m.first).toLocaleDateString()} · last ${new Date(m.last).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}${m.status === 'open' && m.streakOk ? ` · ${m.streakOk} correct since` : ''}</div></article>`; }).join('') : `<div class="card empty">${mascot('cheer', 90)}<span class="inscr">Per aspera ad astra</span><p class="mb0">${f.status === 'open' ? 'No open mistakes here. Nice.' : 'Nothing to show for these filters.'}</p></div>`}`;
    root.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { f.status = b.dataset.s; draw(); }));
    $('#fch', root).onchange = (e) => { f.ch = e.target.value; draw(); }; $('#fk', root).onchange = (e) => { f.kind = e.target.value; draw(); };
    const re = $('#re', root); if (re) re.onclick = () => start();
  };
  const start = () => { const ids = items().filter((m) => m.status === 'open').slice(0, 20).map((m) => m.qid); if (ids.length) cleanup = runPractice(root, { store, ids, title: 'Mistake re-attempt', mode: 'mistakes', onDone: () => {} }); };
  draw(); if (Q.start) start();
  return () => cleanup && cleanup();
}
void TOPICS;
