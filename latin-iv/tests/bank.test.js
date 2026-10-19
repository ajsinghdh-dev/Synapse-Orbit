import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BANK, Q_BY_ID, bankStats } from '../js/core/questions.js';
import { BY_ID } from '../js/data/lexicon.js';
import { RULES, TOPICS } from '../js/data/curriculum.js';
import { canon, strip } from '../js/core/latin.js';
import { gradeQuestion } from '../js/core/grade.js';
import { analyzer } from '../js/core/corpus.js';

const REQUIRED = ['id', 'ch', 'topic', 'section', 'diff', 'est', 'type', 'prompt', 'explanation', 'rule', 'vocab', 'source', 'origin'];

test('question bank size and distribution', () => {
  const s = bankStats();
  console.log('BANK', JSON.stringify(s));
  assert.ok(s.total >= 240, 'at least 240 questions');
  const nonGenerated = BANK.filter((q) => q.origin !== 'generated').length;
  assert.ok(nonGenerated >= 240, `at least 240 hand-authored or hand-annotated questions (have ${nonGenerated})`);
  for (const n of [1, 2, 3, 4]) {
    assert.ok(BANK.filter((q) => q.ch === n && q.origin !== 'generated').length >= 25, 'non-generated items in chapter ' + n);
    for (const sec of ['vocabulary', 'grammar', 'translation']) assert.ok(BANK.some((q) => q.ch === n && q.section === sec), `ch ${n} ${sec}`);
  }
  for (const sec of ['conjugation', 'declension']) assert.ok(BANK.some((q) => q.section === sec));
  for (const t of Object.keys(TOPICS)) assert.ok(BANK.some((q) => q.topic === t), 'topic with no questions: ' + t);
});

test('every question has the full structured schema', () => {
  for (const q of BANK) {
    for (const k of REQUIRED) assert.ok(q[k] !== undefined && q[k] !== null && q[k] !== '', `${q.id} missing ${k}`);
    assert.ok([1, 2, 3].includes(q.diff) && q.est > 0 && q.est < 1, q.id);
    assert.ok(RULES[q.rule], `${q.id} unknown rule ${q.rule}`);
    assert.ok(TOPICS[q.topic], `${q.id} unknown topic ${q.topic}`);
    assert.ok(['mcq', 'typed', 'compose', 'translate'].includes(q.type), q.id);
    for (const v of q.vocab) assert.ok(BY_ID[v], `${q.id} unknown vocab ${v}`);
  }
});

test('ids are unique and prompts are not duplicated', () => {
  const ids = new Set(); const prompts = new Map();
  for (const q of BANK) {
    assert.ok(!ids.has(q.id), 'duplicate id ' + q.id); ids.add(q.id);
    const key = q.type + '|' + canon(q.prompt) + (q.type === 'mcq' ? '|' + q.options.map(canon).sort().join('~') : '');
    assert.ok(!prompts.has(key), `duplicate question: ${q.id} ≈ ${prompts.get(key)}`); prompts.set(key, q.id);
  }
});

test('multiple choice: exactly one correct, unique options', () => {
  for (const q of BANK.filter((x) => x.type === 'mcq')) {
    assert.ok(q.options.length >= 2 && q.options.length <= 4, q.id);
    assert.equal(q.options.filter((o) => o === q.answer).length, 1, `${q.id}: answer must appear exactly once`);
    const keys = q.options.map((o) => strip(canon(o)));
    assert.equal(new Set(keys).size, keys.length, `${q.id}: duplicate options ${q.options}`);
  }
});

test('typed questions: answer keys are non-empty and self-consistent', () => {
  for (const q of BANK.filter((x) => x.type === 'typed')) {
    assert.ok(q.accept?.length && q.accept.every((a) => a && a.length), q.id);
    for (const a of q.accept) assert.ok(gradeQuestion(q, a).correct, `${q.id}: its own answer “${a}” is marked wrong`);
    assert.equal(gradeQuestion(q, '').correct, false);
  }
});

test('no question draws on a later chapter than it is labelled with', () => {
  const tokensOf = (txt) => String(txt).replace(/[.,;:!?“”"()]/g, ' ').split(/\s+/).filter(Boolean);
  const braceLatin = (txt) => [...String(txt).matchAll(/\{([^}]*)\}/g)].flatMap((m) => tokensOf(m[1]));
  for (const q of BANK) {
    for (const v of q.vocab) assert.ok(BY_ID[v].ch <= q.ch, `${q.id} (Ch ${q.ch}) uses ${v} from Ch ${BY_ID[v].ch}`);
    const latin = [...braceLatin(q.prompt), ...(q.accept || []).flatMap(tokensOf)];
    if (q.topic === 'ec') latin.push(...q.options.flatMap(tokensOf));
    for (const t of latin) {
      if (/^-/.test(t) || t.endsWith('-')) continue;               // endings / stems are not words
      const an = analyzer.analyze(t.toLowerCase());
      if (!an.length) continue;                                      // deliberately wrong distractor forms are allowed
      assert.ok(an.some((a) => a.ch <= q.ch), `${q.id} (Ch ${q.ch}): “${t}” only exists from Ch ${Math.min(...an.map((a) => a.ch))}`);
    }
    if (q.topic === 'ec') {                                           // the correct answer must be fully recognisable Latin
      for (const t of tokensOf(q.answer)) assert.ok(analyzer.analyze(t.toLowerCase()).length, `${q.id}: correct answer token “${t}” unknown`);
    }
  }
  for (const q of BANK.filter((x) => x.topic === 'decl2n' || x.topic === 'sum')) assert.equal(q.ch, 4, q.id);
  for (const q of BANK.filter((x) => x.topic === 'decl2m' || x.topic === 'er-nouns')) assert.ok(q.ch >= 3, q.id);
});

test('translation and composition items reference real sentences', () => {
  const tr = BANK.filter((q) => q.type === 'translate'), cp = BANK.filter((q) => q.type === 'compose');
  assert.ok(tr.length >= 60 && cp.length >= 25, `${tr.length} translate / ${cp.length} compose`);
  assert.ok(Q_BY_ID[tr[0].id]);
});

test('generated declension keys agree with the hand-typed gold tables', async () => {
  const { GOLD_NOUNS } = await import('./gold.js');
  const { CASES } = await import('../js/core/latin.js');
  for (const [id, g] of Object.entries(GOLD_NOUNS)) {
    for (const n of ['sg', 'pl']) CASES.forEach((c, i) => {
      const q = Q_BY_ID[`df:${id}:${c}.${n}`];
      if (!q) { assert.ok(c === 'voc', `${id} ${c}.${n} missing`); return; }
      assert.ok(q.accept.includes(g[n][i]), `${q.id}: expected ${g[n][i]}, key ${q.accept}`);
    });
  }
  for (const [id, g] of Object.entries((await import('./gold.js')).GOLD_VERBS)) {
    g.ind.forEach((f, i) => assert.deepEqual(Q_BY_ID[`cf:${id}:${i}`]?.accept ?? Q_BY_ID[`cf:sum:${i}`].accept, [f]));
  }
});
