// ── Exercise & Lesson types ────────────────────────────────────────────────────

export interface MultipleChoiceExercise {
  id: string;
  type: 'multiple_choice';
  prompt: string;
  correctAnswer: string;
  wrongAnswers: string[];
  /** Category of the answer word, used to prefer same-category (semantic) decoys. */
  correctCategory?: string;
  /**
   * Candidate decoys ranked by confusability, for client-side selection.
   * `value` is the answer shown; `term` is the SRS key used to skip words
   * the learner already knows. Absent on static lessons (uses wrongAnswers).
   */
  distractorPool?: DistractorCandidate[];
}

export interface DistractorCandidate {
  value: string;
  term: string;
  category?: string;
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
