import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLine, parseBlock } from '../js/core/customwords.js';
import { declineNoun, conjugate, declineAdj } from '../js/core/latin.js';

const ok = (l, ch) => { const r = parseLine(l, ch); assert.ok(r.ok, l + ' → ' + r.errors.join('; ')); return r.lex; };
const bad = (l) => { const r = parseLine(l, 1); assert.equal(r.ok, false, l + ' should be rejected'); return r; };

test('verbs: full and abbreviated entries', () => {
  const v = ok('amō, amāre, amāvī, amātus ; love, like ; 1');
  assert.equal(v.conj, 1); assert.deepEqual(conjugate(v).ind, ['amō', 'amās', 'amat', 'amāmus', 'amātis', 'amant']);
  const m = ok('moneō, -ēre, -uī, -itus ; warn');
  assert.deepEqual(m.pp, ['moneō', 'monēre', 'monuī', 'monitus']); assert.equal(m.conj, 2);
  const fix = parseLine('laudo, laudare, laudavi, laudatus ; praise', 1);
  assert.ok(fix.warnings.some((w) => /macron/.test(w)) || fix.ok === false);
  bad('regō, regere, rēxī, rēctus ; rule');     // 3rd conjugation: out of scope
  bad('amō, monēre, amāvī ; x');                 // mismatched pair
});
test('nouns: type detection, gender checks, engine consistency', () => {
  assert.equal(ok('puella, puellae, f. ; girl ; 2').type, 'a');
  assert.equal(ok('agricola, -ae, m. ; farmer ; 2').gender, 'm');
  assert.equal(ok('dominus, dominī, m. ; master ; 3').type, 'us');
  const f = ok('fīlius, fīlī, m. ; son ; 3'); assert.equal(f.type, 'ius'); assert.deepEqual(declineNoun(f).sg.voc, ['fīlī']);
  const a = ok('ager, agrī, m. ; field ; 3'); assert.equal(a.stem, 'agr'); assert.equal(declineNoun(a).pl.acc[0], 'agrōs');
  assert.equal(ok('puer, puerī, m. ; boy ; 3').stem, 'puer');
  assert.equal(ok('magister, magistrī, m. ; teacher ; 3').type, 'er');
  const n = ok('bellum, bellī, n. ; war ; 4'); assert.equal(declineNoun(n).pl.nom[0], 'bella');
  assert.equal(ok('praemium, praemiī, n. ; reward ; 4').type, 'ium');
  bad('bellum, bellī, m. ; war ; 4');            // neuter must be n.
  bad('rēx, rēgis, m. ; king ; 3');              // 3rd declension: out of scope
  bad('ager, -grī, m. ; field ; 3');             // stem changes need the full genitive
  bad('puella, puellī, f. ; girl ; 2');          // genitive does not fit
  assert.equal(parseLine('bellum, bellī, n. ; war ; 1', 1).lex.ch, 4, 'chapter raised to when the declension appears');
});
test('adjectives', () => {
  assert.deepEqual(declineAdj(ok('bonus, -a, -um ; good ; 2')).f.sg.nom, ['bona']);
  assert.equal(ok('pulcher, pulchra, pulchrum ; beautiful ; 3').adjType, 'er1');
  assert.equal(ok('miser, misera, miserum ; wretched ; 3').adjType, 'er0');
  bad('bonus, bona, bonem ; good');
  bad('pulcher, -chra, -chrum ; beautiful');
});
test('function words and block parsing', () => {
  const p = ok('in ; in, on, into ; 2 ; prep+abl/acc'); assert.equal(p.governs, 'abl/acc');
  ok('et ; and ; 1 ; conj'); ok('nōn ; not ; 1 ; adv');
  bad('ad ; to ; 2 ; prep');
  const r = parseBlock('# comment\namō, amāre, amāvī, amātus ; love ; 1\n\nbogus line', 1);
  assert.equal(r.length, 2); assert.equal(r[0].ok, true); assert.equal(r[1].ok, false);
  assert.equal(parseBlock('amō, amāre, amāvī, amātus ; love', 1, new Map([['amo', { ch: 1 }]]))[0].warnings.length, 1, 'duplicates are reported as replacements');
});
