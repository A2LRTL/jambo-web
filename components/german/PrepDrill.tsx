'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GermanWord } from '@/types';
import { buildPrepQuestion, highlightPrep, parsePrep, type PrepQuestion } from '@/lib/german/verbs';
import { shuffle } from '@/lib/utils';
import { speak } from '@/lib/speech';
import { markPracticed } from '@/components/NotificationSetup';
import OptionButton from '@/components/OptionButton';
import PrimaryButton from '@/components/PrimaryButton';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';
import { SpeakButton } from './WordView';

const ROUND = 10;
const MISSED_KEY = 'ubuntu_de_prep_missed';

function readMissed(): string[] {
  try { return JSON.parse(localStorage.getItem(MISSED_KEY) ?? '[]'); } catch { return []; }
}

function writeMissed(ids: string[]) {
  try { localStorage.setItem(MISSED_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

/** Up to half the round comes from previously missed verbs, the rest at random. */
function pickRound(verbs: GermanWord[]): PrepQuestion[] {
  const missed = new Set(readMissed());
  const retry = shuffle(verbs.filter((v) => missed.has(v.id))).slice(0, ROUND / 2);
  const rest = shuffle(verbs.filter((v) => !retry.includes(v))).slice(0, ROUND - retry.length);
  return shuffle([...retry, ...rest]).map((v) => buildPrepQuestion(v)!);
}

export default function PrepDrill({ verbs }: { verbs: GermanWord[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <Drill verbs={verbs} />;
}

function Drill({ verbs }: { verbs: GermanWord[] }) {
  const router = useRouter();
  const [byId] = useState(() => new Map(verbs.map((v) => [v.id, v])));
  const [round, setRound] = useState(() => pickRound(verbs));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<string[]>([]);

  const finished = index >= round.length;

  if (finished) {
    const score = round.length - mistakes.length;
    const restart = () => { setRound(pickRound(verbs)); setIndex(0); setSelected(null); setMistakes([]); };
    return (
      <main className="flex flex-col min-h-dvh px-6 pb-10 pt-12 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <span className="text-6xl">{mistakes.length === 0 ? '🎉' : score >= ROUND * 0.6 ? '👏' : '💪'}</span>
          <p className="text-5xl font-bold text-ink">{score} <span className="text-muted text-3xl">/ {round.length}</span></p>
        </div>
        {mistakes.length > 0 && (
          <div className="flex-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">À revoir · ils reviendront au prochain tour</p>
            <ul className="flex flex-col gap-2">
              {mistakes.map((id) => {
                const v = byId.get(id)!;
                return (
                  <li key={id} className="p-3 rounded-xl border border-border bg-card">
                    <p className="font-bold text-ink">{v.lemma} <span className="text-accent">{v.governs}</span></p>
                    <p className="text-sm text-muted">{v.fr}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-8">
          <PrimaryButton label="Encore un tour" onClick={restart} />
          <PrimaryButton label="Retour aux verbes" variant="secondary" onClick={() => router.push('/de/verbs')} />
        </div>
      </main>
    );
  }

  const q = round[index];
  const verb = byId.get(q.wordId)!;
  const construction = parsePrep(verb.governs)!;
  const accepted = new Set(construction.preps.map((p) => `${p} + ${construction.kase}`));
  const answered = selected !== null;
  const correct = answered && accepted.has(selected);

  const choose = (option: string) => {
    if (answered) return;
    setSelected(option);
    speak(verb.example_de);
    const missed = new Set(readMissed());
    if (accepted.has(option)) missed.delete(verb.id);
    else { missed.add(verb.id); setMistakes((m) => [...m, verb.id]); }
    writeMissed([...missed]);
  };

  const next = () => {
    if (index === round.length - 1) markPracticed();
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const optionState = (option: string) => {
    if (!answered) return 'idle' as const;
    if (accepted.has(option)) return 'correct' as const;
    return option === selected ? 'wrong' as const : 'dimmed' as const;
  };

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10">
      <GermanHeader kicker="Verbe + préposition" title={`${index + 1} / ${round.length}`} back="/de/verbs" />

      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(index / round.length) * 100}%` }} />
      </div>

      {/* French first, then the German verb with its gap */}
      <div className="flex flex-col items-center text-center gap-2 py-6">
        <p className="text-muted text-base">{verb.fr}</p>
        <p className="text-3xl font-bold text-ink">{q.prompt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((option) => (
          <OptionButton key={option} label={option} state={optionState(option)} onClick={() => choose(option)} />
        ))}
      </div>

      {answered && (
        <div className="mt-6 flex flex-col gap-2 animate-fade-in">
          <p className={`text-center font-semibold ${correct ? 'text-success' : 'text-error'}`}>
            {correct ? 'Richtig !' : `Réponse : ${verb.governs}`}
          </p>
          <div className="px-4 py-3 rounded-xl bg-card border border-border flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-ink italic">
                {highlightPrep(verb.example_de, construction.preps).map((part, i) =>
                  part.hit ? <strong key={i} className="text-accent not-italic">{part.text}</strong> : part.text,
                )}
              </p>
              <p className="text-xs text-muted mt-1">{verb.example_fr}</p>
            </div>
            <SpeakButton text={verb.example_de} />
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
