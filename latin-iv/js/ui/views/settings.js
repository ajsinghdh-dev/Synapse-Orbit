import { esc, icon, toast, download, confirmDialog, $ } from '../util.js';
import { applyTheme } from '../app.js';
import { cloud } from '../../core/cloud.js';

export default function settings({ root, store }) {
  const s = store.state.settings;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  root.innerHTML = `
    <div class="page-head"><div><h1>Settings</h1><p>Everything is stored on this device. Nothing is sent anywhere.</p></div></div>
    <div class="grid g2">
      <section class="card col"><h3>Exam</h3>
        <div class="field"><label for="s-date">Exam date</label><input id="s-date" class="input" type="date" value="${esc(s.examDate)}"></div>
        <div class="field"><label for="s-time">Exam start time <span class="muted" style="text-transform:none;letter-spacing:0">(local time, ${esc(tz)})</span></label><input id="s-time" class="input" type="time" value="${esc(s.examTime)}"></div>
        <div class="field"><label for="s-target">Daily question target</label><input id="s-target" class="input" type="number" min="5" max="300" step="5" value="${s.dailyTarget}"></div>
        <div class="field"><label for="s-new">New vocabulary words per day</label><input id="s-new" class="input" type="number" min="0" max="60" value="${s.newPerDay}"></div>
      </section>
      <section class="card col"><h3>Appearance &amp; answering</h3>
        <div class="field"><label>Theme</label><div class="seg" role="group">${['auto', 'light', 'dark'].map((t) => `<button data-theme="${t}" aria-pressed="${s.theme === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div></div>
        <div class="field"><label>Macrons when typing Latin</label><div class="seg" role="group"><button data-mac="lenient" aria-pressed="${s.macronMode !== 'strict'}">Forgiving</button><button data-mac="strict" aria-pressed="${s.macronMode === 'strict'}">Strict</button></div>
          <p class="small muted mb0"><strong>Forgiving</strong> accepts a missing macron unless it would change the form (<span class="la">puella</span> vs <span class="la">puellā</span>). <strong>Strict</strong> requires every macron. Tip: type a vowel then <span class="kbd">-</span> (a- → ā), or use the macron keys.</p></div>
        <label class="switch"><input type="checkbox" id="s-hints" ${s.hintsInPractice ? 'checked' : ''}> Show vocabulary help in practice</label>
        <label class="switch"><input type="checkbox" id="s-acc" ${s.accommodationHints ? 'checked' : ''}> Accommodation: allow hints during mock exams</label>
        <label class="switch"><input type="checkbox" id="s-timer" ${s.timerVisible ? 'checked' : ''}> Show the timer in mock exams</label>
      </section>
      <section class="card col"><h3>Account sync</h3><p class="small mb0" id="cl"></p><p class="small muted mb0">Your progress is saved to your Claude account and shared by every device you open this page on (iPad, Mac, phone). If two devices change at once, the most recent save wins.</p><div class="row"><button class="btn" id="sync">Sync now</button></div></section>
      <section class="card col"><h3>Your data</h3>
        <p class="small muted">${store.persistent ? 'Saved in this browser on this device.' : '<strong style="color:var(--bad)">Storage is unavailable (private window?)</strong> — progress will be lost when you close the tab. Export a backup below.'} Export a backup file to move your progress between devices.</p>
        <div class="row"><button class="btn" id="exp">${icon('arrow')}Export backup</button><label class="btn" style="cursor:pointer">Import backup<input id="imp" type="file" accept="application/json" hidden></label></div>
        <hr class="sep"><button class="btn" id="reset" style="color:var(--bad)">Reset all progress</button>
      </section>
      <section class="card col"><h3>Vocabulary &amp; syllabus</h3>
        <p class="small muted">${Object.keys(s.excluded).length} word(s) switched off. Switched-off words disappear from every quiz, mock exam and generator.</p>
        <a class="btn" href="#/vocabulary">Review vocabulary list</a>
        <p class="small muted mb0">Not sure a word is in your course? Chapter placement is marked <span class="badge">confirm</span> where it should be checked against your textbook.</p>
      </section>
    </div>`;
  const paint = () => { const el = $('#cl', root); if (el) el.innerHTML = `<strong>${esc(cloud.msg)}</strong>${cloud.at ? ' · ' + new Date(cloud.at).toLocaleTimeString() : ''}`; };
  paint(); cloud.subs.add(paint); $('#sync', root).onclick = () => cloud.syncNow();
  const on = (sel, ev, f) => $(sel, root).addEventListener(ev, f);
  on('#s-date', 'change', (e) => { if (e.target.value) { store.setSetting('examDate', e.target.value); toast('Exam date saved'); } });
  on('#s-time', 'change', (e) => { if (e.target.value) { store.setSetting('examTime', e.target.value); toast('Exam time saved'); } });
  on('#s-target', 'change', (e) => store.setSetting('dailyTarget', Math.max(5, +e.target.value || 40)));
  on('#s-new', 'change', (e) => store.setSetting('newPerDay', Math.max(0, +e.target.value || 0)));
  on('#s-hints', 'change', (e) => store.setSetting('hintsInPractice', e.target.checked));
  on('#s-acc', 'change', (e) => store.setSetting('accommodationHints', e.target.checked));
  on('#s-timer', 'change', (e) => store.setSetting('timerVisible', e.target.checked));
  root.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => { store.setSetting('theme', b.dataset.theme); applyTheme(); root.querySelectorAll('[data-theme]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  root.querySelectorAll('[data-mac]').forEach((b) => b.addEventListener('click', () => { store.setSetting('macronMode', b.dataset.mac); root.querySelectorAll('[data-mac]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
  on('#exp', 'click', () => download(`latin-iv-backup-${new Date(store.now()).toISOString().slice(0, 10)}.json`, store.export()));
  on('#imp', 'change', async (e) => { const f = e.target.files[0]; if (!f) return; try { store.import(await f.text()); applyTheme(); toast('Backup restored'); location.hash = '#/dashboard'; } catch (err) { toast(err.message); } });
  on('#reset', 'click', async () => { if (await confirmDialog({ title: 'Reset all progress?', body: 'This permanently deletes your attempts, spaced-repetition schedule, mistake bank and mock results on this device. Export a backup first if unsure.', ok: 'Delete everything', danger: true })) { store.reset(); toast('Progress reset'); location.hash = '#/dashboard'; } });
  return () => cloud.subs.delete(paint);
}
