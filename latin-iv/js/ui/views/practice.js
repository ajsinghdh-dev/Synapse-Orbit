import { selectPractice, similarTo, topicLabel } from '../../core/selector.js';
import { Q_BY_ID } from '../../core/questions.js';
import { TOPICS } from '../../data/curriculum.js';
import { ERR_LABEL } from '../../core/analytics.js';
import { mountQuestion, ruleBox } from '../qrun.js';
import { esc, icon, pct, $, fmt } from '../util.js';

const CHOICES = { section: [['everything', 'Everything'], ['vocabulary', 'Vocabulary'], ['grammar', 'Grammar'], ['translation', 'Translation'], ['conjugation', 'Conjugation'], ['declension', 'Declension']], diff: [['1', 'Foundation'], ['2', 'Standard'], ['3', 'Challenging'], ['adaptive', 'Adaptive']], len: [5, 10, 20, 40] };

/** Reusable runner: ids = starting queue. Used by Practice and the Mistake Bank. */
export function runPractice(root, { store, ids, title, mode = 'practice', onDone, resume = null, similar = true }) {
  const st = store.state;
  const sess = resume?.sid ? st.sessions.find((s) => s.id === resume.sid) || store.startSession(mode) : store.startSession(mode, { title });
  const S = resume || { ids: [...ids], idx: 0, results: [], sid: sess.id, used: [...ids] };
  S.sid = sess.id;
  let ctrl = null;
  const save = () => { if (mode === 'practice') { st.inprogress.practice = S; store.save(true); } };
  const finish = () => {
    if (mode === 'practice') { st.inprogress.practice = null; }
    store.endSession(sess, { n: S.results.length, correct: S.results.filter((r) => r.score >= 1).length });
    const by = {}; S.results.forEach((r) => { (by[r.topic] ||= []).push(r); });
    const rows = Object.entries(by).map(([t, l]) => ({ t, n: l.length, acc: l.reduce((s, r) => s + r.score, 0) / l.length }));
    const tot = S.results.reduce((s, r) => s + r.score, 0);
    const misses = S.results.filter((r) => r.score < 0.5);
    const kinds = misses.map((r) => store.state.mistakes[r.qid]?.kind).filter(Boolean);
    root.innerHTML = `<div class="card"><div class="inscr">Opus perfectum</div><h2 class="mt1">Session complete</h2>
      <div class="row mt2" style="gap:var(--s6)"><div class="stat"><b>${S.results.length ? pct(tot / S.results.length) : '—'}</b><span>accuracy</span></div><div class="stat"><b>${S.results.filter((r) => r.score >= 1).length}/${S.results.length}</b><span>fully correct</span></div></div>
      <div class="mt3">${rows.map((r) => `<div class="barrow"><span>${esc(topicLabel(r.t))}</span><div class="bar"><i class="${r.acc < 0.6 ? 'low' : r.acc >= 0.85 ? 'hi' : ''}" style="width:${r.acc * 100}%"></i></div><span class="right">${pct(r.acc)}</span></div>`).join('')}</div>
      ${misses.length ? `<p class="small mt2">${misses.length} missed — saved to the Mistake Bank. ${['gap', 'slip'].map((k) => { const n = kinds.filter((x) => x === k).length; return n ? `<span class="badge ${k === 'gap' ? 'bad' : 'gold'}">${n} × ${ERR_LABEL[k].toLowerCase()}</span>` : ''; }).join(' ')}</p>` : '<p class="mt2">No misses. Well done.</p>'}
      <div class="row mt3">${misses.length ? '<button class="btn primary" data-retry>Retry missed questions</button>' : ''}<a class="btn" href="#/practice">New session</a><a class="btn quiet" href="#/dashboard">Dashboard</a></div></div>`;
    const r = $('[data-retry]', root); if (r) r.onclick = () => runPractice(root, { store, ids: misses.map((m) => m.qid), title: 'Retry', mode, onDone });
    onDone && onDone(S);
  };
  const show = () => {
    if (ctrl) ctrl.destroy();
    if (S.idx >= S.ids.length) return finish();
    const q = Q_BY_ID[S.ids[S.idx]];
    root.innerHTML = `<div class="row between mb0"><span class="caps">${esc(title || 'Practice')} · question ${S.idx + 1} of ${S.ids.length}</span><a class="btn quiet sm" href="#/dashboard" data-leave>Pause &amp; leave</a></div><div class="progress mt1" style="margin-bottom:var(--s4)"><i style="width:${S.idx / S.ids.length * 100}%"></i></div><div id="q"></div><div id="next"></div>`;
    const t0 = performance.now();
    ctrl = mountQuestion($('#q', root), q, {
      settings: st.settings,
      onSubmit: ({ ans, res }) => {
        const att = store.recordAttempt({ q, res, ans, ms: Math.round(performance.now() - t0), mode, sid: sess.id, mixed: mode !== 'lab' });
        S.results.push({ qid: q.id, topic: q.topic, score: res.score ?? 0 });
        save();
        const wrong = (res.score ?? 0) < 0.5;
        const kind = wrong ? store.state.mistakes[q.id]?.kind : null;
        const nx = $('#next', root);
        const simBtn = wrong && similar ? `<button class="btn" data-sim>Try a similar question</button>` : '';
        nx.innerHTML = `<div class="row mt2">${kind ? `<span class="badge ${kind === 'gap' ? 'bad' : 'gold'}">${ERR_LABEL[kind]}</span>` : ''}<span class="grow"></span>${simBtn}<button class="btn primary" data-n>${S.idx + 1 >= S.ids.length ? 'Finish' : 'Next'} ${icon('arrow')}</button></div>${wrong ? '<p class="small muted mt1">Read the rule above first — then try a similar question before moving on.</p>' : ''}`;
        const go = () => { S.idx++; save(); show(); };
        $('[data-n]', nx).onclick = go; $('[data-n]', nx).focus({ preventScroll: true });
        const sb = $('[data-sim]', nx);
        if (sb) sb.onclick = () => { const sq = similarTo(q, store.state, new Set(S.used), Math.random); if (sq) { S.ids.splice(S.idx + 1, 0, sq.id); S.used.push(sq.id); } go(); };
        void att;
      },
    });
    ctrl.focus();
  };
  show();
  return () => ctrl && ctrl.destroy();
}

