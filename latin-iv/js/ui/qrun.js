// Question renderer shared by Practice, Mock Exams, Mistake Bank and the labs.
import { gradeQuestion, finalizeSelf, describeSlot, parseSlot } from '../core/grade.js';
import { RULES, TOPICS } from '../data/curriculum.js';
import { BY_ID } from '../data/lexicon.js';
import { shuffle } from '../core/questions.js';
import { buildKeyRegexes } from '../core/sentences.js';
import { $, esc, fmt, la, optHtml, icon } from './util.js';
import { mascot, SAYINGS } from './mascot.js';

export const diffDots = (d) => `<span title="Difficulty ${d} of 3" aria-label="difficulty ${d} of 3">${[1, 2, 3].map((i) => `<span class="dot${i <= d ? ' ok' : ''}" style="${i <= d ? 'background:var(--gold)' : ''};margin-right:2px"></span>`).join('')}</span>`;
export const qBadges = (q) => `<span class="badge gold">Chapter ${q.ch}</span><span class="badge">${esc(TOPICS[q.topic]?.label || q.topic)}</span>${diffDots(q.diff)}`;

export function ruleBox(ruleId, open = false) {
  const r = RULES[ruleId]; if (!r) return '';
  return `<details class="rule"${open ? ' open' : ''}><summary>Rule · ${esc(r.title)}</summary><div class="body">${fmt(r.text)}</div></details>`;
}

/** Vocabulary list for hints: dictionary entries for the words in a sentence / composition. */
export function vocabHelp(q) {
  const ids = q.type === 'translate' ? [...new Set(q.sent.toks.map((t) => t.analysis.lemma))] : [...new Set(q.slots.map((s) => parseSlot(s).lemma))];
  const rows = ids.map((id) => { const w = BY_ID[id]; const head = w.pos === 'verb' ? w.pp.slice(0, 3).join(', ') : w.pos === 'noun' ? `${w.la}, ${w.gen}` : w.pos === 'adj' ? `${w.la}, ${w.f}, ${w.n}` : w.la; return `<tr><td>${la(head)}</td><td>${esc(w.en.join(', '))}</td></tr>`; });
  return `<table>${rows.join('')}</table>`;
}

export function rubricHtml(sent, kw) {
  const rows = kw.found.map((f) => `<li class="row tight" style="align-items:flex-start;flex-wrap:nowrap"><span class="${f.ok ? 'hl-ok' : 'hl-bad'}" style="width:18px;flex:none;margin-top:2px">${icon(f.ok ? 'check' : 'x')}</span><span>${esc(KEY_LABEL[f.role] || f.role)}: ${f.ok ? '<span class="muted">keyword found</span>' : '<strong>not found</strong> <span class="muted">(look for “' + esc(f.src.replace(/\\b/g, '').split('|')[0]) + '” or a synonym)</span>'}</span></li>`).join('');
  return `<div class="why"><div class="caps" style="margin-bottom:6px">Self-assessment rubric</div><ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px">${rows}</ul>${kw.reversed ? '<p class="small mt1" style="color:var(--bad)">⚠ Subject and object appear in the opposite order in your English. In Latin the <strong>cases</strong> decide who does what — check which word is nominative.</p>' : ''}<p class="small muted mt1 mb0">This keyword check is only a guide: it cannot read your sentence the way a teacher does. Compare with the reference translation, then rate your own answer honestly.</p></div>`;
}
const KEY_LABEL = { S: 'Subject', V: 'Verb', O: 'Direct object', I: 'Indirect object', G: 'Genitive (“of”)', A: 'Adjective', N: 'Predicate', AP: 'Apposition', PO: 'Prepositional phrase', VOC: 'Vocative', INF: 'Infinitive', C: 'Conjunction', D: 'Negation' };

