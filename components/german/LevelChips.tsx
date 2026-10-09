'use client';

import { GERMAN_LEVELS } from '@/lib/german/themes';
import type { LevelChoice } from '@/lib/german/progress';

/** Level filter: "Tous niveaux", A2, B1, B2. */
export default function LevelChips({ value, onChange, className = 'mb-3' }: {
  value: LevelChoice;
  onChange: (level: LevelChoice) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {[null, ...GERMAN_LEVELS].map((l) => (
        <button key={l ?? 'all'} type="button" onClick={() => onChange(l)}
          className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            value === l ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
          }`}>
          {l ?? 'Tous niveaux'}
        </button>
      ))}
    </div>
  );
}
