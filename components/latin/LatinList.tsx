'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LatinExpression } from '@/types';
import GermanHeader from '@/components/german/GermanHeader';
import { SpeakButton } from '@/components/german/WordView';

type Level = 'all' | LatinExpression['level'];

const LEVEL_FILTERS: { id: Level; label: string }[] = [
  { id: 'all',     label: 'Toutes' },
  { id: 'courant', label: 'Courantes' },
  { id: 'soutenu', label: 'Soutenues' },
];

const DRILLS: { level: LatinExpression['level']; label: string; sample: string }[] = [
  { level: 'courant', label: 'Courantes', sample: 'sine qua non, a priori…' },
  { level: 'soutenu', label: 'Soutenues', sample: 'mutatis mutandis, sui generis…' },
];

/** Literal translation, meaning, example and pitfall — shared by the list and the flashcards. */
export function LatinDetails({ expr }: { expr: LatinExpression }) {
  return (
    <>
      <p className="text-xs text-muted">mot à mot : « {expr.literal} »</p>
      <p className="text-sm text-ink">{expr.fr}</p>
      <p className="text-sm text-muted italic">{expr.example}</p>
      {expr.note && <p className="text-xs text-error">⚠ {expr.note}</p>}
    </>
  );
}

export default function LatinList({ expressions }: { expressions: LatinExpression[] }) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const shown = expressions
    .filter((e) => (level === 'all' || e.level === level) && (!q || e.latin.toLowerCase().includes(q) || e.fr.toLowerCase().includes(q)))
    .sort((a, b) => a.latin.localeCompare(b.latin, 'fr'));

  const chip = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
      active ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
    }`;

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <GermanHeader kicker="🏛️ Latin" title="Expressions latines" back="/"
        right={<p className="text-sm text-muted font-medium">{shown.length}</p>} />

      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">S&apos;entraîner</p>
      <div className="grid grid-cols-2 gap-3 mb-2">
        {DRILLS.map((d) => (
          <button key={d.level} type="button" onClick={() => router.push(`/la/quiz/${d.level}`)}
            className="py-4 px-4 rounded-2xl bg-accent text-white text-left shadow-md hover:bg-accent-dark active:scale-[0.98] transition-all">
            <p className="font-bold text-lg">{d.label} →</p>
            <p className="text-xs text-white/80 mt-0.5">{d.sample} · {expressions.filter((e) => e.level === d.level).length}</p>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => router.push('/la/quiz/all')}
        className="w-full mb-4 py-2 text-center text-xs font-semibold text-muted hover:text-ink transition-colors">
        Tout mélanger →
      </button>

      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Chercher (latin ou français)"
        className="w-full mb-3 px-4 py-3 rounded-xl border border-border bg-card text-ink text-sm placeholder:text-muted focus:outline-none focus:border-accent" />

      <div className="flex gap-2 pb-3 mb-3">
        {LEVEL_FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setLevel(f.id)} className={chip(level === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {shown.map((e) => (
          <li key={e.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <p className="text-base font-bold text-accent italic">{e.latin}</p>
              <LatinDetails expr={e} />
            </div>
            <SpeakButton text={e.latin} lang="fr-FR" />
          </li>
        ))}
      </ul>
    </main>
  );
}
