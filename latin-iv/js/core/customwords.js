// Parsing and validation of vocabulary entered by the learner from their own textbook.
// One entry per line:   dictionary entry ; meanings ; chapter ; [part of speech]
//   amō, amāre, amāvī, amātus ; love, like ; 1
//   puella, puellae, f. ; girl ; 2
//   bonus, -a, -um ; good ; 2
//   in ; in, on (+abl); into (+acc) ; 2 ; prep+abl/acc
// Every entry is checked against the morphology engine before it is accepted.
import { strip } from './latin.js';
import { declineNoun, declineAdj, conjugate } from './latin.js';

const GENDER = { m: 'm', f: 'f', n: 'n', 'm/f': 'mf', 'f/m': 'mf', c: 'mf', mf: 'mf' };
export const mkId = (la) => strip(la).toLowerCase().replace(/[^a-z]/g, '');
const clean = (s) => s.normalize('NFC').trim();

export function splitFields(line) {
  const sep = line.includes(';') ? ';' : line.includes('|') ? '|' : '\t';
  return line.split(sep).map(clean);
}

/** Returns { ok, lex, errors, warnings }. `existing` = Map id → lexeme (to report replacements). */
export function parseLine(line, defaultCh = 1, existing = new Map()) {
  const errors = [], warnings = [];
  const raw = line.trim();
  const f = splitFields(raw);
  const out = (lex) => ({ ok: !errors.length, lex: errors.length ? null : lex, errors, warnings, raw });
  if (f.length < 2 || !f[0] || !f[1]) { errors.push('Use: entry ; meaning ; chapter  (the chapter is optional)'); return out(); }
  const parts = f[0].split(',').map(clean).filter(Boolean);
  const en = f[1].split(/,|\//).map((s) => s.replace(/\([^)]*\)/g, '').trim()).filter(Boolean);
  let ch = defaultCh;
  if (f[2]) { const n = parseInt(f[2], 10); if ([1, 2, 3, 4].includes(n)) ch = n; else if (f[2]) { errors.push(`Chapter must be 1–4 (got “${f[2]}”)`); } }
  const tag = (f[3] || '').toLowerCase();
  if (!en.length) errors.push('Give at least one English meaning');
  if (errors.length) return out();

  let lex;
  const last = parts[parts.length - 1].toLowerCase().replace(/[().]/g, '');
  const genderTok = GENDER[last];
  if (/^(prep|conj|adv)/.test(tag)) {
    const pos = tag.slice(0, 4) === 'prep' ? 'prep' : tag.slice(0, 4) === 'conj' ? 'conj' : 'adv';
    let governs;
    if (pos === 'prep') { const g = tag.split('+')[1]; if (!['abl', 'acc', 'abl/acc', 'acc/abl'].includes(g)) { errors.push('Prepositions need the case: prep+acc, prep+abl or prep+abl/acc'); return out(); } governs = g === 'acc/abl' ? 'abl/acc' : g; }
    lex = { id: mkId(parts[0]), la: parts[0], pos, en, ch, conf: 'core', governs, forms: parts.slice(1).length ? parts.slice(1) : undefined, note: '' };
  } else if (genderTok) {
    // ---- noun
    const nom = parts[0]; let gen = parts[1];
    if (!gen) { errors.push('A noun needs its genitive: puella, puellae, f.'); return out(); }
    const base = (n) => (n.endsWith('ius') || n.endsWith('ium') ? n.slice(0, -2) : /(a|us|um)$/.test(n) ? n.slice(0, -(n.endsWith('a') ? 1 : 2)) : n);
    if (gen.startsWith('-')) {
      if (/er$|ir$/.test(nom)) { errors.push(`Write the full genitive for ${nom} (e.g. agrī, puerī): the stem can change`); return out(); }
      gen = base(nom) + gen.slice(1);
    }
    let type, stem = null, contractGen = false;
    const g = strip(gen);
    if (nom.endsWith('a') && gen.endsWith('ae')) type = 'a';
    else if (nom.endsWith('ius') && /ī$/.test(gen)) { type = 'ius'; contractGen = strip(gen) === strip(nom.slice(0, -3)) + 'i'; }
    else if (nom.endsWith('us') && /ī$/.test(gen)) type = 'us';
    else if (nom.endsWith('ium') && /ī$/.test(gen)) type = 'ium';
    else if (nom.endsWith('um') && /ī$/.test(gen)) type = 'um';
    else if (/ī$/.test(gen) && !nom.endsWith('us') && !nom.endsWith('um')) {
      stem = gen.slice(0, -1);
      const s = strip(stem), n = strip(nom);
      if (n === s || n === s.slice(0, -1) + 'er' || (n.endsWith('er') && s.endsWith('r') && n.slice(0, -2) + 'r' === s)) type = 'er';
      else { errors.push(`${nom}, ${gen}: the nominative and genitive do not fit a Chapter 3 pattern (puer/puerī, ager/agrī, vir/virī)`); return out(); }
    } else { errors.push(`${nom}, ${gen}: not a 1st-declension (-ae) or 2nd-declension (-ī) noun. Only these are covered in Chapters 1–4.`); return out(); }
    const gender = genderTok;
    if ((type === 'um' || type === 'ium') && gender !== 'n') errors.push('Nouns in -um are neuter (n.)');
    if (type === 'a' && gender === 'n') errors.push('1st-declension nouns are not neuter');
    if ((type === 'us' || type === 'ius' || type === 'er') && gender !== 'm') warnings.push('2nd-declension nouns in -us/-er are normally masculine; check the gender');
    const minCh = type === 'a' ? 2 : (type === 'um' || type === 'ium') ? 4 : 3;
    if (ch < minCh) { warnings.push(`This declension is introduced in Chapter ${minCh}; chapter set to ${minCh}`); ch = minCh; }
    lex = { id: mkId(nom), la: nom, pos: 'noun', decl: type === 'a' ? 1 : 2, type, stem, gender, gen, en, ch, conf: 'core', anim: ['m', 'f', 'mf'].includes(gender) && /^(?!bellum)/.test(nom) && type !== 'um' && type !== 'ium' && /(agricola|nauta|poeta|puella|filia|filius|amicus|dominus|servus|puer|vir|magister|nuntius|regina|incola)/.test(mkId(nom)), contractGen, note: '', genAlt: [], custom: true };
    if (!errors.length && !declineNoun(lex).sg.gen.some((x) => strip(x) === g)) errors.push(`Genitive ${gen} does not match what ${nom} produces`);
    else if (!errors.length && !declineNoun(lex).sg.gen.includes(gen)) warnings.push(`Macrons in the genitive differ from the engine’s ${declineNoun(lex).sg.gen[0]}; double-check against the book`);
  } else if (parts.length >= 2 && /(ā|a|ē|e)re$/.test(strip(parts[1]).replace(/^-/, '')) || (parts.length >= 2 && /^-?[āē]re$/.test(parts[1]))) {
    // ---- verb
    const first = parts[0];
    const base1 = first.endsWith('eō') ? first.slice(0, -2) : first.endsWith('ō') ? first.slice(0, -1) : null;
    if (!base1) { errors.push('A verb entry starts with the 1st person singular, ending in -ō or -eō'); return out(); }
    let inf = parts[1];
    if (inf.startsWith('-')) inf = base1 + inf.slice(1);
    if (/(ere|īre|ire)$/.test(inf) && !first.endsWith('eō') && !/ēre$/.test(inf)) { errors.push(`${first}, ${inf} looks like a 3rd or 4th conjugation verb. Only 1st (-āre) and 2nd (-ēre) conjugation verbs are covered in Chapters 1–4.`); return out(); }
    const conj = /ēre$/.test(inf) || (/ere$/.test(inf) && first.endsWith('eō')) ? 2 : 1;
    if (!/[āē]re$/.test(inf) && first !== 'dō') { const fixed = inf.replace(/are$/, 'āre').replace(/ere$/, 'ēre'); if (fixed !== inf) { warnings.push(`Added the macron: ${inf} → ${fixed}`); inf = fixed; } }
    if (strip(inf).slice(0, -3) + (conj === 1 ? 'o' : 'eo') !== strip(first)) { errors.push(`${first} and ${inf} do not belong together`); return out(); }
    if (conj === 1 && !/(ā|a)re$/.test(inf) || conj === 2 && !/ēre$/.test(inf)) { errors.push(`${inf}: only 1st (-āre) and 2nd (-ēre) conjugation verbs are covered in Chapters 1–4`); return out(); }
    let perf = parts[2] || null, ptc = parts[3] || null;
    if (perf && perf.startsWith('-')) perf = base1 + perf.slice(1);
    if (ptc && ptc.startsWith('-')) ptc = base1 + ptc.slice(1);
    if (!perf) warnings.push('No perfect given: perfect-tense questions are skipped for this verb');
    lex = { id: mkId(first), la: first, pos: 'verb', conj, pp: [first, inf, perf, ptc], en: en.map((e) => e.replace(/^to /, '')), ch: 1, conf: 'core', note: '', irreg: first === 'dō' ? 'do' : undefined, custom: true };
    if (ch !== 1) { warnings.push('Chapters 1–4 verbs of the 1st/2nd conjugation are taught in Chapter 1; chapter set to 1'); }
  } else if (parts.length === 3 && /(us|er|ur)$/.test(parts[0]) && !genderTok) {
    // ---- adjective
    const m = parts[0]; let fem = parts[1], neu = parts[2];
    const er = m.endsWith('er');
    if (fem.startsWith('-')) { if (er) { errors.push(`Write the full forms for ${m} (e.g. pulchra, pulchrum): the stem can change`); return out(); } fem = m.slice(0, -2) + fem.slice(1); }
    if (neu.startsWith('-')) neu = m.slice(0, -2) + neu.slice(1);
    let adjType, stem = null;
    if (m.endsWith('us') && fem === m.slice(0, -2) + 'a' && neu === m.slice(0, -2) + 'um') adjType = 'us';
    else if (er && fem === m + 'a' && neu === m + 'um') { adjType = 'er0'; stem = m; }
    else if (er && /ra$/.test(fem) && neu === fem.slice(0, -1) + 'um' && strip(m).slice(0, -2) + 'r' === strip(fem).slice(0, -1)) { adjType = 'er1'; stem = fem.slice(0, -1); }
    else { errors.push(`${m}, ${fem}, ${neu}: not a regular 1st/2nd-declension adjective (bonus/bona/bonum, miser/misera/miserum, pulcher/pulchra/pulchrum)`); return out(); }
    if (ch < 2) { ch = 2; warnings.push('Adjectives are used from Chapter 2; chapter set to 2'); }
    lex = { id: mkId(m), la: m, f: fem, n: neu, pos: 'adj', adjType, stem, decl: '1/2', en, ch, conf: 'core', note: '', custom: true };
    void declineAdj;
  } else {
    errors.push('Could not tell the type of word. Nouns end with a gender (f.), verbs have an infinitive (-āre/-ēre), adjectives have three forms. For prepositions, conjunctions and adverbs add a 4th field: prep+acc, prep+abl, conj or adv.');
    return out();
  }
  const old = existing.get(lex.id);
  if (old) warnings.push(old.custom ? 'Replaces your earlier entry' : `Replaces the built-in entry (Chapter ${old.ch})`);
  if (lex.pos === 'verb' && !errors.length) { try { conjugate(lex); } catch (e) { errors.push(e.message); } }
  return out(lex);
}

export function parseBlock(text, defaultCh, existing) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => parseLine(l, defaultCh, existing));
}
