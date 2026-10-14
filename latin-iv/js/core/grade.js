// Answer grading. Pure functions.
import { strip, canon, CASE_NAME, NUM_NAME, GENDER_NAME, describe } from './latin.js';
import { analyzer } from './corpus.js';
import { BY_ID } from '../data/lexicon.js';
import { checkKeywords } from './sentences.js';

export function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// ------------------------------------------------------------ Latin (single form)
/**
 * Compare a typed Latin form with the accepted forms.
 *  strict:false (default) — a missing macron is forgiven UNLESS it would turn the answer into a
 *  different real form (puella vs puellā), in which case the answer is wrong and flagged macronOnly.
 *  strict:true — macrons are required.
 */
export function matchLatin(input, accepts, { strict = false } = {}) {
  const typed = canon(input).normalize('NFC');
  if (!typed) return { ok: false, empty: true };
  const acc = accepts.map((a) => a.normalize('NFC').toLowerCase());
  if (acc.includes(typed)) return { ok: true, form: typed };
  const s = strip(typed);
  const hit = acc.find((a) => strip(a) === s);
  if (hit) {
    // is the typed string itself a different real word form? (then it is a wrong answer, not a missing macron)
    const exact = analyzer.analyze(typed);
    if (exact.length) return { ok: false, macronOnly: true, wrongForm: true, expected: hit, note: `“${typed}” is a real form, but not the one asked for — the macron changes the form.` };
    if (strict) return { ok: false, macronOnly: true, expected: hit, note: 'Macrons are required in strict mode.' };
    const ambiguous = analyzer.variants(s).filter((v) => !acc.includes(v.toLowerCase())).length > 0;
    if (ambiguous) return { ok: false, macronOnly: true, expected: hit, note: `Macrons matter here: ${strip(hit)} could be several forms. Write ${hit}.` };
    return { ok: true, form: hit, macronOmitted: true, note: `Accepted without macrons — the full form is ${hit}.` };
  }
  return { ok: false, close: acc.some((a) => lev(strip(a), s) <= 1), expected: acc[0] };
}

// ------------------------------------------------------------ English (vocabulary glosses)
export function normEn(s) {
  return String(s).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^(to|the|a|an)\s+/, '').trim();
}
export function matchEnglish(input, glosses) {
  const t = normEn(input);
  if (!t) return { ok: false, empty: true };
  const g = glosses.map(normEn);
  if (g.includes(t)) return { ok: true };
  // "love, like" / "love or like": correct if any listed part is an accepted meaning
  const parts = String(input).split(/\s*[,/;]\s*|\s+or\s+/).map(normEn).filter(Boolean);
  if (parts.length > 1 && parts.some((p) => g.includes(p))) return { ok: true };
  const typo = g.find((x) => x.length >= 6 && lev(x, t) <= 1);
  if (typo) return { ok: true, typo: true, note: `Spelling: ${typo}` };
  return { ok: false };
}

// ------------------------------------------------------------ English → Latin composition
export function parseSlot(spec) {
  const [lemma, rest] = spec.split(':');
  const slot = { spec, lemma };
  if (!rest) return slot;
  const bits = rest.split('.');
  if (/^[123]$/.test(bits[0])) { slot.mood = 'ind'; slot.person = +bits[0]; slot.number = bits[1]; }
  else if (bits[0] === 'imp') { slot.mood = 'imp'; slot.number = bits[1]; }
  else if (bits[0] === 'inf') { slot.mood = 'inf'; }
  else { slot.case = bits[0]; slot.number = bits[1]; if (bits[2]) slot.gender = bits[2]; }
  return slot;
}
function slotMatches(slot, a) {
  if (a.lemma !== slot.lemma) return false;
  for (const k of ['case', 'number', 'gender', 'person', 'mood']) if (slot[k] != null && a[k] !== slot[k]) return false;
  return true;
}
export function describeSlot(slot) {
  const lex = BY_ID[slot.lemma];
  const bits = [];
  if (slot.mood === 'ind') bits.push(`${['', '1st', '2nd', '3rd'][slot.person]} person ${NUM_NAME[slot.number]}`);
  else if (slot.mood === 'imp') bits.push(`${NUM_NAME[slot.number]} imperative`);
  else if (slot.mood === 'inf') bits.push('infinitive');
  else if (slot.case) bits.push(`${CASE_NAME[slot.case]} ${NUM_NAME[slot.number]}${slot.gender ? ' ' + GENDER_NAME[slot.gender] : ''}`);
  return `${lex.la} (${lex.en[0]}) — ${bits.join(', ') || lex.pos}`;
}

