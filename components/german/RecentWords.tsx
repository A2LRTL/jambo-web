'use client';

import { useState } from 'react';
import type { GermanWord } from '@/types';
import { useSessionHistory, type SessionGrade, type SessionLog } from '@/lib/german/history';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';
import { GrammarLine, Headword, headword, SpeakButton } from './WordView';

const GRADE_BADGE: Record<SessionGrade, { label: string; className: string }> = {
  again: { label: 'raté',      className: 'text-error bg-error-bg' },
  hard:  { label: 'difficile', className: 'text-ink bg-border' },
  good:  { label: 'facile',    className: 'text-success bg-success-bg' },
  known: { label: 'déjà connu', className: 'text-muted bg-border' },
};

const chip = (active: boolean) =>
  `flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
    active ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
  }`;

function sessionLabel(id: string): string {
  const d = new Date(id);
  const day = (x: Date) => x.toLocaleDateString('sv');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (day(d) === day(new Date())) return `Aujourd'hui · ${time}`;
  if (day(d) === day(yesterday)) return `Hier · ${time}`;
  return `${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${time}`;
}

export default function RecentWords({ deck }: { deck: GermanWord[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <Recent profile={profile} deck={deck} />;
}

function Recent({ profile, deck }: { profile: string; deck: GermanWord[] }) {
  const history = useSessionHistory(profile);
  const [byId] = useState(() => new Map(deck.map((w) => [w.id, w])));
  const [count, setCount] = useState(1);
  const [hardOnly, setHardOnly] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [shown, setShown] = useState<Set<string>>(new Set());

  if (!history) return null;

  const sessions = history.filter((s) => s.words.length > 0).slice(0, count);
  const isHard = (w: SessionLog['words'][number]) => w.missed || w.grade === 'hard';
  const total = sessions.reduce((n, s) => n + s.words.filter((w) => !hardOnly || isHard(w)).length, 0);
  const choices = [1, 2, 3].filter((n) => n === 1 || n <= history.length);

  const toggleQuiz = () => { setQuiz((q) => !q); setShown(new Set()); };
  const reveal = (key: string) => setShown((s) => new Set(s).add(key));

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <GermanHeader kicker="Révision" title="Dernières sessions"
        right={<p className="text-sm text-muted font-medium">{total}</p>} />

      {history.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">
          Aucune session pour l&apos;instant. Les mots de tes prochaines sessions apparaîtront ici.
        </p>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            {choices.map((n) => (
              <button key={n} type="button" onClick={() => setCount(n)} className={chip(count === n)}>
                {n === 1 ? 'Dernière' : `${n} dernières`}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-5">
            <button type="button" onClick={() => setHardOnly((h) => !h)} className={chip(hardOnly)}>
              Ratés & difficiles
            </button>
            <button type="button" onClick={toggleQuiz} className={chip(quiz)}>
              Cacher l&apos;allemand
            </button>
          </div>

          {sessions.map((s) => {
            const words = s.words.filter((w) => !hardOnly || isHard(w));
            return (
              <section key={s.id} className="mb-6">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                  {sessionLabel(s.id)} · {words.length} mot{words.length > 1 ? 's' : ''}
                </p>
                {words.length === 0 && <p className="text-sm text-muted">Rien de difficile dans cette session ✓</p>}
                <ul className="flex flex-col gap-2">
                  {words.map((entry) => {
                    const w = byId.get(entry.id);
                    if (!w) return null;
                    const key = `${s.id}:${w.id}`;
                    const hidden = quiz && !shown.has(key);
                    const badge = GRADE_BADGE[entry.missed ? 'again' : entry.grade];
                    return (
                      <li key={key} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-ink">{w.fr}</p>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                          </div>
                          {hidden ? (
                            <button type="button" onClick={() => reveal(key)}
                              className="self-start mt-1 px-3 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted hover:text-ink hover:border-accent transition-all">
                              Voir l&apos;allemand
                            </button>
                          ) : (
                            <>
                              <Headword word={w} size="text-base" />
                              <GrammarLine word={w} />
                              <p className="text-sm text-muted italic">{w.example_de}</p>
                            </>
                          )}
                        </div>
                        {!hidden && <SpeakButton text={headword(w)} />}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
