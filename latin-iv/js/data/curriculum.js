// LATIN IV — curriculum: topics, grammar rules, lessons, five-day plan, source notes.
// Text uses {braces} to mark Latin (rendered in the serif face) and **bold**.

export const SECTIONS = {
  vocabulary: 'Vocabulary', conjugation: 'Conjugation', declension: 'Declension', grammar: 'Grammar', translation: 'Translation',
};

// topic → label, chapters it belongs to, mock-exam section
export const TOPICS = {
  vocab: { label: 'Vocabulary', section: 'vocabulary', ch: [1, 2, 3, 4] },
  'verb-forms': { label: 'Present active forms', section: 'conjugation', ch: [1] },
  'verb-id': { label: 'Identifying verb forms', section: 'conjugation', ch: [1] },
  'inf-imp': { label: 'Infinitives & imperatives', section: 'conjugation', ch: [1] },
  'princ-parts': { label: 'Principal parts & conjugations', section: 'conjugation', ch: [1] },
  decl1: { label: 'First-declension forms', section: 'declension', ch: [2] },
  'case-func': { label: 'Cases & their functions', section: 'grammar', ch: [2, 3] },
  gender: { label: 'Noun gender', section: 'grammar', ch: [2] },
  prep: { label: 'Prepositions', section: 'grammar', ch: [2] },
  'adj-agree': { label: 'Adjective agreement', section: 'grammar', ch: [2, 3, 4] },
  decl2m: { label: 'Second-declension masculine', section: 'declension', ch: [3] },
  'er-nouns': { label: '-er nouns & stems', section: 'declension', ch: [3] },
  apposition: { label: 'Apposition', section: 'grammar', ch: [3] },
  decl2n: { label: 'Neuter nouns', section: 'declension', ch: [4] },
  sum: { label: 'The verb sum', section: 'conjugation', ch: [4] },
  'pred-nom': { label: 'Predicate nominative', section: 'grammar', ch: [4] },
  substantive: { label: 'Substantive adjectives', section: 'grammar', ch: [4] },
  syntax: { label: 'Sentence structure', section: 'grammar', ch: [2, 3, 4] },
  ec: { label: 'Error correction', section: 'grammar', ch: [1, 2, 3, 4] },
  'translate-la': { label: 'Latin → English', section: 'translation', ch: [1, 2, 3, 4] },
  'translate-en': { label: 'English → Latin', section: 'translation', ch: [1, 2, 3, 4] },
};

