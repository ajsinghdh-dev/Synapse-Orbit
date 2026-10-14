import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, DEFAULTS } from '../js/core/store.js';
import { readiness, weakest, streak, classifyError, mission, chapterStats } from '../js/core/analytics.js';
import { selectPractice, buildMock, FORMATS, apportion, similarTo } from '../js/core/selector.js';
import { Q_BY_ID, BANK, rng } from '../js/core/questions.js';
import { DAY } from '../js/core/srs.js';

const NOW = new Date(2026, 9, 14, 12, 0).getTime();
const clock = (t0 = NOW) => { let t = t0; const f = () => t; f.adv = (ms) => { t += ms; }; return f; };

test('readiness is null (not invented) with no data, and needs enough attempts', () => {
  const s = createStore(null, () => NOW);
  assert.equal(readiness(s.state, NOW).score, null);
  const q = BANK.find((x) => x.section === 'vocabulary');
  for (let i = 0; i < 3; i++) s.recordAttempt({ q, res: { score: 1 }, ans: 'x', mode: 'practice' });
  assert.equal(readiness(s.state, NOW).score, null, 'fewer than 6 attempts → still unknown');
});

test('readiness reflects performance and labels confidence', () => {
  const c = clock(); const s = createStore(null, c);
  const vq = BANK.filter((x) => x.section === 'vocabulary').slice(0, 12);
  vq.forEach((q, i) => { s.recordAttempt({ q, res: { score: i % 4 === 0 ? 0 : 1 }, ans: 'x', mode: 'practice' }); c.adv(1000); });
  const r = readiness(s.state, c());
  assert.ok(r.score > 0.6 && r.score < 0.9, String(r.score));
  assert.equal(r.confidence, 'very low');
  assert.ok(r.missing.includes('mock'));
});

test('mistakes are recorded with the answer and resolve after two correct re-attempts', () => {
  const c = clock(); const s = createStore(null, c);
  const q = Q_BY_ID['cf:amo:3'];
  s.recordAttempt({ q, res: { score: 0 }, ans: 'amamus', mode: 'practice' });
  const m = s.state.mistakes[q.id];
  assert.equal(m.status, 'open'); assert.equal(m.answers[0].ans, 'amamus');
  s.recordAttempt({ q, res: { score: 1 }, ans: 'amāmus', mode: 'practice' });
  assert.equal(m.status, 'open');
  s.recordAttempt({ q, res: { score: 1 }, ans: 'amāmus', mode: 'practice' });
  assert.equal(m.status, 'resolved');
  s.recordAttempt({ q, res: { score: 0 }, ans: '', mode: 'practice' });
  assert.equal(m.status, 'open', 'a new miss reopens it');
});

test('error classification uses history: slip vs repeated misunderstanding', () => {
  const c = clock(); const s = createStore(null, c);
  const qs = BANK.filter((x) => x.topic === 'verb-forms').slice(0, 9);
  qs.slice(0, 6).forEach((q) => { s.recordAttempt({ q, res: { score: 1 }, ans: 'ok', mode: 'practice' }); c.adv(1000); });
  s.recordAttempt({ q: qs[6], res: { score: 0 }, ans: 'x', mode: 'practice' });
  assert.equal(s.state.mistakes[qs[6].id].kind, 'slip', 'one miss amid a strong run');
  const c2 = clock(); const s2 = createStore(null, c2);
  const ws = BANK.filter((x) => x.topic === 'decl1').slice(0, 8);
  ws.slice(0, 5).forEach((q) => { s2.recordAttempt({ q, res: { score: 0 }, ans: 'x', mode: 'practice' }); c2.adv(1000); });
  assert.equal(s2.state.mistakes[ws[4].id].kind, 'gap', 'many recent misses in the topic');
  s2.recordAttempt({ q: ws[4], res: { score: 0 }, ans: 'x', mode: 'practice' });
  assert.equal(s2.state.mistakes[ws[4].id].kind, 'gap', 'same item missed again');
  void classifyError;
});

