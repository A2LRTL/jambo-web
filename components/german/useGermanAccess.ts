'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { hasGermanAccess, useProfile } from '@/lib/profile';

/**
 * Returns the German-section profile once hydrated, or `undefined` while loading.
 * Profiles without access are is sent back to the home page.
 */
export function useGermanAccess(): string | undefined {
  const router = useRouter();
  const profile = useProfile();
  const allowed = hasGermanAccess(profile);

  useEffect(() => {
    if (profile !== undefined && !allowed) router.replace('/');
  }, [profile, allowed, router]);

  return allowed ? profile : undefined;
}
