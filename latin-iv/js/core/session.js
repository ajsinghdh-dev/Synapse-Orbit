// "Signed in on this device" flag. Identity itself comes from the host (the Claude account the page is opened under);
// this only remembers that the person chose to enter, so the welcome screen is shown once per device until they sign out.
const KEY = 'latin-iv:session';
let mem = null;
const ls = () => { try { return globalThis.localStorage || null; } catch { return null; } };
export const session = {
  get() { try { const v = ls() && ls().getItem(KEY); return v ? JSON.parse(v) : mem; } catch { return mem; } },
  on() { return !!this.get(); },
  start(mode) { mem = { mode, at: Date.now() }; try { ls() && ls().setItem(KEY, JSON.stringify(mem)); } catch { /* memory only */ } },
  end() { mem = null; try { ls() && ls().removeItem(KEY); } catch { /* nothing stored */ } },
};
