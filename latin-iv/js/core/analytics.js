// Analytics from the attempt log. Pure functions of (state, now). Never invents data: with no
// attempts every score is null.
import { TOPICS } from '../data/curriculum.js';
import { LEXICON } from '../data/lexicon.js';
import { DAY } from './srs.js';

export const HALF_LIFE_DAYS = 4;       // recent performance counts more (the exam is days away)
export const MIN_N = 6;                // minimum attempts for a component to be reported
const W = { vocab: 0.20, grammar: 0.25, translation: 0.20, mixed: 0.10, retention: 0.10, mock: 0.15 };
export const READINESS_WEIGHTS = W;

const rw = (t, now) => Math.pow(0.5, Math.max(0, now - t) / (HALF_LIFE_DAYS * DAY));
export function wacc(list, now) {
  let s = 0, w = 0;
  for (const a of list) { const x = rw(a.t, now); s += x * a.score; w += x; }
  return { acc: w ? s / w : null, n: list.length };
}
export const localDay = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const startOfDay = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

const isGrammar = (a) => a.section === 'conjugation' || a.section === 'declension' || a.section === 'grammar';

export function mockPct(m) { return m.objective && m.objective.total ? m.objective.score / m.objective.total : null; }

export function readiness(state, now) {
  const at = state.attempts;
  const comps = {};
  const add = (key, list) => { const r = wacc(list, now); if (r.n >= MIN_N && r.acc != null) comps[key] = r; };
  add('vocab', at.filter((a) => a.section === 'vocabulary'));
  add('grammar', at.filter(isGrammar));
  add('translation', at.filter((a) => a.section === 'translation'));
  add('mixed', at.filter((a) => a.mixed));
  // retention: later attempts at questions first seen ≥ 6h earlier
  const first = new Map(); const later = [];
  for (const a of at) { if (!first.has(a.qid)) first.set(a.qid, a.t); else if (a.t - first.get(a.qid) >= 6 * 3600000) later.push(a); }
  if (later.length >= 5) comps.retention = wacc(later, now);
  const mocks = (state.mocks || []).map((m) => ({ t: m.t1, score: mockPct(m) })).filter((m) => m.score != null);
  if (mocks.length) comps.mock = { ...wacc(mocks, now), n: mocks.length };
  const keys = Object.keys(comps);
  if (!keys.length) return { score: null, comps, confidence: 'none', n: at.length, chaptersAssessed: 0 };
  const tw = keys.reduce((s, k) => s + W[k], 0);
  const score = keys.reduce((s, k) => s + W[k] * comps[k].acc, 0) / tw;
  const chaptersAssessed = [1, 2, 3, 4].filter((c) => at.filter((a) => a.ch === c).length >= 5).length;
  const n = at.length;
  const confidence = n < 25 ? 'very low' : n < 80 || chaptersAssessed < 3 ? 'low' : n < 200 ? 'moderate' : 'good';
  return { score, comps, confidence, n, chaptersAssessed, missing: Object.keys(W).filter((k) => !comps[k]) };
}

export function byTopic(state, now) {
  const m = {};
  for (const a of state.attempts) (m[a.topic] ||= []).push(a);
  return Object.entries(m).map(([topic, list]) => ({ topic, label: TOPICS[topic]?.label || topic, ...wacc(list, now), lastT: Math.max(...list.map((x) => x.t)) }));
}
export function weakest(state, now, k = 3, minN = 3) {
  return byTopic(state, now).filter((t) => t.n >= minN).sort((a, b) => a.acc - b.acc || b.n - a.n).slice(0, k);
}
export function mostImproved(state, now) {
  const cut = now - 2 * DAY;
  let best = null;
  const m = {};
  for (const a of state.attempts) (m[a.topic] ||= []).push(a);
  for (const [topic, list] of Object.entries(m)) {
    const recent = list.filter((a) => a.t >= cut), old = list.filter((a) => a.t < cut);
    if (recent.length < 3 || old.length < 3) continue;
    const d = recent.reduce((s, a) => s + a.score, 0) / recent.length - old.reduce((s, a) => s + a.score, 0) / old.length;
    if (d > 0.05 && (!best || d > best.delta)) best = { topic, label: TOPICS[topic]?.label || topic, delta: d };
  }
  return best;
}

