import { PLAN, LESSONS, RULES } from '../../data/curriculum.js';
import { CHAPTERS } from '../../data/lexicon.js';
import { TABLES } from '../tables.js';
import { esc, fmt, icon, $ } from '../util.js';
import { localDay } from '../../core/analytics.js';

export default function study({ root, store, now, q: Q }) {
  const st = store.state;
  const ch = +Q.ch || 0;
  const today = localDay(now());
  const idx = PLAN.findIndex((d) => d.date === today);
  const cur = idx >= 0 ? idx : today < PLAN[0].date ? 0 : PLAN.length - 1;
  root.innerHTML = `<div class="page-head"><div><h1>Study</h1><p>Short sessions, each ending in active recall. Follow the five-day plan or read a chapter.</p></div></div>
  <div class="tabs"><a href="#/study" ${!ch ? 'aria-current="page"' : ''}>Five-day plan</a>${CHAPTERS.map((c) => `<a href="#/study?ch=${c.n}" ${ch === c.n ? 'aria-current="page"' : ''}>Chapter ${c.n}</a>`).join('')}</div><div id="body"></div>`;
  const body = $('#body', root);
  if (!ch) {
    const DX = ['0px', '56px', '84px', '56px', '0px', '-56px', '-84px', '-56px'];
    const ico = (h) => (h.includes('grammar') ? 'grammar' : h.includes('vocabulary') ? 'vocab' : h.includes('mock') ? 'clock' : h.includes('translation') ? 'pen' : h.includes('practice') ? 'target' : h.includes('mistakes') ? 'refresh' : h.includes('reference') ? 'lib' : 'study');
    const todayIdx = idx >= 0 ? idx : cur;
    const nextK = PLAN[todayIdx].items.findIndex((_, k) => !st.plan.done[PLAN[todayIdx].date + '|' + k]);
    body.innerHTML = `<div class="path">${PLAN.map((d, i) => {
      const when = d.date < today ? 'past' : d.date === today ? 'today' : 'future';
      const done = d.items.filter((_, k) => st.plan.done[d.date + '|' + k]).length;
      return `<div class="unit ${when}"><div><div class="k">Day ${i + 1} · ${esc(d.label)}${when === 'today' ? ' · today' : ''}</div><h3>${esc(d.theme)}</h3></div><span class="k">${done}/${d.items.length}</span></div>
      <div class="nodes">${d.items.map((it, k) => { const isDone = !!st.plan.done[d.date + '|' + k]; const isNext = i === todayIdx && k === nextK; return `<div class="node ${isDone ? 'done' : when !== 'past' ? 'open' : ''} ${isNext ? 'next' : ''}" style="--dx:${DX[k % DX.length]}">${isNext ? '<span class="bubble">Start</span>' : ''}<a class="disc" href="${it.href}" aria-label="${esc(it.t)}">${icon(isDone ? 'check' : ico(it.href))}</a><span class="lbl">${esc(it.t)}${it.m ? ` · ${it.m} min` : ''}</span><label class="small muted" style="display:inline-flex;gap:6px;align-items:center;cursor:pointer"><input type="checkbox" data-d="${d.date}|${k}" ${isDone ? 'checked' : ''}> done</label></div>`; }).join('')}</div>`;
    }).join('')}</div><p class="small muted mt2">Tap a circle to open that activity, then tick it off. New material is on Days 1–4; Days 5–6 are for full mocks and repair.</p>`;
    body.addEventListener('change', (e) => { const c = e.target.closest('[data-d]'); if (c) { if (c.checked) st.plan.done[c.dataset.d] = true; else delete st.plan.done[c.dataset.d]; store.save(true); study({ root, store, now, q: Q }); } });
  } else {
    const c = CHAPTERS[ch - 1];
    body.innerHTML = `<div class="row between"><div><div class="caps">Chapter ${ch}</div><h2>${esc(c.title)}</h2></div><a class="btn quiet sm" href="${c.unit}" target="_blank" rel="noopener">${icon('link')}UVic unit ${ch}</a></div>
    <div class="col mt2">${LESSONS[ch].map((l, i) => { const r = RULES[l.rule]; return `<section class="card"><div class="caps">Lesson ${i + 1}</div><h3>${esc(r.title)}</h3><p class="mt1" style="font-size:16px;line-height:1.65">${fmt(r.text)}</p>${l.table ? `<div class="mt2">${TABLES[l.table]()}</div>` : ''}</section>`; }).join('')}
      <section class="card gold"><h3>Check yourself</h3><p>Active recall now locks this in. Ten adaptive questions on Chapter ${ch}:</p><div class="row"><a class="btn primary" href="#/practice?ch=${ch}&len=10&diff=2&start=1">${icon('play')}Start 10 questions</a><a class="btn" href="#/vocabulary/practice?mode=srs&ch=${ch}">Learn Chapter ${ch} words</a><a class="btn" href="#/grammar">Grammar Lab</a></div></section></div>`;
  }
}
