import { LEXICON, BY_ID } from '../../data/lexicon.js';
import { SENTENCES, analyzer } from '../../core/corpus.js';
import { Q_BY_ID, shuffle, whyVerbForm, whyNounForm, PERS_LABEL, FUNC } from '../../core/questions.js';
import { conjugate, declineNoun, nounForm, adjForm, CASES, NUMS, CASE_NAME, NUM_NAME, GENDER_NAME, PERSONS } from '../../core/latin.js';
import { matchLatin, gradeCompose } from '../../core/grade.js';
import { tokenGloss, ROLE_LABEL } from '../../core/sentences.js';
import { mountQuestion, ruleBox } from '../qrun.js';
import { RULES } from '../../data/curriculum.js';
import { esc, fmt, la, icon, $, $$, pct, toast } from '../util.js';
import { Q_BY_ID as QB } from '../../core/questions.js';

const LABS = [['conjugation', 'Conjugation Builder', 'Complete the six-cell present-tense table — and the infinitive and imperatives.', 'Ch 1', 'col'], ['declension', 'Declension Arena', 'Fill a full case × number grid; mistakes are highlighted by case and number.', 'Ch 2–4', 'grammar'], ['detective', 'Case Detective', 'Pick a word in a sentence: case, number, gender, function. Ambiguity explained.', 'Ch 2–4', 'target'], ['agreement', 'Agreement Workshop', 'Supply the adjective in the right gender, number and case.', 'Ch 2–4', 'pen'], ['verbs', 'Verb Analysis', 'Person, number, tense, voice, mood, conjugation — only what applies.', 'Ch 1, 4', 'eye'], ['sum', 'SUM Challenge', 'Match, fill, complete and translate with sum and esse.', 'Ch 4', 'bolt'], ['dissection', 'Sentence Dissection', 'Label every word, then see the grammar drawn as connections.', 'Ch 1–4', 'link']];
const keyOf = (c, n) => `${c}.${n}`;
const wk = (s) => s.macronMode === 'strict';
const RC = ['S', 'V', 'O', 'I', 'A', 'G', 'N', 'AP', 'P', 'PO', 'VOC', 'INF'];

