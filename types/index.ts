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

// ── German (spaced repetition) types ───────────────────────────────────────────

export type GermanPos = 'noun' | 'verb' | 'adj' | 'adv' | 'other';

export interface GermanWord {
  id: string;
  lemma: string;
  article: 'der' | 'die' | 'das' | null;
  plural: string | null;   // e.g. "-en", "¨-e", "–" (no plural)
  pos: GermanPos;
  level: 'A2' | 'B1' | 'B2';
  theme: string;
  fr: string;
  forms: string | null;    // verbs: "entscheidet, entschied, hat entschieden"
  governs: string | null;  // construction: "sich ~ für + Akk"
  example_de: string;
  example_fr: string;
  // Compound breakdown: Feier (fête) + Abend (soir) → « le soir de fête »
  compound: { parts: { de: string; fr: string }[]; literal: string } | null;
}

export interface WordProgress {
  wordId: string;
  box: number;        // Leitner box 0–7 (0 = learning, same session)
  due: string;        // ISO date
  reps: number;
  lapses: number;
  updatedAt: string;  // ISO date — last write wins when syncing
}

export interface EnglishVerb {
  id: string;
  pattern: string;      // "depend [on] sth" — the preposition is bracketed
  prep: string;         // "on"
  accept?: string[];    // other correct prepositions ("dream of / about")
  trap?: string;        // the usual French-calque mistake ("depend of")
  level: 'B2' | 'C1';
  fr: string;
  example_en: string;   // "It all depends [on] the weather."
  example_fr: string;
}

export interface LatinExpression {
  id: string;
  latin: string;     // "sine qua non"
  literal: string;   // word-for-word translation
  fr: string;        // what it means in use
  example: string;   // French sentence using it
  level: 'courant' | 'soutenu';
  note?: string;     // common pitfall
}
