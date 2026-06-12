'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PhraseExercise } from '@/lib/exercises';

interface Props {
  topic: string;
  title: string;
  exercises: PhraseExercise[];
}

export default function PhraseExerciseClient({ topic, title, exercises }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [resumed, setResumed] = useState<number | null>(null);

  const exercise = exercises[index];
  const isLast = index === exercises.length - 1;
  const placedWords = placed.map((i) => exercise.allWords[i]);
  const isCorrect = checked && placedWords.join(' ') === exercise.solution.join(' ');

  // ── Saved position (resume where you left off) ──────────────────────────────
  const posKey = `jambo_phrase_pos_${topic}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(posKey);
      if (raw) {
        const { i, s } = JSON.parse(raw);
        if (Number.isInteger(i) && i > 0 && i < exercises.length) {
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

  const saveAndExit = () => {
    savePos(checked ? index + 1 : index, score);
    router.push('/');
  };

  const tapAvailable = (wordIndex: number) => {
    if (checked) return;
    setPlaced((prev) => [...prev, wordIndex]);
  };

  const tapPlaced = (posIndex: number) => {
    if (checked) return;
    setPlaced((prev) => prev.filter((_, i) => i !== posIndex));
  };

  const handleCheck = () => {
    const correct = placedWords.join(' ') === exercise.solution.join(' ');
    if (correct) setScore((s) => s + 1);
    setChecked(true);
  };

  const handleNext = () => {
    if (isLast) {
      savePos(0, 0); // deck finished — clear saved position
      router.push(`/phrases/${topic}/complete?score=${score}&total=${exercises.length}`);
    } else {
      savePos(index + 1, score);
      setIndex((i) => i + 1);
      setPlaced([]);
      setChecked(false);
    }
  };

  const availableIndices = exercise.allWords
    .map((_, i) => i)
    .filter((i) => !placed.includes(i));

  return (
    <main className="flex flex-col min-h-dvh px-6 pb-10 pt-6 max-w-md mx-auto">
      <div className="flex items-center mb-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none mr-3"
        >
          ←
        </button>
        <p className="flex-1 text-center text-sm text-muted font-medium truncate">{title}</p>
        <p className="text-sm text-muted w-9 text-right">{index + 1}/{exercises.length}</p>
      </div>

      {resumed !== null && index === resumed && (
        <p className="text-center text-xs text-accent font-semibold mb-4">
          ↩︎ Reprise à la phrase {resumed + 1}
        </p>
      )}

      <div className="flex-1 flex flex-col">
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-muted text-sm mb-2">Traduire en kirundi</p>
          <p className="text-2xl font-bold text-ink text-center leading-snug">{exercise.phraseEN}</p>
        </div>

        {/* Answer zone */}
        <div className="min-h-16 mb-4 p-3 rounded-xl border-2 border-dashed border-border bg-card flex flex-wrap gap-2 items-center">
          {placed.length === 0 ? (
            <p className="text-muted text-sm w-full text-center">Appuie sur les mots ci-dessous</p>
          ) : (
            placedWords.map((word, pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => tapPlaced(pos)}
                disabled={checked}
                className={`py-1.5 px-3 rounded-lg border text-sm font-semibold transition-all ${
                  checked
                    ? isCorrect
                      ? 'border-success text-success bg-success-bg'
                      : 'border-error text-error bg-error-bg'
                    : 'border-accent text-accent bg-cream active:scale-95'
                }`}
              >
                {word}
              </button>
            ))
          )}
        </div>

        {/* Word bank */}
        <div className="flex flex-wrap gap-2 justify-center py-4">
          {availableIndices.map((wordIndex) => (
            <button
              key={wordIndex}
              type="button"
              onClick={() => tapAvailable(wordIndex)}
              disabled={checked}
              className="py-2 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent transition-all active:scale-95 disabled:opacity-40"
            >
              {exercise.allWords[wordIndex]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {checked && (
          <div className={`text-center text-sm font-semibold ${isCorrect ? 'text-success' : 'text-error'}`}>
            {isCorrect ? 'Bien joué !' : (
              <>Réponse : <span className="font-bold">{exercise.solution.join(' ')}</span></>
            )}
          </div>
        )}
        {!checked ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={placed.length === 0}
            className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Vérifier
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-lg transition-all active:scale-[0.98]"
          >
            {isLast ? 'Terminer' : 'Continuer'}
          </button>
        )}
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
