'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VocabItem } from '@/lib/exercises';

interface Props {
  lessonId: string;
  title: string;
  items: VocabItem[];
}

export default function FlashcardClient({ lessonId, title, items }: Props) {
  const router = useRouter();
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [fading, setFading]   = useState(false);

  const card = items[index];
  const isLast = index === items.length - 1;

  const transition = (action: () => void) => {
    setFading(true);
    setTimeout(() => { action(); setFading(false); }, 150);
  };

  const flip = () => transition(() => setFlipped((f) => !f));
  const prev = () => transition(() => { setIndex((i) => i - 1); setFlipped(false); });
  const next = () => transition(() => { setIndex((i) => i + 1); setFlipped(false); });

  const goQuiz    = () => router.push(`/lesson/${lessonId}/quiz`);
  const goReverse = () => router.push(`/lesson/${lessonId}/quiz?mode=reverse`);
  const goBack    = () => router.push(`/lesson/${lessonId}`);

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={goBack}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none">
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider">Flashcards</p>
          <p className="font-bold text-ink">{title}</p>
        </div>
        <p className="text-sm text-muted font-medium">{index + 1} / {items.length}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <button type="button" onClick={flip}
          className={`w-full rounded-3xl bg-card border-2 border-border shadow-md flex flex-col items-center justify-center gap-3 py-16 px-8 transition-opacity duration-150 ${fading ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            {flipped ? 'Traduction' : 'Kirundi'}
          </p>
          <p className="text-4xl font-bold text-ink text-center leading-snug">
            {flipped ? card.translation : card.term}
          </p>
          {!flipped && (
            <p className="text-xs text-muted mt-2">Appuie pour voir la traduction</p>
          )}
          {flipped && (
            <p className="text-xs text-accent font-semibold mt-2">{card.term}</p>
          )}
        </button>
      </div>

      {/* Navigation or Quiz CTA */}
      {isLast ? (
        <div className="flex flex-col gap-3 mt-8">
          <p className="text-center text-sm font-semibold text-success">
            ✓ Toutes les cartes vues !
          </p>
          <button type="button" onClick={goQuiz}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md">
            Commencer le Quiz →
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={goReverse}
              className="flex-1 py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
              Quiz inversé ⇄
            </button>
            <button type="button" onClick={() => transition(() => { setIndex(0); setFlipped(false); })}
              className="flex-1 py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
              Revoir 🔁
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={prev} disabled={index === 0}
            className="flex-1 py-4 rounded-xl border border-border bg-card font-semibold text-ink disabled:opacity-30 hover:border-accent transition-all active:scale-[0.98]">
            ← Précédent
          </button>
          <button type="button" onClick={next}
            className="flex-1 py-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark transition-all active:scale-[0.98]">
            Suivant →
          </button>
        </div>
      )}

      {/* Skip to quiz (subtle) */}
      {!isLast && (
        <button type="button" onClick={goQuiz}
          className="mt-4 text-center text-xs text-muted hover:text-ink transition-colors">
          Passer les flashcards → Quiz direct
        </button>
      )}
    </main>
  );
}
