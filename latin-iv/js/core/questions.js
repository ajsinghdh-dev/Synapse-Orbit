// LATIN IV — question bank. Everything here is pure data generation (no DOM, no storage).
// Three origins:
//   authored   — written by hand (js/data/concepts.js, translation + composition sentences)
//   annotated  — derived from the hand-annotated sentence corpus (case/function questions)
//   generated  — produced by rule-based generators from the verified lexicon + morphology engine
// Every question is a plain object: { id, ch, topic, section, diff, est, type, prompt, answer|accept, explanation,
//   rule, vocab, source, origin, … }.  The bank is validated by tests/bank.test.js.

import { LEXICON, BY_ID, CHAPTERS } from '../data/lexicon.js';
import { CONCEPTS } from '../data/concepts.js';
import { TOPICS } from '../data/curriculum.js';
import { SENTENCES, COMPOSE, analyzer } from './corpus.js';
import { ROLE_LABEL } from './sentences.js';
import { conjugate, declineNoun, nounForm, adjForm, CASES, NUMS, CASE_NAME, NUM_NAME, GENDER_NAME, PERSONS, strip, canon, describe } from './latin.js';
import { parseSlot } from './grade.js';

// ------------------------------------------------------------------ helpers
export function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function shuffle(arr, rand = Math.random) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pick = (arr, rand, n) => shuffle(arr, rand).slice(0, n);
const uniqBy = (arr, key) => { const seen = new Set(); return arr.filter((x) => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
const L = (s) => `{${s}}`; // Latin markup

const SRC = (ch) => `Wheelock 7e Ch. ${ch} “${CHAPTERS[ch - 1].title}” · aligned with UVic unit0${ch}`;
const EST = { 1: 0.25, 2: 0.5, 3: 0.75 };

function finish(o) {
  const q = { vocab: [], origin: 'generated', ...o };
  q.section = TOPICS[q.topic].section;
  q.source = SRC(q.ch);
  q.est = +(EST[q.diff] + (q.type === 'typed' ? 0.05 : q.type === 'compose' || q.type === 'translate' ? 0.1 : 0)).toFixed(2);
  q.vocab = [...new Set(q.vocab)];
  return q;
}
function mcqOptions(correct, wrong, rand, { stripUnique = true } = {}) {
  const key = (s) => (stripUnique ? strip(canon(s)) : canon(s));
  const seen = new Set([key(correct)]);
  const out = [];
  for (const w of shuffle(wrong, rand)) { if (!seen.has(key(w))) { seen.add(key(w)); out.push(w); } if (out.length === 3) break; }
  return out.length < 2 ? null : [correct, ...out];
}
const maxCh = (ids, ...extra) => Math.max(1, ...extra, ...ids.map((i) => BY_ID[i].ch));

// English helpers for verb translations
const IRR3 = { have: 'has' };
function en3(g) {
  const [w, ...rest] = g.split(' ');
  let v = IRR3[w];
  if (!v) v = /(s|x|z|ch|sh|o)$/.test(w) ? w + 'es' : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : w + 's';
  return [v, ...rest].join(' ');
}
const PRON = ['I', 'you (sing.)', 'he/she/it', 'we', 'you (pl.)', 'they'];
const PERS_LABEL = ['1st person singular', '2nd person singular', '3rd person singular', '1st person plural', '2nd person plural', '3rd person plural'];
const englishForm = (lex, idx, gloss = lex.en[0]) => `${PRON[idx]} ${idx === 2 ? en3(gloss) : gloss}`;
const verbGloss = (lex) => (lex.en[0].startsWith('be ') ? lex.en[0] : 'to ' + lex.en[0]);

// ------------------------------------------------------------------ explanation builders
export function whyVerbForm(lex, idx) {
  const p = conjugate(lex);
  const form = p.ind[idx];
  if (lex.irreg === 'sum') return `${L(form)} is ${PERS_LABEL[idx]} of the irregular verb {sum}: {sum, es, est, sumus, estis, sunt}.`;
  const endings = ['-ō', '-s', '-t', '-mus', '-tis', '-nt'];
  const person = PERS_LABEL[idx];
  if (lex.irreg === 'do') return `${L(form)} = {d-} + the stem vowel a + ${L(endings[idx])}: ${person}. In {dō} the a is short everywhere except {dās} (and the imperative {dā}).`;
  if (idx === 0) return `${L(form)}: the 1st person singular ending is ${L('-ō')}; ${lex.conj === 1 ? 'the stem vowel ā disappears before it' : 'the stem is {' + p.base + 'e-}'} — the first principal part is itself this form.`;
  return `${L(form)} = present stem ${L(p.stem + '-')} + ${L(endings[idx])} (${person}).${idx === 2 || idx === 5 ? ' The vowel is short before final -t / -nt.' : ' The stem vowel stays long.'}`;
}
export function whyNounForm(lex, c, n) {
  const f = nounForm(lex, c, n)[0];
  const stemOf = (lx) => (lx.type === 'er' ? lx.stem : lx.type === 'a' ? lx.la.slice(0, -1) : lx.la.slice(0, -2));
  const stem = stemOf(lex);
  const ends = { a: { sg: ['-a', '-ae', '-ae', '-am', '-ā', '-a'], pl: ['-ae', '-ārum', '-īs', '-ās', '-īs', '-ae'] }, m: { sg: ['-us', '-ī', '-ō', '-um', '-ō', '-e'], pl: ['-ī', '-ōrum', '-īs', '-ōs', '-īs', '-ī'] }, n: { sg: ['-um', '-ī', '-ō', '-um', '-ō', '-um'], pl: ['-a', '-ōrum', '-īs', '-a', '-īs', '-a'] } };
  const set = lex.type === 'a' ? 'a' : (lex.type === 'um' || lex.type === 'ium') ? 'n' : 'm';
  const e = ends[set][n][CASES.indexOf(c)];
  const label = `${CASE_NAME[c]} ${NUM_NAME[n]}`;
  let s = `${L(f)} = stem ${L(stem + '-')} + ${L(e)} (${label}).`;
  if (lex.type === 'er' && n === 'sg' && (c === 'nom' || c === 'voc')) s = `${L(f)}: -er nouns have no ending in the nominative and vocative singular (${label}).`;
  if (set === 'n' && (c === 'nom' || c === 'acc' || c === 'voc')) s += n === 'pl' ? ' Neuter rule: nominative, accusative and vocative are identical, and plural neuter always ends in -a.' : ' Neuter rule: nominative, accusative and vocative are identical.';
  if (lex.type === 'er' && lex.stem !== lex.la && c !== 'nom' && c !== 'voc') s += ` Note the stem ${L(lex.stem + '-')}: the -e- of ${L(lex.la)} drops out.`;
  if (lex.type === 'ius' && c === 'voc') s += ' Nouns in -ius have vocative -ī (fīlī).';
  if (lex.type === 'ius' && c === 'gen' && n === 'sg') s += ` Also written ${L(nounForm(lex, 'gen', 'sg')[1])}.`;
  return s;
}
// Wheelock-style abbreviated adjective entry: bonus, -a, -um
export const adjEntry = (a) => (a.adjType === 'us' ? `${a.la}, -a, -um` : a.adjType === 'er1' ? `${a.la}, -chra, -chrum` : `${a.la}, -era, -erum`);
const entryString = (lex) => {
  if (lex.pos === 'verb') return lex.pp.filter(Boolean).map(L).join(', ') + ' — ' + lex.en.join(', ');
  if (lex.pos === 'noun') return `${L(lex.la + ', ' + lex.gen)} (${lex.gender === 'mf' ? 'm./f.' : lex.gender}.) — ${lex.en.join(', ')}`;
  if (lex.pos === 'adj') return `${L(lex.la + ', ' + lex.f + ', ' + lex.n)} — ${lex.en.join(', ')}`;
  return `${L(lex.la)} — ${lex.en.join(', ')}`;
};

// ------------------------------------------------------------------ generators
const verbs = LEXICON.filter((w) => w.pos === 'verb');
const verbs12 = verbs.filter((w) => w.irreg !== 'sum');
const nouns = LEXICON.filter((w) => w.pos === 'noun');
const adjs = LEXICON.filter((w) => w.pos === 'adj');
const sumLex = BY_ID.sum;

function genVocab() {
  const out = [];
  for (const w of LEXICON) {
    const rand = rng(hash('v:' + w.id));
    const pool = LEXICON.filter((x) => x.pos === w.pos && x.id !== w.id && x.ch <= w.ch && !x.en.some((g) => w.en.includes(g)) && x.irreg !== 'sum');
    const disp = (x) => (x.pos === 'verb' ? verbGloss(x) : x.en[0]);
    // Latin → English multiple choice
    if (pool.length >= 3) {
      const dis = pick(pool, rand, 6);
      const opts = mcqOptions(disp(w), dis.map(disp), rand, { stripUnique: false });
      if (opts) out.push(finish({ id: `v:mc:${w.id}`, ch: w.ch, topic: 'vocab', diff: 1, type: 'mcq', prompt: `What does ${L(w.la)} mean?`, options: opts, answer: disp(w), explanation: entryString(w) + (w.note ? ' ' + w.note : ''), rule: 'vocab', vocab: [w.id, ...dis.map((d) => d.id).filter((id) => opts.includes(disp(BY_ID[id])))] }));
    }
    // English → Latin typed (any lexeme sharing the displayed gloss is accepted)
    const gloss = w.en[0];
    const same = LEXICON.filter((x) => x.pos === w.pos && x.en.includes(gloss));
    out.push(finish({ id: `v:el:${w.id}`, ch: w.ch, topic: 'vocab', diff: 2, type: 'typed', lang: 'la', prompt: `Give the Latin dictionary headword for “${w.pos === 'verb' ? verbGloss(w) : gloss}” (${w.pos === 'adj' ? 'adjective, masculine nominative' : w.pos === 'noun' ? 'noun, nominative singular' : w.pos === 'verb' ? 'verb, 1st principal part' : w.pos}).`, accept: same.map((x) => x.la), explanation: entryString(w), rule: 'vocab', vocab: same.map((x) => x.id) }));
  }
  return out;
}

function genPrincipalParts() {
  const out = [];
  for (const w of verbs) {
    const base = { ch: w.ch, topic: 'princ-parts', rule: 'c1.ppart', vocab: [w.id], explanation: entryString(w) + (w.note ? ' ' + w.note : '') };
    out.push(finish({ ...base, id: `pp:inf:${w.id}`, diff: 1, type: 'typed', lang: 'la', prompt: `Give the present active infinitive of ${L(w.la)}.`, accept: [w.pp[1]] }));
    if (w.pp[2]) out.push(finish({ ...base, id: `pp:perf:${w.id}`, diff: 2, type: 'typed', lang: 'la', prompt: `Give the perfect (third principal part) of ${L(w.pp[0] + ', ' + w.pp[1])}.`, accept: [w.pp[2]] }));
    if (w.pp[3]) out.push(finish({ ...base, id: `pp:ptc:${w.id}`, diff: 3, type: 'typed', lang: 'la', prompt: `Give the fourth principal part of ${L(w.pp.slice(0, 3).join(', '))}.`, accept: [w.pp[3]] }));
    if (w.irreg !== 'sum') {
      const rand = rng(hash('conj:' + w.id));
      void rand;
      out.push(finish({ ...base, id: `pp:conj:${w.id}`, diff: 1, type: 'mcq', prompt: `To which conjugation does ${L(w.pp[0] + ', ' + w.pp[1])} belong?`, options: ['1st conjugation', '2nd conjugation'], answer: w.conj === 1 ? '1st conjugation' : '2nd conjugation', explanation: `The infinitive ${L(w.pp[1])} ends in ${w.conj === 1 ? L('-āre') : L('-ēre')}, so it is ${w.conj === 1 ? '1st' : '2nd'} conjugation.${w.irreg === 'do' ? ' (dō has a short a: dare.)' : ''}`, rule: 'c1.stem' }));
    }
  }
  return out;
}

function genConjugation() {
  const out = [];
  for (const w of verbs) {
    const p = conjugate(w);
    const sum = w.irreg === 'sum';
    const topic = sum ? 'sum' : 'verb-forms';
    const rule = sum ? 'c4.sum' : 'c1.endings';
    PERSONS.forEach(([pers, num], idx) => {
      const form = p.ind[idx];
      out.push(finish({ id: `cf:${w.id}:${idx}`, ch: w.ch, topic, diff: idx === 0 || idx === 3 ? 1 : 2, type: 'typed', lang: 'la', prompt: `Give the ${PERS_LABEL[idx]}, present active indicative, of ${L(sum ? 'sum, esse' : w.pp[0] + ', ' + w.pp[1])}.`, accept: [form], explanation: whyVerbForm(w, idx), rule, vocab: [w.id] }));
    });
    // two identification + two translation items per verb, chosen deterministically
    const h = hash('cid:' + w.id);
    [h % 6, (h + 3) % 6].forEach((idx, k) => {
      const rand = rng(hash(`cid:${w.id}:${idx}`));
      const opts = mcqOptions(PERS_LABEL[idx], PERS_LABEL, rand);
      out.push(finish({ id: `cid:${w.id}:${idx}`, ch: w.ch, topic: sum ? 'sum' : 'verb-id', diff: 1, type: 'mcq', prompt: `Which person and number is ${L(p.ind[idx])}? (present active indicative of ${L(w.pp[0])})`, options: opts, answer: PERS_LABEL[idx], explanation: whyVerbForm(w, idx), rule, vocab: [w.id] }));
      void k;
      if (w.en[0].startsWith('be ') && !sum) return;
      const g = sum ? 'be' : w.en[0];
      const correct = sum ? ['I am', 'you (sing.) are', 'he/she/it is', 'we are', 'you (pl.) are', 'they are'][idx] : englishForm(w, idx, g);
      const wrong = [0, 1, 2, 3, 4, 5].filter((i) => i !== idx).map((i) => (sum ? ['I am', 'you (sing.) are', 'he/she/it is', 'we are', 'you (pl.) are', 'they are'][i] : englishForm(w, i, g)));
      out.push(finish({ id: `ctr:${w.id}:${idx}`, ch: w.ch, topic: sum ? 'sum' : 'verb-forms', diff: 1, type: 'mcq', prompt: `Choose the best translation of ${L(p.ind[idx])}.`, options: mcqOptions(correct, wrong, rng(hash('ctr' + w.id + idx))), answer: correct, explanation: whyVerbForm(w, idx) + ` Present tense also translates as “am/is/are ___ing”.`, rule: sum ? 'c4.sum' : 'c1.translate', vocab: [w.id] }));
    });
    if (!sum) {
      const kinds = [['inf', p.inf, 'present infinitive', 'present active infinitive'], ['impSg', p.impSg, 'singular imperative', 'singular imperative (command to one person)'], ['impPl', p.impPl, 'plural imperative', 'plural imperative (command to several people)']];
      for (const [k, form, label] of kinds) {
        out.push(finish({ id: `ik:${w.id}:${k}`, ch: 1, topic: 'inf-imp', diff: 2, type: 'typed', lang: 'la', prompt: `Give the ${label} of ${L(w.pp[0] + ', ' + w.pp[1])}.`, accept: [form], explanation: `${L(form)}: ${k === 'inf' ? 'present stem + -re' : k === 'impSg' ? 'the bare present stem' : 'present stem + -te'}${w.irreg === 'do' ? '. (dō: dare, dā, date — the a is short except in dā.)' : '.'}`, rule: k === 'inf' ? 'c1.infinitive' : 'c1.imperative', vocab: [w.id] }));
      }
      const labels = ['present infinitive', 'singular imperative (command to one person)', 'plural imperative (command to several people)', 'indicative (a statement with a subject)'];
      const h2 = hash('ikid:' + w.id);
      [h2 % 4, (h2 + 2) % 4].forEach((ki) => {
        const form = ki === 0 ? p.inf : ki === 1 ? p.impSg : ki === 2 ? p.impPl : p.ind[4];
        out.push(finish({ id: `ikid:${w.id}:${ki}`, ch: 1, topic: 'inf-imp', diff: 2, type: 'mcq', prompt: `Identify the form ${L(form)} (from ${L(w.pp[0])}).`, options: labels, answer: labels[ki], explanation: `${L(form)}: ${['infinitive (-re, no person)', 'singular imperative = the bare stem', 'plural imperative = stem + -te', '2nd person plural indicative (-tis)'][ki]}. Compare: ${L([p.inf, p.impSg, p.impPl, p.ind[4]].join(', '))}.`, rule: ki === 0 ? 'c1.infinitive' : ki === 3 ? 'c1.endings' : 'c1.imperative', vocab: [w.id] }));
      });
    }
  }
  return out;
}

// a worked example that stays inside the chapter being tested (and is never the asked noun)
function stemExample(w) {
  const ex = w.ch === 2 ? [['silva', '{silvae} → {silv-}'], ['via', '{viae} → {vi-}']] : [['lupus', '{lupī} → {lup-}'], ['equus', '{equī} → {equ-}']];
  return (ex.find(([id]) => id !== w.id) || ex[0])[1];
}
const NCELLS = [];
for (const n of NUMS) for (const c of CASES) NCELLS.push([c, n]);

function genNouns() {
  const out = [];
  for (const w of nouns) {
    const set = w.type === 'a' ? 'decl1' : w.type === 'er' ? 'er-nouns' : w.type === 'um' || w.type === 'ium' ? 'decl2n' : 'decl2m';
    const rule = w.type === 'a' ? 'c2.decl1' : w.type === 'er' ? 'c3.er' : (w.type === 'um' || w.type === 'ium') ? 'c4.neuter' : 'c3.decl2m';
    const head = `${L(w.la + ', ' + w.gen)} (${w.en[0]})`;
    for (const [c, n] of NCELLS) {
      if (c === 'voc' && !w.anim && !(w.type === 'um' || w.type === 'ium')) continue;
      out.push(finish({ id: `df:${w.id}:${c}.${n}`, ch: w.ch, topic: w.type === 'er' && c !== 'nom' && c !== 'voc' ? 'er-nouns' : set, diff: c === 'nom' || c === 'acc' ? 1 : c === 'voc' || w.type === 'er' || w.type === 'ius' ? 3 : 2, type: 'typed', lang: 'la', prompt: `Give the ${CASE_NAME[c]} ${NUM_NAME[n]} of ${head}.`, accept: nounForm(w, c, n), explanation: whyNounForm(w, c, n), rule, vocab: [w.id] }));
    }
    // identify: which case/number is possible?
    const h = hash('dcase:' + w.id);
    const cells = [['gen', 'sg'], ['dat', 'sg'], ['acc', 'sg'], ['abl', 'sg'], ['nom', 'pl'], ['gen', 'pl'], ['dat', 'pl'], ['acc', 'pl']];
    [h % 8, (h + 3) % 8].forEach((ci) => {
      const [c, n] = cells[ci];
      const form = nounForm(w, c, n)[0];
      const poss = new Set(analyzer.analyze(form).filter((a) => a.pos === 'noun').map((a) => `${a.case}.${a.number}`));
      const label = (cn) => { const [cc, nn] = cn.split('.'); return `${CASE_NAME[cc]} ${NUM_NAME[nn]}`; };
      const impossible = NCELLS.map(([cc, nn]) => `${cc}.${nn}`).filter((cn) => !poss.has(cn) && !cn.startsWith('voc'));
      const rand = rng(hash(`dcase:${w.id}:${ci}`));
      const opts = mcqOptions(label(`${c}.${n}`), impossible.map(label), rand);
      if (!opts) return;
      // Ask: which is POSSIBLE — exactly one option is a real analysis of the form.
      out.push(finish({ id: `dcase:${w.id}:${c}.${n}`, ch: w.ch, topic: set === 'decl2n' ? 'decl2n' : set, diff: poss.size > 1 ? 3 : 2, type: 'mcq', prompt: `Which case and number can the form ${L(form)} be? (from ${L(w.la)}; choose the ONE that is possible)`, options: opts, answer: label(`${c}.${n}`), explanation: `${L(form)} can be: ${[...poss].map(label).join(' / ')}. ${whyNounForm(w, c, n)}`, rule, vocab: [w.id] }));
    });
    out.push(finish({ id: `stem:${w.id}`, ch: w.ch, topic: set, diff: 2, type: 'typed', lang: 'la', prompt: `Give the stem of ${head}. Drop the genitive ending, e.g. ${stemExample(w)}.`, accept: (() => { const s = w.type === 'er' ? w.stem : w.type === 'a' ? w.la.slice(0, -1) : w.la.slice(0, -2); return [s, s + '-']; })(), explanation: `The stem comes from the genitive singular ${L(w.gen)}. ${w.note || ''}`, rule, vocab: [w.id] }));
    if (w.gender !== 'mf') {
      const gl = { m: 'masculine', f: 'feminine', n: 'neuter' };
      out.push(finish({ id: `gender:${w.id}`, ch: w.ch, topic: 'gender', diff: w.type === 'a' && w.gender === 'm' ? 3 : 1, type: 'mcq', prompt: `What is the grammatical gender of ${L(w.la + ', ' + w.gen)} (${w.en[0]})?`, options: ['masculine', 'feminine', 'neuter'], answer: gl[w.gender], explanation: `${L(w.la)} is ${gl[w.gender]}. ${w.type === 'a' && w.gender === 'm' ? 'First-declension nouns naming men are masculine: gender is not decided by the -a ending.' : w.type === 'a' ? 'Most first-declension nouns are feminine.' : w.type === 'um' || w.type === 'ium' ? 'Second-declension nouns in -um are neuter.' : 'Second-declension nouns in -us / -er are masculine.'}`, rule: 'c2.gender', vocab: [w.id] }));
    }
  }
  return out;
}

function genAgreement() {
  const out = [];
  const gl = { m: 'masculine', f: 'feminine', n: 'neuter' };
  for (const w of nouns) {
    if (w.gender === 'mf') continue;
    const h = hash('agree:' + w.id);
    const cells = NCELLS.filter(([c]) => c !== 'voc');
    [h % 10, (h + 5) % 10].forEach((ci, k) => {
      const [c, n] = cells[ci];
      const allowed = adjs.filter((a) => a.ch <= Math.max(w.ch, a.ch));
      const a = allowed[(h >>> (k * 3)) % allowed.length];
      const g = w.gender;
      const need = Math.max(w.ch, a.ch, g === 'm' ? 3 : g === 'n' ? 4 : 2);
      const adjf = adjForm(a, g, c, n);
      const nf = nounForm(w, c, n)[0];
      const differ = strip(adjf[0].slice(-2)) !== strip(nf.slice(-2));
      const aHead = `${L(adjEntry(a))} (${a.en[0]})`;
      out.push(finish({ id: `agree:${w.id}:${c}.${n}:${a.id}`, ch: need, topic: 'adj-agree', diff: need === 2 ? 2 : 3, type: 'typed', lang: 'la', prompt: `Write the form of ${aHead} that agrees with ${L(nf)} (${CASE_NAME[c]} ${NUM_NAME[n]}, ${gl[g]}) — the adjective only.`, accept: adjf, explanation: `${L(nf)} is ${gl[g]} ${CASE_NAME[c]} ${NUM_NAME[n]}, so the adjective must be ${gl[g]} ${CASE_NAME[c]} ${NUM_NAME[n]}: ${L(adjf[0])}. ${differ ? 'The visible endings differ (' + L(nf) + ' / ' + L(adjf[0]) + ') — adjectives agree in gender, number and case, not in ending letters.' : 'Here the endings happen to look alike, but the agreement is still in gender, number and case.'}`, rule: 'c2.adj', vocab: [w.id, a.id] }));
      // MCQ version with plausible wrong-agreement distractors
      const wrong = [];
      for (const gg of ['m', 'f', 'n']) for (const nn of NUMS) for (const cc of ['nom', 'gen', 'dat', 'acc', 'abl']) {
        if (gg === g && nn === n && cc === c) continue;
        if (gg === g || (nn === n && cc === c)) wrong.push(adjForm(a, gg, cc, nn)[0]);
      }
      const accepted = new Set(adjf.map((x) => strip(x)));
      const wr = wrong.filter((x) => !accepted.has(strip(x)));
      const opts = mcqOptions(adjf[0], wr, rng(hash('agreemc' + w.id + ci)));
      if (opts) out.push(finish({ id: `agreemc:${w.id}:${c}.${n}:${a.id}`, ch: need, topic: 'adj-agree', diff: 2, type: 'mcq', prompt: `Which form of ${aHead} agrees with ${L(nf)} (${CASE_NAME[c]} ${NUM_NAME[n]})?`, options: opts, answer: adjf[0], explanation: `${L(nf)}: ${gl[g]} ${CASE_NAME[c]} ${NUM_NAME[n]} → ${L(adjf[0])}.`, rule: 'c2.adj', vocab: [w.id, a.id] }));
    });
  }
  return out;
}

function genSum() {
  const out = [];
  const eng = ['I am', 'you (sing.) are', 'he/she/it is', 'we are', 'you (pl.) are', 'they are'];
  // person/number → English, English → form (typed covered in genConjugation)
  eng.forEach((e, idx) => {
    const form = conjugate(sumLex).ind[idx];
    const wrong = eng.filter((_, i) => i !== idx);
    out.push(finish({ id: `sumen:${idx}`, ch: 4, topic: 'sum', diff: 1, type: 'typed', lang: 'la', prompt: `Which form of {sum} means “${e}”?`, accept: [form], explanation: `${L(form)} = ${e}. ` + whyVerbForm(sumLex, idx), rule: 'c4.sum', vocab: ['sum'] }));
    void wrong;
  });
  return out;
}

// ------------------------------------------------------------------ annotated corpus items
const FUNC = { S: 'subject', O: 'direct object', I: 'indirect object', G: 'possessive genitive (“of”)', PO: 'object of a preposition', N: 'predicate nominative / adjective', AP: 'in apposition', VOC: 'direct address (vocative)' };
const ROLE_CASE = { S: 'nom', N: 'nom', O: 'acc', I: 'dat', G: 'gen', VOC: 'voc', AP: null, PO: null };
const FUNC_WHY = {
  S: 'it is nominative and agrees with the verb', O: 'it is accusative and receives the action', I: 'it is dative: the person “to/for whom”',
  G: 'it is genitive: “of …”', PO: 'a preposition governs it', N: 'it is nominative and completes sum, agreeing with the subject', AP: 'it renames a noun and stands in the same case', VOC: 'it names the person addressed',
};
function genSentenceItems() {
  const out = [];
  for (const s of SENTENCES) {
    const words = s.toks.map((t) => t.word.toLowerCase());
    s.toks.forEach((t, i) => {
      if (!FUNC[t.role]) return;
      if (words.filter((w) => w === t.word.toLowerCase()).length > 1) return;
      const vocab = [...new Set(s.toks.map((x) => x.analysis.lemma))];
      const a = t.analysis;
      const rand = rng(hash(`sf:${s.id}:${i}`));
      const present = new Set(s.toks.filter((x) => FUNC[x.role]).map((x) => x.role));
      void present;
      // A distractor function is only fair if the form could NOT also have that function by case alone
      // (otherwise e.g. “agricolae” offered as both genitive and dative reading would be ambiguous).
      const possCases = new Set(analyzer.analyze(t.word.toLowerCase()).filter((x) => x.case).map((x) => x.case));
      const wrong = Object.keys(FUNC).filter((r) => r !== t.role && !(ROLE_CASE[r] && possCases.has(ROLE_CASE[r])));
      const opts = mcqOptions(FUNC[t.role], wrong.map((r) => FUNC[r]), rand);
      out.push(finish({ id: `sf:${s.id}:${i}`, ch: s.ch, topic: t.role === 'AP' ? 'apposition' : t.role === 'N' ? 'pred-nom' : 'syntax', diff: Math.min(3, Math.max(s.lvl, t.role === 'S' ? 1 : 2)), type: 'mcq', origin: 'annotated', prompt: `In “${L(s.la)}”, what is the function of ${L(t.word)}?`, options: opts, answer: FUNC[t.role], explanation: `${L(t.word)} is ${describe(a)}: ${FUNC_WHY[t.role]}, so it is the ${FUNC[t.role]}.`, rule: t.role === 'N' ? 'c4.predicate' : t.role === 'AP' ? 'c3.apposition' : t.role === 'PO' ? 'c2.prep' : 'c2.cases', vocab }));
      // case + number in context; distractors are impossible for the surface form
      if (a.case) {
        const poss = new Set(analyzer.analyze(t.word.toLowerCase()).map((x) => `${x.case}.${x.number}`));
        const label = (cn) => { const [cc, nn] = cn.split('.'); return `${CASE_NAME[cc]} ${NUM_NAME[nn]}`; };
        const imp = NCELLS.map(([cc, nn]) => `${cc}.${nn}`).filter((cn) => !poss.has(cn));
        const o2 = mcqOptions(label(`${a.case}.${a.number}`), imp.map(label), rng(hash(`sc:${s.id}:${i}`)));
        if (o2) out.push(finish({ id: `sc:${s.id}:${i}`, ch: s.ch, topic: 'case-func', diff: Math.min(3, s.lvl + (poss.size > 1 ? 1 : 0)), type: 'mcq', origin: 'annotated', prompt: `In “${L(s.la)}”, ${L(t.word)} is in which case and number?`, options: o2, answer: label(`${a.case}.${a.number}`), explanation: `${L(t.word)} could be ${[...poss].map(label).join(' / ')} by form; in this sentence it is ${label(`${a.case}.${a.number}`)} because it is the ${FUNC[t.role]}.`, rule: 'c2.cases', vocab }));
      }
    });
    // translation (self-assessed)
    const vocab = [...new Set(s.toks.map((x) => x.analysis.lemma))];
    out.push(finish({ id: `tr:${s.id}`, ch: s.ch, topic: 'translate-la', diff: s.lvl, type: 'translate', origin: 'authored', prompt: `Translate into English: ${L(s.la)}`, sent: s, answer: s.en, explanation: `Reference: “${s.en}”${s.alts.length ? ' (also: ' + s.alts.map((x) => '“' + x + '”').join('; ') + ')' : ''}. ${s.note}`, rule: s.ch === 1 ? 'c1.translate' : 'c4.sentence', vocab }));
  }
  return out;
}

function genCompose() {
  return COMPOSE.map((c) => {
    const lemmas = c.slots.map((sp) => parseSlot(sp).lemma);
    return finish({ id: `cp:${c.id}`, ch: c.ch, topic: 'translate-en', diff: c.lvl, type: 'compose', origin: 'authored', prompt: `Translate into Latin: “${c.en}”`, slots: c.slots, ref: c.ref, answer: c.ref, explanation: `Model answer: ${L(c.ref)}${c.alts.length ? ' (also: ' + c.alts.map(L).join('; ') + ')' : ''}. Word order is flexible in Latin; what matters is the verb’s person/number, each noun’s case and each adjective’s agreement. ${c.note}`, rule: c.ch === 1 ? 'c1.endings' : 'c4.sentence', vocab: lemmas });
  });
}

function genConcepts() {
  return CONCEPTS.map((c, i) => {
    const rand = rng(hash('concept:' + c.prompt));
    const options = shuffle([c.correct, ...c.wrong], rand);
    return finish({ id: `c${c.ch}:${c.topic}:${String(i + 1).padStart(3, '0')}`, ch: c.ch, topic: c.topic, diff: c.diff, type: 'mcq', origin: 'authored', prompt: c.prompt, options, answer: c.correct, explanation: c.why, rule: c.rule, vocab: c.vocab });
  });
}

// ------------------------------------------------------------------ bank
function build() {
  const all = [...genConcepts(), ...genSentenceItems(), ...genCompose(), ...genVocab(), ...genPrincipalParts(), ...genConjugation(), ...genNouns(), ...genAgreement(), ...genSum()];
  // a question needs the chapter of everything it displays
  for (const q of all) q.ch = Math.max(q.ch, ...q.vocab.map((id) => BY_ID[id].ch));
  return all;
}
export const BANK = build();
export const Q_BY_ID = Object.fromEntries(BANK.map((q) => [q.id, q]));
export function bankStats() {
  const by = (f) => BANK.reduce((m, q) => { const k = f(q); m[k] = (m[k] || 0) + 1; return m; }, {});
  return { total: BANK.length, origin: by((q) => q.origin), chapter: by((q) => q.ch), section: by((q) => q.section), type: by((q) => q.type) };
}
export { entryString, englishForm, verbGloss, PERS_LABEL, PRON, FUNC, GENDER_NAME };
