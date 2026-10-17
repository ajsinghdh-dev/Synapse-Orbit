import { selectPractice } from '../../core/selector.js';
import { Q_BY_ID, shuffle } from '../../core/questions.js';
import { newGame, resolve, enemyHp, enemyName, timeLimit, MAX_LIVES } from '../../core/game.js';
import { TOPICS } from '../../data/curriculum.js';
import { esc, fmt, optHtml, icon, $, $$, toast } from '../util.js';

let audio = null;
const tone = (f, d = 0.12, type = 'triangle', v = 0.05) => { try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.value = f; g.gain.value = v; o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + d); o.stop(audio.currentTime + d); } catch { /* sound is optional */ } };
const SFX = { hit: () => { tone(520, .08); setTimeout(() => tone(780, .1), 70); }, crit: () => { tone(660, .08); setTimeout(() => tone(990, .08), 60); setTimeout(() => tone(1320, .14), 120); }, miss: () => tone(150, .3, 'sawtooth', .06), win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .16), i * 90)) };

const hero = '<svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 30c0-10 8-18 18-18s18 8 18 18"/><path d="M14 30h36M20 30v10M44 30v10"/><path d="M32 6c-3 0-5 3-5 6h10c0-3-2-6-5-6z" fill="var(--burgundy)" stroke="var(--burgundy)"/><path d="M22 52c0-6 4-10 10-10s10 4 10 10" /><path d="M12 56h40"/></svg>';
const foe = (w) => `<svg viewBox="0 0 80 80" width="110" height="110" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="34" r="18" fill="var(--bad-bg)"/><path d="M28 24l-8-12M52 24l8-12"/><circle cx="33" cy="32" r="2.6" fill="currentColor"/><circle cx="47" cy="32" r="2.6" fill="currentColor"/><path d="M32 43c5 4 11 4 16 0"/><path d="M24 54l-8 16M56 54l8 16M40 52v18M30 70h20"/>${w % 3 === 0 ? '<path d="M64 20l10-10M70 24l6-8"/>' : ''}</svg>`;

