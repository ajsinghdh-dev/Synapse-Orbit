// Choosing questions: the adaptive practice selector and the mock-exam builder. Pure given (state, now, rand).
import { BANK, Q_BY_ID, shuffle, hash } from './questions.js';
import { TOPICS } from '../data/curriculum.js';
import { wacc, qStatus } from './analytics.js';
import { DAY } from './srs.js';

export const SECTION_FILTERS = {
  everything: null, vocabulary: ['vocabulary'], grammar: ['grammar'], translation: ['translation'], conjugation: ['conjugation'], declension: ['declension'],
};

export function eligible(cfg, state) {
  const chs = cfg.chapters === 'all' || !cfg.chapters ? [1, 2, 3, 4] : cfg.chapters;
  const secs = SECTION_FILTERS[cfg.section || 'everything'];
  const ex = state.settings.excluded;
  return BANK.filter((q) => chs.includes(q.ch) && (!secs || secs.includes(q.section)) && (!cfg.topic || q.topic === cfg.topic) && !q.vocab.some((v) => ex[v]) && (!cfg.types || cfg.types.includes(q.type)));
}

/** Weighted sampling without replacement; weights encode weakness, recency and mastery. */
export function selectPractice(cfg, state, now, rand = Math.random) {
  const pool = eligible(cfg, state);
  const topicAcc = {};
  const byTopic = {};
  for (const a of state.attempts) (byTopic[a.topic] ||= []).push(a);
  for (const [t, l] of Object.entries(byTopic)) topicAcc[t] = wacc(l, now);
  const lastAtt = {};
  for (const a of state.attempts) lastAtt[a.qid] = a;
  const open = new Set(Object.values(state.mistakes).filter((m) => m.status === 'open').map((m) => m.qid));
  const diffTarget = (t) => { const ta = topicAcc[t]; if (!ta || ta.n < 3) return 2; return ta.acc > 0.85 ? 3 : ta.acc > 0.6 ? 2 : 1; };
  const items = pool.map((q) => {
    let w = 1;
    const ta = topicAcc[q.topic];
    if (ta && ta.n >= 3) w *= ta.acc < 0.6 ? 3 : ta.acc < 0.8 ? 2 : ta.acc >= 0.92 && ta.n >= 8 ? 0.45 : 1;
    if (open.has(q.id)) w *= 4;
    const st = qStatus(state, q.id);
    if (st.n === 0) w *= 1.2;
    if (st.mastered) w *= 0.12;                       // don't keep repeating what is already mastered
    else if (st.last && now - st.last.t < 20 * 60000) w *= 0.2;
    if (cfg.diff === 'adaptive') { const d = Math.abs(q.diff - diffTarget(q.topic)); w *= d === 0 ? 1.6 : d === 1 ? 0.8 : 0.25; }
    else if (cfg.diff && cfg.diff !== 'mixed') w *= q.diff === +cfg.diff ? 1 : 0;
    return { q, w };
  }).filter((x) => x.w > 0);
  const out = []; const topicCount = {}; const vocabCount = {};
  const want = Math.min(cfg.len || 10, items.length);
  while (out.length < want && items.length) {
    const wts = items.map((x) => x.w * Math.pow(0.55, topicCount[x.q.topic] || 0) * Math.pow(0.4, (vocabCount[x.q.vocab[0]] || 0)));
    const total = wts.reduce((s, x) => s + x, 0);
    let r = rand() * total, i = 0;
    for (; i < wts.length; i++) { r -= wts[i]; if (r <= 0) break; }
    i = Math.min(i, items.length - 1);
    const [{ q }] = items.splice(i, 1);
    out.push(q); topicCount[q.topic] = (topicCount[q.topic] || 0) + 1; vocabCount[q.vocab[0]] = (vocabCount[q.vocab[0]] || 0) + 1;
  }
  return out;
}

