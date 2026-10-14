import { byTopic, mockPct, chapterStats, wacc, localDay, startOfDay } from '../../core/analytics.js';
import { FORMATS } from '../../core/selector.js';
import { CHAPTERS } from '../../data/lexicon.js';
import { TOPICS } from '../../data/curriculum.js';
import { esc, pct, fmtDur, $ } from '../util.js';

export default function progress({ root, store, now, activeIds }) {
  const st = store.state, t = now();
  const topics = byTopic(st, t).sort((a, b) => a.acc - b.acc);
  const days = {}; st.attempts.forEach((a) => { const d = localDay(a.t); (days[d] ||= []).push(a.score); });
  const keys = Object.keys(days).sort();
  const W = 640, H = 200, P = 28;
  const pts = keys.map((k, i) => [P + (keys.length > 1 ? i / (keys.length - 1) : .5) * (W - 2 * P), H - P - (days[k].reduce((a, b) => a + b, 0) / days[k].length) * (H - 2 * P), k, days[k].length]);
  const chart = keys.length ? `<div class="chartwrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily accuracy">${[0, .5, 1].map((v) => `<line x1="${P}" x2="${W - P}" y1="${H - P - v * (H - 2 * P)}" y2="${H - P - v * (H - 2 * P)}" stroke="var(--line)"/><text x="2" y="${H - P - v * (H - 2 * P) + 4}">${v * 100}%</text>`).join('')}<polyline fill="none" stroke="var(--gold)" stroke-width="2.5" points="${pts.map((p) => p[0] + ',' + p[1]).join(' ')}"/>${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--gold)"><title>${p[2]}: ${p[3]} answers</title></circle><text x="${p[0]}" y="${H - 6}" text-anchor="middle">${p[2].slice(5)}</text>`).join('')}</svg></div>` : '<p class="muted">Answer some questions to see your trend.</p>';
  const minutes = st.sessions.reduce((s, x) => s + (x.t1 ? Math.min(x.t1 - x.t0, 3600000) : 0), 0);
  const cards = Object.values(st.srs); const mature = cards.filter((c) => c.interval >= 6).length, young = cards.filter((c) => c.interval < 6 && c.reps > 0).length, learning = cards.filter((c) => c.reps === 0).length;
  const act = new Set(activeIds());
  root.innerHTML = `<div class="page-head"><div><h1>Progress</h1><p>Your own results — what is improving and what still needs work.</p></div></div>
  <div class="grid g4"><div class="card tight stat"><b>${st.attempts.length}</b><span>questions answered</span></div><div class="card tight stat"><b>${st.attempts.length ? pct(wacc(st.attempts, t).acc) : '—'}</b><span>recent accuracy</span></div><div class="card tight stat"><b>${fmtDur(minutes)}</b><span>time in sessions</span></div><div class="card tight stat"><b>${st.mocks.length}</b><span>mock exams</span></div></div>
  <section class="card mt2"><h3>Daily accuracy</h3>${chart}</section>
  <div class="grid g2 mt2"><section class="card"><h3>By chapter</h3>${CHAPTERS.map((c) => { const s = chapterStats(st, t, c.n, act); return `<div class="barrow"><span>Chapter ${c.n}</span><div class="bar"><i class="${s.acc != null && s.acc < .6 ? 'low' : s.acc >= .85 ? 'hi' : ''}" style="width:${(s.acc || 0) * 100}%"></i></div><span class="right">${pct(s.acc)}</span></div>`; }).join('')}</section>
    <section class="card"><h3>Vocabulary memory</h3><div class="row" style="gap:var(--s5)"><div class="stat"><b>${mature}</b><span>mature (≥6 d)</span></div><div class="stat"><b>${young}</b><span>young</span></div><div class="stat"><b>${learning}</b><span>re-learning</span></div><div class="stat"><b>${act.size - cards.length}</b><span>not yet seen</span></div></div></section></div>
  <section class="card mt2"><h3>By topic</h3>${topics.length ? topics.map((x) => `<div class="barrow"><span>${esc(x.label)}</span><div class="bar"><i class="${x.acc < .6 ? 'low' : x.acc >= .85 ? 'hi' : ''}" style="width:${x.acc * 100}%"></i></div><span class="right">${pct(x.acc)} <span class="tiny muted">(${x.n})</span></span></div>`).join('') : '<p class="muted mb0">No data yet.</p>'}</section>
  <section class="card mt2"><h3>Mock exams</h3>${st.mocks.length ? `<div class="list">${[...st.mocks].reverse().map((m) => `<a class="row between" style="color:inherit;text-decoration:none" href="#/mock/result?id=${m.t1}"><span>${new Date(m.t1).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${FORMATS[m.fmt].label}</span><span>${m.pending ? '<span class="badge gold">provisional</span> ' : ''}<strong>${pct(mockPct(m))}</strong> · ${fmtDur(m.spent)}</span></a>`).join('')}</div>` : '<p class="muted mb0">None yet. <a href="#/mock">Take one</a>.</p>'}</section>`;
}
void TOPICS; void startOfDay;