export const RULES = {
  'c1.endings': { ch: 1, title: 'Personal endings (present active indicative)', text: 'A Latin verb shows **person and number in its ending**: {-ō} (or {-m}) = I · {-s} = you (sing.) · {-t} = he/she/it · {-mus} = we · {-tis} = you (pl.) · {-nt} = they. 1st conjugation (stem vowel ā): {amō, amās, amat, amāmus, amātis, amant}. 2nd conjugation (stem vowel ē): {moneō, monēs, monet, monēmus, monētis, monent}. The vowel before a final {-t} or {-nt} is **short**; in {-s}, {-mus}, {-tis} the stem vowel is long.' },
  'c1.stem': { ch: 1, title: 'Present stem & conjugation', text: 'Take the **second principal part** (present infinitive) and drop {-re}: {amāre → amā-}, {monēre → monē-}. {-āre} verbs are 1st conjugation; {-ēre} verbs are 2nd. The stem vowel is what you see in the endings.' },
  'c1.infinitive': { ch: 1, title: 'Present active infinitive', text: 'Present stem + {-re}: {amāre} “to love”, {monēre} “to warn”. An infinitive has **no person or number**. After verbs like {dēbeō} it completes the meaning: {pugnāre dēbēmus} “we ought to fight”.' },
  'c1.imperative': { ch: 1, title: 'Imperatives (commands)', text: 'Singular command = the **bare present stem**: {amā!}, {monē!}. Plural command = stem + {-te}: {amāte!}, {monēte!}. Do not confuse {amā} (command), {amāre} (infinitive), {amās} (you love) and {amāte} (command to several people).' },
  'c1.ppart': { ch: 1, title: 'Principal parts', text: 'A verb is listed by its principal parts: 1st sg. present, present infinitive, 1st sg. perfect, perfect participle — {amō, amāre, amāvī, amātus}. Learn all four as given; the infinitive shows the conjugation and stem. Parts that are not standard for a verb (e.g. many intransitives) are not tested here.' },
  'c1.translate': { ch: 1, title: 'Translating the present tense', text: 'One Latin form has three English translations: {laudat} = “he praises / is praising / does praise.” The subject pronoun is carried by the ending. {Nōn} before the verb negates it: {nōn laudat} “he does not praise.” Use {nōn} only with statements (not with commands).' },
  'c2.decl1': { ch: 2, title: 'First declension', text: 'Genitive singular in {-ae}. Endings — sg.: {-a, -ae, -ae, -am, -ā} · pl.: {-ae, -ārum, -īs, -ās, -īs} (nom., gen., dat., acc., abl.); the vocative is the same as the nominative. **Stem = genitive singular minus {-ae}**: {puella, puellae → puell-}. Watch the macron: {puella} (nom.) vs {puellā} (abl.).' },
  'c2.cases': { ch: 2, title: 'Cases and their functions', text: '**Nominative**: subject (and predicate nominative). **Genitive**: possession, “of”. **Dative**: indirect object, “to/for”. **Accusative**: direct object, and the object of {ad} and {in} (into). **Ablative**: “by, with, from, in”, chiefly with prepositions. **Vocative**: direct address. A *case* is a form; a *function* is the job the word does in the sentence.' },
  'c2.gender': { ch: 2, title: 'Gender is not the same as declension', text: 'Gender belongs to each noun. Most 1st-declension nouns are feminine, but {agricola}, {nauta} and {poēta} are **masculine** (they name men) and {incola} may be either. A 1st-declension noun is therefore **not necessarily feminine**: adjectives follow the *gender*, not the {-a} ending — {agricola bonus}, {puella bona}.' },
  'c2.prep': { ch: 2, title: 'Prepositions in Chapters 1–4', text: 'Prepositions take the accusative or ablative, never the nominative. **+ accusative**: {ad} “to, toward”. **+ ablative**: {ā/ab} “from, by”, {cum} “with”, {dē} “down from, about”, {ē/ex} “out of”. {in} takes the ablative for place where (“in, on”) and the accusative for motion toward (“into, onto”).' },
  'c2.adj': { ch: 2, title: 'Adjective agreement', text: 'An adjective agrees with its noun in **gender, number and case** — not necessarily in its ending letters. {bonus, bona, bonum} use 2nd-declension endings for masculine and neuter, 1st-declension endings for feminine: {puella bona}, {agricola bonus}, {dōnum bonum}.' },
  'c3.decl2m': { ch: 3, title: 'Second declension masculine', text: 'Genitive singular in {-ī}. Endings — sg.: {-us, -ī, -ō, -um, -ō, -e} · pl.: {-ī, -ōrum, -īs, -ōs, -īs, -ī}. Stem = genitive singular minus {-ī}. Nouns in {-ius} such as {fīlius} have vocative {fīlī} and genitive {fīlī} (also {fīliī}).' },
  'c3.er': { ch: 3, title: 'Nouns in -er', text: 'The nominative (and vocative) singular has no ending. Some keep the {-e-} through the paradigm ({puer, puerī}, stem puer-; {vir, virī}); others **drop it**: {ager, agrī} (stem agr-), {liber, librī}, {magister, magistrī}. **Always read the stem from the genitive.**' },
  'c3.apposition': { ch: 3, title: 'Apposition', text: 'A noun that renames another noun stands in the **same case**: {magister, vir bonus, puerōs monet} — {vir} renames {magister} (both nominative). Commas usually set it off in English.' },
  'c3.function': { ch: 3, title: 'Ending, case and function', text: 'Three different questions: *What does it look like?* (the visible ending, e.g. {-ō}); *What case is that?* ({-ō} = dative or ablative singular — the context decides); *What is it doing?* (its function, e.g. indirect object). Never answer one with another.' },
  'c4.neuter': { ch: 4, title: 'Neuter nouns', text: 'Neuter 2nd-declension: sg. {-um, -ī, -ō, -um, -ō}; pl. {-a, -ōrum, -īs, -a, -īs}. **Rule: the nominative, accusative and vocative of a neuter are identical, and in the plural they always end in {-a}.** A neuter is rarely a person, so the same form often serves as subject or object — read the verb and context.' },
  'c4.sum': { ch: 4, title: 'The verb sum', text: '{sum, es, est, sumus, estis, sunt}; infinitive {esse}. Principal parts {sum, esse, fuī, futūrus}. It is a linking verb: it joins a subject to a **predicate nominative** or predicate adjective rather than taking an object.' },
  'c4.predicate': { ch: 4, title: 'Predicate nominative & adjective', text: 'With {sum}, the word after the verb is in the **nominative** and agrees with the subject: {poēta vir bonus est}; {bellum est malum} (neuter, like {bellum}); {nautae bonī sunt}.' },
  'c4.substantive': { ch: 4, title: 'Substantive adjectives', text: 'An adjective can stand alone as a noun: masculine plural {bonī} “good men”, feminine {bonae} “good women”, neuter plural {bona} “good things”. The gender and number of the form tell you what is meant.' },
  'c4.adj': { ch: 4, title: 'First/second-declension adjectives', text: '{bonus, bona, bonum}: masculine like {dominus}, feminine like {puella}, neuter like {bellum}. {-er} adjectives follow the same split: {miser, misera, miserum} (keeps e); {pulcher, pulchra, pulchrum} (drops e).' },
  'c4.sentence': { ch: 4, title: 'A method for translating', text: '1) Find the **verb** (person/number). 2) Find the **subject** (nominative that matches). 3) Identify other cases (acc. object, dat. indirect object, gen. “of”, abl. with prepositions). 4) Match each adjective to its noun by gender, number, case. 5) Translate the sentence, not word by word.' },
  'vocab': { ch: 1, title: 'Learning vocabulary', text: 'Learn the full dictionary entry: for verbs the principal parts; for nouns the nominative, genitive and gender; for adjectives all three nominatives. The genitive is what tells you a noun’s declension and stem.' },
};

