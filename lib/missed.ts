// Items a profile got wrong in a drill — they come back first in the next round.
// Stored per profile on the device, so two people sharing a phone don't mix lists.

const storageKey = (drill: string, profile: string) => `ubuntu_missed:${drill}:${profile}`;

export function readMissed(drill: string, profile: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(storageKey(drill, profile)) ?? '[]')); } catch { return new Set(); }
}

/** Adds or removes one item and saves the list. */
export function recordAnswer(drill: string, profile: string, id: string, correct: boolean) {
  const missed = readMissed(drill, profile);
  if (correct) missed.delete(id); else missed.add(id);
  try { localStorage.setItem(storageKey(drill, profile), JSON.stringify([...missed])); } catch { /* ignore */ }
}
