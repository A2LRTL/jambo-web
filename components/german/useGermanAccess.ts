'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GERMAN_PROFILE, useProfile } from '@/lib/profile';

/**
 * Returns the German-section profile once hydrated, or `undefined` while loading.
 * Any other profile is sent back to the home page.
 */
export function useGermanAccess(): string | undefined {
  const router = useRouter();
  const profile = useProfile();
  const allowed = profile === GERMAN_PROFILE;

  useEffect(() => {
    if (profile !== undefined && !allowed) router.replace('/');
  }, [profile, allowed, router]);

  return allowed ? profile : undefined;
}
