'use client';

import { useMemo, useState } from 'react';
import { useIsClient } from '@/lib/useIsClient';
import { readSavedPos } from '@/lib/resume';
import { useRouter } from 'next/navigation';
import type { Lesson } from '@/types';
import OptionButton from './OptionButton';
import PrimaryButton from './PrimaryButton';

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
}

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
  mode?: string;
}

// The saved position lives in localStorage, so render only once on the client
export default function ExerciseClient(props: Props) {
  const isClient = useIsClient();
  return isClient ? <Exercise {...props} /> : null;
}

function Exercise({ lesson, lessonId, mode }: Props) {
  const router = useRouter();
  const posKey = `jambo_quiz_pos_${lessonId}${mode === 'reverse' ? '_rev' : ''}`;
  const [saved] = useState(() => readSavedPos(posKey, lesson.exercises.length));
  const [index, setIndex] = useState(saved?.i ?? 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(saved?.s ?? 0);
  const resumed = saved?.i ?? null;

  const exercise = lesson.exercises[index];
  const isLast = index === lesson.exercises.length - 1;
  const isAnswered = selected !== null;
  const isCorrect = selected === exercise.correctAnswer;

  // ── Saved position (resume where you left off) ──────────────────────────────
  const savePos = (i: number, s: number) => {
    try {
      if (i <= 0) localStorage.removeItem(posKey);
      else localStorage.setItem(posKey, JSON.stringify({ i, s }));
    } catch { /* ignore */ }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => shuffle([exercise.correctAnswer, ...exercise.wrongAnswers]), [exercise.id]);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    if (option === exercise.correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      savePos(0, 0); // deck finished — clear saved position
      router.push(`/lesson/${lessonId}/complete?score=${score}&total=${lesson.exercises.length}&t=${Date.now()}`);
    } else {
      savePos(index + 1, score);
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  const saveAndExit = () => {
    savePos(isAnswered ? index + 1 : index, score);
    router.push(`/lesson/${lessonId}`);
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

      {resumed !== null && index === resumed && (
        <p className="text-center text-xs text-accent font-semibold mb-4">
          ↩︎ Reprise à la question {resumed + 1}
        </p>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-muted text-base mb-3">Que signifie</p>
          <p className="text-6xl font-bold text-ink">{exercise.prompt}</p>
        </div>

        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <OptionButton
              key={option}
              label={isAnswered ? option : normalize(option)}
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
        {!isLast && (
          <button type="button" onClick={saveAndExit}
            className="w-full py-3 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent active:scale-[0.98] transition-all">
            💾 Sauvegarder et quitter
          </button>
        )}
      </div>
    </main>
  );
}
