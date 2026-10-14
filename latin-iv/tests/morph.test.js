import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEXICON, BY_ID } from '../js/data/lexicon.js';
import { conjugate, declineNoun, declineAdj, CASES, NUMS, strip, buildAnalyzer } from '../js/core/latin.js';
import { GOLD_VERBS, GOLD_NOUNS, GOLD_ADJ } from './gold.js';

test('verb paradigms match hand-typed gold tables', () => {
  for (const [id, g] of Object.entries(GOLD_VERBS)) {
    const p = conjugate(BY_ID[id]);
    assert.deepEqual(p.ind, g.ind, id + ' indicative');
    assert.equal(p.inf, g.inf, id + ' infinitive');
    if (g.impSg) { assert.equal(p.impSg, g.impSg, id + ' imp sg'); assert.equal(p.impPl, g.impPl, id + ' imp pl'); }
  }
});

test('noun paradigms match hand-typed gold tables (primary form of every cell)', () => {
  for (const [id, g] of Object.entries(GOLD_NOUNS)) {
    const d = declineNoun(BY_ID[id]);
    for (const n of NUMS) CASES.forEach((c, i) => assert.equal(d[n][c][0], g[n][i], `${id} ${c} ${n}`));
  }
});

test('adjective paradigms match hand-typed gold tables', () => {
  for (const [id, g] of Object.entries(GOLD_ADJ)) {
    const d = declineAdj(BY_ID[id]);
    for (const gen of ['m', 'f', 'n']) for (const n of NUMS) CASES.forEach((c, i) => assert.equal(d[gen][n][c][0], g[gen][n][i], `${id} ${gen} ${c} ${n}`));
  }
});

test('lexicon entries are well-formed', () => {
  const ids = new Set();
  for (const w of LEXICON) {
    assert.ok(!ids.has(w.id), 'duplicate id ' + w.id); ids.add(w.id);
    assert.ok(w.la && w.en?.length && [1, 2, 3, 4].includes(w.ch), w.id);
    assert.ok(['core', 'check'].includes(w.conf), w.id + ' conf');
    if (w.pos === 'verb') {
      assert.equal(w.pp[0], w.la);
      if (w.irreg !== 'sum') {
        assert.ok(w.pp[1].endsWith(w.irreg === 'do' ? 'are' : w.conj === 1 ? 'āre' : 'ēre'), w.id + ' infinitive vs conjugation');
        if (w.irreg !== 'do') assert.equal(strip(w.pp[1]).slice(0, -3) + (w.conj === 1 ? 'o' : 'eo'), strip(w.la), w.id + ' stem vs 1st pp');
      }
    }
    if (w.pos === 'noun') {
      assert.ok(declineNoun(w).sg.gen.includes(w.gen), `${w.id}: stored genitive ${w.gen} must be produced by the engine`);
      assert.ok(['m', 'f', 'n', 'mf'].includes(w.gender));
      if (w.type === 'um' || w.type === 'ium') assert.equal(w.gender, 'n');
      if (w.type === 'a') assert.ok(w.gender !== 'n');
    }
  }
});

test('chapter assignment matches grammar introduced in that chapter', () => {
  for (const w of LEXICON) {
    if (w.pos === 'noun' && w.type === 'a') assert.equal(w.ch, 2, w.id);
    if (w.pos === 'noun' && ['us', 'ius', 'er'].includes(w.type)) assert.equal(w.ch, 3, w.id);
    if (w.pos === 'noun' && ['um', 'ium'].includes(w.type)) assert.equal(w.ch, 4, w.id);
    if (w.pos === 'verb' && w.irreg !== 'sum') assert.equal(w.ch, 1, w.id);
  }
});

test('analyzer recognises syncretism honestly', () => {
  const an = buildAnalyzer(LEXICON);
  const cn = (t) => new Set(an.analyze(t).map((a) => a.case + '.' + a.number));
  assert.deepEqual([...cn('puellae')].sort(), ['dat.sg', 'gen.sg', 'nom.pl', 'voc.pl']);
  assert.ok(cn('puellā').has('abl.sg') && cn('puellā').size === 1);
  assert.ok(cn('bellum').has('nom.sg') && cn('bellum').has('acc.sg') && cn('bellum').has('voc.sg'));
  assert.ok(cn('bella').has('nom.pl') && cn('bella').has('acc.pl'));
  assert.ok(!cn('bella').has('abl.sg'));
  assert.ok(an.analyzeLoose('puella').length > an.analyze('puella').length, 'macronless puella is ambiguous');
});
