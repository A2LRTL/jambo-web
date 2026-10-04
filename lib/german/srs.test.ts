import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  review, markKnown, markToLearn, buildSession, deckStats, direction,
  INTERVALS, KNOWN_BOX, MAX_BOX, QUEUED_BOX, type ProgressMap,
} from './srs.ts';

const NOW = new Date('2026-10-04T08:00:00Z');
const days = (iso: string) => Math.round((new Date(iso).getTime() - NOW.getTime()) / 86_400_000);

test('a new word graded good goes to box 1, due tomorrow', () => {
  const p = review(undefined, 'w', 'good', NOW);
  assert.equal(p.box, 1);
  assert.equal(days(p.due), 1);
  assert.equal(p.reps, 1);
});

test('good climbs one box at a time, capped at the last box', () => {
  let p = review(undefined, 'w', 'good', NOW);
  for (let i = 0; i < 20; i++) p = review(p, 'w', 'good', NOW);
  assert.equal(p.box, MAX_BOX);
  assert.equal(days(p.due), INTERVALS[MAX_BOX]);
});

test('again resets to box 0, due now, and counts a lapse only for learned words', () => {
  const fresh = review(undefined, 'w', 'again', NOW);
  assert.equal(fresh.box, 0);
  assert.equal(fresh.due, NOW.toISOString());
  assert.equal(fresh.lapses, 0);

  const learned = { ...fresh, box: 4 };
  const lapsed = review(learned, 'w', 'again', NOW);
  assert.equal(lapsed.box, 0);
  assert.equal(lapsed.lapses, 1);
});

test('hard keeps the box (at least 1) and reschedules at its interval', () => {
  assert.equal(review(undefined, 'w', 'hard', NOW).box, 1);
  const p = review({ wordId: 'w', box: 4, due: NOW.toISOString(), reps: 3, lapses: 0, updatedAt: '' }, 'w', 'hard', NOW);
  assert.equal(p.box, 4);
  assert.equal(days(p.due), INTERVALS[4]);
});

test('triage: known goes to the known box, to-learn is queued', () => {
  const k = markKnown(undefined, 'w', NOW);
  assert.equal(k.box, KNOWN_BOX);
  assert.equal(days(k.due), INTERVALS[KNOWN_BOX]);
  assert.equal(markToLearn(undefined, 'w', NOW).box, QUEUED_BOX);
});

test('session: overdue reviews first, queued before untriaged, limits respected', () => {
  const progress: ProgressMap = {
    a: { wordId: 'a', box: 2, due: '2026-10-01T00:00:00Z', reps: 2, lapses: 0, updatedAt: '' },
    b: { wordId: 'b', box: 2, due: '2026-09-20T00:00:00Z', reps: 2, lapses: 0, updatedAt: '' },
    c: { wordId: 'c', box: 3, due: '2026-12-01T00:00:00Z', reps: 3, lapses: 0, updatedAt: '' },
    q: markToLearn(undefined, 'q', NOW),
    k: markKnown(undefined, 'k', NOW),
  };
  const deck = ['a', 'b', 'c', 'u1', 'q', 'k', 'u2', 'u3'];
  const plan = buildSession(progress, deck, NOW, { newLimit: 2, maxReviews: 10 });
  assert.deepEqual(plan.reviews, ['b', 'a']);
  assert.deepEqual(plan.fresh, ['q', 'u1']);

  assert.deepEqual(buildSession(progress, deck, NOW, { newLimit: 0, maxReviews: 1 }), { reviews: ['b'], fresh: [] });
});

test('direction: recognition until box 3, then production', () => {
  assert.equal(direction(undefined), 'de-fr');
  assert.equal(direction(review(undefined, 'w', 'good', NOW)), 'de-fr');
  assert.equal(direction(markKnown(undefined, 'w', NOW)), 'fr-de');
});

test('deck stats', () => {
  const progress: ProgressMap = {
    a: review(undefined, 'a', 'again', NOW),
    k: markKnown(undefined, 'k', NOW),
    q: markToLearn(undefined, 'q', NOW),
  };
  assert.deepEqual(deckStats(progress, ['a', 'k', 'q', 'u'], NOW), { due: 1, queued: 1, untriaged: 1, learning: 1, known: 1 });
});
