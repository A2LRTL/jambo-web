import Link from 'next/link';

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ score?: string; total?: string }>;
}) {
  const { score: rawScore, total: rawTotal } = await searchParams;
  const score = parseInt(rawScore ?? '0', 10);
  const total = parseInt(rawTotal ?? '5', 10);
  const isPerfect = score === total;

  return (
    <main className="flex flex-col min-h-dvh px-6 pb-10 pt-16 max-w-md mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <span className="text-7xl">{isPerfect ? '🎉' : '👏'}</span>
        <h1 className="text-4xl font-bold text-accent">Bravo !</h1>
        <p className="text-6xl font-bold text-ink">
          {score} <span className="text-muted text-4xl">/ {total}</span>
        </p>
        <p className="text-muted text-lg">
          {isPerfect ? 'Sans faute, beau travail.' : 'Tu progresses, continue.'}
        </p>
      </div>
      <Link
        href="/"
        className="w-full py-4 px-6 rounded-xl bg-accent text-white font-semibold text-lg text-center shadow-sm transition-all active:scale-[0.98] hover:bg-accent-dark"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
