'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VocabItem } from '@/lib/exercises';
import { saveReport } from '@/lib/reports';

interface Props {
  lessonId: string;
  title: string;
  items: VocabItem[];
}

export default function FlashcardClient({ lessonId, title, items }: Props) {
  const router = useRouter();
  const [index, setIndex]     = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [fading, setFading]   = useState(false);
  const [showExampleTerm, setShowExampleTerm] = useState(false);
  const [resumed, setResumed] = useState<number | null>(null);
  const [reportState, setReportState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const card = items[index];
  const isLast = index === items.length - 1;
  const isSwahili = lessonId.startsWith('swahili-');
  const termLabel = isSwahili ? 'Kiswahili' : 'Kirundi';

  // ── Saved position (resume where you left off) ──────────────────────────────
  const posKey = `jambo_fc_pos_${lessonId}`;

  // Restore saved card on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(posKey);
      const saved = raw ? parseInt(raw, 10) : 0;
      if (Number.isInteger(saved) && saved > 0 && saved < items.length) {
        setIndex(saved);
        setResumed(saved);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist position; clear it once the deck is finished or back at the start
  const savePos = (i: number) => {
    try {
      if (i <= 0 || i >= items.length - 1) localStorage.removeItem(posKey);
      else localStorage.setItem(posKey, String(i));
    } catch { /* ignore */ }
  };

  const transition = (action: () => void) => {
    setFading(true);
    setTimeout(() => { action(); setFading(false); }, 150);
  };

  useEffect(() => { setReportState('idle'); }, [index]);

  const goTo = (i: number) => transition(() => {
    savePos(i);
    setIndex(i);
    setFlipped(false);
    setShowExampleTerm(false);
  });

  const flip = () => transition(() => { setFlipped((f) => !f); setShowExampleTerm(false); });
  const prev = () => goTo(index - 1);
  const next = () => goTo(index + 1);

  const saveAndExit = () => { savePos(index); router.push(`/lesson/${lessonId}`); };

  const whatsappHref = `https://wa.me/33611764746?text=${encodeURIComponent(
    `J'ai une question sur ce mot : ${card.term}, est-ce qu'il veut bien dire ${card.translation} ?`,
  )}`;

  const handleReport = async () => {
    if (reportState !== 'idle') return;
    setReportState('saving');
    try {
      await saveReport(card.term, card.translation, lessonId);
      setReportState('done');
    } catch {
      setReportState('error');
    }
  };

  const goQuiz    = () => router.push(`/lesson/${lessonId}/quiz`);
  const goReverse = () => router.push(`/lesson/${lessonId}/quiz?mode=reverse`);
  const goBack    = () => router.push(`/lesson/${lessonId}`);

  return (
    <main className="flex flex-col min-h-dvh max-w-md mx-auto px-6 pb-10 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={goBack}
          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-border transition-colors text-xl leading-none">
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs text-muted uppercase tracking-wider">Flashcards</p>
          <p className="font-bold text-ink">{title}</p>
        </div>
        <p className="text-sm text-muted font-medium">{index + 1} / {items.length}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-border mb-6 overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* Resume note */}
      {resumed !== null && index === resumed && (
        <p className="text-center text-xs text-accent font-semibold -mt-3 mb-5">
          ↩︎ Reprise à la carte {resumed + 1}
        </p>
      )}

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

      {/* Navigation or Quiz CTA */}
      {isLast ? (
        <div className="flex flex-col gap-3 mt-8">
          <p className="text-center text-sm font-semibold text-success">
            ✓ Toutes les cartes vues !
          </p>
          <button type="button" onClick={goQuiz}
            className="w-full py-4 rounded-2xl bg-accent text-white font-bold text-base hover:bg-accent-dark active:scale-[0.98] transition-all shadow-md">
            Commencer le Quiz →
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={goReverse}
              className="flex-1 py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
              Quiz inversé ⇄
            </button>
            <button type="button" onClick={() => goTo(0)}
              className="flex-1 py-3 rounded-xl border border-border bg-card text-ink font-semibold text-sm hover:border-accent transition-all">
              Revoir 🔁
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3 mt-8">
          <button type="button" onClick={prev} disabled={index === 0}
            className="flex-1 py-4 rounded-xl border border-border bg-card font-semibold text-ink disabled:opacity-30 hover:border-accent transition-all active:scale-[0.98]">
            ← Précédent
          </button>
          <button type="button" onClick={next}
            className="flex-1 py-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent-dark transition-all active:scale-[0.98]">
            Suivant →
          </button>
        </div>
      )}

      {/* Save & leave */}
      {!isLast && (
        <button type="button" onClick={saveAndExit}
          className="mt-4 w-full py-3 rounded-xl border border-border bg-card text-sm font-semibold text-ink hover:border-accent active:scale-[0.98] transition-all">
          💾 Sauvegarder et quitter
        </button>
      )}

      {/* Skip to quiz (subtle) */}
      {!isLast && (
        <button type="button" onClick={goQuiz}
          className="mt-3 text-center text-xs text-muted hover:text-ink transition-colors">
          Passer les flashcards → Quiz direct
        </button>
      )}

      {/* Card action buttons */}
      <div className="flex gap-2 mt-4">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-xs font-medium text-muted hover:text-success hover:border-success transition-colors"
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
