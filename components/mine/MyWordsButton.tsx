'use client';

import { useRouter } from 'next/navigation';
import { customLessonId, useCustomWords, type CustomLang } from '@/lib/custom-words';

/** Entry point to a language's "Mes mots" page, with the word count. */
export default function MyWordsButton({ profile, lang, className = '' }: { profile: string; lang: CustomLang; className?: string }) {
  const router = useRouter();
  const count = useCustomWords(profile)?.filter((w) => w.lang === lang).length ?? 0;
  return (
    <button type="button" onClick={() => router.push(`/lesson/${customLessonId(lang)}`)}
      className={`w-full py-4 px-5 rounded-xl border border-border bg-card text-left hover:border-accent transition-all active:scale-[0.98] shadow-sm flex items-center justify-between gap-3 ${className}`}>
      <div>
        <p className="text-sm font-bold text-ink">Mes mots{count > 0 ? ` · ${count}` : ''}</p>
        <p className="text-xs text-muted mt-0.5">
          {count > 0 ? 'Ajouter des mots, flashcards et quiz' : 'Ajoute les mots que tu croises, puis entraîne-toi'}
        </p>
      </div>
      <span className="text-2xl">✏️</span>
    </button>
  );
}
