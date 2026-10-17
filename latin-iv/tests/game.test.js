import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, resolve, enemyHp, timeLimit, points, enemyName, MAX_LIVES } from '../js/core/game.js';

test('waves get harder but stay bounded', () => {
  assert.ok(enemyHp(2) > enemyHp(1)); assert.ok(enemyHp(50) <= 8);
  assert.ok(timeLimit(5) < timeLimit(1)); assert.ok(timeLimit(50) >= 7);
  assert.ok(enemyName(1) && enemyName(13).endsWith('I'));
});
test('fast correct answers hit twice, score more, and build streak rewards', () => {
  const g = newGame(); const L = 12000;
  const a = resolve(g, true, 11000, L); assert.equal(a.dmg, 2); assert.ok(a.gain > 200);
  const b = resolve(g, true, 1000, L); assert.equal(b.dmg, 1);
  assert.ok(points(10000, L, 5) > points(1000, L, 0));
  for (let i = 0; i < 3; i++) resolve(g, true, 1000, L);
  assert.equal(g.streak, 5); assert.equal(g.freeze, 2, 'every 5-streak earns a time-freeze');
});
test('wrong answers cost a life and reset the streak; zero lives ends the game', () => {
  const g = newGame(); resolve(g, true, 5000, 12000);
  resolve(g, false, 0, 12000); assert.equal(g.lives, 2); assert.equal(g.streak, 0);
  resolve(g, false, 0, 12000); const e = resolve(g, false, 0, 12000);
  assert.ok(e.over && g.over);
});
test('defeating an enemy advances the wave, heals every third wave, never past the cap', () => {
  const g = newGame(); g.lives = MAX_LIVES;
  while (g.wave === 1) resolve(g, true, 11000, 12000);
  assert.equal(g.wave, 2); assert.equal(g.hp, enemyHp(2)); assert.equal(g.lives, MAX_LIVES);
  const h = newGame(); h.wave = 3; h.hp = 1; h.lives = 2;
  const ev = resolve(h, true, 1000, 12000); assert.ok(ev.defeated && ev.heal && h.lives === 3);
});