// Chapter lesson cards for Study. `table` keys are drawn by the UI (ui/tables.js).
export const LESSONS = {
  1: [
    { rule: 'c1.endings', table: 'verbs-ind' },
    { rule: 'c1.stem' },
    { rule: 'c1.infinitive', table: 'verbs-forms' },
    { rule: 'c1.imperative' },
    { rule: 'c1.ppart' },
    { rule: 'c1.translate' },
  ],
  2: [
    { rule: 'c2.decl1', table: 'decl-1' },
    { rule: 'c2.cases', table: 'cases' },
    { rule: 'c2.gender' },
    { rule: 'c2.prep' },
    { rule: 'c2.adj', table: 'adj-bonus' },
  ],
  3: [
    { rule: 'c3.decl2m', table: 'decl-2m' },
    { rule: 'c3.er', table: 'decl-er' },
    { rule: 'c3.apposition' },
    { rule: 'c3.function' },
  ],
  4: [
    { rule: 'c4.neuter', table: 'decl-2n' },
    { rule: 'c4.sum', table: 'sum' },
    { rule: 'c4.predicate' },
    { rule: 'c4.substantive' },
    { rule: 'c4.adj', table: 'adj-all' },
    { rule: 'c4.sentence' },
  ],
};

// Five days of preparation plus exam morning. Hashes resolve in the app router.
export const PLAN = [
  { date: '2026-10-14', label: 'Wed 14 Oct', theme: 'Verbs and the first declension begins', items: [
    { t: 'Learn: Chapter 1 lessons', m: 10, href: '#/study?ch=1' },
    { t: 'Conjugation Builder: amō and moneō', m: 10, href: '#/grammar/conjugation?v=amo' },
    { t: 'Vocabulary: Chapter 1 spaced repetition', m: 10, href: '#/vocabulary/practice?mode=srs&ch=1' },
    { t: 'Practice: Chapter 1, 10 questions', m: 8, href: '#/practice?ch=1&len=10' },
    { t: 'Learn: Chapter 2 lessons', m: 10, href: '#/study?ch=2' },
  ] },
  { date: '2026-10-15', label: 'Thu 15 Oct', theme: 'First declension & adjectives', items: [
    { t: 'Declension Arena: puella, agricola, nauta', m: 12, href: '#/grammar/declension?n=puella' },
    { t: 'Adjective Agreement Workshop', m: 10, href: '#/grammar/agreement' },
    { t: 'Vocabulary: Chapter 2 spaced repetition', m: 10, href: '#/vocabulary/practice?mode=srs&ch=2' },
    { t: 'Case Detective (level 1)', m: 8, href: '#/grammar/detective' },
    { t: 'Review Chapter 1 mistakes', m: 8, href: '#/mistakes' },
  ] },
  { date: '2026-10-16', label: 'Fri 16 Oct', theme: 'Second declension masculine', items: [
    { t: 'Learn: Chapter 3 lessons', m: 10, href: '#/study?ch=3' },
    { t: 'Declension Arena: dominus, puer, ager, magister', m: 15, href: '#/grammar/declension?n=dominus' },
    { t: 'Vocabulary: Chapter 3 spaced repetition', m: 10, href: '#/vocabulary/practice?mode=srs&ch=3' },
    { t: 'Translation Studio: Latin → English, intermediate', m: 10, href: '#/translation?dir=la&lvl=2&ch=3' },
    { t: 'Quick Test (20 questions)', m: 15, href: '#/mock?fmt=quick' },
  ] },
  { date: '2026-10-17', label: 'Sat 17 Oct', theme: 'Neuter nouns and sum', items: [
    { t: 'Learn: Chapter 4 lessons', m: 10, href: '#/study?ch=4' },
    { t: 'Declension Arena: bellum, dōnum, oppidum', m: 12, href: '#/grammar/declension?n=bellum' },
    { t: 'SUM Challenge', m: 10, href: '#/grammar/sum' },
    { t: 'Sentence Dissection', m: 10, href: '#/grammar/dissection' },
    { t: 'Standard Mock Exam (35 questions)', m: 30, href: '#/mock?fmt=standard' },
  ] },
  { date: '2026-10-18', label: 'Sun 18 Oct', theme: 'Full mock and repair', items: [
    { t: 'Comprehensive Mock Exam (50 questions)', m: 50, href: '#/mock?fmt=comprehensive' },
    { t: 'Mistake Bank: re-attempt open mistakes', m: 15, href: '#/mistakes' },
    { t: 'Weakest-topic practice (adaptive)', m: 10, href: '#/practice?diff=adaptive&len=20' },
    { t: 'Vocabulary: all chapters spaced repetition', m: 10, href: '#/vocabulary/practice?mode=srs&ch=all' },
  ] },
  { date: '2026-10-19', label: 'Mon 19 Oct', theme: 'Exam day: light review only', items: [
    { t: 'Skim the paradigms in the Reference Library', m: 10, href: '#/reference' },
    { t: 'Quick vocabulary recall (rapid)', m: 5, href: '#/vocabulary/practice?mode=rapid&ch=all' },
    { t: 'Rest. No new material today.', m: 0, href: '#/reference/checklist' },
  ] },
];

