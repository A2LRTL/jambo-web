'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EnglishVerb } from '@/types';
import { highlight, plain } from '@/lib/english/preps';
import GermanHeader from '@/components/german/GermanHeader';
import { SpeakButton } from '@/components/german/WordView';

type Level = 'all' | 'B2' | 'C1';

const LEVEL_FILTERS: { id: Level; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'B2',  label: 'B2' },
  { id: 'C1',  label: 'C1' },
];

const DRILLS: { level: EnglishVerb['level']; sample: string }[] = [
  { level: 'B2', sample: 'depend on, succeed in…' },
  { level: 'C1', sample: 'refrain from, account for…' },
];

/** Bold accent preposition inside a bracketed text. */
export function Highlighted({ text }: { text: string }) {
  return <>{highlight(text).map((p, i) => (p.hit ? <strong key={i} className="text-accent not-italic">{p.text}</strong> : p.text))}</>;
}

export default function EnglishVerbList({ verbs }: { verbs: EnglishVerb[] }) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const shown = verbs
    .filter((v) => (level === 'all' || v.level === level) && (!q || plain(v.pattern).toLowerCase().includes(q) || v.fr.toLowerCase().includes(q)))
    .sort((a, b) => a.pattern.localeCompare(b.pattern, 'en'));

  const chip = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
      active ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
    }`;

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <GermanHeader kicker="🇬🇧 English" title="Verbe + préposition" back="/"
        right={<p className="text-sm text-muted font-medium">{shown.length}</p>} />

      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">S&apos;entraîner</p>
      <div className="grid grid-cols-2 gap-3 mb-2">
        {DRILLS.map((d) => (
          <button key={d.level} type="button" onClick={() => router.push(`/en/prepositions/${d.level.toLowerCase()}`)}
            className="py-4 px-4 rounded-2xl bg-accent text-white text-left shadow-md hover:bg-accent-dark active:scale-[0.98] transition-all">
            <p className="font-bold text-lg">{d.level} →</p>
            <p className="text-xs text-white/80 mt-0.5">{d.sample} · {verbs.filter((v) => v.level === d.level).length} verbes</p>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => router.push('/en/prepositions/all')}
        className="w-full mb-4 py-2 text-center text-xs font-semibold text-muted hover:text-ink transition-colors">
        Mélanger B2 + C1 →
      </button>

      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Chercher (anglais ou français)"
        className="w-full mb-3 px-4 py-3 rounded-xl border border-border bg-card text-ink text-sm placeholder:text-muted focus:outline-none focus:border-accent" />

      <div className="flex gap-2 pb-3 mb-3">
        {LEVEL_FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setLevel(f.id)} className={chip(level === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {shown.map((v) => (
          <li key={v.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold text-ink"><Highlighted text={v.pattern} /></p>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-muted bg-border">{v.level}</span>
              </div>
              <p className="text-sm text-ink">{v.fr}</p>
              <p className="text-sm text-muted italic"><Highlighted text={v.example_en} /></p>
              {v.trap && <p className="text-xs text-error">✗ pas « {plain(v.pattern).replace(v.prep, v.trap)} »</p>}
            </div>
            <SpeakButton text={plain(v.example_en)} lang="en-GB" />
          </li>
        ))}
      </ul>
    </main>
  );
}
