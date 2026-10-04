// Leitner spaced repetition — pure functions, no browser / framework imports
// (tested with `node --test lib/german/srs.test.ts`).

import type { WordProgress } from '@/types';

/** Review interval in days for each Leitner box (index = box). */
export const INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120] as const;
export const MAX_BOX = INTERVALS.length - 1;
/** Box given to a word marked "je connais" — it comes back in a month to confirm. */
export const KNOWN_BOX = 5;
/** Pseudo-box for a word marked "à apprendre" but never studied yet. */
export const QUEUED_BOX = -1;
/** From this box on, cards are asked French → German (active recall). */
export const PRODUCTION_BOX = 3;

export type Grade = 'again' | 'hard' | 'good';
export type Direction = 'de-fr' | 'fr-de';
export type ProgressMap = Record<string, WordProgress>;

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

/** Applies a self-grade to a word and returns its new progress. */
export function review(prev: WordProgress | undefined, wordId: string, grade: Grade, now: Date): WordProgress {
  const box = Math.max(0, prev?.box ?? 0);
  const reps = (prev?.reps ?? 0) + 1;
  const lapses = prev?.lapses ?? 0;
  const updatedAt = now.toISOString();

  if (grade === 'again') {
    // Back to learning: due now, so it comes back in the same session
    return { wordId, box: 0, due: updatedAt, reps, lapses: box >= 1 ? lapses + 1 : lapses, updatedAt };
  }
  const nextBox = grade === 'good' ? Math.min(box + 1, MAX_BOX) : Math.max(box, 1);
  return { wordId, box: nextBox, due: addDays(now, INTERVALS[nextBox]), reps, lapses, updatedAt };
}

/** Triage: "je connais" — skip learning, confirm in a month. */
export function markKnown(prev: WordProgress | undefined, wordId: string, now: Date): WordProgress {
  return {
    wordId, box: KNOWN_BOX, due: addDays(now, INTERVALS[KNOWN_BOX]),
    reps: prev?.reps ?? 0, lapses: prev?.lapses ?? 0, updatedAt: now.toISOString(),
  };
}

/** Triage: "à apprendre" — put the word in the new-words queue. */
export function markToLearn(prev: WordProgress | undefined, wordId: string, now: Date): WordProgress {
  return {
    wordId, box: QUEUED_BOX, due: now.toISOString(),
    reps: prev?.reps ?? 0, lapses: prev?.lapses ?? 0, updatedAt: now.toISOString(),
  };
}

export function isDue(p: WordProgress, now: Date): boolean {
  return p.box >= 0 && new Date(p.due).getTime() <= now.getTime();
}

/** Recognition (DE → FR) while the word is fresh, production (FR → DE) once it is settled. */
export function direction(p: WordProgress | undefined): Direction {
  return p && p.box >= PRODUCTION_BOX ? 'fr-de' : 'de-fr';
}

export interface SessionOptions {
  /** How many new words may still be introduced today. */
  newLimit: number;
  maxReviews: number;
}

export interface SessionPlan {
  reviews: string[];
  fresh: string[];
}

/**
 * Picks today's cards: due reviews (most overdue first), then new words —
 * those marked "à apprendre" first, then untriaged ones in deck order.
 */
export function buildSession(progress: ProgressMap, deckIds: string[], now: Date, opts: SessionOptions): SessionPlan {
  const reviews = Object.values(progress)
    .filter((p) => isDue(p, now))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, opts.maxReviews)
    .map((p) => p.wordId);

  const limit = Math.max(0, opts.newLimit);
  const queued = deckIds.filter((id) => progress[id]?.box === QUEUED_BOX);
  const untriaged = deckIds.filter((id) => !progress[id]);
  const fresh = [...queued, ...untriaged].slice(0, limit);

  return { reviews, fresh };
}

export interface DeckStats {
  due: number;
  queued: number;
  untriaged: number;
  learning: number;  // box 0 … KNOWN_BOX-1
  known: number;     // box ≥ KNOWN_BOX
}

export function deckStats(progress: ProgressMap, deckIds: string[], now: Date): DeckStats {
  const stats: DeckStats = { due: 0, queued: 0, untriaged: 0, learning: 0, known: 0 };
  for (const id of deckIds) {
    const p = progress[id];
    if (!p) { stats.untriaged++; continue; }
    if (p.box === QUEUED_BOX) { stats.queued++; continue; }
    if (p.box >= KNOWN_BOX) stats.known++; else stats.learning++;
    if (isDue(p, now)) stats.due++;
  }
  return stats;
}
