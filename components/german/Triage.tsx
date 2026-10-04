'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GermanWord } from '@/types';
import { markKnown, markToLearn } from '@/lib/german/srs';
import { getProgress, updateProgress, useGermanProgress } from '@/lib/german/progress';
import { GERMAN_THEME_LABELS } from '@/lib/german/themes';
import { speak } from '@/lib/speech';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';
import ThemeChips from './ThemeChips';
import { Example, GrammarLine, Headword, headword, SpeakButton } from './WordView';

const BATCH = 20;

export default function Triage({ deck }: { deck: GermanWord[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <TriageRunner profile={profile} deck={deck} />;
}

function TriageRunner({ profile, deck }: { profile: string; deck: GermanWord[] }) {
  const router = useRouter();
  const progress = useGermanProgress(profile);
  const [theme, setTheme] = useState<string | null>(null);
  const [doneInBatch, setDoneInBatch] = useState(0);

  // The current word is simply the first untriaged one: triaging it moves on
  const untriaged = deck.filter((w) => !progress?.[w.id] && (!theme || w.theme === theme));
  const word = doneInBatch < BATCH ? untriaged[0] : undefined;

  useEffect(() => {
    if (word) speak(headword(word));
  }, [word]);

  if (!progress) return null;

  const choose = (known: boolean) => {
    if (!word) return;
    const now = new Date();
    const prev = getProgress(profile)[word.id];
    updateProgress(profile, [known ? markKnown(prev, word.id, now) : markToLearn(prev, word.id, now)]);
    setDoneInBatch((n) => n + 1);
  };

  const selectTheme = (t: string | null) => { setTheme(t); setDoneInBatch(0); };

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10">
      <GermanHeader kicker="Tri" title={theme ? GERMAN_THEME_LABELS[theme] : 'Tous les thèmes'}
        right={<p className="text-sm text-muted font-medium">{Math.min(doneInBatch, BATCH)} / {BATCH}</p>} />

      <ThemeChips deck={deck} value={theme} onChange={selectTheme} count={(t) => deck.filter((w) => w.theme === t && !progress[w.id]).length} />

      {!word ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <span className="text-6xl">{untriaged.length === 0 ? '✅' : '👍'}</span>
          <p className="text-xl font-bold text-ink">
            {untriaged.length === 0 ? 'Tous les mots de ce thème sont triés' : 'Lot terminé'}
          </p>
          <div className="flex flex-col gap-3 w-full mt-4">
            {untriaged.length > 0 && (
              <button type="button" onClick={() => setDoneInBatch(0)}
                className="w-full py-4 rounded-xl bg-accent text-white font-semibold shadow-sm active:scale-[0.98] hover:bg-accent-dark transition-all">
                Encore {Math.min(BATCH, untriaged.length)} mots
              </button>
            )}
            <button type="button" onClick={() => router.push('/de')}
              className="w-full py-4 rounded-xl border border-border bg-card text-ink font-semibold hover:border-accent transition-all">
              Retour
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col">
            <div key={word.id} className="w-full rounded-3xl bg-card border-2 border-border shadow-md flex flex-col gap-4 py-8 px-6 animate-fade-in">
              <p className="text-2xl font-bold text-ink leading-snug">{word.fr}</p>
              <div className="flex items-start justify-between gap-3">
                <Headword word={word} size="text-2xl" />
                <SpeakButton text={headword(word)} />
              </div>
              <GrammarLine word={word} />
              <Example word={word} />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button type="button" onClick={() => choose(false)}
              className="flex-1 py-4 rounded-xl border border-border bg-card font-semibold text-ink hover:border-accent transition-all active:scale-[0.98]">
              À apprendre
            </button>
            <button type="button" onClick={() => choose(true)}
              className="flex-1 py-4 rounded-xl bg-success text-white font-semibold transition-all active:scale-[0.98]">
              Je connais ✓
            </button>
          </div>
        </>
      )}
    </main>
  );
}
