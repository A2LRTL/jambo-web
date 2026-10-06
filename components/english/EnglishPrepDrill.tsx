'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EnglishVerb } from '@/types';
import { accepted, buildQuestion, plain, type EnglishPrepQuestion } from '@/lib/english/preps';
import { shuffle } from '@/lib/utils';
import { markPracticed } from '@/components/NotificationSetup';
import { readMissed, recordAnswer } from '@/lib/missed';
import { saveScore } from '@/lib/scores';
import { useProfile } from '@/lib/profile';
import OptionButton from '@/components/OptionButton';
import PrimaryButton from '@/components/PrimaryButton';
import RoundCards from '@/components/RoundCards';
import GermanHeader from '@/components/german/GermanHeader';
import { SpeakButton } from '@/components/german/WordView';
import { Highlighted } from './EnglishVerbList';

const ROUND = 10;
const LANG = 'en-GB';
const DRILL = 'en-prep';

/**
 * Up to half the round comes from the profile's previously missed verbs, the rest at random.
 * Every other question gaps the example sentence instead of the bare pattern.
 */
function pickRound(verbs: EnglishVerb[], profile: string): EnglishPrepQuestion[] {
  const missed = readMissed(DRILL, profile);
  const retry = shuffle(verbs.filter((v) => missed.has(v.id))).slice(0, ROUND / 2);
  const rest = shuffle(verbs.filter((v) => !retry.includes(v))).slice(0, ROUND - retry.length);
  return shuffle([...retry, ...rest]).map((v, i) => buildQuestion(v, i % 2 === 1));
}

/** `lessonId` is set for single-level rounds, whose scores are saved for the leaderboard. */
export default function EnglishPrepDrill({ verbs, lessonId }: { verbs: EnglishVerb[]; lessonId: string | null }) {
  const profile = useProfile();
  if (!profile) return null;
  return <Drill key={profile} verbs={verbs} lessonId={lessonId} profile={profile} />;
}

function Drill({ verbs, lessonId, profile }: { verbs: EnglishVerb[]; lessonId: string | null; profile: string }) {
  const router = useRouter();
  const [byId] = useState(() => new Map(verbs.map((v) => [v.id, v])));
  const [round, setRound] = useState(() => pickRound(verbs, profile));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [learning, setLearning] = useState(true); // flashcards of the round's verbs come first

  if (learning) {
    return (
      <RoundCards verbs={round.map((q) => byId.get(q.verbId)!)} title="Verb + preposition"
        revealHint="Appuie pour voir l'anglais."
        front={(v) => <p className="text-sm text-muted italic mt-3">{v.example_fr}</p>}
        back={(v) => <CardBack verb={v} />}
        onDone={() => setLearning(false)} onBack={() => router.push('/en')} />
    );
  }

  if (index >= round.length) {
    const score = round.length - mistakes.length;
    const restart = () => { setRound(pickRound(verbs, profile)); setIndex(0); setSelected(null); setMistakes([]); setLearning(true); };
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
                    <p className="font-bold text-ink"><Highlighted text={v.pattern} /></p>
                    <p className="text-sm text-muted">{v.fr}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-8">
          <PrimaryButton label="Encore un tour" onClick={restart} />
          <PrimaryButton label="Retour à la liste" variant="secondary" onClick={() => router.push('/en')} />
        </div>
      </main>
    );
  }

  const q = round[index];
  const verb = byId.get(q.verbId)!;
  const right = new Set(accepted(verb));
  const answered = selected !== null;
  const correct = answered && right.has(selected);

  const choose = (option: string) => {
    if (answered) return;
    setSelected(option);
    recordAnswer(DRILL, profile, verb.id, right.has(option));
    if (!right.has(option)) setMistakes((m) => [...m, verb.id]);
  };

  const next = () => {
    if (index === round.length - 1) {
      markPracticed();
      // Guests practise without recording scores
      if (lessonId && profile !== 'guest') void saveScore(profile, lessonId, round.length - mistakes.length, round.length);
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const optionState = (option: string) => {
    if (!answered) return 'idle' as const;
    if (right.has(option)) return 'correct' as const;
    return option === selected ? 'wrong' as const : 'dimmed' as const;
  };

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10">
      <GermanHeader kicker="Verb + preposition" title={`${index + 1} / ${round.length}`} back="/en" />

      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(index / round.length) * 100}%` }} />
      </div>

      {/* French meaning (or the sentence's translation), then the English with its gap */}
      <div className="flex flex-col items-center text-center gap-2 py-6">
        <p className="text-muted text-base">{q.sentence ? verb.example_fr : verb.fr}</p>
        <p className={`font-bold text-ink ${q.sentence ? 'text-2xl leading-snug' : 'text-3xl'}`}>{q.prompt}</p>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-muted bg-border">{verb.level}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((option) => (
          <OptionButton key={option} label={option} state={optionState(option)} onClick={() => choose(option)} />
        ))}
      </div>

      {answered && (
        <div className="mt-6 flex flex-col gap-2 animate-fade-in">
          <p className={`text-center font-semibold ${correct ? 'text-success' : 'text-error'}`}>
            {correct ? 'Right!' : `Réponse : ${plain(verb.pattern)}`}
          </p>
          <div className="px-4 py-3 rounded-xl bg-card border border-border flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-ink italic"><Highlighted text={verb.example_en} /></p>
              <p className="text-xs text-muted mt-1">{verb.example_fr}</p>
            </div>
            <SpeakButton text={plain(verb.example_en)} lang={LANG} />
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

/** Back of a flashcard: pattern + highlighted example + the French-calque warning. */
function CardBack({ verb }: { verb: EnglishVerb }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xl font-bold text-ink"><Highlighted text={verb.pattern} /></p>
        <SpeakButton text={`${plain(verb.pattern)}. ${plain(verb.example_en)}`} lang={LANG} />
      </div>
      {verb.trap && <p className="text-sm text-error">✗ pas « {plain(verb.pattern).replace(verb.prep, verb.trap)} »</p>}
      <p className="px-4 py-3 rounded-xl bg-cream border border-border text-sm text-ink italic">
        <Highlighted text={verb.example_en} />
      </p>
    </>
  );
}
