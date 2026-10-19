// Sentence-annotation parser. A sentence is authored as a compact token string:
//   "puella/S agricolam/O amat/V"          raw/ROLE[/feat]
// Roles: S subject · V finite verb · O direct object · I indirect object · G genitive modifier ·
//        A adjective modifying a noun · N predicate nominative/adjective · AP apposition ·
//        P preposition · PO object of preposition · VOC vocative · INF complementary infinitive ·
//        C conjunction · D adverb (nōn)
// The parser resolves each token to ONE contextual analysis and reports problems, so the data file
// can be validated by tests (every word is in the lexicon, forms are real, chapters are respected).

import { genders, strip, CASE_NAME, NUM_NAME, GENDER_NAME } from './latin.js';

export const ROLE_LABEL = {
  S: 'Subject', V: 'Main verb', O: 'Direct object', I: 'Indirect object', G: 'Genitive (“of”)',
  A: 'Adjective', N: 'Predicate nominative / adjective', AP: 'Apposition', P: 'Preposition',
  PO: 'Object of preposition', VOC: 'Vocative (address)', INF: 'Complementary infinitive', C: 'Conjunction', D: 'Adverb', X: 'Other word',
};
const ROLE_CASE = { S: 'nom', N: 'nom', O: 'acc', I: 'dat', G: 'gen', VOC: 'voc' };
const NOMINAL = new Set(['S', 'N', 'O', 'I', 'G', 'AP', 'PO', 'VOC']);

export function wordOf(raw) { return raw.replace(/[,.;:!?]/g, ''); }

function dedupe(list) {
  // collapse duplicate gender readings of common-gender nouns into one analysis with `genders`
  const out = [];
  for (const a of list) {
    const key = [a.lemma, a.case, a.number, a.pos, a.mood, a.person].join('|');
    const hit = out.find((o) => o.k === key && a.pos === 'noun');
    if (hit) { hit.a.genders.push(a.gender); continue; }
    out.push({ k: key, a: { ...a, genders: a.pos === 'noun' ? [a.gender] : undefined } });
  }
  return out.map((o) => o.a);
}

