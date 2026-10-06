'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GermanWord } from '@/types';
import { buildSession, markKnown, QUEUED_BOX, review, type Grade } from '@/lib/german/srs';
import { addNewIntroduced, getNewPerDay, getProgress, newIntroducedToday, updateProgress } from '@/lib/german/progress';
import { shuffle } from '@/lib/utils';
import { markPracticed } from '@/components/NotificationSetup';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';
import { GrammarLine, Headword, headword, SpeakButton } from './WordView';

export default function ReviewSession({ deck }: { deck: GermanWord[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <Session profile={profile} deck={deck} />;
}

/** Mixes new words in among the reviews instead of saving them all for the end. */
function planQueue(profile: string, deck: GermanWord[]): string[] {
  const { reviews, fresh } = buildSession(getProgress(profile), deck.map((w) => w.id), new Date(), {
    newLimit: getNewPerDay() - newIntroducedToday(profile),
    maxReviews: 100,
  });
  return shuffle([...reviews, ...fresh]);
}

const GRADES: { grade: Grade; label: string; className: string }[] = [
  { grade: 'again', label: 'Raté',      className: 'bg-error-bg text-error border-error/30' },
  { grade: 'hard',  label: 'Difficile', className: 'bg-card text-ink border-border' },
  { grade: 'good',  label: 'Facile',    className: 'bg-success-bg text-success border-success/30' },
];

function Session({ profile, deck }: { profile: string; deck: GermanWord[] }) {
  const router = useRouter();
  const [byId] = useState(() => new Map(deck.map((w) => [w.id, w])));
  const [queue, setQueue] = useState(() => planQueue(profile, deck));
  const [total] = useState(queue.length);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ again: 0, hard: 0, good: 0, known: 0 });

  const word = queue.length > 0 ? byId.get(queue[0]) : undefined;
  const prev = word ? getProgress(profile)[word.id] : undefined;
  const isNew = !prev || prev.box === QUEUED_BOX;
  useEffect(() => {
    if (total > 0 && queue.length === 0) markPracticed();
  }, [queue.length, total]);

  if (total === 0) {
    return (
      <Finished title="Rien à réviser" message="Tout est à jour pour aujourd'hui." onHome={() => router.push('/de')} />
    );
  }

  if (!word) {
    const done = tally.again + tally.hard + tally.good + tally.known;
    return (
      <Finished
        title="Session terminée !"
        message={`${done} réponses · ${tally.good} faciles · ${tally.hard} difficiles · ${tally.again} ratées${tally.known ? ` · ${tally.known} déjà connus` : ''}`}
        onHome={() => router.push('/de')}
      />
    );
  }

  const reveal = () => setRevealed(true);

  const answer = (grade: Grade | 'known') => {
    const now = new Date();
    const next = grade === 'known' ? markKnown(prev, word.id, now) : review(prev, word.id, grade, now);
    updateProgress(profile, [next]);
    if (isNew) addNewIntroduced(profile, 1);

    setTally((t) => ({ ...t, [grade]: t[grade] + 1 }));
    setRevealed(false);
    // A missed word comes back at the end of the session
    setQueue(([, ...rest]) => (grade === 'again' ? [...rest, word.id] : rest));
  };

  const done = total - queue.length;

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10">
      <GermanHeader kicker="Session" title={isNew ? 'Nouveau mot' : 'Révision'}
        right={<p className="text-sm text-muted font-medium">{queue.length} restants</p>} />

      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(done / Math.max(total, 1)) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col">
        <div className="w-full rounded-3xl bg-card border-2 border-border shadow-md flex flex-col gap-4 py-8 px-6">
          {/* French first — the German only appears once revealed */}
          <div>
            <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-1">Comment dit-on…</p>
            <p className="text-3xl font-bold text-ink leading-snug">{word.fr}</p>
            <p className="text-sm text-muted italic mt-3">{word.example_fr}</p>
          </div>

          {revealed ? (
            <div className="flex flex-col gap-4 border-t border-border pt-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <Headword word={word} size="text-2xl" />
                <SpeakButton text={headword(word)} />
              </div>
              <GrammarLine word={word} />
              <div className="px-4 py-3 rounded-xl bg-cream border border-border flex items-start gap-3">
                <p className="flex-1 text-sm text-ink italic">{word.example_de}</p>
                <SpeakButton text={word.example_de} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">Dis-le en allemand, avec l&apos;article si c&apos;est un nom.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3">
        {revealed ? (
          <div className="flex gap-2">
            {GRADES.map(({ grade, label, className }) => (
              <button key={grade} type="button" onClick={() => answer(grade)}
                className={`flex-1 py-4 rounded-xl border font-semibold active:scale-[0.98] transition-all ${className}`}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" onClick={reveal}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base shadow-md hover:bg-accent-dark active:scale-[0.98] transition-all">
            Voir la réponse
          </button>
        )}
        {isNew && (
          <button type="button" onClick={() => answer('known')}
            className="text-center text-xs text-muted hover:text-ink transition-colors py-1">
            Je connais déjà ce mot →
          </button>
        )}
      </div>
    </main>
  );
}

function Finished({ title, message, onHome }: { title: string; message: string; onHome: () => void }) {
  return (
    <main className="flex flex-col min-h-dvh px-6 pb-10 pt-16 max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-7xl">🎉</span>
        <h1 className="text-3xl font-bold text-accent">{title}</h1>
        <p className="text-muted">{message}</p>
      </div>
      <button type="button" onClick={onHome}
        className="w-full py-4 rounded-xl bg-accent text-white font-semibold text-lg shadow-sm active:scale-[0.98] hover:bg-accent-dark transition-all">
        Retour
      </button>
    </main>
  );
}
