# LATIN IV — Master the language. Conquer the exam.

A complete, offline-capable study application for **Wheelock's Latin, 7th ed., Chapters 1–4**.
Static files only: no build step, no dependencies, no account. Works on iPhone, iPad, Mac and desktop.

## Run it
```bash
cd latin-iv
node serve.mjs          # http://localhost:8080   (or serve the folder with any static host)
npm test                # 42 automated tests (Node ≥ 20, no installs)
```
On iPhone/iPad: open the site in Safari → Share → *Add to Home Screen* (works offline after the first load).
Rehearse a day of the plan with `?now=2026-10-16T10:00` on the URL. Progress lives in the browser's
`localStorage`; use **Settings ▸ Export backup** to move it between devices.

## What is inside
Dashboard · Study (5-day plan + chapter lessons) · Vocabulary (browse/filter + 10 practice modes incl. SM-2 spaced repetition) ·
Grammar Lab (Conjugation Builder, Declension Arena, Case Detective, Agreement Workshop, Verb Analysis, SUM Challenge, Sentence Dissection) ·
Translation Studio (Latin→English with rubric/self-assessment; English→Latin with structural grading) · Practice Tests (adaptive) ·
Mock Exams (20/35/50 questions, timer, flags, autosave, provisional vs. final scores) · Mistake Bank · Progress · Reference Library.

## How correctness is protected
* `js/core/latin.js` is a morphology engine; `tests/gold.js` holds **independently hand-typed** paradigms it must match.
* Every authored sentence is annotated and parsed: each word must exist in the lexicon, resolve to one contextual analysis,
  agree with its subject, and not use vocabulary or forms from a later chapter.
* The question bank (≈2,200 items: ≈210 hand-authored, ≈310 derived from annotated sentences, the rest rule-generated) is tested for unique ids,
  no duplicated prompts, exactly one correct option per multiple-choice item, answer keys that grade themselves correct, and chapter limits.
* English→Latin answers are graded structurally (lemma, person/number, case, gender, agreement), so any valid word order or valid alternative passes.
* Free English translations are **not** auto-graded: a transparent keyword rubric + reference translation + your own rating.

## Known limitation (please read)
The UVic Wheelock pages could not be fetched from the build environment, so exercises were not inspected directly.
Grammar is standard and verified; the **chapter in which each vocabulary word appears** was written from knowledge of the 7th-edition structure and
is flagged `confirm` for less-certain items. Check Vocabulary ▸ Browse against your textbook and switch off anything your course has not covered —
every quiz, mock and generator honours that. Links to the UVic units are in the app (Reference ▸ Sources). All content here is original;
no published exercise text is reproduced. Wheelock's Latin is the work of Frederic M. Wheelock / Richard A. LaFleur; this app is independent.

## Files
`js/core` engine (morphology, grading, SRS, analytics, selection) · `js/data` lexicon, sentences, curriculum, authored questions ·
`js/ui` shell and views · `tests` · `sw.js` offline cache.