/** A different question on the same skill, for the "try a similar one" step after a miss. */
export function similarTo(q, state, usedIds, rand = Math.random) {
  const ex = state.settings.excluded;
  const base = BANK.filter((x) => x.id !== q.id && !usedIds.has(x.id) && x.topic === q.topic && x.ch <= Math.max(q.ch, 1) && x.type === q.type && !x.vocab.some((v) => ex[v]));
  let c = base.filter((x) => x.ch === q.ch && x.vocab[0] !== q.vocab[0]);
  if (!c.length) c = base.filter((x) => x.vocab[0] !== q.vocab[0]);
  if (!c.length) c = base;
  if (!c.length) return null;
  c.sort((a, b) => Math.abs(a.diff - q.diff) - Math.abs(b.diff - q.diff));
  const best = c.filter((x) => Math.abs(x.diff - q.diff) === Math.abs(c[0].diff - q.diff));
  return best[Math.floor(rand() * best.length)];
}

// ------------------------------------------------------------------ mock exams
export const FORMATS = {
  quick: { key: 'quick', label: 'Quick Test', n: 20, mins: 15, blurb: 'Mixed recall and grammar.', weights: { vocabulary: 0.30, conjugation: 0.25, declension: 0.20, grammar: 0.25, translation: 0 } },
  standard: { key: 'standard', label: 'Standard Mock Exam', n: 35, mins: 30, blurb: 'Vocabulary, conjugation, declension and translation.', weights: { vocabulary: 0.25, conjugation: 0.20, declension: 0.20, grammar: 0.15, translation: 0.20 } },
  comprehensive: { key: 'comprehensive', label: 'Comprehensive Mock Exam', n: 50, mins: 50, blurb: 'All four chapters, increasing difficulty, answers revealed only on submission.', weights: { vocabulary: 0.20, conjugation: 0.18, declension: 0.20, grammar: 0.20, translation: 0.22 } },
};

export function apportion(weights, n) {
  const keys = Object.keys(weights); const tot = keys.reduce((s, k) => s + weights[k], 0) || 1;
  const raw = keys.map((k) => ({ k, x: weights[k] / tot * n })); const out = {};
  raw.forEach((r) => { out[r.k] = Math.floor(r.x); });
  let left = n - Object.values(out).reduce((s, x) => s + x, 0);
  raw.sort((a, b) => (b.x - Math.floor(b.x)) - (a.x - Math.floor(a.x)));
  for (const r of raw) { if (left <= 0) break; if (weights[r.k] > 0) { out[r.k]++; left--; } }
  return out;
}

export function buildMock(fmtKey, state, rand = Math.random, weights = null) {
  const f = FORMATS[fmtKey];
  const w = weights || state.settings.weights[fmtKey] || f.weights;
  const counts = apportion(w, f.n);
  const ex = state.settings.excluded;
  const used = new Set(); const lex = {};
  const chosen = [];
  for (const [sec, n] of Object.entries(counts)) {
    if (!n) continue;
    let pool = BANK.filter((q) => q.section === sec && !q.vocab.some((v) => ex[v]));
    if (sec === 'translation') pool = pool.filter((q) => q.type === 'compose' || q.type === 'translate');
    // round-robin over chapters so every chapter is covered; shuffle inside each
    const lists = [1, 2, 3, 4].map((c) => shuffle(pool.filter((q) => q.ch === c), rand));
    let taken = 0, guard = 0, ci = 0;
    // translation: alternate objective (compose) and self-assessed (translate) items
    while (taken < n && guard++ < 5000) {
      const list = lists[ci % 4]; ci++;
      if (!list.length) { if (lists.every((l) => !l.length)) break; continue; }
      let idx = 0;
      if (sec === 'translation') { const wantType = taken % 2 === 0 ? 'translate' : 'compose'; idx = list.findIndex((q) => q.type === wantType); if (idx < 0) idx = 0; }
      const q = list.splice(idx, 1)[0];
      const key = q.vocab[0] + '|' + q.topic;
      if (used.has(q.id) || (lex[q.vocab[0]] || 0) >= 2 || used.has(key)) continue;
      used.add(q.id); used.add(key); lex[q.vocab[0]] = (lex[q.vocab[0]] || 0) + 1;
      chosen.push(q); taken++;
    }
  }
  let items = shuffle(chosen, rand);
  if (fmtKey === 'comprehensive') items = items.map((q) => ({ q, r: rand() })).sort((a, b) => a.q.diff - b.q.diff || a.q.est - b.q.est || a.r - b.r).map((x) => x.q);
  return { fmt: fmtKey, items: items.map((q) => q.id), mins: f.mins };
}

export function topicLabel(t) { return TOPICS[t]?.label || t; }
void Q_BY_ID; void hash; void DAY;
