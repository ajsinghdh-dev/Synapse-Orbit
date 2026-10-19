import { readiness, chapterStats, mission, streak, todayCount, dueCounts, weakest, mostImproved, openMistakes, READINESS_WEIGHTS } from '../../core/analytics.js';
import { CHAPTERS } from '../../data/lexicon.js';
import { TOPICS } from '../../data/curriculum.js';
import { Q_BY_ID } from '../../core/questions.js';
import { esc, fmt, icon, pct, plural, ago, $, openModal, toast } from '../util.js';
import { mascot } from '../mascot.js';

const COMP_LABEL = { vocab: 'Vocabulary retrieval', grammar: 'Grammar accuracy', translation: 'Translation', mixed: 'Mixed questions', retention: 'Retention over repeats', mock: 'Timed mock exams' };

function countdown(store) {
  const now = store.now(), ts = store.examTs(), ms = ts - now;
  if (ms <= 0) return { done: true };
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60;
  const t0 = new Date(now); const [y, mo, da] = store.state.settings.examDate.split('-').map(Number);
  const studyDays = Math.max(0, Math.round((new Date(y, mo - 1, da) - new Date(t0.getFullYear(), t0.getMonth(), t0.getDate())) / 86400000));
  return { d, h, m, studyDays };
}

function ring(score) {
  const R = 54, C = 2 * Math.PI * R; const off = score == null ? C : C * (1 - score);
  return `<svg class="ring" viewBox="0 0 132 132" role="img" aria-label="${score == null ? 'Readiness not yet estimated' : 'Estimated readiness ' + Math.round(score * 100) + ' percent'}"><circle class="bg" cx="66" cy="66" r="${R}" fill="none" stroke-width="9"/><circle class="fg" cx="66" cy="66" r="${R}" fill="none" stroke-width="9" stroke-dasharray="${C}" stroke-dashoffset="${off}" transform="rotate(-90 66 66)"/><text x="66" y="74" text-anchor="middle">${score == null ? '—' : Math.round(score * 100) + '%'}</text></svg>`;
}