/** Parse one sentence definition → { tokens:[{raw,word,role,analysis,head,...}], problems:[] } */
export function parseSentence(def, analyzer, byId) {
  const problems = [];
  const toks = def.t.split(/\s+/).map((spec) => {
    const [raw, role, feat] = spec.split('/');
    return { raw, word: wordOf(raw), role, feat, analysis: null, head: null };
  });
  // pass 1: nouns/verbs/function words
  toks.forEach((tk, i) => {
    const cands = dedupe(analyzer.analyze(tk.word));
    if (!cands.length) { problems.push(`token “${tk.word}” not in lexicon`); return; }
    const r = tk.role;
    if (r === 'V' || r === 'INF') {
      const want = r === 'V' ? (a) => a.mood === 'ind' || a.mood === 'imp' : (a) => a.mood === 'inf';
      const c = cands.filter((a) => a.pos === 'verb' && want(a));
      if (c.length !== 1) problems.push(`token “${tk.word}” as ${r}: ${c.length} verb analyses`);
      else tk.analysis = c[0];
    } else if (r === 'P') {
      const c = cands.filter((a) => a.pos === 'prep');
      if (c.length !== 1) problems.push(`token “${tk.word}” as P: not a preposition`); else tk.analysis = c[0];
    } else if (r === 'C') {
      const c = cands.filter((a) => a.pos === 'conj');
      if (c.length !== 1) problems.push(`token “${tk.word}” as C`); else tk.analysis = c[0];
    } else if (r === 'X') {
      const c = cands.filter((a) => ['pron', 'indecl', 'interj'].includes(a.pos));
      if (c.length !== 1) problems.push(`token “${tk.word}” as X`); else tk.analysis = c[0];
    } else if (r === 'D') {
      const c = cands.filter((a) => a.pos === 'adv');
      if (c.length !== 1) problems.push(`token “${tk.word}” as D`); else tk.analysis = c[0];
    } else if (NOMINAL.has(r)) {
      let kase = ROLE_CASE[r];
      if (r === 'PO') {
        let j = i - 1; while (j >= 0 && toks[j].role !== 'P') j--;
        const prep = j >= 0 ? byId[toks[j].analysis?.lemma] : null;
        if (!prep) { problems.push(`PO “${tk.word}” has no preceding preposition`); return; }
        tk.prep = j;
        kase = tk.feat || (prep.governs === 'abl/acc' ? null : prep.governs);
        if (!kase) { problems.push(`PO “${tk.word}” after ${prep.la} needs an explicit case feat`); return; }
        if (prep.governs !== 'abl/acc' && prep.governs !== kase) problems.push(`PO “${tk.word}”: ${prep.la} takes ${prep.governs}, not ${kase}`);
      }
      if (r === 'AP') { kase = tk.feat; if (!kase) { problems.push(`AP “${tk.word}” needs a case feat`); return; } }
      const c = cands.filter((a) => (a.pos === 'noun' || a.pos === 'adj') && a.case === kase);
      // the same spelling can be a noun or an adjective (bellum “war” / bellum “pretty”): a nominal slot prefers the noun
      // unless the annotation says /adj
      let cc = c;
      if (tk.feat === 'adj') cc = c.filter((a) => a.pos === 'adj');
      else if (c.some((a) => a.pos === 'noun') && c.some((a) => a.pos === 'adj') && r !== 'N') cc = c.filter((a) => a.pos === 'noun');
      if (cc.length === 0) problems.push(`token “${tk.word}” as ${r}: no ${kase} analysis`);
      tk.cands = cc;
      if (cc.length === 1) tk.analysis = cc[0];
    } else if (r === 'A') {
      tk.cands = cands.filter((a) => a.pos === 'adj');
      if (!tk.cands.length) problems.push(`token “${tk.word}” as A: not an adjective`);
    } else problems.push(`unknown role ${r}`);
  });
  // pass 2: resolve ambiguous nominals (predicate / substantive) against the subject
  toks.forEach((tk, i) => {
    if (tk.analysis || !tk.cands || tk.role === 'A') return;
    // nearest preceding subject (so each clause of a compound sentence agrees with its own subject)
    const subj = [...toks.slice(0, i)].reverse().find((x) => x.role === 'S' && x.analysis) || toks.find((x) => x.role === 'S' && x.analysis);
    let c = tk.cands;
    if (tk.role === 'N' && subj) {
      c = c.filter((a) => a.number === subj.analysis.number && (a.pos !== 'adj' || (subj.analysis.genders || [subj.analysis.gender]).includes(a.gender)));
    }
    if (c.length === 1) tk.analysis = c[0];
    else problems.push(`token “${tk.word}” as ${tk.role}: ${c.length} contextual analyses (${c.map((a) => a.case + a.number + (a.gender || '')).join(',')})`);
  });
  // pass 3: adjectives attach to the nearest agreeing nominal
  toks.forEach((tk, i) => {
    if (tk.role !== 'A' || !tk.cands) return;
    let best = null;
    toks.forEach((h, j) => {
      if (j === i || !h.analysis || h.analysis.pos !== 'noun') return;
      const hs = h.analysis.genders || [h.analysis.gender];
      const ok = tk.cands.find((a) => a.case === h.analysis.case && a.number === h.analysis.number && hs.includes(a.gender));
      if (!ok) return;
      const dist = Math.abs(i - j), pref = j < i ? 0 : 0.5;
      if (!best || dist + pref < best.score) best = { j, ok, score: dist + pref };
    });
    if (!best) problems.push(`adjective “${tk.word}” has no agreeing noun`);
    else { tk.analysis = best.ok; tk.head = best.j; }
  });
  // AP heads: nearest preceding noun with same case/number
  toks.forEach((tk, i) => {
    if (tk.role !== 'AP' || !tk.analysis) return;
    for (let j = i - 1; j >= 0; j--) {
      const h = toks[j];
      if (h.analysis?.pos === 'noun' && h.analysis.case === tk.analysis.case && h.role !== 'AP' && h.role !== 'G') { tk.head = j; break; }
    }
    if (tk.head == null) problems.push(`apposition “${tk.word}” has no head`);
  });
  // PO ↔ preposition links
  toks.forEach((tk) => { if (tk.role === 'PO' && tk.prep == null) tk.prep = null; });

  // agreement checks
  const subjects = toks.filter((t) => t.role === 'S' && t.analysis);
  const verbs = toks.filter((t) => t.role === 'V' && t.analysis?.mood === 'ind');
  const hasConj = toks.some((t) => t.role === 'C');
  if (subjects.length === 1 && verbs.length === 1 && !hasConj && subjects[0].analysis.number !== verbs[0].analysis.number) problems.push('subject/verb number mismatch');
  if (subjects.length === 1 && verbs.length === 1 && !hasConj && verbs[0].analysis.person !== 3) problems.push('3rd-person subject expected');

  // surface string
  const surf = toks.map((t) => t.raw).join(' ');
  const p = def.p ?? (toks.some((t) => t.role === 'V' && t.analysis?.mood === 'imp') ? '!' : '.');
  const la = surf.charAt(0).toUpperCase() + surf.slice(1) + p;
  const ch = Math.max(0, ...toks.map((t) => t.analysis?.ch ?? 0));
  return { ...def, la, toks, problems, needsCh: ch };
}

