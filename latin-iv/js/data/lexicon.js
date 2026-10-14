// LATIN IV — vocabulary database for Wheelock's Latin (7th ed.), Chapters 1–4.
//
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

// ---- verbs: [first, infinitive, perfect, supine-participle|null, conj, meanings, chapter, conf, note]
const VERBS = [
  ['amō', 'amāre', 'amāvī', 'amātus', 1, ['love', 'like'], 1, 'core'],
  ['clāmō', 'clāmāre', 'clāmāvī', null, 1, ['shout', 'shout at'], 1, 'core'],
  ['dō', 'dare', 'dedī', 'datus', 1, ['give'], 1, 'core', 'Irregular quantity: the a of dare/dat/damus/datis/dant is SHORT; only dās and dā are long. Perfect dedī.'],
  ['habitō', 'habitāre', 'habitāvī', null, 1, ['live', 'dwell', 'inhabit'], 1, 'core'],
  ['labōrō', 'labōrāre', 'labōrāvī', null, 1, ['work', 'toil'], 1, 'core'],
  ['laudō', 'laudāre', 'laudāvī', 'laudātus', 1, ['praise'], 1, 'core'],
  ['liberō', 'liberāre', 'liberāvī', 'liberātus', 1, ['free', 'liberate'], 1, 'core'],
  ['nāvigō', 'nāvigāre', 'nāvigāvī', null, 1, ['sail'], 1, 'core'],
  ['occupō', 'occupāre', 'occupāvī', 'occupātus', 1, ['seize', 'occupy'], 1, 'core'],
  ['oppugnō', 'oppugnāre', 'oppugnāvī', 'oppugnātus', 1, ['attack'], 1, 'core'],
  ['optō', 'optāre', 'optāvī', 'optātus', 1, ['wish for', 'desire', 'choose'], 1, 'check'],
  ['parō', 'parāre', 'parāvī', 'parātus', 1, ['prepare', 'get ready'], 1, 'core'],
  ['portō', 'portāre', 'portāvī', 'portātus', 1, ['carry', 'bring'], 1, 'core'],
  ['pugnō', 'pugnāre', 'pugnāvī', null, 1, ['fight'], 1, 'core'],
  ['servō', 'servāre', 'servāvī', 'servātus', 1, ['save', 'preserve', 'keep'], 1, 'core'],
  ['spectō', 'spectāre', 'spectāvī', 'spectātus', 1, ['watch', 'look at'], 1, 'core'],
  ['vocō', 'vocāre', 'vocāvī', 'vocātus', 1, ['call'], 1, 'core'],
  ['dēbeō', 'dēbēre', 'dēbuī', 'dēbitus', 2, ['owe', 'ought', 'must'], 1, 'core', 'Often takes a complementary infinitive: dēbeō pugnāre = I ought to fight.'],
  ['habeō', 'habēre', 'habuī', 'habitus', 2, ['have', 'hold'], 1, 'core'],
  ['moneō', 'monēre', 'monuī', 'monitus', 2, ['warn', 'advise'], 1, 'core'],
  ['moveō', 'movēre', 'mōvī', 'mōtus', 2, ['move'], 1, 'core', 'Perfect mōvī has a long ō (the vowel lengthens, unlike habuī/monuī).'],
  ['sedeō', 'sedēre', 'sēdī', null, 2, ['sit'], 1, 'core'],
  ['teneō', 'tenēre', 'tenuī', 'tentus', 2, ['hold', 'keep', 'possess'], 1, 'core'],
  ['terreō', 'terrēre', 'terruī', 'territus', 2, ['terrify', 'frighten'], 1, 'core'],
  ['videō', 'vidēre', 'vīdī', 'vīsus', 2, ['see'], 1, 'core'],
  ['valeō', 'valēre', 'valuī', null, 2, ['be strong', 'be well'], 1, 'check'],
];

