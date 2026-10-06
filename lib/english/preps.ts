// English verb + preposition helpers — pure functions (tested with `node --test lib/english/preps.test.ts`).

import type { EnglishVerb } from '@/types';

export const PREPS = [
  'about', 'against', 'at', 'between', 'by', 'for', 'from', 'in', 'into', 'of', 'on', 'over', 'to', 'with',
];

/** Every preposition that counts as right for this verb. */
export function accepted(verb: EnglishVerb): string[] {
  return [verb.prep, ...(verb.accept ?? [])];
}

/** "depend [on] sth" → "depend ___ sth". */
export function gapped(text: string): string {
  return text.replace(/\[\w+\]/, '___');
}

/** "depend [on] sth" → "depend on sth". */
export function plain(text: string): string {
  return text.replace(/\[(\w+)\]/g, '$1');
}

/** Splits a bracketed text into parts, flagging the preposition. */
export function highlight(text: string): { text: string; hit: boolean }[] {
  return text.split(/\[(\w+)\]/).map((part, i) => ({ text: part, hit: i % 2 === 1 })).filter((p) => p.text);
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

export interface EnglishPrepQuestion {
  verbId: string;
  sentence: boolean;  // gap in the example sentence rather than in the pattern
  prompt: string;     // "depend ___ sth" or "It all depends ___ the weather."
  answer: string;     // "on"
  options: string[];  // 4 shuffled choices, answer included
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Builds a 4-choice question. The French-calque trap, when known, is always one of the distractors. */
export function buildQuestion(verb: EnglishVerb, sentence = false, rand: () => number = Math.random): EnglishPrepQuestion {
  const right = new Set(accepted(verb));
  const trap = verb.trap && !right.has(verb.trap) ? [verb.trap] : [];
  const others = shuffled(PREPS.filter((p) => !right.has(p) && !trap.includes(p)), rand);
  return {
    verbId: verb.id,
    sentence,
    prompt: gapped(sentence ? verb.example_en : verb.pattern),
    answer: verb.prep,
    options: shuffled([verb.prep, ...trap, ...others].slice(0, 4), rand),
  };
}
