import { LEXICON, BY_ID, POS_LABEL, CHAPTERS } from '../../data/lexicon.js';
import { SENTENCES, analyzer } from '../../core/corpus.js';
import { Q_BY_ID, shuffle } from '../../core/questions.js';
import { conjugate, declineNoun, nounForm, adjForm, CASES, CASE_NAME, NUM_NAME } from '../../core/latin.js';
import { matchLatin, matchEnglish } from '../../core/grade.js';
import { schedule, buildQueue, examCapDays, DAY, MIN } from '../../core/srs.js';
import { mountQuestion } from '../qrun.js';
import { esc, fmt, la, icon, $, $$, pct, toast, optHtml } from '../util.js';

export const entryText = (w) => (w.pos === 'verb' ? w.pp.filter(Boolean).join(', ') : w.pos === 'noun' ? `${w.la}, ${w.gen}` : w.pos === 'adj' ? `${w.la}, ${w.f}, ${w.n}` : w.la + (w.forms ? ', ' + w.forms.join(', ') : ''));
const tag = (w) => (w.pos === 'noun' ? `${w.gender === 'mf' ? 'm./f.' : w.gender + '.'} · ${w.decl === 1 ? '1st' : '2nd'} decl.` : w.pos === 'verb' ? (w.irreg === 'sum' ? 'irregular' : w.conj + (w.conj === 1 ? 'st' : 'nd') + ' conj.') : w.pos === 'adj' ? '1st/2nd decl.' : POS_LABEL[w.pos]);
export const entryHtml = (w) => `<div class="la" style="font-size:24px;font-weight:600">${esc(entryText(w))}</div><div>${esc(w.en.join(', '))} <span class="tiny muted">· ${tag(w)} · Ch ${w.ch}</span></div>${w.note ? `<div class="small muted mt1">${esc(w.note)}</div>` : ''}`;
const MODES = [['srs', 'Spaced repetition', 'Scheduled reviews that return just before you would forget.'], ['la-en', 'Latin → English', 'Type the meaning.'], ['en-la', 'English → Latin', 'Type the Latin headword.'], ['mc', 'Multiple choice', 'Pick the meaning from four.'], ['entry', 'Dictionary entry', 'Type headword plus genitive / principal parts.'], ['flash', 'Flashcards', 'Flip, then rate your recall.'], ['match', 'Match pairs', 'Pair six Latin words with meanings.'], ['form', 'From the form', 'Find the dictionary word behind an inflected form.'], ['sentence', 'In a sentence', 'Meaning of a word inside a Latin sentence.'], ['rapid', 'Rapid recall', '60 seconds, as many as you can.']];

