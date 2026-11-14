// Classical art, drawn as one-colour relief from tone masks (colour comes from CSS: --art-ink).
import { ART } from './art-data.js';
const css = Object.entries(ART).map(([k, a]) => `.art-${k}{-webkit-mask-image:url(${a.src});mask-image:url(${a.src});aspect-ratio:${a.w}/${a.h}}`).join('');
if (typeof document !== 'undefined' && !document.getElementById('art-css')) {
  const s = document.createElement('style'); s.id = 'art-css'; s.textContent = css; document.head.appendChild(s);
}
export const ART_NAMES = Object.keys(ART);
/** Bare relief (decorative, hidden from assistive tech). */
export const art = (name, cls = '') => (ART[name] ? `<span class="art art-${name} ${cls}" aria-hidden="true"></span>` : '');
/** Framed plate: gold-edged terracotta tile with the relief in pale marble. */
export const plate = (name, cls = '') => (ART[name] ? `<span class="plate ${cls}" aria-hidden="true"><span class="art art-${name}"></span></span>` : '');
export const PLATE = { study: 'head', vocabulary: 'krater', grammar: 'discobolus', translation: 'laocoon', practice: 'discobolus', mock: 'laocoon', mistakes: 'head', progress: 'krater', reference: 'krater', games: 'discobolus', settings: 'head' };
