'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GermanWord } from '@/types';
import { useGermanProgress } from '@/lib/german/progress';
import { verbKind, type VerbKind } from '@/lib/german/verbs';
import { conjugate, TENSES } from '@/lib/german/conjugation';
import ConjugationTable from './ConjugationTable';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';
import { GrammarLine, Headword, headword, progressBadge, SpeakButton } from './WordView';

type Filter = 'all' | 'prep' | 'reflexive' | 'separable' | 'irregular';

const FILTERS: { id: Filter; label: string; test: (k: VerbKind) => boolean }[] = [
  { id: 'all',       label: 'Tous',           test: () => true },
  { id: 'prep',      label: 'À préposition',  test: (k) => k.prep !== null },
  { id: 'reflexive', label: 'Réfléchis',      test: (k) => k.reflexive },
  { id: 'separable', label: 'Séparables',     test: (k) => k.separable },
  { id: 'irregular', label: 'Irréguliers',    test: (k) => k.irregular },
];

const KIND_TAGS: { key: keyof Omit<VerbKind, 'prep'>; label: string }[] = [
  { key: 'reflexive', label: 'réfl.' },
  { key: 'separable', label: 'sép.' },
  { key: 'irregular', label: 'irrég.' },
];

export default function VerbList({ verbs }: { verbs: GermanWord[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <List profile={profile} verbs={verbs} />;
}

function List({ profile, verbs }: { profile: string; verbs: GermanWord[] }) {
  const router = useRouter();
  const progress = useGermanProgress(profile);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [kinds] = useState(() => new Map(verbs.map((v) => [v.id, verbKind(v)])));

  if (!progress) return null;

  const test = FILTERS.find((f) => f.id === filter)!.test;
  const q = query.trim().toLowerCase();
  const shown = verbs
    .filter((v) => test(kinds.get(v.id)!) && (!q || v.lemma.toLowerCase().includes(q) || v.fr.toLowerCase().includes(q)))
    .sort((a, b) => a.lemma.replace(/^sich /, '').localeCompare(b.lemma.replace(/^sich /, ''), 'de'));
  const prepCount = verbs.filter((v) => kinds.get(v.id)!.prep).length;

  const chip = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
      active ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
    }`;

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <GermanHeader kicker="Verbes" title="Liste des verbes"
        right={<p className="text-sm text-muted font-medium">{shown.length}</p>} />

      <button type="button" onClick={() => router.push('/de/verbs/prepositions')}
        className="w-full mb-4 py-4 px-5 rounded-2xl bg-accent text-white text-left shadow-md hover:bg-accent-dark active:scale-[0.98] transition-all">
        <p className="font-bold">S&apos;entraîner : verbe + préposition →</p>
        <p className="text-xs text-white/80 mt-0.5">warten auf + Akk, denken an + Akk… · {prepCount} verbes</p>
      </button>
      <button type="button" onClick={() => router.push('/de/verbs/conjugation')}
        className="w-full mb-4 py-4 px-5 rounded-2xl border border-accent bg-card text-left shadow-sm hover:bg-cream active:scale-[0.98] transition-all">
        <p className="font-bold text-accent">S&apos;entraîner : conjugaison →</p>
        <p className="text-xs text-muted mt-0.5">Présent, prétérit, parfait · ich nehme, du nahmst, er hat genommen…</p>
      </button>

      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Chercher (allemand ou français)"
        className="w-full mb-3 px-4 py-3 rounded-xl border border-border bg-card text-ink text-sm placeholder:text-muted focus:outline-none focus:border-accent" />

      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-6 px-6">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={chip(filter === f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {shown.map((v) => {
          const kind = kinds.get(v.id)!;
          const badge = progressBadge(progress[v.id]);
          const table = openId === v.id ? conjugate(v) : null;
          return (
            <li key={v.id} className="p-4 rounded-xl border border-border bg-card flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Headword word={v} size="text-base" />
                  {KIND_TAGS.filter((t) => kind[t.key]).map((t) => (
                    <span key={t.key} className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-muted bg-border">{t.label}</span>
                  ))}
                  {badge && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>}
                </div>
                <p className="text-sm text-ink">{v.fr}</p>
                <GrammarLine word={v} />
                {conjugate(v) && (
                  <button type="button" onClick={() => setOpenId(openId === v.id ? null : v.id)}
                    className="self-start mt-1 text-xs font-semibold text-accent">
                    {openId === v.id ? 'Masquer la conjugaison ▴' : 'Conjuguer ▾'}
                  </button>
                )}
              </div>
              <SpeakButton text={headword(v)} />
              {table && (
                <div className="basis-full pt-3 border-t border-border animate-fade-in">
                  <ConjugationTable table={table} tenses={TENSES} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