export default function grammar({ root, store, now, parts, q: Q }) {
  const st = store.state; let cleanup = null;
  const lab = parts[0];
  const rec = (qid, score, ans, extra = {}) => { const q = QB[qid]; if (q) store.recordAttempt({ q, res: { score, ...extra }, ans, mode: 'lab' }); };
  const head = (title, sub) => `<div class="crumbs"><a href="#/grammar">Grammar Lab</a> › ${esc(title)}</div><div class="page-head"><div><h1>${esc(title)}</h1><p>${sub}</p></div></div>`;
  const act = () => LEXICON.filter((w) => !store.isExcluded(w.id));
  const L = { conjugation, declension, detective, agreement, verbs, sum, dissection }[lab];
  if (!L) {
    root.innerHTML = `<div class="page-head"><div><div class="inscr">Laboratorium</div><h1 class="mt1">Grammar Lab</h1><p>Seven interactive exercises that turn morphology into something you can see. Production beats recognition: most ask you to type the form.</p></div></div><div class="grid g3">${LABS.map(([k, t, d, ch, ic]) => `<a class="card" href="#/grammar/${k}" style="text-decoration:none;color:inherit"><div class="row between"><span style="color:var(--gold-ink)">${icon(ic)}</span><span class="badge">${ch}</span></div><h3 class="mt1">${t}</h3><p class="small muted mb0">${d}</p></a>`).join('')}</div>`;
    return;
  }
  L(); return () => cleanup && cleanup();

  // ============================================================ A. Conjugation Builder
  function conjugation() {
    const verbs = act().filter((w) => w.pos === 'verb');
    let v = BY_ID[Q.v] || verbs[Math.floor(Math.random() * verbs.length)]; let extras = false;
    const draw = () => {
      const p = conjugate(v), sum = v.irreg === 'sum';
      root.innerHTML = head('Conjugation Builder', 'Type every form. Each cell is checked on its own, with the ending explained.') + `<div class="card"><div class="row between"><div><div class="la" style="font-size:28px;font-weight:600">${esc(v.pp.filter(Boolean).join(', '))}</div><div class="muted">${esc(v.en.join(', '))}${sum ? '' : ` · ${v.conj === 1 ? '1st' : '2nd'} conjugation`}</div>${v.note ? `<div class="small muted">${esc(v.note)}</div>` : ''}</div>
        <div class="row"><select class="input" id="pick" style="width:auto;min-height:40px">${verbs.map((w) => `<option value="${w.id}" ${w.id === v.id ? 'selected' : ''}>${esc(w.pp[0] + ', ' + w.pp[1])}</option>`).join('')}</select><button class="btn" id="rnd">${icon('refresh')}Random</button></div></div>
        <div class="grid g2 mt2" id="cells">${PERSONS.map(([pr, n], i) => ({ i, pr, n })).sort((a, b) => (a.pr - b.pr) || (a.n === 'sg' ? -1 : 1)).map(({ i, pr, n }) => `<div class="cellwrap"><label class="cell-lbl" for="c${i}">${['1st', '2nd', '3rd'][pr - 1]} person ${n === 'sg' ? 'singular' : 'plural'} · ${['I', 'you', 'he/she/it', 'we', 'you all', 'they'][i]}</label><input class="input" id="c${i}" data-la="on" data-k="ind${i}" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="cell-fix" id="f${i}"></div></div>`).join('')}</div>
        ${sum ? '<div class="cellwrap mt2"><label class="cell-lbl" for="cinf">Infinitive</label><input class="input" id="cinf" data-la="on" data-k="inf" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="cell-fix" id="finf"></div></div>' : `<label class="switch mt2"><input type="checkbox" id="ex" ${extras ? 'checked' : ''}> Include infinitive and imperatives</label>${extras ? `<div class="grid g3 mt1">${[['inf', 'Present infinitive'], ['impSg', 'Singular imperative'], ['impPl', 'Plural imperative']].map(([k, l]) => `<div class="cellwrap"><label class="cell-lbl" for="c${k}">${l}</label><input class="input" id="c${k}" data-la="on" data-k="${k}" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="cell-fix" id="f${k}"></div></div>`).join('')}</div>` : ''}`}
        <div class="row mt3"><button class="btn primary" id="chk">Check all</button><button class="btn" id="rev">Reveal answers</button><button class="btn quiet" id="nx">Next verb ${icon('arrow')}</button></div><div id="sum" class="mt2"></div></div>`;
      $('#pick', root).onchange = (e) => { v = BY_ID[e.target.value]; draw(); }; $('#rnd', root).onclick = () => { v = shuffle(verbs.filter((w) => w.id !== v.id))[0]; draw(); }; $('#nx', root).onclick = $('#rnd', root).onclick;
      const ex = $('#ex', root); if (ex) ex.onchange = () => { extras = ex.checked; draw(); };
      const key = (k) => (k.startsWith('ind') ? p.ind[+k.slice(3)] : k === 'inf' ? p.inf : p[k]);
      const qid = (k) => (k.startsWith('ind') ? `cf:${v.id}:${k.slice(3)}` : `ik:${v.id}:${k}`);
      // Endings are never shown before you answer. After checking, the breakdown appears only for cells you missed (or when you press Reveal).
      const fix = (k, ok, reveal = false) => { const inp = $(`[data-k="${k}"]`, root); const el = $(`#f${k.startsWith('ind') ? k.slice(3) : k}`, root); const form = key(k);
        if (ok && !reveal) { el.innerHTML = '<span class="hl-ok">✓ </span>Correct'; inp.classList.add('ok'); inp.readOnly = true; return; }
        const ending = !sum && !k.startsWith('imp') && k !== 'inf' ? ((b) => `<span class="la">${esc(form.slice(0, b))}<strong class="end" style="color:var(--gold-ink)">${esc(form.slice(b))}</strong></span>`)(p.base.length) : `<span class="la">${esc(form)}</span>`;
        el.innerHTML = `${reveal ? '' : '<span class="hl-bad">✗ </span>'}${ending}${k.startsWith('ind') ? '<br>' + fmt(whyVerbForm(v, +k.slice(3))) : k === 'inf' ? '<br>Stem + -re; no person or number.' : k === 'impSg' ? '<br>Bare stem = command to one person.' : k === 'impPl' ? '<br>Stem + -te = command to several.' : ''}`; inp.classList.add(reveal ? 'ok' : 'bad'); inp.readOnly = true; };
      $('#chk', root).onclick = () => { let ok = 0, tot = 0; $$('[data-k]', root).forEach((inp) => { if (inp.readOnly) return; const k = inp.dataset.k; if (!inp.value.trim()) return; tot++; const r = matchLatin(inp.value, [key(k)], { strict: wk(st.settings) }); if (r.ok) ok++; fix(k, !!r.ok); if (!r.ok && r.macronOnly) $(`#f${k.startsWith('ind') ? k.slice(3) : k}`, root).insertAdjacentHTML('beforeend', '<br><em>Check the macron.</em>'); rec(qid(k), r.ok ? 1 : 0, inp.value, { macronOnly: r.macronOnly }); }); $('#sum', root).innerHTML = tot ? `<div class="banner ${ok === tot ? 'ok' : 'warn'}"><strong>${ok} of ${tot} correct.</strong> ${ok === tot ? 'Try the next verb or add the imperatives.' : 'Study the red cells, then move on.'}</div>` : '<div class="banner info">Type at least one form first.</div>'; };
      $('#rev', root).onclick = () => { $$('[data-k]', root).forEach((inp) => { if (inp.readOnly) return; inp.value = key(inp.dataset.k); fix(inp.dataset.k, true, true); inp.classList.remove('ok'); }); };
      const first = $('#c0', root); first && first.focus();
      $$('[data-k]', root).forEach((i, n, all) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); n < all.length - 1 ? all[n + 1].focus() : $('#chk', root).click(); } }));
    };
    draw();
  }

  // ============================================================ B. Declension Arena
  function declension() {
    const nouns = act().filter((w) => w.pos === 'noun');
    let n = BY_ID[Q.n] || nouns[0];
    const draw = () => {
      const stem = n.type === 'er' ? n.stem : n.type === 'a' ? n.la.slice(0, -1) : n.la.slice(0, -2);
      const grp = (l, f) => `<optgroup label="${l}">${nouns.filter(f).map((w) => `<option value="${w.id}" ${w.id === n.id ? 'selected' : ''}>${esc(w.la + ', ' + w.gen)}</option>`).join('')}</optgroup>`;
      const voc = (c) => c === 'voc' && !n.anim && n.type !== 'um' && n.type !== 'ium';
      root.innerHTML = head('Declension Arena', 'Complete the whole grid from memory. Mistakes light up by case and number.') + `<div class="card"><div class="row between"><div><div class="la" style="font-size:28px;font-weight:600">${esc(n.la + ', ' + n.gen)}</div><div class="muted">${esc(n.en.join(', '))} · ${n.gender === 'mf' ? 'm./f.' : GENDER_NAME[n.gender]} · ${n.decl === 1 ? '1st' : '2nd'} declension</div><div class="small muted">Stem <span class="la">${esc(stem)}-</span> (from the genitive).${n.note ? ' ' + esc(n.note) : ''}</div></div>
        <div class="row"><select class="input" id="pick" style="width:auto;min-height:40px">${grp('First declension', (w) => w.type === 'a')}${grp('Second declension masculine', (w) => ['us', 'ius', 'er'].includes(w.type))}${grp('Second declension neuter', (w) => ['um', 'ium'].includes(w.type))}</select><button class="btn" id="rnd">${icon('refresh')}Random</button></div></div>
        <div class="tscroll mt2"><table class="ptable" id="grid"><thead><tr><th></th><th data-nh="sg">Singular</th><th data-nh="pl">Plural</th></tr></thead><tbody>${CASES.map((c) => `<tr><th data-ch="${c}">${CASE_NAME[c]}${voc(c) ? ' <span class="tiny">(optional)</span>' : ''}</th>${NUMS.map((nm) => `<td><input class="input" data-la="on" data-c="${c}" data-n="${nm}" aria-label="${CASE_NAME[c]} ${NUM_NAME[nm]}" autocomplete="off" autocapitalize="off" spellcheck="false"></td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <div class="row mt3"><button class="btn primary" id="chk">Check grid</button><button class="btn" id="hint">Show the stem</button><button class="btn" id="rev">Reveal answers</button><button class="btn quiet" id="nx">Next noun ${icon('arrow')}</button></div><div id="res" class="mt2"></div></div>`;
      $('#pick', root).onchange = (e) => { n = BY_ID[e.target.value]; draw(); }; $('#rnd', root).onclick = $('#nx', root).onclick = () => { n = shuffle(nouns.filter((w) => w.id !== n.id))[0]; draw(); };
      $('#hint', root).onclick = () => { $$('input', root).forEach((i) => { if (!i.value && !i.readOnly) i.placeholder = stem + '-'; }); };
      const inputs = $$('input[data-c]', root);
      inputs.forEach((i, k) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); k < inputs.length - 1 ? inputs[k + 1].focus() : $('#chk', root).click(); } }));
      inputs[0].focus();
      $('#rev', root).onclick = () => inputs.forEach((i) => { if (!i.readOnly) { i.value = nounForm(n, i.dataset.c, i.dataset.n)[0]; i.classList.add('ok'); i.readOnly = true; } });
      $('#chk', root).onclick = () => {
        const bad = []; const badC = new Set(), badN = new Set(); let ok = 0, tot = 0;
        inputs.forEach((i) => { const c = i.dataset.c, nm = i.dataset.n; if (i.readOnly || (!i.value.trim() && voc(c))) return; tot++; const r = matchLatin(i.value, nounForm(n, c, nm), { strict: wk(st.settings) }); i.classList.remove('ok', 'bad'); i.classList.add(r.ok ? 'ok' : 'bad'); if (r.ok) { ok++; i.readOnly = true; } else { bad.push([c, nm, i.value, r]); badC.add(c); badN.add(nm); } const qq = QB[`df:${n.id}:${c}.${nm}`]; if (qq) store.recordAttempt({ q: qq, res: { score: r.ok ? 1 : 0, macronOnly: r.macronOnly }, ans: i.value, mode: 'lab' }); });
        $$('[data-ch]', root).forEach((h) => h.classList.toggle('hl-bad', badC.has(h.dataset.ch))); $$('[data-nh]', root).forEach((h) => h.classList.toggle('hl-bad', badN.has(h.dataset.nh)));
        $('#res', root).innerHTML = `<div class="banner ${bad.length ? 'warn' : 'ok'}"><strong>${ok} of ${tot} correct.</strong>${bad.length ? ' Missed: ' + [...new Set(bad.map(([c, nm]) => `${CASE_NAME[c]} ${NUM_NAME[nm]}`))].join(', ') + '. Fix the red cells and check again, or reveal.' : ' The whole grid is right.'}</div>${bad.length ? `<div class="list mt1">${bad.map(([c, nm, a, r]) => `<div class="small"><strong>${CASE_NAME[c]} ${NUM_NAME[nm]}</strong>: you wrote ${a ? la(a) : '(blank)'} → ${la(nounForm(n, c, nm)[0])}<br>${fmt(whyNounForm(n, c, nm))}${r.macronOnly ? ' <em>Watch the macron.</em>' : ''}</div>`).join('')}</div>` : ''}`;
      };
    };
    draw();
  }

  // ============================================================ C. Case Detective
  function detective() {
    let level = +Q.lvl || 1, chap = Q.ch || 'all', formOnly = false, sent = null, sel = null, solved = {}; const used = [];
    const pickS = () => { const pool = SENTENCES.filter((s) => s.ch >= 2 && s.lvl === level && (chap === 'all' || s.ch === +chap) && s.toks.filter((t) => t.analysis.case && t.role !== 'A').length >= 2 && !s.toks.some((t) => st.settings.excluded[t.analysis.lemma])); const fresh = pool.filter((s) => !used.includes(s.id)); const s = shuffle(fresh.length ? fresh : pool)[0]; used.push(s?.id); if (used.length > 8) used.shift(); return s; };
    const funcs = () => ['S', 'O', 'I', 'G', 'PO', 'VOC', ...(sent.ch >= 3 ? ['AP'] : []), ...(sent.ch >= 4 ? ['N'] : [])];
    const targets = () => sent.toks.map((t, i) => ({ t, i })).filter(({ t }) => t.analysis.case && (t.role !== 'A' || level >= 2));
    const draw = () => {
      if (!sent) sent = pickS(); if (!sent) { root.innerHTML = head('Case Detective', '') + '<div class="card empty">No sentences match these settings.</div>'; return; }
      const tg = targets();
      root.innerHTML = head('Case Detective', 'Tap a highlighted word, then name its case, number, gender and function. Context decides when a form could be several things.') + `<div class="row" style="margin-bottom:var(--s3)"><div class="seg">${[1, 2, 3].map((l) => `<button data-l="${l}" aria-pressed="${level === l}">Level ${l}</button>`).join('')}</div><select class="input" id="chs" style="width:auto;min-height:38px"><option value="all">All chapters</option>${[2, 3, 4].map((c) => `<option value="${c}" ${String(chap) === String(c) ? 'selected' : ''}>Chapter ${c}</option>`).join('')}</select><label class="switch"><input type="checkbox" id="fo" ${formOnly ? 'checked' : ''}> Form only (no context)</label></div>
      <div class="card"><div class="caps">${formOnly ? 'Isolated word — any possible analysis counts' : 'Sentence'} · Chapter ${sent.ch}</div><div class="sent" id="sent">${sent.toks.map((t, i) => { const isT = tg.some((x) => x.i === i); const cls = ['tok', isT ? 'target' : '', sel === i ? 'sel' : '', solved[i] ? 'done' : ''].join(' '); return isT ? `<button class="${cls}" data-t="${i}">${esc(t.raw.replace(/,$/, ''))}${t.raw.endsWith(',') ? '<span style="font-weight:400">,</span>' : ''}</button>` : `<span class="tok" style="opacity:.8">${esc(t.raw)}</span>`; }).join('')}<span class="tok" style="padding-left:0">${esc(sent.la.slice(-1))}</span></div>
      <p class="small muted mb0">${Object.keys(solved).length} of ${tg.length} words solved${Object.keys(solved).length === tg.length ? ' — sentence translation: <strong>“' + esc(sent.en) + '”</strong>' : ''}</p></div><div id="panel" class="mt2"></div><div class="row mt2"><button class="btn" id="nxt">New sentence ${icon('arrow')}</button></div>`;
      $$('[data-l]', root).forEach((b) => (b.onclick = () => { level = +b.dataset.l; sent = null; solved = {}; sel = null; draw(); })); $('#chs', root).onchange = (e) => { chap = e.target.value; sent = null; solved = {}; sel = null; draw(); }; $('#fo', root).onchange = (e) => { formOnly = e.target.checked; sel = null; draw(); }; $('#nxt', root).onclick = () => { sent = null; solved = {}; sel = null; draw(); };
      $$('[data-t]', root).forEach((b) => (b.onclick = () => { sel = +b.dataset.t; draw(); }));
      if (sel != null) panel();
    };
    function panel() {
      const t = sent.toks[sel], a = t.analysis; const lex = BY_ID[a.lemma]; const isAdj = a.pos === 'adj'; const poss = new Set(analyzer.analyze(t.word.toLowerCase()).filter((x) => x.case).map((x) => keyOf(x.case, x.number)));
      const ch = { c: null, n: null, g: null, f: null, h: null };
      const grp = (k, opts, lab) => `<div><div class="lbl">${lab}</div><div class="chips mt1" data-g="${k}">${opts.map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>`;
      const nominals = sent.toks.map((x, i) => ({ x, i })).filter(({ x }) => x.analysis.pos === 'noun');
      $('#panel', root).innerHTML = `<div class="card col" style="gap:var(--s4)"><h3>Analyse <span class="la" style="font-size:1.3em">${esc(t.word)}</span></h3>${grp('c', CASES.map((c) => [c, CASE_NAME[c]]), 'Case')}${grp('n', NUMS.map((n) => [n, NUM_NAME[n]]), 'Number')}${formOnly ? '' : grp('g', ['m', 'f', 'n'].map((g) => [g, GENDER_NAME[g]]), 'Gender')}${formOnly ? '' : isAdj ? grp('h', nominals.map(({ x, i }) => [i, esc(x.word)]), 'Modifies which noun?') : grp('f', funcs().map((r) => [r, FUNC[r]]), 'Function in this sentence')}<div class="row"><button class="btn primary" id="ck" disabled>Check</button></div><div id="fb"></div></div>`;
      $$('[data-g]', root).forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', g).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); ch[g.dataset.g] = b.dataset.v; $('#ck', root).disabled = !(ch.c && ch.n && (formOnly || (ch.g && (isAdj ? ch.h != null : ch.f)))); }));
      $('#ck', root).onclick = () => {
        const okCN = formOnly ? poss.has(keyOf(ch.c, ch.n)) : ch.c === a.case && ch.n === a.number;
        const genders = a.pos === 'noun' ? (a.genders || [a.gender]) : [a.gender]; const okG = formOnly || genders.includes(ch.g);
        const okF = formOnly || (isAdj ? +ch.h === t.head : ch.f === t.role); const all = okCN && okG && okF;
        const lbl = (cn) => { const [c, n] = cn.split('.'); return `${CASE_NAME[c]} ${NUM_NAME[n]}`; };
        $('#fb', root).innerHTML = `<div class="banner ${all ? 'ok' : 'bad'}"><strong>${all ? 'Correct.' : 'Not quite.'}</strong> <span class="ink">${formOnly ? `${esc(t.word)} can be: ${[...poss].map(lbl).join(' · ')}.` : ''}</span></div><div class="why small mt1">${formOnly ? `Without context, ${la(t.word)} is ${poss.size > 1 ? 'ambiguous' : 'unambiguous'}. ${poss.size > 1 ? 'Switch off “Form only” to see how the sentence decides.' : ''}` : `<strong>${la(t.word)}</strong> is <strong>${lbl(keyOf(a.case, a.number))}</strong>, ${genders.map((g) => GENDER_NAME[g]).join('/')}; ${isAdj ? `it agrees with <strong>${la(sent.toks[t.head].word)}</strong>` : `function: <strong>${FUNC[t.role]}</strong>`}.${poss.size > 1 ? `<br>By form alone it could be ${[...poss].map(lbl).join(' / ')} — the context decides: ${t.role === 'S' ? 'the verb agrees with it and no other nominative is available' : t.role === 'G' ? 'it modifies a neighbouring noun with “of”' : t.role === 'I' ? 'a verb of giving needs a dative recipient' : 'the sentence structure leaves one reading'}.` : ''}<br>Lexical form: ${la(tokenGloss(t, BY_ID).lemma)} — ${esc(lex.en.join(', '))}.`}</div>`;
        if (all) solved[sel] = true;
        const id = (p) => `${p}:${sent.id}:${sel}`; const q1 = QB[id('sc')], q2 = QB[id('sf')];
        if (q1 && !formOnly) store.recordAttempt({ q: q1, res: { score: okCN ? 1 : 0 }, ans: `${ch.c} ${ch.n}`, mode: 'lab' });
        if (q2 && !formOnly && !isAdj) store.recordAttempt({ q: q2, res: { score: okF ? 1 : 0 }, ans: String(ch.f), mode: 'lab' });
        if (all) { const nx = document.createElement('div'); nx.className = 'row mt1'; nx.innerHTML = '<button class="btn primary">Continue</button>'; $('#fb', root).append(nx); nx.firstElementChild.onclick = () => { sel = null; draw(); }; }
      };
    }
    draw();
  }

  // ============================================================ D. Agreement Workshop
  function agreement() {
    let chap = Q.ch || 'all'; let ctrl = null; const used = new Set();
    const pool = () => Object.values(Q_BY_ID).filter((q) => q.id.startsWith('agree:') && (chap === 'all' || q.ch === +chap) && !q.vocab.some((x) => st.settings.excluded[x]));
    const next = () => {
      if (ctrl) ctrl.destroy(); const p = pool(); const fresh = p.filter((q) => !used.has(q.id)); const q = shuffle(fresh.length ? fresh : p)[0]; used.add(q.id);
      const [, nid, cn, aid] = q.id.split(':'); const [c, nm] = cn.split('.'); const noun = BY_ID[nid], adj = BY_ID[aid]; const g = noun.gender;
      root.innerHTML = head('Adjective Agreement Workshop', 'Adjectives agree in <strong>gender, number and case</strong> — not necessarily in the letters they end with.') + `<div class="row" style="margin-bottom:var(--s3)"><div class="chips">${[['all', 'All'], [2, 'Ch 2'], [3, 'Ch 3'], [4, 'Ch 4']].map(([v, l]) => `<button class="chip" data-c="${v}" aria-pressed="${String(chap) === String(v)}">${l}</button>`).join('')}</div></div><div id="q"></div>`;
      $$('[data-c]', root).forEach((b) => (b.onclick = () => { chap = b.dataset.c; next(); }));
      ctrl = mountQuestion($('#q', root), q, { settings: st.settings, onSubmit: ({ ans, res }) => {
        store.recordAttempt({ q, res, ans, mode: 'lab' });
        const nf = nounForm(noun, c, nm)[0], af = q.accept[0]; const sameEnd = nf.slice(-2) === af.slice(-2);
        const rows = [['Gender', GENDER_NAME[g], GENDER_NAME[g]], ['Number', NUM_NAME[nm], NUM_NAME[nm]], ['Case', CASE_NAME[c], CASE_NAME[c]]];
        const box = ctrl.afterSlot(); box.innerHTML = `<div class="card soft mt2"><div class="caps" style="margin-bottom:6px">Why it agrees</div><table class="etable"><thead><tr><th></th><th>${la(nf)}</th><th>${la(af)}</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="hl-ok">✓</td></tr>`).join('')}<tr><td>Visible ending</td><td class="end">-${esc(nf.slice(-2))}</td><td class="end">-${esc(af.slice(-2))}</td><td>${sameEnd ? '' : '≠ — and that is fine'}</td></tr></tbody></table><p class="small mt1 mb0">${sameEnd ? 'The endings happen to match here, but agreement is about the three features.' : 'The endings differ, yet the grammatical features are identical. That is what “agreement” means.'}${noun.type === 'a' && g === 'm' ? ' <strong>' + esc(noun.la) + '</strong> is a masculine 1st-declension noun, so it takes masculine adjective forms.' : ''}</p></div><div class="row mt2" style="justify-content:flex-end"><button class="btn primary" id="nx">Next phrase ${icon('arrow')}</button></div>`; $('#nx', box).onclick = next; $('#nx', box).focus(); } });
      ctrl.focus(); void adj;
    };
    next(); cleanup = () => ctrl && ctrl.destroy();
  }

  // ============================================================ E. Verb Analysis
  function verbs() {
    const items = []; act().filter((w) => w.pos === 'verb' && w.ch === 1).concat(act().filter((w) => w.id === 'sum')).forEach((w) => { const p = conjugate(w); p.ind.forEach((f, i) => items.push({ w, f, kind: 'ind', i })); items.push({ w, f: p.inf, kind: 'inf' }); if (p.impSg) { items.push({ w, f: p.impSg, kind: 'imp', num: 'sg' }); items.push({ w, f: p.impPl, kind: 'imp', num: 'pl' }); } });
    const ok = items.filter((x) => x.f !== 'es'); // "es" is ambiguous (indicative / imperative of sum) and not tested
    let it, score = { n: 0, ok: 0 };
    const next = () => { it = shuffle(ok.filter((x) => !(x.w.id === 'sum' && x.kind !== 'ind' && x.kind !== 'inf')))[0]; draw(); };
    const draw = () => {
      const w = it.w; const sum = w.id === 'sum';
      root.innerHTML = head('Verb Analysis', 'Name only what applies: an infinitive has no person or number, and an imperative has number but no person.') + `<div class="card col" style="gap:var(--s4)"><div class="caps">${score.ok} of ${score.n} fully correct</div><div class="latin-big" style="font-size:44px">${esc(it.f)}</div>
      <div><div class="lbl">Mood</div><div class="chips mt1" data-g="mood">${[['ind', 'Indicative (statement)'], ['imp', 'Imperative (command)'], ['inf', 'Infinitive']].map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div><div id="dyn" class="col" style="gap:var(--s4)"></div><div class="row"><button class="btn primary" id="ck" disabled>Check</button><button class="btn quiet" id="sk">Skip</button></div><div id="fb"></div></div>`;
      const ans = {}; const fields = () => { const m = ans.mood; $('#dyn', root).innerHTML = (m ? `${m === 'ind' ? `<div><div class="lbl">Person</div><div class="chips mt1" data-g="person">${[1, 2, 3].map((p) => `<button class="chip" data-v="${p}" aria-pressed="false">${['1st', '2nd', '3rd'][p - 1]}</button>`).join('')}</div></div>` : ''}${m !== 'inf' ? `<div><div class="lbl">Number</div><div class="chips mt1" data-g="number">${NUMS.map((n) => `<button class="chip" data-v="${n}" aria-pressed="false">${NUM_NAME[n]}</button>`).join('')}</div></div>` : '<div class="small muted">An infinitive has no person or number.</div>'}<div><div class="lbl">Tense</div><div class="chips mt1" data-g="tense"><button class="chip" data-v="pres" aria-pressed="false">Present</button><button class="chip" data-v="perf" aria-pressed="false">Perfect</button></div></div><div><div class="lbl">Voice</div><div class="chips mt1" data-g="voice"><button class="chip" data-v="act" aria-pressed="false">Active</button><button class="chip" data-v="pass" aria-pressed="false">Passive</button></div></div><div><div class="lbl">Conjugation</div><div class="chips mt1" data-g="conj">${[['1', '1st'], ['2', '2nd'], ['0', 'Irregular (sum)']].map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="false">${l}</button>`).join('')}</div></div>` : ''); const need = ['mood', ...(m === 'ind' ? ['person'] : []), ...(m && m !== 'inf' ? ['number'] : []), ...(m ? ['tense', 'voice', 'conj'] : [])]; $('#ck', root).disabled = !need.every((k) => ans[k] != null); };
      root.addEventListener('click', (e) => { const b = e.target.closest('.chip'); const g = b && b.parentElement.dataset.g; if (!g) return; $$('.chip', b.parentElement).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); ans[g] = b.dataset.v; if (g === 'mood') { for (const k of ['person', 'number']) delete ans[k]; fields(); $$('[data-g="mood"] .chip', root).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === ans.mood))); } else { const m = ans.mood; const need = ['mood', ...(m === 'ind' ? ['person'] : []), ...(m !== 'inf' ? ['number'] : []), 'tense', 'voice', 'conj']; $('#ck', root).disabled = !need.every((k) => ans[k] != null); } });
      $('#sk', root).onclick = next;
      $('#ck', root).onclick = () => {
        const truth = { mood: it.kind, tense: 'pres', voice: 'act', conj: String(sum ? 0 : w.conj) }; if (it.kind === 'ind') { truth.person = String(PERSONS[it.i][0]); truth.number = PERSONS[it.i][1]; } if (it.kind === 'imp') truth.number = it.num;
        const wrong = Object.keys(truth).filter((k) => ans[k] !== truth[k]); score.n++; if (!wrong.length) score.ok++;
        store.recordAttempt({ q: { id: `va:${w.id}:${it.f}`, ch: sum ? 4 : 1, topic: sum ? 'sum' : 'verb-id', section: 'conjugation', type: 'typed', pseudo: true }, res: { score: 1 - wrong.length / Object.keys(truth).length * (wrong.length ? 1 : 0) > 0 && wrong.length ? 0 : 1 }, ans: JSON.stringify(ans), mode: 'lab' });
        const desc = it.kind === 'ind' ? `${PERS_LABEL[it.i]}, present active indicative` : it.kind === 'imp' ? `${NUM_NAME[it.num]} imperative (present active) — a command, so no person` : 'present active infinitive — no person or number';
        $('#fb', root).innerHTML = `<div class="banner ${wrong.length ? 'bad' : 'ok'} mt1"><strong>${wrong.length ? 'Not quite: ' + wrong.join(', ') : 'Correct.'}</strong></div><div class="why mt1"><strong>${la(it.f)}</strong> = ${desc}; ${sum ? 'irregular verb ' + la('sum') : (w.conj === 1 ? '1st' : '2nd') + ' conjugation, from ' + la(w.pp[0] + ', ' + w.pp[1])}.<br>${it.kind === 'ind' ? fmt(whyVerbForm(w, it.i)) : it.kind === 'imp' ? 'Singular = stem; plural = stem + -te.' : 'Stem + -re.'}</div><div class="row mt1" style="justify-content:flex-end"><button class="btn primary" id="n2">Next form ${icon('arrow')}</button></div>`; $('#ck', root).remove(); $('#n2', root).onclick = next; $('#n2', root).focus();
      };
    };
    next();
  }

  // ============================================================ F. SUM Challenge
  function sum() {
    const tab = parts[1] || 'match';
    const SENT = [['I am a farmer.', 'Agricola ___.', 'sum'], ['You (sing.) are a poet.', 'Poēta ___.', 'es'], ['The queen is good.', 'Rēgīna bona ___.', 'est'], ['We are sailors.', 'Nautae ___.', 'sumus'], ['You (pl.) are slaves.', 'Servī ___.', 'estis'], ['The boys are in the field.', 'Puerī in agrō ___.', 'sunt'], ['War is evil.', 'Bellum malum ___.', 'est'], ['The gifts are good.', 'Dōna bona ___.', 'sunt'], ['You (pl.) are friends.', 'Amīcī ___.', 'estis'], ['I am a teacher.', 'Magister ___.', 'sum'], ['We ought to be good.', 'Bonī ___ dēbēmus.', 'esse'], ['The temple is in the town.', 'Templum in oppidō ___.', 'est'], ['You (sing.) are a good slave.', 'Servus bonus ___.', 'es'], ['The sailors and the girls are on the island.', 'Nautae et puellae in īnsulā ___.', 'sunt'], ['I am a boy.', 'Puer ___.', 'sum'], ['You ought to be a good friend.', 'Amīcus bonus ___ dēbēs.', 'esse']];
    const FORMS = ['sum', 'es', 'est', 'sumus', 'estis', 'sunt', 'esse'];
    const EN = ['I am', 'you (sing.) are', 'he/she/it is', 'we are', 'you (pl.) are', 'they are', 'to be'];
    root.innerHTML = head('SUM Challenge', 'sum, es, est, sumus, estis, sunt — and the infinitive esse.') + `<div class="tabs">${[['match', 'Match'], ['fill', 'Fill in the blank'], ['complete', 'Sentence completion'], ['translate', 'Translation']].map(([k, l]) => `<a href="#/grammar/sum/${k}" ${tab === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</div><div id="b"></div>`;
    const b = $('#b', root); const recS = (id, ok, ans) => store.recordAttempt({ q: { id, ch: 4, topic: 'sum', section: 'conjugation', type: 'typed', pseudo: true }, res: { score: ok ? 1 : 0 }, ans, mode: 'lab' });
    if (tab === 'match') {
      const round = () => { const L2 = shuffle(FORMS.map((f, i) => ({ f, i }))), R = shuffle(FORMS.map((f, i) => ({ f, i }))); let sel = null, done = 0; const miss = new Set();
        b.innerHTML = `<div class="card"><p class="muted">Tap a Latin form, then its English meaning.</p><div class="pairs"><div class="col" style="gap:8px">${L2.map((x) => `<button class="pair la" data-l="${x.i}" style="font-size:22px">${x.f}</button>`).join('')}</div><div class="col" style="gap:8px">${R.map((x) => `<button class="pair" data-r="${x.i}">${EN[x.i]}</button>`).join('')}</div></div><div id="m" class="mt2"></div></div>`;
        b.onclick = (e) => { const l = e.target.closest('[data-l]'), r = e.target.closest('[data-r]'); if (l && !l.classList.contains('done')) { $$('[data-l]', b).forEach((x) => x.classList.remove('sel')); l.classList.add('sel'); sel = l.dataset.l; } else if (r && sel != null && !r.classList.contains('done')) { if (r.dataset.r === sel) { $(`[data-l="${sel}"]`, b).classList.replace('sel', 'done'); r.classList.add('done'); recS(`summ:${FORMS[sel]}`, !miss.has(sel), FORMS[sel]); done++; sel = null; if (done === 7) $('#m', b).innerHTML = `<div class="banner ok"><strong>All matched${miss.size ? ` (${miss.size} needed a second try)` : ' first time'}.</strong></div><div class="mt1"><button class="btn primary" id="again">Again</button></div>`, $('#again', b).onclick = round; } else { miss.add(sel); r.classList.add('wrong'); setTimeout(() => r.classList.remove('wrong'), 350); } } }; };
      round();
    } else if (tab === 'fill') {
      let i = 0; const order = shuffle(FORMS.map((f, k) => k)); const step = () => { const k = order[i % 7]; b.innerHTML = `<div class="card"><div class="caps">${i + 1}</div><div class="qprompt">Which form of <span class="la">sum</span> means “<strong>${EN[k]}</strong>”?</div><input class="input" data-la="on" id="a" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="row mt2"><button class="btn primary" id="c">Check</button></div><div id="f"></div></div>`; const inp = $('#a', b); inp.focus(); const go = () => { const r = matchLatin(inp.value, [FORMS[k]]); recS(`sumf:${FORMS[k]}`, r.ok, inp.value); $('#f', b).innerHTML = `<div class="banner ${r.ok ? 'ok' : 'bad'} mt2"><strong>${r.ok ? 'Correct' : 'Not quite'}</strong> — ${la(FORMS[k])} = ${EN[k]}.</div><div class="row mt1" style="justify-content:flex-end"><button class="btn primary" id="n">Next</button></div>`; $('#c', b).remove(); inp.readOnly = true; $('#n', b).onclick = () => { i++; step(); }; $('#n', b).focus(); }; $('#c', b).onclick = go; inp.onkeydown = (e) => { if (e.key === 'Enter') go(); }; }; step();
    } else if (tab === 'complete') {
      let ord = shuffle(SENT), i = 0, sc = 0; const step = () => { if (i >= ord.length) { b.innerHTML = `<div class="card"><h3>Done: ${sc} / ${ord.length}</h3><button class="btn primary" id="r">Again</button></div>`; $('#r', b).onclick = () => { ord = shuffle(SENT); i = 0; sc = 0; step(); }; return; } const [en, lat, ans] = ord[i]; const opts = shuffle([ans, ...shuffle(FORMS.filter((f) => f !== ans)).slice(0, 3)]); b.innerHTML = `<div class="card"><div class="caps">${i + 1} of ${ord.length}</div><div class="qprompt display" style="font-size:24px">“${esc(en)}”</div><div class="latin-big mt1">${esc(lat)}</div><div class="opts two mt2">${opts.map((o, k) => `<button class="opt" data-o="${o}"><span class="k">${k + 1}</span><span class="la">${o}</span></button>`).join('')}</div><div id="f"></div></div>`; b.onclick = (e) => { const o = e.target.closest('.opt'); if (!o || o.dataset.done) return; $$('.opt', b).forEach((x) => { x.dataset.done = 1; x.classList.toggle('ok', x.dataset.o === ans); x.classList.toggle('bad', x === o && o.dataset.o !== ans); }); const ok = o.dataset.o === ans; if (ok) sc++; recS(`sumc:${i}:${ans}`, ok, o.dataset.o); $('#f', b).innerHTML = `<div class="banner ${ok ? 'ok' : 'bad'} mt2"><strong>${ok ? 'Correct' : 'Not quite'}.</strong> <span class="ink">${esc(lat.replace('___', ans))} — ${esc(en)}</span></div><div class="row mt1" style="justify-content:flex-end"><button class="btn primary" id="n">Next</button></div>`; $('#n', b).onclick = () => { i++; step(); }; $('#n', b).focus(); }; }; step();
    } else {
      const T = [['The sailors are good.', 'Nautae bonī sunt.', ['nauta:nom.pl', 'bonus:nom.pl.m', 'sum:3.pl']], ['The temple is large.', 'Templum magnum est.', ['templum:nom.sg', 'magnus:nom.sg.n', 'sum:3.sg']], ['You (pl.) are friends.', 'Amīcī estis.', ['amicus:nom.pl', 'sum:2.pl']], ['The queen is in the town.', 'Rēgīna in oppidō est.', ['regina:nom.sg', 'in', 'oppidum:abl.sg', 'sum:3.sg']], ['I am a poet.', 'Poēta sum.', ['poeta:nom.sg', 'sum:1.sg']], ['The words are good.', 'Verba bona sunt.', ['verbum:nom.pl', 'bonus:nom.pl.n', 'sum:3.pl']]];
      let i = 0; const step = () => { const [en, ref, slots] = T[i % T.length]; b.innerHTML = `<div class="card"><div class="caps">Translate into Latin</div><div class="display mt1" style="font-size:28px">“${esc(en)}”</div><input class="input mt2" data-la="on" id="a" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="row mt2"><button class="btn primary" id="c">Check</button></div><div id="f"></div></div>`; const inp = $('#a', b); inp.focus(); const go = () => { const r = gradeCompose(inp.value, slots, { strict: wk(st.settings) }); recS(`sumt:${i % T.length}`, r.correct, inp.value); $('#f', b).innerHTML = `<div class="banner ${r.correct ? 'ok' : 'bad'} mt2"><strong>${r.correct ? 'Correct' : 'Not quite'}.</strong> <span class="ink">Model: ${la(ref)}</span></div>${r.messages.length ? `<p class="small mt1">${r.messages.map((m) => '• ' + esc(m)).join('<br>')}</p>` : ''}<div class="row" style="justify-content:flex-end"><button class="btn primary" id="n">Next</button></div>`; $('#c', b).remove(); inp.readOnly = true; $('#n', b).onclick = () => { i++; step(); }; $('#n', b).focus(); }; $('#c', b).onclick = go; inp.onkeydown = (e) => { if (e.key === 'Enter') go(); }; }; step();
    }
  }

  // ============================================================ G. Sentence Dissection
  function dissection() {
    let sent, assign = {}, sel = null, checked = false; const used = [];
    const pick = () => { const pool = SENTENCES.filter((s) => s.toks.length >= 3 && !s.toks.some((t) => st.settings.excluded[t.analysis.lemma])); const fresh = pool.filter((s) => !used.includes(s.id)); sent = shuffle(fresh.length ? fresh : pool)[0]; used.push(sent.id); if (used.length > 10) used.shift(); assign = {}; sel = null; checked = false; };
    const norm = (r) => (r === 'C' || r === 'D' ? 'X' : r);
    const draw = () => {
      if (!sent) pick();
      const palette = [...RC, 'X'];
      root.innerHTML = head('Sentence Dissection', 'Tap a word, then choose its job. Check, and the grammar is drawn as connections.') + `<div class="card"><div class="caps">Chapter ${sent.ch}</div><div class="sent" id="sent" style="padding-top:${checked ? 70 : 12}px">${sent.toks.map((t, i) => { const a = assign[i]; const right = checked ? norm(t.role) === a : null; return `<button class="tok ${a ? 'r-' + a : ''} ${sel === i ? 'sel' : ''} ${checked ? (right ? 'done' : 'miss') : ''}" data-i="${i}" ${checked ? 'disabled' : ''}>${esc(t.raw)}<span class="tag">${a ? (a === 'X' ? 'other' : ROLE_LABEL[a].split(' ')[0].toLowerCase()) : '&nbsp;'}</span></button>`; }).join('')}<svg class="arcs" id="arcs"></svg></div>
      ${checked ? '' : `<div class="chips mt2" id="pal" style="${sel == null ? 'opacity:.5;pointer-events:none' : ''}">${palette.map((r) => `<button class="rolechip r-${r}" data-r="${r}" aria-pressed="${assign[sel] === r}" style="--rc:var(--rc)">${r === 'X' ? 'Conjunction / adverb' : ROLE_LABEL[r]}</button>`).join('')}</div>`}
      <div class="row mt2">${checked ? '<button class="btn primary" id="nx">Next sentence</button>' : `<button class="btn primary" id="ck" ${Object.keys(assign).length < sent.toks.length ? 'disabled' : ''}>Check</button><span class="small muted">${Object.keys(assign).length} of ${sent.toks.length} labelled</span>`}</div><div id="fb"></div></div>`;
      $$('[data-i]', root).forEach((b) => (b.onclick = () => { if (checked) return; sel = +b.dataset.i; draw(); }));
      $$('[data-r]', root).forEach((b) => (b.onclick = () => { assign[sel] = b.dataset.r; const nxt = sent.toks.findIndex((_, i) => !assign[i]); sel = nxt >= 0 ? nxt : sel; draw(); }));
      const ck = $('#ck', root); if (ck) ck.onclick = () => { checked = true; const okN = sent.toks.filter((t, i) => norm(t.role) === assign[i]).length; store.recordAttempt({ q: { id: `sd:${sent.id}`, ch: sent.ch, topic: 'syntax', section: 'grammar', type: 'typed', pseudo: true }, res: { score: okN / sent.toks.length }, ans: '', mode: 'lab' }); draw(); const fb = $('#fb', root); const bad = sent.toks.map((t, i) => ({ t, i })).filter(({ t, i }) => norm(t.role) !== assign[i]); fb.innerHTML = `<div class="banner ${bad.length ? 'warn' : 'ok'} mt2"><strong>${okN} of ${sent.toks.length} correct.</strong> <span class="ink">“${esc(sent.en)}”</span></div>${bad.length ? `<div class="list mt1">${bad.map(({ t }) => `<div class="small"><strong>${la(t.word)}</strong> is the <strong>${esc(t.role === 'C' || t.role === 'D' ? 'conjunction/adverb' : ROLE_LABEL[t.role].toLowerCase())}</strong>${t.analysis.case ? ` — ${CASE_NAME[t.analysis.case]} ${NUM_NAME[t.analysis.number]}` : ''}.</div>`).join('')}</div>` : ''}${sent.note ? `<div class="why small mt1">${esc(sent.note)}</div>` : ''}<div class="small muted mt1">${Object.keys(ROLE_LABEL).filter((r) => sent.toks.some((t) => t.role === r)).map((r) => `<span style="color:var(--rc);--rc:var(--rc)" class="r-${r}"><span class="dot" style="background:var(--rc)"></span> ${ROLE_LABEL[r]}</span>`).join(' &nbsp; ')}</div>`; requestAnimationFrame(arcs); };
      const nx = $('#nx', root); if (nx) nx.onclick = () => { pick(); draw(); };
      if (checked) requestAnimationFrame(arcs);
    };
    function arcs() {
      const box = $('#sent', root), svg = $('#arcs', root); if (!box || !svg) return; const bx = box.getBoundingClientRect(); const els = $$('.tok[data-i]', box); const cx = (i) => { const r = els[i].getBoundingClientRect(); return [r.left - bx.left + r.width / 2, r.top - bx.top]; };
      const verb = sent.toks.findIndex((t) => t.role === 'V'); const links = [];
      sent.toks.forEach((t, i) => { let h = null; if (['S', 'O', 'I', 'N', 'INF'].includes(t.role)) h = verb >= 0 ? verb : null; else if (t.role === 'A' || t.role === 'AP') h = t.head; else if (t.role === 'PO') h = t.prep; else if (t.role === 'G') { h = sent.toks.findIndex((x, j) => j > i && ['S', 'O', 'I', 'PO', 'N'].includes(x.role)); if (h < 0) h = sent.toks.map((x, j) => ({ x, j })).filter(({ x, j }) => j < i && ['S', 'O', 'I', 'PO', 'N'].includes(x.role)).pop()?.j ?? null; } if (h != null && h !== i && h >= 0) links.push([i, h, t.role]); });
      svg.setAttribute('width', bx.width); svg.setAttribute('height', bx.height); svg.innerHTML = links.map(([a, b, r]) => { const [x1, y1] = cx(a), [x2, y2] = cx(b); const mx = (x1 + x2) / 2, lift = 14 + Math.min(52, Math.abs(x1 - x2) / 7); const col = getComputedStyle(els[a]).getPropertyValue('--rc') || 'currentColor'; return `<path d="M${x1} ${y1 - 2} Q ${mx} ${Math.min(y1, y2) - lift * 1.6} ${x2} ${y2 - 2}" stroke="${col}"/><circle cx="${x2}" cy="${y2 - 2}" r="3" fill="${col}"/>`; }).join(''); void r0;
    }
    const r0 = 0;
    draw(); window.addEventListener('resize', arcs); cleanup = () => window.removeEventListener('resize', arcs);
  }
}
void ruleBox; void RULES; void nounForm; void adjForm; void declineNoun; void esc;
