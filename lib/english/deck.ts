// Server-side loader — keeps the verb JSON out of client bundles.
import type { EnglishVerb } from '@/types';
import data from '@/data/english-verb-preps.json';

export const LEVELS = ['all', 'b2', 'c1'] as const;
export type LevelFilter = (typeof LEVELS)[number];

export function getVerbs(level: LevelFilter = 'all'): EnglishVerb[] {
  const verbs = data.verbs as EnglishVerb[];
  return level === 'all' ? verbs : verbs.filter((v) => v.level.toLowerCase() === level);
}
