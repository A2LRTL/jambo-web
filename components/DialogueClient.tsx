'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Dialogue, DialogueLine } from '@/lib/dialogue';
import { shuffle } from '@/lib/utils';

/** Lines the user must reconstruct (every other line, speaker b) */
function quizLines(lines: DialogueLine[]): Set<string> {
  return new Set(lines.filter((l) => l.speaker === 'b').map((l) => l.id));
}

// ── sub-components ────────────────────────────────────────────────────────────

function Bubble({
  line,
  speakerA,
  speakerB,
  revealed,
  isNew = false,
}: {
  line: DialogueLine;
  speakerA: string;
  speakerB: string;
  revealed: boolean;
  isNew?: boolean;
}) {
  const isA = line.speaker === 'a';
  return (
    <div className={`flex flex-col gap-0.5 ${isA ? 'items-start' : 'items-end'} ${isNew ? 'animate-fade-in' : ''}`}>
      <span className="text-[11px] font-semibold text-muted px-1">
        {isA ? speakerA : speakerB}
      </span>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
          revealed ? 'opacity-100' : 'opacity-0'
        } ${
          isA
            ? 'bg-card border border-border rounded-tl-sm'
            : 'bg-accent text-white rounded-tr-sm'
        }`}
      >
        <p className={`font-semibold text-base leading-snug ${isA ? 'text-ink' : 'text-white'}`}>
          {line.kirundi}
        </p>
        <p className={`text-xs mt-1 leading-snug ${isA ? 'text-muted' : 'text-white/70'}`}>
          {line.translation}
        </p>
      </div>
    </div>
  );
}

// ── Phase 1: Read-through ─────────────────────────────────────────────────────

function ReadPhase({
  dialogue,
  onDone,
}: {
  dialogue: Dialogue;
  onDone: () => void;
}) {
  const [revealed, setRevealed] = useState(0); // how many lines shown
  const bottomRef = useRef<HTMLDivElement>(null);

  const advance = useCallback(() => {
    if (revealed < dialogue.lines.length) {
      setRevealed((n) => n + 1);
    } else {
      onDone();
    }
  }, [revealed, dialogue.lines.length, onDone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [revealed]);

  const done = revealed >= dialogue.lines.length;

  return (
    <main className="max-w-md mx-auto flex flex-col min-h-dvh">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 border-b border-border bg-cream sticky top-0 z-10">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-0.5">Dialogue</p>
        <h1 className="text-lg font-bold text-ink">{dialogue.title}</h1>
        <p className="text-xs text-muted mt-0.5">
          {dialogue.speakerA} &amp; {dialogue.speakerB}
        </p>
      </div>

      {/* Bubbles */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto pb-28">
        {dialogue.lines.slice(0, revealed).map((line, i) => (
          <Bubble
            key={line.id}
            line={line}
            speakerA={dialogue.speakerA}
            speakerB={dialogue.speakerB}
            revealed={true}
            isNew={i === revealed - 1}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-cream via-cream/95 to-transparent">
        <div className="max-w-md mx-auto">
          {!done ? (
            <button
              type="button"
              onClick={advance}
              className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md"
            >
              {revealed === 0 ? 'Commencer →' : 'Suite →'}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onDone}
                className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md"
              >
                S&apos;entraîner 💪
              </button>
              <button
                type="button"
                onClick={() => setRevealed(0)}
                className="w-full py-3 rounded-2xl border border-border bg-card text-ink text-sm font-semibold hover:border-accent transition-all"
              >
                Relire depuis le début
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ── Phase 2: Training ─────────────────────────────────────────────────────────

interface TrainState {
  lineIndex: number;   // which quiz line we're on
  placed: string[];    // words placed so far
  wordBank: string[];  // shuffled pool
  result: 'idle' | 'correct' | 'wrong';
  showAnswer: boolean;
  score: number;
  done: boolean;
}

function buildWordBank(kirundi: string, allLines: DialogueLine[]): string[] {
  const solution = kirundi.split(/\s+/).filter(Boolean);
  // Decoys: words from other lines not in solution
  const pool = allLines
    .flatMap((l) => l.kirundi.split(/\s+/).filter(Boolean))
    .filter((w) => !solution.includes(w));
  const unique = [...new Set(pool)];
  const decoys: string[] = [];
  const used = new Set<string>();
  for (const w of shuffle(unique)) {
    if (!used.has(w) && decoys.length < Math.max(3, 6 - solution.length)) {
      decoys.push(w);
      used.add(w);
    }
  }
  return shuffle([...solution, ...decoys]);
}

function TrainPhase({
  dialogue,
  onRestart,
  onHome,
}: {
  dialogue: Dialogue;
  onRestart: () => void;
  onHome: () => void;
}) {
  const toQuiz = dialogue.lines.filter((l) => quizLines(dialogue.lines).has(l.id));
  const bottomRef = useRef<HTMLDivElement>(null);

  const initial = useCallback((): TrainState => ({
    lineIndex: 0,
    placed: [],
    wordBank: toQuiz.length > 0 ? buildWordBank(toQuiz[0].kirundi, dialogue.lines) : [],
    result: 'idle',
    showAnswer: false,
    score: 0,
    done: false,
  }), [dialogue, toQuiz]);

  const [state, setState] = useState<TrainState>(initial);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.lineIndex, state.result]);

  const currentLine = toQuiz[state.lineIndex];

  const placeWord = (word: string) => {
    if (state.result !== 'idle') return;
    setState((s) => {
      // Remove only the first occurrence of `word` from the word bank — O(n)
      let removed = false;
      const wordBank = s.wordBank.filter((w) => {
        if (!removed && w === word) { removed = true; return false; }
        return true;
      });
      return { ...s, placed: [...s.placed, word], wordBank };
    });
  };

  const removeWord = (idx: number) => {
    if (state.result !== 'idle') return;
    const word = state.placed[idx];
    setState((s) => ({
      ...s,
      placed: s.placed.filter((_, i) => i !== idx),
      wordBank: shuffle([...s.wordBank, word]),
    }));
  };

  const verify = () => {
    if (!currentLine) return;
    const solution = currentLine.kirundi.split(/\s+/).filter(Boolean);
    const correct = state.placed.join(' ') === solution.join(' ');
    setState((s) => ({ ...s, result: correct ? 'correct' : 'wrong', score: correct ? s.score + 1 : s.score }));
  };

  const next = () => {
    const nextIndex = state.lineIndex + 1;
    if (nextIndex >= toQuiz.length) {
      setState((s) => ({ ...s, done: true }));
    } else {
      setState((s) => ({
        ...s,
        lineIndex: nextIndex,
        placed: [],
        wordBank: buildWordBank(toQuiz[nextIndex].kirundi, dialogue.lines),
        result: 'idle',
        showAnswer: false,
      }));
    }
  };

  if (state.done) {
    const pct = Math.round((state.score / toQuiz.length) * 100);
    return (
      <main className="max-w-md mx-auto flex flex-col items-center justify-center min-h-dvh px-6 text-center gap-6">
        <div className="text-6xl">{pct === 100 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <div>
          <p className="text-4xl font-bold text-accent">{state.score}/{toQuiz.length}</p>
          <p className="text-muted text-base mt-1">{pct}% correct</p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button type="button" onClick={onRestart}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all">
            Relire le dialogue
          </button>
          <button type="button" onClick={() => setState(initial())}
            className="w-full py-3 rounded-2xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
            Réessayer l&apos;entraînement
          </button>
          <button type="button" onClick={onHome}
            className="w-full py-3 text-muted text-sm font-medium hover:text-ink transition-colors">
            Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  if (!currentLine) return null;
  const solution = currentLine.kirundi.split(/\s+/).filter(Boolean);

  // The "context" lines before this quiz line (the read-only bubbles)
  const contextLine = dialogue.lines.find((l) => l.order === currentLine.order - 1);

  return (
    <main className="max-w-md mx-auto flex flex-col min-h-dvh">
      {/* Header */}
      <div className="px-5 pt-8 pb-3 border-b border-border bg-cream sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Entraînement</p>
            <p className="text-sm font-bold text-ink mt-0.5">{dialogue.title}</p>
          </div>
          <span className="text-sm font-bold text-accent">{state.lineIndex + 1}/{toQuiz.length}</span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${((state.lineIndex) / toQuiz.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-5 overflow-y-auto pb-64">
        {/* Context bubble */}
        {contextLine && (
          <Bubble
            line={contextLine}
            speakerA={dialogue.speakerA}
            speakerB={dialogue.speakerB}
            revealed={true}
          />
        )}

        {/* Translation prompt */}
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[11px] font-semibold text-muted px-1">{dialogue.speakerB}</span>
          <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm border-2 border-dashed border-accent/40 bg-accent/5">
            <p className="text-xs text-muted font-medium">À traduire :</p>
            <p className="font-semibold text-ink text-base leading-snug mt-0.5">
              {currentLine.translation}
            </p>
          </div>
        </div>

        {/* Answer zone */}
        <div
          className={`min-h-[56px] rounded-2xl border-2 px-4 py-3 flex flex-wrap gap-2 items-center transition-colors ${
            state.result === 'correct'
              ? 'border-success bg-success-bg'
              : state.result === 'wrong'
              ? 'border-error bg-error-bg'
              : 'border-border bg-card'
          }`}
        >
          {state.placed.length === 0 && state.result === 'idle' && (
            <p className="text-muted text-sm">Tap les mots dans l&apos;ordre…</p>
          )}
          {state.placed.map((w, i) => (
            <button
              key={i}
              type="button"
              onClick={() => removeWord(i)}
              className="px-3 py-1.5 rounded-xl bg-accent text-white text-sm font-semibold shadow-sm active:scale-[0.95] transition-all"
            >
              {w}
            </button>
          ))}
          {state.result === 'correct' && (
            <span className="text-success font-bold text-sm ml-auto">✓ Correct !</span>
          )}
          {state.result === 'wrong' && state.showAnswer && (
            <p className="text-xs text-muted mt-1 w-full">
              Réponse : <span className="font-semibold text-ink">{currentLine.kirundi}</span>
            </p>
          )}
        </div>

        {/* Word bank */}
        {state.result === 'idle' && (
          <div className="flex flex-wrap gap-2">
            {state.wordBank.map((w, i) => (
              <button
                key={i}
                type="button"
                onClick={() => placeWord(w)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-ink text-sm font-semibold hover:border-accent active:scale-[0.95] transition-all shadow-sm"
              >
                {w}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-cream via-cream/95 to-transparent">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          {state.result === 'idle' ? (
            <>
              <button
                type="button"
                onClick={verify}
                disabled={state.placed.length === 0}
                className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base disabled:opacity-40 hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md"
              >
                Vérifier →
              </button>
              <button
                type="button"
                onClick={() => setState((s) => ({ ...s, showAnswer: true, result: 'wrong' }))}
                className="text-muted text-xs font-medium text-center hover:text-ink transition-colors"
              >
                Voir la réponse
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (state.result === 'wrong' && !state.showAnswer) {
                  setState((s) => ({ ...s, showAnswer: true }));
                } else {
                  next();
                }
              }}
              className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md"
            >
              {state.lineIndex + 1 < toQuiz.length ? 'Suivant →' : 'Terminer →'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Phase = 'read' | 'train';

export default function DialogueClient({ dialogue }: { dialogue: Dialogue }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('read');

  if (phase === 'read') {
    return <ReadPhase dialogue={dialogue} onDone={() => setPhase('train')} />;
  }

  return (
    <TrainPhase
      dialogue={dialogue}
      onRestart={() => setPhase('read')}
      onHome={() => router.push('/')}
    />
  );
}
