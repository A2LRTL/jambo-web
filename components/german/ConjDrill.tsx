'use client';

import { useState } from 'react';
import type { GermanWord } from '@/types';
import {
  buildConjQuestion, conjugate, PERSONS, TENSE_LABELS, TENSES, type ConjQuestion, type Tense,
} from '@/lib/german/conjugation';
import { stripPrep, verbKind } from '@/lib/german/verbs';
import { shuffle } from '@/lib/utils';
import { markPracticed } from '@/components/NotificationSetup';
import { readMissed, recordAnswer } from '@/lib/missed';
import OptionButton from '@/components/OptionButton';
import PrimaryButton from '@/components/PrimaryButton';
import { useGermanAccess } from './useGermanAccess';
import GermanHeader from './GermanHeader';
import RoundCards from '@/components/RoundCards';
import ConjugationTable from './ConjugationTable';
import { SpeakButton } from './WordView';

const ROUND = 10;
const DRILL = 'de-conj';

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** One question per verb; up to half the round comes from previously missed verbs. */
function pickRound(verbs: GermanWord[], tenses: Tense[], profile: string): ConjQuestion[] {
  const missed = readMissed(DRILL, profile);
  const retry = shuffle(verbs.filter((v) => missed.has(v.id))).slice(0, ROUND / 2);
  const rest = shuffle(verbs.filter((v) => !retry.includes(v))).slice(0, ROUND - retry.length);
  return shuffle([...retry, ...rest]).flatMap((v) => {
    const q = buildConjQuestion(v, pick(tenses), Math.floor(Math.random() * PERSONS.length));
    return q ? [q] : [];
  });
}

/** The sentence as said aloud: "du nimmst teil" (first form of "er/sie/es" and "sie/Sie"). */
const withPerson = (person: number, form: string) => `${PERSONS[person].split('/')[0]} ${form}`;

export default function ConjDrill({ verbs }: { verbs: GermanWord[] }) {
  const profile = useGermanAccess();
  if (!profile) return null;
  return <Drill key={profile} verbs={verbs} profile={profile} />;
}

type Phase = 'setup' | 'cards' | 'quiz';

