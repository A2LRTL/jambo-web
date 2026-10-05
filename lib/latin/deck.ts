// Server-side loader — keeps the expressions JSON out of client bundles.
import type { LatinExpression } from '@/types';
import data from '@/data/latin-expressions.json';

export const LEVELS = ['all', 'courant', 'soutenu'] as const;
export type LevelFilter = (typeof LEVELS)[number];

export function getExpressions(level: LevelFilter = 'all'): LatinExpression[] {
  const all = data.expressions as LatinExpression[];
  return level === 'all' ? all : all.filter((e) => e.level === level);
}
