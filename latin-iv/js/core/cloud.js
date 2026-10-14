// Cross-device progress sync through the artifact's per-user database (private to the signed-in Claude account).
// Local storage stays the working copy; this mirrors it to the account and pulls newer progress from other devices.
// Last write wins (by savedAt). Whole state is chunked into ≤100k-character pieces (docs are capped at 256 KiB).
const CH = 100000;
export const cloud = { status: 'off', msg: 'Sync is not available here.', at: null, syncNow: async () => {}, subs: new Set() };
const set = (status, msg, at) => { cloud.status = status; cloud.msg = msg; if (at) cloud.at = at; cloud.subs.forEach((f) => f()); };

export async function initCloud(store) {
  const claude = globalThis.claude;
  if (!claude || !claude.use) return;
  set('connecting', 'Connecting to your Claude account…');
  let db = null, user = null;
  try { [db, user] = await Promise.all([claude.use('db'), claude.use('user')]); } catch { /* unavailable */ }
  const id = user && db ? await user.id().catch(() => null) : null;
  if (!db || !id) { set('off', 'Not signed in to sync. Progress stays on this device only.'); return; }
  const col = db.collection('data/users/' + id);
  let pushing = false, dirty = false, timer = null;

  async function pull() {
    const m = await col.doc('meta').get();
    if (!m.exists) return 'none';
    const meta = m.data();
    if ((meta.t || 0) <= (store.state.savedAt || 0)) return 'local-newer';
    let s = '';
    for (let i = 0; i < meta.n; i++) { const c = await col.doc('c' + i).get(); if (!c.exists) throw new Error('incomplete save'); s += c.data().s; }
    const before = JSON.stringify([store.state.customWords.map((w) => w.id), store.state.settings.chOverride]);
    store.import(JSON.stringify({ state: JSON.parse(s) }));
    const after = JSON.stringify([store.state.customWords.map((w) => w.id), store.state.settings.chOverride]);
    return before !== after ? 'reload' : 'pulled';
  }
  async function push() {
    if (pushing) { dirty = true; return; }
    pushing = true; dirty = false;
    try {
      const t = store.state.savedAt || Date.now();
      const s = JSON.stringify(store.state);
      const n = Math.ceil(s.length / CH);
      for (let i = 0; i < n; i++) await col.doc('c' + i).set({ s: s.slice(i * CH, (i + 1) * CH) });
      await col.doc('meta').set({ t, n, device: navigator.userAgent.slice(0, 80) });   // meta last: readers never see a half-written save
      set('ok', 'Saved to your Claude account', Date.now());
    } catch (e) { set('error', 'Could not sync: ' + (e && e.message || 'try again')); }
    pushing = false; if (dirty) schedule();
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(push, 4000); };
  cloud.syncNow = async () => { set('connecting', 'Syncing…'); try { const r = await pull(); if (r === 'reload') { location.reload(); return; } if (r === 'pulled') location.reload(); else await push(); } catch (e) { set('error', 'Could not sync: ' + (e && e.message || 'try again')); } };

  try {
    const r = await pull();
    if (r === 'reload' || r === 'pulled') { set('ok', 'Loaded your saved progress', Date.now()); location.reload(); return; }
    await push();
  } catch (e) { set('error', 'Could not sync: ' + (e && e.message || 'try again')); }
  store.subscribe(() => { if (!pushing) schedule(); else dirty = true; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && cloud.status !== 'off') { clearTimeout(timer); push(); } });
}