export const SOURCES = {
  uvic: [
    { label: 'Wheelock’s Latin — contents (UVic HCMC)', url: 'https://hcmc.uvic.ca/project/latin/wheelock/contents.htm' },
    { label: 'Chapter 1 — unit 01', url: 'https://hcmc.uvic.ca/project/latin/wheelock/unit01/index.htm' },
    { label: 'Chapter 2 — unit 02', url: 'https://hcmc.uvic.ca/project/latin/wheelock/unit02/index.htm' },
    { label: 'Chapter 3 — unit 03', url: 'https://hcmc.uvic.ca/project/latin/wheelock/unit03/index.htm' },
    { label: 'Chapter 4 — unit 04', url: 'https://hcmc.uvic.ca/project/latin/wheelock/unit04/index.htm' },
  ],
  attribution: 'Wheelock’s Latin (7th ed., revised by Richard A. LaFleur) is the course text; the University of Victoria Humanities Computing and Media Centre hosts the exercises linked above. LATIN IV is an independent study aid with no affiliation to either. All questions, sentences and explanations here are original and were written for this application; none of the published exercise sentences are reproduced.',
  limitation: 'When this application was built, the UVic site could not be fetched from the build environment (outbound access to hcmc.uvic.ca was blocked), so the exercise pages could not be inspected directly. The grammar content (paradigms, rules) is standard Latin and was verified by independent hand-typed tables and automated tests. The chapter in which each vocabulary item is introduced was written from knowledge of the 7th-edition chapter structure and is marked “confirm” where less certain: please check Vocabulary ▸ Browse against your textbook’s chapter lists and switch off anything your course has not covered. Question styles were modelled on the standard Wheelock exercise types (conjugate, decline, identify, translate) rather than on the UVic pages themselves.',
};