export function chapterStats(state, now, ch, activeVocabIds) {
  const list = state.attempts.filter((a) => a.ch === ch);
  const { acc, n } = wacc(list, now);
  const topics = Object.entries(TOPICS).filter(([, t]) => t.ch.includes(ch)).map(([k]) => k);
  const per = topics.map((t) => { const l = list.filter((a) => a.topic === t); return { topic: t, label: TOPICS[t].label, ...wacc(l, now) }; });
  const practiced = per.filter((p) => p.n >= 3).length;
  const words = LEXICON.filter((w) => w.ch === ch && (!activeVocabIds || activeVocabIds.has(w.id)));
  const seen = words.filter((w) => state.srs[w.id]).length;
  const completion = (practiced / Math.max(1, topics.length) + seen / Math.max(1, words.length)) / 2;
  const weak = per.filter((p) => p.n >= 3 && p.acc < 0.75).sort((a, b) => a.acc - b.acc).slice(0, 3);
  let rec;
  if (n < 5) rec = 'Not enough data yet — do a 10-question set for this chapter.';
  else if (weak.length) rec = `Focus on ${weak[0].label.toLowerCase()} (${Math.round(weak[0].acc * 100)}%).`;
  else if (acc >= 0.9) rec = 'Strong. Keep it fresh with mixed review and the mock exams.';
  else rec = 'Solid so far. Push accuracy up with timed practice.';
  return { ch, acc: n >= 5 ? acc : null, n, completion, weak, rec, per };
}

export function streak(state, now, minPerDay = 10) {
  const counts = {};
  for (const a of state.attempts) { const d = localDay(a.t); counts[d] = (counts[d] || 0) + 1; }
  let day = startOfDay(now), s = 0;
  if ((counts[localDay(day)] || 0) < minPerDay) day -= DAY;   // today may still be in progress
  while ((counts[localDay(day)] || 0) >= minPerDay) { s++; day -= DAY; }
  return s;
}
export function todayCount(state, now) { const d0 = startOfDay(now); return state.attempts.filter((a) => a.t >= d0).length; }

export function dueCounts(state, ids, now) {
  const cards = state.srs; let due = 0, soon = 0;
  for (const id of ids) { const c = cards[id]; if (!c) continue; if (c.due <= now) due++; else if (c.due <= now + DAY) soon++; }
  return { due, soon, newCount: ids.filter((id) => !cards[id]).length };
}

export function openMistakes(state) { return Object.values(state.mistakes).filter((m) => m.status === 'open'); }

/** Is this miss likely a slip, or a gap in understanding? Uses response history, not a single guess. */
export function classifyError(state, att) {
  const sameQ = state.attempts.filter((a) => a.qid === att.qid && a.t < att.t);
  const topicRecent = state.attempts.filter((a) => a.topic === att.topic && a.t < att.t).slice(-6);
  if (att.macronOnly || att.close) return 'slip';
  const everRight = sameQ.some((a) => a.score >= 1);
  const missesBefore = sameQ.filter((a) => a.score < 0.5).length;
  if (missesBefore >= 1) return 'gap';                                   // missed this exact item before
  if (topicRecent.length >= 3 && topicRecent.filter((a) => a.score < 0.5).length / topicRecent.length >= 0.5) return 'gap';
  if (everRight || (topicRecent.length >= 3 && topicRecent.filter((a) => a.score >= 1).length / topicRecent.length >= 0.8)) return 'slip';
  return 'new';
}
export const ERR_LABEL = { slip: 'Probably a slip', gap: 'Repeated misunderstanding', new: 'First miss — watching' };

export function qStatus(state, qid) {
  const list = state.attempts.filter((a) => a.qid === qid);
  let run = 0; for (let i = list.length - 1; i >= 0 && list[i].score >= 1; i--) run++;
  return { n: list.length, run, mastered: run >= 2, last: list[list.length - 1] };
}

