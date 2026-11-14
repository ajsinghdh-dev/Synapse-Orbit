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
    assert.ok(w.la && w.en?.length && [1, 2, 3, 4, 5, 6, 7, 8].includes(w.ch), w.id);
    assert.ok(['core', 'check'].includes(w.conf), w.id + ' conf');
    if (w.pos === 'verb') {
      assert.equal(w.pp[0], w.la);
      if (w.irreg !== 'sum' && w.irreg !== 'possum') {
        assert.ok(w.pp[1].endsWith(w.irreg === 'do' ? 'are' : w.conj === 1 ? 'āre' : w.conj === 2 ? 'ēre' : 'ere'), w.id + ' infinitive vs conjugation');
        if (w.irreg !== 'do') assert.equal(strip(w.pp[1]).slice(0, -3) + (w.conj === 2 ? 'eo' : 'o'), strip(w.la), w.id + ' stem vs 1st pp');
      }
    }
    if (w.pos === 'noun') {
      assert.ok(declineNoun(w)[w.plOnly ? 'pl' : 'sg'].gen.includes(w.gen), `${w.id}: stored genitive ${w.gen} must be produced by the engine`);
      assert.ok(['m', 'f', 'n', 'mf'].includes(w.gender));
      if (w.type === 'um' || w.type === 'ium') assert.equal(w.gender, 'n');
      if (w.type === 'a') assert.ok(w.gender !== 'n');
    }
  }
});

test('chapter assignment respects when each declension is taught', () => {
  for (const w of LEXICON) {
    if (w.pos === 'noun' && w.type === 'a') assert.ok(w.ch >= 2, w.id);
    if (w.pos === 'noun' && ['us', 'ius', 'er'].includes(w.type)) assert.ok(w.ch >= 3, w.id);
    if (w.pos === 'noun' && ['um', 'ium'].includes(w.type)) assert.ok(w.ch >= 4, w.id);
  }
});

test('Wheelock-specific facts', () => {
  assert.equal(BY_ID.amo.pp[3], 'amātum', '4th principal part is the supine');
  assert.equal(BY_ID.valeo.pp[3], 'valitūrum');
  assert.deepEqual(BY_ID.sum.pp, ['sum', 'esse', 'fuī', 'futūrum']);
  assert.deepEqual(BY_ID.iuvo.pp, ['iuvō', 'iuvāre', 'iūvī', 'iūtum']);
  assert.deepEqual(declineAdj(BY_ID.meus).m.sg.voc, ['mī']);
  assert.equal(declineNoun(BY_ID.filius).sg.voc[0], 'fīlī');
  for (const id of ['porto', 'pugno', 'navigo', 'dominus', 'servus', 'oppidum', 'cum', 'a']) assert.ok(!BY_ID[id], id + ' is not Chapter 1–4 vocabulary');
  for (const id of ['cogito', 'erro', 'salveo', 'conservo', 'philosophia', 'sapientia', 'stultus', 'verus', 'sine', 'nihil']) assert.ok(BY_ID[id], id + ' is Chapter 1–4 vocabulary');
});

test('analyzer recognises syncretism honestly', () => {
  const an = buildAnalyzer(LEXICON);
  const cn = (t) => new Set(an.analyze(t).map((a) => a.case + '.' + a.number));
  assert.deepEqual([...cn('puellae')].sort(), ['dat.sg', 'gen.sg', 'nom.pl', 'voc.pl']);
  assert.ok(cn('puellā').has('abl.sg') && cn('puellā').size === 1);
  assert.ok(an.analyze('bellum').some((a) => a.lemma === 'bellus') && an.analyze('bellum').some((a) => a.lemma === 'bellum'), 'bellum is ambiguous: war / pretty');
  assert.ok(cn('bellum').has('nom.sg') && cn('bellum').has('acc.sg') && cn('bellum').has('voc.sg'));
  assert.ok(cn('bella').has('nom.pl') && cn('bella').has('acc.pl'));
  assert.ok(!cn('bella').has('abl.sg'));
  assert.ok(an.analyzeLoose('puella').length > an.analyze('puella').length, 'macronless puella is ambiguous');
});

