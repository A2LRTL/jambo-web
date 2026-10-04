// German word progress — localStorage is the source of truth on the device
// (offline, instant); every change is mirrored to Supabase `de_progress`.

import { useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import type { WordProgress } from '@/types';
import type { ProgressMap } from './srs';

const TABLE = 'de_progress';
const CHANGE_EVENT = 'ubuntu-de-progress-change';
const progressKey = (profile: string) => `ubuntu_de_progress_${profile}`;
const dirtyKey    = (profile: string) => `ubuntu_de_dirty_${profile}`;
const newKey      = (profile: string) => `ubuntu_de_new_${profile}`;
const SETTINGS_KEY = 'ubuntu_de_settings';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function writeJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ── Local store (React-subscribable) ──────────────────────────────────────────

// Cached snapshots so useSyncExternalStore gets a stable reference between writes
const cache = new Map<string, ProgressMap>();

export function getProgress(profile: string): ProgressMap {
  let map = cache.get(profile);
  if (!map) {
    map = readJSON<ProgressMap>(progressKey(profile), {});
    cache.set(profile, map);
  }
  return map;
}

function saveLocal(profile: string, map: ProgressMap) {
  cache.set(profile, map);
  writeJSON(progressKey(profile), map);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('ubuntu_de_progress_')) { cache.clear(); onChange(); }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** `undefined` on the server / before hydration. */
export function useGermanProgress(profile: string): ProgressMap | undefined {
  return useSyncExternalStore(subscribe, () => getProgress(profile), () => undefined);
}

/** Saves updated words locally, then pushes them to Supabase in the background. */
export function updateProgress(profile: string, entries: WordProgress[]) {
  if (entries.length === 0) return;
  const map = { ...getProgress(profile) };
  for (const e of entries) map[e.wordId] = e;
  saveLocal(profile, map);

  const dirty = new Set(readJSON<string[]>(dirtyKey(profile), []));
  for (const e of entries) dirty.add(e.wordId);
  writeJSON(dirtyKey(profile), [...dirty]);
  void pushDirty(profile);
}

// ── Supabase sync ─────────────────────────────────────────────────────────────

interface Row {
  profile: string;
  word_id: string;
  box: number;
  due: string;
  reps: number;
  lapses: number;
  updated_at: string;
}

const toRow = (profile: string, p: WordProgress): Row => ({
  profile, word_id: p.wordId, box: p.box, due: p.due, reps: p.reps, lapses: p.lapses, updated_at: p.updatedAt,
});

const fromRow = (r: Row): WordProgress => ({
  wordId: r.word_id, box: r.box, due: r.due, reps: r.reps, lapses: r.lapses, updatedAt: r.updated_at,
});

const pushing = new Map<string, Promise<void>>();

/** Upserts every locally changed word. One push per profile at a time. */
export function pushDirty(profile: string): Promise<void> {
  let p = pushing.get(profile);
  if (!p) {
    p = doPush(profile).finally(() => pushing.delete(profile));
    pushing.set(profile, p);
  }
  return p;
}

async function doPush(profile: string) {
  try {
    const ids = readJSON<string[]>(dirtyKey(profile), []);
    if (ids.length === 0 || !navigator.onLine) return;
    const map = getProgress(profile);
    const rows = ids.filter((id) => map[id]).map((id) => toRow(profile, map[id]));
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'profile,word_id' });
    if (error) { console.error('de_progress push:', error.message); return; }
    // Keep ids that became dirty while the request was in flight
    const sent = new Set(ids);
    const after = readJSON<string[]>(dirtyKey(profile), []);
    writeJSON(dirtyKey(profile), after.filter((id) => !sent.has(id)));
  } catch { /* offline or table missing — retried on next change / reconnect */ }
}

/** Fetches remote progress and merges it in (newest `updatedAt` wins per word). */
export async function pullProgress(profile: string): Promise<void> {
  try {
    const rows: Row[] = [];
    const PAGE = 1000; // Supabase caps each select at 1000 rows
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from(TABLE).select('*').eq('profile', profile).range(from, from + PAGE - 1);
      if (error) { console.error('de_progress pull:', error.message); return; }
      rows.push(...(data as Row[]));
      if (data.length < PAGE) break;
    }

    const local = getProgress(profile);
    const merged = { ...local };
    let changed = false;
    for (const r of rows) {
      const remote = fromRow(r);
      const mine = local[remote.wordId];
      if (!mine || new Date(remote.updatedAt) > new Date(mine.updatedAt)) {
        merged[remote.wordId] = remote;
        changed = true;
      }
    }
    if (changed) saveLocal(profile, merged);
  } catch { /* offline — local data stays authoritative */ }
  void pushDirty(profile);
}

// ── New words per day ─────────────────────────────────────────────────────────

const today = () => new Date().toLocaleDateString('sv'); // YYYY-MM-DD, local time

export function newIntroducedToday(profile: string): number {
  const v = readJSON<{ date: string; count: number }>(newKey(profile), { date: '', count: 0 });
  return v.date === today() ? v.count : 0;
}

export function addNewIntroduced(profile: string, n: number) {
  writeJSON(newKey(profile), { date: today(), count: newIntroducedToday(profile) + n });
}

export const NEW_PER_DAY_CHOICES = [5, 10, 20] as const;

export function getNewPerDay(): number {
  return readJSON<{ newPerDay?: number }>(SETTINGS_KEY, {}).newPerDay ?? 10;
}

export function setNewPerDay(n: number) {
  writeJSON(SETTINGS_KEY, { ...readJSON(SETTINGS_KEY, {}), newPerDay: n });
}