export function feedbackHtml(q, res, ans) {
  const parts = [];
  if (res.status === 'selfassess') {
    return `<div class="banner info"><strong>Reference translation</strong><div class="latin-big" style="font-size:22px;margin-top:4px;font-family:var(--font-display)">“${esc(q.sent.en)}”</div>${q.sent.alts.length ? `<div class="small muted mt1">Also acceptable: ${q.sent.alts.map((a) => '“' + esc(a) + '”').join(' · ')}</div>` : ''}</div>${rubricHtml(q.sent, res.keywords)}`;
  }
  const ok = res.status === 'correct';
  const head = ok ? 'Correct' : res.status === 'partial' ? 'Partly right' : res.macronOnly ? 'Almost — the macron matters here' : 'Not quite';
  const sy = ok ? SAYINGS.cheer[Math.floor(Math.random() * 3)] : SAYINGS.oops[Math.floor(Math.random() * 2)];
  parts.push(`<div class="banner fb-say ${ok ? 'ok' : res.status === 'partial' || res.macronOnly ? 'warn' : 'bad'}">${mascot(ok ? 'cheer' : 'oops', 64)}<div><strong>${head}.</strong> <span class="la" style="opacity:.85">${sy[0]}</span>${res.note ? ' <span class="ink">' + esc(res.note) + '</span>' : ''}${res.close && !ok ? ' <span class="ink">You were very close — check spelling and macrons.</span>' : ''}</div></div>`);
  if (!ok) {
    const shown = q.type === 'typed' && q.lang === 'la' ? q.accept.map((a) => la(a)).join(' <span class="muted">or</span> ') : q.type === 'compose' ? la(q.ref) : q.type === 'typed' ? esc(q.accept.slice(0, 3).join(' / ')) : optHtml(String(q.answer));
    parts.push(`<div class="small">${ans ? `Your answer: <strong>${q.type === 'compose' || (q.type === 'typed' && q.lang === 'la') ? la(ans) : esc(ans)}</strong><br>` : ''}Correct answer: <strong>${shown}</strong></div>`);
  }
  if (q.type === 'compose' && res.slots) {
    const rows = res.slots.map((d) => `<li class="row tight" style="flex-wrap:nowrap;align-items:flex-start"><span class="${d.ok ? 'hl-ok' : 'hl-bad'}" style="width:18px;flex:none;margin-top:2px">${icon(d.ok ? 'check' : 'x')}</span><span>${esc(describeSlot(d.slot))}${d.ok ? ` — <span class="la">${esc(d.token)}</span>` : ''}</span></li>`).join('');
    parts.push(`<ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px">${rows}</ul>`);
    if (res.messages.length && !ok) parts.push(`<div class="small">${res.messages.map((m) => '• ' + esc(m)).join('<br>')}</div>`);
  }
  parts.push(`<div class="why">${fmt(q.explanation)}</div>`);
  parts.push(ruleBox(q.rule, !ok));
  return parts.join('');
}

/**
 * Mount a question.
 * opts: { settings, exam, initial, hints, onChange(ans), onSubmit({ans,res}), checkLabel }
 */
