// Resume-where-you-left-off for quizzes (position + score in localStorage).

/** Saved { index, score } for a quiz, or null when starting fresh. */
export function readSavedPos(key: string, length: number): { i: number; s: number } | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { i, s } = JSON.parse(raw);
    if (Number.isInteger(i) && i > 0 && i < length) return { i, s: typeof s === 'number' ? s : 0 };
  } catch { /* ignore */ }
  return null;
}