function Drill({ verbs, profile }: { verbs: GermanWord[]; profile: string }) {
  const [byId] = useState(() => new Map(verbs.map((v) => [v.id, v])));
  const [tenses, setTenses] = useState<Tense[]>(TENSES);
  const [irregularOnly, setIrregularOnly] = useState(false);
  const [phase, setPhase] = useState<Phase>('setup');
  const [round, setRound] = useState<ConjQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<ConjQuestion[]>([]);

  const pool = irregularOnly ? verbs.filter((v) => verbKind(v).irregular) : verbs;

  const start = () => {
    setRound(pickRound(pool, tenses, profile));
    setIndex(0);
    setSelected(null);
    setMistakes([]);
    setPhase('cards');
  };

  const toggleTense = (t: Tense) =>
    setTenses((cur) => (cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : TENSES.filter((x) => x === t || cur.includes(x))));

  // ── Setup ────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const chip = (active: boolean) =>
      `flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
        active ? 'border-accent text-accent bg-card' : 'border-border text-muted bg-card hover:text-ink'
      }`;
    return (
      <main className="max-w-md mx-auto px-6 pb-12">
        <GermanHeader kicker="Verbes" title="Conjugaison" back="/de/verbs" />
        <p className="text-sm text-muted mb-6">
          10 verbes par tour : tu revois d&apos;abord leur conjugaison, puis tu choisis la bonne forme.
          Les verbes ratés reviennent au tour suivant.
        </p>

        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Temps</p>
        <div className="flex gap-2 mb-6">
          {TENSES.map((t) => (
            <button key={t} type="button" onClick={() => toggleTense(t)} className={chip(tenses.includes(t))}>
              {TENSE_LABELS[t]}
            </button>
          ))}
        </div>

        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Verbes</p>
        <div className="flex gap-2 mb-8">
          <button type="button" onClick={() => setIrregularOnly(false)} className={chip(!irregularOnly)}>
            Tous · {verbs.length}
          </button>
          <button type="button" onClick={() => setIrregularOnly(true)} className={chip(irregularOnly)}>
            Irréguliers · {verbs.filter((v) => verbKind(v).irregular).length}
          </button>
        </div>

        <PrimaryButton label="Commencer →" onClick={start} />
      </main>
    );
  }

  // ── Cards: the round's verbs, French first ──────────────────────────────
  if (phase === 'cards') {
    const roundTenses = TENSES.filter((t) => tenses.includes(t));
    return (
      <RoundCards verbs={round.map((q) => byId.get(q.wordId)!)} title="Conjugaison"
        back={(v) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-bold text-ink">{stripPrep(v.lemma)}</p>
                <p className="text-sm text-muted">{v.forms}</p>
              </div>
              <SpeakButton text={stripPrep(v.lemma)} />
            </div>
            <ConjugationTable table={conjugate(v)!} tenses={roundTenses} />
          </>
        )}
        onDone={() => setPhase('quiz')} onBack={() => setPhase('setup')} />
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (index >= round.length) {
    const score = round.length - mistakes.length;
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
              {mistakes.map((m) => {
                const v = byId.get(m.wordId)!;
                return (
                  <li key={`${m.wordId}-${m.tense}-${m.person}`} className="p-3 rounded-xl border border-border bg-card">
                    <p className="text-sm text-muted">{v.fr} · {TENSE_LABELS[m.tense]}</p>
                    <p className="font-bold text-ink">{withPerson(m.person, m.answer)}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="flex flex-col gap-3 mt-8">
          <PrimaryButton label="Encore un tour" onClick={start} />
          <PrimaryButton label="Changer les réglages" variant="secondary" onClick={() => setPhase('setup')} />
        </div>
      </main>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const q = round[index];
  const verb = byId.get(q.wordId)!;
  const answered = selected !== null;
  const correct = selected === q.answer;

  const choose = (option: string) => {
    if (answered) return;
    setSelected(option);
    recordAnswer(DRILL, profile, verb.id, option === q.answer);
    if (option !== q.answer) setMistakes((m) => [...m, q]);
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
      <GermanHeader kicker="Conjugaison" title={`${index + 1} / ${round.length}`} back="/de/verbs" />

      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${(index / round.length) * 100}%` }} />
      </div>

      {/* French meaning first, then the verb, tense and person */}
      <div className="flex flex-col items-center text-center gap-2 py-6">
        <p className="text-muted text-base">{verb.fr}</p>
        <p className="text-2xl font-bold text-ink">{stripPrep(verb.lemma)}</p>
        <span className="text-xs font-semibold px-3 py-1 rounded-full text-accent bg-error-bg">{TENSE_LABELS[q.tense]}</span>
        <p className="text-3xl font-bold text-ink mt-2">{PERSONS[q.person]} <span className="text-muted">___</span></p>
      </div>

      <div className="flex flex-col gap-3">
        {q.options.map((option) => (
          <OptionButton key={option} label={option} state={optionState(option)} onClick={() => choose(option)} />
        ))}
      </div>

      {answered && (
        <div className="mt-6 flex items-center justify-center gap-3 animate-fade-in">
          <p className={`text-center font-semibold ${correct ? 'text-success' : 'text-error'}`}>
            {correct ? 'Richtig !' : `Réponse : ${withPerson(q.person, q.answer)}`}
          </p>
          <SpeakButton text={withPerson(q.person, q.answer)} />
        </div>
      )}

      <div className="mt-auto pt-6">
        <PrimaryButton label={index === round.length - 1 ? 'Terminer' : 'Suivant'} onClick={next}
          variant={answered ? 'primary' : 'secondary'} disabled={!answered} />
      </div>
    </main>
  );
}
