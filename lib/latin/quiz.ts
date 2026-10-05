// Latin expression quiz — pure functions (tested with `node --test lib/latin/quiz.test.ts`).

import type { LatinExpression } from '@/types';

export type Direction = 'meaning' | 'latin';

export interface LatinQuestion {
  id: string;
  direction: Direction;  // 'meaning': Latin shown, pick the meaning; 'latin': meaning shown, pick the Latin
  prompt: string;
  answer: string;
  options: string[];     // 4 shuffled choices, answer included
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Builds a 4-choice question; distractors are drawn from the other expressions of `pool`. */
export function buildQuestion(
  expr: LatinExpression, pool: LatinExpression[], direction: Direction, rand: () => number = Math.random,
): LatinQuestion {
  const field = direction === 'meaning' ? 'fr' : 'latin';
  const answer = expr[field];
  const others = [...new Set(pool.filter((e) => e.id !== expr.id).map((e) => e[field]))].filter((o) => o !== answer);
  return {
    id: expr.id,
    direction,
    prompt: direction === 'meaning' ? expr.latin : expr.fr,
    answer,
    options: shuffled([answer, ...shuffled(others, rand).slice(0, 3)], rand),
  };
}
