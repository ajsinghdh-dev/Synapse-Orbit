// LATIN IV — vocabulary database for Wheelock's Latin (7th ed.), Chapters 1–6.
//
// Rebuilt to the chapter vocabulary lists of Wheelock's Latin, 7th edition (Chapters 1–6).
// PROVENANCE NOTE (also shown in the app, Reference ▸ Sources):
// The UVic Wheelock pages could not be fetched when this database was built (network access to
// hcmc.uvic.ca was blocked), so chapter assignment was written from the 7th-edition chapter
// structure as best known. Every entry carries conf:
//   'core'  — headword, forms and glosses are standard dictionary data AND the chapter is a
//             confident match to the Wheelock chapter list.
//   'check' — the Latin is correct, but the chapter placement (or an optional gloss) should be
//             confirmed against your own textbook's vocabulary list. Use Vocabulary ▸ Browse to
//             switch any word off; every quiz, mock and generator respects that choice.
// Principal parts: only dictionary-standard parts are stored. A fourth part of null means "not
// tested" (typically intransitive verbs) — it is never invented.

import { strip } from '../core/latin.js';

const mkId = (la) => strip(la).toLowerCase().replace(/[^a-z]/g, '');

// ---- verbs: [first, infinitive, perfect, supine|null, conj, meanings, chapter, conf, note]
// Wheelock lists the 4th principal part as the SUPINE (-tum), or the future active participle (-tūrum) when there is no supine.
const VERBS = [
  // Chapter 1
  ['amō', 'amāre', 'amāvī', 'amātum', 1, ['love', 'like'], 1, 'core', 'amābō tē = please'],
  ['cōgitō', 'cōgitāre', 'cōgitāvī', 'cōgitātum', 1, ['think', 'ponder', 'consider', 'plan'], 1, 'core'],
  ['dēbeō', 'dēbēre', 'dēbuī', 'dēbitum', 2, ['owe', 'ought', 'must', 'should'], 1, 'core', 'Often takes a complementary infinitive: dēbeō errāre = I ought to… / I must…'],
  ['dō', 'dare', 'dedī', 'datum', 1, ['give', 'offer'], 1, 'core', 'Irregular quantity: the a of dare/dat/damus/datis/dant is SHORT; only dās and dā are long. Perfect dedī.'],
  ['errō', 'errāre', 'errāvī', 'errātum', 1, ['wander', 'err', 'go astray', 'make a mistake', 'be mistaken'], 1, 'core'],
  ['laudō', 'laudāre', 'laudāvī', 'laudātum', 1, ['praise'], 1, 'core'],
  ['moneō', 'monēre', 'monuī', 'monitum', 2, ['remind', 'advise', 'warn'], 1, 'core'],
  ['salveō', 'salvēre', null, null, 2, ['be well', 'be in good health'], 1, 'core', 'salvē / salvēte = hello, greetings'],
  ['servō', 'servāre', 'servāvī', 'servātum', 1, ['save', 'preserve', 'keep', 'guard'], 1, 'core'],
  ['cōnservō', 'cōnservāre', 'cōnservāvī', 'cōnservātum', 1, ['preserve', 'conserve', 'maintain'], 1, 'core'],
  ['terreō', 'terrēre', 'terruī', 'territum', 2, ['frighten', 'terrify'], 1, 'core'],
  ['valeō', 'valēre', 'valuī', 'valitūrum', 2, ['be strong', 'have power', 'be well'], 1, 'core', 'valē / valēte = goodbye, farewell'],
  ['videō', 'vidēre', 'vīdī', 'vīsum', 2, ['see', 'observe', 'understand'], 1, 'core'],
  ['vocō', 'vocāre', 'vocāvī', 'vocātum', 1, ['call', 'summon'], 1, 'core'],
  // Chapter 3
  ['habeō', 'habēre', 'habuī', 'habitum', 2, ['have', 'hold', 'possess', 'consider', 'regard'], 3, 'core'],
  ['satiō', 'satiāre', 'satiāvī', 'satiātum', 1, ['satisfy', 'sate'], 3, 'core'],
  // Chapter 4
  ['iuvō', 'iuvāre', 'iūvī', 'iūtum', 1, ['help', 'aid', 'assist', 'please'], 4, 'core', 'Irregular perfect iūvī and supine iūtum.'],
  // Chapter 5
  ['adiuvō', 'adiuvāre', 'adiūvī', 'adiūtum', 1, ['aid', 'help', 'assist', 'encourage'], 5, 'core', 'A compound of iuvō: perfect adiūvī.'],
  ['maneō', 'manēre', 'mānsī', 'mānsum', 2, ['remain', 'stay', 'abide', 'continue'], 5, 'core'],
  ['remaneō', 'remanēre', 'remānsī', 'remānsum', 2, ['stay behind', 'remain', 'abide', 'continue'], 5, 'core'],
  ['superō', 'superāre', 'superāvī', 'superātum', 1, ['surpass', 'overcome', 'conquer', 'be above', 'have the upper hand'], 5, 'core'],
  // Chapter 6
  ['tolerō', 'tolerāre', 'tolerāvī', 'tolerātum', 1, ['bear', 'endure'], 6, 'core'],
];

