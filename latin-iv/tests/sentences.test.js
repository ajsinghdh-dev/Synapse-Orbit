import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SENTENCES, analyzer } from '../js/core/corpus.js';
import { BY_ID } from '../js/data/lexicon.js';
import { buildKeyRegexes } from '../js/core/sentences.js';

test('every annotated sentence parses without problems', () => {
  const bad = SENTENCES.filter((s) => s.problems.length);
  assert.deepEqual(bad.map((s) => s.id + ' ' + s.la + ' :: ' + s.problems.join('; ')), []);
});

test('no sentence uses vocabulary or forms from a later chapter', () => {
  for (const s of SENTENCES) {
    assert.ok(s.needsCh <= s.ch, `${s.id} (${s.la}) needs chapter ${s.needsCh} but is labelled ${s.ch}`);
    for (const t of s.toks) {
      const lex = BY_ID[t.analysis.lemma];
      assert.ok(lex.ch <= s.ch, `${s.id}: ${lex.la} is Ch ${lex.ch}`);
    }
  }
});

test('every sentence has a reference translation, keys that compile, and a unique Latin text', () => {
  const seen = new Set();
  for (const s of SENTENCES) {
    assert.ok(s.en && s.k?.length, s.id);
    buildKeyRegexes(s.k);
    assert.ok(!seen.has(s.la), 'duplicate sentence ' + s.la); seen.add(s.la);
    // the reference translation must satisfy its own rubric
    for (const k of buildKeyRegexes(s.k)) assert.ok(k.re.test(s.en) || s.alts.some((a) => k.re.test(a)), `${s.id}: reference fails its own key ${k.role}:${k.src}`);
  }
});

test('corpus is balanced across chapters', () => {
  for (const n of [1, 2, 3, 4]) assert.ok(SENTENCES.filter((s) => s.ch === n).length >= 12, 'chapter ' + n);
});

test('analyzer finds every token of every sentence', () => {
  for (const s of SENTENCES) for (const t of s.toks) assert.ok(analyzer.analyze(t.word.toLowerCase()).length > 0, t.word);
});