// ---- nouns: [nom, gen, gender, type, stem|null, meanings, chapter, flags]
// flags: anim (person → vocative is "relevant"), contractGen, note, altDatAblPl, conf
const NOUNS = [
  // 1st declension (Ch 2)
  ['agricola', 'agricolae', 'm', 'a', null, ['farmer'], 2, { anim: 1, note: 'Masculine noun of the 1st declension: it takes masculine adjectives (agricola bonus).' }],
  ['aqua', 'aquae', 'f', 'a', null, ['water'], 2, {}],
  ['fīlia', 'fīliae', 'f', 'a', null, ['daughter'], 2, { anim: 1, altDatAblPl: 'fīliābus', note: 'Dative/ablative plural is fīliābus (or fīliīs) — distinguishes it from fīlius, fīliīs.' }],
  ['fōrma', 'fōrmae', 'f', 'a', null, ['form', 'shape', 'beauty'], 2, {}],
  ['fortūna', 'fortūnae', 'f', 'a', null, ['fortune', 'luck'], 2, {}],
  ['incola', 'incolae', 'mf', 'a', null, ['inhabitant'], 2, { anim: 1, note: 'Common gender: masculine or feminine depending on the person meant.' }],
  ['īnsula', 'īnsulae', 'f', 'a', null, ['island'], 2, {}],
  ['lingua', 'linguae', 'f', 'a', null, ['tongue', 'language'], 2, {}],
  ['nauta', 'nautae', 'm', 'a', null, ['sailor'], 2, { anim: 1, note: 'Masculine noun of the 1st declension.' }],
  ['patria', 'patriae', 'f', 'a', null, ['fatherland', 'native land', 'country'], 2, {}],
  ['pecūnia', 'pecūniae', 'f', 'a', null, ['money'], 2, {}],
  ['poēta', 'poētae', 'm', 'a', null, ['poet'], 2, { anim: 1, note: 'Masculine noun of the 1st declension.' }],
  ['puella', 'puellae', 'f', 'a', null, ['girl'], 2, { anim: 1 }],
  ['rēgīna', 'rēgīnae', 'f', 'a', null, ['queen'], 2, { anim: 1 }],
  ['silva', 'silvae', 'f', 'a', null, ['forest', 'woods'], 2, {}],
  ['terra', 'terrae', 'f', 'a', null, ['land', 'earth', 'ground'], 2, {}],
  ['via', 'viae', 'f', 'a', null, ['road', 'way', 'street'], 2, {}],
  ['vīta', 'vītae', 'f', 'a', null, ['life'], 2, {}],
  // 2nd declension masculine (Ch 3)
  ['amīcus', 'amīcī', 'm', 'us', null, ['friend'], 3, { anim: 1 }],
  ['animus', 'animī', 'm', 'us', null, ['mind', 'spirit', 'soul'], 3, {}],
  ['annus', 'annī', 'm', 'us', null, ['year'], 3, {}],
  ['dominus', 'dominī', 'm', 'us', null, ['master', 'lord'], 3, { anim: 1 }],
  ['equus', 'equī', 'm', 'us', null, ['horse'], 3, {}],
  ['fīlius', 'fīlī', 'm', 'ius', null, ['son'], 3, { anim: 1, contractGen: 1, note: 'Genitive fīlī (also fīliī); vocative fīlī — the only -ius noun with a contracted vocative that you need.' }],
  ['gladius', 'gladiī', 'm', 'ius', null, ['sword'], 3, { note: 'Genitive gladiī (contracted gladī is also found).' }],
  ['lupus', 'lupī', 'm', 'us', null, ['wolf'], 3, {}],
  ['murus', 'murī', 'm', 'us', null, ['wall'], 3, {}],
  ['nūntius', 'nūntiī', 'm', 'ius', null, ['messenger', 'message'], 3, { anim: 1, note: 'Genitive nūntiī (contracted nūntī is also found).' }],
  ['populus', 'populī', 'm', 'us', null, ['people'], 3, {}],
  ['servus', 'servī', 'm', 'us', null, ['slave'], 3, { anim: 1 }],
  ['ager', 'agrī', 'm', 'er', 'agr', ['field'], 3, { note: 'The -e- drops out of the stem: agr-.' }],
  ['liber', 'librī', 'm', 'er', 'libr', ['book'], 3, { note: 'The -e- drops out of the stem: libr-.' }],
  ['magister', 'magistrī', 'm', 'er', 'magistr', ['teacher', 'master'], 3, { anim: 1, note: 'The -e- drops out of the stem: magistr-.' }],
  ['puer', 'puerī', 'm', 'er', 'puer', ['boy'], 3, { anim: 1, note: 'The -e- is part of the stem: puer-.' }],
  ['vir', 'virī', 'm', 'er', 'vir', ['man'], 3, { anim: 1, note: 'Nominative vir has no -e- at all; stem vir-.' }],
  // 2nd declension neuter (Ch 4)
  ['bellum', 'bellī', 'n', 'um', null, ['war'], 4, {}],
  ['beneficium', 'beneficiī', 'n', 'ium', null, ['benefit', 'kindness', 'favor'], 4, {}],
  ['caelum', 'caelī', 'n', 'um', null, ['sky', 'heaven'], 4, {}],
  ['cōnsilium', 'cōnsiliī', 'n', 'ium', null, ['plan', 'advice', 'counsel'], 4, {}],
  ['dōnum', 'dōnī', 'n', 'um', null, ['gift'], 4, {}],
  ['exemplum', 'exemplī', 'n', 'um', null, ['example'], 4, {}],
  ['ferrum', 'ferrī', 'n', 'um', null, ['iron', 'sword'], 4, {}],
  ['imperium', 'imperiī', 'n', 'ium', null, ['command', 'power', 'empire'], 4, {}],
  ['negōtium', 'negōtiī', 'n', 'ium', null, ['business', 'task'], 4, {}],
  ['oppidum', 'oppidī', 'n', 'um', null, ['town'], 4, {}],
  ['perīculum', 'perīculī', 'n', 'um', null, ['danger', 'risk'], 4, {}],
  ['praemium', 'praemiī', 'n', 'ium', null, ['reward', 'prize'], 4, {}],
  ['proelium', 'proeliī', 'n', 'ium', null, ['battle'], 4, {}],
  ['saxum', 'saxī', 'n', 'um', null, ['rock', 'stone'], 4, {}],
  ['signum', 'signī', 'n', 'um', null, ['sign', 'signal', 'seal'], 4, {}],
  ['templum', 'templī', 'n', 'um', null, ['temple'], 4, {}],
  ['verbum', 'verbī', 'n', 'um', null, ['word'], 4, {}],
  ['auxilium', 'auxiliī', 'n', 'ium', null, ['help', 'aid'], 4, { conf: 'check' }],
];