// ---- nouns: [nom, gen, gender, type, stem|null, meanings, chapter, flags]
const NOUNS = [
  // Chapter 2
  ['fāma', 'fāmae', 'f', 'a', null, ['rumor', 'report', 'fame', 'reputation'], 2, {}],
  ['fōrma', 'fōrmae', 'f', 'a', null, ['form', 'shape', 'beauty'], 2, {}],
  ['fortūna', 'fortūnae', 'f', 'a', null, ['fortune', 'luck'], 2, {}],
  ['īra', 'īrae', 'f', 'a', null, ['anger', 'ire'], 2, {}],
  ['nauta', 'nautae', 'm', 'a', null, ['sailor'], 2, { anim: 1, note: 'Masculine noun of the 1st declension: it takes masculine adjectives.' }],
  ['patria', 'patriae', 'f', 'a', null, ['fatherland', 'native land', 'country'], 2, {}],
  ['pecūnia', 'pecūniae', 'f', 'a', null, ['money'], 2, {}],
  ['philosophia', 'philosophiae', 'f', 'a', null, ['philosophy'], 2, {}],
  ['poena', 'poenae', 'f', 'a', null, ['penalty', 'punishment'], 2, { note: 'poenās dare = to pay the penalty' }],
  ['poēta', 'poētae', 'm', 'a', null, ['poet'], 2, { anim: 1, note: 'Masculine noun of the 1st declension.' }],
  ['porta', 'portae', 'f', 'a', null, ['gate', 'entrance'], 2, {}],
  ['puella', 'puellae', 'f', 'a', null, ['girl'], 2, { anim: 1 }],
  ['rosa', 'rosae', 'f', 'a', null, ['rose'], 2, {}],
  ['sententia', 'sententiae', 'f', 'a', null, ['feeling', 'thought', 'opinion', 'vote', 'sentence'], 2, {}],
  ['vīta', 'vītae', 'f', 'a', null, ['life', 'mode of life'], 2, {}],
  // Chapter 3
  ['ager', 'agrī', 'm', 'er', 'agr', ['field', 'farm'], 3, { note: 'The -e- drops out of the stem: agr-.' }],
  ['agricola', 'agricolae', 'm', 'a', null, ['farmer'], 3, { anim: 1, note: 'Masculine noun of the 1st declension: agricola bonus.' }],
  ['amīcus', 'amīcī', 'm', 'us', null, ['friend'], 3, { anim: 1 }],
  ['amīca', 'amīcae', 'f', 'a', null, ['friend (female)'], 3, { anim: 1 }],
  ['fēmina', 'fēminae', 'f', 'a', null, ['woman'], 3, { anim: 1 }],
  ['fīlia', 'fīliae', 'f', 'a', null, ['daughter'], 3, { anim: 1, altDatAblPl: 'fīliābus', note: 'Dative/ablative plural fīliābus (to tell daughters from sons, fīliīs).' }],
  ['fīlius', 'fīliī', 'm', 'ius', null, ['son'], 3, { anim: 1, note: 'Vocative fīlī. The genitive is also found contracted as fīlī.' }],
  ['numerus', 'numerī', 'm', 'us', null, ['number'], 3, {}],
  ['populus', 'populī', 'm', 'us', null, ['people', 'nation'], 3, {}],
  ['puer', 'puerī', 'm', 'er', 'puer', ['boy'], 3, { anim: 1, note: 'The -e- stays: puer, puerī. Plural can mean “children”.' }],
  ['sapientia', 'sapientiae', 'f', 'a', null, ['wisdom'], 3, {}],
  ['vir', 'virī', 'm', 'er', 'vir', ['man', 'hero', 'husband'], 3, { anim: 1, note: 'Nominative vir has no -e- at all; stem vir-.' }],
  // Chapter 4
  ['bāsium', 'bāsiī', 'n', 'ium', null, ['kiss'], 4, {}],
  ['bellum', 'bellī', 'n', 'um', null, ['war'], 4, {}],
  ['cōnsilium', 'cōnsiliī', 'n', 'ium', null, ['plan', 'purpose', 'counsel', 'advice', 'judgment', 'wisdom'], 4, {}],
  ['cūra', 'cūrae', 'f', 'a', null, ['care', 'attention', 'caution', 'anxiety'], 4, {}],
  ['dōnum', 'dōnī', 'n', 'um', null, ['gift', 'present'], 4, {}],
  ['exitium', 'exitiī', 'n', 'ium', null, ['destruction', 'ruin'], 4, {}],
  ['magister', 'magistrī', 'm', 'er', 'magistr', ['teacher', 'schoolmaster', 'master'], 4, { anim: 1, note: 'The -e- drops out of the stem: magistr-.' }],
  ['magistra', 'magistrae', 'f', 'a', null, ['teacher (female)', 'schoolmistress', 'mistress'], 4, { anim: 1 }],
  ['mora', 'morae', 'f', 'a', null, ['delay'], 4, {}],
  ['oculus', 'oculī', 'm', 'us', null, ['eye'], 4, {}],
  ['officium', 'officiī', 'n', 'ium', null, ['duty', 'service'], 4, {}],
  ['ōtium', 'ōtiī', 'n', 'ium', null, ['leisure', 'peace'], 4, {}],
  ['perīculum', 'perīculī', 'n', 'um', null, ['danger', 'risk'], 4, {}],
  ['remedium', 'remediī', 'n', 'ium', null, ['cure', 'remedy'], 4, {}],
  // Chapter 5
  ['caelum', 'caelī', 'n', 'um', null, ['sky', 'heaven'], 5, {}],
  ['culpa', 'culpae', 'f', 'a', null, ['fault', 'blame'], 5, {}],
  ['glōria', 'glōriae', 'f', 'a', null, ['glory', 'fame'], 5, {}],
  ['verbum', 'verbī', 'n', 'um', null, ['word'], 5, {}],
  // Chapter 6
  ['īnsidiae', 'īnsidiārum', 'f', 'a', 'īnsidi', ['ambush', 'plot', 'treachery'], 6, { plOnly: 1, note: 'Plural only: īnsidiae, īnsidiārum. Translate as a singular in English (“a plot”).' }],
  ['liber', 'librī', 'm', 'er', 'libr', ['book'], 6, { note: 'The -e- drops out: librī. Do not confuse with līber, lībera, līberum (free).' }],
  ['locus', 'locī', 'm', 'us', null, ['place', 'passage in literature'], 6, { plNeut: 1, note: 'Masculine in the singular; the plural is usually neuter: loca, -ōrum (places).' }],
  ['morbus', 'morbī', 'm', 'us', null, ['disease', 'sickness'], 6, {}],
  ['tyrannus', 'tyrannī', 'm', 'us', null, ['absolute ruler', 'tyrant'], 6, { anim: 1 }],
  ['vitium', 'vitiī', 'n', 'ium', null, ['vice', 'fault', 'crime'], 6, {}],
];

