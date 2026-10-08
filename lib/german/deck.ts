// Server-side deck loader — keeps the vocab JSON out of client bundles.
import type { GermanWord } from '@/types';
import vocab from '@/data/german-vocab.json';
import { GERMAN_LEVELS } from './themes';

// Easiest level first, so triage and new words start with A2 (stable sort keeps file order within a level)
const deck = (vocab.words as GermanWord[])
  .slice()
  .sort((a, b) => GERMAN_LEVELS.indexOf(a.level) - GERMAN_LEVELS.indexOf(b.level));

export function getDeck(): GermanWord[] {
  return deck;
}
