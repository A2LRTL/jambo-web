'use client';

import { useRouter } from 'next/navigation';
import type { VocabItem } from '@/lib/exercises';

interface Props {
  id: string;
  title: string;
  items: VocabItem[];
}

export default function VocabList({ id, title, items }: Props) {
  const router = useRouter();

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <div className="flex items-center gap-3 pt-6 pb-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none"
        >
          ←
        </button>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Vocabulaire</p>
          <h1 className="text-xl font-bold text-ink">{title}</h1>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-6">
        <button
          type="button"
          onClick={() => router.push(`/lesson/${id}/flashcards`)}
          className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base shadow-sm hover:bg-accent-dark transition-all active:scale-[0.98]"
        >
          ✦ Apprendre (flashcards → quiz)
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push(`/lesson/${id}/quiz`)}
            className="flex-1 py-3 rounded-xl bg-card border border-border text-ink font-semibold text-sm hover:border-accent transition-all active:scale-[0.98]"
          >
            Quiz direct →
          </button>
          <button
            type="button"
            onClick={() => router.push(`/lesson/${id}/quiz?mode=reverse`)}
            className="flex-1 py-3 rounded-xl bg-card border border-border text-ink font-semibold text-sm hover:border-accent transition-all active:scale-[0.98]"
          >
            Inversé ⇄
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.term}
            className="py-3 px-4 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">{item.term}</span>
              <span className="text-muted text-sm ml-4 text-right">{item.translation}</span>
            </div>
            {item.example && (
              <p className="text-xs text-muted italic mt-1.5 border-t border-border pt-1.5">
                {item.example}
                {item.exampleFr && (
                  <span className="block not-italic text-muted/70">{item.exampleFr}</span>
                )}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted mt-4">{items.length} mots</p>
    </main>
  );
}