// ---- adjectives: [m, f, n, type, stem|null, meanings, chapter, conf, extra]
const ADJS = [
  ['antīquus', 'antīqua', 'antīquum', 'us', null, ['ancient', 'old-time'], 2, 'core'],
  ['magnus', 'magna', 'magnum', 'us', null, ['large', 'great', 'important'], 2, 'core'],
  ['meus', 'mea', 'meum', 'us', null, ['my'], 2, 'core', { vocM: 'mī', note: 'Masculine vocative singular is mī: mī fīlī, “my son”.' }],
  ['multus', 'multa', 'multum', 'us', null, ['much', 'many'], 2, 'core'],
  ['tuus', 'tua', 'tuum', 'us', null, ['your (sing.)', 'yours'], 2, 'core', { note: '“your” when one person is addressed.' }],
  ['avārus', 'avāra', 'avārum', 'us', null, ['greedy', 'avaricious'], 3, 'core'],
  ['paucī', 'paucae', 'pauca', 'us', 'pauc', ['few', 'a few'], 3, 'core', { plOnly: true, note: 'Plural only: paucī, paucae, pauca.' }],
  ['Rōmānus', 'Rōmāna', 'Rōmānum', 'us', null, ['Roman'], 3, 'core'],
  ['bellus', 'bella', 'bellum', 'us', null, ['pretty', 'handsome', 'charming'], 4, 'core', { note: 'Do not confuse bellus (pretty) with bellum, -ī (war).' }],
  ['bonus', 'bona', 'bonum', 'us', null, ['good', 'kind'], 4, 'core'],
  ['hūmānus', 'hūmāna', 'hūmānum', 'us', null, ['human', 'humane', 'kind', 'refined'], 4, 'core'],
  ['malus', 'mala', 'malum', 'us', null, ['bad', 'wicked', 'evil'], 4, 'core'],
  ['parvus', 'parva', 'parvum', 'us', null, ['small', 'little'], 4, 'core'],
  ['stultus', 'stulta', 'stultum', 'us', null, ['foolish'], 4, 'core'],
  ['vērus', 'vēra', 'vērum', 'us', null, ['true', 'real', 'proper'], 4, 'core'],
  // Chapter 5 — adjectives in -er
  ['līber', 'lībera', 'līberum', 'er0', 'līber', ['free'], 5, 'core', { note: 'Keeps its -e-: līber, lībera, līberum. Substantive līberī = children (“the free ones” of a household).' }],
  ['noster', 'nostra', 'nostrum', 'er1', 'nostr', ['our', 'ours'], 5, 'core', { note: 'Drops its -e-: noster, nostra, nostrum.' }],
  ['pulcher', 'pulchra', 'pulchrum', 'er1', 'pulchr', ['beautiful', 'handsome', 'fine'], 5, 'core', { note: 'Drops its -e-: pulcher, pulchra, pulchrum.' }],
  ['sānus', 'sāna', 'sānum', 'us', null, ['sound', 'healthy', 'sane'], 5, 'core'],
  ['vester', 'vestra', 'vestrum', 'er1', 'vestr', ['your (pl.)', 'yours'], 5, 'core', { note: '“your” when more than one person is addressed. Drops its -e-.' }],
  // Chapter 6
  ['Graecus', 'Graeca', 'Graecum', 'us', null, ['Greek'], 6, 'core'],
  ['perpetuus', 'perpetua', 'perpetuum', 'us', null, ['perpetual', 'lasting', 'uninterrupted', 'continuous'], 6, 'core'],
  ['plēnus', 'plēna', 'plēnum', 'us', null, ['full', 'abundant', 'generous'], 6, 'core'],
  ['salvus', 'salva', 'salvum', 'us', null, ['safe', 'sound'], 6, 'core'],
  ['secundus', 'secunda', 'secundum', 'us', null, ['second', 'favorable'], 6, 'core'],
];

