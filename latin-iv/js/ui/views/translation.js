import { SENTENCES, COMPOSE, analyzer } from '../../core/corpus.js';
import { BY_ID } from '../../data/lexicon.js';
import { Q_BY_ID, shuffle } from '../../core/questions.js';
import { checkKeywords, tokenGloss, ROLE_LABEL, wordOf } from '../../core/sentences.js';
import { gradeCompose, parseSlot, describeSlot, finalizeSelf } from '../../core/grade.js';
import { conjugate, CASE_NAME, NUM_NAME, GENDER_NAME, describe } from '../../core/latin.js';
import { rubricHtml, vocabHelp } from '../qrun.js';
import { esc, fmt, la, icon, $, $$ } from '../util.js';

const LV = [[1, 'Beginner', 'Isolated clauses'], [2, 'Intermediate', 'Multi-part simple sentences'], [3, 'Exam', 'Mixed grammar, independent analysis']];

function endingOf(tk) {
  const a = tk.analysis, lex = BY_ID[a.lemma], f = tk.word.toLowerCase(); let stem = null;
  if (a.pos === 'noun') stem = lex.type === 'er' ? lex.stem : lex.type === 'a' ? lex.la.slice(0, -1) : lex.la.slice(0, -2);
  else if (a.pos === 'adj') stem = lex.adjType === 'us' ? lex.la.slice(0, -2) : lex.stem;
  else if (a.pos === 'verb' && lex.irreg !== 'sum') stem = conjugate(lex).base;
  if (stem == null || !f.startsWith(stem.toLowerCase())) return null;
  const end = f.slice(stem.length); if (!end) return null;
  return { stem: tk.word.slice(0, stem.length), end: tk.word.slice(stem.length), meaning: describe(a) };
}
const analysisTable = (toks) => `<div class="tscroll"><table class="etable"><thead><tr><th>Word</th><th>Dictionary entry</th><th>Meaning</th><th>Form</th></tr></thead><tbody>${toks.filter((t) => t.analysis).map((t) => { const g = tokenGloss(t, BY_ID); return `<tr><td class="la">${esc(t.word)}</td><td class="la">${esc(g.lemma)}</td><td>${esc(g.gloss)}</td><td>${esc(g.desc)}</td></tr>`; }).join('')}</tbody></table></div>`;
const endingsHtml = (toks) => { const rows = toks.map((t) => (t.analysis ? { t, e: endingOf(t) } : null)).filter((x) => x && x.e); return rows.length ? `<div class="list">${rows.map(({ t, e }) => `<div class="row tight"><span class="la" style="font-size:1.4em">${esc(e.stem)}<strong style="color:var(--gold-ink)">${esc(e.end)}</strong></span><span class="small muted">→ ${esc(e.meaning)}</span></div>`).join('')}</div>` : '<p class="muted mb0">No inflected endings to highlight.</p>'; };
const section = (n, t, h) => `<section class="card tight"><div class="caps">${n}</div><h4 style="margin:2px 0 8px">${t}</h4>${h}</section>`;