test('adaptive selection favours weak topics and avoids mastered questions', () => {
  const c = clock(); const s = createStore(null, c);
  const weak = BANK.filter((x) => x.topic === 'decl1' && x.type === 'typed').slice(0, 10);
  const strong = BANK.filter((x) => x.topic === 'verb-forms' && x.ch === 1 && x.type === 'typed').slice(0, 10);
  weak.forEach((q) => { s.recordAttempt({ q, res: { score: 0 }, ans: 'x', mode: 'practice' }); c.adv(1000); });
  strong.forEach((q) => { s.recordAttempt({ q, res: { score: 1 }, ans: 'x', mode: 'practice' }); s.recordAttempt({ q, res: { score: 1 }, ans: 'x', mode: 'practice' }); c.adv(1000); });
  const rand = rng(7); let w = 0, st = 0, repeated = 0;
  for (let k = 0; k < 40; k++) {
    const sel = selectPractice({ chapters: [1, 2], section: 'everything', diff: 'adaptive', len: 10 }, s.state, c() + DAY, rand);
    sel.forEach((q) => { if (q.topic === 'decl1') w++; if (q.topic === 'verb-forms') st++; if (strong.some((x) => x.id === q.id)) repeated++; });
  }
  assert.ok(w > st, `weak topic should be sampled more (decl1 ${w} vs verb-forms ${st})`);
  assert.ok(repeated < 40 * 10 * 0.05, `mastered questions rarely repeat (${repeated})`);
});

test('selection respects chapter, section, difficulty and excluded vocabulary', () => {
  const s = createStore(null, () => NOW);
  s.setExcluded('amo', true);
  const sel = selectPractice({ chapters: [1], section: 'vocabulary', diff: '1', len: 40 }, s.state, NOW, rng(3));
  assert.ok(sel.length > 10);
  for (const q of sel) { assert.equal(q.ch, 1); assert.equal(q.section, 'vocabulary'); assert.equal(q.diff, 1); assert.ok(!q.vocab.includes('amo')); }
  assert.equal(new Set(sel.map((q) => q.id)).size, sel.length, 'no repeats in a set');
  const sim = similarTo(sel[0], s.state, new Set([sel[0].id]), rng(1));
  assert.ok(sim && sim.topic === sel[0].topic && sim.id !== sel[0].id);
});

test('mock exams: size, section weights, chapter coverage, no duplicate skills', () => {
  const s = createStore(null, () => NOW);
  for (const fmt of Object.keys(FORMATS)) {
    const m = buildMock(fmt, s.state, rng(11));
    assert.equal(m.items.length, FORMATS[fmt].n, fmt);
    assert.equal(new Set(m.items).size, m.items.length);
    const qs = m.items.map((id) => Q_BY_ID[id]);
    const chs = new Set(qs.map((q) => q.ch));
    if (fmt !== 'quick') assert.equal(chs.size, 4, fmt + ' covers all four chapters');
    const counts = apportion(FORMATS[fmt].weights, FORMATS[fmt].n);
    for (const [sec, n] of Object.entries(counts)) assert.equal(qs.filter((q) => q.section === sec).length, n, `${fmt} ${sec}`);
  }
  const comp = buildMock('comprehensive', s.state, rng(5)).items.map((id) => Q_BY_ID[id]);
  for (let i = 1; i < comp.length; i++) assert.ok(comp[i].diff >= comp[i - 1].diff, 'comprehensive exam increases in difficulty');
  const custom = buildMock('standard', s.state, rng(2), { vocabulary: 1, conjugation: 0, declension: 0, grammar: 0, translation: 0 }).items.map((id) => Q_BY_ID[id]);
  assert.ok(custom.length > 0 && custom.every((q) => q.section === 'vocabulary'), 'custom weightings are honoured');
});

test('streak and mission', () => {
  const c = clock(); const s = createStore(null, c);
  const m0 = mission(s.state, c(), { activeIds: ['amo', 'laudo'], examTs: new Date(2026, 9, 19, 9).getTime() });
  assert.match(m0.primary.title, /diagnostic/i);
  const qs = BANK.filter((x) => x.ch === 1).slice(0, 12);
  qs.forEach((q) => { s.recordAttempt({ q, res: { score: 1 }, ans: 'x', mode: 'practice' }); });
  assert.equal(streak(s.state, c()), 1);
  const wrong = BANK.filter((x) => x.topic === 'decl1').slice(0, 6);
  wrong.forEach((q) => s.recordAttempt({ q, res: { score: 0 }, ans: 'x', mode: 'practice' }));
  const m1 = mission(s.state, c(), { activeIds: ['amo'], examTs: new Date(2026, 9, 19, 9).getTime() });
  assert.ok(/mistakes|Drill/i.test(m1.primary.title), m1.primary.title);
  const cs = chapterStats(s.state, c(), 2, new Set());
  assert.ok(cs.acc === 0 && cs.weak.length === 1);
  void DEFAULTS;
});

test('store exports and re-imports losslessly', () => {
  const s = createStore(null, () => NOW);
  s.recordAttempt({ q: Q_BY_ID['cf:amo:0'], res: { score: 1 }, ans: 'amō', mode: 'practice' });
  const text = s.export();
  const s2 = createStore(null, () => NOW);
  s2.import(text);
  assert.equal(s2.state.attempts.length, 1);
  assert.throws(() => s2.import('{"nope":1}'));
});
