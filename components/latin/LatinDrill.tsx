'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LatinExpression } from '@/types';
import { buildQuestion, type LatinQuestion } from '@/lib/latin/quiz';
import { shuffle } from '@/lib/utils';
import { speak } from '@/lib/speech';
import { markPracticed } from '@/components/NotificationSetup';
import OptionButton from '@/components/OptionButton';
import PrimaryButton from '@/components/PrimaryButton';
import RoundCards from '@/components/RoundCards';
import GermanHeader from '@/components/german/GermanHeader';
import { SpeakButton } from '@/components/german/WordView';
import { LatinDetails } from './LatinList';

const ROUND = 10;
// Latin is read aloud the way French speakers pronounce it
const LANG = 'fr-FR';
const MISSED_KEY = 'ubuntu_la_missed';

function readMissed(): string[] {
  try { return JSON.parse(localStorage.getItem(MISSED_KEY) ?? '[]'); } catch { return []; }
}

function writeMissed(ids: string[]) {
  try { localStorage.setItem(MISSED_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

/** Up to half the round comes from previously missed expressions; directions alternate. */
function pickRound(pool: LatinExpression[]): LatinQuestion[] {
  const missed = new Set(readMissed());
  const retry = shuffle(pool.filter((e) => missed.has(e.id))).slice(0, ROUND / 2);
  const rest = shuffle(pool.filter((e) => !retry.includes(e))).slice(0, ROUND - retry.length);
  return shuffle([...retry, ...rest]).map((e, i) => buildQuestion(e, pool, i % 2 === 0 ? 'meaning' : 'latin'));
}

export default function LatinDrill({ expressions }: { expressions: LatinExpression[] }) {
  const router = useRouter();
  const [byId] = useState(() => new Map(expressions.map((e) => [e.id, e])));
  const [round, setRound] = useState(() => pickRound(expressions));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [learning, setLearning] = useState(true); // flashcards of the round's expressions come first

  if (learning) {
    return (
      <RoundCards verbs={round.map((q) => byId.get(q.id)!)} title="Expressions latines"
        lang={LANG} revealHint="Appuie pour voir l'expression latine."
        back={(e) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-2xl font-bold text-accent italic">{e.latin}</p>
              <SpeakButton text={e.latin} lang={LANG} />
            </div>
            <LatinDetails expr={e} />
          </>
        )}
        spoken={(e) => e.latin}
        onDone={() => setLearning(false)} onBack={() => router.push('/la')} />
    );
  }

  if (index >= round.length) {
    const score = round.length - mistakes.length;
    const restart = () => { setRound(pickRound(expressions)); setIndex(0); setSelected(null); setMistakes([]); setLearning(true); };
    return (
      <main className="flex flex-col min-h-dvh px-6 pb-10 pt-12 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <span className="text-6xl">{mistakes.length === 0 ? '🎉' : score >= ROUND * 0.6 ? '👏' : '💪'}</span>
          <p className="text-5xl font-bold text-ink">{score} <span className="text-muted text-3xl">/ {round.length}</span></p>
        </div>
        {mistakes.length > 0 && (
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">À revoir · elles reviendront au prochain tour</p>
            <ul className="flex flex-col gap-2">
              {mistakes.map((id) => {
                const e = byId.get(id)!;
                return (
                  <li key={id} className="p-3 rounded-xl border border-border bg-card">
                    <p className="font-bold text-accent italic">{e.latin}</p>
                    <p className="text-sm text-muted">{e.fr}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-8">
          <PrimaryButton label="Encore un tour" onClick={restart} />
          <PrimaryButton label="Retour à la liste" variant="secondary" onClick={() => router.push('/la')} />
        </div>
      </main>
    );
  }

  const q = round[index];
  const expr = byId.get(q.id)!;
  const answered = selected !== null;
  const correct = selected === q.answer;

  const choose = (option: string) => {
    if (answered) return;
    setSelected(option);
    speak(expr.latin, LANG);
    const missed = new Set(readMissed());
    if (option === q.answer) missed.delete(expr.id);
    else { missed.add(expr.id); setMistakes((m) => [...m, expr.id]); }
    writeMissed([...missed]);
  };

  const next = () => {
    if (index === round.length - 1) markPracticed();
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const optionState = (option: string) => {
    if (!answered) return 'idle' as const;
    if (option === q.answer) return 'correct' as const;
    return option === selected ? 'wrong' as const : 'dimmed' as const;
  };

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10">
      <GermanHeader kicker="Expressions latines" title={`${index + 1} / ${round.length}`} back="/la" />

      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(index / round.length) * 100}%` }} />
      </div>

      <div className="flex flex-col items-center text-center gap-2 py-6">
        <p className="text-muted text-sm">{q.direction === 'meaning' ? 'Que veut dire…' : 'Comment dit-on en latin…'}</p>
        <p className={`font-bold text-ink ${q.direction === 'meaning' ? 'text-3xl italic' : 'text-2xl'}`}>{q.prompt}</p>
      </div>

      <div className={`grid gap-3 ${q.direction === 'meaning' ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {q.options.map((option) => (
          <OptionButton key={option} label={option} state={optionState(option)} onClick={() => choose(option)} />
        ))}
      </div>

      {answered && (
        <div className="mt-6 flex flex-col gap-2 animate-fade-in">
          <p className={`text-center font-semibold ${correct ? 'text-success' : 'text-error'}`}>
            {correct ? 'Bene !' : `Réponse : ${expr.latin} — ${expr.fr}`}
          </p>
          <div className="px-4 py-3 rounded-xl bg-card border border-border flex items-start gap-3">
            <div className="flex-1 flex flex-col gap-1"><LatinDetails expr={expr} /></div>
            <SpeakButton text={expr.latin} lang={LANG} />
          </div>
        </div>
      )}

      <div className="mt-auto pt-6">
        <PrimaryButton label={index === round.length - 1 ? 'Terminer' : 'Suivant'} onClick={next}
          variant={answered ? 'primary' : 'secondary'} disabled={!answered} />
      </div>
    </main>
  );
}