export default function translation({ root, store, now, q: Q }) {
  const st = store.state;
  const S = { dir: Q.dir === 'en' ? 'en' : 'la', lvl: +Q.lvl || 1, ch: Q.ch || 'all', exam: false, cur: null };
  const used = [];
  const pool = () => (S.dir === 'la' ? SENTENCES.filter((s) => s.lvl === S.lvl && (S.ch === 'all' || s.ch === +S.ch) && !s.toks.some((t) => st.settings.excluded[t.analysis.lemma])) : COMPOSE.filter((c) => c.lvl === S.lvl && (S.ch === 'all' || c.ch === +S.ch)));
  const pickNew = (like) => { let p = pool(); if (like) { const sim = p.filter((x) => x.id !== like.id && (like.t ? x.t.split(' ').map((k) => k.split('/')[1]).join('') === like.t.split(' ').map((k) => k.split('/')[1]).join('') : true)); if (sim.length) p = sim; } const fresh = p.filter((x) => !used.includes(x.id)); const x = shuffle(fresh.length ? fresh : p)[0]; if (x) { used.push(x.id); if (used.length > 8) used.shift(); } return x; };
  const frame = (inner) => { root.innerHTML = `<div class="page-head"><div><h1>Translation Studio</h1><p>${S.dir === 'la' ? 'Read the Latin, type your English, then compare with a full grammatical breakdown.' : 'Build the Latin sentence. Any correct word order is accepted; the grader checks vocabulary, endings and agreement.'}</p></div></div>
    <div class="row" style="margin-bottom:var(--s3)"><div class="seg"><button data-d="la" aria-pressed="${S.dir === 'la'}">Latin → English</button><button data-d="en" aria-pressed="${S.dir === 'en'}">English → Latin</button></div>
    <div class="seg">${LV.map(([l, n]) => `<button data-l="${l}" aria-pressed="${S.lvl === l}">${n}</button>`).join('')}</div>
    <select class="input" id="ch" style="width:auto;min-height:38px"><option value="all">All chapters</option>${[1, 2, 3, 4].map((c) => `<option value="${c}" ${String(S.ch) === String(c) ? 'selected' : ''}>Chapter ${c}</option>`).join('')}</select>
    <label class="switch"><input type="checkbox" id="ex" ${S.exam ? 'checked' : ''}> Exam mode: hide all hints</label></div><p class="tiny muted" style="margin:-4px 0 var(--s3)">${LV.find((l) => l[0] === S.lvl)[2]}.</p><div id="stage">${inner}</div>`;
    $$('[data-d]', root).forEach((b) => (b.onclick = () => { S.dir = b.dataset.d; S.cur = null; draw(); })); $$('[data-l]', root).forEach((b) => (b.onclick = () => { S.lvl = +b.dataset.l; S.cur = null; draw(); })); $('#ch', root).onchange = (e) => { S.ch = e.target.value; S.cur = null; draw(); }; $('#ex', root).onchange = (e) => { S.exam = e.target.checked; draw(); }; };
  function draw(like) {
    if (!S.cur || like) S.cur = pickNew(like);
    const c = S.cur;
    if (!c) { frame('<div class="card empty">No sentences at this level for that chapter. Try another level.</div>'); return; }
    S.dir === 'la' ? latinToEnglish(c) : englishToLatin(c);
  }
  function latinToEnglish(s) {
    frame(`<div class="card"><div class="caps">Chapter ${s.ch} · ${LV[s.lvl - 1][1]}</div><div class="latin-big mt1" style="margin-bottom:var(--s3)">${esc(s.la)}</div><textarea class="input" id="ans" rows="2" placeholder="Your English translation…" spellcheck="false"></textarea>
      ${S.exam ? '<p class="small muted mt1 mb0">Exam mode: no vocabulary help.</p>' : `<details class="mt1"><summary class="small muted" style="cursor:pointer">Vocabulary help</summary><div class="hintbox mt1">${vocabHelp({ type: 'translate', sent: s })}</div></details>`}
      <div class="row mt2"><button class="btn primary" id="go" disabled>Submit &amp; analyse</button><button class="btn quiet" id="skip">Skip</button></div></div><div id="out"></div>`);
    const ta = $('#ans', root), go = $('#go', root); ta.oninput = () => { go.disabled = !ta.value.trim(); }; ta.focus(); $('#skip', root).onclick = () => { S.cur = null; draw(); };
    go.onclick = () => {
      const text = ta.value; const kw = checkKeywords(s, text); ta.readOnly = true; go.remove(); $('#skip', root).remove();
      const missing = kw.found.filter((f) => !f.ok);
      const tokFor = (role) => s.toks.find((t) => t.role === role);
      const mistakes = [];
      if (kw.reversed) mistakes.push('Your English puts the subject and object in the opposite order. In Latin the <strong>cases</strong> tell you who does what: find the nominative first.');
      missing.forEach((m) => { const t = tokFor(m.role) || tokFor('V'); if (!t) return; const g = tokenGloss(t, BY_ID); const e = t.analysis.pos !== 'verb' ? endingOf(t) : null; mistakes.push(`${ROLE_LABEL[m.role] || m.role}: look again at ${la(t.word)} (${esc(g.gloss.split(',')[0])}) — ${esc(g.desc)}${e ? `; the ending ${la('-' + e.end)} marks it` : ''}.`); });
      const structure = s.toks.filter((t) => ['S', 'V', 'O', 'I', 'N', 'G', 'PO', 'AP', 'VOC', 'INF'].includes(t.role)).map((t) => `<span class="badge accent">${ROLE_LABEL[t.role]}</span> ${la(t.word)}`).join(' &nbsp; ');
      $('#out', root).innerHTML = `<div class="col mt2"><div class="banner info"><strong>Keyword check:</strong> ${kw.ok} of ${kw.total} checkpoints found. <span class="muted">A guide only — you decide below.</span></div>
        ${section('1', 'Suggested translation', `<div class="display" style="font-size:24px">“${esc(s.en)}”</div>${s.alts.length ? `<div class="small muted mt1">Also acceptable: ${s.alts.map((a) => '“' + esc(a) + '”').join(' · ')}</div>` : ''}`)}
        ${section('2', 'Word-by-word analysis', analysisTable(s.toks))}${section('3', 'Important endings', endingsHtml(s.toks))}
        ${section('4', 'Sentence structure', `<p>${structure}</p>${s.note ? `<div class="why small">${esc(s.note)}</div>` : ''}`)}
        ${section('5', 'About your attempt', mistakes.length ? `<ul style="margin:0;padding-left:18px">${mistakes.map((m) => `<li class="small">${m}</li>`).join('')}</ul>` : '<p class="mb0">All rubric checkpoints were found. Compare your wording with the suggestion — meaning matters, exact words do not.</p>')}
        ${rubricHtml(s, kw)}
        <div class="card soft"><div class="caps" style="margin-bottom:8px">Rate your own answer</div><div class="row" id="rate"><button class="btn" data-r="0">Not yet</button><button class="btn" data-r="0.5">Partly right</button><button class="btn primary" data-r="1">Correct</button></div></div>
        <div id="after"></div></div>`;
      $$('[data-r]', root).forEach((b) => (b.onclick = () => { const q = Q_BY_ID['tr:' + s.id]; if (q) store.recordAttempt({ q, res: finalizeSelf({ status: 'selfassess' }, +b.dataset.r), ans: text, mode: 'translation', mixed: false }); $('#rate', root).innerHTML = `<span class="badge ${+b.dataset.r >= 1 ? 'ok' : 'gold'}">Saved</span>`; $('#after', root).innerHTML = `<section class="card tight"><div class="caps">6</div><h4 style="margin:2px 0 8px">A similar sentence</h4><p class="small">Same structure, new words — apply what you just saw.</p><button class="btn primary" id="sim">${icon('arrow')}Try a similar question</button></section>`; $('#sim', root).onclick = () => draw(s); }));
    };
  }
  function englishToLatin(c) {
    const slots = c.slots.map(parseSlot);
    frame(`<div class="card"><div class="caps">Chapter ${c.ch} · ${LV[c.lvl - 1][1]}</div><div class="display mt1" style="font-size:clamp(24px,3.4vw,32px);margin-bottom:var(--s3)">“${esc(c.en)}”</div><input class="input" id="ans" data-la="on" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Write the Latin sentence…">
      ${S.exam ? '<p class="small muted mt1 mb0">Exam mode: no hints.</p>' : `<details class="mt1"><summary class="small muted" style="cursor:pointer">Words to use</summary><div class="hintbox mt1">${vocabHelp({ type: 'compose', slots: c.slots })}<div class="small muted mt1">Needed: ${slots.map((s) => esc(describeSlot(s))).join(' · ')}</div></div></details>`}
      <div class="row mt2"><button class="btn primary" id="go">Check</button><button class="btn quiet" id="skip">Skip</button></div></div><div id="out"></div>`);
    const inp = $('#ans', root); inp.focus(); $('#skip', root).onclick = () => { S.cur = null; draw(); };
    const go = () => {
      if (!inp.value.trim()) return; const text = inp.value; const r = gradeCompose(text, c.slots, { strict: st.settings.macronMode === 'strict' }); inp.readOnly = true; $('#go', root).remove(); $('#skip', root).remove();
      const q = Q_BY_ID['cp:' + c.id]; if (q) store.recordAttempt({ q, res: r, ans: text, mode: 'translation' });
      const refToks = c.ref.replace(/[.,!?]/g, '').split(/\s+/).map((w) => { const an = analyzer.analyze(w.toLowerCase()); const pick = an.find((a) => slots.some((sl) => sl.lemma === a.lemma && ['case', 'number', 'gender', 'person', 'mood'].every((k) => sl[k] == null || a[k] === sl[k]))) || an[0]; return { word: w, analysis: pick }; });
      $('#out', root).innerHTML = `<div class="col mt2"><div class="banner ${r.correct ? 'ok' : r.status === 'partial' ? 'warn' : 'bad'}"><strong>${r.correct ? 'Correct — a valid Latin sentence.' : r.status === 'partial' ? 'Partly right.' : 'Not yet.'}</strong> ${r.macronOnly ? '<span class="ink">Only macrons are wrong.</span>' : ''}</div>
        ${section('1', 'Suggested translation', `<div class="latin-big">${esc(c.ref)}</div>${c.alts.length ? `<div class="small muted mt1">Also correct: ${c.alts.map(la).join(' · ')}</div>` : ''}<div class="small muted mt1">Any order that keeps the same endings is also correct${r.correct && text.toLowerCase().replace(/[.!]/g, '').trim() !== c.ref.toLowerCase().replace(/[.!]/g, '') ? ' — yours was accepted as a valid alternative' : ''}.</div>`)}
        ${section('2', 'Word-by-word analysis', analysisTable(refToks))}${section('3', 'Important endings', endingsHtml(refToks))}
        ${section('4', 'What was checked', `<ul style="margin:0;padding-left:18px">${r.slots.map((d) => `<li class="small ${d.ok ? '' : 'hl-bad'}">${d.ok ? '✓' : '✗'} ${esc(describeSlot(d.slot))}${d.ok ? ' — ' + la(d.token) : ''}</li>`).join('')}</ul>${c.note ? `<div class="why small mt1">${esc(c.note)}</div>` : ''}`)}
        ${section('5', 'About your attempt', r.messages.length ? `<ul style="margin:0;padding-left:18px">${r.messages.map((m) => `<li class="small">${esc(m)}</li>`).join('')}</ul>` : '<p class="mb0">Every required word has the right form.</p>')}
        <section class="card tight"><div class="caps">6</div><h4 style="margin:2px 0 8px">A similar sentence</h4><button class="btn primary" id="sim">${icon('arrow')}Try a similar question</button></section></div>`;
      $('#sim', root).onclick = () => draw(c);
    };
    $('#go', root).onclick = go; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
  }
  draw();
}
void fmt; void CASE_NAME; void NUM_NAME; void GENDER_NAME; void wordOf;