export default function practice({ root, store, now, q: Q, parts }) {
  const st = store.state;
  if (parts[0] === 'run') {
    const r = st.inprogress.practice;
    if (!r) { location.hash = '#/practice'; return; }
    return runPractice(root, { store, ids: r.ids, resume: r, title: 'Practice' });
  }
  const cfg = { chapters: Q.ch && Q.ch !== 'all' ? Q.ch.split(',').map(Number) : 'all', section: Q.type || 'everything', diff: Q.diff || 'adaptive', len: +Q.len || 10, topic: Q.topic || '' };
  const start = () => {
    const ids = selectPractice({ ...cfg, topic: cfg.topic || undefined }, st, now()).map((q) => q.id);
    if (!ids.length) { $('#msg', root).innerHTML = '<div class="banner warn">No questions match these filters. Loosen the difficulty or chapter.</div>'; return; }
    cleanup = runPractice(root, { store, ids, title: cfg.topic ? topicLabel(cfg.topic) : 'Practice' });
  };
  const seg = (key, opts, cur) => `<div class="chips" data-k="${key}">${opts.map(([v, l]) => `<button class="chip" aria-pressed="${String(cur) === String(v)}" data-v="${v}">${l}</button>`).join('')}</div>`;
  let cleanup = null;
  const draw = () => {
    root.innerHTML = `<div class="page-head"><div><h1>Practice Tests</h1><p>Choose what to practise. Adaptive mode steers toward what you keep missing and stops repeating what you have mastered.</p></div><a class="btn" href="#/games">${icon('bolt')}Play Legion Rush</a></div>
    ${st.inprogress.practice ? `<div class="card soft mb0" style="margin-bottom:var(--s4)"><div class="row between"><span>You have an unfinished session.</span><a class="btn" href="#/practice/run">Resume</a></div></div>` : ''}
    <div class="card col" style="gap:var(--s5)">
      <div><div class="lbl">Chapters</div><div class="chips mt1" data-k="ch">${[['all', 'All mixed'], [1, 'Chapter 1'], [2, 'Chapter 2'], [3, 'Chapter 3'], [4, 'Chapter 4']].map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="${v === 'all' ? cfg.chapters === 'all' : cfg.chapters !== 'all' && cfg.chapters.includes(v)}">${l}</button>`).join('')}</div></div>
      <div><div class="lbl">Question type</div><div class="mt1">${seg('section', CHOICES.section, cfg.section)}</div></div>
      <div><div class="lbl">Difficulty</div><div class="mt1">${seg('diff', CHOICES.diff, cfg.diff)}</div></div>
      <div><div class="lbl">Length</div><div class="chips mt1" data-k="len">${CHOICES.len.map((n) => `<button class="chip" data-v="${n}" aria-pressed="${cfg.len === n}">${n} questions</button>`).join('')}<label class="chip" style="padding:0 6px 0 12px">Custom <input id="custom" class="input" type="number" min="1" max="100" style="width:70px;min-height:28px;padding:2px 8px;margin-left:6px" value="${CHOICES.len.includes(cfg.len) ? '' : cfg.len}"></label></div></div>
      ${cfg.topic ? `<div class="banner info">Focused on <strong>${esc(topicLabel(cfg.topic))}</strong> <a href="#/practice" class="small">clear</a></div>` : ''}
      <div id="msg"></div><div><button class="btn primary lg" id="go">${icon('play')}Start practice</button></div></div>`;
    root.querySelectorAll('[data-k]').forEach((g) => g.addEventListener('click', (e) => {
      const b = e.target.closest('.chip'); if (!b) return; const k = g.dataset.k, v = b.dataset.v;
      if (k === 'ch') { if (v === 'all') cfg.chapters = 'all'; else { const cur = cfg.chapters === 'all' ? [] : cfg.chapters; const n = +v; cfg.chapters = cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]; if (!cfg.chapters.length) cfg.chapters = 'all'; } }
      else if (k === 'len') cfg.len = +v; else cfg[k] = v;
      draw();
    }));
    $('#custom', root).addEventListener('change', (e) => { cfg.len = Math.max(1, Math.min(100, +e.target.value || 10)); draw(); });
    $('#go', root).onclick = start;
  };
  if (Q.start) start(); else draw();
  return () => cleanup && cleanup();
}
void TOPICS; void ruleBox; void fmt;