// ---- other words: [la, pos, meanings, chapter, extra]
const SMALL = [
  ['nihil', 'indecl', ['nothing'], 1, { conf: 'core', note: 'Indeclinable noun.' }],
  ['nōn', 'adv', ['not'], 1, { conf: 'core' }],
  ['quid', 'pron', ['what'], 1, { conf: 'core' }],
  ['saepe', 'adv', ['often'], 1, { conf: 'core' }],
  ['sī', 'conj', ['if'], 1, { conf: 'core' }],
  ['et', 'conj', ['and', 'even'], 2, { conf: 'core', note: 'et … et = both … and' }],
  ['sed', 'conj', ['but'], 2, { conf: 'core' }],
  ['ō', 'interj', ['O', 'oh'], 2, { conf: 'core', note: 'Used with the vocative: ō patria!' }],
  ['sine', 'prep', ['without'], 2, { governs: 'abl', conf: 'core' }],
  ['dē', 'prep', ['down from', 'from', 'concerning', 'about'], 3, { governs: 'abl', conf: 'core' }],
  ['in', 'prep', ['in', 'on', 'into', 'toward', 'against'], 3, { governs: 'abl/acc', note: 'in + ablative = in, on (place where). in + accusative = into, toward, against (motion).', conf: 'core' }],
  ['interim', 'adv', ['meanwhile'], 3, { conf: 'core' }],
  ['tum', 'adv', ['then', 'at that time', 'thereupon'], 3, { conf: 'core' }],
  // Chapter 5
  ['crās', 'adv', ['tomorrow'], 5, { conf: 'core' }],
  ['herī', 'adv', ['yesterday'], 5, { conf: 'core' }],
  ['igitur', 'adv', ['therefore', 'consequently'], 5, { conf: 'core', note: 'Postpositive: usually the second word in its clause.' }],
  ['-ne', 'particle', ['(asks a yes/no question)'], 5, { conf: 'core', note: 'Enclitic added to the first word: valēsne? “are you well?”' }],
  ['propter', 'prep', ['on account of', 'because of'], 5, { governs: 'acc', conf: 'core' }],
  ['quandō', 'adv', ['when'], 5, { conf: 'core', note: 'Interrogative and conjunction.' }],
  ['satis', 'indecl', ['enough', 'sufficient', 'sufficiently'], 5, { conf: 'core', note: 'Indeclinable noun, adjective or adverb.' }],
  // Chapter 6
  ['Cicerō', 'propn', ['Cicero'], 6, { conf: 'core', note: 'Cicerō, Cicerōnis, m. (Marcus Tullius Cicero). Third declension, which is taught in Chapter 7: not drilled here.' }],
  ['-que', 'conj', ['and (enclitic)'], 6, { conf: 'core', note: 'Enclitic: attached to the second word: puerī puellaeque “boys and girls”.' }],
  ['ibi', 'adv', ['there'], 6, { conf: 'core' }],
  ['nunc', 'adv', ['now', 'at present'], 6, { conf: 'core' }],
  ['quārē', 'adv', ['why', 'wherefore', 'therefore'], 6, { conf: 'core', note: 'Literally “because of which thing”.' }],
  ['ubi', 'adv', ['where', 'when'], 6, { conf: 'core' }],
];

