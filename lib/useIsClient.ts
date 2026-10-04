'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * `false` during SSR and hydration, `true` afterwards. Lets a component read
 * browser-only state (localStorage…) in a lazy useState initializer without
 * a hydration mismatch or a setState-in-effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
