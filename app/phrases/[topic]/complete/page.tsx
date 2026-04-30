import Link from 'next/link';
import { PHRASE_TOPIC_LABELS } from '@/lib/phrase-registry';
import ScoreSaver from '@/components/ScoreSaver';

function getMessage(score: number, total: number): string {
  const pct = score / total;
  if (pct === 1) return 'Sans faute, beau travail !';
  if (pct >= 0.8) return 'Excellent, encore un effort !';
  if (pct >= 0.6) return 'Bien joué, continue comme ça.';
  return 'Continue, tu progresses !';
}

export default async function PhraseCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ score?: string; total?: string }>;
}) {
  const { topic } = await params;
  const { score: rawScore, total: rawTotal } = await searchParams;

  const score = parseInt(rawScore ?? '0', 10);
  const total = parseInt(rawTotal ?? '0', 10);
  const isPerfect = score === total;
  const title = PHRASE_TOPIC_LABELS[topic] ?? topic;

  return (
    <main className="flex flex-col min-h-dvh px-6 pb-10 pt-16 max-w-md mx-auto">
      <ScoreSaver lessonId={`phrases/${topic}`} score={score} total={total} />
      <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
        <span className="text-7xl">{isPerfect ? '🎉' : score >= total * 0.6 ? '👏' : '💪'}</span>
        <div>
          <h1 className="text-4xl font-bold text-accent mb-1">Bravo !</h1>
          <p className="text-muted text-sm">{title}</p>
        </div>
        <p className="text-6xl font-bold text-ink">
          {score} <span className="text-muted text-4xl">/ {total}</span>
        </p>
        <p className="text-muted text-lg">{getMessage(score, total)}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={`/phrases/${topic}`}
          className="w-full py-4 px-6 rounded-xl bg-card border border-border text-ink font-semibold text-lg text-center shadow-sm transition-all active:scale-[0.98] hover:border-accent"
        >
          Rejouer
        </Link>
        <Link
          href="/"
          className="w-full py-4 px-6 rounded-xl bg-accent text-white font-semibold text-lg text-center shadow-sm transition-all active:scale-[0.98] hover:bg-accent-dark"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