export default function vocab(ctx) {
  if (ctx.parts[0] === 'add') return import('./vocab-add.js').then((m) => m.default(ctx));
  return vocabMain(ctx);
}
function vocabMain({ root, store, now, parts, q: Q }) {
  const st = store.state; let cleanup = null;
  const f = { ch: Q.ch || 'all', pos: 'all', missed: false, q: '' };
  const missedIds = () => { const last = {}; st.attempts.filter((a) => a.topic === 'vocab').forEach((a) => { const id = a.qid.split(':').pop(); last[id] = a.score; }); return new Set(Object.keys(last).filter((k) => last[k] < 0.5)); };
  const filtered = (incExcluded = false) => { const mi = f.missed ? missedIds() : null; return LEXICON.filter((w) => (f.ch === 'all' || w.ch === +f.ch) && (f.pos === 'all' || w.pos === f.pos) && (incExcluded || !store.isExcluded(w.id)) && (!mi || mi.has(w.id)) && (!f.q || (w.la + ' ' + w.en.join(' ')).toLowerCase().includes(f.q.toLowerCase()) || w.id.includes(f.q.toLowerCase()))); };
  const filters = () => `<div class="row" style="margin-bottom:var(--s3)"><div class="chips">${[['all', 'All chapters'], [1, 'Ch 1'], [2, 'Ch 2'], [3, 'Ch 3'], [4, 'Ch 4']].map(([v, l]) => `<button class="chip" data-f="ch" data-v="${v}" aria-pressed="${String(f.ch) === String(v)}">${l}</button>`).join('')}</div><div class="chips">${[['all', 'All types'], ['verb', 'Verbs'], ['noun', 'Nouns'], ['adj', 'Adjectives'], ['prep', 'Prepositions'], ['conj', 'Other']].map(([v, l]) => `<button class="chip" data-f="pos" data-v="${v}" aria-pressed="${f.pos === v}">${l}</button>`).join('')}<button class="chip" data-f="missed" aria-pressed="${f.missed}">Previously missed</button></div></div>`;
  const bindFilters = (redraw) => $$('[data-f]', root).forEach((b) => (b.onclick = () => { const k = b.dataset.f; if (k === 'missed') f.missed = !f.missed; else f[k] = b.dataset.v === 'conj' ? 'conj' : b.dataset.v; redraw(); }));

  function browse() {
    const draw = () => {
      const list = filtered(true);
      root.innerHTML = `<div class="page-head"><div><h1>Vocabulary</h1><p>${LEXICON.length} words from Chapters 1–4 with full forms. Switch off anything your course has not reached; all quizzes respect it.</p></div><a class="btn primary" href="#/vocabulary/practice">${icon('play')}Practise</a></div>
      <div class="tabs"><a href="#/vocabulary" aria-current="page">Browse</a><a href="#/vocabulary/practice">Practice modes</a><a href="#/vocabulary/add">Add words</a></div>${filters()}
      <input class="input" id="srch" placeholder="Search Latin or English…" value="${esc(f.q)}" style="margin-bottom:var(--s3)">
      <div class="card tight"><p class="small muted mb0" style="margin-bottom:var(--s2)">${list.length} words. Words marked <span class="badge">confirm</span> are correct Latin whose chapter should be checked against your textbook.</p>${list.map((w) => { const c = st.srs[w.id]; const off = store.isExcluded(w.id); return `<div class="wcard ${off ? 'off' : ''}"><div><div class="head">${esc(entryText(w))}</div><div class="tiny muted">${tag(w)}</div></div><div><div>${esc(w.en.join(', '))}</div>${w.note ? `<div class="small muted">${esc(w.note)}</div>` : ''}<div class="tiny muted mt1"><label>Chapter <select data-ch="${w.id}" style="font:inherit;background:var(--surface);color:inherit;border:1px solid var(--line-2);border-radius:6px">${[1, 2, 3, 4].map((n) => `<option ${n === w.ch ? 'selected' : ''}>${n}</option>`).join('')}</select></label>${w.custom ? ' <span class="badge gold">yours</span>' : ''}${w.conf === 'check' ? ' <span class="badge">confirm</span>' : ''} · ${c ? (c.due <= now() ? 'due for review' : 'next review in ' + Math.max(1, Math.round((c.due - now()) / DAY)) + ' d') : 'not yet studied'}</div></div><label class="switch"><input type="checkbox" data-x="${w.id}" ${off ? '' : 'checked'}> <span class="small">in my course</span></label></div>`; }).join('') || '<p class="muted">No words match.</p>'}</div>`;
      bindFilters(draw); $('#srch', root).oninput = (e) => { f.q = e.target.value; const pos = e.target.selectionStart; draw(); const el = $('#srch', root); el.focus(); el.setSelectionRange(pos, pos); };
      $$('[data-ch]', root).forEach((sel) => (sel.onchange = () => { st.settings.chOverride[sel.dataset.ch] = +sel.value; store.save(true); toast('Chapter updated — reloading'); setTimeout(() => location.reload(), 400); }));
      $$('[data-x]', root).forEach((c) => (c.onchange = () => { store.setExcluded(c.dataset.x, !c.checked); draw(); }));
    };
    draw();
  }

  function practiceHome() {
    let mode = Q.mode || null; let size = 10;
    const draw = () => {
      root.innerHTML = `<div class="page-head"><div><h1>Vocabulary practice</h1><p>Ten ways to retrieve a word. Retrieval — not re-reading — is what builds memory.</p></div></div><div class="tabs"><a href="#/vocabulary">Browse</a><a href="#/vocabulary/practice" aria-current="page">Practice modes</a><a href="#/vocabulary/add">Add words</a></div>${filters()}
      <div class="grid g2">${MODES.map(([k, l, d]) => `<button class="card tight" data-m="${k}" style="text-align:left;cursor:pointer;${mode === k ? 'border-color:var(--gold);background:var(--gold-soft)' : ''}"><strong>${l}</strong><div class="small muted">${d}</div></button>`).join('')}</div>
      <div class="card mt2 row between"><div class="row"><span class="lbl">Words per round</span><div class="chips">${[5, 10, 20].map((n) => `<button class="chip" data-n="${n}" aria-pressed="${size === n}">${n}</button>`).join('')}</div></div><button class="btn primary lg" id="go" ${mode ? '' : 'disabled'}>${icon('play')}Start${mode ? ' · ' + MODES.find((m) => m[0] === mode)[1] : ''}</button></div><div id="stat" class="mt2"></div>`;
      bindFilters(draw);
      $$('[data-m]', root).forEach((b) => (b.onclick = () => { mode = b.dataset.m; draw(); }));
      $$('[data-n]', root).forEach((b) => (b.onclick = () => { size = +b.dataset.n; draw(); }));
      $('#go', root).onclick = () => start(mode, size);
      const ids = filtered().map((w) => w.id), qd = buildQueue(ids, st.srs, now(), { newLimit: st.settings.newPerDay, newToday: store.newToday() });
      $('#stat', root).innerHTML = `<p class="small muted">${ids.length} words match · <strong>${qd.due.length}</strong> due for review · <strong>${qd.fresh.length}</strong> new available today.</p>`;
    };
    if (Q.mode && Q.start !== '0' && MODES.some((m) => m[0] === Q.mode)) { start(Q.mode, 10); return () => cleanup && cleanup(); }
    draw();
    return () => cleanup && cleanup();
  }

  // ------------------------------------------------------------ sessions
  function pq(mode, w, extra) { return { id: `vw:${mode}:${w.id}`, ch: w.ch, topic: 'vocab', section: 'vocabulary', diff: 1, pseudo: true, vocab: [w.id], rule: 'vocab', explanation: entryText(w) + ' — ' + w.en.join(', ') + (w.note ? '. ' + w.note : ''), ...extra }; }
  function record(w, mode, score, ans, ms, grade) {
    store.recordAttempt({ q: pq(mode, w, { type: 'typed' }), res: { score }, ans, ms, mode: 'vocab-' + mode });
    store.reviewWord(w.id, grade ?? (score >= 1 ? 4 : score > 0 ? 3 : 1), { force: mode === 'srs' || mode === 'flash' });
  }
  const interval = (c, g) => { const n = schedule(c, g, now(), { examCapDays: examCapDays(now(), store.examTs()) }); const d = n.due - now(); return d < DAY ? Math.max(1, Math.round(d / MIN)) + ' min' : Math.round(d / DAY) + ' d'; };

  if (parts[0] === 'practice') return practiceHome();
  return browse();

  function start(mode, size) {
    const words = filtered();
    if (!words.length) return toast('No words match these filters');
    const sess = store.startSession('vocab-' + mode);
    let done = 0, right = 0;
    const end = (extra = '') => { store.endSession(sess, { n: done, correct: right }); root.innerHTML = `<div class="card"><div class="inscr">Bene factum</div><h2 class="mt1">Round complete</h2><p>${done ? `${right} of ${done} recalled correctly (${pct(right / done)}).` : 'No words were reviewed.'} ${extra}</p><div class="row"><button class="btn primary" id="again">Another round</button><a class="btn" href="#/vocabulary/practice">Modes</a><a class="btn quiet" href="#/dashboard">Dashboard</a></div></div>`; $('#again', root).onclick = () => start(mode, size); };
    const shell = (title, inner) => { root.innerHTML = `<div class="row between"><span class="caps">${title}</span><button class="btn quiet sm" id="quit">End round</button></div><div class="progress mt1" style="margin-bottom:var(--s4)"><i style="width:${done / size * 100}%"></i></div><div id="stage">${inner || ''}</div>`; $('#quit', root).onclick = () => end(); return $('#stage', root); };
    const nextBtn = (host, fn, label = 'Next') => { const b = document.createElement('div'); b.className = 'row mt2'; b.style.justifyContent = 'flex-end'; b.innerHTML = `<button class="btn primary">${label} ${icon('arrow')}</button>`; host.append(b); b.firstElementChild.onclick = fn; b.firstElementChild.focus({ preventScroll: true }); };
    let order = shuffle(words);
    const take = (n) => { const r = []; while (r.length < n && order.length) r.push(order.pop()); if (!r.length && words.length) { order = shuffle(words); } return r; };

    // generic "mount a question for a word" loop (modes 1,2,3,7,8)
    const qLoop = (title, mk) => {
      let ctrl; const step = () => {
        if (ctrl) ctrl.destroy();
        if (done >= size) return end();
        let w, q, tries = 0; do { w = take(1)[0]; q = w && mk(w); } while (w && !q && tries++ < 40);
        if (!q) return end('No suitable items for these filters.');
        const host = shell(`${title} · ${done + 1} of ${size}`); const t0 = performance.now();
        ctrl = mountQuestion(host, q, { settings: st.settings, hints: false, onSubmit: ({ ans, res }) => { done++; if (res.score >= 1) right++; record(w, mode, res.score, ans, Math.round(performance.now() - t0)); nextBtn(ctrl.afterSlot(), step); } });
        ctrl.focus();
      };
      step(); cleanup = () => ctrl && ctrl.destroy();
    };
    const poolOf = (w, n = 3) => shuffle(LEXICON.filter((x) => x.pos === w.pos && x.id !== w.id && x.ch <= Math.max(w.ch, 2) && !x.en.some((g) => w.en.includes(g)) && x.irreg !== 'sum')).slice(0, n);
    const disp = (x) => (x.pos === 'verb' ? 'to ' + x.en[0] : x.en[0]);

    if (mode === 'la-en') return qLoop('Latin → English', (w) => pq('la-en', w, { type: 'typed', lang: 'en', prompt: `What does {${w.la}} mean?`, accept: [...w.en, ...(w.pos === 'verb' ? w.en.map((e) => 'to ' + e) : [])] }));
    if (mode === 'en-la') return qLoop('English → Latin', (w) => { const q = Q_BY_ID['v:el:' + w.id]; return q && { ...q, pseudo: true, id: 'vw:en-la:' + w.id }; });
    if (mode === 'mc') return qLoop('Multiple choice', (w) => { const d = poolOf(w); if (d.length < 3) return null; const dir = Math.random() < 0.7; return dir ? pq('mc', w, { type: 'mcq', prompt: `What does {${w.la}} mean?`, options: [disp(w), ...d.map(disp)], answer: disp(w) }) : pq('mc', w, { type: 'mcq', prompt: `Which Latin word means “${disp(w)}”?`, options: [w.la, ...d.map((x) => x.la)], answer: w.la }); });
    if (mode === 'form') return qLoop('From the form', (w) => {
      const forms = formsOf(w); if (!forms.length) return null; const form = forms[Math.floor(Math.random() * forms.length)];
      const lem = new Set(analyzer.analyze(form.toLowerCase()).map((a) => a.lemma)); const d = poolOf(w, 6).filter((x) => !lem.has(x.id)).slice(0, 3); if (d.length < 3) return null;
      return pq('form', w, { type: 'mcq', prompt: `Which dictionary word does {${form}} come from?`, options: [entryText(w) + ' — ' + w.en[0], ...d.map((x) => entryText(x) + ' — ' + x.en[0])], answer: entryText(w) + ' — ' + w.en[0] });
    });
    if (mode === 'sentence') return qLoop('In a sentence', (w) => {
      const s = SENTENCES.filter((x) => x.toks.some((t) => t.analysis.lemma === w.id)); if (!s.length) return null; const sent = s[Math.floor(Math.random() * s.length)]; const tk = sent.toks.find((t) => t.analysis.lemma === w.id);
      const d = poolOf(w); if (d.length < 3) return null;
      return pq('sentence', w, { type: 'mcq', prompt: `In “{${sent.la}}”, what does {${tk.word}} mean?`, options: [disp(w), ...d.map(disp)], answer: disp(w), explanation: `{${tk.word}} comes from {${entryText(w)}} (${w.en.join(', ')}). Sentence: “${sent.en}”` });
    });
    if (mode === 'entry') {
      const step = () => {
        if (done >= size) return end(); const w = take(1)[0]; const fields = entryFields(w);
        const host = shell(`Dictionary entry · ${done + 1} of ${size}`, `<div class="card"><div class="qprompt">Write the full entry for “<strong>${esc(w.pos === 'verb' ? 'to ' + w.en[0] : w.en[0])}</strong>” <span class="muted small">(${esc(POS_LABEL[w.pos])}${w.pos === 'noun' ? ', ' + (w.gender === 'mf' ? 'm./f.' : w.gender + '.') : ''})</span></div><div class="grid" style="grid-template-columns:repeat(${Math.min(fields.length, 2)},1fr)">${fields.map((x, i) => `<div class="field"><label>${esc(x.label)}</label><input class="input" data-la="on" data-i="${i}" autocomplete="off" autocapitalize="off" spellcheck="false"></div>`).join('')}</div><div class="row mt2"><button class="btn primary" id="chk">Check</button></div><div id="fb"></div></div>`);
        const ins = $$('input', host); ins[0].focus();
        const check = () => { let ok = 0; ins.forEach((inp, i) => { const r = matchLatin(inp.value, [fields[i].a], { strict: st.settings.macronMode === 'strict' }); inp.classList.add(r.ok ? 'ok' : 'bad'); inp.readOnly = true; if (r.ok) ok++; }); const sc = ok / fields.length; done++; if (sc >= 1) right++; record(w, 'entry', sc, ins.map((i) => i.value).join(' | ')); $('#fb', host).innerHTML = `<div class="fb"><div class="banner ${sc >= 1 ? 'ok' : 'bad'}"><strong>${ok} of ${fields.length} correct.</strong></div><div class="why">${entryHtml(w)}</div></div>`; $('#chk', host).remove(); nextBtn($('#fb', host), step); };
        $('#chk', host).onclick = check; ins.forEach((i, k) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); if (k < ins.length - 1) ins[k + 1].focus(); else check(); } }));
      }; step(); return;
    }
    if (mode === 'flash' || mode === 'srs') {
      let queue;
      if (mode === 'srs') { const qd = buildQueue(words.map((w) => w.id), st.srs, now(), { newLimit: st.settings.newPerDay, newToday: store.newToday(), max: Math.max(size, 20) }); queue = qd.queue.map((id) => BY_ID[id]); size = Math.min(queue.length, Math.max(size, 20)); if (!queue.length) { const nxt = Math.min(...words.map((w) => st.srs[w.id]?.due ?? Infinity)); root.innerHTML = `<div class="card empty"><span class="inscr">Nihil agendum</span><h3>Nothing due right now</h3><p>All scheduled words are up to date${isFinite(nxt) ? ` — the next one is due in ${Math.max(1, Math.round((nxt - now()) / MIN))} minutes` : ''}. Try another mode to practise anyway.</p><div class="row" style="justify-content:center"><a class="btn" href="#/vocabulary/practice">Practice modes</a></div></div>`; return; } }
      else queue = take(size);
      let i = 0; const relearn = [];
      const step = () => {
        if (!queue.length && relearn.length) queue = relearn.splice(0);
        if (!queue.length || done >= size + relearn.length + 50) return end();
        const w = queue.shift(); const c = st.srs[w.id]; const toLa = mode === 'srs' && c && c.reps % 2 === 1; const t0 = performance.now(); i++;
        const front = toLa ? `<div class="display" style="font-size:clamp(28px,5vw,44px)">${esc(w.pos === 'verb' ? 'to ' + w.en[0] : w.en[0])}</div><div class="small muted mt1">${esc(POS_LABEL[w.pos])} — give the Latin</div>` : `<div class="front">${esc(w.la)}</div><div class="small muted mt1">${esc(POS_LABEL[w.pos])}</div>`;
        const host = shell(`${mode === 'srs' ? 'Spaced repetition' : 'Flashcards'} · ${Math.min(done + 1, size)} of ${size}${c ? '' : ' · new'}`, `<div class="card flash" id="card" tabindex="0" role="button" aria-label="Reveal answer"><div>${front}<div id="back"></div></div></div>
          ${mode === 'srs' ? `<div class="row mt2" id="typebox"><input class="input grow" ${toLa ? 'data-la="on"' : ''} id="ans" placeholder="${toLa ? 'Type the Latin…' : 'Type the meaning (optional)…'}" autocomplete="off" autocapitalize="off" spellcheck="false"><button class="btn" id="chk">Check</button></div>` : ''}<div class="row mt2" style="justify-content:center"><button class="btn" id="show">Show answer</button></div><div id="rate"></div>`);
        let revealed = false, suggested = null, typed = '';
        const reveal = () => {
          if (revealed) return; revealed = true; $('#back', host).innerHTML = `<hr class="rule-line"><div class="back" style="text-align:left;margin:0 auto">${entryHtml(w)}</div>`; $('#show', host).remove(); const tb = $('#typebox', host); tb && tb.remove();
          const card = c || { ef: 2.5, reps: 0, interval: 0, lapses: 0 };
          const opts = suggested === false ? [1] : [1, 3, 4, 5];
          $('#rate', host).innerHTML = `<div class="gradebar mt2">${[[1, 'Again'], [3, 'Hard'], [4, 'Good'], [5, 'Easy']].map(([g, l]) => `<button class="btn ${g === (suggested === true ? 4 : 0) ? 'primary' : ''}" data-g="${g}" ${opts.includes(g) ? '' : 'disabled'}>${l}<small>${interval(card, g)}</small></button>`).join('')}</div>${suggested === false ? '<p class="small center muted mt1">Marked “Again” because the typed answer did not match.</p>' : ''}`;
          $$('[data-g]', host).forEach((b) => (b.onclick = () => { const g = +b.dataset.g; done++; if (g >= 3) right++; else relearn.push(w); record(w, mode, g >= 4 ? 1 : g === 3 ? 0.5 : 0, typed, Math.round(performance.now() - t0), g); step(); }));
        };
        const check = () => { const inp = $('#ans', host); typed = inp.value; if (!typed.trim()) return reveal(); const r = toLa ? matchLatin(typed, [w.la, ...(w.forms || [])], { strict: st.settings.macronMode === 'strict' }) : matchEnglish(typed, [...w.en, ...(w.pos === 'verb' ? w.en.map((e) => 'to ' + e) : [])]); suggested = !!r.ok; reveal(); inp.classList.add(r.ok ? 'ok' : 'bad'); };
        $('#show', host).onclick = reveal; $('#card', host).onclick = reveal;
        const chk = $('#chk', host); if (chk) { chk.onclick = check; $('#ans', host).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } }); $('#ans', host).focus(); }
      };
      step(); return;
    }
    if (mode === 'match') {
      const round = () => {
        if (done >= size) return end(); const ws = take(Math.min(6, size - done, order.length + 0) || 6).slice(0, 6); if (!ws.length) return end();
        const L = shuffle(ws), R = shuffle(ws); let sel = null; const missed = new Set(); let matched = 0;
        const host = shell(`Match pairs · ${done + 1}–${done + ws.length} of ${size}`, `<div class="pairs"><div class="col" style="gap:8px">${L.map((w) => `<button class="pair la" data-l="${w.id}" style="font-size:20px">${esc(w.la)}</button>`).join('')}</div><div class="col" style="gap:8px">${R.map((w) => `<button class="pair" data-r="${w.id}">${esc(w.pos === 'verb' ? 'to ' + w.en[0] : w.en[0])}</button>`).join('')}</div></div>`);
        host.addEventListener('click', (e) => {
          const l = e.target.closest('[data-l]'), r = e.target.closest('[data-r]');
          if (l && !l.classList.contains('done')) { $$('[data-l]', host).forEach((x) => x.classList.remove('sel')); l.classList.add('sel'); sel = l.dataset.l; }
          else if (r && sel && !r.classList.contains('done')) {
            if (r.dataset.r === sel) { const ln = $(`[data-l="${sel}"]`, host); ln.classList.remove('sel'); ln.classList.add('done'); r.classList.add('done'); const w = BY_ID[sel]; const first = !missed.has(sel); if (first) right++; record(w, 'match', first ? 1 : 0, '', null); done++; matched++; sel = null; if (matched === ws.length) setTimeout(round, 500); }
            else { missed.add(sel); r.classList.add('wrong'); setTimeout(() => r.classList.remove('wrong'), 350); }
          }
        });
      }; round(); return;
    }
    if (mode === 'rapid') {
      let t = 60, n = 0, ok = 0; const missed = []; let ctrl;
      const tm = setInterval(() => { t--; const el = $('#t', root); if (el) el.textContent = t; if (t <= 0) { clearInterval(tm); fin(); } }, 1000); cleanup = () => clearInterval(tm);
      const fin = () => { done = n; right = ok; store.endSession(sess, { n, correct: ok }); root.innerHTML = `<div class="card"><div class="inscr">Celeritas</div><h2 class="mt1">${ok} correct in 60 seconds</h2><p>${n ? pct(ok / n) + ' accuracy over ' + n + ' words.' : ''}</p>${missed.length ? `<div class="why"><strong>Review these:</strong><div class="list mt1">${missed.map((w) => `<div>${entryHtml(w)}</div>`).join('')}</div></div>` : '<p>No misses!</p>'}<div class="row mt2"><button class="btn primary" id="again">Again</button><a class="btn" href="#/vocabulary/practice">Modes</a></div></div>`; $('#again', root).onclick = () => start(mode, size); };
      const step = () => {
        if (t <= 0) return; const w = take(1)[0]; const d = poolOf(w); if (d.length < 3) return step();
        const opts = shuffle([disp(w), ...d.map(disp)]); const t0 = performance.now();
        root.innerHTML = `<div class="row between"><span class="caps">Rapid recall</span><span class="timer"><span id="t">${t}</span>s · ${ok}/${n}</span></div><div class="progress mt1" style="margin-bottom:var(--s4)"><i style="width:${t / 60 * 100}%"></i></div><div class="card"><div class="latin-big center" style="margin-bottom:var(--s4)">${esc(w.la)}</div><div class="opts two">${opts.map((o, i) => `<button class="opt" data-o="${esc(o)}"><span class="k">${i + 1}</span>${esc(o)}</button>`).join('')}</div></div>`;
        const pick = (o) => { n++; const good = o === disp(w); if (good) ok++; else missed.push(w); record(w, 'rapid', good ? 1 : 0, o, Math.round(performance.now() - t0), good ? (performance.now() - t0 < 2500 ? 5 : 4) : 1); step(); };
        $$('.opt', root).forEach((b) => (b.onclick = () => pick(b.dataset.o)));
        const key = (e) => { if (/^[1-4]$/.test(e.key)) { document.removeEventListener('keydown', key); pick(opts[+e.key - 1]); } }; document.addEventListener('keydown', key);
      }; step(); return;
    }
  }
  function formsOf(w) {
    if (w.pos === 'verb') { const p = conjugate(w); return [...p.ind, p.inf, ...(p.impSg ? [p.impSg, p.impPl] : [])].filter((x) => x !== w.la); }
    if (w.pos === 'noun') { const out = []; for (const n of ['sg', 'pl']) for (const c of ['gen', 'dat', 'acc', 'abl']) out.push(nounForm(w, c, n)[0]); return out.filter((x) => x !== w.la && analyzer.analyze(x).filter((a) => a.pos === 'noun').length && !analyzer.analyze(x).some((a) => a.lemma !== w.id)); }
    if (w.pos === 'adj') { return [adjForm(w, 'f', 'gen', 'sg')[0], adjForm(w, 'n', 'acc', 'sg')[0], adjForm(w, 'm', 'gen', 'pl')[0]].filter((x) => !analyzer.analyze(x).some((a) => a.lemma !== w.id)); }
    return [];
  }
  function entryFields(w) {
    if (w.pos === 'verb') return w.pp.slice(0, 4).map((a, i) => ({ label: ['1st sg. present', 'infinitive', 'perfect', 'participle'][i], a })).filter((x) => x.a);
    if (w.pos === 'noun') return [{ label: 'nominative', a: w.la }, { label: 'genitive', a: w.gen }];
    if (w.pos === 'adj') return [{ label: 'masculine', a: w.la }, { label: 'feminine', a: w.f }, { label: 'neuter', a: w.n }];
    return [{ label: 'Latin', a: w.la }];
  }
}
void fmt; void la; void optHtml; void declineNoun; void CASES; void CASE_NAME; void NUM_NAME; void CHAPTERS;
