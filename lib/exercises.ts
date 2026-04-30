import type { Lesson, Exercise } from '@/types';
import { CATEGORY_LABELS } from './lesson-registry';
import vocab from '@/data/kirundi-vocab.json';

interface VocabItem {
  id: string;
  term_kirundi: string;
  translation_en: string;
  category: string;
}

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (result.length < n && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    result.push(...copy.splice(i, 1));
  }
  return result;
}

export function generateKirundiLesson(category: string, count = 10): Lesson | null {
  if (!(category in CATEGORY_LABELS)) return null;

  const all = vocab.vocabulary_items as VocabItem[];
  const pool = all.filter((v) => v.category === category && v.translation_en);
  if (pool.length < 2) return null;

  const selected = sample(pool, Math.min(count, pool.length));

  const fallback = all
    .filter((v) => v.category !== category && v.translation_en)
    .map((v) => v.translation_en);

  const exercises: Exercise[] = selected.map((item) => {
    const samePool = pool
      .filter((v) => v.id !== item.id)
      .map((v) => v.translation_en);
    const wrongPool = [...new Set([...samePool, ...fallback])].filter(
      (t) => t !== item.translation_en,
    );
    const wrongAnswers = sample(wrongPool, 3);
    return {
      id: item.id,
      type: 'multiple_choice' as const,
      prompt: item.term_kirundi,
      correctAnswer: item.translation_en,
      wrongAnswers,
    };
  });

  return {
    id: `kirundi-${category}`,
    language: 'kirundi',
    title: CATEGORY_LABELS[category],
    exercises,
  };
}
