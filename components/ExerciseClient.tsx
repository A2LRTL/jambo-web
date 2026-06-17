'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DistractorCandidate, Lesson } from '@/types';
import { rankDistractors, shuffle } from '@/lib/utils';
import { isKnown, loadStore, review, saveCard } from '@/lib/srs';
import OptionButton from './OptionButton';
import PrimaryButton from './PrimaryButton';

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/\p{Mn}/gu, '');
}

/**
 * Choose `n` decoys, preferring same-category, confusable words the learner has
 * NOT yet mastered (real traps). Mastered words are only used to backfill if
 * there aren't enough unknown candidates left.
 */
function chooseDistractors(
  correct: string,
  correctCategory: string | undefined,
  pool: DistractorCandidate[],
  knownTerms: Set<string>,
  n: number,
): string[] {
  const ranked = rankDistractors(correct, correctCategory, pool, true);
  const unknown = ranked.filter((c) => !knownTerms.has(c.term));
  const known = ranked.filter((c) => knownTerms.has(c.term));

  const result: string[] = [];
  for (const c of [...unknown, ...known]) {
    if (result.length >= n) break;
    if (c.value !== correct && !result.includes(c.value)) result.push(c.value);
  }
  return result;
}

interface Props {
  lesson: Lesson;
  lessonId: string;
  mode?: string;
}

export default function ExerciseClient({ lesson, lessonId, mode }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [resumed, setResumed] = useState<number | null>(null);

  const exercise = lesson.exercises[index];
  const isLast = index === lesson.exercises.length - 1;
  const isAnswered = selected !== null;
  const isCorrect = selected === exercise.correctAnswer;

  // ── Saved position (resume where you left off) ──────────────────────────────
  const posKey = `jambo_quiz_pos_${lessonId}${mode === 'reverse' ? '_rev' : ''}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(posKey);
      if (raw) {
        const { i, s } = JSON.parse(raw);
        if (Number.isInteger(i) && i > 0 && i < lesson.exercises.length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIndex(i);
          setScore(typeof s === 'number' ? s : 0);
          setResumed(i);
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savePos = (i: number, s: number) => {
    try {
      if (i <= 0) localStorage.removeItem(posKey);
      else localStorage.setItem(posKey, JSON.stringify({ i, s }));
    } catch { /* ignore */ }
  };

  // Terms the learner has already mastered (from spaced-repetition state).
  const [knownTerms] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const store = loadStore(lessonId);
    return new Set(Object.keys(store).filter((term) => isKnown(store[term])));
  });

  const options = useMemo(() => {
    const wrongs = exercise.distractorPool?.length
      ? chooseDistractors(exercise.correctAnswer, exercise.correctCategory, exercise.distractorPool, knownTerms, 3)
      : exercise.wrongAnswers;
    return shuffle([exercise.correctAnswer, ...wrongs]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    const correct = option === exercise.correctAnswer;
    if (correct) setScore((s) => s + 1);

    // Feed the answer back into spaced repetition. The SRS key is the
    // target-language term, which is the prompt (or the answer in reverse mode).
    const term = mode === 'reverse' ? exercise.correctAnswer : exercise.prompt;
    saveCard(lessonId, term, review(loadStore(lessonId)[term], correct ? 'good' : 'again'));
  };

  const handleNext = () => {
    if (isLast) {
      savePos(0, 0); // deck finished — clear saved position
      router.push(`/lesson/${lessonId}/complete?score=${score}&total=${lesson.exercises.length}`);
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