test('Chapter 5–6 forms match hand-typed tables', async () => {
  const { tenseForms } = await import('../js/core/latin.js');
  const T = {
    amo: { impf: 'amābam amābās amābat amābāmus amābātis amābant', fut: 'amābō amābis amābit amābimus amābitis amābunt' },
    moneo: { impf: 'monēbam monēbās monēbat monēbāmus monēbātis monēbant', fut: 'monēbō monēbis monēbit monēbimus monēbitis monēbunt' },
    do: { impf: 'dabam dabās dabat dabāmus dabātis dabant', fut: 'dabō dabis dabit dabimus dabitis dabunt' },
    sum: { pres: 'sum es est sumus estis sunt', impf: 'eram erās erat erāmus erātis erant', fut: 'erō eris erit erimus eritis erunt' },
    possum: { pres: 'possum potes potest possumus potestis possunt', impf: 'poteram poterās poterat poterāmus poterātis poterant', fut: 'poterō poteris poterit poterimus poteritis poterunt' },
  };
  for (const [id, ts] of Object.entries(T)) for (const [t, s] of Object.entries(ts)) assert.deepEqual(tenseForms(BY_ID[id], t), s.split(' '), `${id} ${t}`);
  const a = (id) => declineAdj(BY_ID[id]);
  assert.deepEqual([a('liber_adj').m.sg.nom[0], a('liber_adj').f.sg.nom[0], a('liber_adj').m.sg.gen[0]], ['līber', 'lībera', 'līberī']);
  assert.deepEqual([a('noster').f.sg.nom[0], a('noster').m.pl.acc[0], a('vester').n.pl.nom[0]], ['nostra', 'nostrōs', 'vestra']);
  assert.deepEqual([a('pulcher').f.sg.abl[0], a('pulcher').m.sg.voc[0]], ['pulchrā', 'pulcher']);
  assert.deepEqual(['nom', 'gen', 'acc'].map((c) => declineNoun(BY_ID.locus).pl[c][0]), ['loca', 'locōrum', 'loca']);
  assert.deepEqual(['nom', 'gen', 'acc', 'abl'].map((c) => declineNoun(BY_ID.insidiae).pl[c][0]), ['īnsidiae', 'īnsidiārum', 'īnsidiās', 'īnsidiīs']);
  assert.equal(declineNoun(BY_ID.liber).sg.gen[0], 'librī');
  assert.deepEqual(BY_ID.possum.pp, ['possum', 'posse', 'potuī', null]);
});

test('Chapter 7–8 forms match hand-typed tables (third declension, third conjugation, deus)', () => {
  const nd = (id) => declineNoun(BY_ID[id]);
  const row = (id, num) => CASES.map((c) => nd(id)[num][c][0]);
  assert.deepEqual(row('rex', 'sg'), ['rēx', 'rēgis', 'rēgī', 'rēgem', 'rēge', 'rēx']);
  assert.deepEqual(row('rex', 'pl'), ['rēgēs', 'rēgum', 'rēgibus', 'rēgēs', 'rēgibus', 'rēgēs']);
  assert.deepEqual(row('homo', 'sg'), ['homō', 'hominis', 'hominī', 'hominem', 'homine', 'homō']);
  assert.deepEqual(row('nomen', 'sg'), ['nōmen', 'nōminis', 'nōminī', 'nōmen', 'nōmine', 'nōmen']);
  assert.deepEqual(row('nomen', 'pl'), ['nōmina', 'nōminum', 'nōminibus', 'nōmina', 'nōminibus', 'nōmina']);
  assert.deepEqual(row('corpus', 'pl'), ['corpora', 'corporum', 'corporibus', 'corpora', 'corporibus', 'corpora']);
  assert.deepEqual(row('pax', 'sg'), ['pāx', 'pācis', 'pācī', 'pācem', 'pāce', 'pāx']);
  assert.deepEqual(nd('deus').sg.nom.concat(nd('deus').sg.gen, nd('deus').sg.acc), ['deus', 'deī', 'deum']);
  assert.deepEqual(nd('deus').pl.gen, ['deōrum', 'deum']);
  const c = (id) => conjugate(BY_ID[id]);
  assert.deepEqual(c('duco').ind, ['dūcō', 'dūcis', 'dūcit', 'dūcimus', 'dūcitis', 'dūcunt']);
  assert.deepEqual(c('duco').fut, ['dūcam', 'dūcēs', 'dūcet', 'dūcēmus', 'dūcētis', 'dūcent']);
  assert.equal(c('duco').inf, 'dūcere'); assert.equal(c('duco').impSg, 'dūc'); assert.equal(c('duco').impPl, 'dūcite');
  assert.equal(c('scribo').impSg, 'scrībe'); assert.equal(c('scribo').impPl, 'scrībite');
  assert.deepEqual(c('ago').fut, ['agam', 'agēs', 'aget', 'agēmus', 'agētis', 'agent']);
  assert.equal(c('duco').impf, null, 'no 3rd-conjugation imperfect before Chapter 9');
  assert.equal(c('doceo').inf, 'docēre', 'doceō is 2nd conjugation');
  assert.deepEqual(BY_ID.audeo.pp, ['audeō', 'audēre', 'ausus sum', null]);
});

test('vocabulary lists contain exactly the official Wheelock chapter counts', () => {
  const n = (ch) => LEXICON.filter((w) => w.ch === ch).length;
  assert.deepEqual([1, 2, 3, 4].map(n), [14, 24, 21, 26]);
  for (const id of ['non', 'si', 'quid', 'saepe', 'interim', 'locus', 'morbus']) assert.ok(!LEXICON.some((w) => w.id === id), id + ' is not on a Wheelock vocabulary list (support word only)');
  for (const id of ['hodie', 'semper', 'adulescentia', 'animus', 'cenO'.toLowerCase(), 'culpo', 'deus', 'dea', 'discipulus', 'regina', 'frater', 'duco']) assert.ok(BY_ID[id], id + ' must be present');
});
