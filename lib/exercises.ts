import type { Lesson, Exercise } from '@/types';
import { CATEGORY_LABELS } from './lesson-registry';
import vocab from '@/data/kirundi-vocab.json';

interface RawVocabItem {
  id: string;
  term_kirundi: string;
  translation_en: string;
  category: string;
}

export interface VocabItem {
  term: string;
  translation: string;
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

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function distractorScore(correct: string, candidate: string): number {
  const a = correct.toLowerCase();
  const b = candidate.toLowerCase();
  let score = 0;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  score += i * 1.5;
  let j = 0;
  const maxSuffix = Math.min(a.length, b.length) - i;
  while (j < maxSuffix && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  score += j * 1.0;
  const diff = Math.abs(a.length - b.length);
  if (diff <= 1) score += 1.0;
  else if (diff <= 2) score += 0.5;
  return score;
}

function pickSmartDistractors(correct: string, pool: string[], n: number): string[] {
  const scored = pool
    .filter((c) => c !== correct)
    .map((c) => ({ c, score: distractorScore(correct, c) + Math.random() }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.c);
}

export function generateKirundiLesson(category: string, count = 10): Lesson | null {
  if (!(category in CATEGORY_LABELS)) return null;
  const all = vocab.vocabulary_items as RawVocabItem[];
  const pool = all.filter((v) => v.category === category && v.translation_en);
  if (pool.length < 2) return null;
  const selected = sample(pool, Math.min(count, pool.length));
  const fallback = all
    .filter((v) => v.category !== category && v.translation_en)
    .map((v) => v.translation_en);
  const exercises: Exercise[] = selected.map((item) => {
    const samePool = pool.filter((v) => v.id !== item.id).map((v) => v.translation_en);
    const wrongPool = [...new Set([...samePool, ...fallback])].filter(
      (t) => t !== item.translation_en,
    );
    return {
      id: item.id,
      type: 'multiple_choice' as const,
      prompt: item.term_kirundi,
      correctAnswer: item.translation_en,
      wrongAnswers: pickSmartDistractors(item.translation_en, wrongPool, 3),
    };
  });
  return { id: `kirundi-${category}`, language: 'kirundi', title: CATEGORY_LABELS[category], exercises };
}

export function reverseLesson(lesson: Lesson): Lesson {
  const prompts = lesson.exercises.map((ex) => ex.prompt);
  return {
    ...lesson,
    id: `${lesson.id}-reverse`,
    exercises: lesson.exercises.map((ex) => ({
      ...ex,
      id: `${ex.id}-r`,
      prompt: ex.correctAnswer,
      correctAnswer: ex.prompt,
      wrongAnswers: pickSmartDistractors(
        ex.prompt,
        prompts.filter((p) => p !== ex.prompt),
        Math.min(3, prompts.length - 1),
      ),
    })),
  };
}

interface RawPhrase {
  id: string;
  phrase_kirundi: string;
  translation_en: string;
  topic: string;
}

export interface PhraseExercise {
  id: string;
  phraseEN: string;
  solution: string[];
  allWords: string[];
}

export function getPhraseExercises(topic: string): PhraseExercise[] {
  const phrases = (vocab.phrases as RawPhrase[]).filter((p) => p.topic === topic && p.phrase_kirundi && p.translation_en);
  const allKirundiWords = (vocab.vocabulary_items as RawVocabItem[])
    .filter((v) => v.term_kirundi && !v.term_kirundi.includes(' '))
    .map((v) => v.term_kirundi);

  return phrases.map((p) => {
    const solution = p.phrase_kirundi.split(/\s+/).filter(Boolean);
    const decoyCount = Math.max(2, 5 - solution.length);
    const decoys = sample(
      allKirundiWords.filter((w) => !solution.includes(w)),
      decoyCount,
    );
    return {
      id: p.id,
      phraseEN: p.translation_en,
      solution,
      allWords: shuffle([...solution, ...decoys]),
    };
  });
}

export function getKirundiVocabItems(category: string): VocabItem[] {
  const all = vocab.vocabulary_items as RawVocabItem[];
  return all
    .filter((v) => v.category === category && v.translation_en)
    .map((v) => ({ term: v.term_kirundi, translation: v.translation_en }));
}
