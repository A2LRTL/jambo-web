'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Lesson } from '@/types';
import OptionButton from './OptionButton';
import PrimaryButton from './PrimaryButton';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface Props {
  lesson: Lesson;
  lessonId: string;
}

export default function ExerciseClient({ lesson, lessonId }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const exercise = lesson.exercises[index];
  const isLast = index === lesson.exercises.length - 1;
  const isAnswered = selected !== null;
  const isCorrect = selected === exercise.correctAnswer;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => shuffle([exercise.correctAnswer, ...exercise.wrongAnswers]), [exercise.id]);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    if (option === exercise.correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      router.push(`/lesson/${lessonId}/complete?score=${score}&total=${lesson.exercises.length}`);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const getOptionState = (option: string) => {
    if (!isAnswered) return 'idle';
    if (option === exercise.correctAnswer) return 'correct';
    if (option === selected) return 'wrong';
    return 'dimmed';
  };

  return (
    <main className="flex flex-col min-h-dvh px-6 pb-10 pt-6 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <button
          type="button"
          onClick={() => router.push(`/lesson/${lessonId}`)}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none mr-3"
        >
          ←
        </button>
        <p className="flex-1 text-center text-sm text-muted">
          {index + 1} / {lesson.exercises.length}
        </p>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-muted text-base mb-3">Que signifie</p>
          <p className="text-6xl font-bold text-ink">{exercise.prompt}</p>
        </div>

        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <OptionButton
              key={option}
              label={option}
              state={getOptionState(option)}
              onClick={() => handleSelect(option)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isAnswered && (
          <p className={`text-center font-semibold ${isCorrect ? 'text-success' : 'text-error'}`}>
            {isCorrect ? 'Bien joué !' : `Réponse : ${exercise.correctAnswer}`}
          </p>
        )}
        <PrimaryButton
          label={isLast ? 'Terminer' : 'Suivant'}
          onClick={handleNext}
          variant={isAnswered ? 'primary' : 'secondary'}
          disabled={!isAnswered}
        />
      </div>
    </main>
  );
}
