'use client';

export default function OfflinePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-dvh px-8 text-center gap-4">
      <span className="text-6xl">📴</span>
      <h1 className="text-2xl font-bold text-ink">Pas de connexion</h1>
      <p className="text-muted text-base max-w-xs">
        Tu es hors-ligne. Les leçons déjà visitées fonctionnent quand même — tes scores seront synchronisés à la reconnexion.
      </p>
      <button
        type="button"
        onClick={() => window.location.href = '/'}
        className="mt-4 px-6 py-3 rounded-2xl bg-accent text-white font-semibold hover:bg-accent-dark transition-all"
      >
        Retour à l&apos;accueil
      </button>
    </main>
  );
}
