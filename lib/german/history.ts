// Log of the last review sessions (which words, how they went) — device-local,
// read by the "Révision" page. The SRS state itself lives in progress.ts.

import { useSyncExternalStore } from 'react';
import type { Grade } from './srs';

export type SessionGrade = Grade | 'known';

export interface SessionLog {
  id: string;  // ISO start time
  words: { id: string; grade: SessionGrade; missed: boolean }[];  // answer order, one entry per word
}

const MAX_SESSIONS = 10;
const CHANGE_EVENT = 'ubuntu-de-history-change';
const historyKey = (profile: string) => `ubuntu_de_history_${profile}`;

const cache = new Map<string, SessionLog[]>();

export function getHistory(profile: string): SessionLog[] {
  let list = cache.get(profile);
  if (!list) {
    try { list = JSON.parse(localStorage.getItem(historyKey(profile)) ?? '[]') as SessionLog[]; }
    catch { list = []; }
    cache.set(profile, list);
  }
  return list;
}

/** Records one answer; a word answered again in the same session keeps its last grade and remembers a miss. */
export function recordAnswer(profile: string, sessionId: string, wordId: string, grade: SessionGrade) {
  const list = getHistory(profile);
  const current = list.find((s) => s.id === sessionId) ?? { id: sessionId, words: [] };
  const prev = current.words.find((w) => w.id === wordId);
  const entry = { id: wordId, grade, missed: grade === 'again' || !!prev?.missed };
  const words = prev ? current.words.map((w) => (w.id === wordId ? entry : w)) : [...current.words, entry];
  const next = [{ ...current, words }, ...list.filter((s) => s.id !== sessionId)].slice(0, MAX_SESSIONS);

  cache.set(profile, next);
  try { localStorage.setItem(historyKey(profile), JSON.stringify(next)); } catch { /* ignore */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('ubuntu_de_history_')) { cache.clear(); onChange(); }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** Most recent session first; `undefined` on the server / before hydration. */
export function useSessionHistory(profile: string): SessionLog[] | undefined {
  return useSyncExternalStore(subscribe, () => getHistory(profile), () => undefined);
}