// ---- adjectives (1st/2nd declension): [m, f, n, type, stem|null, meanings, chapter, conf]
const ADJS = [
  ['bonus', 'bona', 'bonum', 'us', null, ['good'], 2, 'core'],
  ['malus', 'mala', 'malum', 'us', null, ['bad', 'evil'], 2, 'core'],
  ['magnus', 'magna', 'magnum', 'us', null, ['large', 'great', 'big'], 2, 'core'],
  ['parvus', 'parva', 'parvum', 'us', null, ['small', 'little'], 2, 'core'],
  ['longus', 'longa', 'longum', 'us', null, ['long'], 2, 'core'],
  ['multus', 'multa', 'multum', 'us', null, ['much', 'many'], 2, 'core'],
  ['altus', 'alta', 'altum', 'us', null, ['high', 'deep'], 2, 'check'],
  ['novus', 'nova', 'novum', 'us', null, ['new'], 2, 'check'],
  ['Rōmānus', 'Rōmāna', 'Rōmānum', 'us', null, ['Roman'], 2, 'core'],
  ['antīquus', 'antīqua', 'antīquum', 'us', null, ['ancient', 'old'], 2, 'check'],
  ['pulcher', 'pulchra', 'pulchrum', 'er1', 'pulchr', ['beautiful', 'handsome', 'pretty'], 3, 'check'],
  ['miser', 'misera', 'miserum', 'er0', 'miser', ['wretched', 'unhappy', 'miserable'], 3, 'check'],
];

