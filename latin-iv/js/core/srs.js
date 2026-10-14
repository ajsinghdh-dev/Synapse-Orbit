// Spaced repetition — a documented, simplified SM-2 variant (Wozniak 1990 / SuperMemo-2).
//
// Each card keeps: ef (ease factor, ≥1.3, starts 2.5), reps (successful reviews in a row),
// interval (days), due (ms timestamp), lapses, last (ms), seen (ms of first review).
//
// Grades (what the learner reports or what an answer check implies):
//   1 Again — failed recall      3 Hard — recalled with effort
//   4 Good  — recalled normally  5 Easy — instant
//
// Rules
//   • q < 3 (Again): reps → 0, lapses+1, ef −0.20 (min 1.3), card returns in 10 MINUTES (re-learning step)
//   • q ≥ 3: reps+1;  reps=1 → 1 day (Easy: 2) · reps=2 → 3 days (Hard) / 6 days (Good, Easy) ·
//            later: interval × ef (Hard ×0.85 slower, Easy ×1.15 longer); ef += 0.1 − (5−q)(0.08 + (5−q)·0.02)
//   • Exam-aware cap: no interval is allowed to reach beyond the day before the exam, so every card is
//     seen again before it counts (cap = max(1, days until exam − 1)).
//   • Priority (higher = review sooner): overdue ratio (time past due ÷ interval) + lapse weight + low-ease weight.
//     Cards that are not yet due have negative priority and are not offered by the scheduler.

export const DAY = 86400000;
export const MIN = 60000;

export function newCard(now) { return { ef: 2.5, reps: 0, interval: 0, due: now, lapses: 0, last: null, seen: null }; }

export function schedule(card, q, now, { examCapDays = Infinity } = {}) {
  const c = { ...(card || newCard(now)) };
  c.seen = c.seen ?? now;
  if (q < 3) {
    c.reps = 0; c.lapses += 1; c.interval = 0;
    c.ef = Math.max(1.3, c.ef - 0.2);
    c.due = now + 10 * MIN;
  } else {
    c.reps += 1;
    if (c.reps === 1) c.interval = q === 5 ? 2 : 1;
    else if (c.reps === 2) c.interval = q === 3 ? 3 : 6;
    else c.interval = Math.max(1, Math.round(c.interval * c.ef * (q === 3 ? 0.85 : q === 5 ? 1.15 : 1)));
    c.ef = Math.max(1.3, c.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    c.interval = Math.min(c.interval, Math.max(1, Math.floor(examCapDays)));
    c.due = now + c.interval * DAY;
  }
  c.last = now;
  return c;
}

export function priority(card, now) {
  if (!card) return 0.5;                                  // new card: modest priority
  if (card.due > now) return -1;
  const span = Math.max(card.interval * DAY, 10 * MIN);
  return (now - card.due) / span + 0.15 * card.lapses + (2.5 - card.ef) * 0.2 + 0.1;
}
export const isDue = (card, now) => !card || card.due <= now;

/** Choose a review queue: due cards by priority, then up to `newLimit` unseen cards. */
export function buildQueue(ids, cards, now, { newLimit = 12, newToday = 0, max = 50 } = {}) {
  const due = ids.filter((id) => cards[id] && cards[id].due <= now).sort((a, b) => priority(cards[b], now) - priority(cards[a], now));
  const fresh = ids.filter((id) => !cards[id]).slice(0, Math.max(0, newLimit - newToday));
  return { due, fresh, queue: [...due, ...fresh].slice(0, max) };
}

export function examCapDays(now, examTs) { return Math.max(1, Math.floor((examTs - now) / DAY) - 1); }

/** Map an answer outcome from a non-flashcard mode to a grade. */
export function gradeFromOutcome(correct, ms, { fastMs = 4000 } = {}) {
  if (!correct) return 1;
  return ms != null && ms < fastMs ? 5 : 4;
}
