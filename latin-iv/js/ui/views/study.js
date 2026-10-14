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
    body.innerHTML = `<div class="col">${PLAN.map((d, i) => {
      const done = d.items.filter((_, k) => st.plan.done[d.date + '|' + k]).length; const isToday = i === cur && idx >= 0;
      return `<section class="card ${isToday ? 'gold' : ''} ${d.date < today ? 'flat' : ''}"><div class="card-head"><div><div class="caps">${d.label}${isToday ? ' · today' : ''}</div><h3>${esc(d.theme)}</h3></div><span class="small muted">${done}/${d.items.length}</span></div>
      <div class="list">${d.items.map((it, k) => `<div class="row" style="flex-wrap:nowrap"><label class="switch" style="flex:none"><input type="checkbox" data-d="${d.date}|${k}" ${st.plan.done[d.date + '|' + k] ? 'checked' : ''} aria-label="Done: ${esc(it.t)}"></label><span class="grow">${esc(it.t)}${it.m ? ` <span class="tiny muted">· ${it.m} min</span>` : ''}</span><a class="btn sm" href="${it.href}">Open ${icon('arrow')}</a></div>`).join('')}</div></section>`;
    }).join('')}</div><p class="small muted mt2">The plan keeps new material to Days 1–4 and reserves Days 5–6 for full mocks and repair. Tick items off as you go; the dashboard’s mission adapts to your results.</p>`;
    body.addEventListener('change', (e) => { const c = e.target.closest('[data-d]'); if (c) { st.plan.done[c.dataset.d] = c.checked; if (!c.checked) delete st.plan.done[c.dataset.d]; store.save(true); } });
  } else {
    const c = CHAPTERS[ch - 1];
    body.innerHTML = `<div class="row between"><div><div class="caps">Chapter ${ch}</div><h2>${esc(c.title)}</h2></div><a class="btn quiet sm" href="${c.unit}" target="_blank" rel="noopener">${icon('link')}UVic unit ${ch}</a></div>
    <div class="col mt2">${LESSONS[ch].map((l, i) => { const r = RULES[l.rule]; return `<section class="card"><div class="caps">Lesson ${i + 1}</div><h3>${esc(r.title)}</h3><p class="mt1" style="font-size:16px;line-height:1.65">${fmt(r.text)}</p>${l.table ? `<div class="mt2">${TABLES[l.table]()}</div>` : ''}</section>`; }).join('')}
      <section class="card gold"><h3>Check yourself</h3><p>Active recall now locks this in. Ten adaptive questions on Chapter ${ch}:</p><div class="row"><a class="btn primary" href="#/practice?ch=${ch}&len=10&diff=2&start=1">${icon('play')}Start 10 questions</a><a class="btn" href="#/vocabulary/practice?mode=srs&ch=${ch}">Learn Chapter ${ch} words</a><a class="btn" href="#/grammar">Grammar Lab</a></div></section></div>`;
  }
}
