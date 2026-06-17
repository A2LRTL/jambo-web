'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VocabItem } from '@/lib/exercises';
import { saveReport } from '@/lib/reports';
import {
  buildQueue,
  isLeech,
  loadStore,
  resetStore,
  review,
  saveCard,
  type Grade,
  type QueuedCard,
  type SrsStore,
} from '@/lib/srs';

export type FlashcardItem = VocabItem & { lessonId: string };

interface Props {
  title: string;
  items: FlashcardItem[];
  /** 'learn' (default): single lesson, new + due cards, quiz CTAs.
   *  'review': due cards only, possibly across several lessons. */
  mode?: 'learn' | 'review';
  /** Single-lesson context — enables quiz CTAs, reset and back-to-lesson. */
  lessonId?: string;
}

// How many cards to wait before a "À revoir" card comes back in the session.
const RELEARN_GAP = 3;

const fmtInterval = (days: number) => (days <= 0 ? 'bientôt' : days === 1 ? '1j' : `${days}j`);
const labelFor = (lessonId: string) => (lessonId.startsWith('swahili-') ? 'Kiswahili' : 'Kirundi');

export default function FlashcardClient({ title, items, mode = 'learn', lessonId }: Props) {
  const router = useRouter();
  const isReview = mode === 'review';

  const [queue, setQueue]   = useState<QueuedCard<FlashcardItem>[]>([]);
  const [cursor, setCursor] = useState(0);
  const [total, setTotal]   = useState(0);              // cards to learn this session
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [ready, setReady]   = useState(false);

  const [flipped, setFlipped] = useState(false);
  const [fading, setFading]   = useState(false);
  const [showExampleTerm, setShowExampleTerm] = useState(false);
  const [reportState, setReportState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const current = queue[cursor];
  const card = current?.item;
  const termLabel = card ? labelFor(card.lessonId) : 'Kiswahili';
  const leech = isLeech(current?.card);
  const done = ready && total > 0 && learned.size >= total;
  const caughtUp = ready && total === 0;

  // ── Build the session from the spaced-repetition store(s) ────────────────────
  const startSession = (includeFuture = false) => {
    const stores: Record<string, SrsStore> = {};
    for (const id of new Set(items.map((i) => i.lessonId))) stores[id] = loadStore(id);
    const getCard = (item: FlashcardItem) => stores[item.lessonId]?.[item.term];

    const q = buildQueue(items, getCard, {
      includeFuture,
      includeNew: !isReview,
      interleaveBy: (item) => item.lessonId, // spread categories in a combined review
    });
    setQueue(q);
    setTotal(q.length);
    setCursor(0);
    setLearned(new Set());
    setFlipped(false);
    setShowExampleTerm(false);
    setReady(true);
  };

  useEffect(() => {
    // Reads spaced-repetition state from localStorage (client-only) on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startSession(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transition = (action: () => void) => {
    setFading(true);
    setTimeout(() => { action(); setFading(false); }, 150);
  };

  const flip = () => transition(() => { setFlipped((f) => !f); setShowExampleTerm(false); });

  // ── Grade the current card and schedule the next review ─────────────────────
  const grade = (g: Grade) => {
    if (!current) return;
    const { term, lessonId: srcId } = current.item;
    const updated = review(current.card, g, Date.now());
    saveCard(srcId, term, updated);

    transition(() => {
      if (g === 'again') {
        // Reinsert a few cards later so it resurfaces this session.
        setQueue((prev) => {
          const copy = [...prev];
          const insertAt = Math.min(cursor + 1 + RELEARN_GAP, copy.length);
          copy.splice(insertAt, 0, { item: current.item, card: updated, status: 'due' });
          return copy;
        });
      } else {
        setLearned((prev) => {
          const nextSet = new Set(prev);
          nextSet.add(`${srcId}:${term}`);
          return nextSet;
        });
      }
      setCursor((c) => c + 1);
      setFlipped(false);
      setShowExampleTerm(false);
      setReportState('idle');
    });
  };

  // Next-interval previews shown on the grading buttons.
  const previews = useMemo(() => {
    if (!current) return null;
    return {
      again: review(current.card, 'again').interval,
      good:  review(current.card, 'good').interval,
      easy:  review(current.card, 'easy').interval,
    };
  }, [current]);

  const whatsappHref = card
    ? `https://wa.me/33611764746?text=${encodeURIComponent(
        `J'ai une question sur ce mot : ${card.term}, est-ce qu'il veut bien dire ${card.translation} ?`,
      )}`
    : '#';

  const handleReport = async () => {
    if (reportState !== 'idle' || !card) return;
    setReportState('saving');
    try {
      await saveReport(card.term, card.translation, card.lessonId);
      setReportState('done');
    } catch {
      setReportState('error');
    }
  };

  const goQuiz    = () => lessonId && router.push(`/lesson/${lessonId}/quiz`);
  const goReverse = () => lessonId && router.push(`/lesson/${lessonId}/quiz?mode=reverse`);
  const goBack    = () => router.push(lessonId ? `/lesson/${lessonId}` : '/');

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center max-w-md mx-auto px-6">
        <p className="text-muted text-sm">Chargement…</p>
      </main>
    );
  }

  // ── Session complete / nothing due ──────────────────────────────────────────
  if (done || caughtUp || !card) {
    return (
      <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={goBack}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none">
            ←
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted uppercase tracking-wider">{isReview ? 'Révision' : 'Flashcards'}</p>
            <p className="font-bold text-ink">{title}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-5xl">{caughtUp ? '🌱' : '🎉'}</p>
          <p className="text-lg font-bold text-ink">
            {caughtUp ? 'Rien à réviser pour le moment !' : 'Session terminée !'}
          </p>
          <p className="text-sm text-muted max-w-xs">
            {caughtUp
              ? 'Tes cartes sont programmées pour plus tard. Reviens plus tard ou révise quand même.'
              : `Bravo, tu as revu ${total} carte${total > 1 ? 's' : ''}.`}
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          {isReview ? (
            <>
              <button type="button" onClick={goBack}
                className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md">
                Retour à l&apos;accueil
              </button>
              <button type="button" onClick={() => startSession(true)}
                className="w-full py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
                Tout revoir 🔁
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={goQuiz}
                className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md">
                Commencer le Quiz →
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={goReverse}
                  className="flex-1 py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
                  Quiz inversé ⇄
                </button>
                <button type="button" onClick={() => startSession(true)}
                  className="flex-1 py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
                  Tout revoir 🔁
                </button>
              </div>
              {lessonId && (
                <button type="button" onClick={() => { resetStore(lessonId); startSession(false); }}
                  className="text-center text-xs text-muted hover:text-error transition-colors mt-1">
                  Réinitialiser la progression
                </button>
              )}
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={goBack}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none">
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider">{isReview ? 'Révision' : 'Flashcards'}</p>
          <p className="font-bold text-ink">{title}</p>
        </div>
        <p className="text-sm text-muted font-medium">{learned.size} / {total}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${total ? (learned.size / total) * 100 : 0}%` }}
        />
      </div>

      {/* New / review / leech badge */}
      <p className="text-center text-xs font-semibold -mt-3 mb-5">
        {leech
          ? <span className="text-error">🆘 Mot difficile — demande de l&apos;aide</span>
          : current.status === 'new'
            ? <span className="text-success">✦ Nouvelle carte</span>
            : <span className="text-accent">↻ À réviser</span>}
      </p>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <button type="button" onClick={flip}
          className={`w-full rounded-3xl bg-card border-2 border-border shadow-md flex flex-col items-center justify-center gap-3 py-16 px-8 transition-opacity duration-150 ${fading ? 'opacity-0' : 'opacity-100'}`}
        >
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            {flipped ? 'Traduction' : termLabel}
          </p>
          <p className="text-4xl font-bold text-ink text-center leading-snug">
            {flipped ? card.translation : card.term}
          </p>
          {!flipped && (
            <p className="text-xs text-muted mt-2">Appuie pour voir la traduction</p>
          )}
          {flipped && (
            <p className="text-xs text-accent font-semibold mt-2">{card.term}</p>
          )}
          {flipped && card.example && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-cream border border-border text-left w-full">
              {card.exampleFr && (
                <p className="text-sm text-ink">{card.exampleFr}</p>
              )}
              {showExampleTerm ? (
                <p className={`text-sm text-accent font-medium italic ${card.exampleFr ? 'mt-2' : ''}`}>
                  {card.example}
                </p>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setShowExampleTerm(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowExampleTerm(true);
                    }
                  }}
                  className={`inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-dark transition-colors ${card.exampleFr ? 'mt-2' : ''}`}
                >
                  👁️ Voir en {termLabel}
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Grading (after flip) or reveal hint */}
      <div className="mt-8">
        {flipped && previews ? (
          <div>
            <p className="text-center text-xs text-muted mb-3">Évalue ta réponse</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => grade('again')}
                className="flex-1 py-4 rounded-xl border-2 border-error/40 bg-card text-error font-bold text-sm hover:bg-error/10 active:scale-[0.98] transition-all flex flex-col items-center gap-0.5">
                À revoir
                <span className="text-[10px] font-medium opacity-70">{fmtInterval(previews.again)}</span>
              </button>
              <button type="button" onClick={() => grade('good')}
                className="flex-1 py-4 rounded-xl border-2 border-accent/40 bg-card text-accent font-bold text-sm hover:bg-accent/10 active:scale-[0.98] transition-all flex flex-col items-center gap-0.5">
                Bien
                <span className="text-[10px] font-medium opacity-70">{fmtInterval(previews.good)}</span>
              </button>
              <button type="button" onClick={() => grade('easy')}
                className="flex-1 py-4 rounded-xl border-2 border-success/40 bg-card text-success font-bold text-sm hover:bg-success/10 active:scale-[0.98] transition-all flex flex-col items-center gap-0.5">
                Facile
                <span className="text-[10px] font-medium opacity-70">{fmtInterval(previews.easy)}</span>
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={flip}
            className="w-full py-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark transition-all active:scale-[0.98]">
            Retourner la carte
          </button>
        )}
      </div>

      {/* Save & leave */}
      <button type="button" onClick={goBack}
        className="mt-4 w-full py-3 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent active:scale-[0.98] transition-all">
        💾 Sauvegarder et quitter
      </button>

      {/* Card action buttons */}
      <div className="flex gap-2 mt-4">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
            leech
              ? 'border-success bg-success-bg text-success font-semibold'
              : 'border-border text-muted hover:text-success hover:border-success'
          }`}
        >
          <span>💬</span>
          Demander à maman
        </a>
        <button
          type="button"
          onClick={handleReport}
          disabled={reportState !== 'idle'}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-xs font-medium text-muted hover:text-error hover:border-error transition-colors disabled:opacity-60"
        >
          {reportState === 'idle'   && <><span>⚠️</span> Signaler</>}
          {reportState === 'saving' && <><span>⏳</span> Envoi…</>}
          {reportState === 'done'   && <><span>✓</span> Signalé</>}
          {reportState === 'error'  && <><span>✕</span> Erreur</>}
        </button>
      </div>
    </main>
  );
}
