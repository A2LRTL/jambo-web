import type { Lesson, Exercise, VocabItem, PhraseExercise } from '@/types';
import { shuffle, sample } from '@/lib/utils';
import { CATEGORY_LABELS, SWAHILI_CATEGORY_LABELS } from './lesson-registry';
import vocab from '@/data/kirundi-vocab.json';
import swVocab from '@/data/swahili-vocab.json';

// ── Kirundi raw types ─────────────────────────────────────────────────────────

interface RawVocabItem {
  id: string;
  term_kirundi: string;
  translation_en: string;
  translation_fr: string | null;
  category: string;
}

interface RawPhrase {
  id: string;
  phrase_kirundi: string;
  translation_en: string;
  translation_fr: string | null;
  topic: string;
}

function tr(item: RawVocabItem): string {
  return item.translation_fr ?? item.translation_en;
}

function trPhrase(p: RawPhrase): string {
  return p.translation_fr ?? p.translation_en;
}

// ── Distractor picking ────────────────────────────────────────────────────────

/**
 * Score how "confusable" a candidate is with the correct answer.
 * Higher = more similar (better decoy).
 * Uses prefix match (×1.5), suffix match (×1.0), and length proximity (×0.5–1.0).
 */
function distractorScore(correct: string, candidate: string): number {
  const a = correct.toLowerCase();
  const b = candidate.toLowerCase();
  let score = 0;

  // Prefix similarity
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  score += i * 1.5;

  // Suffix similarity
  let j = 0;
  const maxSuffix = Math.min(a.length, b.length) - i;
  while (j < maxSuffix && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  score += j * 1.0;

  // Length proximity bonus
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

// ── Kirundi lesson generation ─────────────────────────────────────────────────

export function generateKirundiLesson(category: string, count = 10): Lesson | null {
  if (!(category in CATEGORY_LABELS)) return null;
  const all = vocab.vocabulary_items as RawVocabItem[];
  const pool = all.filter((v) => v.category === category && tr(v));
  if (pool.length < 2) return null;
  const selected = sample(pool, Math.min(count, pool.length));
  const fallback = all.filter((v) => v.category !== category && tr(v)).map(tr);
  const exercises: Exercise[] = selected.map((item) => {
    const samePool = pool.filter((v) => v.id !== item.id).map(tr);
    const wrongPool = [...new Set([...samePool, ...fallback])].filter((t) => t !== tr(item));
    return {
      id: item.id,
      type: 'multiple_choice' as const,
      prompt: item.term_kirundi,
      correctAnswer: tr(item),
      wrongAnswers: pickSmartDistractors(tr(item), wrongPool, 3),
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

export function getPhraseExercises(topic: string): PhraseExercise[] {
  const phrases = (vocab.phrases as RawPhrase[]).filter(
    (p) => p.topic === topic && p.phrase_kirundi && trPhrase(p),
  );
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
      phraseEN: trPhrase(p),
      solution,
      allWords: shuffle([...solution, ...decoys]),
    };
  });
}

export function getKirundiVocabItems(category: string): VocabItem[] {
  const all = vocab.vocabulary_items as RawVocabItem[];
  return all
    .filter((v) => v.category === category && tr(v))
    .map((v) => ({ term: v.term_kirundi, translation: tr(v) }));
}

// ── Swahili raw types ─────────────────────────────────────────────────────────

interface RawSwVocabItem {
  id: string;
  language: string;
  term_swahili: string;
  translation_en: string;
  translation_fr: string | null;
  category: string;
  example_swahili?: string;
  example_en?: string;
  example_fr?: string | null;
}

interface RawSwPhrase {
  id: string;
  language: string;
  phrase_swahili: string;
  translation_en: string;
  translation_fr: string | null;
  topic: string;
}

function trSw(item: RawSwVocabItem): string {
  return item.translation_fr ?? item.translation_en;
}

function trSwPhrase(p: RawSwPhrase): string {
  return p.translation_fr ?? p.translation_en;
}

// ── Swahili lesson generation ─────────────────────────────────────────────────

export function generateSwahiliLesson(category: string, count = 10): Lesson | null {
  if (!(category in SWAHILI_CATEGORY_LABELS)) return null;
  const all = swVocab.vocabulary_items as RawSwVocabItem[];
  const pool = all.filter((v) => v.category === category && trSw(v));
  if (pool.length < 2) return null;
  const selected = sample(pool, Math.min(count, pool.length));
  const fallback = all.filter((v) => v.category !== category && trSw(v)).map(trSw);
  const exercises: Exercise[] = selected.map((item) => {
    const samePool = pool.filter((v) => v.id !== item.id).map(trSw);
    const wrongPool = [...new Set([...samePool, ...fallback])].filter((t) => t !== trSw(item));
    return {
      id: item.id,
      type: 'multiple_choice' as const,
      prompt: item.term_swahili,
      correctAnswer: trSw(item),
      wrongAnswers: pickSmartDistractors(trSw(item), wrongPool, 3),
    };
  });
  return {
    id: `swahili-${category}`,
    language: 'swahili',
    title: SWAHILI_CATEGORY_LABELS[category],
    exercises,
  };
}

export function getSwahiliVocabItems(category: string): VocabItem[] {
  const all = swVocab.vocabulary_items as RawSwVocabItem[];
  return all
    .filter((v) => v.category === category && trSw(v))
    .map((v) => ({
      term: v.term_swahili,
      translation: trSw(v),
      example: v.example_swahili,
      exampleFr: v.example_fr ?? undefined,
    }));
}

export function getSwahiliPhraseExercises(topic: string): PhraseExercise[] {
  const phrases = (swVocab.phrases as RawSwPhrase[]).filter(
    (p) => p.topic === topic && p.phrase_swahili && trSwPhrase(p),
  );
  const allSwWords = (swVocab.vocabulary_items as RawSwVocabItem[])
    .filter((v) => v.term_swahili && !v.term_swahili.includes(' '))
    .map((v) => v.term_swahili);

  return phrases.map((p) => {
    const solution = p.phrase_swahili.split(/\s+/).filter(Boolean);
    const decoyCount = Math.max(2, 5 - solution.length);
    const decoys = sample(
      allSwWords.filter((w) => !solution.includes(w)),
      decoyCount,
    );
    return {
      id: p.id,
      phraseEN: trSwPhrase(p),
      solution,
      allWords: shuffle([...solution, ...decoys]),
    };
  });
}

// Re-export shared types for consumers that import from this module
export type { VocabItem, PhraseExercise };
