'use client';

import { useSyncExternalStore } from 'react';

// ── Profile (persisted in localStorage) ─────────────────────────────────────

export const PROFILES = ['Shaza', 'Gisabo', 'Ruta', 'Bambara'] as const;
export type ProfileName = (typeof PROFILES)[number];
export type Profile = ProfileName | 'guest';

/** The profiles that have access to the German section. */
export const GERMAN_PROFILES: readonly ProfileName[] = ['Ruta', 'Bambara'];

export function hasGermanAccess(profile: Profile | null | undefined): profile is ProfileName {
  return (GERMAN_PROFILES as readonly string[]).includes(profile ?? '');
}

const PROFILE_KEY = 'jambo_profile';
const PROFILE_EVENT = 'jambo-profile-change';

function readProfile(): Profile | null {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved === 'guest' || (PROFILES as readonly string[]).includes(saved ?? '')) return saved as Profile;
  } catch { /* ignore */ }
  return null;
}

export function writeProfile(name: Profile) {
  try { localStorage.setItem(PROFILE_KEY, name); } catch { /* ignore */ }
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

function subscribeProfile(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(PROFILE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(PROFILE_EVENT, onChange);
  };
}

/** `undefined` on the server / before hydration, `null` when no profile is chosen yet. */
export function useProfile(): Profile | null | undefined {
  return useSyncExternalStore(subscribeProfile, readProfile, () => undefined);
}
