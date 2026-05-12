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
 * Returns a motivational message based on quiz score percentage.
 */
export function getMessage(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1) return 'Sans faute, beau travail !';
  if (pct >= 0.8) return 'Excellent, encore un effort !';
  if (pct >= 0.6) return 'Bien joué, continue comme ça.';
  return 'Continue, tu progresses !';
}
