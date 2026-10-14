// LATIN IV — morphology engine for Wheelock's Latin Chapters 1–4.
// Pure functions only (no DOM, no storage) so it can be unit-tested in Node.

export const CASES = ['nom', 'gen', 'dat', 'acc', 'abl', 'voc'];
export const NUMS = ['sg', 'pl'];
export const CASE_NAME = { nom: 'nominative', gen: 'genitive', dat: 'dative', acc: 'accusative', abl: 'ablative', voc: 'vocative' };
export const NUM_NAME = { sg: 'singular', pl: 'plural' };
export const GENDER_NAME = { m: 'masculine', f: 'feminine', n: 'neuter' };
export const PERSON_NAME = { 1: '1st', 2: '2nd', 3: '3rd' };
export const PERSONS = [[1, 'sg'], [2, 'sg'], [3, 'sg'], [1, 'pl'], [2, 'pl'], [3, 'pl']];

/** Remove macrons (and any other combining marks); result is NFC. */
export function strip(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}
/** Canonical comparison form: NFC, lower-case, trimmed, single-spaced, edge punctuation removed. */
export function canon(s) {
  return String(s).normalize('NFC').toLowerCase().replace(/[.,;:!?"“”()]/g, ' ').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------- endings
const ENDINGS = {
  a: { sg: ['a', 'ae', 'ae', 'am', 'ā', 'a'], pl: ['ae', 'ārum', 'īs', 'ās', 'īs', 'ae'] },
  us: { sg: ['us', 'ī', 'ō', 'um', 'ō', 'e'], pl: ['ī', 'ōrum', 'īs', 'ōs', 'īs', 'ī'] },
  er: { sg: [null, 'ī', 'ō', 'um', 'ō', null], pl: ['ī', 'ōrum', 'īs', 'ōs', 'īs', 'ī'] },
  um: { sg: ['um', 'ī', 'ō', 'um', 'ō', 'um'], pl: ['a', 'ōrum', 'īs', 'a', 'īs', 'a'] },
};

/** Declension-type of a noun lexeme: 'a' | 'us' | 'ius' | 'er' | 'um' | 'ium'. */
function nounShape(lex) {
  switch (lex.type) {
    case 'a': return { end: ENDINGS.a, base: lex.la.slice(0, -1) };
    case 'us': return { end: ENDINGS.us, base: lex.la.slice(0, -2) };
    case 'ius': return { end: ENDINGS.us, base: lex.la.slice(0, -2) };
    case 'er': return { end: ENDINGS.er, base: lex.stem };
    case 'um': return { end: ENDINGS.um, base: lex.la.slice(0, -2) };
    case 'ium': return { end: ENDINGS.um, base: lex.la.slice(0, -2) };
    default: throw new Error('unknown noun type ' + lex.type + ' for ' + lex.la);
  }
}

/** Build {sg:{nom:[…]…},pl:{…}} — each cell is an array of accepted forms, primary first. */
function declineWith(lex, shape, nomForm) {
  const out = { sg: {}, pl: {} };
  for (const num of NUMS) {
    CASES.forEach((c, i) => {
      let e = shape.end[num][i];
      let forms;
      if (e === null) forms = [nomForm]; // -er nominative / vocative
      else forms = [shape.base + e];
      out[num][c] = forms;
    });
  }
  // -ius / -ium: genitive singular may be contracted (fīlī / gladī); fīlius has voc. fīlī.
  if (lex.type === 'ius' || lex.type === 'ium') {
    const full = shape.base + 'ī';
    const contracted = shape.base.slice(0, -1) + 'ī';
    out.sg.gen = lex.contractGen ? [contracted, full] : [full, contracted];
    if (lex.type === 'ius' && lex.contractGen) out.sg.voc = [contracted];
  }
  return out;
}

export function declineNoun(lex) {
  return declineWith(lex, nounShape(lex), lex.la);
}
/** Accepted forms for one cell of a noun paradigm. */
export function nounForm(lex, c, n) {
  let f = declineNoun(lex)[n][c];
  // fīlia: dative/ablative plural fīliābus (older/distinguishing form) alongside fīliīs
  if (lex.altDatAblPl && n === 'pl' && (c === 'dat' || c === 'abl')) f = [lex.altDatAblPl, ...f];
  return f;
}

/** Adjective paradigm → {m, f, n} each shaped like a noun paradigm. */
export function declineAdj(lex) {
  const type = lex.adjType; // 'us' | 'er0' (miser) | 'er1' (pulcher)
  const mk = (typeKey, nomForm, base, stem) => declineWith({ type: typeKey, stem, la: nomForm }, { end: ENDINGS[typeKey], base: stem ?? base }, nomForm);
  if (type === 'us') {
    const base = lex.la.slice(0, -2);
    return {
      m: mk('us', lex.la, base),
      f: mk('a', base + 'a', base),
      n: mk('um', base + 'um', base),
    };
  }
  const stem = lex.stem; // 'miser' / 'pulchr'
  return {
    m: mk('er', lex.la, stem, stem),
    f: mk('a', stem + 'a', stem),
    n: mk('um', stem + 'um', stem),
  };
}
export function adjForm(lex, g, c, n) { return declineAdj(lex)[g][n][c]; }
export function adjFormsList(lex) { return [lex.la, lex.f, lex.n]; }

// ----------------------------------------------------------------- verbs
const SUM = { ind: ['sum', 'es', 'est', 'sumus', 'estis', 'sunt'], inf: 'esse' };

/** Present active system of a 1st/2nd conjugation verb (and dō, sum). */
export function conjugate(lex) {
  if (lex.irreg === 'sum') return { ind: SUM.ind, inf: SUM.inf, impSg: null, impPl: null, base: null, stem: null };
  const inf = lex.pp[1];
  const base = inf.slice(0, -3);
  if (lex.irreg === 'do') {
    // dō, dare: the a is SHORT except in dās and dā
    return { ind: ['dō', 'dās', 'dat', 'damus', 'datis', 'dant'], inf: 'dare', impSg: 'dā', impPl: 'date', base: 'd', stem: 'da' };
  }
  if (lex.conj === 1) {
    return { ind: [base + 'ō', base + 'ās', base + 'at', base + 'āmus', base + 'ātis', base + 'ant'], inf, impSg: base + 'ā', impPl: base + 'āte', base, stem: base + 'ā' };
  }
  if (lex.conj === 2) {
    return { ind: [base + 'eō', base + 'ēs', base + 'et', base + 'ēmus', base + 'ētis', base + 'ent'], inf, impSg: base + 'ē', impPl: base + 'ēte', base, stem: base + 'ē' };
  }
  throw new Error('unsupported conjugation for ' + lex.la);
}
export function verbEnding(lex, idx) {
  const p = conjugate(lex);
  if (lex.irreg === 'sum') return '';
  return p.ind[idx].slice(p.base.length);
}
/** Personal-ending (the "-ō/-m, -s, -t, -mus, -tis, -nt" set), for teaching. */
export const PERSONAL_ENDINGS = ['-ō (-m)', '-s', '-t', '-mus', '-tis', '-nt'];

// ------------------------------------------------------------- the index
/**
 * Build an analyzer over a lexicon. analyze(token) returns every analysis that matches
 * the (macron-sensitive) token; analyzeLoose(token) matches ignoring macrons.
 */
export function buildAnalyzer(lexicon) {
  const exact = new Map();
  const loose = new Map();
  const add = (form, a) => {
    const rec = { form, ...a };
    const k = form.normalize('NFC').toLowerCase();
    if (!exact.has(k)) exact.set(k, []);
    exact.get(k).push(rec);
    const s = strip(k);
    if (!loose.has(s)) loose.set(s, []);
    loose.get(s).push(rec);
  };
  for (const lex of lexicon) {
    const base = { lemma: lex.id, la: lex.la, pos: lex.pos, ch: lex.ch };
    if (lex.pos === 'verb') {
      const p = conjugate(lex);
      p.ind.forEach((f, i) => add(f, { ...base, mood: 'ind', tense: 'pres', voice: 'act', person: PERSONS[i][0], number: PERSONS[i][1] }));
      add(p.inf, { ...base, mood: 'inf', tense: 'pres', voice: 'act' });
      if (p.impSg) {
        add(p.impSg, { ...base, mood: 'imp', tense: 'pres', voice: 'act', number: 'sg' });
        add(p.impPl, { ...base, mood: 'imp', tense: 'pres', voice: 'act', number: 'pl' });
      }
    } else if (lex.pos === 'noun') {
      const par = declineNoun(lex);
      for (const n of NUMS) for (const c of CASES) {
        const forms = new Set(nounForm(lex, c, n));
        for (const f of forms) for (const g of genders(lex)) add(f, { ...base, case: c, number: n, gender: g, nounGender: lex.gender });
      }
      void par;
    } else if (lex.pos === 'adj') {
      const par = declineAdj(lex);
      for (const g of ['m', 'f', 'n']) for (const n of NUMS) for (const c of CASES) {
        for (const f of par[g][n][c]) {
          // the dictionary headword (masc. nom. sg.) is a citation form available from the lexeme's own chapter
          const cite = g === 'm' && n === 'sg' && (c === 'nom' || c === 'voc') && f === lex.la;
          add(f, { ...base, case: c, number: n, gender: g, ch: cite ? lex.ch : Math.max(lex.ch, g === 'm' ? 3 : g === 'n' ? 4 : 2) });
        }
      }
    } else {
      for (const f of [lex.la, ...(lex.forms || [])]) add(f, { ...base, governs: lex.governs });
    }
  }
  return {
    analyze: (t) => exact.get(String(t).normalize('NFC').toLowerCase()) || [],
    analyzeLoose: (t) => loose.get(strip(String(t).toLowerCase())) || [],
    /** all distinct accented spellings sharing this macron-less spelling */
    variants: (t) => [...new Set((loose.get(strip(String(t).toLowerCase())) || []).map((a) => a.form))],
  };
}

export function genders(lex) { return lex.gender === 'mf' ? ['m', 'f'] : [lex.gender]; }

/** Human description of an analysis, e.g. "accusative singular feminine". */
export function describe(a) {
  if (a.pos === 'noun') return `${CASE_NAME[a.case]} ${NUM_NAME[a.number]} (${GENDER_NAME[a.gender]})`;
  if (a.pos === 'adj') return `${CASE_NAME[a.case]} ${NUM_NAME[a.number]} ${GENDER_NAME[a.gender]}`;
  if (a.pos === 'verb') {
    if (a.mood === 'ind') return `${PERSON_NAME[a.person]} person ${NUM_NAME[a.number]}, present active indicative`;
    if (a.mood === 'imp') return `${NUM_NAME[a.number]} imperative, active`;
    return 'present active infinitive';
  }
  return a.pos;
}

/** Collapse analyses of one surface form into readable "possible case/number" pairs for nouns/adjs. */
export function caseNumberSet(analyses) {
  const set = new Set();
  for (const a of analyses) if (a.case) set.add(a.case + '.' + a.number);
  return [...set];
}
export function labelCN(cn) {
  const [c, n] = cn.split('.');
  return `${CASE_NAME[c]} ${NUM_NAME[n]}`;
}