// ---- function words: [la, pos, meanings, chapter, extra]
const SMALL = [
  ['et', 'conj', ['and'], 1, { conf: 'core' }],
  ['sed', 'conj', ['but'], 1, { conf: 'check' }],
  ['nōn', 'adv', ['not'], 1, { conf: 'core' }],
  ['ā', 'prep', ['from', 'away from', 'by'], 2, { governs: 'abl', forms: ['ab'], note: 'ā before consonants, ab before vowels (and h); both take the ablative.', conf: 'core' }],
  ['ad', 'prep', ['to', 'toward', 'near'], 2, { governs: 'acc', conf: 'core' }],
  ['cum', 'prep', ['with'], 2, { governs: 'abl', conf: 'core' }],
  ['dē', 'prep', ['down from', 'concerning', 'about'], 2, { governs: 'abl', conf: 'core' }],
  ['ē', 'prep', ['out of', 'from'], 2, { governs: 'abl', forms: ['ex'], note: 'ē before consonants, ex before vowels or consonants; both take the ablative.', conf: 'core' }],
  ['in', 'prep', ['in', 'on', 'into', 'onto'], 2, { governs: 'abl/acc', note: 'in + ablative = in, on (place where). in + accusative = into, onto (motion toward).', conf: 'core' }],
];

const lex = [];
for (const [la, inf, perf, p4, conj, en, ch, conf, note] of VERBS) {
  lex.push({ id: mkId(la), la, pos: 'verb', conj, pp: [la, inf, perf, p4], en, ch, conf, note: note || '', irreg: la === 'dō' ? 'do' : undefined });
}
lex.push({ id: 'sum', la: 'sum', pos: 'verb', conj: 0, irreg: 'sum', pp: ['sum', 'esse', 'fuī', 'futūrus'], en: ['be', 'exist'], ch: 4, conf: 'core', note: 'Irregular. sum, es, est, sumus, estis, sunt. It links a subject to a predicate nominative or predicate adjective.' });
for (const [la, gen, gender, type, stem, en, ch, o] of NOUNS) {
  lex.push({ id: mkId(la), la, pos: 'noun', decl: type === 'a' ? 1 : 2, type, stem, gender, gen, en, ch, conf: o.conf || 'core', anim: !!o.anim, contractGen: !!o.contractGen, altDatAblPl: o.altDatAblPl, note: o.note || '', genAlt: [] });
}
for (const [m, f, n, t, stem, en, ch, conf] of ADJS) {
  lex.push({ id: mkId(m), la: m, f, n, pos: 'adj', adjType: t === 'us' ? 'us' : t, stem, decl: '1/2', en, ch, conf, note: t === 'er1' ? 'The -e- drops out before the other endings: pulcher, pulchra, pulchrum.' : t === 'er0' ? 'The -e- stays: miser, misera, miserum.' : '' });
}
for (const [la, pos, en, ch, o] of SMALL) {
  lex.push({ id: mkId(la), la, pos, en, ch, conf: o.conf, governs: o.governs, forms: o.forms, note: o.note || '' });
}

export const LEXICON = lex;
export const BY_ID = Object.fromEntries(lex.map((w) => [w.id, w]));
export const POS_LABEL = { verb: 'verb', noun: 'noun', adj: 'adjective', prep: 'preposition', conj: 'conjunction', adv: 'adverb' };

export const CHAPTERS = [
  { n: 1, title: 'First & Second Conjugation Verbs', short: 'Verbs', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit01/index.htm' },
  { n: 2, title: 'First Declension', short: '1st Declension', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit02/index.htm' },
  { n: 3, title: 'Second Declension Masculine', short: '2nd Decl. Masc.', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit03/index.htm' },
  { n: 4, title: 'Second Declension Neuter & Sum', short: 'Neuter & Sum', unit: 'https://hcmc.uvic.ca/project/latin/wheelock/unit04/index.htm' },
];
export const UVIC_CONTENTS = 'https://hcmc.uvic.ca/project/latin/wheelock/contents.htm';
