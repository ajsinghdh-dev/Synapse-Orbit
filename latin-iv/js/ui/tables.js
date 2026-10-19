// Paradigm tables used by Study, Reference and the labs.
import { BY_ID } from '../data/lexicon.js';
import { conjugate, declineNoun, declineAdj, CASES, CASE_NAME, NUMS, PERSONS } from '../core/latin.js';
import { esc } from './util.js';

const CN = { nom: 'Nominative', gen: 'Genitive', dat: 'Dative', acc: 'Accusative', abl: 'Ablative', voc: 'Vocative' };
const PL = ['1st', '2nd', '3rd'];

function split(form, stemLen) { return `<span class="st">${esc(form.slice(0, stemLen))}</span><span class="end">${esc(form.slice(stemLen))}</span>`; }

export function verbTable(ids) {
  const vs = ids.map((i) => BY_ID[i]);
  const ps = vs.map(conjugate);
  return `<div class="tscroll"><table class="ptable"><thead><tr><th></th>${vs.map((v) => `<th colspan="2"><span class="la">${esc(v.pp[0])}, ${esc(v.pp[1])}</span></th>`).join('')}</tr><tr><th></th>${vs.map(() => '<th>Singular</th><th>Plural</th>').join('')}</tr></thead><tbody>${[0, 1, 2].map((r) => `<tr><th>${PL[r]} person</th>${vs.map((v, i) => [r, r + 3].map((idx) => `<td><span class="la">${v.irreg ? esc(ps[i].ind[idx]) : split(ps[i].ind[idx], ps[i].base.length)}</span></td>`).join('')).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function verbFormsTable(ids) {
  return `<div class="tscroll"><table class="ptable"><thead><tr><th>Verb</th><th>Infinitive</th><th>Sg. imperative</th><th>Pl. imperative</th><th>2nd pl. indicative</th></tr></thead><tbody>${ids.map((i) => { const v = BY_ID[i], p = conjugate(v); return `<tr><th><span class="la">${esc(v.pp[0])}</span></th><td class="la">${esc(p.inf)}</td><td class="la">${esc(p.impSg)}</td><td class="la">${esc(p.impPl)}</td><td class="la">${esc(p.ind[4])}</td></tr>`; }).join('')}</tbody></table></div>`;
}
export function sumTable() {
  const p = conjugate(BY_ID.sum);
  return `<div class="tscroll"><table class="ptable"><thead><tr><th></th><th>Singular</th><th>Plural</th></tr></thead><tbody>${[0, 1, 2].map((r) => `<tr><th>${PL[r]} person</th><td class="la">${esc(p.ind[r])}</td><td class="la">${esc(p.ind[r + 3])}</td></tr>`).join('')}</tbody></table></div><p class="small muted mt1">Infinitive: <span class="la">esse</span> · principal parts <span class="la">sum, esse, fuī, futūrus</span></p>`;
}
function stemOf(n) { return n.type === 'er' ? n.stem : n.type === 'a' ? n.la.slice(0, -1) : n.la.slice(0, -2); }
export function declTable(nounIds, { split: sp = true } = {}) {
  const ns = nounIds.map((i) => BY_ID[i]);
  const ds = ns.map(declineNoun);
  return `<div class="tscroll"><table class="ptable"><thead><tr><th></th>${ns.map((n) => `<th colspan="2"><span class="la">${esc(n.la)}, ${esc(n.gen)}</span> <span class="tiny">${n.gender === 'mf' ? 'm./f.' : n.gender}.</span></th>`).join('')}</tr><tr><th></th>${ns.map(() => '<th>Singular</th><th>Plural</th>').join('')}</tr></thead><tbody>${CASES.map((c) => `<tr><th>${CN[c]}</th>${ns.map((n, i) => NUMS.map((num) => { const f = ds[i][num][c][0]; const st = stemOf(n); const ok = sp && f.startsWith(st); return `<td><span class="la">${ok ? split(f, st.length) : esc(f)}</span></td>`; }).join('')).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function adjTable(id, { all = true } = {}) {
  const a = BY_ID[id]; const d = declineAdj(a);
  const gens = all ? [['m', 'Masculine'], ['f', 'Feminine'], ['n', 'Neuter']] : [['f', 'Feminine']];
  return `<div class="tscroll"><table class="ptable"><thead><tr><th></th>${gens.map(([, l]) => `<th colspan="2">${l}</th>`).join('')}</tr><tr><th></th>${gens.map(() => '<th>Sg.</th><th>Pl.</th>').join('')}</tr></thead><tbody>${CASES.map((c) => `<tr><th>${CN[c].slice(0, 3)}.</th>${gens.map(([g]) => NUMS.map((n) => `<td class="la">${esc(d[g][n][c][0])}</td>`).join('')).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function casesTable() {
  const rows = [['Nominative', 'subject; predicate nominative', 'Puella rosam amat. / Poēta est vir.'], ['Genitive', 'possession — “of”', 'fāma poētae “the poet’s fame”'], ['Dative', 'indirect object — “to, for”', 'Dat puellae rosam “gives a rose to the girl”'], ['Accusative', 'direct object; after in (into)', 'Videt puellam “sees the girl”; in agrum “into the field”'], ['Ablative', 'with, by, from, in — often with prepositions', 'sine pecūniā, in agrō, dē vītā'], ['Vocative', 'direct address', 'Ō fīlī, vidē! “O son, look!”']];
  return `<div class="tscroll"><table class="ptable"><thead><tr><th>Case</th><th>Main functions</th><th>Example</th></tr></thead><tbody>${rows.map((r) => `<tr><th>${r[0]}</th><td>${esc(r[1])}</td><td class="la">${esc(r[2])}</td></tr>`).join('')}</tbody></table></div>`;
}

export const TABLES = {
  'verbs-ind': () => verbTable(['amo', 'moneo']),
  'verbs-forms': () => verbFormsTable(['amo', 'laudo', 'moneo', 'video']),
  'decl-1': () => declTable(['puella', 'nauta']),
  cases: casesTable,
  'adj-bonus': () => adjTable('bonus', { all: false }),
  'decl-2m': () => declTable(['amicus', 'filius']),
  'decl-er': () => declTable(['puer', 'ager']),
  'decl-2n': () => declTable(['bellum', 'donum']),
  sum: sumTable,
  'adj-all': () => adjTable('bonus'),
};
void PERSONS; void CASE_NAME;
