import type { Lesson, Exercise, VocabItem, PhraseExercise, DistractorCandidate } from '@/types';
import { shuffle, sample, distractorScore, rankDistractors } from '@/lib/utils';
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

// Most confusable candidates to ship to the client per question. The client
// then drops words the learner already knows and picks the final decoys.
const POOL_CAP = 20;

function pickSmartDistractors(correct: string, pool: string[], n: number): string[] {
  const scored = pool
    .filter((c) => c !== correct)
    .map((c) => ({ c, score: distractorScore(correct, c) + Math.random() }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, n).map((s) => s.c);
}

/**
 * Build the candidate decoy pool for a question: the best traps (same-category
 * first, then most confusable), deduped by display value and capped. Each is
 * tagged with its SRS term key so the client can skip already-known words.
 */
function buildDistractorPool(
  correct: string,
  correctCategory: string | undefined,
  candidates: DistractorCandidate[],
): DistractorCandidate[] {
  const seen = new Set<string>();
  const unique = candidates.filter(
    (c) => c.value !== correct && !seen.has(c.value) && seen.add(c.value),
  );
  return rankDistractors(correct, correctCategory, unique).slice(0, POOL_CAP);
}

// ── Kirundi lesson generation ─────────────────────────────────────────────────

export function generateKirundiLesson(category: string, count = 10): Lesson | null {
  if (!(category in CATEGORY_LABELS)) return null;
  const all = vocab.vocabulary_items as RawVocabItem[];
  const pool = all.filter((v) => v.category === category && tr(v));
  if (pool.length < 2) return null;
  const selected = sample(pool, Math.min(count, pool.length));
  const candidatesAll = all.filter((v) => tr(v));
  const exercises: Exercise[] = selected.map((item) => {
    const candidates: DistractorCandidate[] = candidatesAll
      .filter((v) => v.id !== item.id)
      .map((v) => ({ value: tr(v), term: v.term_kirundi, category: v.category }));
    const distractorPool = buildDistractorPool(tr(item), item.category, candidates);
    return {
      id: item.id,
      type: 'multiple_choice' as const,
      prompt: item.term_kirundi,
      correctAnswer: tr(item),
      correctCategory: item.category,
      wrongAnswers: pickSmartDistractors(tr(item), distractorPool.map((d) => d.value), 3),
      distractorPool,
    };
  });
  return { id: `kirundi-${category}`, language: 'kirundi', title: CATEGORY_LABELS[category], exercises };
}

export function reverseLesson(lesson: Lesson): Lesson {
  const prompts = lesson.exercises.map((ex) => ex.prompt);
  return {
    ...lesson,
    id: `${lesson.id}-reverse`,
    exercises: lesson.exercises.map((ex) => {
      // In reverse mode the answer IS the term, so value and SRS key match.
      const candidates: DistractorCandidate[] = lesson.exercises
        .filter((o) => o.prompt !== ex.prompt)
        .map((o) => ({ value: o.prompt, term: o.prompt, category: o.correctCategory }));
      const distractorPool = buildDistractorPool(ex.prompt, ex.correctCategory, candidates);
      return {
        ...ex,
        id: `${ex.id}-r`,
        prompt: ex.correctAnswer,
        correctAnswer: ex.prompt,
        wrongAnswers: pickSmartDistractors(
          ex.prompt,
          prompts.filter((p) => p !== ex.prompt),
          Math.min(3, prompts.length - 1),
        ),
        distractorPool,
      };
    }),
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
  const candidatesAll = all.filter((v) => trSw(v));
  const exercises: Exercise[] = selected.map((item) => {
    const candidates: DistractorCandidate[] = candidatesAll
      .filter((v) => v.id !== item.id)
      .map((v) => ({ value: trSw(v), term: v.term_swahili, category: v.category }));
    const distractorPool = buildDistractorPool(trSw(item), item.category, candidates);
    return {
      id: item.id,
      type: 'multiple_choice' as const,
      prompt: item.term_swahili,
      correctAnswer: trSw(item),
      correctCategory: item.category,
      wrongAnswers: pickSmartDistractors(trSw(item), distractorPool.map((d) => d.value), 3),
      distractorPool,
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
