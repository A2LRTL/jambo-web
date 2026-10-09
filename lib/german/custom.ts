'use client';

import { useMemo } from 'react';
import type { GermanWord } from '@/types';
import { useCustomWords, type CustomWord } from '@/lib/custom-words';

/** "der Tisch" → noun with its article; anything else is kept as an expression. */
function toGermanWord(c: CustomWord): GermanWord {
  const m = c.term.match(/^(der|die|das)\s+(.+)$/i);
  return {
    id: c.id,
    lemma: m ? m[2] : c.term,
    article: m ? (m[1].toLowerCase() as GermanWord['article']) : null,
    plural: null,
    pos: m ? 'noun' : 'other',
    level: 'A2', // unused: own words ignore the level filter (see `custom`)
    theme: 'perso',
    fr: c.translation,
    forms: null,
    governs: null,
    example_de: c.example ?? '',
    example_fr: c.exampleFr ?? '',
    compound: null,
    custom: true,
  };
}

/** The built-in deck plus the profile's own German words (added at the end). */
export function useGermanDeck(profile: string, deck: GermanWord[]): GermanWord[] {
  const custom = useCustomWords(profile);
  return useMemo(
    () => [...deck, ...(custom ?? []).filter((w) => w.lang === 'german').map(toGermanWord)],
    [deck, custom],
  );
}