export default function dashboard({ root, store, now, activeIds }) {
  const draw = () => {
    const t = now();
    const st = store.state;
    const act = new Set(activeIds());
    const cd = countdown(store);
    const rd = readiness(st, t);
    const ex = store.examTs();
    const ms = mission(st, t, { activeIds: [...act], examTs: ex });
    const dc = dueCounts(st, [...act], t);
    const wk = weakest(st, t, 3);
    const imp = mostImproved(st, t);
    const open = openMistakes(st).sort((a, b) => b.last - a.last);
    const today = todayCount(st, t), target = st.settings.dailyTarget;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const exStr = new Date(ex).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const resumeMock = st.inprogress.mock, resumePrac = st.inprogress.practice;
    const chs = CHAPTERS.map((c) => ({ c, s: chapterStats(st, t, c.n, act) }));

    root.innerHTML = `
      <div class="hello">${mascot(st.attempts.length ? 'happy' : 'cheer', 92)}<div class="grow"><div class="inscr">Salvē, discipule!</div><h2 class="mt1">${st.attempts.length ? `Welcome back. ${streak(st, t) ? streak(st, t) + '-day streak — keep it going!' : 'Ready for today’s lesson?'}` : 'I’m Lupulus. Let’s get you ready!'}</h2><p>${esc(ms.primary.title)}</p></div></div>
      <div class="page-head"><div><h1>Today</h1><p>What to study right now to move your exam score the most.</p></div>
        <div class="row" style="gap:var(--s5)"><div class="statchips" aria-label="Your stats"><span class="statchip fire" title="Day streak">${icon('flame')}${streak(st, t)}</span><span class="statchip xp" title="XP">${icon('bolt')}${st.xp}</span><span class="statchip goal" title="Today’s questions">${icon('target')}${today}/${target}</span></div><button class="btn primary lg" id="quick">${icon('play')}Quick Start</button></div></div>

      <div class="hero">
        <section class="card gold" aria-labelledby="cd-h">
          <div class="card-head"><h3 id="cd-h">Exam countdown</h3><button class="btn quiet sm" id="edit-exam">Edit time</button></div>
          ${cd.done ? '<p class="display" style="font-size:28px">The exam time has passed. Good luck with the result — vale!</p>' : `
          <div class="count" aria-live="off"><span><span class="n">${cd.d}</span> <span class="u">days</span></span><span><span class="n">${String(cd.h).padStart(2, '0')}</span> <span class="u">hrs</span></span><span><span class="n">${String(cd.m).padStart(2, '0')}</span> <span class="u">min</span></span></div>
          <p class="mb0"><strong>${plural(cd.studyDays, 'study day')}</strong> left, counting today. <span class="muted">Exam: ${esc(exStr)} (${esc(tz)}).</span></p>`}
        </section>
        <section class="card" aria-labelledby="rd-h">
          <div class="card-head"><h3 id="rd-h">Estimated exam readiness</h3><span class="badge">${rd.score == null ? 'no data yet' : 'confidence: ' + rd.confidence}</span></div>
          <div class="row" style="flex-wrap:nowrap;align-items:center;gap:var(--s4)">${ring(rd.score)}
            <div class="col grow" style="gap:6px">${rd.score == null
              ? '<p class="mb0"><strong>Not enough data yet.</strong> Answer at least 6 questions in a category (vocabulary, grammar or translation) and an estimate appears. Nothing is assumed in advance.</p>'
              : Object.entries(rd.comps).map(([k, v]) => `<div class="meter"><div class="top"><span>${COMP_LABEL[k]}</span><span class="muted">${pct(v.acc)} · ${v.n}</span></div><div class="bar"><i style="width:${v.acc * 100}%"></i></div></div>`).join('')}</div></div>
          <p class="tiny muted mt2 mb0">An <strong>estimate</strong> from your own results (recent answers count more) — not a prediction of your grade.${rd.score != null ? ` Based on ${rd.n} answers across ${rd.chaptersAssessed} of 4 chapters${rd.missing.length ? '; not yet measured: ' + rd.missing.map((k) => COMP_LABEL[k].toLowerCase()).join(', ') : ''}.` : ''} <a href="#" id="how">How is this calculated?</a></p>
        </section>
      </div>

      <section class="card mt2" aria-labelledby="ms-h"><div class="mission">
        <div><div class="caps">Today’s mission${ms.primary.minutes ? ' · about ' + ms.primary.minutes + ' min' : ''}</div><h2 id="ms-h" class="mt1">${esc(ms.primary.title)}</h2><p class="mt1 mb0" style="color:var(--ink-2);max-width:60ch">${esc(ms.primary.why)}</p>
          ${ms.alts.length ? `<div class="small muted mt2">Or: ${ms.alts.map((a) => `<a href="${a.href}">${esc(a.title)}</a>`).join(' · ')}</div>` : ''}</div>
        <a class="btn primary lg" href="${ms.primary.href}">${esc(ms.primary.label || 'Start')} ${icon('arrow')}</a></div></section>

      ${(resumeMock || resumePrac) ? `<section class="card mt2 soft"><div class="row between"><div><strong>Resume previous session</strong><div class="small muted">${resumeMock ? `Mock exam (${esc(resumeMock.fmt)}) — ${Object.keys(resumeMock.answers || {}).length} of ${resumeMock.ids.length} answered` : `Practice — question ${resumePrac.idx + 1} of ${resumePrac.ids.length}`}</div></div><a class="btn" href="${resumeMock ? '#/mock/run' : '#/practice/run'}">Resume ${icon('arrow')}</a></div></section>` : ''}

      <a class="card mt2 soft" href="#/games" style="text-decoration:none;color:inherit;display:block"><div class="row between"><div><div class="caps">Take a break that still counts</div><strong class="display" style="font-size:22px">Legion Rush</strong> <span class="small muted">— fight waves of enemies with your Latin${st.game && st.game.best ? ' · high score ' + st.game.best : ''}</span></div><span class="btn sm">Play ${icon('arrow')}</span></div></a>

      <h2 class="mt4" style="margin-bottom:var(--s3)">Chapter mastery</h2>
      <div class="grid g4">${chs.map(({ c, s }) => `
        <a class="card ch-card ${s.acc == null ? 'empty' : ''}" href="#/practice?ch=${c.n}&len=10&diff=adaptive&start=1" style="text-decoration:none;color:inherit" aria-label="Chapter ${c.n}">
          <div class="row" style="flex-wrap:nowrap"><span class="ch-ico c${c.n}">${['I', 'II', 'III', 'IV'][c.n - 1]}</span><div><div class="num caps">Chapter ${c.n}</div><div style="font-weight:800;line-height:1.2">${esc(c.title)}</div></div></div>
          <div class="pct">${s.acc == null ? '—' : pct(s.acc)}</div>
          <div class="meter"><div class="top"><span class="muted">Completion</span><span>${pct(s.completion)}</span></div><div class="bar"><i style="width:${s.completion * 100}%"></i></div></div>
          <div class="small">${s.weak.length ? '<span class="muted">Weak:</span> ' + s.weak.map((w) => esc(w.label)).join(', ') : '<span class="muted">' + (s.n < 5 ? 'No weak areas measured yet' : 'No weak areas flagged') + '</span>'}</div>
          <div class="small" style="color:var(--ink-2)">${esc(s.rec)}</div></a>`).join('')}</div>

      <div class="grid g3 mt3">
        <section class="card"><div class="card-head"><h3>Upcoming reviews</h3><a class="small" href="#/vocabulary/practice?mode=srs&ch=all">Review</a></div>
          <div class="row" style="gap:var(--s5)"><div class="stat"><b>${dc.due}</b><span>due now</span></div><div class="stat"><b>${dc.soon}</b><span>next 24 h</span></div><div class="stat"><b>${Math.max(0, st.settings.newPerDay - store.newToday())}</b><span>new today</span></div></div>
          <p class="small muted mt2 mb0">Spaced repetition schedules each word just before you would forget it.</p></section>
        <section class="card"><div class="card-head"><h3>Today’s target</h3><span class="small muted">${today} / ${target}</span></div>
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(today, target)}"><i style="width:${Math.min(100, today / target * 100)}%"></i></div>
          <div class="row mt2" style="gap:var(--s5)"><div class="stat"><b>${st.attempts.length}</b><span>questions answered</span></div><div class="stat"><b>${streak(st, t)}</b><span>day streak</span></div><div class="stat"><b>${st.xp}</b><span>XP</span></div></div>
          <p class="tiny muted mt2 mb0">Streak and XP are only a nudge. What counts is the accuracy of your recall.</p></section>
        <section class="card"><div class="card-head"><h3>Weakest skills</h3></div>
          ${wk.length ? `<div class="list">${wk.map((w) => `<a href="#/practice?topic=${w.topic}&len=10&diff=adaptive&start=1" style="color:inherit;text-decoration:none" class="row between"><span>${esc(w.label)}</span><span class="badge ${w.acc < 0.6 ? 'bad' : w.acc < 0.8 ? 'gold' : 'ok'}">${pct(w.acc)}</span></a>`).join('')}</div>` : '<p class="muted mb0">Shown after at least 3 answers in a topic.</p>'}
          <div class="mt2 small"><span class="muted">Most improved:</span> ${imp ? `<strong>${esc(imp.label)}</strong> (+${Math.round(imp.delta * 100)} pts)` : '<span class="muted">needs more history</span>'}</div></section>
      </div>

      <section class="card mt3"><div class="card-head"><h3>Recent mistakes</h3><a class="small" href="#/mistakes">Open Mistake Bank${open.length ? ` (${open.length})` : ''}</a></div>
        ${open.length ? `<div class="list">${open.slice(0, 5).map((m) => { const q = Q_BY_ID[m.qid]; return q ? `<div class="row between" style="flex-wrap:nowrap;align-items:flex-start"><span class="small" style="min-width:0">${fmt(q.type === 'translate' ? 'Translate: ' + q.sent.la : q.prompt)}</span><span class="tiny muted nowrap">${ago(m.last, t)}</span></div>` : ''; }).join('')}</div>` : `<div class="empty">${mascot('sleep', 80)}<span class="inscr">Labor omnia vincit</span><p class="mb0">No open mistakes. Mistakes you make will be collected here with the correct answer and explanation.</p></div>`}
      </section>`;

    root.querySelector('#quick').onclick = () => { location.hash = ms.primary.id === 'diag' ? ms.primary.href : '#/practice?ch=all&len=10&diff=adaptive&start=1'; };
    root.querySelector('#edit-exam').onclick = () => {
      const m = openModal(`<h3>Exam date &amp; time</h3><p class="small muted">Local time (${esc(tz)}). Change it if your professor gives you a different time.</p><div class="grid g2"><div class="field"><label>Date</label><input class="input" type="date" id="xd" value="${esc(st.settings.examDate)}"></div><div class="field"><label>Start time</label><input class="input" type="time" id="xt" value="${esc(st.settings.examTime)}"></div></div><div class="row mt3" style="justify-content:flex-end"><button class="btn" data-x>Cancel</button><button class="btn primary" data-s>Save</button></div>`);
      m.root.querySelector('[data-x]').onclick = m.close;
      m.root.querySelector('[data-s]').onclick = () => { const d = m.root.querySelector('#xd').value, tm = m.root.querySelector('#xt').value; if (d) store.setSetting('examDate', d); if (tm) store.setSetting('examTime', tm); m.close(); toast('Exam time updated'); draw(); };
    };
    const how = root.querySelector('#how'); if (how) how.onclick = (e) => { e.preventDefault(); openModal(`<h3>How the estimate works</h3><p class="small">Each component is your <strong>recency-weighted accuracy</strong> (half-life 4 days, so improvement shows quickly). A component only counts once it has ${6} answers. The components are blended using these weights, re-normalised over the ones you have data for:</p><table class="etable">${Object.entries(READINESS_WEIGHTS).map(([k, w]) => `<tr><td>${COMP_LABEL[k]}</td><td class="right">${Math.round(w * 100)}%</td></tr>`).join('')}</table><p class="small muted mt2">Confidence rises with the number of answers and the number of chapters tested. Self-rated translations count at the score you gave them. The result is a study guide, not a grade forecast.</p><div class="row mt2" style="justify-content:flex-end"><button class="btn primary" data-c>Close</button></div>`, { onClose: null }).root.querySelector('[data-c]').onclick = (ev) => ev.target.closest('.scrim').remove(); };
  };
  draw();
  const iv = setInterval(() => { if (!document.hidden && !document.querySelector('#overlay .scrim')) draw(); }, 60000);
  return () => clearInterval(iv);
}
void TOPICS;
