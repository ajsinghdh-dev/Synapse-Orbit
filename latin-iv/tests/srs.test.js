import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schedule, newCard, priority, buildQueue, DAY, MIN, gradeFromOutcome } from '../js/core/srs.js';

const T0 = Date.UTC(2026, 9, 14, 12);

test('correct answers return at growing intervals', () => {
  let c = schedule(newCard(T0), 4, T0);
  assert.equal(c.interval, 1); assert.equal(c.due, T0 + DAY);
  c = schedule(c, 4, c.due);
  assert.equal(c.interval, 6);
  const i3 = schedule(c, 4, c.due).interval;
  assert.ok(i3 > 6, 'third interval grows (6 × ease)');
  assert.ok(Math.abs(i3 - Math.round(6 * c.ef)) <= 1);
});

test('a missed card reappears within minutes and resets progress', () => {
  let c = schedule(schedule(newCard(T0), 4, T0), 4, T0 + DAY);
  const lapsed = schedule(c, 1, T0 + 7 * DAY);
  assert.equal(lapsed.reps, 0); assert.equal(lapsed.lapses, 1);
  assert.equal(lapsed.due - (T0 + 7 * DAY), 10 * MIN);
  assert.ok(lapsed.ef < c.ef);
  assert.equal(schedule(lapsed, 4, lapsed.due).interval, 1, 're-learning restarts at 1 day');
});

test('ease factor never drops below 1.3 and grows with Easy answers', () => {
  let c = newCard(T0);
  for (let i = 0; i < 12; i++) c = schedule(c, 1, T0 + i * DAY);
  assert.equal(c.ef, 1.3);
  let d = newCard(T0);
  for (let i = 0; i < 4; i++) d = schedule(d, 5, T0 + i * DAY);
  assert.ok(d.ef > 2.5);
});

test('Hard answers grow more slowly than Good, Easy faster', () => {
  const base = schedule(schedule(newCard(T0), 4, T0), 4, T0);
  const h = schedule(base, 3, T0).interval, g = schedule(base, 4, T0).interval, e = schedule(base, 5, T0).interval;
  assert.ok(h < g && g < e, `${h} < ${g} < ${e}`);
});

test('exam cap: nothing is scheduled past the day before the exam', () => {
  let c = newCard(T0);
  for (let i = 0; i < 5; i++) c = schedule(c, 5, T0 + i * DAY, { examCapDays: 3 });
  assert.ok(c.interval <= 3);
});

test('priority accounts for elapsed time and recall quality', () => {
  const now = T0 + 10 * DAY;
  const a = { ef: 2.5, reps: 3, interval: 5, due: now - 1 * DAY, lapses: 0 };
  const b = { ef: 2.5, reps: 3, interval: 5, due: now - 6 * DAY, lapses: 0 };
  const c = { ef: 1.5, reps: 1, interval: 5, due: now - 1 * DAY, lapses: 3 };
  assert.ok(priority(b, now) > priority(a, now), 'more overdue first');
  assert.ok(priority(c, now) > priority(a, now), 'leech-like card first');
  assert.ok(priority({ ...a, due: now + DAY }, now) < 0, 'not-yet-due cards are not offered');
});

test('queue holds due cards by priority and caps new cards', () => {
  const now = T0 + 5 * DAY;
  const cards = { a: { ef: 2.5, interval: 2, due: now - DAY, lapses: 0 }, b: { ef: 2.5, interval: 2, due: now + DAY, lapses: 0 }, c: { ef: 2.5, interval: 2, due: now - 5 * DAY, lapses: 0 } };
  const q = buildQueue(['a', 'b', 'c', 'd', 'e', 'f'], cards, now, { newLimit: 2 });
  assert.deepEqual(q.due, ['c', 'a']);
  assert.deepEqual(q.fresh, ['d', 'e']);
  assert.ok(!q.queue.includes('b'));
});

test('grade mapping', () => {
  assert.equal(gradeFromOutcome(false, 1000), 1);
  assert.equal(gradeFromOutcome(true, 9000), 4);
  assert.equal(gradeFromOutcome(true, 1500), 5);
});
