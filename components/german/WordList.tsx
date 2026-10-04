'use client';

import { useState } from 'react';
import type { GermanWord, WordProgress } from '@/types';
import { KNOWN_BOX, QUEUED_BOX } from '@/lib/german/srs';
import { useGermanProgress } from '@/lib/german/progress';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';
import ThemeChips from './ThemeChips';
import { GrammarLine, Headword, headword, SpeakButton } from './WordView';

export default function WordList({ deck }: { deck: GermanWord[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <List profile={profile} deck={deck} />;
}

function status(p: WordProgress | undefined): { label: string; className: string } | null {
  if (!p) return null;
  if (p.box === QUEUED_BOX) return { label: 'à apprendre', className: 'text-muted bg-border' };
  if (p.box >= KNOWN_BOX)   return { label: 'connu',       className: 'text-success bg-success-bg' };
  return { label: `en cours · ${p.box}/${KNOWN_BOX}`, className: 'text-accent bg-error-bg' };
}

function List({ profile, deck }: { profile: string; deck: GermanWord[] }) {
  const progress = useGermanProgress(profile);
  const [theme, setTheme] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  if (!progress) return null;

  const q = query.trim().toLowerCase();
  const words = deck.filter((w) =>
    (!theme || w.theme === theme) &&
    (!q || w.lemma.toLowerCase().includes(q) || w.fr.toLowerCase().includes(q)),
  );

  return (
    <main className="max-w-md mx-auto px-6 pb-12">
      <GermanHeader kicker="Vocabulaire" title="Liste des mots"
        right={<p className="text-sm text-muted font-medium">{words.length}</p>} />

      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
        placeholder="Chercher (allemand ou français)"
        className="w-full mb-3 px-4 py-3 rounded-xl border border-border bg-card text-ink text-sm placeholder:text-muted focus:outline-none focus:border-accent" />

      <ThemeChips deck={deck} value={theme} onChange={setTheme} />

      <ul className="flex flex-col gap-2">
        {words.map((w) => {
          const s = status(progress[w.id]);
          return (
            <li key={w.id} className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Headword word={w} size="text-base" />
                  {s && <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.className}`}>{s.label}</span>}
                </div>
                <p className="text-sm text-ink">{w.fr}</p>
                <GrammarLine word={w} />
              </div>
              <SpeakButton text={headword(w)} />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