export default function games({ root, store, now, q: Q }) {
  const st = store.state; st.game ||= { best: 0, plays: [] };
  let timer = null, cleanup = () => {};
  const menu = () => {
    clearInterval(timer);
    root.innerHTML = `<div class="page-head"><div><div class="inscr">Lūdī</div><h1 class="mt1">Legion Rush</h1><p>Hold the line. Every correct Latin answer is a strike; every miss costs a life. Fast answers hit twice. It uses your real question bank, so it counts as practice.</p></div></div>
    <div class="grid g2" style="align-items:start"><section class="card col"><h3>How to play</h3><ul class="small" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px"><li>Answer before the bar runs out. Answer in the first 40% of the time for a <strong>critical hit</strong> (double damage).</li><li>Every <strong>5 correct in a row</strong> earns a <span class="badge gold">Freeze</span> that stops the clock for one question. Defeating an enemy earns a <span class="badge gold">50/50</span>.</li><li>Every third enemy restores a life (up to ${MAX_LIVES}). Each wave is harder and faster.</li><li>Keys <span class="kbd">1</span>–<span class="kbd">4</span> answer, <span class="kbd">F</span> freezes, <span class="kbd">H</span> uses 50/50.</li></ul></section>
    <section class="card col"><h3>Choose your battlefield</h3><div class="chips" id="ch">${[['all', 'All chapters'], [1, 'Chapter 1'], [2, 'Chapter 2'], [3, 'Chapter 3'], [4, 'Chapter 4']].map(([v, l]) => `<button class="chip" data-v="${v}" aria-pressed="${String(Q.ch || 'all') === String(v)}">${l}</button>`).join('')}</div>
      <label class="switch"><input type="checkbox" id="snd" ${Q.mute ? '' : 'checked'}> Sound effects</label>
      <div class="row"><button class="btn primary lg" id="go">${icon('play')}Begin</button></div>
      <div class="small muted">High score <strong>${st.game.best}</strong>${st.game.plays.length ? ' · last: ' + st.game.plays.slice(-3).reverse().map((p) => p.score + ' (wave ' + p.wave + ')').join(', ') : ''}</div></section></div>`;
    let chap = Q.ch || 'all';
    $('#ch', root).onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; chap = b.dataset.v; $$('#ch .chip', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
    $('#go', root).onclick = () => play(chap, $('#snd', root).checked);
  };

  function play(chap, sound) {
    const g = newGame(); const chapters = chap === 'all' ? 'all' : [+chap];
    let queue = [], q = null, left = 0, limit = 0, locked = false, frozen = false, removed = new Set(), last = null; const missed = [];
    const sfx = (k) => sound && SFX[k]();
    const refill = () => { queue = selectPractice({ chapters, section: 'everything', diff: 'adaptive', len: 80, types: ['mcq'] }, st, now(), Math.random).filter((x) => x.prompt.length < 170 && x.options.every((o) => o.length < 60)); if (!queue.length) queue = shuffle(Object.values(Q_BY_ID).filter((x) => x.type === 'mcq' && (chapters === 'all' || chapters.includes(x.ch)))).slice(0, 40); };
    const hearts = () => Array.from({ length: Math.max(g.lives, 0) }, () => '<span style="color:var(--bad)">♥</span>').join('') + Array.from({ length: MAX_LIVES - Math.max(g.lives, 0) }, () => '<span style="opacity:.2">♥</span>').join('');
    const frame = () => {
      root.innerHTML = `<div class="gm" id="gm"><div class="row between"><span class="caps">Wave ${g.wave} · ${esc(enemyName(g.wave))}</span><button class="btn quiet sm" id="quit">Retreat</button></div>
      <div class="arena card"><div class="fighters"><div class="fh" id="me">${hero}<div class="hearts" id="hearts"></div></div><div class="vs" id="fx"></div><div class="fh foe" id="foe">${foe(g.wave)}<div class="hpbar"><i id="hp"></i></div><div class="tiny muted"><span id="hpn"></span></div></div></div>
        <div class="row between" style="margin-top:var(--s2)"><span class="small">Score <strong id="sc" class="display" style="font-size:22px"></strong></span><span class="small">Streak <strong id="stk"></strong></span><span class="row tight"><button class="btn sm" id="frz"></button><button class="btn sm" id="f5"></button></span></div>
        <div class="tbar"><i id="tb"></i></div></div>
      <div id="qa" class="card mt2"></div></div>`;
      $('#quit', root).onclick = () => end(); $('#frz', root).onclick = freeze; $('#f5', root).onclick = fifty;
      hud();
    };
    const hud = () => { $('#hearts', root).innerHTML = hearts(); $('#hp', root).style.width = Math.max(0, g.hp / enemyHp(g.wave)) * 100 + '%'; $('#hpn', root).textContent = `${Math.max(g.hp, 0)} / ${enemyHp(g.wave)} HP`; $('#sc', root).textContent = g.score; $('#stk', root).textContent = g.streak; const f = $('#frz', root), h = $('#f5', root); f.textContent = `Freeze ×${g.freeze}`; h.textContent = `50/50 ×${g.fifty}`; f.disabled = g.freeze < 1 || locked || frozen; h.disabled = g.fifty < 1 || locked; };
    const float = (txt, cls) => { const e = document.createElement('div'); e.className = 'float ' + cls; e.textContent = txt; $('#fx', root).append(e); setTimeout(() => e.remove(), 900); };
    const shake = (id) => { const el = $(id, root); el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); };
    function ask() {
      if (g.over) return end();
      if (!queue.length) refill();
      q = queue.shift(); removed = new Set(); locked = false; frozen = false; limit = timeLimit(g.wave) * 1000; left = limit;
      const opts = shuffle(q.options);
      $('#qa', root).innerHTML = `<div class="qprompt" style="font-size:20px">${fmt(q.prompt)}</div><div class="opts" id="opts">${opts.map((o, i) => `<button class="opt" data-o="${esc(o)}"><span class="k">${i + 1}</span><span>${optHtml(o)}</span></button>`).join('')}</div><div id="rv"></div>`;
      $('#opts', root).onclick = (e) => { const b = e.target.closest('.opt'); if (b && !b.disabled) answer(b.dataset.o); };
      hud(); tick0 = performance.now();
    }
    let tick0 = 0;
    timer = setInterval(() => {
      if (!q || locked || document.hidden) { tick0 = performance.now(); return; }
      const t = performance.now(); const dt = t - tick0; tick0 = t;
      if (!frozen) left -= dt;
      $('#tb', root).style.width = Math.max(0, left / limit) * 100 + '%'; $('#tb', root).className = left / limit < 0.3 ? 'low' : frozen ? 'ice' : '';
      if (left <= 0) answer(null);
    }, 60);
    function freeze() { if (g.freeze < 1 || locked || frozen) return; g.freeze--; frozen = true; sound && tone(880, .25, 'sine'); hud(); }
    function fifty() { if (g.fifty < 1 || locked) return; const wrong = $$('.opt', root).filter((b) => b.dataset.o !== q.answer && !b.disabled); shuffle(wrong).slice(0, 2).forEach((b) => { b.disabled = true; b.classList.add('dim'); }); g.fifty--; hud(); }
    function answer(choice) {
      if (locked) return; locked = true;
      const ok = choice === q.answer; const ms = Math.max(0, left);
      const ev = resolve(g, ok, ms, limit);
      store.recordAttempt({ q, res: { score: ok ? 1 : 0 }, ans: choice || '', ms: Math.round(limit - ms), mode: 'game', mixed: true });
      $$('.opt', root).forEach((b) => { b.disabled = true; b.classList.toggle('ok', b.dataset.o === q.answer); b.classList.toggle('bad', b.dataset.o === choice && !ok); });
      if (ok) { shake('#foe'); float(ev.crit ? `CRIT −${ev.dmg}` : `−${ev.dmg}`, ev.crit ? 'crit' : 'dmg'); sfx(ev.crit ? 'crit' : 'hit'); }
      else { shake('#me'); $('#gm', root).classList.add('flash'); setTimeout(() => $('#gm', root)?.classList.remove('flash'), 350); float(choice ? '✗' : 'Time!', 'miss'); sfx('miss'); missed.push(q); }
      if (ev.freezeGained) float('+Freeze', 'bonus');
      if (ev.defeated) { float(`${enemyName(ev.wave)} defeated! +200`, 'bonus'); sfx('win'); }
      hud();
      const why = !ok ? `<div class="why small mt1"><strong>Correct: ${optHtml(q.answer)}</strong><br>${fmt(q.explanation)}</div>` : '';
      $('#rv', root).innerHTML = why;
      const wait = ok ? (ev.defeated ? 900 : 450) : 0;
      if (ok || g.over) setTimeout(() => (ev.defeated ? frame() || ask() : ask()), wait);
      else { $('#rv', root).insertAdjacentHTML('beforeend', '<div class="row mt1" style="justify-content:flex-end"><button class="btn primary" id="nx">Continue</button></div>'); $('#nx', root).onclick = ask; $('#nx', root).focus(); }
      if (g.over) setTimeout(end, 1400);
    }
    function end() {
      clearInterval(timer); document.removeEventListener('keydown', key);
      const best = Math.max(st.game.best, g.score); const isBest = g.score > st.game.best;
      if (g.answered) { st.game.plays.push({ t: now(), score: g.score, wave: g.wave }); if (st.game.plays.length > 20) st.game.plays.shift(); st.game.best = best; store.save(true); }
      const uniq = [...new Map(missed.map((m) => [m.id, m])).values()].slice(0, 6);
      root.innerHTML = `<div class="card"><div class="inscr">${g.over ? 'Cecidistī' : 'Receptus'}</div><h2 class="mt1">${g.over ? 'Defeated on wave ' + g.wave : 'You retreated on wave ' + g.wave}</h2>${isBest && g.answered ? '<p><span class="badge gold">New high score</span></p>' : ''}
      <div class="row mt2" style="gap:var(--s6)"><div class="stat"><b>${g.score}</b><span>score</span></div><div class="stat"><b>${g.wave - 1}</b><span>enemies defeated</span></div><div class="stat"><b>${g.answered ? Math.round(g.correct / g.answered * 100) + '%' : '—'}</b><span>accuracy</span></div><div class="stat"><b>${g.best}</b><span>best streak</span></div></div>
      ${uniq.length ? `<h3 class="mt3">Review what got through</h3><div class="list mt1">${uniq.map((m) => `<div class="small">${fmt(m.prompt)}<br><strong>${optHtml(m.answer)}</strong> — ${fmt(m.explanation)}</div>`).join('')}</div><p class="small muted mt1">All misses are saved in your Mistake Bank.</p>` : '<p class="mt2">Flawless defence.</p>'}
      <div class="row mt3"><button class="btn primary" id="again">Fight again</button><a class="btn" href="#/games">Menu</a><a class="btn quiet" href="#/mistakes">Mistake Bank</a></div></div>`;
      $('#again', root).onclick = () => play(chap, sound);
    }
    const key = (e) => { if (e.target.matches('input,textarea')) return; if (/^[1-4]$/.test(e.key)) { const b = $$('.opt', root)[+e.key - 1]; if (b && !b.disabled && !locked) answer(b.dataset.o); } else if (e.key.toLowerCase() === 'f') freeze(); else if (e.key.toLowerCase() === 'h') fifty(); };
    document.addEventListener('keydown', key);
    cleanup = () => { clearInterval(timer); document.removeEventListener('keydown', key); };
    refill(); frame(); ask();
  }
  menu();
  return () => { clearInterval(timer); cleanup(); };
}
void TOPICS; void toast;
