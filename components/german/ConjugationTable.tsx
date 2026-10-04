'use client';

import { PERSONS, TENSE_LABELS, type Table, type Tense } from '@/lib/german/conjugation';

/** Compact table: one block per tense, person → form. */
export default function ConjugationTable({ table, tenses }: { table: Table; tenses: Tense[] }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {tenses.map((tense) => (
        <div key={tense}>
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">{TENSE_LABELS[tense]}</p>
          <div className="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-0.5 text-sm">
            {PERSONS.map((person, i) => (
              <div key={person} className="contents">
                <span className="text-muted">{person}</span>
                <span className="text-ink font-medium">{table[tense][i]}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
