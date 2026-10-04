'use client';

import type { GermanWord } from '@/types';
import { GERMAN_THEMES, GERMAN_THEME_LABELS } from '@/lib/german/themes';

/** Horizontal theme filter; themes without words are hidden. */
export default function ThemeChips({ deck, value, onChange, count }: {
  deck: GermanWord[];
  value: string | null;
  onChange: (theme: string | null) => void;
  count?: (theme: string) => number;
}) {
  const themes = GERMAN_THEMES.filter((t) => deck.some((w) => w.theme === t));
  const chip = (active: boolean) =>
    `shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
      active ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
    }`;

  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-3 -mx-6 px-6">
      <button type="button" onClick={() => onChange(null)} className={chip(value === null)}>Tous</button>
      {themes.map((t) => (
        <button key={t} type="button" onClick={() => onChange(t)} className={chip(value === t)}>
          {GERMAN_THEME_LABELS[t]}{count ? ` · ${count(t)}` : ''}
        </button>
      ))}
    </div>
  );
}
