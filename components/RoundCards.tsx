'use client';

import { useState } from 'react';
import PrimaryButton from '@/components/PrimaryButton';

/**
 * Flashcards shown before a drill round: French first (the `front`),
 * tap to reveal the foreign side (`back`). Ends with "Commencer le test".
 * Shared by the German and English drills.
 */
export default function RoundCards<T extends { fr: string }>({
  verbs, title, front, back, revealHint = 'Appuie pour voir l\'allemand.', onDone, onBack,
}: {
  verbs: T[];
  title: string;
  front?: (verb: T) => React.ReactNode;
  back: (verb: T) => React.ReactNode;
  revealHint?: string;
  onDone: () => void;
  onBack: () => void;
}) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const verb = verbs[i];
  const isLast = i === verbs.length - 1;

  const reveal = () => setRevealed(true);
  const go = (next: number) => { setI(next); setRevealed(false); };

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10">
      <div className="flex items-center gap-3 pt-6 pb-4">
        <button type="button" onClick={onBack} aria-label="Retour"
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none">
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider">À retenir avant le test</p>
          <h1 className="text-xl font-bold text-ink">{title}</h1>
        </div>
        <p className="text-sm text-muted font-medium">{i + 1} / {verbs.length}</p>
      </div>

      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${((i + 1) / verbs.length) * 100}%` }} />
      </div>

      <div className="flex-1 flex items-center">
        <button type="button" onClick={reveal}
          className="w-full rounded-3xl bg-card border-2 border-border shadow-md flex flex-col gap-4 py-10 px-6 text-left">
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Comment dit-on…</p>
            <p className="text-3xl font-bold text-ink leading-snug">{verb.fr}</p>
            {front?.(verb)}
          </div>
          {revealed ? (
            <div className="flex flex-col gap-3 border-t border-border pt-4 animate-fade-in">{back(verb)}</div>
          ) : (
            <p className="text-xs text-muted">{revealHint}</p>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-3 mt-8">
        {isLast && revealed ? (
          <PrimaryButton label="Commencer le test →" onClick={onDone} />
        ) : (
          <div className="flex gap-3">
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0}
              className="flex-1 py-4 rounded-xl border border-border bg-card font-semibold text-ink disabled:opacity-30 hover:border-accent transition-all active:scale-[0.98]">
              ← Précédent
            </button>
            <button type="button" onClick={() => (revealed ? go(i + 1) : reveal())}
              className="flex-1 py-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark transition-all active:scale-[0.98]">
              {revealed ? 'Suivant →' : 'Voir'}
            </button>
          </div>
        )}
        <button type="button" onClick={onDone} className="text-center text-xs text-muted hover:text-ink transition-colors">
          Passer les cartes → test direct
        </button>
      </div>
    </main>
  );
}