export function mountQuestion(host, q, opts = {}) {
  const { settings = {}, exam = false, initial = null } = opts;
  const hints = opts.hints ?? (exam ? !!settings.accommodationHints : settings.hintsInPractice !== false);
  let answer = initial ?? (q.type === 'mcq' ? null : '');
  let locked = false; let submitted = false;
  const order = q.type === 'mcq' ? shuffle(q.options) : null;
  const isLa = (q.type === 'typed' && q.lang === 'la') || q.type === 'compose';
  const plain = q.id.startsWith('stem:');
  const hasHints = q.type === 'translate' || q.type === 'compose';

  let body = '';
  if (q.type === 'translate') {
    body = `<div class="qprompt" style="margin-bottom:var(--s2)">Translate into English:</div><div class="latin-big" style="margin-bottom:var(--s4)">${esc(q.sent.la)}</div>`;
  } else if (q.type === 'compose') {
    body = `<div class="qprompt" style="margin-bottom:var(--s2)">Translate into Latin:</div><div class="display" style="font-size:clamp(22px,3.4vw,30px);margin-bottom:var(--s4)">${esc(q.prompt.replace(/^Translate into Latin: /, ''))}</div>`;
  } else body = `<div class="qprompt">${fmt(q.prompt)}</div>`;
  if (q.type === 'mcq') {
    body += `<div class="opts${order.every((o) => o.length < 18) && order.length === 4 ? ' two' : ''}" role="radiogroup">${order.map((o, i) => `<button type="button" class="opt" role="radio" aria-checked="false" data-v="${esc(o)}"><span class="k">${i + 1}</span><span>${optHtml(o)}</span></button>`).join('')}</div>`;
  } else if (q.type === 'translate') {
    body += `<textarea class="input" rows="3" placeholder="Type your English translation…" autocapitalize="sentences" spellcheck="false"></textarea>`;
  } else {
    body += `<input class="input" type="text" ${isLa ? `data-la="${plain ? 'plain' : 'on'}"` : ''} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" placeholder="${isLa ? (q.type === 'compose' ? 'Write the Latin sentence…' : 'Type the Latin form…') : 'Type your answer…'}">`;
  }
  if (hasHints) body += `<div class="mt1" data-hints>${hints ? `<details class="mt1"><summary class="small muted" style="cursor:pointer">Vocabulary help</summary><div class="hintbox mt1">${vocabHelp(q)}</div></details>` : '<div class="small muted">Hints are off.</div>'}</div>`;
  host.innerHTML = `<div class="qcard card"><div class="qmeta">${qBadges(q)}</div>${body}${exam ? '' : `<div class="row mt2"><button class="btn primary" data-check disabled>${opts.checkLabel || 'Check answer'}</button><span class="small muted">${q.type === 'mcq' ? 'Press <span class="kbd">1</span>–<span class="kbd">' + order.length + '</span>, then <span class="kbd">Enter</span>' : '<span class="kbd">Enter</span> to check'}</span></div>`}<div class="fb-slot" data-fb></div></div>`;
  const card = host.firstElementChild;
  const input = $('input.input, textarea.input', card);
  const checkBtn = $('[data-check]', card);
  const fb = $('[data-fb]', card);

  const refresh = () => { if (checkBtn) checkBtn.disabled = locked || (q.type === 'mcq' ? answer == null : !String(answer).trim()); };
  const setAnswer = (v, silent) => { answer = v; if (!silent) opts.onChange && opts.onChange(answer); refresh(); };
  if (q.type === 'mcq') {
    const mark = () => card.querySelectorAll('.opt').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === answer)));
    card.addEventListener('click', (e) => { const b = e.target.closest('.opt'); if (!b || locked) return; setAnswer(b.dataset.v); mark(); });
    if (answer != null) mark();
  } else if (input) {
    input.value = answer || '';
    input.addEventListener('input', () => setAnswer(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && q.type !== 'translate') { e.preventDefault(); exam ? opts.onEnter && opts.onEnter() : submit(); } if (e.key === 'Enter' && e.ctrlKey && q.type === 'translate') { e.preventDefault(); exam ? opts.onEnter && opts.onEnter() : submit(); } });
  }
  const keys = (e) => {
    if (locked || e.target.matches('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (q.type === 'mcq' && /^[1-9]$/.test(e.key) && order[+e.key - 1] != null) { setAnswer(order[+e.key - 1]); card.querySelectorAll('.opt').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === answer))); }
    else if (e.key === 'Enter' && !exam && checkBtn && !checkBtn.disabled) { e.preventDefault(); submit(); }
  };
  if (!exam) document.addEventListener('keydown', keys); else document.addEventListener('keydown', keys);
  refresh();

  let ctrl;
  function submit() {
    if (submitted || locked) return;
    if (answer == null || !String(answer).trim()) return;
    submitted = true; locked = true;
    const res = gradeQuestion(q, answer, settings);
    ctrl.result = res; ctrl.ans = answer;
    if (input) input.readOnly = true;
    if (checkBtn) checkBtn.remove();
    if (q.type === 'mcq') card.querySelectorAll('.opt').forEach((b) => { const ok = b.dataset.v === q.answer; b.classList.toggle('ok', ok); b.classList.toggle('bad', !ok && b.dataset.v === answer); b.classList.toggle('dim', !ok && b.dataset.v !== answer); });
    if (input && q.type !== 'translate') input.classList.add(res.correct ? 'ok' : 'bad');
    fb.innerHTML = `<div class="fb">${feedbackHtml(q, res, String(answer))}${res.status === 'selfassess' ? `<div class="why" style="border-left-color:var(--accent)"><div class="caps" style="margin-bottom:8px">How did you do?</div><div class="row" data-rate><button class="btn" data-r="0">Not yet</button><button class="btn" data-r="0.5">Partly right</button><button class="btn primary" data-r="1">Correct</button></div></div>` : '<div data-after></div>'}</div>`;
    if (res.status === 'selfassess') {
      fb.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
        const fin = finalizeSelf(res, +b.dataset.r); ctrl.result = fin;
        fb.querySelector('[data-rate]').innerHTML = `<span class="badge ${fin.score >= 1 ? 'ok' : fin.score > 0 ? 'gold' : 'bad'}">Self-rated: ${fin.score >= 1 ? 'correct' : fin.score > 0 ? 'partly right' : 'not yet'}</span>`;
        opts.onSubmit && opts.onSubmit({ ans: answer, res: fin });
      }));
    } else opts.onSubmit && opts.onSubmit({ ans: answer, res });
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  checkBtn && checkBtn.addEventListener('click', submit);
  ctrl = {
    el: card, fb, result: null, ans: null,
    afterSlot: () => $('[data-after]', card) || fb,
    getAnswer: () => answer,
    focus: () => (input ? input.focus({ preventScroll: true }) : null),
    destroy: () => document.removeEventListener('keydown', keys),
    submit,
  };
  return ctrl;
}
void buildKeyRegexes;
