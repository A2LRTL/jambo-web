'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deckStats } from '@/lib/german/srs';
import {
  getNewPerDay, newIntroducedToday, NEW_PER_DAY_CHOICES, pullProgress, pushDirty, setNewPerDay, useGermanProgress,
} from '@/lib/german/progress';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';

export default function GermanHome({ deckIds }: { deckIds: string[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <Dashboard profile={profile} deckIds={deckIds} />;
}

function Dashboard({ profile, deckIds }: { profile: string; deckIds: string[] }) {
  const router = useRouter();
  const progress = useGermanProgress(profile);
  const [newPerDay, setNewPerDayState] = useState(getNewPerDay);

  useEffect(() => {
    void pullProgress(profile);
    const onOnline = () => void pushDirty(profile);
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [profile]);

  if (!progress) return null;

  const stats = deckStats(progress, deckIds, new Date());
  const newLeft = Math.min(stats.queued + stats.untriaged, Math.max(0, newPerDay - newIntroducedToday(profile)));
  const sessionSize = stats.due + newLeft;

  const chooseNewPerDay = (n: number) => { setNewPerDay(n); setNewPerDayState(n); };

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <GermanHeader kicker="🇩🇪 Deutsch" title="Vocabulaire A2 → B2" back="/" />

      {/* Today */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm mb-6">
        <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-3">Aujourd&apos;hui</p>
        <div className="flex gap-6 mb-4">
          <div>
            <p className="text-3xl font-bold text-ink">{stats.due}</p>
            <p className="text-xs text-muted">à réviser</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-ink">{newLeft}</p>
            <p className="text-xs text-muted">nouveaux</p>
          </div>
        </div>
        {sessionSize > 0 ? (
          <button type="button" onClick={() => router.push('/de/session')}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base shadow-md hover:bg-accent-dark active:scale-[0.98] transition-all">
            Commencer la session ({sessionSize}) →
          </button>
        ) : (
          <p className="text-sm text-success font-semibold text-center py-2">
            ✓ Tout est à jour, reviens demain !
          </p>
        )}
      </div>

      {/* Deck */}
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Ton vocabulaire · {deckIds.length} mots</p>
      <div className="grid grid-cols-4 gap-2 mb-6 text-center">
        {[
          { n: stats.known,     label: 'connus' },
          { n: stats.learning,  label: 'en cours' },
          { n: stats.queued,    label: 'à apprendre' },
          { n: stats.untriaged, label: 'non triés' },
        ].map(({ n, label }) => (
          <div key={label} className="py-3 rounded-xl border border-border bg-card">
            <p className="text-lg font-bold text-ink">{n}</p>
            <p className="text-[11px] text-muted leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <button type="button" onClick={() => router.push('/de/recent')}
          className="w-full py-4 px-5 rounded-xl border border-border bg-card text-left hover:border-accent transition-all active:scale-[0.98] shadow-sm">
          <p className="text-sm font-bold text-ink">Révision</p>
          <p className="text-xs text-muted mt-0.5">Les mots de tes dernières sessions, avec un mode « cacher l&apos;allemand »</p>
        </button>
        <button type="button" onClick={() => router.push('/de/triage')} disabled={stats.untriaged === 0}
          className="w-full py-4 px-5 rounded-xl border border-border bg-card text-left hover:border-accent transition-all active:scale-[0.98] shadow-sm disabled:opacity-40">
          <p className="text-sm font-bold text-ink">Trier des mots</p>
          <p className="text-xs text-muted mt-0.5">« Je connais » ou « À apprendre », par lots de 20</p>
        </button>
        <button type="button" onClick={() => router.push('/de/verbs')}
          className="w-full py-4 px-5 rounded-xl border border-border bg-card text-left hover:border-accent transition-all active:scale-[0.98] shadow-sm">
          <p className="text-sm font-bold text-ink">Verbes</p>
          <p className="text-xs text-muted mt-0.5">Réfléchis, séparables, irréguliers · entraînement verbe + préposition</p>
        </button>
        <button type="button" onClick={() => router.push('/de/words')}
          className="w-full py-4 px-5 rounded-xl border border-border bg-card text-left hover:border-accent transition-all active:scale-[0.98] shadow-sm">
          <p className="text-sm font-bold text-ink">Liste des mots</p>
          <p className="text-xs text-muted mt-0.5">Par thème, avec l&apos;audio et ton niveau</p>
        </button>
      </div>

      {/* Settings */}
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Nouveaux mots par jour</p>
      <div className="flex gap-2">
        {NEW_PER_DAY_CHOICES.map((n) => (
          <button key={n} type="button" onClick={() => chooseNewPerDay(n)}
            className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
              newPerDay === n ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
            }`}>
            {n}
          </button>
        ))}
      </div>
    </main>
  );
}
