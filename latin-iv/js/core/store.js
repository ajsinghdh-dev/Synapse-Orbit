// Persistent state. localStorage-backed (wrapped in try/catch), with an in-memory fallback so the app
// still works in private windows. Export/import gives the learner a portable backup.
import { schedule, newCard, examCapDays, gradeFromOutcome } from './srs.js';
import { classifyError } from './analytics.js';

const KEY = 'latin-iv:v1';
export const DEFAULTS = () => ({
  v: 1,
  settings: {
    theme: 'auto', examDate: '2026-10-19', examTime: '09:00', dailyTarget: 40, macronMode: 'lenient',
    hintsInPractice: true, accommodationHints: false, timerVisible: true, newPerDay: 12,
    weights: { quick: null, standard: null, comprehensive: null }, excluded: {}, chOverride: {},
  },
  attempts: [], srs: {}, mistakes: {}, sessions: [], mocks: [], inprogress: { mock: null }, xp: 0, savedAt: 0, customWords: [], plan: { done: {} }, newToday: { day: '', ids: [] },
});

export function createStore(storage, now = () => Date.now()) {
  let state = DEFAULTS();
  const mem = {};
  const store = storage || { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  let persistent = !!storage;
  try {
    const raw = store.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); state = { ...DEFAULTS(), ...p, settings: { ...DEFAULTS().settings, ...(p.settings || {}) }, inprogress: { mock: null, ...(p.inprogress || {}) }, plan: { done: {}, ...(p.plan || {}) } }; }
  } catch { persistent = false; }
  let timer = null;
  const listeners = new Set();
  const persist = () => { try { state.savedAt = Date.now(); store.setItem(KEY, JSON.stringify(state)); persistent = true; } catch { persistent = false; } };
  const save = (immediate = false) => { listeners.forEach((f) => f()); if (immediate) { persist(); return; } clearTimeout(timer); timer = setTimeout(persist, 250); };
  const api = {
    get state() { return state; },
    get persistent() { return persistent; },
    now,
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
    save, flush() { clearTimeout(timer); persist(); },
    setSetting(k, v) { state.settings[k] = v; save(true); },
    examTs() { const [h, m] = (state.settings.examTime || '09:00').split(':').map(Number); const [y, mo, d] = state.settings.examDate.split('-').map(Number); return new Date(y, mo - 1, d, h, m, 0).getTime(); },
    isExcluded: (id) => !!state.settings.excluded[id],
    setExcluded(id, on) { if (on) state.settings.excluded[id] = true; else delete state.settings.excluded[id]; save(true); },

    /** Log an answer. `q` is a bank question (or a pseudo-question for vocab modes). */
    recordAttempt({ q, res, ans, ms = null, mode, sid = null, mixed = false }) {
      const t = now();
      const score = res.score == null ? 0 : res.score;
      const att = { t, qid: q.id, ch: q.ch, topic: q.topic, section: q.section, type: q.type, score, ok: score >= 0.99, ans: typeof ans === 'string' ? ans.slice(0, 300) : '', ms, mode, sid, mixed };
      if (res.macronOnly) att.macronOnly = true;
      if (res.close) att.close = true;
      const kind = score < 0.5 ? classifyError(state, att) : null;
      state.attempts.push(att);
      state.xp += score >= 0.99 ? 10 : score > 0 ? 4 : 1;
      if (score < 0.5) {
        const m = state.mistakes[q.id] || { qid: q.id, first: t, count: 0, streakOk: 0, answers: [] };
        m.count += 1; m.last = t; m.status = 'open'; m.streakOk = 0; m.kind = kind;
        m.answers = [...m.answers, { t, ans: att.ans }].slice(-5);
        state.mistakes[q.id] = m;
      } else if (state.mistakes[q.id] && score >= 0.99) {
        const m = state.mistakes[q.id]; m.streakOk += 1; m.lastOk = t;
        if (m.streakOk >= 2) { m.status = 'resolved'; m.resolvedAt = t; state.xp += 5; }
      }
      save();
      return att;
    },

    /** Spaced-repetition review of one vocabulary word. */
    reviewWord(id, grade, { force = true } = {}) {
      const t = now();
      const card = state.srs[id];
      // outside the SRS queue, correct answers on cards that are not yet due do not stretch the interval
      if (!force && card && card.due > t && grade >= 3) { card.last = t; save(); return card; }
      state.srs[id] = schedule(card, grade, t, { examCapDays: examCapDays(t, api.examTs()) });
      if (!card) { const day = new Date(t).toDateString(); if (state.newToday.day !== day) state.newToday = { day, ids: [] }; state.newToday.ids.push(id); }
      save();
      return state.srs[id];
    },
    newToday() { const day = new Date(now()).toDateString(); return state.newToday.day === day ? state.newToday.ids.length : 0; },

    startSession(mode, meta = {}) { const s = { id: 's' + now().toString(36) + Math.random().toString(36).slice(2, 5), t0: now(), mode, ...meta, n: 0, correct: 0 }; state.sessions.push(s); if (state.sessions.length > 300) state.sessions.shift(); save(); return s; },
    endSession(s, patch = {}) { Object.assign(s, { t1: now() }, patch); save(true); },
    saveMock(m) { state.mocks.push(m); state.inprogress.mock = null; save(true); },
    export() { return JSON.stringify({ app: 'LATIN IV', exported: new Date(now()).toISOString(), state }, null, 1); },
    import(text) { const p = JSON.parse(text); if (!p || !p.state || p.state.v !== 1 || !Array.isArray(p.state.attempts)) throw new Error('Not a LATIN IV backup file.'); state = { ...DEFAULTS(), ...p.state, settings: { ...DEFAULTS().settings, ...p.state.settings } }; save(true); },
    reset() { state = DEFAULTS(); save(true); },
  };
  return api;
}
void newCard; void gradeFromOutcome;
