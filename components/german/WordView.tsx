'use client';

import { useState } from 'react';
import type { GermanWord, WordProgress } from '@/types';
import { KNOWN_BOX, QUEUED_BOX } from '@/lib/german/srs';
import { speak } from '@/lib/speech';

const ARTICLE_COLOR = { der: 'text-blue-600', die: 'text-red-600', das: 'text-green-600' } as const;

const POS_LABEL: Record<GermanWord['pos'], string> = {
  noun: 'nom', verb: 'verbe', adj: 'adjectif', adv: 'adverbe', other: 'expression',
};

/** "die Entscheidung" — what gets spoken and shown as the headword. */
export function headword(w: GermanWord): string {
  return w.article ? `${w.article} ${w.lemma}` : w.lemma;
}

export function SpeakButton({ text, lang, className = '' }: { text: string; lang?: string; className?: string }) {
  return (
    <button type="button" aria-label="Écouter"
      onClick={(e) => { e.stopPropagation(); speak(text, lang); }}
      className={`shrink-0 w-9 h-9 rounded-full border border-border bg-cream text-base hover:border-accent active:scale-95 transition-all ${className}`}>
      🔊
    </button>
  );
}

export function Headword({ word, size = 'text-3xl' }: { word: GermanWord; size?: string }) {
  const [open, setOpen] = useState(false);
  const text = (
    <>
      {word.article && <span className={ARTICLE_COLOR[word.article]}>{word.article} </span>}
      {word.lemma}
    </>
  );
  if (!word.compound) return <p className={`${size} font-bold text-ink leading-snug`}>{text}</p>;

  // Compound words: tap to see how they're built, with the literal translation
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <button type="button" aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className={`${size} font-bold text-ink leading-snug text-left underline decoration-dotted decoration-accent/60 underline-offset-4`}>
        {text} <span className="text-xs align-middle no-underline">🧩</span>
      </button>
      {open && <CompoundBreakdown compound={word.compound} />}
    </div>
  );
}

function CompoundBreakdown({ compound }: { compound: NonNullable<GermanWord['compound']> }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-cream border border-border text-sm animate-fade-in">
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        {compound.parts.map((p, i) => (
          <span key={i}>
            {i > 0 && <span className="text-muted mr-1.5">+</span>}
            <strong className="text-ink">{p.de}</strong> <span className="text-muted">({p.fr})</span>
          </span>
        ))}
      </p>
      <p className="text-xs text-muted mt-1">mot à mot : « {compound.literal} »</p>
    </div>
  );
}

/** Grammar line: plural, verb forms, construction. */
export function GrammarLine({ word }: { word: GermanWord }) {
  const parts = [
    POS_LABEL[word.pos],
    word.plural && `pl. ${word.plural}`,
    word.forms,
  ].filter(Boolean);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-muted">{parts.join(' · ')}</p>
      {word.governs && <p className="text-sm font-semibold text-accent">{word.governs}</p>}
    </div>
  );
}

export function Example({ word }: { word: GermanWord }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-cream border border-border text-left w-full flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm text-ink italic">{word.example_de}</p>
        <p className="text-xs text-muted mt-1">{word.example_fr}</p>
      </div>
      <SpeakButton text={word.example_de} />
    </div>
  );
}

/** Small label for a word's learning state, or null if never triaged. */
export function progressBadge(p: WordProgress | undefined): { label: string; className: string } | null {
  if (!p) return null;
  if (p.box === QUEUED_BOX) return { label: 'à apprendre', className: 'text-muted bg-border' };
  if (p.box >= KNOWN_BOX)   return { label: 'connu',       className: 'text-success bg-success-bg' };
  return { label: `en cours · ${p.box}/${KNOWN_BOX}`, className: 'text-accent bg-error-bg' };
}
