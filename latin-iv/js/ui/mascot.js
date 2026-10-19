// Lupulus — the LATIN IV mascot (Latin “little wolf”, after the she-wolf of Rome). Original artwork, inline SVG.
// Moods: happy · cheer · oops · think · sleep. Phrases are classical Latin with an English gloss.
const C = { fur: '#B08860', furDark: '#8A6644', cream: '#F6E6CC', ear: '#F2A7A0', ink: '#2B1E16', leaf: '#58CC02', leafDark: '#3E9A00', cheek: '#FF9DA0', tongue: '#FF6B7A' };

function eyes(m) {
  if (m === 'cheer') return `<path d="M42 47 q6 -7 12 0" stroke="${C.ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M66 47 q6 -7 12 0" stroke="${C.ink}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
  if (m === 'sleep') return `<path d="M42 47 q6 5 12 0" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M66 47 q6 5 12 0" stroke="${C.ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  const dy = m === 'think' ? -3 : 0, dx = m === 'think' ? 2 : 0;
  const one = (x) => `<circle cx="${x}" cy="46" r="7.5" fill="#fff"/><circle cx="${x + dx}" cy="${47 + dy}" r="5" fill="${C.ink}"/><circle cx="${x + dx + 1.8}" cy="${45 + dy}" r="1.7" fill="#fff"/>`;
  return one(48) + one(72) + (m === 'oops' ? `<path d="M40 36 l10 4 M80 36 l-10 4" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>` : '');
}
function mouth(m) {
  if (m === 'cheer') return `<path d="M51 62 q9 12 18 0 z" fill="${C.tongue}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
  if (m === 'oops') return `<path d="M53 66 q3.5 -4 7 0 q3.5 4 7 0" stroke="${C.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if (m === 'think') return `<path d="M55 65 h10" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (m === 'sleep') return `<ellipse cx="60" cy="64" rx="3" ry="2.4" fill="${C.ink}"/>`;
  return `<path d="M52 61 q8 8 16 0" stroke="${C.ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
}
function arms(m) {
  if (m === 'cheer') return `<path d="M30 78 q-10 -14 -6 -26" stroke="${C.fur}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M90 78 q10 -14 6 -26" stroke="${C.fur}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  if (m === 'think') return `<path d="M88 86 q4 -14 -10 -22" stroke="${C.fur}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M32 84 q-6 6 -2 14" stroke="${C.fur}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  return `<path d="M32 82 q-8 6 -4 16" stroke="${C.fur}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M88 82 q8 6 4 16" stroke="${C.fur}" stroke-width="10" fill="none" stroke-linecap="round"/>`;
}
const wreath = () => { let s = ''; for (let i = 0; i < 7; i++) { const a = -160 + i * 23, r = 31, x = 60 + r * Math.cos(a * Math.PI / 180), y = 48 + r * Math.sin(a * Math.PI / 180); s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.5" ry="3.4" fill="${i % 2 ? C.leaf : C.leafDark}" transform="rotate(${a + 90} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; } return s; };

export function mascot(mood = 'happy', size = 96, label = 'Lupulus the wolf cub') {
  const m = mood;
  return `<svg class="mascot m-${m}" width="${size}" height="${size}" viewBox="0 0 120 120" role="img" aria-label="${label}">
  <ellipse cx="60" cy="113" rx="30" ry="5" fill="rgba(0,0,0,.12)"/>
  <path d="M86 96 q22 -2 20 -22 q-6 10 -18 10" fill="${C.furDark}"/>
  ${arms(m)}
  <ellipse cx="60" cy="88" rx="30" ry="24" fill="${C.fur}"/><ellipse cx="60" cy="92" rx="18" ry="16" fill="${C.cream}"/>
  <ellipse cx="46" cy="108" rx="9" ry="5" fill="${C.furDark}"/><ellipse cx="74" cy="108" rx="9" ry="5" fill="${C.furDark}"/>
  <path d="M30 34 L26 6 L52 24 Z" fill="${C.fur}"/><path d="M33 29 L31 13 L45 24 Z" fill="${C.ear}"/>
  <path d="M90 34 L94 6 L68 24 Z" fill="${C.fur}"/><path d="M87 29 L89 13 L75 24 Z" fill="${C.ear}"/>
  <circle cx="60" cy="50" r="31" fill="${C.fur}"/>
  <path d="M60 22 q-8 10 0 18 q8 -8 0 -18z" fill="${C.cream}" opacity=".9"/>
  ${wreath()}
  <ellipse cx="60" cy="62" rx="17" ry="12" fill="${C.cream}"/>
  ${eyes(m)}
  <circle cx="38" cy="58" r="5" fill="${C.cheek}" opacity=".55"/><circle cx="82" cy="58" r="5" fill="${C.cheek}" opacity=".55"/>
  <ellipse cx="60" cy="56" rx="5" ry="3.6" fill="${C.ink}"/>
  ${mouth(m)}
  ${m === 'oops' ? `<path d="M86 30 q4 7 0 10 q-4 -3 0 -10z" fill="#7CC8FF"/>` : ''}
  ${m === 'sleep' ? `<text x="88" y="24" font-family="Nunito,sans-serif" font-weight="900" font-size="14" fill="${C.ink}">z</text><text x="98" y="14" font-family="Nunito,sans-serif" font-weight="900" font-size="10" fill="${C.ink}">z</text>` : ''}
</svg>`;
}

// Short, correct classical Latin, with a gloss.
export const SAYINGS = {
  hello: ['Salvē!', 'Hello!'], cheer: [['Euge!', 'Well done!'], ['Optimē!', 'Excellent!'], ['Bene!', 'Good!']], oops: [['Iterum!', 'Again!'], ['Nōlī dēspērāre!', 'Don’t despair!']],
  think: ['Cōgitā…', 'Think…'], done: ['Bene fēcistī!', 'You did well!'],
};
const pick = (x) => (Array.isArray(x[0]) ? x[Math.floor(Math.random() * x.length)] : x);
/** Mascot with a speech bubble. */
export function say(mood, key, extra = '', size = 84) {
  const [la, en] = pick(SAYINGS[key] || SAYINGS.hello);
  return `<div class="say"><div class="say-m">${mascot(mood, size)}</div><div class="say-b"><strong class="la">${la}</strong> <span class="muted">${en}</span>${extra ? `<div class="say-x">${extra}</div>` : ''}</div></div>`;
}

export function confetti(n = 60) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const cols = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF', '#FF9600'];
  for (let i = 0; i < n; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = cols[i % cols.length]; s.style.animationDelay = Math.random() * 0.4 + 's'; s.style.animationDuration = 1.6 + Math.random() * 1.2 + 's'; s.style.transform = `rotate(${Math.random() * 360}deg)`; box.append(s); }
  document.body.append(box); setTimeout(() => box.remove(), 3200);
}
