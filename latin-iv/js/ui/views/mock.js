import { FORMATS, buildMock, apportion } from '../../core/selector.js';
import { Q_BY_ID } from '../../core/questions.js';
import { gradeQuestion, finalizeSelf } from '../../core/grade.js';
import { mockPct } from '../../core/analytics.js';
import { TOPICS, SECTIONS } from '../../data/curriculum.js';
import { mountQuestion, rubricHtml, ruleBox } from '../qrun.js';
import { esc, fmt, la, icon, pct, fmtDur, confirmDialog, openModal, toast, $, optHtml } from '../util.js';

const band = (p) => (p >= 0.9 ? 'A' : p >= 0.8 ? 'B' : p >= 0.7 ? 'C' : p >= 0.6 ? 'D' : 'F');

export default function mock({ root, store, now, parts, q: Q }) {
  const st = store.state;
  if (parts[0] === 'run') return run();
  if (parts[0] === 'result') return result(+Q.id || null);
  return home();

  function home() {
    const fmtSel = Q.fmt && FORMATS[Q.fmt] ? Q.fmt : null;
    const ip = st.inprogress.mock;
    root.innerHTML = `<div class="page-head"><div><h1>Mock Exams</h1><p>Timed simulations. No hints, no feedback until you submit — progress is saved automatically as you go.</p></div></div>
    ${ip ? `<div class="card soft" style="margin-bottom:var(--s4)"><div class="row between"><span><strong>Exam in progress</strong> — ${Object.keys(ip.answers).length} of ${ip.ids.length} answered</span><span class="row tight"><a class="btn primary" href="#/mock/run">Resume</a><button class="btn" id="abandon">Discard</button></span></div></div>` : ''}
    <div class="grid g3">${Object.values(FORMATS).map((f) => `<section class="card col"><div class="caps">${f.mins} minutes</div><h3>${f.label}</h3><p class="small muted grow">${f.n} questions. ${f.blurb}</p><div class="small">${Object.entries(apportion(st.settings.weights[f.key] || f.weights, f.n)).filter(([, n]) => n).map(([k, n]) => `${n} ${SECTIONS[k].toLowerCase()}`).join(' · ')}</div><div class="row"><button class="btn primary" data-start="${f.key}" ${fmtSel === f.key ? 'id="auto"' : ''}>Start</button><button class="btn quiet sm" data-w="${f.key}">Section weights</button></div></section>`).join('')}</div>
    <div class="card mt3 col"><h3>Exam rules in force</h3><ul class="small muted" style="margin:0;padding-left:18px"><li>Questions are randomised; the comprehensive exam rises in difficulty.</li><li>Hints are ${st.settings.accommodationHints ? '<strong>on</strong> (accommodation setting)' : 'off'}. Timer is ${st.settings.timerVisible ? 'visible' : 'hidden'} <a href="#/settings">(change)</a>.</li><li>Keyboard: <span class="kbd">←</span> <span class="kbd">→</span> move, <span class="kbd">F</span> flags, <span class="kbd">1</span>–<span class="kbd">4</span> choose.</li><li>Translations into English are self-assessed afterwards, so the score stays <em>provisional</em> until you rate them.</li></ul>
      <label class="switch"><input type="checkbox" id="untimed" ${Q.untimed ? 'checked' : ''}> Untimed (no countdown)</label></div>
    ${st.mocks.length ? `<h2 class="mt4" style="margin-bottom:var(--s3)">Past attempts</h2><div class="card tight"><div class="list">${[...st.mocks].reverse().map((m) => `<a class="row between" style="color:inherit;text-decoration:none" href="#/mock/result?id=${m.t1}"><span>${new Date(m.t1).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${FORMATS[m.fmt].label}</span><span>${m.pending ? '<span class="badge gold">provisional</span> ' : ''}<strong>${pct(mockPct(m))}</strong></span></a>`).join('')}</div></div>` : ''}`;
    root.querySelectorAll('[data-start]').forEach((b) => (b.onclick = () => begin(b.dataset.start)));
    root.querySelectorAll('[data-w]').forEach((b) => (b.onclick = () => weights(b.dataset.w)));
    const ab = $('#abandon', root); if (ab) ab.onclick = async () => { if (await confirmDialog({ title: 'Discard this exam?', body: 'Your answers so far will be lost.', ok: 'Discard', danger: true })) { st.inprogress.mock = null; store.save(true); home(); } };
    const au = $('#auto', root); if (au && !ip) begin(fmtSel);
  }
  function weights(key) {
    const f = FORMATS[key]; const w = { ...(st.settings.weights[key] || f.weights) };
    const m = openModal(`<h3>Section weights · ${f.label}</h3><p class="small muted">Match your professor’s exam if you learn its breakdown. Values are relative; the ${f.n} questions are apportioned automatically.</p>${Object.keys(w).map((k) => `<div class="field mt1"><label>${SECTIONS[k]} <span data-v="${k}">${Math.round(w[k] * 100)}</span>%</label><input type="range" min="0" max="60" value="${Math.round(w[k] * 100)}" data-r="${k}"></div>`).join('')}<div class="row mt3" style="justify-content:flex-end"><button class="btn" data-reset>Reset</button><button class="btn primary" data-save>Save</button></div>`);
    m.root.querySelectorAll('[data-r]').forEach((r) => r.addEventListener('input', () => { w[r.dataset.r] = r.value / 100; m.root.querySelector(`[data-v="${r.dataset.r}"]`).textContent = r.value; }));
    m.root.querySelector('[data-reset]').onclick = () => { st.settings.weights[key] = null; store.save(true); m.close(); home(); };
    m.root.querySelector('[data-save]').onclick = () => { if (Object.values(w).every((x) => !x)) return toast('Give at least one section a weight'); st.settings.weights[key] = w; store.save(true); m.close(); home(); };
  }
  function begin(fmtKey) {
    const m = buildMock(fmtKey, st, Math.random);
    const untimed = $('#untimed', root)?.checked || Q.untimed;
    st.inprogress.mock = { fmt: fmtKey, ids: m.items, answers: {}, flags: {}, idx: 0, t0: now(), spent: 0, mins: m.mins, timed: !untimed, sid: store.startSession('mock', { fmt: fmtKey }).id };
    store.save(true); location.hash = '#/mock/run';
  }

  function run() {
    const E = st.inprogress.mock; if (!E) { location.hash = '#/mock'; return; }
    const f = FORMATS[E.fmt]; let ctrl = null; let last = Date.now(); let review = false;
    const total = E.ids.length;
    const left = () => E.mins * 60000 - E.spent;
    const tick = () => { const t = Date.now(); E.spent += Math.min(t - last, 5000); last = t; const el = $('#tm', root); if (el) { el.textContent = fmtDur(Math.max(0, left())); el.classList.toggle('low', left() < 300000); } if (E.timed && left() <= 0) { clearInterval(iv); toast('Time is up — submitting'); submit(true); } };
    const iv = setInterval(() => { tick(); if (Math.round(E.spent / 1000) % 10 === 0) store.save(); }, 1000);
    const onKey = (e) => {
      if (e.target.matches('input,textarea')) return;
      if (e.key === 'ArrowRight') go(E.idx + 1); else if (e.key === 'ArrowLeft') go(E.idx - 1); else if (e.key.toLowerCase() === 'f') flag();
    };
    document.addEventListener('keydown', onKey);
    const go = (i) => { if (i < 0 || i >= total) return; E.idx = i; review = false; store.save(true); draw(); };
    const flag = () => { const id = E.ids[E.idx]; E.flags[id] = !E.flags[id]; store.save(true); draw(); };
    const answered = (id) => E.answers[id] != null && String(E.answers[id]).trim() !== '';
    function draw() {
      if (ctrl) ctrl.destroy();
      const id = E.ids[E.idx], q = Q_BY_ID[id];
      const nav = `<div class="navgrid">${E.ids.map((x, i) => `<button data-i="${i}" class="${answered(x) ? 'done' : ''} ${i === E.idx && !review ? 'cur' : ''} ${E.flags[x] ? 'flag' : ''}" aria-label="Question ${i + 1}${answered(x) ? ', answered' : ''}${E.flags[x] ? ', flagged' : ''}">${i + 1}</button>`).join('')}</div>`;
      root.innerHTML = `<div class="row between" style="margin-bottom:var(--s3)"><div><span class="caps">${f.label}</span><div class="small muted">Question ${E.idx + 1} of ${total} · ${Object.keys(E.answers).filter((k) => answered(k)).length} answered${Object.values(E.flags).filter(Boolean).length ? ' · ' + Object.values(E.flags).filter(Boolean).length + ' flagged' : ''}</div></div>
        <div class="row">${E.timed ? `<span class="timer" id="tm" style="${st.settings.timerVisible ? '' : 'display:none'}">${fmtDur(Math.max(0, left()))}</span>` : '<span class="badge">untimed</span>'}<button class="btn primary sm" id="fin">Review &amp; submit</button></div></div>
        <div class="progress" style="margin-bottom:var(--s4)"><i style="width:${(E.idx + 1) / total * 100}%"></i></div>
        ${review ? reviewHtml() : `<div class="grid" style="grid-template-columns:minmax(0,1fr) 200px;align-items:start"><div><div id="q"></div><div class="row between mt2"><button class="btn" id="prev" ${E.idx === 0 ? 'disabled' : ''}>${icon('back')}Previous</button><button class="btn ${E.flags[id] ? 'gold' : ''}" id="flag">${icon('flag')}${E.flags[id] ? 'Flagged' : 'Flag'}</button><button class="btn primary" id="next">${E.idx === total - 1 ? 'Review' : 'Next'}${icon('arrow')}</button></div></div><aside class="card tight" style="position:sticky;top:16px"><div class="caps" style="margin-bottom:8px">Questions</div>${nav}</aside></div>`}`;
      root.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => go(+b.dataset.i)));
      $('#fin', root).onclick = () => { review = true; draw(); };
      if (review) { $('#back', root).onclick = () => { review = false; draw(); }; $('#sub', root).onclick = () => submit(false); return; }
      $('#prev', root).onclick = () => go(E.idx - 1); $('#flag', root).onclick = flag;
      $('#next', root).onclick = () => (E.idx === total - 1 ? ((review = true), draw()) : go(E.idx + 1));
      ctrl = mountQuestion($('#q', root), q, { settings: st.settings, exam: true, initial: E.answers[id] ?? null, onChange: (a) => { E.answers[id] = a; store.save(); const b = root.querySelector(`[data-i="${E.idx}"]`); if (b) b.classList.toggle('done', answered(id)); }, onEnter: () => go(E.idx + 1) });
      ctrl.focus();
    }
    function reviewHtml() {
      const un = E.ids.filter((x) => !answered(x)).length, fl = E.ids.filter((x) => E.flags[x]).length;
      return `<div class="card col"><h3>Review before submitting</h3><p class="mb0">${un ? `<strong style="color:var(--bad)">${un} unanswered.</strong> ` : 'All questions answered. '}${fl ? `${fl} flagged for review.` : ''} Select a number to jump to it.</p><div class="navgrid">${E.ids.map((x, i) => `<button data-i="${i}" class="${answered(x) ? 'done' : ''} ${E.flags[x] ? 'flag' : ''}">${i + 1}</button>`).join('')}</div><div class="row"><button class="btn" id="back">Back to questions</button><button class="btn primary" id="sub">Submit exam</button></div></div>`;
    }
    async function submit(force) {
      const un = E.ids.filter((x) => !answered(x)).length;
      if (!force && !(await confirmDialog({ title: 'Submit the exam?', body: `${un ? un + ' question(s) are unanswered and will be marked wrong. ' : ''}You cannot change answers after submitting.`, ok: 'Submit', cancel: 'Keep working' }))) return;
      clearInterval(iv); document.removeEventListener('keydown', onKey); if (ctrl) ctrl.destroy();
      const items = E.ids.map((id) => {
        const q = Q_BY_ID[id]; const ans = E.answers[id]; const has = answered(id);
        const res = has ? gradeQuestion(q, ans, st.settings) : { status: 'incorrect', correct: false, score: 0, empty: true };
        if (q.type === 'translate') res.pending = has;      // needs self-assessment
        return { qid: id, ans: has ? String(ans) : '', res: slim(res), flagged: !!E.flags[id] };
      });
      const m = { id: now(), fmt: E.fmt, t0: E.t0, t1: now(), mins: E.mins, spent: E.spent, items };
      recompute(m);
      items.forEach((it) => { const q = Q_BY_ID[it.qid]; if (!it.res.pending) store.recordAttempt({ q, res: it.res, ans: it.ans, mode: 'mock', sid: E.sid, mixed: true }); });
      store.endSession(st.sessions.find((s) => s.id === E.sid) || {}, { n: items.length });
      store.saveMock(m);
      location.hash = '#/mock/result?id=' + m.t1;
    }
    draw();
    return () => { clearInterval(iv); document.removeEventListener('keydown', onKey); if (ctrl) ctrl.destroy(); store.flush(); };
  }
  function slim(r) { return { status: r.status, correct: r.correct, score: r.score, pending: r.pending, empty: r.empty, macronOnly: r.macronOnly, keywords: r.keywords ? { found: r.keywords.found.map((x) => ({ role: x.role, src: x.src, ok: x.ok })), reversed: r.keywords.reversed } : undefined, messages: r.messages }; }
  function recompute(m) {
    const obj = m.items.filter((i) => !i.res.pending && !(i.res.status === 'selfassess'));
    m.pending = m.items.filter((i) => i.res.pending).length;
    m.objective = { score: obj.reduce((s, i) => s + (i.res.score || 0), 0), total: obj.length };
    const all = m.items.filter((i) => !i.res.pending);
    m.overall = { score: all.reduce((s, i) => s + (i.res.score || 0), 0), total: m.items.length };
  }

  function result(id) {
    const m = st.mocks.find((x) => x.t1 === id) || st.mocks[st.mocks.length - 1];
    if (!m) { location.hash = '#/mock'; return; }
    const drawR = () => {
      const f = FORMATS[m.fmt]; const done = m.pending === 0;
      const pctObj = m.objective.total ? m.objective.score / m.objective.total : 0;
      const final = done ? m.overall.score / m.overall.total : null;
      const shown = done ? final : pctObj;
      const qs = m.items.map((it) => ({ ...it, q: Q_BY_ID[it.qid] }));
      const group = (key) => { const g = {}; qs.filter((x) => !x.res.pending).forEach((x) => { (g[key(x.q)] ||= []).push(x.res.score || 0); }); return Object.entries(g).map(([k, l]) => [k, l.reduce((a, b) => a + b, 0) / l.length, l.length]); };
      const bars = (rows, lab) => rows.map(([k, a, n]) => `<div class="barrow"><span>${esc(lab(k))}</span><div class="bar"><i class="${a < 0.6 ? 'low' : a >= 0.85 ? 'hi' : ''}" style="width:${a * 100}%"></i></div><span class="right">${pct(a)} <span class="tiny muted">(${n})</span></span></div>`).join('');
      const topics = group((q) => q.topic).sort((a, b) => a[1] - b[1]);
      const wrong = qs.filter((x) => !x.res.pending && (x.res.score || 0) < 0.5);
      const errTop = Object.entries(wrong.reduce((o, x) => ((o[x.q.topic] = (o[x.q.topic] || 0) + 1), o), {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const weak = topics.filter((t) => t[1] < 0.8).slice(0, 3);
      root.innerHTML = `<div class="crumbs"><a href="#/mock">Mock Exams</a> › Results</div><div class="page-head"><div><h1>${f.label}</h1><p>${new Date(m.t1).toLocaleString()} · time used ${fmtDur(m.spent)} of ${m.mins}:00</p></div></div>
      <div class="card gold"><div class="row" style="gap:var(--s6)"><div><div class="caps">${done ? 'Final mock grade' : 'Provisional score'}</div><div class="display" style="font-size:64px;line-height:1">${pct(shown)}<span class="muted" style="font-size:28px"> · ${band(shown)}</span></div></div>
        <div class="grow" style="min-width:240px">${done ? '<p class="mb0">All questions are graded. This letter is for this mock exam only; it is not a prediction of your course grade.</p>' : `<div class="banner warn"><strong>Provisional.</strong> ${m.pending} translation answer${m.pending === 1 ? '' : 's'} still need${m.pending === 1 ? 's' : ''} your self-assessment below. The ${pct(pctObj)} above covers the ${m.objective.total} objectively graded questions only.</div>`}</div></div></div>
      ${!done ? `<h2 class="mt3" style="margin-bottom:var(--s3)">Self-assess your translations</h2>${qs.filter((x) => x.res.pending).map((x) => `<div class="card mb0" style="margin-bottom:var(--s3)" data-sa="${x.qid}"><div class="latin-big" style="font-size:24px">${esc(x.q.sent.la)}</div><p class="small mt1">Your answer: <strong>${esc(x.ans)}</strong></p><div class="banner info"><strong>Reference:</strong> “${esc(x.q.sent.en)}”${x.q.sent.alts.length ? ' <span class="muted">· also: ' + x.q.sent.alts.map((a) => '“' + esc(a) + '”').join(' · ') + '</span>' : ''}</div>${x.res.keywords ? rubricHtml(x.q.sent, x.res.keywords) : ''}<div class="row mt2"><button class="btn" data-r="0">Not yet</button><button class="btn" data-r="0.5">Partly right</button><button class="btn primary" data-r="1">Correct</button></div></div>`).join('')}` : ''}
      <div class="grid g2 mt3"><section class="card"><h3>By section</h3>${bars(group((q) => q.section), (k) => SECTIONS[k])}</section><section class="card"><h3>By chapter</h3>${bars(group((q) => q.ch).sort((a, b) => a[0] - b[0]), (k) => 'Chapter ' + k)}</section></div>
      <section class="card mt2"><h3>Accuracy by topic</h3>${bars(topics, (k) => TOPICS[k]?.label || k)}</section>
      <div class="grid g2 mt2"><section class="card"><h3>Most common errors</h3>${errTop.length ? `<div class="list">${errTop.map(([t, n]) => `<div class="row between"><span>${esc(TOPICS[t]?.label || t)}</span><span class="badge bad">${n} missed</span></div>`).join('')}</div>` : '<p class="muted mb0">No objectively graded errors.</p>'}</section>
        <section class="card"><h3>Skills to revise next</h3>${weak.length ? `<div class="list">${weak.map(([t, a]) => `<div class="row between"><span>${esc(TOPICS[t]?.label || t)} <span class="muted">${pct(a)}</span></span><a class="btn sm" href="#/practice?topic=${t}&len=10&diff=adaptive&start=1">Practise</a></div>`).join('')}</div>` : '<p class="mb0">Nothing below 80% — keep polishing with mixed review.</p>'}
        <hr class="sep"><strong>Recommended retake:</strong> <span class="small">${shown >= 0.9 ? 'Not needed — take a different format tomorrow to keep sharp.' : shown >= 0.75 ? 'After revising the topics above, retake the same format tomorrow.' : 'Review the Mistake Bank first, then retake the Quick Test, then this format.'}</span></section></div>
      <h2 class="mt4" style="margin-bottom:var(--s3)">Answers &amp; explanations</h2>${qs.map((x, i) => `<details class="rule mb0" style="margin-bottom:var(--s2)"><summary>${i + 1}. ${x.res.pending ? '<span class="badge gold">self-assess</span>' : (x.res.score || 0) >= 1 ? '<span class="badge ok">correct</span>' : (x.res.score || 0) > 0 ? '<span class="badge gold">partial</span>' : '<span class="badge bad">incorrect</span>'} ${x.flagged ? '⚑ ' : ''}<span class="small">${x.q.type === 'translate' ? 'Translate: ' + esc(x.q.sent.la) : fmt(x.q.prompt)}</span></summary><div class="body small"><p>Your answer: <strong>${x.ans ? esc(x.ans) : '<span class="muted">(blank)</span>'}</strong><br>Correct: <strong>${x.q.type === 'typed' && x.q.lang === 'la' ? x.q.accept.map(la).join(' / ') : x.q.type === 'mcq' ? optHtml(x.q.answer) : x.q.type === 'compose' ? la(x.q.ref) : x.q.type === 'typed' ? esc(x.q.accept[0]) : esc(x.q.sent.en)}</strong></p><div class="why">${fmt(x.q.explanation)}</div></div></details>`).join('')}
      <div class="row mt3"><a class="btn primary" href="#/mock">Another exam</a><a class="btn" href="#/mistakes">Mistake Bank</a></div>`;
      root.querySelectorAll('[data-sa]').forEach((card) => card.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => {
        const it = m.items.find((i) => i.qid === card.dataset.sa); const fin = finalizeSelf(it.res, +b.dataset.r); fin.pending = false; it.res = slim(fin);
        recompute(m); store.recordAttempt({ q: Q_BY_ID[it.qid], res: fin, ans: it.ans, mode: 'mock', mixed: true }); store.save(true); drawR();
      })));
    };
    drawR();
  }
}
void ruleBox;
