import type { DistractorCandidate } from '@/types';

// ── Shared utility functions ───────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle — returns a new shuffled array, never mutates the input.
 */
export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Randomly sample up to `n` items from `arr` without replacement.
 */
export function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(...copy.splice(i, 1));
  }
  return result;
}

/**
 * Score how "confusable" a candidate is with the correct answer.
 * Higher = more similar (better decoy / trap).
 * Uses prefix match (×1.5), suffix match (×1.0), and length proximity (×0.5–1.0).
 */
export function distractorScore(correct: string, candidate: string): number {
  const a = correct.toLowerCase();
  const b = candidate.toLowerCase();
  let score = 0;

  // Prefix similarity
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  score += i * 1.5;

  // Suffix similarity
  let j = 0;
  const maxSuffix = Math.min(a.length, b.length) - i;
  while (j < maxSuffix && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  score += j * 1.0;

  // Length proximity bonus
  const diff = Math.abs(a.length - b.length);
  if (diff <= 1) score += 1.0;
  else if (diff <= 2) score += 0.5;

  return score;
}

// Same-category decoys rank above any spelling match — a semantically related
// word (e.g. another family member) is a more tempting trap than a lookalike.
const SAME_CATEGORY_TIER = 1000;

/**
 * Rank decoy candidates best-first: same-category words first, then by
 * spelling confusability. `jitter` adds light randomness for variety between
 * sessions; leave it off (deterministic) when ranking on the server.
 */
export function rankDistractors(
  correct: string,
  correctCategory: string | undefined,
  pool: DistractorCandidate[],
  jitter = false,
): DistractorCandidate[] {
  return [...pool]
    .map((c) => {
      const sameCat = !!correctCategory && c.category === correctCategory;
      const score =
        (sameCat ? SAME_CATEGORY_TIER : 0) +
        distractorScore(correct, c.value) +
        (jitter ? Math.random() : 0);
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.c);
}

/**
 * Returns a motivational message based on quiz score percentage.
 */
export function getMessage(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1) return 'Sans faute, beau travail !';
  if (pct >= 0.8) return 'Excellent, encore un effort !';
  if (pct >= 0.6) return 'Bien joué, continue comme ça.';
  return 'Continue, tu progresses !';
}
