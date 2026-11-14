// The chapter vocabulary lists, copied from the official Wheelock's Latin series site (wheelockslatin.com/chapters/…).
// Phrases (amābō tē, salvē, valē, sī quandō, grātiās agere, poenās dare, et … et) live in notes, not as entries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEXICON } from '../js/data/lexicon.js';

const OFFICIAL = {
  1: 'amo cogito debeo do erro laudo moneo salveo servo conservo terreo valeo video voco',
  2: 'fama forma fortuna ira nauta patria pecunia philosophia poena poeta porta puella rosa sententia vita antiquus magnus meus multus tuus et sed o sine',
  3: 'ager agricola amica amicus femina filia filius numerus populus puer sapientia vir avarus pauci romanus de in hodie semper habeo satio',
  4: 'basium bellum consilium cura donum exitium magister magistra mora oculus officium otium periculum remedium stultus bellus bonus humanus malus parvus stultus_adj verus iuvo adiuvo sum nihil',
  5: 'adulescentia animus animi caelum culpa gloria verbum te liber_adj noster pulcher sanus igitur ne propter cras heri quando satis tum ceno culpo remaneo maneo supero',
  6: 'dea deus discipula discipulus insidiae liber tyrannus vitium graecus graecus_adj perpetuus plenus salvus secundus vester que ibi ubi nunc quare possum tolero',
  7: 'amor carmen civitas corpus homo labor littera litterae mos mores nomen pax regina rex tempus terra uxor virgo virtus novus post sub audeo neco',
  8: 'copia copiae frater laus libertas ratio scriptor soror victoria dum ad ex numquam tamen ago demonstro disco doceo duco gero scribo traho vinco cicero',
};

test('every chapter vocabulary list equals the official Wheelock list, word for word', () => {
  for (const [ch, ids] of Object.entries(OFFICIAL)) {
    const want = new Set(ids.split(' ')); const have = new Set(LEXICON.filter((w) => w.ch === +ch).map((w) => w.id));
    assert.deepEqual([...want].filter((x) => !have.has(x)), [], `Chapter ${ch}: missing from the app`);
    assert.deepEqual([...have].filter((x) => !want.has(x)), [], `Chapter ${ch}: in the app but not on the official list`);
  }
  assert.equal(LEXICON.length, Object.values(OFFICIAL).reduce((n, s) => n + s.split(' ').length, 0));
});
