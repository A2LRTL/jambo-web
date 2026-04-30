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
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [fading, setFading] = useState(false);

  const card = items[index];

  const transition = (action: () => void) => {
    setFading(true);
    setTimeout(() => { action(); setFading(false); }, 150);
  };

  const flip = () => transition(() => setFlipped((f) => !f));
  const prev = () => transition(() => { setIndex((i) => i - 1); setFlipped(false); });
  const next = () => transition(() => { setIndex((i) => i + 1); setFlipped(false); });

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push(`/lesson/${lessonId}`)}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider">Flashcards</p>
          <p className="font-bold text-ink">{title}</p>
        </div>
        <p className="text-sm text-muted font-medium">{index + 1} / {items.length}</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <button
          type="button"
          onClick={flip}
          className={`w-full rounded-2xl bg-card border-2 border-border shadow-md flex flex-col items-center justify-center gap-3 py-16 px-8 transition-opacity duration-150 ${fading ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className="text-xs text-muted uppercase tracking-wider">
            {flipped ? 'Traduction' : 'Terme'}
          </p>
          <p className="text-4xl font-bold text-ink text-center">
            {flipped ? card.translation : card.term}
          </p>
          <p className="text-xs text-muted mt-2">Appuie pour retourner</p>
        </button>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="flex-1 py-4 rounded-xl border border-border bg-card font-semibold text-ink disabled:opacity-40 hover:border-accent transition-all active:scale-[0.98]"
        >
          ← Précédent
        </button>
        <button
          type="button"
          onClick={next}
          disabled={index === items.length - 1}
          className="flex-1 py-4 rounded-xl bg-accent text-white font-semibold disabled:opacity-40 hover:bg-accent-dark transition-all active:scale-[0.98]"
        >
          Suivant →
        </button>
      </div>
    </main>
  );
}