const lex = [];
const taken = new Set();
const uid = (la, pos) => { let id = mkId(la); if (taken.has(id)) id += '_' + pos; taken.add(id); return id; };   // liber (book) vs līber (free)
for (const [la, inf, perf, p4, conj, en, ch, conf, note] of VERBS) {
  lex.push({ id: uid(la, 'verb'), la, pos: 'verb', conj, pp: [la, inf, perf, p4], en, ch, conf, note: note || '', irreg: la === 'dō' ? 'do' : undefined });
}
lex.push({ id: 'sum', la: 'sum', pos: 'verb', conj: 0, irreg: 'sum', pp: ['sum', 'esse', 'fuī', 'futūrum'], en: ['be', 'exist'], ch: 4, conf: 'core', note: 'Irregular. sum, es, est, sumus, estis, sunt. It links a subject to a predicate nominative or predicate adjective.' });
lex.push({ id: 'possum', la: 'possum', pos: 'verb', conj: 0, irreg: 'possum', pp: ['possum', 'posse', 'potuī', null], en: ['be able', 'can', 'could', 'have power'], ch: 6, conf: 'core', note: 'pot- + sum: pot- before a vowel (potes, poteram), pos- before s (possum, possunt). Takes a complementary infinitive.' });
for (const [la, gen, gender, type, stem, en, ch, o] of NOUNS) {
  lex.push({ id: uid(la, 'noun'), la, pos: 'noun', decl: type === 'a' ? 1 : 2, type, stem, gender, gen, en, ch, conf: o.conf || 'core', anim: !!o.anim, contractGen: !!o.contractGen, altDatAblPl: o.altDatAblPl, plOnly: !!o.plOnly, plNeut: !!o.plNeut, note: o.note || '', genAlt: [] });
}
for (const [m, f, n, t, stem, en, ch, conf, x = {}] of ADJS) {
  lex.push({ id: uid(m, 'adj'), la: m, f, n, pos: 'adj', adjType: t, stem, decl: '1/2', en, ch, conf, vocM: x.vocM, plOnly: !!x.plOnly, note: x.note || '' });
}
for (const [la, pos, en, ch, o] of SMALL) {
  lex.push({ id: uid(la, pos), la, pos, en, ch, conf: o.conf, governs: o.governs, forms: o.forms, note: o.note || '' });
}

export const LEXICON = lex;
export const BY_ID = Object.fromEntries(lex.map((w) => [w.id, w]));
export const POS_LABEL = { verb: 'verb', noun: 'noun', adj: 'adjective', prep: 'preposition', conj: 'conjunction', adv: 'adverb', interj: 'interjection', pron: 'pronoun', indecl: 'indeclinable', particle: 'particle', propn: 'proper name' };

export const CHAPTERS = [
  { n: 1, title: 'First & Second Conjugation Verbs', short: 'Verbs', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit01/index.htm' },
  { n: 2, title: 'First Declension', short: '1st Declension', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit02/index.htm' },
  { n: 3, title: 'Second Declension Masculine', short: '2nd Decl. Masc.', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit03/index.htm' },
  { n: 4, title: 'Second Declension Neuter & Sum', short: 'Neuter & Sum', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit04/index.htm' },
  { n: 5, title: 'Future & Imperfect; Adjectives in -er', short: 'Future & Imperfect', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit05/index.htm' },
  { n: 6, title: 'Sum & Possum; Complementary Infinitive', short: 'Sum & Possum', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit06/index.htm' },
];
export const CH_LIST = CHAPTERS.map((c) => c.n);
export const UVIC_CONTENTS = 'https://hcmc.uvic.ca/project/latin/wheelock/contents.htm';
