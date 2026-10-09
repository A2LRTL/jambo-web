// Words a profile adds itself, for every language — localStorage is the source
// of truth on the device; changes are mirrored to Supabase `custom_words`.

import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import type { CustomLang } from './custom-langs';

export { CUSTOM_LANGS, customLessonId, isCustomLang, type CustomLang } from './custom-langs';

export interface CustomWord {
  id: string;
  lang: CustomLang;
  term: string;
  translation: string;
  example?: string;
  exampleFr?: string;
  createdAt: string;
}

const TABLE = 'custom_words';
const CHANGE_EVENT = 'ubuntu-custom-words-change';
const wordsKey = (profile: string) => `ubuntu_custom_words_${profile}`;
const dirtyKey = (profile: string) => `ubuntu_custom_words_dirty_${profile}`;

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

const cache = new Map<string, CustomWord[]>();

export function getCustomWords(profile: string): CustomWord[] {
  let words = cache.get(profile);
  if (!words) {
    words = readJSON<CustomWord[]>(wordsKey(profile), []);
    cache.set(profile, words);
  }
  return words;
}

function saveLocal(profile: string, words: CustomWord[]) {
  cache.set(profile, words);
  writeJSON(wordsKey(profile), words);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith('ubuntu_custom_words_')) { cache.clear(); onChange(); }
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

const pulled = new Set<string>();

/** Every word of the profile (all languages). `undefined` on the server / before hydration. */
export function useCustomWords(profile: string): CustomWord[] | undefined {
  useEffect(() => {
    if (pulled.has(profile)) return;
    pulled.add(profile);
    void pullCustomWords(profile);
  }, [profile]);
  return useSyncExternalStore(subscribe, () => getCustomWords(profile), () => undefined);
}

function markDirty(profile: string, id: string) {
  const dirty = new Set(readJSON<string[]>(dirtyKey(profile), []));
  dirty.add(id);
  writeJSON(dirtyKey(profile), [...dirty]);
  void pushDirty(profile);
}

export function addCustomWord(profile: string, word: Omit<CustomWord, 'id' | 'createdAt'>): CustomWord {
  const id = `my_${word.lang}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const full: CustomWord = { ...word, id, createdAt: new Date().toISOString() };
  saveLocal(profile, [...getCustomWords(profile), full]);
  markDirty(profile, id);
  return full;
}

export function deleteCustomWord(profile: string, id: string) {
  saveLocal(profile, getCustomWords(profile).filter((w) => w.id !== id));
  markDirty(profile, id);
}

// ── Supabase sync (named profiles only — guests stay on the device) ───────────

interface Row {
  profile: string;
  id: string;
  lang: string;
  term: string;
  translation: string;
  example: string | null;
  example_fr: string | null;
  created_at: string;
}

const toRow = (profile: string, w: CustomWord): Row => ({
  profile, id: w.id, lang: w.lang, term: w.term, translation: w.translation,
  example: w.example ?? null, example_fr: w.exampleFr ?? null, created_at: w.createdAt,
});

const fromRow = (r: Row): CustomWord => ({
  id: r.id, lang: r.lang as CustomLang, term: r.term, translation: r.translation,
  example: r.example ?? undefined, exampleFr: r.example_fr ?? undefined, createdAt: r.created_at,
});

const pushing = new Map<string, Promise<void>>();

/** Upserts added words and deletes removed ones. One push per profile at a time. */
function pushDirty(profile: string): Promise<void> {
  let p = pushing.get(profile);
  if (!p) {
    p = doPush(profile).finally(() => pushing.delete(profile));
    pushing.set(profile, p);
  }
  return p;
}

async function doPush(profile: string) {
  if (profile === 'guest') return;
  try {
    const ids = readJSON<string[]>(dirtyKey(profile), []);
    if (ids.length === 0 || !navigator.onLine) return;
    const byId = new Map(getCustomWords(profile).map((w) => [w.id, w]));
    const upserts = ids.filter((id) => byId.has(id)).map((id) => toRow(profile, byId.get(id)!));
    const deletes = ids.filter((id) => !byId.has(id));
    if (upserts.length > 0) {
      const { error } = await supabase.from(TABLE).upsert(upserts, { onConflict: 'profile,id' });
      if (error) { console.error('custom_words push:', error.message); return; }
    }
    if (deletes.length > 0) {
      const { error } = await supabase.from(TABLE).delete().eq('profile', profile).in('id', deletes);
      if (error) { console.error('custom_words delete:', error.message); return; }
    }
    // Keep ids that became dirty while the requests were in flight
    const sent = new Set(ids);
    writeJSON(dirtyKey(profile), readJSON<string[]>(dirtyKey(profile), []).filter((id) => !sent.has(id)));
  } catch { /* offline or table missing — retried on next change */ }
}

/** Remote list wins, except for local changes not pushed yet. */
async function pullCustomWords(profile: string): Promise<void> {
  if (profile === 'guest') return;
  try {
    await pushDirty(profile);
    const { data, error } = await supabase.from(TABLE).select('*').eq('profile', profile).order('created_at');
    if (error) { console.error('custom_words pull:', error.message); return; }
    const dirty = new Set(readJSON<string[]>(dirtyKey(profile), []));
    const local = getCustomWords(profile);
    const remote = (data as Row[]).map(fromRow).filter((w) => !dirty.has(w.id));
    const pending = local.filter((w) => dirty.has(w.id));
    const merged = [...remote, ...pending].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const same = merged.length === local.length && merged.every((w, i) => w.id === local[i].id);
    if (!same) saveLocal(profile, merged);
  } catch { /* offline — local data stays authoritative */ }
}