/** Describe the contextual analysis of one token for word-by-word display. */
export function tokenGloss(tk, byId) {
  const a = tk.analysis; if (!a) return { form: tk.word, lemma: '?', gloss: '', desc: '' };
  const lex = byId[a.lemma];
  let desc = '';
  if (a.pos === 'verb') {
    if (a.mood === 'ind') desc = `${['', '1st', '2nd', '3rd'][a.person]} ${NUM_NAME[a.number]} present active indicative`;
    else if (a.mood === 'imp') desc = `${NUM_NAME[a.number]} imperative`;
    else desc = 'present active infinitive';
  } else if (a.pos === 'noun' || a.pos === 'adj') {
    const g = a.pos === 'noun' ? (a.genders || [a.gender]).map((x) => GENDER_NAME[x]).join('/') : GENDER_NAME[a.gender];
    desc = `${CASE_NAME[a.case]} ${NUM_NAME[a.number]} ${g}`;
  } else desc = lex.pos;
  return { form: tk.word, lemma: lex.pp ? lex.pp.slice(0, 3).join(', ') : lex.pos === 'noun' ? `${lex.la}, ${lex.gen}` : lex.pos === 'adj' ? `${lex.la}, ${lex.f}, ${lex.n}` : lex.la, gloss: lex.en.join(', '), desc, lex };
}

export function buildKeyRegexes(keys) {
  return (keys || []).map((k) => {
    const i = k.indexOf(':');
    return { role: k.slice(0, i), src: k.slice(i + 1), re: new RegExp('\\b(?:' + k.slice(i + 1) + ')', 'i') };
  });
}

/** Heuristic keyword check for a free-text English translation. Returns what was/wasn't found. */
export function checkKeywords(sentence, text) {
  const keys = buildKeyRegexes(sentence.k);
  const used = new Set();
  const lowered = String(text || '');
  const found = keys.map((k, idx) => {
    const m = lowered.match(k.re);
    if (m) used.add(idx);
    return { ...k, idx, ok: !!m, at: m ? m.index : -1 };
  });
  const S = found.find((f) => f.role === 'S' && f.ok), O = found.find((f) => f.role === 'O' && f.ok);
  const reversed = !!(S && O && S.at > O.at && S.idx < O.idx);
  return { found, ok: found.filter((f) => f.ok).length, total: found.length, reversed, empty: !lowered.trim() };
}

export { strip };
