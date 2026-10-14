// Builds the parsed sentence corpus + shared analyzer from the data files.
import { LEXICON, BY_ID } from '../data/lexicon.js';
import { SENTENCE_DEFS, COMPOSE_DEFS } from '../data/sentences.js';
import { buildAnalyzer } from './latin.js';
import { parseSentence } from './sentences.js';

export const analyzer = buildAnalyzer(LEXICON);
export const SENTENCES = SENTENCE_DEFS.map((d, i) => {
  const s = parseSentence(d, analyzer, BY_ID);
  s.id = `s${d.ch}-${String(i + 1).padStart(2, '0')}`;
  return s;
});
export const COMPOSE = COMPOSE_DEFS.map((d, i) => ({ ...d, id: `e${d.ch}-${String(i + 1).padStart(2, '0')}` }));
export const SENT_BY_ID = Object.fromEntries(SENTENCES.map((s) => [s.id, s]));
