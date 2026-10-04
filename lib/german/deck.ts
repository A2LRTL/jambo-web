// Server-side deck loader — keeps the vocab JSON out of client bundles.
import type { GermanWord } from '@/types';
import vocab from '@/data/german-vocab.json';

export function getDeck(): GermanWord[] {
  return vocab.words as GermanWord[];
}
