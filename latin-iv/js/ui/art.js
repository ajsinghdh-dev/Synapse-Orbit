// Classical art plates. The masks carry tone only; they are drawn in white on a blue tile (the Hermes engraving look).
import { ART } from './art-data.js';
const css = Object.entries(ART).map(([k, a]) => `.art-${k}{background-image:url(${a.src});aspect-ratio:${a.w}/${a.h}}`).join('');
if (typeof document !== 'undefined' && !document.getElementById('art-css')) {
  const s = document.createElement('style'); s.id = 'art-css'; s.textContent = css; document.head.appendChild(s);
}
export const ART_NAMES = Object.keys(ART);
/** Decorative plate: hidden from assistive tech. */
export const art = (name, cls = '') => (ART[name] ? `<span class="art art-${name} ${cls}" aria-hidden="true"></span>` : '');
// which plate decorates which section header
export const PLATE = { study: 'head', vocabulary: 'krater', grammar: 'discobolus', translation: 'laocoon', practice: 'discobolus', mock: 'laocoon', mistakes: 'head', progress: 'krater', reference: 'krater', games: 'discobolus', settings: 'head' };