export function gradeCompose(input, slotSpecs, { strict = false } = {}) {
  const slots = slotSpecs.map(parseSlot);
  const words = String(input || '').normalize('NFC').toLowerCase().replace(/[.,;:!?"“”()]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return { status: 'incorrect', correct: false, score: 0, empty: true, messages: ['Nothing was entered.'], slots: [], extras: [] };
  const toks = words.map((w) => {
    const exact = analyzer.analyze(w);
    if (exact.length) return { w, cands: exact, loose: false };
    return { w, cands: analyzer.analyzeLoose(w), loose: true };
  });
  // best matching slots→tokens (small search)
  let best = { n: -1, map: [] };
  const used = new Array(toks.length).fill(false);
  const map = new Array(slots.length).fill(-1);
  (function rec(i, n) {
    if (n + (slots.length - i) <= best.n) return;
    if (i === slots.length) { if (n > best.n) best = { n, map: [...map] }; return; }
    for (let t = 0; t < toks.length; t++) {
      if (used[t]) continue;
      if (toks[t].cands.some((a) => slotMatches(slots[i], a))) { used[t] = true; map[i] = t; rec(i + 1, n + 1); used[t] = false; map[i] = -1; }
    }
    rec(i + 1, n);
  })(0, 0);

  const messages = [];
  const detail = slots.map((slot, i) => {
    const t = best.map[i];
    if (t >= 0) {
      const tok = toks[t];
      if (tok.loose) {
        const typedExactForms = slot; void typedExactForms;
        // token has no exact analysis → macron missing or wrong
        const matching = tok.cands.filter((a) => slotMatches(slot, a));
        const targetForms = new Set(matching.map((a) => a.form.toLowerCase()));
        const others = analyzer.variants(tok.w).filter((v) => !targetForms.has(v.toLowerCase()));
        const target = [...targetForms][0];
        if (strict) { messages.push(`Macrons required: write ${target}, not ${tok.w}.`); return { slot, ok: false, token: tok.w, macron: true, target }; }
        if (others.length) { messages.push(`Macrons matter: “${tok.w}” could be ${[target, ...others].join(' / ')}. Write ${target}.`); return { slot, ok: false, token: tok.w, macron: true, target }; }
        return { slot, ok: true, token: tok.w, macronOmitted: true, target };
      }
      return { slot, ok: true, token: tok.w };
    }
    // unmatched: find a token with the right lemma but wrong features
    const near = toks.findIndex((tk, ti) => !best.map.includes(ti) && tk.cands.some((a) => a.lemma === slot.lemma));
    if (near >= 0) {
      const a = toks[near].cands[0];
      messages.push(`You wrote “${toks[near].w}” (${describe(a)}), but this sentence needs ${describeSlot(slot)}.`);
      return { slot, ok: false, token: toks[near].w, wrongForm: true };
    }
    messages.push(`Missing: ${describeSlot(slot)}.`);
    return { slot, ok: false, token: null, missing: true };
  });
  const extras = toks.filter((_, ti) => !best.map.includes(ti)).filter((tk) => !detail.some((d) => d.token === tk.w && !d.ok && d.wrongForm));
  for (const e of extras) {
    if (!e.cands.length) messages.push(`“${e.w}” is not a Latin form in the Chapters 1–4 vocabulary — check the spelling.`);
    else messages.push(`Extra word: “${e.w}” is not needed for this sentence.`);
  }
  const okCount = detail.filter((d) => d.ok).length;
  const correct = okCount === slots.length && extras.length === 0;
  return { status: correct ? 'correct' : okCount > 0 ? 'partial' : 'incorrect', correct, score: correct ? 1 : okCount / slots.length * 0.5 * (extras.length ? 0.9 : 1), slots: detail, extras: extras.map((e) => e.w), messages, macronOnly: detail.some((d) => d.macron) && detail.every((d) => d.ok || d.macron) };
}

// ------------------------------------------------------------ dispatcher
export function gradeQuestion(q, answer, settings = {}) {
  const strict = settings.macronMode === 'strict';
  switch (q.type) {
    case 'mcq': {
      const correct = answer === q.answer;
      return { status: correct ? 'correct' : 'incorrect', correct, score: correct ? 1 : 0, expected: q.answer };
    }
    case 'typed': {
      const r = q.lang === 'en' ? matchEnglish(answer, q.accept) : matchLatin(answer, q.accept, { strict });
      return { status: r.ok ? 'correct' : 'incorrect', correct: !!r.ok, score: r.ok ? 1 : 0, expected: q.accept[0], macronOnly: !!r.macronOnly, note: r.note, close: r.close, empty: r.empty };
    }
    case 'compose': {
      const r = gradeCompose(answer, q.slots, { strict });
      return { ...r, expected: q.ref };
    }
    case 'translate': {
      const kw = checkKeywords(q.sent, answer);
      return { status: 'selfassess', correct: null, score: null, expected: q.sent.en, keywords: kw };
    }
    default: throw new Error('unknown question type ' + q.type);
  }
}

/** Convert a self-assessment rating (0 wrong, 0.5 partly, 1 correct) into a final result. */
export function finalizeSelf(res, rating) {
  return { ...res, status: rating >= 1 ? 'correct' : rating > 0 ? 'partial' : 'incorrect', correct: rating >= 0.99, score: rating, selfRated: true };
}
