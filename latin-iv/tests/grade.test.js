import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchLatin, matchEnglish, gradeCompose } from '../js/core/grade.js';
import { COMPOSE } from '../js/core/corpus.js';

test('matchLatin: exact, macron-lenient, and macron-significant cases', () => {
  assert.ok(matchLatin('puellā', ['puellā']).ok);
  assert.ok(matchLatin('  Puellā ', ['puellā']).ok);
  // puella vs puellā are two real forms → wrong, flagged macronOnly
  const r = matchLatin('puella', ['puellā']);
  assert.equal(r.ok, false); assert.ok(r.macronOnly);
  // monetis → monētis : stripped form is unique (no other real form) → accepted leniently
  const ok = matchLatin('monetis', ['monētis']);
  assert.ok(ok.ok && ok.macronOmitted);
  assert.equal(matchLatin('monetis', ['monētis'], { strict: true }).ok, false);
  assert.equal(matchLatin('puellam', ['puellās']).ok, false);
  // alternative accepted forms (fīlī / fīliī)
  assert.ok(matchLatin('fīliī', ['fīlī', 'fīliī']).ok);
});

test('matchEnglish: glosses, articles, infinitive "to", and lists', () => {
  const g = ['love', 'like'];
  for (const a of ['love', 'to love', 'Like', 'to like', 'love, like']) assert.ok(matchEnglish(a, g).ok, a);
  assert.equal(matchEnglish('hate', g).ok, false);
  assert.ok(matchEnglish('the farmer', ['farmer']).ok);
  assert.ok(matchEnglish('inhabtant', ['inhabitant']).typo, 'one-letter typo on a long word is accepted with a note');
  assert.equal(matchEnglish('', g).ok, false);
});

test('compose grader accepts the reference answers and alternative word orders', () => {
  for (const c of COMPOSE) {
    const r = gradeCompose(c.ref, c.slots);
    assert.ok(r.correct, `${c.id} reference “${c.ref}” rejected: ${r.messages.join(' ')}`);
    for (const alt of c.alts) assert.ok(gradeCompose(alt, c.slots).correct, `${c.id} alt “${alt}”`);
  }
});

test('compose grader accepts any word order and reports the specific error otherwise', () => {
  const c = COMPOSE.find((x) => x.ref === 'Puella rēgīnam amat.');
  for (const s of ['Amat puella rēgīnam', 'rēgīnam amat puella', 'puella amat rēgīnam.']) assert.ok(gradeCompose(s, c.slots).correct, s);
  let r = gradeCompose('Puella rēgīna amat', c.slots);       // nominative object
  assert.equal(r.correct, false); assert.match(r.messages.join(' '), /accusative/);
  r = gradeCompose('Puella rēgīnam amant', c.slots);          // wrong number
  assert.equal(r.correct, false); assert.match(r.messages.join(' '), /3rd person singular/);
  r = gradeCompose('Puella rēgīnam', c.slots);
  assert.equal(r.correct, false); assert.match(r.messages.join(' '), /Missing/);
  r = gradeCompose('Rēgīna puellam amat', c.slots);           // roles reversed → wrong forms
  assert.equal(r.correct, false);
});

test('compose grader checks adjective agreement (gender, number, case)', () => {
  const c = COMPOSE.find((x) => x.ref === 'Puella bona aquam portat.');
  assert.ok(gradeCompose('Puella bona aquam portat', c.slots).correct);
  const bad = gradeCompose('Puella bonus aquam portat', c.slots);
  assert.equal(bad.correct, false); assert.match(bad.messages.join(' '), /feminine/);
  const d = COMPOSE.find((x) => x.ref === 'Dōnum bonum est.');
  assert.ok(gradeCompose('bonum dōnum est', d.slots).correct);
  assert.equal(gradeCompose('Dōnum bonus est', d.slots).correct, false);
});

test('compose grader treats missing macrons per the documented policy', () => {
  const c = COMPOSE.find((x) => x.ref === 'Puella rēgīnam amat.');
  // "reginam" has no ambiguity with another form → accepted
  assert.ok(gradeCompose('Puella reginam amat', c.slots).correct);
  // strict mode refuses
  assert.equal(gradeCompose('Puella reginam amat', c.slots, { strict: true }).correct, false);
  // nominative "puella" is exact; "regina" without macrons could be nom/abl → must be rejected as ambiguous
  const c2 = COMPOSE.find((x) => x.ref === 'Rēgīna agricolae pecūniam dat.');
  const r = gradeCompose('Regina agricolae pecuniam dat', c2.slots);
  assert.equal(r.correct, false); assert.match(r.messages.join(' '), /Macrons matter/);
});
