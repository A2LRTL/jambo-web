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