const PLAN_CH = { '2026-10-14': [1, 2], '2026-10-15': [2], '2026-10-16': [3], '2026-10-17': [4], '2026-10-18': [1, 2, 3, 4], '2026-10-19': [1, 2, 3, 4] };

export function mission(state, now, { activeIds, examTs }) {
  const options = [];
  const dc = dueCounts(state, activeIds, now);
  const op = openMistakes(state);
  const wk = weakest(state, now, 3);
  const dayKey = localDay(now);
  const y0 = startOfDay(now) - DAY, t0 = startOfDay(now);
  const yMistakes = op.filter((m) => m.last >= y0 && m.last < t0);
  const daysLeft = Math.ceil((examTs - now) / DAY);
  if (!state.attempts.length && !Object.keys(state.srs).length) {
    return { primary: { id: 'diag', title: 'Take the 10-question diagnostic', why: 'You have no results yet. Ten mixed questions across all four chapters will tell us where to start. Nothing here is graded or saved as a score.', minutes: 6, href: '#/practice?ch=all&len=10&diff=2&start=1', label: 'Start diagnostic' }, alts: [{ title: 'Read the Chapter 1 lessons first', href: '#/study?ch=1', minutes: 10 }] };
  }
  if (dc.due >= 6) options.push({ id: 'srs', title: `Review ${Math.min(dc.due, 20)} due vocabulary ${dc.due === 1 ? 'word' : 'words'}`, why: `${dc.due} words are due. Reviewing them on schedule is the cheapest way to keep what you know.`, minutes: Math.ceil(Math.min(dc.due, 20) * 0.4), href: '#/vocabulary/practice?mode=srs&ch=all', label: 'Start review' });
  if (yMistakes.length >= 3) options.push({ id: 'ymist', title: `Re-attempt yesterday’s ${yMistakes.length} incorrect questions`, why: 'Errors you saw yesterday are the likeliest to return on the exam.', minutes: Math.ceil(yMistakes.length * 0.6), href: '#/mistakes?filter=yesterday&start=1', label: 'Re-attempt' });
  else if (op.length >= 4) options.push({ id: 'mist', title: `Re-attempt ${Math.min(op.length, 8)} open mistakes`, why: `${op.length} questions are still unresolved. Get each one right twice to close it.`, minutes: Math.ceil(Math.min(op.length, 8) * 0.6), href: '#/mistakes?start=1', label: 'Re-attempt' });
  if (wk[0] && wk[0].acc < 0.72) options.push({ id: 'weak', title: `Drill: ${wk[0].label}`, why: `Your accuracy on this is ${Math.round(wk[0].acc * 100)}% over ${wk[0].n} answers — your weakest area.`, minutes: 8, href: `#/practice?topic=${wk[0].topic}&len=10&diff=adaptive&start=1`, label: 'Practise' });
  const planCh = PLAN_CH[dayKey] || [1, 2, 3, 4];
  for (const c of planCh) {
    const n = state.attempts.filter((a) => a.ch === c).length;
    if (n < 10) { options.push({ id: 'cover' + c, title: `Work through Chapter ${c}`, why: `Only ${n} answers recorded for Chapter ${c}. It is on today’s plan.`, minutes: 10, href: `#/practice?ch=${c}&len=10&diff=2&start=1`, label: 'Start' }); break; }
  }
  const mocksDone = (state.mocks || []).length;
  if (daysLeft <= 3 && !(state.mocks || []).some((m) => now - m.t1 < 1.5 * DAY)) options.push({ id: 'mock', title: mocksDone ? 'Take another timed mock' : 'Take a timed mock exam', why: 'Timed practice is the best test of exam readiness; do it once a day from now on.', minutes: 30, href: '#/mock?fmt=standard', label: 'Open Mock Exams' });
  options.push({ id: 'mixed', title: 'Mixed review, 15 questions', why: 'Interleaving chapters strengthens recall.', minutes: 10, href: '#/practice?ch=all&len=20&diff=adaptive&start=1', label: 'Start' });
  return { primary: options[0], alts: options.slice(1, 3).map((o) => ({ title: o.title, href: o.href, minutes: o.minutes })) };
}
