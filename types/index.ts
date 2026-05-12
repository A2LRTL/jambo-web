// ── Exercise & Lesson types ────────────────────────────────────────────────────

export interface MultipleChoiceExercise {
  id: string;
  type: 'multiple_choice';
  prompt: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

export type Exercise = MultipleChoiceExercise;

export interface Lesson {
  id: string;
  language: string;
  title: string;
  exercises: Exercise[];
}

// ── Vocabulary types ───────────────────────────────────────────────────────────

export interface VocabItem {
  term: string;
  translation: string;
  example?: string;    // Swahili example sentence
  exampleFr?: string;  // French translation of the example
}

// ── Phrase exercise types ──────────────────────────────────────────────────────

export interface PhraseExercise {
  id: string;
  phraseEN: string;
  solution: string[];
  allWords: string[];
}

// ── Score types ────────────────────────────────────────────────────────────────

export interface BestScore {
  best: number;
  total: number;
  attempts: number;
}

export interface ProfileStats {
  profile: string;
  lessonsPlayed: number;
  totalBest: number;
  totalPossible: number;
  pct: number;
}
