// LEGION RUSH — game rules (pure). Latin answers are attacks; each wave is a new enemy.
export const ENEMIES = ['Lupus', 'Gladiātor', 'Barbarus', 'Centuriō', 'Hostis', 'Praetōriānus', 'Rēx', 'Minotaurus', 'Cerberus', 'Hydra', 'Titan', 'Imperātor'];
export const enemyName = (wave) => ENEMIES[(wave - 1) % ENEMIES.length] + (wave > ENEMIES.length ? ' ' + 'I'.repeat(Math.floor((wave - 1) / ENEMIES.length) + 1) : '');
export const enemyHp = (wave) => Math.min(8, 2 + wave);                    // hits needed
export const timeLimit = (wave) => Math.max(7, 14 - wave);                  // seconds per question
export const MAX_LIVES = 5;
export function newGame() { return { wave: 1, hp: enemyHp(1), lives: 3, streak: 0, best: 0, score: 0, answered: 0, correct: 0, freeze: 1, fifty: 1, over: false, log: [] }; }
/** Score for one correct answer: base + speed bonus + streak bonus. */
export function points(msLeft, limitMs, streak) { return 100 + Math.round(100 * Math.max(0, msLeft) / limitMs) + 10 * Math.min(streak, 20); }
/** Apply an answer. Returns what happened so the UI can animate it. */
export function resolve(g, ok, msLeft, limitMs) {
  g.answered++;
  const ev = { ok, crit: false, defeated: false, over: false, gain: 0, wave: g.wave };
  if (ok) {
    g.correct++; g.streak++; g.best = Math.max(g.best, g.streak);
    ev.crit = msLeft > limitMs * 0.6;                                        // answered in the first 40% of the time
    ev.dmg = ev.crit ? 2 : 1;
    ev.gain = points(msLeft, limitMs, g.streak) + (ev.crit ? 50 : 0);
    g.score += ev.gain; g.hp -= ev.dmg;
    if (g.streak > 0 && g.streak % 5 === 0) { g.freeze++; ev.freezeGained = true; }
    if (g.hp <= 0) {
      ev.defeated = true; g.wave++; g.hp = enemyHp(g.wave); g.fifty++; g.score += 200;
      if (g.wave % 3 === 1 && g.lives < MAX_LIVES) { g.lives++; ev.heal = true; }
    }
  } else { g.streak = 0; g.lives--; if (g.lives <= 0) { g.over = true; ev.over = true; } }
  return ev;
}
