import { LEXICON, BY_ID } from '../../data/lexicon.js';
import { parseBlock } from '../../core/customwords.js';
import { entryText } from './vocab.js';
import { esc, la, icon, toast, confirmDialog, $, $$ } from '../util.js';

const EXAMPLE = `# one word per line:  entry ; meaning ; chapter ; (type, only for prepositions/conjunctions/adverbs)
amō, amāre, amāvī, amātus ; love, like ; 1
puella, puellae, f. ; girl ; 2
dominus, dominī, m. ; master, lord ; 3
bellum, bellī, n. ; war ; 4
bonus, -a, -um ; good ; 2
in ; in, on, into ; 2 ; prep+abl/acc`;

export default function add({ root, store }) {
  const st = store.state;
  const existing = () => new Map(LEXICON.map((w) => [w.id, w]));
  const customs = () => st.customWords;
  let defCh = 1, results = [];
  root.innerHTML = `<div class="page-head"><div><h1>Add words</h1><p>Add the words from your textbook’s vocabulary lists. Every entry is checked against the Latin morphology engine before it is accepted, then drilled like any built-in word.</p></div></div>
  <div class="tabs"><a href="#/vocabulary">Browse</a><a href="#/vocabulary/practice">Practice modes</a><a href="#/vocabulary/add" aria-current="page">Add words</a></div>
  <div class="grid g2" style="align-items:start"><section class="card col"><h3>Paste your list</h3>
    <div class="field"><label for="dch">Default chapter (for lines without one)</label><select id="dch" class="input" style="width:auto">${[1, 2, 3, 4].map((n) => `<option>${n}</option>`).join('')}</select></div>
    <textarea id="txt" class="input" rows="10" data-la="on" spellcheck="false" autocapitalize="off" placeholder="${esc(EXAMPLE)}" style="font-size:17px"></textarea>
    <p class="small muted mb0">Separate fields with <span class="kbd">;</span>. Copy the entry exactly as printed, <strong>with macrons</strong>. Shortened forms such as <span class="la">bonus, -a, -um</span> and <span class="la">amō, -āre, -āvī, -ātus</span> work. Only 1st/2nd-conjugation verbs and 1st/2nd-declension nouns and adjectives are accepted, because that is what Chapters 1–4 cover.</p>
    <button class="btn" id="ex">Insert examples</button></section>
  <section class="card col"><h3>Check before adding</h3><div id="prev" class="muted small">Your entries are checked here as you type.</div><div class="row"><button class="btn primary" id="go" disabled>Add valid words</button></div></section></div>
  <section class="card mt2"><h3>Textbook-only mode</h3><p class="small muted">Switch off every built-in word, so quizzes use <strong>only</strong> the words you add. You can switch built-in words back on anytime in Browse, or here.</p><div class="row"><button class="btn" id="only">Use only my words</button><button class="btn quiet" id="all">Switch all built-in words back on</button></div><p class="small muted mb0" id="cnt"></p></section>
  <section class="card mt2"><h3>Your added words (${customs().length})</h3><div id="mine"></div></section>`;
  const prev = $('#prev', root), go = $('#go', root), txt = $('#txt', root);
  const check = () => {
    results = parseBlock(txt.value, defCh, existing());
    if (!results.length) { prev.innerHTML = 'Your entries are checked here as you type.'; go.disabled = true; return; }
    const ok = results.filter((r) => r.ok);
    prev.innerHTML = `<div class="small" style="margin-bottom:8px"><strong>${ok.length}</strong> of ${results.length} ready${results.length - ok.length ? ` · <span class="hl-bad">${results.length - ok.length} need fixing</span>` : ''}</div><div class="list">${results.map((r) => `<div class="small"><div class="row tight" style="flex-wrap:nowrap;align-items:flex-start"><span class="${r.ok ? 'hl-ok' : 'hl-bad'}" style="width:18px;flex:none">${icon(r.ok ? 'check' : 'x')}</span><span style="min-width:0">${r.ok ? `<span class="la" style="font-size:1.15em">${esc(entryText(r.lex))}</span> — ${esc(r.lex.en.join(', '))} <span class="badge">Ch ${r.lex.ch}</span>` : `<span class="muted">${esc(r.raw)}</span>`}${r.errors.map((e) => `<div class="hl-bad">${esc(e)}</div>`).join('')}${r.warnings.map((w) => `<div class="muted">⚠ ${esc(w)}</div>`).join('')}</span></div></div>`).join('')}</div>`;
    go.disabled = !ok.length; go.textContent = ok.length ? `Add ${ok.length} valid word${ok.length === 1 ? '' : 's'}` : 'Add valid words';
  };
  txt.oninput = check; $('#dch', root).onchange = (e) => { defCh = +e.target.value; check(); };
  $('#ex', root).onclick = () => { txt.value = EXAMPLE.split('\n').slice(1).join('\n'); check(); };
  go.onclick = () => {
    const ok = results.filter((r) => r.ok).map((r) => r.lex);
    for (const w of ok) { const i = st.customWords.findIndex((x) => x.id === w.id); if (i >= 0) st.customWords.splice(i, 1); st.customWords.push(w); delete st.settings.excluded[w.id]; }
    store.save(true); toast(`${ok.length} word${ok.length === 1 ? '' : 's'} added — rebuilding questions`); setTimeout(() => location.reload(), 600);
  };
  const mine = $('#mine', root);
  mine.innerHTML = customs().length ? `<div class="list">${customs().map((w) => `<div class="row between"><span><span class="la" style="font-size:1.2em">${esc(entryText(w))}</span> — ${esc(w.en.join(', '))} <span class="badge">Ch ${w.ch}</span></span><button class="btn sm" data-rm="${w.id}">Remove</button></div>`).join('')}</div>` : '<p class="muted mb0">None yet.</p>';
  $$('[data-rm]', mine).forEach((b) => (b.onclick = () => { st.customWords = st.customWords.filter((w) => w.id !== b.dataset.rm); store.save(true); toast('Removed — rebuilding'); setTimeout(() => location.reload(), 500); }));
  const builtins = () => LEXICON.filter((w) => !w.custom);
  const upd = () => { $('#cnt', root).textContent = `${builtins().filter((w) => !store.isExcluded(w.id)).length} built-in and ${customs().length} added words are active.`; };
  upd();
  $('#only', root).onclick = async () => { if (!customs().length) return toast('Add your words first'); if (await confirmDialog({ title: 'Use only your words?', body: `This switches off all ${builtins().length} built-in words. Your ${customs().length} added words stay on.`, ok: 'Switch off built-in words' })) { builtins().forEach((w) => store.setExcluded(w.id, true)); upd(); toast('Textbook-only mode on'); } };
  $('#all', root).onclick = () => { builtins().forEach((w) => store.setExcluded(w.id, false)); upd(); toast('Built-in words switched back on'); };
}
void BY_ID; void la;
