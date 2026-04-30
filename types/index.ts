export type ExerciseType = 'multiple_choice' | 'translation';

export interface MultipleChoiceExercise {
  id: string;
  type: 'multiple_choice';
  prompt: string;
  correctAnswer: string;
  wrongAnswers: string[];
}

// Future: export interface TranslationExercise { ... }

export type Exercise = MultipleChoiceExercise;
// Future: | TranslationExercise

export interface Lesson {
  id: string;
  language: string;
  title: string;
  exercises: Exercise[];
}
