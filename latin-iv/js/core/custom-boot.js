// Runs BEFORE the question bank is built: merges the learner's own words and chapter corrections into the lexicon.
import { LEXICON, BY_ID } from '../data/lexicon.js';
try {
  const s = JSON.parse(localStorage.getItem('latin-iv:v1') || '{}');
  for (const w of s.customWords || []) { const i = LEXICON.findIndex((x) => x.id === w.id); if (i >= 0) LEXICON.splice(i, 1); LEXICON.push(w); BY_ID[w.id] = w; }
  for (const [id, ch] of Object.entries((s.settings && s.settings.chOverride) || {})) if (BY_ID[id] && [1, 2, 3, 4].includes(+ch)) BY_ID[id].ch = +ch;
} catch { /* no storage: built-in vocabulary only */ }
